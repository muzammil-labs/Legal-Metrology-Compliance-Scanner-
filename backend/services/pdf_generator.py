from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

def generate_notice_pdf(inspection, document_title):
    output = BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72, title=document_title)

    styles = getSampleStyleSheet()
    title_style = styles["Heading1"]
    title_style.alignment = 1 # Center
    normal_style = styles["Normal"]

    elements = []

    # Official government letterhead
    elements.append(Paragraph("<b>DEPARTMENT OF CONSUMER AFFAIRS - NOTICE OF COMPOUNDING / DEMAND</b>", title_style))
    elements.append(Spacer(1, 20))

    # Metadata header: Inspection ID, Device Timestamp, Store Name, GPS Coordinates
    metadata_data = [
        ["Inspection ID", f"LM-{inspection.id:08d}"],
        ["Device Timestamp", str(inspection.inspected_at)],
        ["Store Name", "N/A"], # Not present in Inspection model, use N/A
        ["GPS Coordinates", "N/A"] # Not present in Inspection model, use N/A
    ]

    metadata_table = Table(metadata_data, colWidths=[150, 300])
    metadata_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(metadata_table)
    elements.append(Spacer(1, 20))

    # Additional Inspection Data
    elements.append(Paragraph(f"<b>Product file:</b> {inspection.source_filename}", normal_style))
    elements.append(Paragraph(f"<b>Region:</b> {inspection.region}", normal_style))
    elements.append(Paragraph(f"<b>Status:</b> {inspection.overall_status}", normal_style))
    elements.append(Spacer(1, 20))

    # Violations Table (clean multi-page wrapping)
    if inspection.violations:
        elements.append(Paragraph("<b>Violations:</b>", styles["Heading3"]))
        elements.append(Spacer(1, 10))

        violations_data = [["Rule", "Reason"]]
        for violation in inspection.violations:
            violations_data.append([
                Paragraph(violation.rule, normal_style),
                Paragraph(violation.reason, normal_style)
            ])

        violations_table = Table(violations_data, colWidths=[100, 350], repeatRows=1)
        violations_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        elements.append(violations_table)
        elements.append(Spacer(1, 30))

    # Immutable SHA-256 Digital Signature Hash banner at the bottom
    elements.append(Spacer(1, 50))
    elements.append(Paragraph(f"<b>Immutable SHA-256 Hash:</b> {inspection.sha256}", normal_style))

    doc.build(elements)

    return output.getvalue()
