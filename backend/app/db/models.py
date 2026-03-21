from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=False)

    price_volatility: Mapped[float] = mapped_column(Float, nullable=False)
    expected_weather: Mapped[float] = mapped_column(Float, nullable=False)
    expected_demand: Mapped[float] = mapped_column(Float, nullable=False)

    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), index=True, nullable=False)
    explanation: Mapped[str] = mapped_column(String(512), nullable=False)
    evaluation_hash: Mapped[str] = mapped_column(String(66), unique=True, index=True, nullable=False)

    wallet_address: Mapped[str | None] = mapped_column(String(42), nullable=True)
    tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    chain_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    recorded_onchain_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    wallet_address: Mapped[str] = mapped_column(String(42), unique=True, index=True, nullable=False)
    pseudonym: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    bio: Mapped[str | None] = mapped_column(String(280), nullable=True)

    verifiable_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    social_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reputation_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    rank: Mapped[str] = mapped_column(String(16), default="Bronce", nullable=False)

    creator_earnings_wei: Mapped[str] = mapped_column(String(80), default="0", nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Thesis(Base):
    __tablename__ = "theses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=False)
    author_wallet: Mapped[str] = mapped_column(String(42), index=True, nullable=False)

    asset: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    horizon: Mapped[str] = mapped_column(String(32), nullable=False)
    bias: Mapped[str] = mapped_column(String(16), nullable=False)

    price_volatility: Mapped[float] = mapped_column(Float, nullable=False)
    context_climate: Mapped[float] = mapped_column(Float, nullable=False)
    expected_demand: Mapped[float] = mapped_column(Float, nullable=False)
    author_confidence: Mapped[float] = mapped_column(Float, nullable=False)

    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(16), index=True, nullable=False)

    summary: Mapped[str] = mapped_column(String(280), nullable=False)
    thesis_text: Mapped[str] = mapped_column(Text, nullable=False)
    premium_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    premium_price_wei: Mapped[str] = mapped_column(String(80), default="0", nullable=False)

    reference_price: Mapped[float] = mapped_column(Float, nullable=False)
    invalidation_condition: Mapped[str | None] = mapped_column(String(280), nullable=True)

    status: Mapped[str] = mapped_column(String(24), default="pending_onchain", index=True, nullable=False)
    is_useful: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    resolution_note: Mapped[str | None] = mapped_column(String(512), nullable=True)

    evaluation_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    post_hash: Mapped[str] = mapped_column(String(66), unique=True, index=True, nullable=False)
    tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    chain_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    onchain_recorded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=False)
    thesis_public_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    parent_comment_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    author_wallet: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    status: Mapped[str] = mapped_column(String(24), default="pending_onchain", index=True, nullable=False)

    comment_hash: Mapped[str] = mapped_column(String(66), unique=True, index=True, nullable=False)
    tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    chain_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    onchain_recorded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint("thesis_public_id", "wallet_address", name="uq_like_thesis_wallet"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    thesis_public_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    wallet_address: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint("follower_wallet", "creator_wallet", name="uq_follow_pair"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    follower_wallet: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    creator_wallet: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=False)
    subscriber_wallet: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    creator_wallet: Mapped[str] = mapped_column(String(42), index=True, nullable=False)
    amount_wei: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="pending_onchain", index=True, nullable=False)

    tx_hash: Mapped[str | None] = mapped_column(String(66), unique=True, nullable=True)
    chain_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recorded_onchain_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ReputationHistory(Base):
    __tablename__ = "reputation_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    public_id: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=False)
    wallet_address: Mapped[str] = mapped_column(String(42), index=True, nullable=False)

    verifiable_score: Mapped[float] = mapped_column(Float, nullable=False)
    social_score: Mapped[float] = mapped_column(Float, nullable=False)
    reputation_score: Mapped[float] = mapped_column(Float, nullable=False)
    rank: Mapped[str] = mapped_column(String(16), nullable=False)

    tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    chain_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recorded_onchain_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
