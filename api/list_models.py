import os
from google import genai

api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

try:
    models = client.models.list()
    for model in models:
        print(model.name)
except Exception as e:
    print(f"Error listing models: {e}")
