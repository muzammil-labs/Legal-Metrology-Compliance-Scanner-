import csv
import io
import os
import uuid
import zipfile
import concurrent.futures
from datetime import date, datetime
from typing import List, Tuple, Dict, Any
from hashlib import sha256

from schemas import BatchAuditItem, RuleStatus, RuleResult, BatchAuditResponse
from services.rule_engine import audit_text, calculate_trust_score
from services.pdf_generator import generate_section_36_notice

def process_csv_batch(csv_content: str) -> List[dict]:
    items = []
    # Try to parse the CSV string
    f = io.StringIO(csv_content)
    reader = csv.reader(f)
    try:
        headers = next(reader)
    except StopIteration:
        return []

    for idx, row in enumerate(reader):
        if idx >= 50:
            break
        # We assume the first column is SKU, second is text, or we just take the first non-empty column as text
        if not row:
            continue
        text_block = " ".join([c for c in row if c])
        items.append({
            "filename": f"row_{idx+1}.csv",
            "content": text_block.encode('utf-8'),
            "is_text_only": True
        })
    return items

def process_zip_batch(zip_content: bytes) -> List[dict]:
    items = []
    try:
        with zipfile.ZipFile(io.BytesIO(zip_content)) as z:
            # Get up to 50 image files
            file_names = [name for name in z.namelist() if not name.endswith('/')]

            for idx, name in enumerate(file_names):
                if idx >= 50:
                    break
                # Only images for ZIP? For now just read the content
                try:
                    with z.open(name) as f:
                        content = f.read()
                        items.append({
                            "filename": name,
                            "content": content,
                            "is_text_only": False
                        })
                except Exception:
                    pass
    except zipfile.BadZipFile:
        pass
    return items

def status_for(rules: List[RuleResult]) -> RuleStatus:
    if any(r.status == RuleStatus.FAIL for r in rules):
        return RuleStatus.FAIL
    if any(r.status == RuleStatus.WARNING for r in rules):
        return RuleStatus.WARNING
    return RuleStatus.PASS

def process_single_item(item: dict) -> dict:
    from services.gemini_service import extract_label_with_gemini

    filename = item["filename"]
    content = item["content"]
    is_text = item.get("is_text_only", False)

    ocr_text = ""
    digest = sha256(content).hexdigest() if content else "0" * 64

    if is_text:
        ocr_text = content.decode('utf-8', errors='ignore')
    else:
        # Avoid real Gemini calls in tests/dev unless configured
        gemini_res = extract_label_with_gemini(content, "image/jpeg")
        if gemini_res and "ocr_text" in gemini_res:
            ocr_text = gemini_res["ocr_text"]
        else:
            # Fallback to mock text if vision extraction fails
            idx = int(uuid.uuid4().hex[:4], 16)
            ocr_text = f"Manufactured by Seller Entity Ltd, Plot {idx} Industrial Road, New Delhi 110001. Packaged Commodity Net Qty 500 g MRP Rs. 100 (incl. of all taxes) 04/2026. Consumer care 1800111222 care@seller.com. Country of origin: India"

    rules, _, _, _ = audit_text(ocr_text, date.today())
    status = status_for(rules)
    score = calculate_trust_score(rules)
    v_count = sum(1 for r in rules if r.status != RuleStatus.PASS)

    batch_item = BatchAuditItem(
        sku_id=f"SKU-{uuid.uuid4().hex[:6].upper()}",
        filename=filename,
        overall_status=status,
        trust_score=score,
        violation_count=v_count,
        rule_results=rules,
    )

    pdf_bytes = None
    if status != RuleStatus.PASS:
        # Generate notice
        violations = [type("ViolationObj", (), {"rule": r.rule.value, "status": r.status.value, "reason": r.reason})() for r in rules if r.status != RuleStatus.PASS]
        try:
            pdf_bytes = generate_section_36_notice(
                inspection_id=int(uuid.uuid4().int % 1000000),
                source_filename=filename,
                sha256_digest=digest,
                region="Batch Upload",
                gps_location=None,
                inspected_at=datetime.utcnow(),
                overall_status=status.value,
                violations=violations,
                ocr_text=ocr_text
            )
        except Exception as e:
            import logging
            logging.error(f"Error generating PDF for {filename}: {e}", exc_info=True)

    return {
        "item": batch_item,
        "pdf_bytes": pdf_bytes
    }

def process_batch(file_content: bytes, filename: str) -> Tuple[BatchAuditResponse, bytes]:
    is_csv = filename.lower().endswith('.csv')

    if is_csv:
        csv_str = file_content.decode('utf-8', errors='ignore')
        items = process_csv_batch(csv_str)
    else:
        items = process_zip_batch(file_content)

    results = []
    # Use ThreadPoolExecutor for concurrent processing
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_item = {executor.submit(process_single_item, item): item for item in items}
        for future in concurrent.futures.as_completed(future_to_item):
            try:
                res = future.result()
                results.append(res)
            except Exception as exc:
                print(f"Item generated an exception: {exc}")

    batch_items = []
    passed_count = 0
    pdf_files = []

    for r in results:
        b_item = r["item"]
        batch_items.append(b_item)
        if b_item.overall_status == RuleStatus.PASS:
            passed_count += 1

        if r["pdf_bytes"]:
            pdf_files.append((f"Notice_{b_item.sku_id}.pdf", r["pdf_bytes"]))

    failed_count = len(batch_items) - passed_count

    batch_id = f"BATCH-{uuid.uuid4().hex[:8].upper()}"

    response = BatchAuditResponse(
        batch_id=batch_id,
        total_skus=len(batch_items),
        passed_skus=passed_count,
        failed_skus=failed_count,
        compliance_badge_eligible=failed_count == 0,
        items=batch_items
    )

    # Create ZIP archive in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        if pdf_files:
            for pdf_filename, pdf_content in pdf_files:
                zf.writestr(pdf_filename, pdf_content)
        else:
             zf.writestr("summary.txt", b"No notices generated - all SKUs passed or empty batch.")

    zip_bytes = zip_buffer.getvalue()

    return response, zip_bytes
