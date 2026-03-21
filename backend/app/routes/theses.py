from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.thesis import (
    CommentCreate,
    CommentOnchainUpdate,
    CommentResponse,
    LikeRequest,
    ThesisCreate,
    ThesisOnchainUpdate,
    ThesisResolve,
    ThesisResponse,
)
from app.services.thesis_service import ThesisService


router = APIRouter(prefix="/theses", tags=["theses"])


@router.post("", response_model=ThesisResponse, status_code=status.HTTP_201_CREATED)
def create_thesis(payload: ThesisCreate, db: Session = Depends(get_db)) -> ThesisResponse:
    service = ThesisService(db)
    return service.create_thesis(payload)


@router.get("", response_model=list[ThesisResponse])
def list_theses(
    include_pending: bool = Query(default=False),
    author_wallet: str | None = Query(default=None),
    viewer_wallet: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[ThesisResponse]:
    service = ThesisService(db)
    return service.list_theses(
        include_pending=include_pending,
        author_wallet=author_wallet,
        viewer_wallet=viewer_wallet,
    )


@router.get("/{thesis_id}", response_model=ThesisResponse)
def get_thesis(thesis_id: str, viewer_wallet: str | None = Query(default=None), db: Session = Depends(get_db)) -> ThesisResponse:
    service = ThesisService(db)
    try:
        return service.get_thesis(thesis_id, viewer_wallet=viewer_wallet)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/{thesis_id}/onchain", response_model=ThesisResponse)
def register_thesis_onchain(
    thesis_id: str,
    payload: ThesisOnchainUpdate,
    db: Session = Depends(get_db),
) -> ThesisResponse:
    service = ThesisService(db)
    try:
        return service.register_thesis_onchain(thesis_id=thesis_id, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{thesis_id}/resolve", response_model=ThesisResponse)
def resolve_thesis(thesis_id: str, payload: ThesisResolve, db: Session = Depends(get_db)) -> ThesisResponse:
    service = ThesisService(db)
    try:
        return service.resolve_thesis(thesis_id=thesis_id, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{thesis_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(thesis_id: str, payload: CommentCreate, db: Session = Depends(get_db)) -> CommentResponse:
    service = ThesisService(db)
    try:
        return service.create_comment(thesis_id=thesis_id, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{thesis_id}/comments", response_model=list[CommentResponse])
def list_comments(
    thesis_id: str,
    viewer_wallet: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[CommentResponse]:
    service = ThesisService(db)
    try:
        return service.list_comments(thesis_id=thesis_id, viewer_wallet=viewer_wallet)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.patch("/comments/{comment_id}/onchain", response_model=CommentResponse)
def register_comment_onchain(
    comment_id: str,
    payload: CommentOnchainUpdate,
    db: Session = Depends(get_db),
) -> CommentResponse:
    service = ThesisService(db)
    try:
        return service.register_comment_onchain(comment_id=comment_id, payload=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{thesis_id}/likes", status_code=status.HTTP_204_NO_CONTENT)
def like_thesis(thesis_id: str, payload: LikeRequest, db: Session = Depends(get_db)) -> None:
    service = ThesisService(db)
    try:
        service.like_thesis(thesis_id=thesis_id, wallet_address=payload.wallet_address)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.delete("/{thesis_id}/likes", status_code=status.HTTP_204_NO_CONTENT)
def unlike_thesis(thesis_id: str, wallet_address: str = Query(...), db: Session = Depends(get_db)) -> None:
    service = ThesisService(db)
    service.unlike_thesis(thesis_id=thesis_id, wallet_address=wallet_address)
