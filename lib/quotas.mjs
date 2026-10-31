// Atomic conditional UPSERTs implement fail-closed durable quotas. Units are integers.
export const PRICES_INR_PER_MILLION={'sarvam-105b':{input:15,output:60},gemma4:{input:35,output:90}};
export function estimateReservation(body){const p=PRICES_INR_PER_MILLION[body.model];if(!p)throw Error('No verified price configured for this model.');const bytes=new TextEncoder().encode(JSON.stringify(body.messages)).length;return Math.ceil(bytes*p.input+body.max_tokens*p.output);}// micro-INR
export async function reserveBucket(db,key,amount,limit,expires){
 if(!db)throw Object.assign(Error('Durable quota storage is unavailable. Live requests are blocked.'),{status:503,code:'quota_storage'});
 if(!Number.isSafeInteger(amount)||amount<1||!Number.isSafeInteger(limit)||limit<amount)throw Object.assign(Error('Usage limit reached.'),{status:429,code:'quota'});
 const row=await db.prepare('INSERT INTO usage_buckets (key,used,expires) VALUES (?1,?2,?3) ON CONFLICT(key) DO UPDATE SET used=usage_buckets.used+excluded.used WHERE usage_buckets.used+excluded.used<=?4 RETURNING used').bind(key,amount,expires,limit).first();
 if(!row)throw Object.assign(Error(key.startsWith('spend:')?'Daily global spend limit reached. Wait for the next UTC day or raise the server-side cap.':key.startsWith('user:')?'Daily user call limit reached. Wait for the next UTC day.':'Request-window limit reached. Please wait before retrying.'),{status:429,code:'quota'});
 return row.used;
}
export async function reserveCall(db,who,body,config={}){
 const now=Date.now(),day=new Date(now).toISOString().slice(0,10),expires=now+172800000;
 const requestLimit=Number(config.PER_USER_DAILY_CALLS||120);await reserveBucket(db,`user:${who}:${day}`,1,requestLimit,expires);
 const amount=estimateReservation(body),cap=Math.round(Number(config.DAILY_SPEND_CAP_INR||25)*1e6);
 await reserveBucket(db,`spend:${day}`,amount,cap,expires);
 return {key:`spend:${day}`,amount};
}
export async function settleCall(db,reservation,body,usage){
 if(!reservation||!usage||!Number.isFinite(usage.prompt_tokens)||!Number.isFinite(usage.completion_tokens))return;
 const p=PRICES_INR_PER_MILLION[body.model];const actual=Math.ceil(usage.prompt_tokens*p.input+usage.completion_tokens*p.output);
 // Keep the reservation on invalid/over-budget usage, never refund more than reserved.
 if(actual>=0&&actual<=reservation.amount)await db.prepare('UPDATE usage_buckets SET used=MAX(0,used-?1) WHERE key=?2').bind(reservation.amount-actual,reservation.key).run();
}
export async function quotaStatus(db,config={}){
 const day=new Date().toISOString().slice(0,10),cap=Math.round(Number(config.DAILY_SPEND_CAP_INR||25)*1e6);if(!db)return {available:false,blocked:true,reason:'Durable quota storage unavailable'};
 const row=await db.prepare('SELECT used FROM usage_buckets WHERE key=?1').bind(`spend:${day}`).first();const used=row?.used||0;return {available:true,blocked:used>=cap,day,cap_inr:cap/1e6,reserved_or_spent_inr:used/1e6};
}
