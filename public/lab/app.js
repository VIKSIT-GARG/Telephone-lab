'use strict';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={hazard:'Hazard',location:'Place',action:'Action',deadline_time:'Time',deadline_date:'Date',quantity:'Quantity'};
const pct=x=>`${Math.round(x*1000)/10}%`;
let archive,report,reportRecorded=true,version='baseline',backend=false,busy=false;
function status(text,error=false){$('activity').textContent=text;$('activity').classList.toggle('error',error);}
function dialog(title,html){$('dialogTitle').textContent=title;$('dialogContent').innerHTML=html;$('detailsDialog').showModal();}
function selectedRuns(){const b=$('chainSelect').value==='B';return {base:report[b?'holdout_baseline':'baseline'],opt:report[b?'holdout_optimized':'optimized']};}
function loadScenario(){reportRecorded=true;report=archive.results.find(r=>r.source_id===$('sourceSelect').value);version='baseline';render();status('Saved synthetic experiment loaded. Use Replay to follow the hops.');}
function render(){
 const {base,opt}=selectedRuns(),s=report.source||report.baseline?.source||report.holdout_baseline.source;
 $('scenarioTitle').textContent=s.title;$('sourceMessage').textContent=s.message;
 const chain=$('chainSelect').value==='A'?report.chain_a:report.chain_b;
 $('chainLabels').innerHTML=chain.map((x,i)=>`${i?'<b>→</b>':''}<span>${esc(x)}</span>`).join('');
 $('truthFacts').innerHTML=Object.entries(names).map(([k,n])=>`<div class="truth-fact"><div class="key">${esc(n)} ${s.facts.critical.includes(k)?'<span class="critical-dot"></span>':''}</div><div class="value">${esc(s.facts[k])}</div></div>`).join('');
 $('baselineCfs').textContent=base?pct(base.metrics.cfs):'—';$('baselineN').textContent=base?`N = ${base.n} trials · final hop`: 'Run this chain to see results';
 $('baselineBar').style.width=base?pct(base.metrics.cfs):'0%';
 $('optimizedCfs').textContent=opt?pct(opt.metrics.cfs):'—';$('optimizedN').textContent=opt?`N = ${opt.n} fresh trials · final hop`:'Run optimization to compare';
 $('optimizedBar').style.width=opt?pct(opt.metrics.cfs):'0%';
 $('dangerRate').textContent=base?`${pct(base.metrics.danger_rate)} → ${opt?pct(opt.metrics.danger_rate):'—'}`:'—';
 $('dangerN').textContent=base?`N = ${base.n}${opt?` / ${opt.n}`:''} trials (original${opt?' / rewritten':''})`:'';
 $('holdoutChart').innerHTML=['holdout_baseline','holdout_optimized'].map((k,i)=>{const r=report[k];return `<div class="chart-row"><span>${i?'Rewritten':'Original'}</span><div class="bar"><i style="width:${r?pct(r.metrics.cfs):'0%'}"></i></div><strong>${r?pct(r.metrics.cfs):'—'}</strong></div><div class="small muted">${r?`N = ${r.n} trials · final-hop CFS`:'Not yet evaluated'}</div>`;}).join('');
 $('holdoutNote').textContent=report.holdout_optimized?(report.holdout_worse?'The rewrite survives less well on the hold-out than on chain A. Generalization remains a limitation.':'The hold-out result matches or exceeds chain A in this sample.'):'Optimize to evaluate on a separate hold-out chain.';
 $('rewriteText').textContent=report.optimized?.message||'No rewrite evaluated in this experiment yet.';
 $('lengthRatio').textContent=report.length_ratio?`${report.length_ratio.toFixed(2)}× source length · cap ${report.length_cap.toFixed(1)}×`:'Awaiting optimization';
 const chosen=version==='optimized'?opt:base;
 $('trialSelect').innerHTML=Array.from({length:chosen?.n||0},(_,i)=>`<option value="${i}">${i+1}</option>`).join('');
 $('trialSelect').value='0';renderJourney();
 const mode=$('modeSelect').value;
 $('modeBadge').textContent=reportRecorded?'RECORDED MOCK':report.mode==='live'?'LIVE SARVAM':'FRESH MOCK';
 $('provenance').textContent=reportRecorded?'Recorded mock simulation · English renderings · No live API calls':report.mode==='live'?'Live Sarvam run · simulated speakers · not an official alert':'Fresh synthetic simulation · English renderings · not language evidence';
}
function renderJourney(){
 document.querySelectorAll('[data-version]').forEach(b=>b.classList.toggle('selected',b.dataset.version===version));
 const {base,opt}=selectedRuns();const run=version==='optimized'?opt:base;
 if(!run){$('timeline').innerHTML='<p class="normalized">No result for this version yet. Run the optimizer or switch to a recorded experiment.</p>';return;}
 const index=Number($('trialSelect').value)||0;const t=run.trials[index];
 $('timeline').innerHTML=t.hops.map(h=>{
 let text=esc(h.text);
 // Highlight observed mutation spans in the displayed text; full evidence remains in the fact table.
 const spans=Object.values(h.facts).filter(f=>f.status!=='preserved'&&f.observed).map(f=>String(f.observed)).sort((a,b)=>b.length-a.length);
 for(const s of [...new Set(spans)]) text=text.replaceAll(esc(s),`<mark>${esc(s)}</mark>`);
 return `<article class="hop ${h.dangerous?'danger':''}"><span class="hop-marker">${String(h.index).padStart(2,'0')}</span><div class="hop-card"><div class="hop-top"><h3>${esc(h.language)} <span class="danger-label">${h.dangerous?'Critical mutation':''}</span></h3><span>${pct(h.fact_survival)} facts preserved · N = 1 trial</span></div><p class="hop-text">${text}</p><div class="fact-chips">${Object.entries(h.facts).map(([k,f])=>`<span class="fact-chip ${f.status}">${esc(names[k])} · ${esc(f.status)}</span>`).join('')}</div><details><summary>Inspect evidence, facts & normalization</summary><table class="fact-table"><thead><tr><th>Fact</th><th>Expected</th><th>Observed</th><th>Status</th></tr></thead><tbody>${Object.entries(h.facts).map(([k,f])=>`<tr><th scope="row">${esc(names[k])}${f.critical?' *':''}</th><td>${esc(f.expected)}</td><td>${esc(f.observed)}</td><td>${esc(f.status)}</td></tr>`).join('')}</tbody></table><p class="small"><strong>English normalization</strong></p><p class="normalized">${esc(h.normalized)}</p><p class="small muted">* Critical fact. Scores above describe this single trial; summary cards aggregate all trials.</p></details></div></article>`;
 }).join('');
}
function updateMode(){
 const mode=$('modeSelect').value;
 $('trialCount').disabled=mode==='recorded';$('optimizeButton').hidden=mode==='recorded';
 $('runButton').innerHTML=mode==='recorded'?'Replay the experiment <span>↗</span>':'Run baseline chain <span>↗</span>';
 $('modeHelp').textContent=mode==='recorded'?'Replay a saved synthetic experiment. These numbers do not measure real language performance.':mode==='mock'?'Create a fresh synthetic simulation with the local API. Scripted noise is not evidence of multilingual performance.':'Calls the server-side Sarvam API. Requests may incur provider charges. Errors are surfaced; there is no mock fallback.';
 loadScenario();
 if(mode!=='recorded'){$('modeBadge').textContent='RECORDED MOCK';$('provenance').textContent='Recorded mock results shown until a fresh run completes.';status('Choose Run baseline or Optimize to generate fresh results.');}
}
async function apiExperiment(optimizer){
 if(busy)return;busy=true;['sourceSelect','chainSelect','modeSelect','trialCount'].forEach(id=>$(id).disabled=true);$('runButton').disabled=true;$('optimizeButton').disabled=true;
 status(optimizer?'Running candidate selection and fresh chain A + hold-out evaluations. Live experiments can take several minutes.':'Running each hop and checking facts. Please keep this page open.');
 try{
  const body={source_id:$('sourceSelect').value,mode:$('modeSelect').value,trials:Number($('trialCount').value),chain:optimizer?report.chain_a:($('chainSelect').value==='A'?report.chain_a:report.chain_b),seed:Math.floor(Math.random()*900000)};
  if(optimizer)body.holdout_chain=report.chain_b;
  const response=await fetch(optimizer?'/api/optimize':'/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await response.json();if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:JSON.stringify(data.detail));
  if(optimizer){report=data;$('chainSelect').value='A';}
  else{
   const onB=$('chainSelect').value==='B',old=report;
   report={mode:data.mode,source_id:data.source.id,source:data.source,chain_a:old.chain_a,chain_b:old.chain_b,baseline:onB?null:data};
   if(onB){report.holdout_baseline=data;}
  }
  reportRecorded=false;version='baseline';render();status(`Completed ${data.mode} experiment. Saved run: ${data.saved_id}.`);$('results').scrollIntoView({behavior:'smooth'});
 }catch(e){status(`Experiment failed: ${e.message}. No fallback was used.`,true);}
 finally{busy=false;['sourceSelect','chainSelect','modeSelect','trialCount'].forEach(id=>$(id).disabled=false);$('runButton').disabled=false;$('optimizeButton').disabled=false;}
}
$('sourceSelect').addEventListener('change',()=>{if(!busy)loadScenario();});
$('chainSelect').addEventListener('change',()=>render());
$('modeSelect').addEventListener('change',updateMode);
$('trialSelect').addEventListener('change',renderJourney);
document.querySelectorAll('[data-version]').forEach(b=>b.addEventListener('click',()=>{version=b.dataset.version;const {base,opt}=selectedRuns(),r=version==='optimized'?opt:base;$('trialSelect').innerHTML=Array.from({length:r?.n||0},(_,i)=>`<option value="${i}">${i+1}</option>`).join('');renderJourney();}));
$('runButton').addEventListener('click',async()=>{
 if($('modeSelect').value!=='recorded'){await apiExperiment(false);return;}
 version='baseline';render();const {base}=selectedRuns();
 const example=base.trials.findIndex(t=>t.hops.some(h=>h.dangerous));$('trialSelect').value=String(Math.max(0,example));renderJourney();
 status(`Replaying saved mock trial ${Number($('trialSelect').value)+1}. Mutations were programmed, not generated live.`);
 $('journey').scrollIntoView({behavior:'smooth'});
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelectorAll('.hop').forEach((h,i)=>h.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,delay:i*240,fill:'backwards'}));}
});
$('optimizeButton').addEventListener('click',()=>apiExperiment(true));
$('downloadButton').addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify({display_mode:$('modeSelect').value,recorded:reportRecorded,...report},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`telephone-lab-${report.source_id}-${report.mode}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('methodButton').addEventListener('click',()=>dialog('How the lab measures drift',`<p><strong>Critical Fact Survival (CFS)</strong> is the fraction of marked critical facts preserved at the final hop, averaged across N trials. Every displayed percentage includes its trial count.</p><p><strong>Danger rate</strong> counts trials containing a critical change or omission at any hop. Per-hop chips compare against the original ground truth, never against the last hop.</p><ol><li>A speaker gets only the preceding message.</li><li>Each hop is normalized to English and independently extracted. Times, dates and quantities are compared deterministically. Location, action and hazard use a separate judging prompt.</li><li>The optimizer tries up to four bounded rewrites. It selects using chain A; a fresh chain A evaluation and untouched chain B follow selection.</li></ol><p><strong>Mock mode:</strong> seeded, deliberately programmed changes to English renderings, with lower artificial noise for labeled messages. Its gains are a software test, not proof that rewriting helps real speakers.</p><p><strong>Live mode:</strong> available when served by the included local Python backend with a server-side Sarvam key. This research page replays mock results; the main message studio supports live custom translations. There is no silent fallback.</p><p>No dialect fidelity is claimed. Bhojpuri is excluded. Native-speaker studies, independent-model judging, uncertainty estimates and speech noise remain future work. Optional speech is omitted.</p>`));
$('historyButton').addEventListener('click',()=>dialog('Why this rewrite was selected',`<p>Training uses chain A only. Length is measured in Unicode characters. Training scores select candidates; the main cards use fresh validation trials.</p><p>Stop condition: <strong>${esc(report.stop_reason||'not optimized')}</strong>.</p>${(report.history||[]).map(h=>`<div class="normalized"><strong>Round ${h.round} · ${esc(h.strategy)}</strong><p>${esc(h.message)}</p><span>${h.cfs!==undefined?`${pct(h.cfs)} CFS · N = ${h.n} trials`:'Rejected before evaluation'} · ${h.accepted?'Selected improvement':esc(h.reason||'No improvement')} · ${h.characters} characters</span></div>`).join('')}<p class="small muted">Raw prompts, outputs and seeds are included in Export report.</p>`));
$('closeDialog').addEventListener('click',()=>$('detailsDialog').close());
$('detailsDialog').addEventListener('click',e=>{if(e.target===$('detailsDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
async function init(){
 try{const r=await fetch('demo.json');if(!r.ok)throw Error('Recorded experiment could not be loaded');archive=await r.json();loadScenario();}
 catch(e){status(e.message,true);$('runButton').disabled=true;return;}
 // Live credentials are never accepted by the browser. Hosted static mode stays recorded-only.
 if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){
  try{const r=await fetch('/api/config');if(!r.ok)return;const c=await r.json();backend=true;
   $('modeSelect').querySelector('[value=mock]').disabled=false;
   $('modeSelect').querySelector('[value=live]').disabled=!(c.live_enabled&&c.key_configured);
  }catch(_){} }
}
init();
