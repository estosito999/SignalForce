from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.evaluation import EvaluationCreate, EvaluationOnchainUpdate, EvaluationResponse
from app.services.evaluation_service import EvaluationService


router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.post("", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
def create_evaluation(payload: EvaluationCreate, db: Session = Depends(get_db)) -> EvaluationResponse:
    service = EvaluationService(db)
    return service.create_evaluation(payload)


@router.get("", response_model=list[EvaluationResponse])
def list_evaluations(db: Session = Depends(get_db)) -> list[EvaluationResponse]:
    service = EvaluationService(db)
    return service.list_evaluations()


@router.patch("/{evaluation_id}/onchain", response_model=EvaluationResponse)
def register_onchain(
    evaluation_id: str,
    payload: EvaluationOnchainUpdate,
    db: Session = Depends(get_db),
) -> EvaluationResponse:
    service = EvaluationService(db)

    try:
        return service.register_onchain(evaluation_id=evaluation_id, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
