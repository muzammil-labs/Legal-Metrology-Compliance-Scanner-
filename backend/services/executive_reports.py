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
import csv
from io import BytesIO, StringIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from schemas import AnalyticsSummary

def generate_executive_pdf_report(summary: AnalyticsSummary) -> bytes:
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
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'GovHeaderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        alignment=1, # Center
        textColor=colors.HexColor('#0f172a'),
    )
    subtitle_style = ParagraphStyle(
        'GovHeaderSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        alignment=1,
        textColor=colors.HexColor('#b45309'),
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
    )
    body_text = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1e293b'),
    )

    elements = []

    # Header
    elements.append(Paragraph("GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS", title_style))
    elements.append(Paragraph("DEPARTMENT OF CONSUMER AFFAIRS — LEGAL METROLOGY DIVISION", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("EXECUTIVE INTELLIGENCE REPORT", ParagraphStyle('SubSub', parent=title_style, fontSize=12, leading=15)))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceAfter=10))

    # Metrics Summary
    elements.append(Paragraph("KPI & COMPLIANCE SUMMARY", section_heading))
    elements.append(Spacer(1, 5))

    fines_collected = f"Rs. {summary.failed_inspections * 5000:,}"

    metrics_data = [
        [Paragraph("<b>Total Audits:</b>", body_text), Paragraph(str(summary.total_inspections), body_text)],
        [Paragraph("<b>Compliance Rate:</b>", body_text), Paragraph(f"{summary.compliance_rate}%", body_text)],
        [Paragraph("<b>Active Districts:</b>", body_text), Paragraph(str(summary.active_districts), body_text)],
        [Paragraph("<b>Compounding Fines (Est.):</b>", body_text), Paragraph(fines_collected, body_text)],
    ]
    t_metrics = Table(metrics_data, colWidths=[200, 300])
    t_metrics.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t_metrics)
    elements.append(Spacer(1, 15))

    # Regional Breakdown
    elements.append(Paragraph("REGIONAL BREAKDOWN", section_heading))
    elements.append(Spacer(1, 5))
    regional_data = [[Paragraph("<b>Region</b>", body_text), Paragraph("<b>Total Inspections</b>", body_text), Paragraph("<b>Non-Compliant</b>", body_text)]]
    for region, total in summary.by_region.items():
        nc = summary.regional_non_compliance.get(region, 0)
        regional_data.append([Paragraph(region, body_text), Paragraph(str(total), body_text), Paragraph(str(nc), body_text)])

    if len(regional_data) > 1:
        t_regions = Table(regional_data, colWidths=[200, 150, 150])
        t_regions.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t_regions)
    else:
        elements.append(Paragraph("No regional data available.", body_text))

    elements.append(Spacer(1, 15))

    # Top Violations
    elements.append(Paragraph("TOP STATUTORY INFRACTIONS", section_heading))
    elements.append(Spacer(1, 5))
    violation_data = [[Paragraph("<b>Rule</b>", body_text), Paragraph("<b>Count</b>", body_text)]]
    for v in summary.top_violations:
        violation_data.append([Paragraph(v.rule, body_text), Paragraph(str(v.count), body_text)])

    if len(violation_data) > 1:
        t_violations = Table(violation_data, colWidths=[400, 100])
        t_violations.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(t_violations)
    else:
        elements.append(Paragraph("No violations recorded.", body_text))

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
def generate_excel_export(rows) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["inspection_id", "inspected_at", "region", "source_filename", "overall_status", "violation_count", "trust_score"])
    for row in rows:
        writer.writerow([row.id, row.inspected_at.isoformat(), row.region, row.source_filename, row.overall_status, len(row.violations), row.trust_score])
    return output.getvalue()
