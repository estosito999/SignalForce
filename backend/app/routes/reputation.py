from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.reputation import ReputationHistoryResponse, ReputationOnchainUpdate, ReputationRecalculateResponse
from app.services.reputation_service import ReputationService


router = APIRouter(prefix="/reputation", tags=["reputation"])


@router.post("/recalculate/{wallet_address}", response_model=ReputationRecalculateResponse)
def recalculate_reputation(wallet_address: str, db: Session = Depends(get_db)) -> ReputationRecalculateResponse:
    service = ReputationService(db)
    return service.recalculate_reputation(wallet_address)


@router.get("/{wallet_address}/history", response_model=list[ReputationHistoryResponse])
def get_reputation_history(wallet_address: str, db: Session = Depends(get_db)) -> list[ReputationHistoryResponse]:
    service = ReputationService(db)
    return service.list_history(wallet_address)


@router.patch("/checkpoints/{checkpoint_id}/onchain", response_model=ReputationHistoryResponse)
def register_checkpoint_onchain(
    checkpoint_id: str,
    payload: ReputationOnchainUpdate,
    db: Session = Depends(get_db),
) -> ReputationHistoryResponse:
    service = ReputationService(db)
    try:
        return service.register_onchain(checkpoint_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
