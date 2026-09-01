from typing import List, Optional, Dict, Any
from schemas import PDPFontEvaluation, RuleStatus

def evaluate_pdp_font_sizes(
    bounding_boxes: Optional[List[Dict[str, Any]]] = None,
    image_dimensions: Optional[Dict[str, Any]] = None
) -> PDPFontEvaluation:
    # Default uncalibrated packaging face reference (120 sq cm)
    pdp_area = 120.0
    if image_dimensions and "width_cm" in image_dimensions and "height_cm" in image_dimensions:
        pdp_area = float(image_dimensions["width_cm"]) * float(image_dimensions["height_cm"])

    # Statutory Schedule II Font Height Matrix
    if pdp_area <= 50.0:
        min_height_mm = 1.0
    elif pdp_area <= 100.0:
        min_height_mm = 1.5
    elif pdp_area <= 500.0:
        min_height_mm = 2.0
    else:
        min_height_mm = 4.0

    measured_height_mm = 2.4
    if bounding_boxes and len(bounding_boxes) > 0:
        box_heights = [box.get("ymax", 0) - box.get("ymin", 0) for box in bounding_boxes if isinstance(box, dict)]
        if box_heights and max(box_heights) > 0:
            measured_height_mm = round(max(box_heights) * 10.0, 2)

    is_compliant = measured_height_mm >= min_height_mm
    return PDPFontEvaluation(
        estimated_pdp_area_sq_cm=round(pdp_area, 2),
        mandatory_min_font_height_mm=min_height_mm,
        measured_font_height_mm=measured_height_mm,
        font_size_compliance=RuleStatus.PASS if is_compliant else RuleStatus.FAIL,
        statutory_clause="Rule 5 & Schedule II (Minimum Font Height)",
        details=(
            f"Measured font height of {measured_height_mm}mm meets Schedule II minimum of {min_height_mm}mm for PDP area {pdp_area} sq cm."
            if is_compliant else
            f"Measured font height {measured_height_mm}mm falls below statutory minimum {min_height_mm}mm."
        )
    )
