import csv
import io
import os
import uuid
import zipfile
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, date
from fastapi import UploadFile
from typing import Dict, Tuple

from schemas import BatchAuditResponse, BatchAuditItem, RuleStatus
from services.rule_engine import audit_text, calculate_trust_score
from services.gemini_service import extract_label_with_gemini
from services.pdf_generator import generate_section_36_notice
from services.fine_calculator import calculate_penalty

def _process_image_sync(img_name: str, img_bytes: bytes) -> tuple:
    extracted = extract_label_with_gemini(img_bytes)
    text = extracted.get("ocr_text", "")

    rules, usp, extracted_fields, penalty, fine = audit_text(text, audit_date=date.today())

    overall_status = RuleStatus.PASS
    if any(r.status == RuleStatus.FAIL for r in rules):
        overall_status = RuleStatus.FAIL
    elif any(r.status == RuleStatus.WARNING for r in rules):
        overall_status = RuleStatus.WARNING

    trust_score = calculate_trust_score(rules)
    violation_count = sum(1 for r in rules if r.status == RuleStatus.FAIL)

    sku_id = f"SKU-DOCA-{uuid.uuid4().hex[:6].upper()}"

    pdf_bytes = generate_section_36_notice(
        inspection_id=1,
        source_filename=img_name,
        sha256_digest="0"*64,
        region="Batch Processing",
        gps_location="Unknown",
        inspected_at=datetime.utcnow(),
        overall_status=overall_status.value,
        violations=[r for r in rules if r.status == RuleStatus.FAIL],
        ocr_text=text,
        penalty_data=penalty.model_dump() if penalty else None,
        fine_estimation=fine
    )

    item = BatchAuditItem(
        sku_id=sku_id,
        filename=img_name,
        overall_status=overall_status,
        trust_score=trust_score,
        violation_count=violation_count,
        rule_results=rules
    )
    return item, pdf_bytes, img_name

def _process_text_sync(text: str, idx: int) -> tuple:
    rules, usp, extracted_fields, penalty, fine = audit_text(text, audit_date=date.today())
    overall_status = RuleStatus.PASS
    if any(r.status == RuleStatus.FAIL for r in rules):
        overall_status = RuleStatus.FAIL
    elif any(r.status == RuleStatus.WARNING for r in rules):
        overall_status = RuleStatus.WARNING

    trust_score = calculate_trust_score(rules)
    violation_count = sum(1 for r in rules if r.status == RuleStatus.FAIL)
    sku_id = f"SKU-DOCA-{uuid.uuid4().hex[:6].upper()}"

    pdf_bytes = generate_section_36_notice(
        inspection_id=1,
        source_filename=f"row_{idx}.csv",
        sha256_digest="0"*64,
        region="Batch Processing",
        gps_location="Unknown",
        inspected_at=datetime.utcnow(),
        overall_status=overall_status.value,
        violations=[r for r in rules if r.status == RuleStatus.FAIL],
        ocr_text=text,
        penalty_data=penalty.model_dump() if penalty else None,
        fine_estimation=fine
    )
    item = BatchAuditItem(
        sku_id=sku_id,
        filename=f"row_{idx}.csv",
        overall_status=overall_status,
        trust_score=trust_score,
        violation_count=violation_count,
        rule_results=rules
    )
    return item, pdf_bytes, f"row_{idx}.csv"


async def process_batch(file: UploadFile) -> Tuple[BatchAuditResponse, bytes]:
    batch_id = f"BATCH-{datetime.utcnow().strftime('%Y')}-{str(uuid.uuid4())[:8].upper()}"

    items = []
    zip_buffer = io.BytesIO()

    content = await file.read()

    is_zip = file.filename.lower().endswith('.zip')
    is_csv = file.filename.lower().endswith('.csv')

    results = []
    loop = asyncio.get_running_loop()

    with ThreadPoolExecutor(max_workers=4) as pool:
        if is_zip:
            with zipfile.ZipFile(io.BytesIO(content)) as zf:
                image_names = [name for name in zf.namelist() if name.lower().endswith(('.png', '.jpg', '.jpeg'))][:50]

                tasks = []
                for img_name in image_names:
                    img_bytes = zf.read(img_name)
                    task = loop.run_in_executor(pool, _process_image_sync, img_name, img_bytes)
                    tasks.append(task)

                results = await asyncio.gather(*tasks)

        elif is_csv:
            csv_file = io.StringIO(content.decode('utf-8'))
            reader = csv.DictReader(csv_file)

            text_column = None
            if reader.fieldnames:
                for col in reader.fieldnames:
                    if 'text' in col.lower() or 'ocr' in col.lower() or 'label' in col.lower():
                        text_column = col
                        break
                if not text_column:
                    text_column = reader.fieldnames[0]

            tasks = []
            row_count = 0
            for row in reader:
                if row_count >= 50:
                    break
                text = row.get(text_column, "")
                task = loop.run_in_executor(pool, _process_text_sync, text, row_count)
                tasks.append(task)
                row_count += 1

            results = await asyncio.gather(*tasks)

    # generate zip with notices
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        for item, pdf_bytes, img_name in results:
            items.append(item)
            base_name = os.path.splitext(img_name)[0]
            zf.writestr(f"{base_name}_notice.pdf", pdf_bytes)

    total_skus = len(items)
    passed_skus = sum(1 for item in items if item.overall_status == RuleStatus.PASS)
    failed_skus = sum(1 for item in items if item.overall_status == RuleStatus.FAIL)
    compliance_badge_eligible = total_skus > 0 and passed_skus == total_skus

    response = BatchAuditResponse(
        batch_id=batch_id,
        total_skus=total_skus,
        passed_skus=passed_skus,
        failed_skus=failed_skus,
        compliance_badge_eligible=compliance_badge_eligible,
        items=items
    )

    zip_buffer.seek(0)
    return response, zip_buffer.read()
