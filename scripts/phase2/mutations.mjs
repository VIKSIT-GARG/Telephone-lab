import {readFileSync,writeFileSync}from'node:fs';import {compareKnownFact,digits}from'../../lib/checker.mjs';
export function injectMutation(value,type){
 const s=digits(value);
 if(type==='phone')return s.replace(/\d(?=\D*$)/,d=>String((Number(d)+1)%10));
 if(type==='time'||type==='numbers')return s.replace(/\d+/,n=>String(Number(n)+1));
 if(type==='negation')return s.replace(/\b(?:not|never)\s*/i,'').replace(/मत\s*|नहीं\s*/,'');
 if(type==='qualifiers')return s.replace(/per (person|family|hour)|प्रति (व्यक्ति|परिवार|घंटे)/i,'').trim();
 if(type==='conditions')return s.replace(/^if[^,]*,\s*/i,'').replace(/\bonly if\b.*$/i,'').replace(/\bunless\b.*$/i,'').trim();
 if(type==='certainty')return s.replace(/\b(will|should)\b/i,'might').replace(/हो सकता/,'होगा');
 if(type==='ordering')return s.replace(/\bbefore\b/i,'after').replace(/(.*?)\bthen\b(.*)/i,'$2 then $1').trim();
 if(type==='places')return s+' market';return null;
}
const data=JSON.parse(readFileSync('tests/gold/cases.json','utf8'));const by_type={};let skipped=0;
for(const c of data.cases.filter(c=>c.expected!=='preserved'&&c.fact.value)){const m=injectMutation(c.correct,c.type);if(m===null||m===c.correct){skipped++;continue;}const s=by_type[c.type]??={injected:0,flagged:0,control_flags:0,controls:0};s.injected++;s.flagged+=Number(compareKnownFact(c.fact,m).status!=='preserved');s.controls++;s.control_flags+=Number(compareKnownFact(c.fact,c.correct).status!=='preserved');}
for(const s of Object.values(by_type)){s.recall=s.flagged/s.injected;s.precision=s.flagged/(s.flagged+s.control_flags);}
const r={mode:'synthetic-engineering-mutations',headline_eligible:false,human_reviewed:false,skipped_unhandled:skipped,by_type};writeFileSync('public/evidence/mutations.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r));
