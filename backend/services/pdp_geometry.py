def calculate_pdp_area(width_cm: float, height_cm: float) -> float:
    """
    Calculate Principal Display Panel bounding box surface area.
    """
    return width_cm * height_cm

def get_required_font_height(pdp_area_cm2: float, is_net_qty: bool = False) -> float:
    """
    Evaluate mandatory declaration bounding box heights against Schedule II font size tables.
    """
    if pdp_area_cm2 <= 50:
        return 1.0
    elif pdp_area_cm2 <= 100:
        return 1.5
    elif pdp_area_cm2 <= 500:
        return 2.0
    else:
        return 6.0 if is_net_qty else 4.0
