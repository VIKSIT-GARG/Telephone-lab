from typing import Protocol

class ProviderError(RuntimeError):
    pass

class Provider(Protocol):
    mode: str
    logs: list[dict]
    async def complete(self, task: str, system: str, text: str, seed: int, **context) -> str: ...
