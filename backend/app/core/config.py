from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SignalForce API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./signalforce.db"
    frontend_origin: str = "http://localhost:3000"
    frontend_origin_regex: str | None = r"https://.*\.vercel\.app"


@lru_cache
def get_settings() -> Settings:
    return Settings()
