import asyncio
import json
import os
import re
from pathlib import Path
from uuid import uuid4
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from .chain import ROOT, sources, run_chain
from .models import RunRequest, OptimizeRequest
from .optimize import optimize
from .providers import get_provider, ProviderError

load_dotenv(ROOT/'.env')
app=FastAPI(title='Telephone Lab',version='1.0.0',description='Fictional warning research. Mock results are synthetic.')
# Bound concurrent expensive experiments. Deliberately local-only by default (see README).
lock=asyncio.Lock()

def directory():
    p=Path(os.getenv('TELEPHONE_RUNS_DIR',str(ROOT/'runs')))
    p.mkdir(parents=True,exist_ok=True)
    return p

def save(data):
    identifier=str(uuid4())
    target=directory()/f'{identifier}.json'
    temporary=target.with_suffix('.tmp')
    temporary.write_text(json.dumps(data,ensure_ascii=False,indent=2))
    temporary.replace(target)
    return identifier

def source(identifier):
    s=sources().get(identifier)
    if s is None: raise HTTPException(404,'Unknown source')
    return s

@app.get('/api/config')
def config():
    return {'mode':'local-backend','live_enabled':os.getenv('TELEPHONE_ENABLE_LIVE','false').lower()=='true',
            'key_configured':bool(os.getenv('SARVAM_API_KEY')),'speech_enabled':False}

@app.get('/api/sources')
def get_sources(): return [s.model_dump() for s in sources().values()]

async def execute(req,optimizer=False):
    s=source(req.source_id)
    if lock.locked(): raise HTTPException(409,'An experiment is already running. Wait for completion.')
    async with lock:
        provider=None
        try:
            provider=get_provider(req.mode)
            if optimizer:
                data=await optimize(provider,s,req.chain,req.holdout_chain,req.trials,req.seed,req.rounds,req.length_cap,req.target)
            else: data=await run_chain(provider,s,req.chain,req.trials,req.seed)
            data['saved_id']=save(data)
            return data
        except ProviderError as e:
            error={'mode':req.mode,'status':'failed','error':str(e),'logs':provider.logs if provider else []}
            identifier=save(error)
            raise HTTPException(502,{'message':str(e),'saved_id':identifier,'mode':req.mode}) from None

@app.post('/api/run')
async def run(req:RunRequest): return await execute(req)

@app.post('/api/optimize')
async def improve(req:OptimizeRequest): return await execute(req,True)

@app.get('/api/runs')
def list_runs():
    return [{'id':p.stem,'bytes':p.stat().st_size} for p in sorted(directory().glob('*.json'),key=lambda p:p.stat().st_mtime,reverse=True)[:100]]

@app.get('/api/runs/{identifier}')
def get_run(identifier:str):
    if not re.fullmatch(r'[a-f0-9-]{36}',identifier): raise HTTPException(400,'Invalid run ID')
    p=directory()/f'{identifier}.json'
    if not p.is_file(): raise HTTPException(404,'Run not found')
    return json.loads(p.read_text())

app.mount('/',StaticFiles(directory=ROOT/'public/lab',html=True),name='frontend')
