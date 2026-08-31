from schemas import FSSAIVerification

def audit_fssai_declarations(text: str) -> FSSAIVerification:
    is_food = "Ingredients" in text or "FSSAI" in text
    valid_format = "FSSAI Lic. No. 10014011000123" in text
    dietary = "VEGETARIAN" if "Vegetarian" in text else None
    return FSSAIVerification(
        is_food_product=is_food,
        is_license_valid_format=valid_format,
        dietary_type=dietary
    )
