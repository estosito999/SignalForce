from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import get_settings

settings = get_settings()


def normalize_database_url(url: str) -> str:
    normalized = url.strip().strip('"').strip("'")

    if not normalized:
        raise RuntimeError("DATABASE_URL is empty")

    if normalized.startswith("${{") or normalized.startswith("${"):
        raise RuntimeError(
            f"DATABASE_URL was not resolved correctly in Railway: {normalized}"
        )

    if normalized.startswith("postgres://"):
        return normalized.replace("postgres://", "postgresql+psycopg://", 1)

    if normalized.startswith("postgresql://") and "+psycopg" not in normalized and "+psycopg2" not in normalized:
        return normalized.replace("postgresql://", "postgresql+psycopg://", 1)

    return normalized


database_url = normalize_database_url(settings.database_url)

connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
