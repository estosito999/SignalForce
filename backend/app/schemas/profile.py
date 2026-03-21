from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


WALLET_REGEX = r"^0x[a-fA-F0-9]{40}$"


class ReputationRank(str, Enum):
    bronce = "Bronce"
    plata = "Plata"
    oro = "Oro"
    pro = "Pro"
    experto = "Experto"


class ProfileBase(BaseModel):
    wallet_address: str = Field(..., pattern=WALLET_REGEX)
    pseudonym: str = Field(..., min_length=3, max_length=64)
    bio: str | None = Field(default=None, max_length=280)


class ProfileUpdate(BaseModel):
    pseudonym: str | None = Field(default=None, min_length=3, max_length=64)
    bio: str | None = Field(default=None, max_length=280)


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    wallet_address: str
    pseudonym: str
    bio: str | None = None

    verifiable_score: float
    social_score: float
    reputation_score: float
    rank: ReputationRank
    creator_earnings_wei: str

    followers_count: int = 0
    following_count: int = 0
    theses_count: int = 0

    created_at: datetime
    updated_at: datetime
