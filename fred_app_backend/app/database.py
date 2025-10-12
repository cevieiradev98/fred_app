import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

logger = logging.getLogger("fred_app.database")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)


def log_connection_info():
    """Log database connection information."""
    connection_type = "Supabase" if settings.supabase_url else "Local PostgreSQL"

    logger.info(
        f"Connecting to database ({connection_type})",
        extra={
            "connection_type": connection_type,
            "supabase_url": settings.supabase_url if settings.supabase_url else "Not configured",
            "database_url": settings.database_url if settings.database_url else "Not configured",
        },
    )
    print(
        f"[Database] Connecting to {connection_type} -> "
        f"database_url={'***configured***' if settings.database_url else 'Not configured'}"
    )


log_connection_info()

# Validate that DATABASE_URL is set
if not settings.database_url:
    error_msg = (
        "DATABASE_URL is not configured. "
        "Please set either DATABASE_URL or SUPABASE_URL in your environment variables."
    )
    logger.error(error_msg)
    raise ValueError(error_msg)

# Create SQLAlchemy engine
# Supabase uses PostgreSQL, so this works seamlessly
connect_args = {
    "connect_timeout": 10,
}

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
