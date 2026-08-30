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


def generate_excel_export(rows) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["inspection_id", "inspected_at", "region", "source_filename", "overall_status", "violation_count", "trust_score"])
    for row in rows:
        writer.writerow([row.id, row.inspected_at.isoformat(), row.region, row.source_filename, row.overall_status, len(row.violations), row.trust_score])
    return output.getvalue()
