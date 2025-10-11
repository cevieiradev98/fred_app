from typing import Optional

from pydantic_settings import BaseSettings
import pytz


class Settings(BaseSettings):
    database_url: Optional[str] = None
    db_user: str = "fred_app"
    db_password: str = "fred_secret"
    db_host: str = "postgres"
    db_port: int = 5432
    db_name: str = "fred_app"
    secret_key: str = "your-secret-key-here"
    debug: bool = True
    timezone: str = "America/Sao_Paulo"

    class Config:
        env_file = ".env"

    def model_post_init(self, __context):
        if not self.database_url:
            object.__setattr__(
                self,
                "database_url",
                f"postgresql+psycopg://{self.db_user}:{self.db_password}"
                f"@{self.db_host}:{self.db_port}/{self.db_name}",
            )


settings = Settings()

# Timezone object for use throughout the application
BRASILIA_TZ = pytz.timezone(settings.timezone)
