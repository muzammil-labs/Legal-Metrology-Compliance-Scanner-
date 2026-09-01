import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import openpyxl

from schemas import ExecutiveAnalyticsResponse

def generate_executive_pdf_report(summary: ExecutiveAnalyticsResponse) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    story.append(Paragraph("STATE CONSUMER AFFAIRS COMMISSION", title_style))
    story.append(Paragraph("Executive Legal Metrology Intelligence Report", styles['Normal']))
    story.append(Spacer(1, 12))

    summary_data = [
        ["Reporting Period:", summary.reporting_month, "Total Statewide Inspections:", str(summary.total_inspections_statewide)],
        ["Aggregate Compliance Rate:", f"{summary.state_aggregate_compliance_rate:.1f}%", "Generated At:", summary.generated_at]
    ]
    t_summary = Table(summary_data, colWidths=[130, 140, 140, 130])
    t_summary.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#334155')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 16))

    table_data = [["District", "Inspections", "Compliance %", "Penalties (INR)", "Top Violation"]]
    for d in summary.districts:
        table_data.append([
            d.district_name,
            str(d.total_inspections),
            f"{d.compliance_rate:.1f}%",
            f"Rs. {d.total_penalties_levied_inr:,}",
            d.top_statutory_violation
        ])

    t_districts = Table(table_data, colWidths=[100, 70, 80, 110, 180])
    t_districts.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ALIGN', (1, 0), (3, -1), 'CENTER'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
    ]))
    story.append(t_districts)
    doc.build(story)
    return buffer.getvalue()

def generate_excel_export(summary: ExecutiveAnalyticsResponse) -> bytes:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "District Intelligence"

    ws.append(["District Name", "Total Inspections", "Compliance Rate %", "Penalties Levied (INR)", "Top Statutory Violation", "Repeat Offender Brands"])
    for d in summary.districts:
        ws.append([
            d.district_name,
            d.total_inspections,
            d.compliance_rate,
            d.total_penalties_levied_inr,
            d.top_statutory_violation,
            ", ".join(d.repeat_offender_brands)
        ])

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
