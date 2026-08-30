from schemas import PenaltyEstimate, StatutoryRule

def calculate_penalty(failed_rules: list[str]) -> PenaltyEstimate | None:
    if not failed_rules:
        return None

    sections_violated = set()
    estimated_fine_range = ""
    jan_vishwas_eligible = False
    grace_period_days = None
    director_liability = False

    # Check Section 49: Corporate Director Liability
    if StatutoryRule.RULE_6_1_A in failed_rules:
        sections_violated.add("Section 49")
        director_liability = True

    # Check Section 36 Tier-1 (Repeat Offence / Deceptive Fraud)
    tier_1_rules = {
        StatutoryRule.RULE_6_1_C,
        StatutoryRule.RULE_6_11,
        StatutoryRule.RULE_5,
        StatutoryRule.RULE_5_PDP,
        StatutoryRule.BILINGUAL
    }

    has_tier_1 = any(rule in failed_rules for rule in tier_1_rules)

    # Check Section 38 (Short Measure / Quantity Misrepresentation)
    has_section_38 = "Section 38" in failed_rules
    if has_section_38:
        sections_violated.add("Section 38")

    # Check Section 36 Procedural (Jan Vishwas Improvement Notice)
    procedural_rules = {
        StatutoryRule.RULE_6_1_B,
        StatutoryRule.RULE_6_1_D,
        StatutoryRule.RULE_6_1_E,
        StatutoryRule.RULE_6_1_F
    }

    has_procedural = any(rule in failed_rules for rule in procedural_rules)

    if has_tier_1 or has_procedural:
        sections_violated.add("Section 36")

    # Determine Fine Range and Jan Vishwas eligibility
    sections_list = sorted(list(sections_violated))

    if "Section 38" in sections_list:
        estimated_fine_range = "Up to ₹1,000,000"
    elif has_tier_1:
        # Tier-1 gets precedence over Jan Vishwas
        if "Section 49" in sections_list:
            estimated_fine_range = "₹50,000 - ₹1,00,000"
        else:
            estimated_fine_range = "₹25,000 - ₹50,000"
    elif has_procedural:
        # Only procedural rules
        estimated_fine_range = "₹0 (Immediate) / ₹25,000 (Post-Grace)"
        jan_vishwas_eligible = True
        grace_period_days = "15-30"
        if "Section 49" in sections_list:
            estimated_fine_range = "₹10,000 - ₹25,000" # Director liability might still apply
    elif "Section 49" in sections_list:
        estimated_fine_range = "₹10,000 - ₹25,000"
    else:
        estimated_fine_range = "₹10,000 - ₹50,000"

    return PenaltyEstimate(
        sections_violated=sections_list,
        estimated_fine_range=estimated_fine_range,
        jan_vishwas_eligible=jan_vishwas_eligible,
        grace_period_days=grace_period_days,
        director_liability=director_liability
    )
