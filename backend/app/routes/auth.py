from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth import WalletLoginRequest, WalletLoginResponse
from app.services.auth_service import AuthService


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/wallet-login", response_model=WalletLoginResponse, status_code=status.HTTP_200_OK)
def wallet_login(payload: WalletLoginRequest, db: Session = Depends(get_db)) -> WalletLoginResponse:
    service = AuthService(db)
    return service.wallet_login(wallet_address=payload.wallet_address, pseudonym_hint=payload.pseudonym_hint)
