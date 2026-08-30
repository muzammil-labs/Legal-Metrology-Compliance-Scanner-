import re
text = "Some text with FSSAI No. 10023021000045 or Lic. 12345678901234. FSSAI No. 1234"
print(re.findall(r"\b[0-9]{14}\b", text))
