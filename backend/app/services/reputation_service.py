from datetime import datetime
from math import floor
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Comment, Follow, Like, Profile, ReputationHistory, Thesis
from app.schemas.reputation import ReputationHistoryResponse, ReputationOnchainUpdate, ReputationRecalculateResponse
from app.services.onchain_anchor_service import normalize_wallet
from app.services.profile_service import ProfileService


class ReputationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def recalculate_reputation(self, wallet_address: str) -> ReputationRecalculateResponse:
        wallet = normalize_wallet(wallet_address)
        ProfileService(self.db).get_or_create_profile(wallet)

        verifiable_score = self._compute_verifiable_score(wallet)
        social_score = self._compute_social_score(wallet)
        reputation_score = round((0.75 * verifiable_score) + (0.25 * social_score), 2)
        rank = self._rank_from_score(reputation_score)

        profile = self.db.scalar(select(Profile).where(Profile.wallet_address == wallet))
        if profile is None:
            raise ValueError("Profile not found")

        profile.verifiable_score = verifiable_score
        profile.social_score = social_score
        profile.reputation_score = reputation_score
        profile.rank = rank

        checkpoint = ReputationHistory(
            public_id=str(uuid4()),
            wallet_address=wallet,
            verifiable_score=verifiable_score,
            social_score=social_score,
            reputation_score=reputation_score,
            rank=rank,
        )

        self.db.add(profile)
        self.db.add(checkpoint)
        self.db.commit()
        self.db.refresh(checkpoint)

        return ReputationRecalculateResponse(
            wallet_address=wallet,
            verifiable_score=verifiable_score,
            social_score=social_score,
            reputation_score=reputation_score,
            rank=rank,
            checkpoint_id=checkpoint.public_id,
        )

    def list_history(self, wallet_address: str) -> list[ReputationHistoryResponse]:
        wallet = normalize_wallet(wallet_address)
        rows = self.db.scalars(
            select(ReputationHistory)
            .where(ReputationHistory.wallet_address == wallet)
            .order_by(ReputationHistory.created_at.desc())
        ).all()

        return [
            ReputationHistoryResponse(
                id=row.public_id,
                wallet_address=row.wallet_address,
                verifiable_score=round(row.verifiable_score, 2),
                social_score=round(row.social_score, 2),
                reputation_score=round(row.reputation_score, 2),
                rank=row.rank,
                tx_hash=row.tx_hash,
                chain_id=row.chain_id,
                recorded_onchain_at=row.recorded_onchain_at,
                created_at=row.created_at,
            )
            for row in rows
        ]

    def register_onchain(self, checkpoint_id: str, payload: ReputationOnchainUpdate) -> ReputationHistoryResponse:
        checkpoint = self.db.scalar(select(ReputationHistory).where(ReputationHistory.public_id == checkpoint_id))
        if checkpoint is None:
            raise ValueError("Reputation checkpoint not found")

        checkpoint.tx_hash = payload.tx_hash
        checkpoint.chain_id = payload.chain_id
        checkpoint.recorded_onchain_at = datetime.utcnow()

        self.db.add(checkpoint)
        self.db.commit()
        self.db.refresh(checkpoint)

        return ReputationHistoryResponse(
            id=checkpoint.public_id,
            wallet_address=checkpoint.wallet_address,
            verifiable_score=round(checkpoint.verifiable_score, 2),
            social_score=round(checkpoint.social_score, 2),
            reputation_score=round(checkpoint.reputation_score, 2),
            rank=checkpoint.rank,
            tx_hash=checkpoint.tx_hash,
            chain_id=checkpoint.chain_id,
            recorded_onchain_at=checkpoint.recorded_onchain_at,
            created_at=checkpoint.created_at,
        )

    def _compute_verifiable_score(self, wallet_address: str) -> float:
        theses = self.db.scalars(select(Thesis).where(Thesis.author_wallet == wallet_address)).all()
        if not theses:
            return 0.0

        total = len(theses)
        published_before_event = sum(
            1
            for thesis in theses
            if (thesis.onchain_recorded_at or thesis.created_at) <= thesis.evaluation_deadline
        )
        fuzzy_complete = sum(
            1
            for thesis in theses
            if thesis.price_volatility is not None
            and thesis.context_climate is not None
            and thesis.expected_demand is not None
            and thesis.author_confidence is not None
        )

        resolved = [thesis for thesis in theses if thesis.is_useful is not None]
        useful = [thesis for thesis in resolved if thesis.is_useful]

        published_ratio = published_before_event / total
        fuzzy_ratio = fuzzy_complete / total
        useful_ratio = (len(useful) / len(resolved)) if resolved else 0.0
        consistency_ratio = useful_ratio if len(resolved) >= 3 else useful_ratio * 0.8

        score = (0.2 * published_ratio) + (0.2 * fuzzy_ratio) + (0.4 * useful_ratio) + (0.2 * consistency_ratio)
        return round(score * 100, 2)

    def _compute_social_score(self, wallet_address: str) -> float:
        follower_count = self.db.scalar(
            select(func.count()).select_from(Follow).where(Follow.creator_wallet == wallet_address)
        ) or 0

        theses = self.db.scalars(select(Thesis.public_id).where(Thesis.author_wallet == wallet_address)).all()
        thesis_ids = [thesis_id for thesis_id in theses]

        likes_received = 0
        comments_received = 0
        if thesis_ids:
            likes_received = self.db.scalar(
                select(func.count()).select_from(Like).where(Like.thesis_public_id.in_(thesis_ids))
            ) or 0
            comments_received = self.db.scalar(
                select(func.count()).select_from(Comment).where(Comment.thesis_public_id.in_(thesis_ids))
            ) or 0

        comments_authored = self.db.scalar(
            select(func.count()).select_from(Comment).where(Comment.author_wallet == wallet_address)
        ) or 0
        active_posts = self.db.scalar(
            select(func.count()).select_from(Thesis).where(Thesis.author_wallet == wallet_address)
        ) or 0

        raw_score = (
            (likes_received * 2)
            + (comments_received * 3)
            + (follower_count * 4)
            + comments_authored
            + (active_posts * 2)
        )

        return float(min(100, floor(raw_score)))

    @staticmethod
    def _rank_from_score(score: float) -> str:
        if score < 20:
            return "Bronce"
        if score < 40:
            return "Plata"
        if score < 60:
            return "Oro"
        if score < 80:
            return "Pro"
        return "Experto"
