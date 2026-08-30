import os
import json
import logging
from typing import Optional

logger = logging.getLogger("gemini_service")

SYSTEM_INSTRUCTION = """
You are a Legal Metrology high-precision Optical Character Recognition (OCR) extractor.
Your job is to read all printed text from the packaged commodity image and extract mandatory declaration tokens.
DO NOT judge legal compliance. ONLY transcribe the visible text accurately, preserving exact numbers, symbols, and units.

Extract and output a JSON object matching this schema:
{
  "ocr_text": "Full concatenated text of all visible packaging declarations",
  "product_name": "Generic or brand name of commodity",
  "net_quantity": "e.g. 500 g or 1 kg or 200 ml",
  "mrp": "e.g. MRP Rs. 100 (incl. of all taxes)",
  "usp": "e.g. Rs. 0.20 / g",
  "date_of_packing": "e.g. 03/2026",
  "manufacturer_details": "Manufacturer/Packer name, address with PIN code",
  "consumer_care": "Consumer care phone, email, contact",
  "country_of_origin": "e.g. India (if specified)",
  "bounding_boxes": [
    {
      "label": "Declaration field name (e.g. mrp, net_quantity, manufacturer_details)",
      "text": "Exact text content within this bounding box",
      "box": [0.0, 0.0, 0.0, 0.0]
    }
  ]
}

For bounding_boxes, provide normalized coordinates as [ymin, xmin, ymax, xmax] where each value is between 0.0 and 1.0 relative to image dimensions. Include a bounding box entry for each distinct mandatory declaration block visible on the label.
"""

def extract_label_with_gemini(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Calls Gemini 2.5 Flash to extract raw OCR text tokens from package image.
    Falls back gracefully if API key is invalid or unavailable.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.info("GEMINI_API_KEY not set. Using vision heuristic fallback.")
        return {}

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                "Extract all Legal Metrology mandatory packaging declarations from this label image into the requested JSON schema."
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )
        if response.text:
            return json.loads(response.text)
    except Exception as e:
        logger.warning(f"Gemini vision call failed or degraded: {e}. Falling back.")
    return {}
