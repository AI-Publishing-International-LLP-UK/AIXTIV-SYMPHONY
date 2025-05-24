
# middleware/subscription_manager.py

import httpx
import asyncio

class MiddlewareGateway:
    def __init__(self, config):
        self.config = config
        self.providers = {
            'gemini': self.config.get('gemini', {}),
            'copilot': self.config.get('copilot', {}),
            'huggingface': self.config.get('huggingface', {})
        }

    async def send_request(self, provider, prompt):
        if provider == 'gemini':
            return await self._call_gemini(prompt)
        elif provider == 'copilot':
            return await self._call_copilot(prompt)
        elif provider == 'huggingface':
            return await self._call_huggingface(prompt)
        else:
            return {'error': f'Unknown provider: {provider}'}

    async def _call_gemini(self, prompt):
        url = self.providers['gemini'].get('endpoint')
        api_key = self.providers['gemini'].get('api_key')
        headers = {'Authorization': f'Bearer {api_key}'}
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"prompt": prompt}, headers=headers)
            return response.json()

    async def _call_copilot(self, prompt):
        url = self.providers['copilot'].get('endpoint')
        api_key = self.providers['copilot'].get('api_key')
        headers = {'Authorization': f'Bearer {api_key}'}
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"prompt": prompt}, headers=headers)
            return response.json()

    async def _call_huggingface(self, prompt):
        url = self.providers['huggingface'].get('endpoint')
        api_key = self.providers['huggingface'].get('api_key')
        headers = {'Authorization': f'Bearer {api_key}'}
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={"inputs": prompt}, headers=headers)
            return response.json()

    def available_providers(self):
        return [k for k, v in self.providers.items() if v.get('api_key') and v.get('endpoint')]
