from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.evaluation import RiskLevel
from app.schemas.profile import WALLET_REGEX


class Bias(str, Enum):
    bullish = "bullish"
    bearish = "bearish"
    neutral = "neutral"


class ThesisStatus(str, Enum):
    pending_onchain = "pending_onchain"
    active = "active"
    resolved = "resolved"
    invalidated = "invalidated"


class ThesisCreate(BaseModel):
    author_wallet: str = Field(..., pattern=WALLET_REGEX)
    asset: str = Field(..., min_length=2, max_length=32)
    horizon: str = Field(..., min_length=2, max_length=32)
    bias: Bias

    price_volatility: float = Field(..., ge=0, le=100)
    context_climate: float = Field(..., ge=0, le=100)
    expected_demand: float = Field(..., ge=0, le=100)
    author_confidence: float = Field(..., ge=0, le=100)

    summary: str = Field(..., min_length=10, max_length=280)
    thesis_text: str = Field(..., min_length=20, max_length=5000)
    premium_text: str | None = Field(default=None, max_length=10000)
    is_premium: bool = False
    premium_price_wei: str = Field(default="0", pattern=r"^[0-9]+$")

    evaluation_deadline: datetime
    reference_price: float = Field(..., gt=0)
    invalidation_condition: str | None = Field(default=None, max_length=280)


class ThesisOnchainUpdate(BaseModel):
    wallet_address: str = Field(..., pattern=WALLET_REGEX)
    tx_hash: str = Field(..., pattern=r"^0x[a-fA-F0-9]{64}$")
    chain_id: int = Field(..., ge=1)


class ThesisResolve(BaseModel):
    is_useful: bool
    resolution_note: str | None = Field(default=None, max_length=512)
    invalidate: bool = False


class ThesisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    author_wallet: str
    author_pseudonym: str
    author_rank: str

    asset: str
    horizon: str
    bias: Bias

    price_volatility: float | None = None
    context_climate: float | None = None
    expected_demand: float | None = None
    author_confidence: float | None = None

    risk_score: float
    risk_level: RiskLevel

    summary: str
    thesis_text: str | None = None
    premium_text: str | None = None
    is_premium: bool
    premium_price_wei: str
    premium_locked: bool

    evaluation_deadline: datetime
    reference_price: float
    invalidation_condition: str | None = None

    status: ThesisStatus
    is_useful: bool | None = None
    resolution_note: str | None = None

    post_hash: str
    tx_hash: str | None = None
    chain_id: int | None = None
    onchain_recorded_at: datetime | None = None

    likes_count: int
    comments_count: int

    created_at: datetime
    updated_at: datetime


class CommentCreate(BaseModel):
    author_wallet: str = Field(..., pattern=WALLET_REGEX)
    content: str = Field(..., min_length=1, max_length=2000)
    parent_comment_id: str | None = None
    is_premium: bool = False


class CommentOnchainUpdate(BaseModel):
    wallet_address: str = Field(..., pattern=WALLET_REGEX)
    tx_hash: str = Field(..., pattern=r"^0x[a-fA-F0-9]{64}$")
    chain_id: int = Field(..., ge=1)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    thesis_id: str
    parent_comment_id: str | None = None
    author_wallet: str
    author_pseudonym: str
    author_rank: str
    content: str
    is_premium: bool
    status: ThesisStatus

    comment_hash: str
    tx_hash: str | None = None
    chain_id: int | None = None
    onchain_recorded_at: datetime | None = None

    created_at: datetime


class LikeRequest(BaseModel):
    wallet_address: str = Field(..., pattern=WALLET_REGEX)


class FollowRequest(BaseModel):
    follower_wallet: str = Field(..., pattern=WALLET_REGEX)


class FeedResponse(BaseModel):
    items: list[ThesisResponse]
