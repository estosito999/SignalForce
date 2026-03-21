from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReputationRecalculateResponse(BaseModel):
    wallet_address: str
    verifiable_score: float
    social_score: float
    reputation_score: float
    rank: str
    checkpoint_id: str


class ReputationOnchainUpdate(BaseModel):
    tx_hash: str = Field(..., pattern=r"^0x[a-fA-F0-9]{64}$")
    chain_id: int = Field(..., ge=1)


class ReputationHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    wallet_address: str
    verifiable_score: float
    social_score: float
    reputation_score: float
    rank: str
    tx_hash: str | None = None
    chain_id: int | None = None
    recorded_onchain_at: datetime | None = None
    created_at: datetime
