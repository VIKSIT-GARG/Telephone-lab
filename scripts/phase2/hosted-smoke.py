"""Opt-in deployed smoke: service token via hidden input, never a command argument."""
import getpass,json,httpx
url='https://telephone-lab-viksit.hduasbasj.chatgpt.site'
token=getpass.getpass('Site service token: ')
c=httpx.Client(base_url=url,headers={'OAI-Sites-Authorization':'Bearer '+token,'Origin':url},timeout=300)
checks=[]
def check(name,r,expected):
    ok=r.status_code==expected
    checks.append({'name':name,'http_status':r.status_code,'expected':expected,'passed':ok})
    print(json.dumps(checks[-1]),flush=True)
    if not ok:print(r.text[:500],flush=True)
    return ok
s=c.get('/api/studio/status');check('status-and-durable-storage',s,200);print(json.dumps(s.json()),flush=True)
check('large-input',c.post('/api/studio/analyze',headers={'Content-Type':'application/json'},content='x'*70000),413)
check('cross-origin',c.post('/api/studio/analyze',headers={'Origin':'https://wrong.example'},json={'message':'Fictional drill'}),403)
check('invalid-review',c.post('/api/studio/review-import',json={'language':'Hindi'}),400)
check('validation-status',c.get('/api/studio/validation'),200)
message='Fictional drill: Meet at the school by 6 PM. Bring 2 bottles per person. Call 98765 43210. Do not cross the bridge.'
a=c.post('/api/studio/analyze',json={'message':message});ok=check('live-analysis',a,200)
if ok:
    d=a.json();t=c.post('/api/studio/translate',json={'message':message,'facts':d['facts'],'language':'Hindi'})
    if check('live-translation-independent-judge',t,200):
        r=t.json();print(json.dumps({'mode':r['mode'],'facts':r['preserved'],'total':r['total'],'needs_review':r['needs_review'],'validation_status':r.get('validation_status'),'independent':r.get('independent_judge',{}).get('status')},ensure_ascii=False),flush=True)
        checks.append({'name':'default-no-raw-logs','passed':all('request' not in l and 'response' not in l for l in r['logs'])})
        checks.append({'name':'security-headers','passed':all(h in t.headers for h in ['x-content-type-options','referrer-policy','content-security-policy'])})
print(json.dumps({'summary':checks,'all_passed':all(x['passed'] for x in checks)}),flush=True)
if not all(x['passed'] for x in checks):raise SystemExit(1)
