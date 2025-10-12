from typing import Optional

from pydantic_settings import BaseSettings
import pytz


class Settings(BaseSettings):
    # Supabase settings
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None

    # Database settings (Supabase provides a PostgreSQL connection)
    database_url: Optional[str] = None

    # Legacy settings (mantidos para retrocompatibilidade, mas não usados com Supabase)
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
        # Se DATABASE_URL não for fornecida, tenta construir do Supabase ou Postgres local
        if not self.database_url:
            # Prioridade: usar Supabase se configurado
            if self.supabase_url:
                # Supabase fornece a DATABASE_URL no dashboard
                # Se não tiver, construir manualmente não é recomendado
                pass
            else:
                # Fallback para Postgres local (desenvolvimento)
                object.__setattr__(
                    self,
                    "database_url",
                    f"postgresql+psycopg://{self.db_user}:{self.db_password}"
                    f"@{self.db_host}:{self.db_port}/{self.db_name}",
                )


settings = Settings()

# Timezone object for use throughout the application
BRASILIA_TZ = pytz.timezone(settings.timezone)
