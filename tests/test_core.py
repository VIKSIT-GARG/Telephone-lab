import asyncio
import json
import pytest
from app.extract import normalize_time,normalize_date,normalize_quantity,extract_and_compare
from app.chain import sources,run_chain
from app.models import CHAINS,OptimizeRequest,Facts
from app.optimize import optimize
from app.providers.mock import MockProvider
from app.providers.sarvam import SarvamProvider
from app.providers.base import ProviderError

@pytest.mark.parametrize('value,result',[('6 PM','18:00'),('18:00','18:00'),('शाम ६ बजे','18:00'),('12 AM','00:00'),('12 PM','12:00'),('six pm','18:00'),('25:00',None),('6',None),('6:99 PM',None)])
def test_times(value,result): assert normalize_time(value)==result

@pytest.mark.parametrize('value,result',[('today','2030-08-17'),('tomorrow','2030-08-18'),('17 August 2030','2030-08-17'),('2030-02-30',None)])
def test_dates(value,result): assert normalize_date(value,'2030-08-17')==result

def test_quantity():
    assert normalize_quantity('two meters')==normalize_quantity('2 m')
    assert normalize_quantity('120 km/h')!=normalize_quantity('120 metres')
    assert normalize_quantity('45°C')==normalize_quantity('45 degrees Celsius')

def test_chain_and_isolation():
    async def check():
        p=MockProvider(); s=sources()['flood']
        r=await run_chain(p,s,CHAINS['A'],2)
        assert r['mode']=='mock' and r['n']==2
        assert len(r['trials'][0]['hops'])==3
        for trial in r['trials']:
            assert trial['hops'][1]['input']==trial['hops'][0]['text']
        calls=[x for x in p.logs if x['task']=='retell']
        assert all('ground' not in x['system'] for x in calls)
    asyncio.run(check())

def test_dropped_altered_invented_and_negation():
    async def check():
        p=MockProvider(); s=sources()['flood']
        r=await extract_and_compare(p,'Flood in Rampur market. Wait at home by 7 PM tomorrow. Water 3 metres.',s.facts,s.anchor_date,1)
        assert r['facts']['deadline_time']['status']=='altered' and r['dangerous']
        r=await extract_and_compare(p,'Flood.',s.facts,s.anchor_date,1)
        assert r['facts']['action']['status']=='dropped'
        f=s.facts.model_copy(update={'quantity':None})
        r=await extract_and_compare(p,s.message,f,s.anchor_date,1)
        assert r['facts']['quantity']['status']=='invented'
    asyncio.run(check())

def test_optimizer_caps_stop_and_holdout():
    async def check():
        s=sources()['flood']
        r=await optimize(MockProvider(),s,CHAINS['A'],CHAINS['B'],2,rounds=4,length_cap=1.0,target=1)
        assert len(r['optimized']['message'])<=len(s.message)
        assert r['holdout_baseline']['seed']!=r['baseline']['seed']
        assert r['holdout_optimized']['chain']==CHAINS['B']
        r=await optimize(MockProvider(),s,CHAINS['A'],CHAINS['B'],1,target=0)
        assert r['history']==[] and r['stop_reason']=='target_reached_at_baseline'
    asyncio.run(check())

def test_holdout_and_critical_validation():
    with pytest.raises(ValueError): OptimizeRequest(holdout_chain=CHAINS['A'])
    with pytest.raises(ValueError): Facts(critical=['bogus'])

def test_missing_key_and_upstream_failure(monkeypatch):
    monkeypatch.delenv('SARVAM_API_KEY',raising=False)
    with pytest.raises(ProviderError): SarvamProvider()
    monkeypatch.setenv('SARVAM_API_KEY','test-secret')
    import httpx
    async def check():
        transport=httpx.MockTransport(lambda request:httpx.Response(429,text='test-secret'))
        p=SarvamProvider(transport)
        with pytest.raises(ProviderError) as exc: await p.complete('retell','system','test',1)
        assert 'test-secret' not in str(exc.value) and 'test-secret' not in json.dumps(p.logs)
    asyncio.run(check())

def test_api(monkeypatch,tmp_path):
    monkeypatch.setenv('TELEPHONE_RUNS_DIR',str(tmp_path))
    from fastapi.testclient import TestClient
    from app.main import app
    c=TestClient(app)
    assert c.get('/api/sources').status_code==200
    r=c.post('/api/run',json={'trials':1}).json()
    assert r['mode']=='mock'
    assert c.get('/api/runs/'+r['saved_id']).json()['id']==r['id']
    assert c.post('/api/run',json={'chain':['Bhojpuri']*3}).status_code==422
    assert c.post('/api/optimize',json={'holdout_chain':CHAINS['A']}).status_code==422
    monkeypatch.setenv('TELEPHONE_ENABLE_LIVE','false')
    assert c.post('/api/run',json={'mode':'live','trials':1}).status_code==502

def test_invalid_extraction_and_unsupported_numeric_evidence():
    class Invalid(MockProvider):
        async def complete(self,task,system,text,seed,**context):
            if task=='extract': return '{"hazard": "flood"}'
            return await super().complete(task,system,text,seed,**context)
    class Unsupported(MockProvider):
        async def complete(self,task,system,text,seed,**context):
            out=await super().complete(task,system,text,seed,**context)
            if task=='extract':
                data=json.loads(out);data['deadline_time']='11 PM';return json.dumps(data)
            return out
    async def check():
        s=sources()['flood']
        for p in (Invalid(),Unsupported()):
            with pytest.raises(ProviderError):
                await extract_and_compare(p,s.message,s.facts,s.anchor_date,1)
    asyncio.run(check())

def test_semantic_negation_uses_judge_not_token_overlap():
    class Negation(MockProvider):
        async def complete(self,task,system,text,seed,**context):
            if task=='extract':
                data=json.loads(await super().complete(task,system,text,seed,**context))
                data['action']='do not evacuate to the school building'
                return json.dumps(data)
            return await super().complete(task,system,text,seed,**context)
    async def check():
        s=sources()['flood']
        r=await extract_and_compare(Negation(),s.message.replace('Evacuate','Do not evacuate'),s.facts,s.anchor_date,1)
        assert r['facts']['action']['status']=='altered'
    asyncio.run(check())

def test_live_response_contract(monkeypatch):
    import httpx
    monkeypatch.setenv('SARVAM_API_KEY','not-a-real-key')
    def reply(request):
        body=json.loads(request.content)
        assert body['model']=='sarvam-105b' and body['seed']==7
        assert request.headers['api-subscription-key']=='not-a-real-key'
        return httpx.Response(200,json={'choices':[{'finish_reason':'stop','message':{'content':'नमस्ते'}}]})
    async def check():
        p=SarvamProvider(httpx.MockTransport(reply))
        assert await p.complete('retell','Test','Hello',7)=='नमस्ते'
        assert p.mode=='live' and 'not-a-real-key' not in json.dumps(p.logs)
    asyncio.run(check())

def test_api_optimize_and_persistence(monkeypatch,tmp_path):
    monkeypatch.setenv('TELEPHONE_RUNS_DIR',str(tmp_path))
    from fastapi.testclient import TestClient
    from app.main import app
    c=TestClient(app)
    r=c.post('/api/optimize',json={'trials':1,'rounds':1}).json()
    assert r['optimized']['n']==1 and r['holdout_optimized']['chain']!=r['optimized']['chain']
    assert len(c.get('/api/runs').json())==1
    assert c.post('/api/run',json={'trials':31}).status_code==422
    assert c.post('/api/run',json={'source_id':'missing'}).status_code==404
