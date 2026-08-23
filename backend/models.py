from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, create_engine, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

DATABASE_URL = "sqlite:///./inspections.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class Inspection(Base):
    __tablename__ = "inspections"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    inspected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    source_filename: Mapped[str] = mapped_column(String(255))
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    region: Mapped[str] = mapped_column(String(120), default="Unknown")
    overall_status: Mapped[str] = mapped_column(String(20))
    ocr_text: Mapped[str] = mapped_column(Text, default="")
    violations: Mapped[list["Violation"]] = relationship(back_populates="inspection", cascade="all, delete-orphan")
    certificate: Mapped["AuditCertificate | None"] = relationship(back_populates="inspection", uselist=False, cascade="all, delete-orphan")


class Violation(Base):
    __tablename__ = "violations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    inspection_id: Mapped[int] = mapped_column(ForeignKey("inspections.id"), index=True)
    rule: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20))
    reason: Mapped[str] = mapped_column(Text)
    inspection: Mapped[Inspection] = relationship(back_populates="violations")


class AuditCertificate(Base):
    __tablename__ = "audit_certificates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    inspection_id: Mapped[int] = mapped_column(ForeignKey("inspections.id"), unique=True)
    certificate_number: Mapped[str] = mapped_column(String(80), unique=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    inspection: Mapped[Inspection] = relationship(back_populates="certificate")


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
