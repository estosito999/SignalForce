from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.subscription import SubscriptionCreate, SubscriptionOnchainUpdate, SubscriptionResponse
from app.services.subscription_service import SubscriptionService


router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(payload: SubscriptionCreate, db: Session = Depends(get_db)) -> SubscriptionResponse:
    service = SubscriptionService(db)
    try:
        return service.create_subscription(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{subscription_id}/onchain", response_model=SubscriptionResponse)
def register_subscription_onchain(
    subscription_id: str,
    payload: SubscriptionOnchainUpdate,
    db: Session = Depends(get_db),
) -> SubscriptionResponse:
    service = SubscriptionService(db)
    try:
        return service.register_onchain(subscription_id=subscription_id, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/creator/{wallet_address}", response_model=list[SubscriptionResponse])
def list_creator_subscriptions(wallet_address: str, db: Session = Depends(get_db)) -> list[SubscriptionResponse]:
    return SubscriptionService(db).list_creator_subscriptions(wallet_address)


@router.get("/subscriber/{wallet_address}", response_model=list[SubscriptionResponse])
def list_subscriber_subscriptions(wallet_address: str, db: Session = Depends(get_db)) -> list[SubscriptionResponse]:
    return SubscriptionService(db).list_subscriber_subscriptions(wallet_address)
