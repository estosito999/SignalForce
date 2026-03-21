from uuid import uuid4

from sqlalchemy import select

from app.db.database import SessionLocal
from app.db.models import Evaluation, Profile, Thesis
from app.services.onchain_anchor_service import normalize_wallet


ZERO_WALLET = "0x0000000000000000000000000000000000000000"


def infer_bias(risk_level: str) -> str:
    if risk_level == "high":
        return "bearish"
    if risk_level == "low":
        return "bullish"
    return "neutral"


def ensure_profile(session: SessionLocal, wallet_address: str) -> None:
    existing = session.scalar(select(Profile).where(Profile.wallet_address == wallet_address))
    if existing is not None:
        return

    profile = Profile(wallet_address=wallet_address, pseudonym=f"SF-{wallet_address[2:8].upper()}")
    session.add(profile)


def migrate() -> tuple[int, int]:
    migrated = 0
    skipped = 0

    with SessionLocal() as session:
        evaluations = session.scalars(select(Evaluation).order_by(Evaluation.created_at.asc())).all()
        for item in evaluations:
            exists = session.scalar(select(Thesis).where(Thesis.post_hash == item.evaluation_hash))
            if exists is not None:
                skipped += 1
                continue

            wallet = normalize_wallet(item.wallet_address) if item.wallet_address else ZERO_WALLET
            ensure_profile(session, wallet)

            thesis = Thesis(
                public_id=str(uuid4()),
                author_wallet=wallet,
                asset="CORN",
                horizon="legacy",
                bias=infer_bias(item.risk_level),
                price_volatility=item.price_volatility,
                context_climate=item.expected_weather,
                expected_demand=item.expected_demand,
                author_confidence=50.0,
                risk_score=item.risk_score,
                risk_level=item.risk_level,
                summary=f"Migrado desde evaluacion legacy {item.public_id}",
                thesis_text=item.explanation,
                premium_text=None,
                is_premium=False,
                premium_price_wei="0",
                reference_price=1.0,
                invalidation_condition=None,
                status="active" if item.tx_hash else "pending_onchain",
                is_useful=None,
                resolution_note=None,
                evaluation_deadline=item.created_at,
                resolved_at=None,
                post_hash=item.evaluation_hash,
                tx_hash=item.tx_hash,
                chain_id=item.chain_id,
                onchain_recorded_at=item.recorded_onchain_at,
                created_at=item.created_at,
                updated_at=item.created_at,
            )

            session.add(thesis)
            migrated += 1

        session.commit()

    return migrated, skipped


if __name__ == "__main__":
    migrated_count, skipped_count = migrate()
    print(f"Migrated evaluations: {migrated_count}")
    print(f"Skipped (already migrated): {skipped_count}")
