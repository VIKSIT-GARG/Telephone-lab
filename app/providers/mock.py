"""Synthetic English-rendering simulator. NOT a multilingual model or a benchmark.
Mutations are deliberately programmed; sentence redundancy lowers artificial noise.
"""
import json
import random
import re
from .base import ProviderError

class MockProvider:
    mode = 'mock'
    def __init__(self):
        self.logs = []

    async def complete(self, task, system, text, seed, **context):
        rng = random.Random(seed)
        if task == 'retell':
            # Every hop consumes only its immediate predecessor. No truth is accessible.
            out = re.sub(r'^\[Mock .*?\]\s*', '', text)
            robust = 'Time:' in out and 'Date:' in out
            p = 0.035 if robust else 0.25
            mutations = [
                (r'6 PM|18:00', '7 PM'), (r'9 AM|09:00', '10 AM'),
                (r'12 PM|12:00', '1 PM'),
                (r'today,?\s*(?:17 August 2030|5 September 2030|12 May 2030)', 'tomorrow'),
                (r'2030-08-17', '2030-08-18'), (r'2030-09-05', '2030-09-06'),
                (r'2030-05-12', '2030-05-13'),
                (r'Rampur village near the river bank', 'Rampur market'),
                (r'Neelpur coastal village', 'Neelpur harbour'),
                (r'Surajpur town', 'Surajpur station'),
                (r'evacuate to the school building', 'wait at home'),
                (r'move to the community shelter', 'wait at home'),
                (r'stay indoors', 'go outdoors'),
                (r'2 metres', '3 metres'), (r'120 kilometres per hour','100 kilometres per hour'),
                (r'45 degrees Celsius','40 degrees Celsius')]
            for pattern, replacement in mutations:
                if rng.random() < p:
                    out = re.sub(pattern,replacement,out, flags=re.I)
            if rng.random() < p / 2:
                out = re.sub(r'(?:Time:|Date:|Place:|Action:)[^.]+\.', '', out, count=1)
            out = f"[Mock {context['language']} speaker; English rendering] {out}"
        elif task == 'normalize':
            out = re.sub(r'^\[Mock .*?\]\s*','',text)
        elif task == 'extract':
            from ..extract import mock_extract
            out = json.dumps(mock_extract(text,context['anchor']),ensure_ascii=False)
        elif task == 'judge':
            # Mock fuzzy judging is exact normalized matching; never used in live mode.
            pairs = context['pairs']
            out = json.dumps({k:bool(a and b and a.casefold().strip() == b.casefold().strip()) for k,(a,b) in pairs.items()})
        else:
            raise ProviderError('Unknown mock task')
        self.logs.append({'task':task,'model':'synthetic-simulator-v1','seed':seed,'system':system,'input':text,'response':out})
        return out
