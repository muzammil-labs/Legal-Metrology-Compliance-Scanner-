import os, io, mimetypes
from typing import Tuple
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

def extract_label_with_gemini(content: bytes) -> Tuple[str, dict, float]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not genai:
        return "Mocked extracted text (ERROR: google-genai SDK failed to import on Vercel)", {}, 0.5
    if not api_key:
        return "Mocked extracted text (ERROR: GEMINI_API_KEY is missing from environment variables)", {}, 0.5
    try:
        client = genai.Client(api_key=api_key)
        image_part = types.Part.from_bytes(data=content, mime_type="image/jpeg")
        prompt = """You are a Legal Metrology OCR engine for India's PCR 2011.

STEP 0 — IMAGE QUALITY AND SUBJECT CHECK (do this first before any OCR):
- If the image is too blurry, out of focus, overexposed, or has heavy glare making text unreadable, output ONLY this exact string and nothing else: IMAGE_QUALITY_POOR
- If the image does NOT show a packaged consumer product label (e.g., it shows a person, animal, landscape, selfie, random object, food without packaging, screenshot, blank wall etc.), output ONLY this exact string and nothing else: NOT_A_PACKAGED_PRODUCT

If the image passes Step 0, continue:

PART 1 — extract every word visible on this product label exactly as printed.
Preserve line breaks as \\n. Do not correct spelling. Do not skip any text.

PART 2 — after the raw text, output exactly one JSON block:
```json
{
  "manufacturer_name": null,
  "manufacturer_address": null,
  "manufacturer_pincode": null,
  "country_of_origin": null,
  "net_quantity_value": null,
  "net_quantity_unit": null,
  "mrp_value": null,
  "mrp_includes_taxes_declared": null,
  "mfg_date": null,
  "consumer_care_phone": null,
  "consumer_care_email": null,
  "unit_sale_price": null,
  "fssai_license_number": null,
  "veg_nonveg_symbol": null,
  "hindi_mrp": null,
  "brand_name": null
}
```
Use null for any field not visible. Do not invent values."""
        fallback_models = [
            "gemini-2.5-flash", "gemini-1.5-flash",
            "gemini-2.0-flash-lite-preview-02-05",
            "gemini-1.5-flash-8b", "gemini-1.5-pro"
        ]
        last_error = None
        for model_name in fallback_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[image_part, prompt],
                    config=types.GenerateContentConfig(temperature=0.0)
                )
                import re as _re, json as _json
                raw = response.text or ""
                match = _re.search(r'```json\s*([\s\S]*?)\s*```', raw, _re.IGNORECASE)
                if match:
                    raw_text = raw[:match.start()].strip()
                    try:
                        structured = _json.loads(match.group(1))
                        return raw_text, structured, 1.0
                    except Exception:
                        return raw_text, {}, 0.7
                return raw.strip(), {}, 0.6
            except Exception as model_err:
                last_error = str(model_err)
                continue
        raise Exception(f"All fallback models failed. Last error: {last_error}")
    except Exception as e:
        return f"OCR Extraction Failed: {str(e)}", {}, 0.0
