from io import BytesIO
from sqlalchemy.orm import Session
from sqlalchemy import func
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import openpyxl
from decimal import Decimal

from models import Inspection, Violation
from schemas import RuleStatus

def generate_executive_pdf_report(db: Session) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    elements = []
    styles = getSampleStyleSheet()

    title_style = styles['Heading1']
    title_style.alignment = 1 # Center

    heading_style = styles['Heading2']
    heading_style.spaceAfter = 10

    body_style = styles['Normal']

    elements.append(Paragraph("Executive Intelligence Report", title_style))
    elements.append(Spacer(1, 20))

    # 1. Total Audits & Compliance Rate
    total_audits = db.query(Inspection).count()
    compliant_audits = db.query(Inspection).filter(Inspection.overall_status == "PASS").count()
    compliance_rate = (compliant_audits / total_audits * 100) if total_audits > 0 else 0

    elements.append(Paragraph("1. Audit Overview", heading_style))
    elements.append(Paragraph(f"Total Audits Conducted: {total_audits}", body_style))
    elements.append(Paragraph(f"Compliant Audits: {compliant_audits}", body_style))
    elements.append(Paragraph(f"Compliance Rate: {compliance_rate:.2f}%", body_style))
    elements.append(Spacer(1, 15))

    # 2. Collected Compounding Fines
    # Estimate based on violations for simplicity in this report
    from services.rule_engine import calculate_compounding_fine

    total_fine_min = 0
    total_fine_max = 0

    inspections_with_violations = db.query(Inspection).filter(Inspection.overall_status != "PASS").all()
    for insp in inspections_with_violations:
        fine = calculate_compounding_fine(insp.violations)
        if fine:
            total_fine_min += fine.min_penalty_inr
            total_fine_max += fine.max_penalty_inr

    elements.append(Paragraph("2. Compounding Fines (Estimated)", heading_style))
    elements.append(Paragraph(f"Total Minimum Estimated Fines: INR {total_fine_min}", body_style))
    elements.append(Paragraph(f"Total Maximum Estimated Fines: INR {total_fine_max}", body_style))
    elements.append(Spacer(1, 15))

    # 3. Repeat Offender Brand Rankings (Top 5)
    # Using source_filename as a proxy for brand/SKU for simplicity
    elements.append(Paragraph("3. Top Non-Compliant Brands / SKUs", heading_style))

    offenders = db.query(
        Inspection.source_filename,
        func.count(Inspection.id).label('fail_count')
    ).filter(
        Inspection.overall_status != "PASS"
    ).group_by(
        Inspection.source_filename
    ).order_by(
        func.count(Inspection.id).desc()
    ).limit(5).all()

    if offenders:
        data = [["Brand / SKU", "Non-Compliant Audits"]]
        for off in offenders:
            data.append([off.source_filename, str(off.fail_count)])

        t = Table(data, colWidths=[300, 150])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ]))
        elements.append(t)
    else:
        elements.append(Paragraph("No non-compliant records found.", body_style))

    doc.build(elements)
    return buffer.getvalue()


def generate_excel_export(db: Session) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "District Audit Logs"

    headers = ["Inspection ID", "Date", "Region", "GPS Location", "Status", "Trust Score", "Violations"]
    ws.append(headers)

    inspections = db.query(Inspection).order_by(Inspection.inspected_at.desc()).all()

    for insp in inspections:
        ws.append([
            insp.id,
            insp.inspected_at.strftime("%Y-%m-%d %H:%M:%S") if insp.inspected_at else "",
            insp.region,
            insp.gps_location,
            insp.overall_status,
            insp.trust_score,
            len(insp.violations) if insp.violations else 0
        ])

    buffer = BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
