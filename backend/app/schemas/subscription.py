from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.profile import WALLET_REGEX


class SubscriptionCreate(BaseModel):
    subscriber_wallet: str = Field(..., pattern=WALLET_REGEX)
    creator_wallet: str = Field(..., pattern=WALLET_REGEX)
    amount_wei: str = Field(..., pattern=r"^[0-9]+$")


class SubscriptionOnchainUpdate(BaseModel):
    tx_hash: str = Field(..., pattern=r"^0x[a-fA-F0-9]{64}$")
    chain_id: int = Field(..., ge=1)


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subscriber_wallet: str
    creator_wallet: str
    amount_wei: str
    status: str
    tx_hash: str | None = None
    chain_id: int | None = None
    recorded_onchain_at: datetime | None = None
    started_at: datetime | None = None
    expires_at: datetime | None = None
    created_at: datetime
