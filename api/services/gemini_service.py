import os, io, mimetypes
from typing import Tuple
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

def _clean_raw_text(raw_text: str) -> str:
    """Strip Gemini's own markdown headers/formatting from the OCR output,
    leaving only the actual label text for the rule engine."""
    import re
    # Remove markdown headers like ### PART 1: ..., ### PART 2: ..., etc.
    cleaned = re.sub(r'#{1,4}\s*(?:PART|Part)\s*\d+[^\\n]*(?:\\n|\n)?', '', raw_text)
    # Remove markdown bold/italic markers
    cleaned = re.sub(r'\*{1,3}', '', cleaned)
    # Remove lines that are just Gemini commentary (starts with parentheses)
    cleaned = re.sub(r'^\s*\(.*?\)\s*$', '', cleaned, flags=re.MULTILINE)
    # Convert literal \n sequences to actual newlines for regex matching
    cleaned = cleaned.replace('\\n', '\n')
    # Collapse multiple blank lines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    return cleaned.strip()


def extract_label_with_gemini(content: bytes, mime_type: str = "image/jpeg") -> Tuple[str, dict, float]:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not genai:
        return "Mocked extracted text (ERROR: google-genai SDK failed to import on Vercel)", {}, 0.5
    if not api_key:
        return "Mocked extracted text (ERROR: GEMINI_API_KEY is missing from environment variables)", {}, 0.5
    try:
        client = genai.Client(api_key=api_key)
        
        if mime_type.startswith("video/"):
            import tempfile, time
            suffix = ".mp4"
            if mime_type == "video/webm": suffix = ".webm"
            elif mime_type == "video/quicktime": suffix = ".mov"
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file.write(content)
                temp_path = temp_file.name
                
            try:
                uploaded_file = client.files.upload(file=temp_path)
                
                # Wait for video processing
                while str(uploaded_file.state) in ("PROCESSING", "State.PROCESSING", "1"):
                    time.sleep(2)
                    uploaded_file = client.files.get(name=uploaded_file.name)
                
                if str(uploaded_file.state) in ("FAILED", "State.FAILED", "2"):
                    raise Exception("Video processing failed in Gemini API.")
                    
                image_part = uploaded_file
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        else:
            image_part = types.Part.from_bytes(data=content, mime_type=mime_type)

        prompt = """Look at this product packaging label image carefully. Extract ALL text visible on the label.

OUTPUT FORMAT — you MUST output exactly two sections:

SECTION 1 — RAW TEXT:
Type out every single word, number, and symbol you can see on the product label, preserving line breaks. Include everything: brand name, ingredients, addresses, phone numbers, dates, weights, prices, barcodes text, FSSAI numbers, etc. Do NOT add any commentary, headers, or markdown formatting. Just the raw text as printed on the label.

SECTION 2 — STRUCTURED DATA:
After the raw text, output exactly one JSON code block with these fields extracted from what you see:
```json
{
  "manufacturer_name": "exact name as printed or null",
  "manufacturer_address": "full address as printed or null",
  "manufacturer_pincode": "6-digit PIN code or null",
  "country_of_origin": "country name or null",
  "net_quantity_value": "numeric value only or null",
  "net_quantity_unit": "g, kg, ml, l, etc. or null",
  "mrp_value": "numeric price value only or null",
  "mrp_includes_taxes_declared": "yes if 'incl of all taxes' is printed, no if not, null if no MRP found",
  "mfg_date": "date as printed or null",
  "consumer_care_phone": "phone number or null",
  "consumer_care_email": "email address or null",
  "unit_sale_price": "price per unit as printed or null",
  "fssai_license_number": "FSSAI number or null",
  "veg_nonveg_symbol": "VEG or NONVEG or null",
  "hindi_mrp": "Hindi MRP text or null",
  "brand_name": "brand name or null"
}
```

IMPORTANT RULES:
- For mrp_includes_taxes_declared: look for phrases like "incl. of all taxes", "inclusive of all taxes", "MRP inclusive of all taxes". Set to "yes" if found anywhere on the label.
- For manufacturer_pincode: look for any 6-digit number in the manufacturer/packer address (Indian PIN codes start with 1-9).
- Extract the ACTUAL values you see. Use null ONLY for fields genuinely not visible on the label.
- Do NOT wrap the raw text in markdown headers or formatting."""

        fallback_models = [
            "gemini-3.8-flash",
            "gemini-3.6-flash",
            "gemini-3.5-flash",
        ]
        errors = []
        for model_name in fallback_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[image_part, prompt],
                    config=types.GenerateContentConfig(temperature=0.0)
                )
                import re as _re, json as _json
                raw = response.text or ""
                match = _re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw, _re.IGNORECASE)
                
                json_str = None
                raw_text = raw
                
                if match:
                    raw_text = raw[:match.start()].strip()
                    json_str = match.group(1)
                else:
                    # Fallback: find the first { and last }
                    start_idx = raw.find('{')
                    end_idx = raw.rfind('}')
                    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                        raw_text = raw[:start_idx].strip()
                        json_str = raw[start_idx:end_idx+1]

                # Clean up Gemini's own headers/formatting from raw text
                raw_text = _clean_raw_text(raw_text)
                        
                if json_str:
                    try:
                        structured = _json.loads(json_str)
                        # Normalize: convert None/"null" string values to None,
                        # and strip whitespace from string values
                        for k, v in structured.items():
                            if isinstance(v, str):
                                v = v.strip()
                                if v.lower() in ('null', 'none', 'n/a', ''):
                                    structured[k] = None
                                else:
                                    structured[k] = v
                        return raw_text, structured, 1.0
                    except Exception:
                        return raw_text, {}, 0.7
                        
                return raw_text, {}, 0.6
            except Exception as model_err:
                err_str = str(model_err)
                errors.append(f"{model_name}: {err_str}")
                continue
                
        error_summary = " | ".join(errors)
        if "429" in error_summary or "quota" in error_summary.lower() or "exhausted" in error_summary.lower() or "high demand" in error_summary.lower():
            return "Mocked extracted text (ERROR: Gemini API Quota Exhausted or Models in High Demand. Please use DEMO MODE.)", {}, 0.0
            
        raise Exception(f"All fallback models failed. Errors: {error_summary}")
    except Exception as e:
        return f"OCR Extraction Failed: {str(e)}", {}, 0.0
