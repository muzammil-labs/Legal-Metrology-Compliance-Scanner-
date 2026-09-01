import os
import io
import mimetypes
from typing import Tuple

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

def extract_label_with_gemini(content: bytes) -> Tuple[str, float]:
    """
    Takes raw image bytes, sends them to Gemini 2.5 Flash, 
    and returns the verbatim OCR text extracted from the label.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not genai:
        return "Mocked extracted text (ERROR: google-genai SDK failed to import on Vercel)", 0.5
    if not api_key:
        return "Mocked extracted text (ERROR: GEMINI_API_KEY is missing from environment variables)", 0.5
        
    try:
        client = genai.Client(api_key=api_key)
        
        # We assume image/jpeg for raw bytes if not specified, 
        # but Gemini is generally smart enough to infer from bytes.
        image_part = types.Part.from_bytes(data=content, mime_type="image/jpeg")
        
        prompt = (
            "You are a strict, deterministic OCR and legal metrology parser. "
            "Extract ALL text exactly as it appears on this product label. "
            "Pay special attention to manufacturer details, net quantity, MRP, "
            "manufacturing dates, expiry dates, and customer care details. "
            "Do not summarize or invent any text. Output only the raw extracted text."
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[image_part, prompt],
            config=types.GenerateContentConfig(
                temperature=0.0, # Deterministic extraction
            )
        )
        
        extracted_text = response.text if response.text else ""
        return extracted_text, 1.0
        
    except Exception as e:
        print(f"Gemini API Error: {str(e)}")
        # Graceful degradation during network failure or API timeouts
        return f"OCR Extraction Failed: {str(e)}", 0.0
