with open("backend/services/batch_processor.py", "r") as f:
    content = f.read()

# Make exception handling logging safe
content = content.replace("except Exception as e:\n            print(f\"Error generating PDF for {filename}: {e}\")", "except Exception as e:\n            import logging\n            logging.error(f\"Error generating PDF for {filename}: {e}\", exc_info=True)")

with open("backend/services/batch_processor.py", "w") as f:
    f.write(content)
