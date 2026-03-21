from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.schemas.thesis import FollowRequest, ThesisResponse
from app.services.profile_service import ProfileService
from app.services.social_service import SocialService
from app.services.thesis_service import ThesisService


router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/{wallet_address}", response_model=ProfileResponse)
def get_profile(wallet_address: str, db: Session = Depends(get_db)) -> ProfileResponse:
    service = ProfileService(db)
    try:
        return service.get_profile(wallet_address)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{wallet_address}", response_model=ProfileResponse)
def update_profile(wallet_address: str, payload: ProfileUpdate, db: Session = Depends(get_db)) -> ProfileResponse:
    service = ProfileService(db)
    try:
        return service.update_profile(wallet_address, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{wallet_address}/theses", response_model=list[ThesisResponse])
def list_profile_theses(
    wallet_address: str,
    viewer_wallet: str | None = Query(default=None),
    include_pending: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[ThesisResponse]:
    service = ThesisService(db)
    return service.list_theses(
        include_pending=include_pending,
        author_wallet=wallet_address,
        viewer_wallet=viewer_wallet,
    )


@router.post("/{wallet_address}/follow", status_code=status.HTTP_204_NO_CONTENT)
def follow_creator(wallet_address: str, payload: FollowRequest, db: Session = Depends(get_db)) -> None:
    service = SocialService(db)
    try:
        service.follow_creator(creator_wallet=wallet_address, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/{wallet_address}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_creator(
    wallet_address: str,
    follower_wallet: str = Query(...),
    db: Session = Depends(get_db),
) -> None:
    service = SocialService(db)
    service.unfollow_creator(creator_wallet=wallet_address, follower_wallet=follower_wallet)
