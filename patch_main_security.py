with open("backend/main.py", "r") as f:
    content = f.read()

old_download = """@app.get("/api/v1/batch-audit/download/{batch_id}")
def v1_batch_audit_download(batch_id: str):
    \"\"\"Download generated PDF notices as a ZIP archive.\"\"\"
    temp_dir = tempfile.gettempdir()
    zip_path = os.path.join(temp_dir, f"{batch_id}_notices.zip")"""

new_download = """import re

@app.get("/api/v1/batch-audit/download/{batch_id}")
def v1_batch_audit_download(batch_id: str):
    \"\"\"Download generated PDF notices as a ZIP archive.\"\"\"
    # Prevent path traversal by ensuring batch_id only contains alphanumeric characters and hyphens
    if not re.match(r"^[A-Z0-9\-]+$", batch_id):
        raise HTTPException(status_code=400, detail="Invalid batch ID format")

    temp_dir = tempfile.gettempdir()
    zip_path = os.path.join(temp_dir, f"{batch_id}_notices.zip")"""

content = content.replace(old_download, new_download)

with open("backend/main.py", "w") as f:
    f.write(content)
