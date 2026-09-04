import os
import shutil
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    temp_dir = tempfile.gettempdir()
    db_file = os.path.join(temp_dir, "inspections.db")
    source_db = os.path.join(os.path.dirname(__file__), "inspections.db")
    if os.path.exists(source_db) and not os.path.exists(db_file):
        try:
            shutil.copyfile(source_db, db_file)
        except Exception:
            pass
    DB_PATH = db_file
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "inspections.db")

normalized_path = os.path.abspath(DB_PATH).replace("\\", "/")
DATABASE_URL = f"sqlite:///{normalized_path}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def run_migrations(engine):
    from sqlalchemy import text
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE inspections ADD COLUMN violation_count INTEGER DEFAULT 0",
        ]:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass  # Column already exists

try:
    run_migrations(engine)
except Exception:
    pass  # Non-fatal on read-only filesystems (Vercel)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
