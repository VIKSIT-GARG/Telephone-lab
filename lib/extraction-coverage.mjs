import{digits}from'./checker.mjs';
// These are coverage warnings, not fabricated facts or a general multilingual parser.
export function extractionCoverage(message,facts){const t=digits(message).toLowerCase();const expected=[];
 if(/(?:\+91[ -]?)?(?:\d[ -]?){10,13}(?!\d)/.test(t))expected.push('phone');
 if(/\b\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?\b|\b\d{1,2}:\d{2}\b|बजे/.test(t))expected.push('time');
 if(/per person|per family|per hour|प्रति व्यक्ति|प्रति परिवार|प्रति घंटे/.test(t))expected.push('quantity');
 if(/\bif\b|\bunless\b|\buntil\b|अगर|यदि|जब तक/.test(t))expected.push('condition');
 if(/\bdo not\b|\bnever\b|\bdon't\b|मत |नहीं/.test(t))expected.push('action');
 return [...new Set(expected)].filter(kind=>!facts.some(f=>f.kind===kind)).map(kind=>({kind,message:`Source contains a ${kind} pattern, but no separate ${kind} fact was extracted. Check for merged or missing facts.`}));
}
