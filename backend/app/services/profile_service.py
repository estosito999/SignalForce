from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Follow, Profile, Thesis
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services.onchain_anchor_service import normalize_wallet


class ProfileService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create_profile(self, wallet_address: str, pseudonym_hint: str | None = None) -> ProfileResponse:
        wallet = normalize_wallet(wallet_address)
        profile = self.db.scalar(select(Profile).where(Profile.wallet_address == wallet))
        if profile is None:
            profile = Profile(wallet_address=wallet, pseudonym=self._build_unique_pseudonym(wallet, pseudonym_hint))
            self.db.add(profile)
            self.db.commit()
            self.db.refresh(profile)

        return self._to_response(profile)

    def get_profile(self, wallet_address: str) -> ProfileResponse:
        wallet = normalize_wallet(wallet_address)
        profile = self.db.scalar(select(Profile).where(Profile.wallet_address == wallet))
        if profile is None:
            raise ValueError("Profile not found")

        return self._to_response(profile)

    def update_profile(self, wallet_address: str, payload: ProfileUpdate) -> ProfileResponse:
        wallet = normalize_wallet(wallet_address)
        profile = self.db.scalar(select(Profile).where(Profile.wallet_address == wallet))
        if profile is None:
            raise ValueError("Profile not found")

        if payload.pseudonym is not None and payload.pseudonym != profile.pseudonym:
            profile.pseudonym = self._build_unique_pseudonym(wallet, payload.pseudonym)

        if payload.bio is not None:
            profile.bio = payload.bio

        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)

        return self._to_response(profile)

    def _build_unique_pseudonym(self, wallet: str, pseudonym_hint: str | None = None) -> str:
        base = (pseudonym_hint or f"SF-{wallet[2:8].upper()}").strip()
        candidate = base
        suffix = 1

        while True:
            exists = self.db.scalar(select(Profile).where(Profile.pseudonym == candidate))
            if exists is None or exists.wallet_address == wallet:
                return candidate

            suffix += 1
            candidate = f"{base}-{suffix}"

    def _to_response(self, profile: Profile) -> ProfileResponse:
        followers_count = self.db.scalar(
            select(func.count()).select_from(Follow).where(Follow.creator_wallet == profile.wallet_address)
        )
        following_count = self.db.scalar(
            select(func.count()).select_from(Follow).where(Follow.follower_wallet == profile.wallet_address)
        )
        theses_count = self.db.scalar(
            select(func.count()).select_from(Thesis).where(Thesis.author_wallet == profile.wallet_address)
        )

        return ProfileResponse(
            wallet_address=profile.wallet_address,
            pseudonym=profile.pseudonym,
            bio=profile.bio,
            verifiable_score=round(profile.verifiable_score, 2),
            social_score=round(profile.social_score, 2),
            reputation_score=round(profile.reputation_score, 2),
            rank=profile.rank,
            creator_earnings_wei=profile.creator_earnings_wei,
            followers_count=followers_count or 0,
            following_count=following_count or 0,
            theses_count=theses_count or 0,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        )
