import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {compareKnownFact} from '../../lib/checker.mjs';
import {numericConflict as oldNumeric} from '../../lib/studio_v1.mjs';
export function evaluateFixtures(data){
 const out={provenance:'assistant-authored, human-unreviewed engineering fixtures',headline_eligible:false,human_reviewed_cases:data.cases.filter(c=>c.authorship.human_review_status==='reviewed').length,total_cases:data.cases.length,target_recall:.95,by_type:{},details:[]};
 const old=(f,b)=>f.value===null?(b?'invented':'preserved'):!b?'dropped':oldNumeric(f.value,b,f.kind)?'altered':'preserved';
 for(const c of data.cases){const o=out.by_type[c.type]??={before:{tp:0,fp:0,fn:0,tn:0},after:{tp:0,fp:0,fn:0,tn:0},exact_after:0,n:0};o.n++;
  const expectedFlag=c.expected!=='preserved',v=compareKnownFact(c.fact,c.mutated).status;
  for(const [stage,status]of [['before',old(c.fact,c.mutated)],['after',v]]){const flag=status!=='preserved';o[stage][flag?(expectedFlag?'tp':'fp'):(expectedFlag?'fn':'tn')]++;}
  if(v===c.expected)o.exact_after++;
  // Each mutated source also gets its original unmutated control.
  if(expectedFlag){for(const [stage,status]of [['before',old(c.fact,c.correct)],['after',compareKnownFact(c.fact,c.correct).status]])o[stage][status!=='preserved'?'fp':'tn']++;}
  out.details.push({id:c.id,type:c.type,expected:c.expected,actual:v,review_status:c.authorship.human_review_status});
 }
 for(const o of Object.values(out.by_type))for(const stage of ['before','after']){const s=o[stage];s.recall=s.tp+s.fn?s.tp/(s.tp+s.fn):null;s.precision=s.tp+s.fp?s.tp/(s.tp+s.fp):null;}
 out.known_weaknesses=Object.entries(out.by_type).filter(([,o])=>o.after.recall===null||o.after.recall<out.target_recall||o.after.fp>0).map(([type,o])=>({type,recall:o.after.recall,false_alarms:o.after.fp}));
 return out;
}
if(process.argv[1]?.endsWith('checker-eval.mjs')){
 const r=evaluateFixtures(JSON.parse(readFileSync('tests/gold/cases.json','utf8')));mkdirSync('public/evidence',{recursive:true});writeFileSync('public/evidence/checker.json',JSON.stringify(r,null,2));
 const fmt=(x,n)=>x===null?'n/a':(100*x).toFixed(1)+`% (n=${n})`;
 const table=['| Type | Mutated examples | Before recall | Before precision | After recall | After precision | TP / FP / FN / TN after |','|---|---:|---:|---:|---:|---:|---|',...Object.entries(r.by_type).map(([k,o])=>`| ${k} | ${o.n} | ${fmt(o.before.recall,o.before.tp+o.before.fn)} | ${fmt(o.before.precision,o.before.tp+o.before.fp)} | ${fmt(o.after.recall,o.after.tp+o.after.fn)} | ${fmt(o.after.precision,o.after.tp+o.after.fp)} | ${o.after.tp}/${o.after.fp}/${o.after.fn}/${o.after.tn} |`)];
 writeFileSync('docs/CHECKER_EVAL.md',`# Checker engineering evaluation\n\nGenerated ${new Date().toISOString()}. All ${r.total_cases} fixtures are assistant-authored and human-unreviewed. **No human-reviewed gold-set headline accuracy exists.** Percentages below measure flags on these engineering fixtures and controls, not real translation accuracy. Ambiguity/unverified counts as a flag; this is detection recall, not exact verdict accuracy.\n\n${table.join('\n')}\n\nRecall = TP/(TP+FN). Precision = TP/(TP+FP). Correct original versions provide controls; paraphrased controls are included. No train/test separation or statistical generalization claim. Target engineering mutation recall: 95%.\n\nKnown weaknesses / false alarms: ${JSON.stringify(r.known_weaknesses)}. Places and other fuzzy semantics still need model/human review. Hindi fraction/number vocabulary and cross-language coverage need native-speaker review.\n`);
 console.log(JSON.stringify({cases:r.total_cases,human_reviewed:r.human_reviewed_cases,weaknesses:r.known_weaknesses}));
}
