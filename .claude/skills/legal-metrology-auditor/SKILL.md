---
name: legal-metrology-auditor
description: "Automatically trigger whenever generating, editing, or testing statutory compliance logic, backend/services/rule_engine.py, Legal Metrology (Packaged Commodities) Rules 2011, Rule 6(1), or Rule 6(11) Unit Sale Price calculations."
---
# Legal Metrology (Packaged Commodities) Statutory Audit Engine

Act as a deterministic compliance reviewer for the Legal Metrology Act, 2009 and Legal Metrology (Packaged Commodities) Rules, 2011. The vision model may extract OCR text and coordinates only; it must never decide compliance. Python rules, regexes, and numeric calculations decide every result.

## Rule 6(1)(a): Identity and Address

Require a relationship prefix at the beginning of the declaration (allowing surrounding whitespace and case-insensitive matching):

```python
ENTITY_PREFIX_RE = r"(?i)^\s*(?:mfg\.?\s+by|manufactured\s+by|packed\s+by|pkd\.?\s+by|imported\s+by|marketed\s+by)\b"
PIN_RE = r"\b[1-9][0-9]{5}\b"
PHONE_RE = r"\b(?:\+91[ -]?)?[6-9][0-9]{9}\b|\b1800[ -]?[0-9]{3}[ -]?[0-9]{4}\b"
EMAIL_RE = r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b"
```

Reject a bare company name, a prefix without a name, or an address that lacks a six-digit Indian PIN. The address heuristic must find at least three geographic components: premises/street/plot/industrial area, city or district, state, and PIN. Treat `Imported by` as requiring a separate `Country of Origin: <country>` declaration. `Marketed by` does not replace the original manufacturer or packer declaration.

## Rule 6(1)(b): Commodity Name

Require a generic or common commodity name, not only a brand or trademark. Accept names such as `Instant Noodles`, `Wheat Flour`, and `Refined Sunflower Oil`; flag an isolated brand name. Preserve the raw OCR string in the response so a human can review ambiguous classifications.

## Rule 6(1)(c): Net Quantity and Units

Parse quantity and unit separately. Accept only these case-sensitive symbols: `g`, `kg`, `ml`, `l`, `mL`, `L`, `N`, `U`, `m`, `cm`, and `mm`. Use this token boundary to prevent partial matches:

```python
NET_QTY_RE = r"(?i)\b([0-9]+(?:\.[0-9]+)?)\s*(g|kg|ml|mL|l|L|N|U|m|cm|mm)\b"
```

The parser must reject `gm`, `gms`, `gm.`, `g.`, `ml.`, `ML`, `m.l.`, `ltr`, `litres`, `lit.`, `kg.`, `kgs`, and `k.g.` even when whitespace or punctuation differs. Do not normalize an invalid unit into a valid one. Emit a Rule 6(1)(c) failure with the exact offending token.

## Rule 6(1)(d): Date

Accept `MM/YYYY`, `MM/YY`, or an explicit calendar date such as `Best before DD/MM/YYYY`. Use strict calendar parsing for full dates, reject month values outside `01..12`, and flag any manufacture, packing, import, or best-before date in the future relative to the injected audit date. Never call the wall clock directly inside the rule engine; pass `audit_date` for deterministic tests.

## Rule 6(1)(e): MRP and Tax Inclusion

Require an MRP amount and one of these exact case-insensitive tax suffixes, allowing ordinary whitespace:

```python
TAX_INCLUSIVE_RE = r"(?i)\(\s*(?:incl\.?\s+of\s+all\s+taxes|inclusive\s+of\s+all\s+taxes)\s*\)"
MRP_RE = r"(?i)\bMRP\s*(?:RS\.?|INR|₹)?\s*[0-9]+(?:\.[0-9]{1,2})?\b"
```

`MRP Rs. 50/-`, `MRP Rs. 50`, `MRP + GST`, and `Taxes Extra` fail. Do not infer tax inclusion from a price alone. Preserve the parsed decimal amount as `Decimal`, never binary floating point.

## Rule 6(1)(f): Consumer Care

Require all four channels: a designation such as `Consumer Care Cell` or `Grievance Officer`; a postal address (or an explicit reference to the declared entity address); a phone matching `PHONE_RE`; and an email matching `EMAIL_RE`. A phone or email alone is insufficient.

## Rule 6(11): Unit Sale Price

For packs containing more than 1 kg, more than 1 L, or multiple pieces, require a declared unit sale price. Calculate deterministically:

$$\mathrm{USP}=\frac{\mathrm{MRP}}{\mathrm{Declared\ Net\ Quantity}}$$

Normalize mass to grams and volume to millilitres before comparing values. Use `Decimal` and round only the displayed result to two decimal places using `ROUND_HALF_UP`. Use `/ g` or `/ kg` for mass, and `/ ml` or `/ l` for volume, according to the declared base-unit policy. Permit an absolute difference of at most INR 0.01 between declared and calculated values; flag a missing, wrong-unit, non-numeric, or mathematically deceptive declaration.

## Response Contract

Return structured data matching the Pydantic V2 schemas already used by the project. Every rule result must include a stable rule identifier, boolean `compliant`, raw evidence, a human-readable reason, and any calculated values. Do not add undocumented fields or silently coerce malformed OCR into compliance.

## Test Enforcement

When modifying `backend/services/rule_engine.py`, update `tests/test_rules.py` in the same change and run `pytest tests/`. Tests must cover:

1. A valid baseline product with all six Rule 6(1) checks and valid USP.
2. `MRP Rs. 100/-` failing Rule 6(1)(e).
3. `500 gm` failing Rule 6(1)(c), including the exact token.
4. A USP rounding mismatch such as declared `0.40/g` versus actual `0.50/g` failing Rule 6(11).
5. Imported goods without country of origin, incomplete PIN/address, future dates, invalid phone/email, and brand-only commodity names.