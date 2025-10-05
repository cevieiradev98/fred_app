from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./fred_app.db"
    secret_key: str = "your-secret-key-here"
    debug: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
