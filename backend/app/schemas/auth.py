from pydantic import BaseModel, Field

from app.schemas.profile import WALLET_REGEX, ProfileResponse


class WalletLoginRequest(BaseModel):
    wallet_address: str = Field(..., pattern=WALLET_REGEX)
    pseudonym_hint: str | None = Field(default=None, min_length=3, max_length=64)


class WalletLoginResponse(BaseModel):
    profile: ProfileResponse
