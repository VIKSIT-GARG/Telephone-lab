// Conservative deterministic checks. Ambiguity is surfaced; equivalence is not guessed.
export const CHECKER_VERSION='2.0.0';
const bases=[0x660,0x6f0,0x966,0x9e6,0xa66,0xae6,0xb66,0xbe6,0xc66,0xce6,0xd66];
export function digits(s){return [...String(s).normalize('NFKC')].map(c=>{const n=c.codePointAt(0);for(const b of bases)if(n>=b&&n<b+10)return String(n-b);return c;}).join('');}
const hi=['शून्य','एक','दो','तीन','चार','पांच','छह','सात','आठ','नौ','दस','ग्यारह','बारह','तेरह','चौदह','पंद्रह','सोलह','सत्रह','अठारह','उन्नीस','बीस','इक्कीस','बाईस','तेईस','चौबीस','पच्चीस','छब्बीस','सत्ताईस','अट्ठाईस','उनतीस','तीस','इकतीस','बत्तीस','तैंतीस','चौंतीस','पैंतीस','छत्तीस','सैंतीस','अड़तीस','उनतालीस','चालीस','इकतालीस','बयालीस','तैंतालीस','चवालीस','पैंतालीस','छियालीस','सैंतालीस','अड़तालीस','उनचास','पचास','इक्यावन','बावन','तिरपन','चौवन','पचपन','छप्पन','सत्तावन','अट्ठावन','उनसठ','साठ','इकसठ','बासठ','तिरसठ','चौंसठ','पैंसठ','छियासठ','सड़सठ','अड़सठ','उनहत्तर','सत्तर','इकहत्तर','बहत्तर','तिहत्तर','चौहत्तर','पचहत्तर','छिहत्तर','सतहत्तर','अठहत्तर','उनासी','अस्सी','इक्यासी','बयासी','तिरासी','चौरासी','पचासी','छियासी','सत्तासी','अट्ठासी','नवासी','नब्बे','इक्यानवे','बानवे','तिरानवे','चौरानवे','पचानवे','छियानवे','सत्तानवे','अट्ठानवे','निन्यानवे'];
const en=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
export function numberText(s){let t=digits(s).toLowerCase().replace(/पाँच/g,'पांच').replace(/छः|छ:/g,'छह');
 const map=[...hi.map((w,i)=>[w,String(i)]),...en.map((w,i)=>[w,String(i)]),['forty-five','45'],['twenty-five','25'],['डेढ़','1.5'],['ढाई','2.5']].sort((a,b)=>b[0].length-a[0].length);
 for(const [w,n]of map)t=t.replace(new RegExp(`(?<![\\p{L}])${w}(?![\\p{L}])`,'gu'),n);
 t=t.replace(/(?<=\d),(?=\d)/g,'');
 const scale={hundred:100,'सौ':100,thousand:1000,'हजार':1000,'हज़ार':1000,lakh:100000,lac:100000,'लाख':100000,million:1000000,crore:10000000,'करोड़':10000000,billion:1000000000};
 for(const [w,v]of Object.entries(scale))t=t.replace(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${w}s?(?![\\p{L}])`,'gu'),(_,n)=>String(Number(n)*v));
 return t;
}
export function numbers(s){return (numberText(s).match(/(?<!\d)-?\d+(?:\.\d+)?/g)||[]).map(Number);}
export function phone(s){let n=digits(s).replace(/[^0-9]/g,'');if(n.length===12&&n.startsWith('91'))n=n.slice(2);return n;}
export function time(s){let t=numberText(s);let h,m,period=null;
 if(/सवा|साढ़े|पौने/.test(t)){const x=t.match(/(सवा|साढ़े|पौने)\s*(\d{1,2})/);if(x){h=Number(x[2]);m=x[1]==='सवा'?15:x[1]==='साढ़े'?30:45;if(x[1]==='पौने')h=(h+11)%12||12;}}
 if(h===undefined){const x=t.match(/(?<!\d)(\d{1,2}(?:\.\d+)?)(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);if(x){h=Number(x[1]);m=Number(x[2]||0);period=x[3]?.toLowerCase().startsWith('p')?'pm':x[3]?'am':null;if(!x[2]&&h%1!==0){m=Math.round((h%1)*60);h=Math.floor(h);}}}
 if(h===undefined||h>23||m>59)return {value:null,ambiguous:true};
 if(/शाम|दोपहर|evening|afternoon/.test(t))period='pm';if(/रात|night/.test(t))period=(h===12||h<5)?'am':'pm';
 if(/सुबह|morning/.test(t))period='am';
 if(period){if(h>12)return {value:null,ambiguous:true};h=h%12+(period==='pm'?12:0);}
 const explicit24=/\b\d{1,2}:\d{2}\b/.test(t);
 return {value:h*60+m,ambiguous:!period&&!explicit24&&h<=12};
}
export function dateValue(s,context={}){const t=digits(s).toLowerCase();const iso=t.match(/\d{4}-\d{2}-\d{2}/)?.[0];if(iso){const d=new Date(iso+'T00:00:00Z');return Number.isNaN(+d)||d.toISOString().slice(0,10)!==iso?null:iso;}
 const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
 for(let i=0;i<12;i++){const name=months[i];const x=t.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+${name}\\s+(\\d{4})`))||t.match(new RegExp(`${name}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`));if(x)return dateValue(`${x[2]}-${String(i+1).padStart(2,'0')}-${x[1].padStart(2,'0')}`);}
 let delta;if(/परसों/.test(t))delta=context.tense==='past'?-2:context.tense==='future'?2:undefined;else if(/कल/.test(t))delta=context.tense==='past'?-1:context.tense==='future'?1:undefined;else if(/yesterday/.test(t))delta=-1;else if(/tomorrow/.test(t))delta=1;else if(/today|आज/.test(t))delta=0;
 if(delta!==undefined&&context.anchor_date){const d=new Date(context.anchor_date+'T00:00:00Z');if(!Number.isNaN(+d)){d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10);}}
 return null;
}
export function polarity(s){const t=digits(s).toLowerCase().replace(/’/g,"'");const partial=/not (?:every|all)|हर कोई.*नहीं|सभी.*नहीं/.test(t);const matches=t.match(/\b(?:not|never|no|cannot|can't|don't|doesn't|mustn't|without)\b|नहीं|मत|न /g)||[];return {negative:matches.length%2===1,count:matches.length,partial};}
export function qualifier(s){const t=s.toLowerCase();return {basis:/per person|each person|प्रति व्यक्ति/.test(t)?'person':/per family|each family|प्रति परिवार/.test(t)?'family':/per hour|each hour|प्रति घंटे/.test(t)?'hour':null,bound:/at least|कम से कम/.test(t)?'min':/at most|no more than|अधिकतम|ज्यादा नहीं/.test(t)?'max':null,unit:/kilometres? per hour|km\/h/.test(t)?'km/h':/metres?|meters?|मीटर/.test(t)?'m':/bottles?|बोतल/.test(t)?'bottle':/litres?|liters?|लीटर/.test(t)?'l':null};}
export function condition(s){const t=s.toLowerCase();const op=/only if|केवल.*अगर|तभी/.test(t)?'only_if':/unless|जब तक.*नहीं/.test(t)?'unless':/\bif\b|अगर|यदि/.test(t)?'if':null;return {operator:op};}
export function certainty(s){const t=s.toLowerCase();return /\bmight\b|\bmay\b|शायद|हो सकता/.test(t)?'possible':/\bshould\b|चाहिए/.test(t)?'recommended':/\bwill\b|होगा|होगी/.test(t)?'asserted':null;}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function deterministicCheck(f,observed){
 const a=f.value||'',b=observed||'',kind=f.kind;const conflict=reason=>({verdict:'conflict',reason});const match=()=>({verdict:'match',reason:'Deterministic forms agree.'});const uncertain=reason=>({verdict:'uncertain',reason});
 if(!b.trim())return conflict('The fact has no observed evidence.');
 if(kind==='phone'||f.phone_digits){const x=phone(f.phone_digits||a),y=phone(b);return x.length<6?uncertain('Contact format is not recognized.'):x===y?match():conflict('Phone digits changed or were dropped.');}
 if(kind==='time'){const x=time(a),y=time(b);if(x.ambiguous||y.ambiguous)return uncertain('AM/PM or time interpretation is ambiguous; no time was guessed.');return x.value===y.value?match():conflict('The normalized time changed.');}
 if(kind==='date'){const x=dateValue(a,f.context||{}),y=dateValue(b,f.context||{});if(x&&y)return x===y?match():conflict('The date changed.');if(a.trim().toLowerCase()===b.trim().toLowerCase()&&!/कल|परसों/.test(a))return match();return uncertain('Relative or ambiguous date needs context or human clarification.');}
 if(['number','quantity'].includes(kind)){const x=numbers(a),y=numbers(b);if(!x.length)return uncertain('Unsupported numeric wording.');if(!same(x,y))return conflict('Number, range or decimal changed.');if(!same(qualifier(a),qualifier(b)))return conflict('Quantity unit, per-entity qualifier or bound changed.');return match();}
 const pa=polarity(a),pb=polarity(b);if(pa.negative!==pb.negative||pa.partial!==pb.partial||pa.count!==pb.count)return conflict('Negation polarity, scope or doubled negation changed.');
 const ca=condition(a),cb=condition(b);if(ca.operator!==cb.operator)return conflict('Condition operator was removed or changed.');
 if(kind==='condition'||ca.operator){const clauses=f.condition||(f.semantics?.condition?{condition:f.semantics.condition,consequence:f.semantics.consequence}:null);if(clauses?.condition&&!b.toLowerCase().includes(clauses.condition.toLowerCase()))return uncertain('The linked condition requires semantic review.');if(clauses?.consequence&&!b.toLowerCase().includes(clauses.consequence.toLowerCase()))return uncertain('The linked consequence requires semantic review.');}
 const xa=certainty(a),xb=certainty(b);if(xa!==xb&&(xa||xb))return conflict('Certainty changed (possible / recommended / asserted).');
 if(kind==='order'){const clean=s=>s.toLowerCase().replace(/[,.;]/g,'').replace(/\s+/g,' ').trim();const x=clean(a),y=clean(b);if(!same(x,y))return conflict('Instruction ordering changed.');return match();}
 if(kind==='place'){const aliases=[a,...(f.aliases||[])].map(x=>x.toLowerCase().trim());return aliases.includes(b.toLowerCase().trim())?match():uncertain('Place identity/transliteration requires semantic review.');}
 return {verdict:'not_applicable',reason:'Fuzzy semantics require a model or human judge.'};
}
export function compareKnownFact(f,observed){if(f.value===null)return observed?{status:'invented'}:{status:'preserved'};if(!observed)return {status:'dropped'};const r=deterministicCheck(f,observed);return {status:r.verdict==='match'?'preserved':r.verdict==='conflict'?'altered':f.value.trim().toLowerCase()===observed.trim().toLowerCase()?'preserved':'unverified',...r};}
export function detectAddedNumbers(source,retelling){const original=new Set(numbers(source));return [...new Set(numbers(retelling))].filter(n=>!original.has(n));}
