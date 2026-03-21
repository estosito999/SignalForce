from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.thesis import FeedResponse
from app.services.social_service import SocialService
from app.services.thesis_service import ThesisService


router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=FeedResponse)
def get_feed(
    viewer_wallet: str | None = Query(default=None),
    only_following: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> FeedResponse:
    thesis_service = ThesisService(db)

    if not only_following or viewer_wallet is None:
        return FeedResponse(items=thesis_service.list_theses(include_pending=False, viewer_wallet=viewer_wallet))

    followed_wallets = SocialService(db).list_followed_wallets(viewer_wallet)
    if not followed_wallets:
        return FeedResponse(items=[])

    all_items = []
    for wallet in followed_wallets:
        all_items.extend(thesis_service.list_theses(include_pending=False, author_wallet=wallet, viewer_wallet=viewer_wallet))

    all_items.sort(key=lambda item: item.created_at, reverse=True)
    return FeedResponse(items=all_items)
