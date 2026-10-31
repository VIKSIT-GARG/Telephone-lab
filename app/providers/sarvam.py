import os
import httpx
from .base import ProviderError

class SarvamProvider:
    mode = 'live'
    def __init__(self, transport=None):
        self.key = os.getenv('SARVAM_API_KEY','')
        if not self.key:
            raise ProviderError('SARVAM_API_KEY is missing. Configure it on the server; no fallback was used.')
        self.model = os.getenv('SARVAM_MODEL','sarvam-105b')
        self.judge = os.getenv('SARVAM_JUDGE_MODEL','sarvam-105b')
        self.logs = []
        self.transport = transport

    async def complete(self, task, system, text, seed, **context):
        model = self.model if task == 'retell' else self.judge
        body = {'model':model, 'messages':[{'role':'system','content':system},{'role':'user','content':text}],
                'temperature':0.35 if task == 'retell' else 0.0, 'seed':seed, 'max_tokens':2048,
                'reasoning_effort':None, 'stream':False}
        if task in ('extract','judge'):
            body['response_format'] = {'type':'json_object'}
        log = {'task':task,'request':body,'endpoint':'https://api.sarvam.ai/v1/chat/completions'}
        self.logs.append(log)
        try:
            async with httpx.AsyncClient(timeout=90, transport=self.transport) as client:
                r = await client.post(log['endpoint'],headers={'api-subscription-key':self.key},json=body)
            if not r.is_success:
                # Do not reflect upstream text: it may contain request headers or secrets.
                log['error'] = f'HTTP {r.status_code}'
                raise ProviderError(f'Sarvam returned HTTP {r.status_code}; no fallback was used.')
            raw = r.json()
            log['response'] = raw
            choice = raw['choices'][0]
            content = choice['message']['content']
            if choice.get('finish_reason') != 'stop' or not isinstance(content,str) or not content.strip():
                raise ProviderError('Sarvam returned empty or truncated output; no fallback was used.')
            return content
        except ProviderError:
            raise
        except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError) as exc:
            log['error'] = type(exc).__name__
            raise ProviderError(f'Sarvam response/connection failed ({type(exc).__name__}); no fallback was used.') from None
