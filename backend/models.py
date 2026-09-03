from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class InspectionRecord(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    inspected_at = Column(DateTime, default=datetime.utcnow, index=True)
    source_filename = Column(String(255), default="unknown.jpg")
    sha256_hash = Column(String(64), index=True)
    region = Column(String(120), default="Unknown")
    gps_location = Column(String(120), default="28.6139° N, 77.2090° E")
    trust_score = Column(Integer, default=100)
    overall_status = Column(String(20), index=True)
    extracted_text = Column(Text, default="")
    timestamp = Column(String(50))
    violation_count = Column(Integer, default=0)

    # We maintain aliases for compatibility with main.py vs old code
    @property
    def sha256(self):
        return self.sha256_hash
    @sha256.setter
    def sha256(self, val):
        self.sha256_hash = val

    @property
    def ocr_text(self):
        return self.extracted_text
    @ocr_text.setter
    def ocr_text(self, val):
        self.extracted_text = val

