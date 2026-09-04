import os, shutil, tempfile, logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("pakkalabel.db")

def _resolve_db_path() -> str:
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        tmp = tempfile.gettempdir()
        target = os.path.join(tmp, "inspections.db")
        source = os.path.join(os.path.dirname(__file__), "inspections.db")
        if os.path.exists(source) and not os.path.exists(target):
            try:
                shutil.copyfile(source, target)
            except Exception as e:
                logger.warning(f"Could not copy seed DB to /tmp: {e}")
        logger.info(f"Vercel mode: DB at {target}")
        return target
    return os.path.join(os.path.dirname(__file__), "inspections.db")

try:
    DB_PATH = _resolve_db_path()
    DATABASE_URL = f"sqlite:///{os.path.abspath(DB_PATH)}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    # Verify connection immediately
    with engine.connect():
        pass
except Exception as e:
    logger.error(f"Primary DB failed ({e}), falling back to :memory:")
    DATABASE_URL = "sqlite:///:memory:"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def run_migrations(engine):
    try:
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
    except Exception:
        pass

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
    except Exception as e:
        logger.error(f"DB session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
