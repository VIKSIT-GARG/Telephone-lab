// Optional manual smoke test. Pass the API key via stdin; it is never logged/saved.
import {createSarvam,analyzeMessage,translateMessage} from '../lib/studio.mjs';
let key='';for await(const c of process.stdin)key+=c;key=key.trim();
const message='Fictional drill: Meet at the school by 6 PM on 17 August 2030. Bring 2 bottles of water. Do not return home.';
const client=createSarvam(key);
const analysis=await analyzeMessage(client,message);
console.log(JSON.stringify({stage:'analysis',source_language:analysis.source_language,fact_count:analysis.facts.length}));
let translation;try{translation=await translateMessage(client,message,analysis.facts,process.argv[2]||'Hindi');}catch(e){console.error(e.message);for(const l of client.logs)console.error(JSON.stringify({task:l.task,response:l.response.choices?.[0]?.message?.content}));process.exit(1);}
console.log(JSON.stringify({stage:'translation',language:translation.language,translation:translation.translation,back_translation:translation.back_translation,preserved:translation.preserved,total:translation.total,needs_review:translation.needs_review,attempts:translation.attempt_count}));
