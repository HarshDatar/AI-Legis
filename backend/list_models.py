import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

keys = [k.strip().strip('"').strip("'") for k in os.getenv("GEMINI_API_KEY", "").split(",") if k.strip()]

if not keys:
    print("No keys found in .env")
    exit()

for i, key in enumerate(keys):
    print(f"\n--- Key {i+1} ---")
    try:
        genai.configure(api_key=key)
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"  {m.name}")
    except Exception as e:
        print(f"  Error: {e}")
