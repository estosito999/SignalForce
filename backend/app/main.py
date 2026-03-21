from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.database import Base, engine
from app.db import models  # noqa: F401
from app.routes.auth import router as auth_router
from app.routes.feed import router as feed_router
from app.routes.evaluations import router as evaluations_router
from app.routes.health import router as health_router
from app.routes.profiles import router as profiles_router
from app.routes.reputation import router as reputation_router
from app.routes.subscriptions import router as subscriptions_router
from app.routes.theses import router as theses_router


settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
    description="API social de tesis de mercado pseudonimas con anclaje on-chain.",
)

origins = [origin.strip() for origin in settings.frontend_origin.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.api_v1_prefix)
app.include_router(evaluations_router, prefix=settings.api_v1_prefix)
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(profiles_router, prefix=settings.api_v1_prefix)
app.include_router(theses_router, prefix=settings.api_v1_prefix)
app.include_router(feed_router, prefix=settings.api_v1_prefix)
app.include_router(subscriptions_router, prefix=settings.api_v1_prefix)
app.include_router(reputation_router, prefix=settings.api_v1_prefix)
