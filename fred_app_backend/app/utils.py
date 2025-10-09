from datetime import datetime
from app.config import BRASILIA_TZ


def now_brasilia():
    """Returns the current datetime in Brasília timezone."""
    return datetime.now(BRASILIA_TZ)


def to_brasilia(dt: datetime):
    """Converts a datetime to Brasília timezone."""
    if dt.tzinfo is None:
        # If naive datetime, assume it's UTC
        dt = dt.replace(tzinfo=BRASILIA_TZ)
    return dt.astimezone(BRASILIA_TZ)
