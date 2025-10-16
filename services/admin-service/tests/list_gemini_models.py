"""
Script to list all available Gemini models for your API key
"""
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure API key
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    print("ERROR: GOOGLE_API_KEY not found in .env file")
    exit(1)

genai.configure(api_key=api_key)

print("=" * 80)
print("AVAILABLE GEMINI MODELS")
print("=" * 80)
print()

# List all models
models = genai.list_models()

# Filter for models that support generateContent
generative_models = []
for model in models:
    if 'generateContent' in model.supported_generation_methods:
        generative_models.append(model)
        print(f"✓ Model Name: {model.name}")
        print(f"  Display Name: {model.display_name}")
        print(f"  Description: {model.description}")
        print(f"  Supported Methods: {', '.join(model.supported_generation_methods)}")
        print()

print("=" * 80)
print(f"TOTAL MODELS SUPPORTING generateContent: {len(generative_models)}")
print("=" * 80)
print()

# Recommend models
print("RECOMMENDED MODELS FOR YOUR USE CASE:")
print()
for model in generative_models:
    if 'flash' in model.name.lower():
        print(f"  {model.name}")
        print(f"    → Fast and efficient for general tasks")
        print()
    elif 'pro' in model.name.lower():
        print(f"  {model.name}")
        print(f"    → More capable for complex tasks")
        print()
