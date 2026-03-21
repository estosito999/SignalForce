from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class EvaluationCreate(BaseModel):
    price_volatility: float = Field(..., ge=0, le=100)
    expected_weather: float = Field(..., ge=0, le=100)
    expected_demand: float = Field(..., ge=0, le=100)


class EvaluationOnchainUpdate(BaseModel):
    wallet_address: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$")
    tx_hash: str = Field(..., pattern=r"^0x[a-fA-F0-9]{64}$")
    chain_id: int = Field(..., ge=1)


class EvaluationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    price_volatility: float
    expected_weather: float
    expected_demand: float
    risk_score: float
    risk_level: RiskLevel
    explanation: str
    evaluation_hash: str
    wallet_address: str | None = None
    tx_hash: str | None = None
    chain_id: int | None = None
    created_at: datetime
    recorded_onchain_at: datetime | None = None


class HealthResponse(BaseModel):
    status: str
