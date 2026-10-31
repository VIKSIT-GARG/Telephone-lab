"""Generate an auditable static figure from actual recorded real API summaries."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
s=json.loads(Path('public/evidence/real.json').read_text())
rows=[r for r in s.get('summary',[]) if r.get('cfs')]
fig,ax=plt.subplots(figsize=(10,max(3,0.5*len(rows)+1.8)))
fig.patch.set_facecolor('#f7f8f3');ax.set_facecolor('#f7f8f3')
if rows:
 for i,r in enumerate(rows):
  c=r['cfs'];color='#2c6b54' if r['version']=='optimized' else '#de724e'
  lo,hi=c.get('low'),c.get('high');err=None if lo is None else [[max(0,c['mean']-lo)],[max(0,hi-c['mean'])]]
  ax.errorbar(c['mean'],i,xerr=err,fmt='o',color=color,capsize=3)
  ax.text(min(1.02,c['mean']+.025),i,f"N={c['n']}"+(' · no CI' if lo is None else ''),va='center',fontsize=9)
 ax.set_yticks(range(len(rows)),[f"{r['scenario']} · {r['chain']} · {r['version']}" for r in rows]);ax.invert_yaxis();ax.set_xlim(-.02,1.15);ax.set_xlabel('Automated checker CFS (0–1); whole-trial bootstrap CI when N≥2')
else:ax.text(.5,.5,'No complete real API trials yet',ha='center',va='center');ax.set_axis_off()
ax.set_title('Recorded real API study — '+s.get('status','not-run'),loc='left',fontsize=14,pad=18)
fig.text(.02,.015,'Not native-speaker validation. Missing settings are not plotted. Small-N estimates are exploratory.',fontsize=9,color='#667773')
fig.tight_layout(rect=(0,.06,1,1));fig.savefig('public/evidence/real-cfs.png',dpi=160)
print('public/evidence/real-cfs.png')
