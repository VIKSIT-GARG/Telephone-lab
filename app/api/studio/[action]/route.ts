import {readLimitedJSON} from '@/lib/http.mjs';
import {env} from 'cloudflare:workers';
import {analyzeMessage,createSarvam,translateMessage,StudioError,LANGUAGES} from '@/lib/studio.mjs';
import {independentJudge} from '@/lib/independent.mjs';
import {reserveBucket,reserveCall,settleCall,quotaStatus} from '@/lib/quotas.mjs';
import {validateReview,calibration,hashText} from '@/lib/reviews.mjs';
export const dynamic='force-dynamic';
let active=0;
const security={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
function result(body:unknown,status=200){return Response.json(body,{status,headers:security});}
const owner=(r:Request)=>r.headers.get('oai-authenticated-user-id')||'private-service';
async function evidence(who:string){if(!env.DB)return {records:[],calibration:calibration([])};await env.DB.prepare('DELETE FROM review_records WHERE owner=?1 AND expires<=?2').bind(who,Date.now()).run();await env.DB.prepare('DELETE FROM usage_buckets WHERE expires<=?1').bind(Date.now()).run();const rows=await env.DB.prepare('SELECT payload FROM review_records WHERE owner=?1 AND expires>?2').bind(who,Date.now()).all<{payload:string}>();const records=rows.results.map(r=>JSON.parse(r.payload));return {records,calibration:calibration(records)};}
export async function GET(request:Request,{params}:{params:Promise<{action:string}>}){
 const {action}=await params;
 if(action==='status'){
  const quota=await quotaStatus(env.DB,env).catch(()=>({available:false,blocked:true,reason:'Durable quota storage unavailable'}));
  return result({live_enabled:Boolean(env.SARVAM_API_KEY)&&quota.available&&!quota.blocked,provider:'Sarvam',model:env.SARVAM_MODEL||'sarvam-105b',mode:'live',quota,independent_judge:{enabled:env.INDEPENDENT_JUDGE_ENABLED==='true',model:env.INDEPENDENT_JUDGE_MODEL||'gemma4'}});
 }
 if(action==='reviews')return result(await evidence(owner(request)));
 if(action==='validation'){const e=await evidence(owner(request));return result({languages:LANGUAGES.map(language=>{const r=e.records.filter((x:any)=>x.language===language);return {language,status:r.length?'human-reviewed':'unreviewed',reviewers:new Set(r.map((x:any)=>x.reviewer_id)).size,cases:new Set(r.map((x:any)=>x.case_id)).size,self_declared:true};}),calibration:e.calibration});}
 return result({error:'Not found'},404);
}
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
 const {action}=await params;if(!['analyze','translate','review-import','delete-data'].includes(action))return result({error:'Not found'},404);
 const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return result({error:'Cross-origin requests are not allowed.',code:'origin'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return result({error:'Use application/json.',code:'content_type'},415);
 let body:any;try{body=await readLimitedJSON(request);}catch(e:any){return result({error:e.message,code:e.code},e.status||400);}
 const who=owner(request);const providerOperation=['analyze','translate'].includes(action);if(providerOperation){if(active>=4)return result({error:'Server is busy. Please retry shortly.',code:'concurrency'},409);active++;}
 try{
  if(!env.DB)return result({error:'Durable quota storage is unavailable. Live requests are blocked.',code:'quota_storage'},503);
  await reserveBucket(env.DB,`rate:${who}:${Math.floor(Date.now()/600000)}`,1,Number(env.PER_USER_WINDOW_REQUESTS||40),Date.now()+1200000);
  if(action==='delete-data'){await env.DB.prepare('DELETE FROM review_records WHERE owner=?1').bind(who).run();return result({deleted:true,message:'Your stored anonymous reviews were deleted. No raw studio messages are stored. Quota accounting remains until its short expiry.'});}
  if(action==='review-import'){
   if(!LANGUAGES.includes(body.language))return result({error:'Invalid review language.'},400);
   let r:any;try{r=await validateReview(body);}catch(e:any){return result({error:e.message,code:'review_input'},400);}const id=await hashText(who+':'+r.case_id+':'+r.reviewer_id);const retention=Math.max(1,Math.min(90,Number(env.REVIEW_RETENTION_DAYS||30)));
   await env.DB.prepare('INSERT INTO review_records (id,owner,reviewer,language,case_hash,payload,created,expires) VALUES (?1,?2,?3,?4,?5,?6,?7,?8) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,created=excluded.created,expires=excluded.expires').bind(id,who,r.reviewer_id,r.language,r.case_id,JSON.stringify(r),Date.now(),Date.now()+retention*86400000).run();return result({imported:true,calibration:(await evidence(who)).calibration});
  }
  if(typeof body.message!=='string'||!body.message.trim()||body.message.length>3000)return result({error:'Enter a message between 1 and 3,000 characters.',code:'input'},400);
  const options={logger:(event:unknown)=>console.info(JSON.stringify(event)),captureDebug:body.debug===true,beforeCall:(b:any)=>reserveCall(env.DB,who,b,env),afterCall:(r:any,b:any,u:any)=>settleCall(env.DB,r,b,u)};
  const client=createSarvam(env.SARVAM_API_KEY,env.SARVAM_MODEL||'sarvam-105b',fetch,options);
  if(action==='analyze')return result({mode:'live',model:client.model,...await analyzeMessage(client,body.message),logs:client.logs});
  const judge=env.INDEPENDENT_JUDGE_ENABLED==='true'?(m:any,f:any,r:any,l:any)=>independentJudge(createSarvam(env.SARVAM_API_KEY,env.INDEPENDENT_JUDGE_MODEL||'gemma4',fetch,options),m,f,r,l):undefined;
  const translated=await translateMessage(client,body.message,body.facts,body.language,{judge});
  const reviews=(await evidence(who)).records.filter((r:any)=>r.language===body.language);
  return result({...translated,human_review_evidence:{reviewers:new Set(reviews.map((r:any)=>r.reviewer_id)).size,cases:new Set(reviews.map((r:any)=>r.case_id)).size,self_declared:true},debug_included:body.debug===true});
 }catch(e:any){const message=e instanceof StudioError||e?.code==='quota'||e?.code==='quota_storage'?e.message:'The request could not complete. No fallback was used.';return result({mode:'live',error:message,code:e?.code||(/403/.test(message)?'provider_auth':/402|429/.test(message)?'provider_quota':/timed out/.test(message)?'timeout':/invalid|schema|JSON|truncated/.test(message)?'invalid_output':'upstream')},e?.status||502);}finally{if(providerOperation)active--;}
}
