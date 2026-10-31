import os
from .base import ProviderError
from .mock import MockProvider
from .sarvam import SarvamProvider

def get_provider(mode):
    if mode == 'mock': return MockProvider()
    if mode == 'live':
        if os.getenv('TELEPHONE_ENABLE_LIVE','false').lower() != 'true':
            raise ProviderError('Live mode is disabled. Set TELEPHONE_ENABLE_LIVE=true on the server.')
        return SarvamProvider()
    raise ProviderError('Unknown mode')
