from datetime import datetime
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Comment, Like, Profile, Subscription, Thesis
from app.schemas.evaluation import RiskLevel
from app.schemas.thesis import (
    CommentCreate,
    CommentOnchainUpdate,
    CommentResponse,
    ThesisCreate,
    ThesisOnchainUpdate,
    ThesisResolve,
    ThesisResponse,
)
from app.services.fuzzy_engine import fuzzy_risk_engine
from app.services.onchain_anchor_service import canonical_hash, normalize_wallet
from app.services.profile_service import ProfileService


class ThesisService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_thesis(self, payload: ThesisCreate) -> ThesisResponse:
        author_wallet = normalize_wallet(payload.author_wallet)
        ProfileService(self.db).get_or_create_profile(author_wallet)

        fuzzy_result = fuzzy_risk_engine.evaluate(
            price_volatility=payload.price_volatility,
            context_climate=payload.context_climate,
            expected_demand=payload.expected_demand,
            author_confidence=payload.author_confidence,
        )

        public_id = str(uuid4())
        post_hash = canonical_hash(
            {
                "post_id": public_id,
                "author_wallet": author_wallet,
                "asset": payload.asset,
                "horizon": payload.horizon,
                "bias": payload.bias.value,
                "price_volatility": payload.price_volatility,
                "context_climate": payload.context_climate,
                "expected_demand": payload.expected_demand,
                "author_confidence": payload.author_confidence,
                "risk_score": fuzzy_result.risk_score,
                "risk_level": fuzzy_result.risk_level.value,
                "summary": payload.summary,
                "thesis_text": payload.thesis_text,
                "premium_text": payload.premium_text,
                "is_premium": payload.is_premium,
                "premium_price_wei": payload.premium_price_wei,
                "evaluation_deadline": payload.evaluation_deadline,
                "reference_price": payload.reference_price,
                "invalidation_condition": payload.invalidation_condition,
            }
        )

        entity = Thesis(
            public_id=public_id,
            author_wallet=author_wallet,
            asset=payload.asset.upper(),
            horizon=payload.horizon,
            bias=payload.bias.value,
            price_volatility=payload.price_volatility,
            context_climate=payload.context_climate,
            expected_demand=payload.expected_demand,
            author_confidence=payload.author_confidence,
            risk_score=fuzzy_result.risk_score,
            risk_level=fuzzy_result.risk_level.value,
            summary=payload.summary,
            thesis_text=payload.thesis_text,
            premium_text=payload.premium_text,
            is_premium=payload.is_premium,
            premium_price_wei=payload.premium_price_wei,
            evaluation_deadline=payload.evaluation_deadline,
            reference_price=payload.reference_price,
            invalidation_condition=payload.invalidation_condition,
            post_hash=post_hash,
            status="pending_onchain",
        )

        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)

        return self._to_thesis_response(entity, viewer_wallet=author_wallet)

    def list_theses(
        self,
        include_pending: bool = False,
        author_wallet: str | None = None,
        viewer_wallet: str | None = None,
    ) -> list[ThesisResponse]:
        stmt = select(Thesis)

        if author_wallet:
            stmt = stmt.where(Thesis.author_wallet == normalize_wallet(author_wallet))

        if not include_pending:
            stmt = stmt.where(Thesis.status != "pending_onchain")

        records = self.db.scalars(stmt.order_by(Thesis.created_at.desc())).all()
        return [self._to_thesis_response(record, viewer_wallet=viewer_wallet) for record in records]

    def get_thesis(self, thesis_id: str, viewer_wallet: str | None = None) -> ThesisResponse:
        entity = self.db.scalar(select(Thesis).where(Thesis.public_id == thesis_id))
        if entity is None:
            raise ValueError("Thesis not found")

        return self._to_thesis_response(entity, viewer_wallet=viewer_wallet)

    def register_thesis_onchain(self, thesis_id: str, payload: ThesisOnchainUpdate) -> ThesisResponse:
        thesis = self.db.scalar(select(Thesis).where(Thesis.public_id == thesis_id))
        if thesis is None:
            raise ValueError("Thesis not found")

        wallet = normalize_wallet(payload.wallet_address)
        if wallet != thesis.author_wallet:
            raise ValueError("Wallet does not match thesis author")

        thesis.tx_hash = payload.tx_hash
        thesis.chain_id = payload.chain_id
        thesis.onchain_recorded_at = datetime.utcnow()

        if thesis.status == "pending_onchain":
            thesis.status = "active"

        self.db.add(thesis)
        self.db.commit()
        self.db.refresh(thesis)

        return self._to_thesis_response(thesis, viewer_wallet=wallet)

    def resolve_thesis(self, thesis_id: str, payload: ThesisResolve) -> ThesisResponse:
        thesis = self.db.scalar(select(Thesis).where(Thesis.public_id == thesis_id))
        if thesis is None:
            raise ValueError("Thesis not found")

        thesis.is_useful = payload.is_useful
        thesis.resolution_note = payload.resolution_note
        thesis.resolved_at = datetime.utcnow()
        thesis.status = "invalidated" if payload.invalidate else "resolved"

        self.db.add(thesis)
        self.db.commit()
        self.db.refresh(thesis)

        from app.services.reputation_service import ReputationService

        ReputationService(self.db).recalculate_reputation(thesis.author_wallet)

        return self._to_thesis_response(thesis, viewer_wallet=thesis.author_wallet)

    def create_comment(self, thesis_id: str, payload: CommentCreate) -> CommentResponse:
        thesis = self.db.scalar(select(Thesis).where(Thesis.public_id == thesis_id))
        if thesis is None:
            raise ValueError("Thesis not found")

        author_wallet = normalize_wallet(payload.author_wallet)
        ProfileService(self.db).get_or_create_profile(author_wallet)

        comment_id = str(uuid4())
        comment_hash = canonical_hash(
            {
                "comment_id": comment_id,
                "thesis_id": thesis_id,
                "parent_comment_id": payload.parent_comment_id,
                "author_wallet": author_wallet,
                "content": payload.content,
                "is_premium": payload.is_premium,
            }
        )

        entity = Comment(
            public_id=comment_id,
            thesis_public_id=thesis_id,
            parent_comment_id=payload.parent_comment_id,
            author_wallet=author_wallet,
            content=payload.content,
            is_premium=payload.is_premium,
            status="pending_onchain",
            comment_hash=comment_hash,
        )

        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)

        return self._to_comment_response(entity, viewer_wallet=author_wallet)

    def list_comments(self, thesis_id: str, viewer_wallet: str | None = None) -> list[CommentResponse]:
        thesis = self.db.scalar(select(Thesis).where(Thesis.public_id == thesis_id))
        if thesis is None:
            raise ValueError("Thesis not found")

        comments = self.db.scalars(
            select(Comment).where(Comment.thesis_public_id == thesis_id).order_by(Comment.created_at.asc())
        ).all()

        return [self._to_comment_response(comment, viewer_wallet=viewer_wallet) for comment in comments]

    def register_comment_onchain(self, comment_id: str, payload: CommentOnchainUpdate) -> CommentResponse:
        comment = self.db.scalar(select(Comment).where(Comment.public_id == comment_id))
        if comment is None:
            raise ValueError("Comment not found")

        wallet = normalize_wallet(payload.wallet_address)
        if wallet != comment.author_wallet:
            raise ValueError("Wallet does not match comment author")

        comment.tx_hash = payload.tx_hash
        comment.chain_id = payload.chain_id
        comment.onchain_recorded_at = datetime.utcnow()
        comment.status = "active"

        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)

        return self._to_comment_response(comment, viewer_wallet=wallet)

    def like_thesis(self, thesis_id: str, wallet_address: str) -> None:
        thesis = self.db.scalar(select(Thesis).where(Thesis.public_id == thesis_id))
        if thesis is None:
            raise ValueError("Thesis not found")

        wallet = normalize_wallet(wallet_address)
        existing = self.db.scalar(
            select(Like).where(Like.thesis_public_id == thesis_id, Like.wallet_address == wallet)
        )
        if existing is not None:
            return

        like = Like(thesis_public_id=thesis_id, wallet_address=wallet)
        self.db.add(like)
        self.db.commit()

        from app.services.reputation_service import ReputationService

        ReputationService(self.db).recalculate_reputation(thesis.author_wallet)

    def unlike_thesis(self, thesis_id: str, wallet_address: str) -> None:
        thesis = self.db.scalar(select(Thesis).where(Thesis.public_id == thesis_id))
        if thesis is None:
            raise ValueError("Thesis not found")

        wallet = normalize_wallet(wallet_address)
        existing = self.db.scalar(
            select(Like).where(Like.thesis_public_id == thesis_id, Like.wallet_address == wallet)
        )
        if existing is None:
            return

        self.db.delete(existing)
        self.db.commit()

        from app.services.reputation_service import ReputationService

        ReputationService(self.db).recalculate_reputation(thesis.author_wallet)

    def _to_thesis_response(self, entity: Thesis, viewer_wallet: str | None = None) -> ThesisResponse:
        profile = self._get_profile(entity.author_wallet)

        likes_count = self.db.scalar(select(func.count()).select_from(Like).where(Like.thesis_public_id == entity.public_id))
        comments_count = self.db.scalar(
            select(func.count()).select_from(Comment).where(Comment.thesis_public_id == entity.public_id)
        )

        premium_unlocked = self._can_view_premium(entity, viewer_wallet)
        should_hide_private = entity.is_premium and not premium_unlocked

        return ThesisResponse(
            id=entity.public_id,
            author_wallet=entity.author_wallet,
            author_pseudonym=profile.pseudonym,
            author_rank=profile.rank,
            asset=entity.asset,
            horizon=entity.horizon,
            bias=entity.bias,
            price_volatility=None if should_hide_private else entity.price_volatility,
            context_climate=None if should_hide_private else entity.context_climate,
            expected_demand=None if should_hide_private else entity.expected_demand,
            author_confidence=None if should_hide_private else entity.author_confidence,
            risk_score=round(entity.risk_score, 2),
            risk_level=RiskLevel(entity.risk_level),
            summary=entity.summary,
            thesis_text=None if should_hide_private else entity.thesis_text,
            premium_text=entity.premium_text if premium_unlocked else None,
            is_premium=entity.is_premium,
            premium_price_wei=entity.premium_price_wei,
            premium_locked=entity.is_premium and not premium_unlocked,
            evaluation_deadline=entity.evaluation_deadline,
            reference_price=entity.reference_price,
            invalidation_condition=entity.invalidation_condition,
            status=entity.status,
            is_useful=entity.is_useful,
            resolution_note=entity.resolution_note,
            post_hash=entity.post_hash,
            tx_hash=entity.tx_hash,
            chain_id=entity.chain_id,
            onchain_recorded_at=entity.onchain_recorded_at,
            likes_count=likes_count or 0,
            comments_count=comments_count or 0,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    def _to_comment_response(self, entity: Comment, viewer_wallet: str | None = None) -> CommentResponse:
        profile = self._get_profile(entity.author_wallet)
        thesis = self.db.scalar(select(Thesis).where(Thesis.public_id == entity.thesis_public_id))
        premium_unlocked = thesis is not None and self._can_view_premium(thesis, viewer_wallet)
        hidden = bool(entity.is_premium and not premium_unlocked)

        return CommentResponse(
            id=entity.public_id,
            thesis_id=entity.thesis_public_id,
            parent_comment_id=entity.parent_comment_id,
            author_wallet=entity.author_wallet,
            author_pseudonym=profile.pseudonym,
            author_rank=profile.rank,
            content="[Contenido premium bloqueado]" if hidden else entity.content,
            is_premium=entity.is_premium,
            status=entity.status,
            comment_hash=entity.comment_hash,
            tx_hash=entity.tx_hash,
            chain_id=entity.chain_id,
            onchain_recorded_at=entity.onchain_recorded_at,
            created_at=entity.created_at,
        )

    def _get_profile(self, wallet: str) -> Profile:
        profile = self.db.scalar(select(Profile).where(Profile.wallet_address == wallet))
        if profile is not None:
            return profile

        ProfileService(self.db).get_or_create_profile(wallet)
        refreshed = self.db.scalar(select(Profile).where(Profile.wallet_address == wallet))
        if refreshed is None:
            raise ValueError("Unable to create profile for wallet")

        return refreshed

    def _can_view_premium(self, thesis: Thesis, viewer_wallet: str | None) -> bool:
        if not thesis.is_premium:
            return True

        if viewer_wallet is None:
            return False

        wallet = normalize_wallet(viewer_wallet)
        if wallet == thesis.author_wallet:
            return True

        active_subscription = self.db.scalar(
            select(Subscription)
            .where(
                Subscription.creator_wallet == thesis.author_wallet,
                Subscription.subscriber_wallet == wallet,
                Subscription.status == "active",
            )
            .order_by(Subscription.created_at.desc())
        )

        if active_subscription is None or active_subscription.tx_hash is None:
            return False

        if active_subscription.expires_at is None:
            return True

        return active_subscription.expires_at >= datetime.utcnow()
