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


def get_time_of_day_from_hour(hour: int) -> str:
    """
    Determines the time of day period based on the hour.

    Args:
        hour: Hour of the day (0-23)

    Returns:
        Period string: 'morning', 'afternoon', 'evening', or 'dawn'

    Periods:
        - 05:00 - 11:59: morning (manhã)
        - 12:00 - 17:59: afternoon (tarde)
        - 18:00 - 23:59: evening (noite)
        - 00:00 - 04:59: dawn (madrugada)
    """
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 18:
        return "afternoon"
    elif 18 <= hour < 24:
        return "evening"
    else:  # 0 <= hour < 5
        return "dawn"
