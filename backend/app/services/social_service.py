from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Follow, Profile
from app.schemas.thesis import FollowRequest
from app.services.onchain_anchor_service import normalize_wallet
from app.services.profile_service import ProfileService


class SocialService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def follow_creator(self, creator_wallet: str, payload: FollowRequest) -> None:
        creator = normalize_wallet(creator_wallet)
        follower = normalize_wallet(payload.follower_wallet)

        if creator == follower:
            raise ValueError("You cannot follow yourself")

        ProfileService(self.db).get_or_create_profile(creator)
        ProfileService(self.db).get_or_create_profile(follower)

        existing = self.db.scalar(
            select(Follow).where(Follow.creator_wallet == creator, Follow.follower_wallet == follower)
        )
        if existing is not None:
            return

        entity = Follow(creator_wallet=creator, follower_wallet=follower)
        self.db.add(entity)
        self.db.commit()

        from app.services.reputation_service import ReputationService

        ReputationService(self.db).recalculate_reputation(creator)

    def unfollow_creator(self, creator_wallet: str, follower_wallet: str) -> None:
        creator = normalize_wallet(creator_wallet)
        follower = normalize_wallet(follower_wallet)

        existing = self.db.scalar(
            select(Follow).where(Follow.creator_wallet == creator, Follow.follower_wallet == follower)
        )
        if existing is None:
            return

        self.db.delete(existing)
        self.db.commit()

        from app.services.reputation_service import ReputationService

        ReputationService(self.db).recalculate_reputation(creator)

    def list_followed_wallets(self, wallet_address: str) -> list[str]:
        wallet = normalize_wallet(wallet_address)
        follows = self.db.scalars(select(Follow).where(Follow.follower_wallet == wallet)).all()
        return [follow.creator_wallet for follow in follows]

    def ensure_profile(self, wallet_address: str) -> Profile:
        wallet = normalize_wallet(wallet_address)
        profile = self.db.scalar(select(Profile).where(Profile.wallet_address == wallet))
        if profile is not None:
            return profile

        ProfileService(self.db).get_or_create_profile(wallet)
        return self.db.scalar(select(Profile).where(Profile.wallet_address == wallet))  # type: ignore[return-value]
