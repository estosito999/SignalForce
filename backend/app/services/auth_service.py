from sqlalchemy.orm import Session

from app.schemas.auth import WalletLoginResponse
from app.services.profile_service import ProfileService


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def wallet_login(self, wallet_address: str, pseudonym_hint: str | None = None) -> WalletLoginResponse:
        profile = ProfileService(self.db).get_or_create_profile(wallet_address=wallet_address, pseudonym_hint=pseudonym_hint)
        return WalletLoginResponse(profile=profile)
