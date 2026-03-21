from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Profile, Subscription
from app.schemas.subscription import SubscriptionCreate, SubscriptionOnchainUpdate, SubscriptionResponse
from app.services.onchain_anchor_service import normalize_wallet
from app.services.profile_service import ProfileService


class SubscriptionService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_subscription(self, payload: SubscriptionCreate) -> SubscriptionResponse:
        subscriber = normalize_wallet(payload.subscriber_wallet)
        creator = normalize_wallet(payload.creator_wallet)

        if subscriber == creator:
            raise ValueError("Subscriber and creator must be different wallets")

        ProfileService(self.db).get_or_create_profile(subscriber)
        ProfileService(self.db).get_or_create_profile(creator)

        entity = Subscription(
            public_id=str(uuid4()),
            subscriber_wallet=subscriber,
            creator_wallet=creator,
            amount_wei=payload.amount_wei,
            status="pending_onchain",
        )

        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return self._to_response(entity)

    def register_onchain(self, subscription_id: str, payload: SubscriptionOnchainUpdate) -> SubscriptionResponse:
        entity = self.db.scalar(select(Subscription).where(Subscription.public_id == subscription_id))
        if entity is None:
            raise ValueError("Subscription not found")

        entity.tx_hash = payload.tx_hash
        entity.chain_id = payload.chain_id
        entity.recorded_onchain_at = datetime.utcnow()
        entity.started_at = datetime.utcnow()
        entity.status = "active"

        self._increment_creator_earnings(entity.creator_wallet, entity.amount_wei)

        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return self._to_response(entity)

    def list_creator_subscriptions(self, creator_wallet: str) -> list[SubscriptionResponse]:
        creator = normalize_wallet(creator_wallet)
        items = self.db.scalars(
            select(Subscription)
            .where(Subscription.creator_wallet == creator)
            .order_by(Subscription.created_at.desc())
        ).all()
        return [self._to_response(item) for item in items]

    def list_subscriber_subscriptions(self, subscriber_wallet: str) -> list[SubscriptionResponse]:
        subscriber = normalize_wallet(subscriber_wallet)
        items = self.db.scalars(
            select(Subscription)
            .where(Subscription.subscriber_wallet == subscriber)
            .order_by(Subscription.created_at.desc())
        ).all()
        return [self._to_response(item) for item in items]

    @staticmethod
    def _to_response(entity: Subscription) -> SubscriptionResponse:
        return SubscriptionResponse(
            id=entity.public_id,
            subscriber_wallet=entity.subscriber_wallet,
            creator_wallet=entity.creator_wallet,
            amount_wei=entity.amount_wei,
            status=entity.status,
            tx_hash=entity.tx_hash,
            chain_id=entity.chain_id,
            recorded_onchain_at=entity.recorded_onchain_at,
            started_at=entity.started_at,
            expires_at=entity.expires_at,
            created_at=entity.created_at,
        )

    def _increment_creator_earnings(self, creator_wallet: str, amount_wei: str) -> None:
        profile = self.db.scalar(select(Profile).where(Profile.wallet_address == creator_wallet))
        if profile is None:
            ProfileService(self.db).get_or_create_profile(creator_wallet)
            profile = self.db.scalar(select(Profile).where(Profile.wallet_address == creator_wallet))
            if profile is None:
                raise ValueError("Profile not found")

        current = int(profile.creator_earnings_wei)
        profile.creator_earnings_wei = str(current + int(amount_wei))
        self.db.add(profile)
