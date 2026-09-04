from schemas import PDPFontEvaluation

def estimate_pdp_area(width_cm: float, height_cm: float) -> float:
    """
    Calculate Principal Display Panel bounding box surface area
    (A_PDP = Width x Height).
    """
    return round(width_cm * height_cm, 2)

def get_mandatory_font_height(pdp_area_sq_cm: float) -> float:
    """
    Schedule II minimum numeral/letter height based on PDP surface area:
    - Area <= 50 cm²: 1.0 mm
    - 50 < Area <= 100 cm²: 1.5 mm
    - 100 < Area <= 500 cm²: 2.5 mm
    - 500 < Area <= 2500 cm²: 4.0 mm
    - Area > 2500 cm²: 6.0 mm
    """
    if pdp_area_sq_cm <= 50:
        return 1.0
    elif pdp_area_sq_cm <= 100:
        return 1.5
    elif pdp_area_sq_cm <= 500:
        return 2.5
    elif pdp_area_sq_cm <= 2500:
        return 4.0
    else:
        return 6.0

def evaluate_pdp_font_compliance(width_cm: float, height_cm: float, measured_font_height_mm: float) -> PDPFontEvaluation:
    area = estimate_pdp_area(width_cm, height_cm)
    mandatory_min = get_mandatory_font_height(area)
    is_pass = measured_font_height_mm >= mandatory_min
    status = "PASS" if is_pass else "FAIL"
    details = f"For PDP area {area} cm², statutory minimum font height is {mandatory_min} mm. Measured: {measured_font_height_mm} mm."
    
    return PDPFontEvaluation(
        estimated_pdp_area_sq_cm=area,
        mandatory_min_font_height_mm=mandatory_min,
        measured_font_height_mm=measured_font_height_mm,
        font_size_compliance=status,
        details=details
    )
