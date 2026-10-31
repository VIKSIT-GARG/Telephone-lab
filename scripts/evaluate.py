"""python -m scripts.evaluate --mode mock --trials 10
Live evaluation incurs API charges; explicitly enable in the environment first.
"""
import argparse
import asyncio
import json
from pathlib import Path
from dotenv import load_dotenv
from app.chain import ROOT,sources
from app.models import CHAINS
from app.optimize import optimize
from app.providers import get_provider

async def main(args):
    load_dotenv(ROOT/'.env')
    results=[]
    for i,s in enumerate(sources().values()):
        report=await optimize(get_provider(args.mode),s,CHAINS['A'],CHAINS['B'],args.trials,42+i*100000)
        results.append(report)
        print(s.id, json.dumps({k:round(report[k]['metrics']['cfs'],3) for k in ('baseline','optimized','holdout_baseline','holdout_optimized')}),f'N={args.trials}; {args.mode}')
    path=Path(args.output or ('public/lab/demo.json' if args.mode=='mock' else 'runs/live-evaluation.json'))
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps({'mode':args.mode,'recorded':True,'n':args.trials,'results':results},ensure_ascii=False,indent=2))
    print(f'Saved {path}')

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--mode',choices=['mock','live'],default='mock')
    p.add_argument('--trials',type=int,default=10)
    p.add_argument('--output')
    args=p.parse_args()
    if not 10<=args.trials<=30: p.error('Evaluation requires 10–30 trials')
    asyncio.run(main(args))
