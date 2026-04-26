import sys
import os
import asyncio
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

from agents.legal_agent import chat

async def test():
    print('Testing AI Agent invocation...')
    try:
        result = await chat('Hello, can you see this?')
        print(f"Status: {result.get('status')}")
        print(f"Response: {result.get('response')}")
        if result.get('status') == 'error':
            print(f"ERROR: {result.get('error')}")
    except Exception as e:
        import traceback
        print(f"CRASHED:\n{traceback.format_exc()}")

if __name__ == '__main__':
    asyncio.run(test())
