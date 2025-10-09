from pydantic_settings import BaseSettings
import pytz


class Settings(BaseSettings):
    database_url: str = "sqlite:///./fred_app.db"
    secret_key: str = "your-secret-key-here"
    debug: bool = True
    timezone: str = "America/Sao_Paulo"

    class Config:
        env_file = ".env"


settings = Settings()

# Timezone object for use throughout the application
BRASILIA_TZ = pytz.timezone(settings.timezone)
