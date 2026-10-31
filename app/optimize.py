from .chain import run_chain

STRATEGIES = ['One fact per sentence','Explicit anchors and labels','Repeat the deadline','Repeat the action']

def candidate(source,round_index,feedback):
    f = source.facts
    # Construct from approved truth, not model conjecture. Feedback selects a repetition target.
    core = f'Fictional drill. Hazard: {f.hazard}. Place: {f.location}. Action: {f.action}. Time: {f.deadline_time}. Date: {f.deadline_date}. Expected: {f.quantity}.'
    if round_index == 0:
        return f'Fictional drill. {f.hazard.capitalize()}. {f.location}. Please {f.action}. By {f.deadline_time} on {f.deadline_date}. Expected: {f.quantity}.'
    if round_index == 1: return core
    if round_index == 2:
        return core + f' Deadline: {f.deadline_time} on {f.deadline_date}.'
    worst = max(feedback,key=feedback.get) if feedback else 'action'
    return core + f' Remember: {getattr(f,worst) or f.action}.'

async def optimize(provider,source,chain,holdout_chain,trials=10,seed=42,rounds=4,length_cap=1.6,target=.95):
    if chain == holdout_chain: raise ValueError('Hold-out chain must differ')
    baseline = await run_chain(provider,source,chain,trials,seed)
    best = baseline
    history=[]
    feedback={}
    cap = int(len(source.message)*length_cap)
    stop_reason = 'round_budget'
    if best['metrics']['cfs'] >= target: stop_reason = 'target_reached_at_baseline'
    else:
        for i in range(rounds):
            text = candidate(source,i,feedback)
            if len(text)>cap:
                history.append({'round':i+1,'strategy':STRATEGIES[i],'message':text,'accepted':False,'reason':'length_cap','characters':len(text)})
                continue
            # Fresh trials for each candidate; no held-out data enters candidate selection.
            report = await run_chain(provider,source,chain,trials,seed+(i+1)*10000,text)
            feedback = {k:sum(h['facts'][k]['status']!='preserved' for r in report['trials'] for h in r['hops']) for k in source.facts.critical}
            improved = report['metrics']['cfs']>best['metrics']['cfs']
            history.append({'round':i+1,'strategy':STRATEGIES[i],'message':text,'characters':len(text),
                            'accepted':improved,'cfs':report['metrics']['cfs'],'n':trials,'feedback':feedback,'run':report})
            if improved: best = report
            if best['metrics']['cfs']>=target:
                stop_reason='target_reached'
                break
    # Fresh validation on A avoids presenting selected candidate's training score as validation.
    validated = await run_chain(provider,source,chain,trials,seed+70000,best['message'])
    # Hold-out is first touched after optimization is finished.
    holdout_base = await run_chain(provider,source,holdout_chain,trials,seed+80000)
    holdout_best = await run_chain(provider,source,holdout_chain,trials,seed+90000,best['message'])
    return {'mode':provider.mode,'source_id':source.id,'n':trials,'chain_a':chain,'chain_b':holdout_chain,
            'baseline':baseline,'optimized':validated,'training_best':best,'holdout_baseline':holdout_base,
            'holdout_optimized':holdout_best,'history':history,'stop_reason':stop_reason,
            'length_ratio':len(best['message'])/len(source.message),'length_cap':length_cap,
            'holdout_worse':holdout_best['metrics']['cfs']<validated['metrics']['cfs'],
            'limitations':['Synthetic English simulation is not real multilingual evidence.' if provider.mode=='mock' else 'Simulated LLM speakers; native-speaker validation required.',
                           'Independent judging prompt; same model by default, so grading bias remains.',
                           'Small trial counts and stochastic selection; results need replication.']}
