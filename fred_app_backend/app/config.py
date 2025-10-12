from typing import Optional
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings
import pytz


class Settings(BaseSettings):
    # Supabase settings
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None

    # Database settings (formato recomendado pelo Supabase)
    db_user: str = "postgres"
    db_password: str = ""
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "postgres"

    # DATABASE_URL (será construída automaticamente se não fornecida)
    database_url: Optional[str] = None

    secret_key: str = "your-secret-key-here"
    debug: bool = True
    timezone: str = "America/Sao_Paulo"

    class Config:
        env_file = ".env"

    def model_post_init(self, __context):
        # Se DATABASE_URL não for fornecida, constrói a partir das variáveis separadas
        if not self.database_url:
            # URL-encode da senha para lidar com caracteres especiais
            encoded_password = quote_plus(self.db_password)

            # Constrói DATABASE_URL no formato SQLAlchemy
            object.__setattr__(
                self,
                "database_url",
                f"postgresql+psycopg://{self.db_user}:{encoded_password}"
                f"@{self.db_host}:{self.db_port}/{self.db_name}",
            )


settings = Settings()

# Timezone object for use throughout the application
BRASILIA_TZ = pytz.timezone(settings.timezone)
