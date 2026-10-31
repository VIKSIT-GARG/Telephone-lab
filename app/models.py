from typing import Literal
from pydantic import BaseModel, Field, model_validator

FIELDS = ('hazard', 'location', 'action', 'deadline_time', 'deadline_date', 'quantity')
LANGUAGES = ('Hindi', 'Tamil', 'Bengali', 'Marathi', 'English')
CHAINS = {'A': ['Hindi', 'Tamil', 'Hindi'], 'B': ['Tamil', 'Bengali', 'Marathi', 'Hindi']}

class Facts(BaseModel):
    hazard: str | None = None
    location: str | None = None
    action: str | None = None
    deadline_time: str | None = None
    deadline_date: str | None = None
    quantity: str | None = None
    critical: list[str] = Field(default_factory=lambda: ['location','action','deadline_time','deadline_date'])

    @model_validator(mode='after')
    def validate_critical(self):
        if not self.critical or len(set(self.critical)) != len(self.critical):
            raise ValueError('Critical fields must be nonempty and unique')
        if any(k not in FIELDS or not getattr(self,k) for k in self.critical):
            raise ValueError('Every critical field must name a supplied fact')
        return self

class Source(BaseModel):
    id: str
    title: str
    message: str = Field(min_length=1, max_length=3000)
    facts: Facts
    anchor_date: str

class RunRequest(BaseModel):
    source_id: str = 'flood'
    mode: Literal['mock','live'] = 'mock'
    chain: list[str] = Field(default_factory=lambda: CHAINS['A'].copy(), min_length=3, max_length=6)
    trials: int = Field(default=10, ge=1, le=30)
    seed: int = Field(default=42, ge=0, le=1000000)

    @model_validator(mode='after')
    def languages(self):
        if any(x not in LANGUAGES for x in self.chain):
            raise ValueError('Unsupported language selection; dialects are not verified')
        return self

class OptimizeRequest(RunRequest):
    rounds: int = Field(default=4, ge=1, le=4)
    length_cap: float = Field(default=1.6, ge=1.0, le=2.0)
    target: float = Field(default=0.95, ge=0, le=1)
    holdout_chain: list[str] = Field(default_factory=lambda: CHAINS['B'].copy(), min_length=3, max_length=6)

    @model_validator(mode='after')
    def holdout(self):
        if self.holdout_chain == self.chain:
            raise ValueError('Hold-out chain must differ from training chain')
        if any(x not in LANGUAGES for x in self.holdout_chain):
            raise ValueError('Unsupported hold-out language')
        return self
