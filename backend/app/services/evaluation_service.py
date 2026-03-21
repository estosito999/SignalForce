import hashlib
import json
from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Evaluation
from app.schemas.evaluation import EvaluationCreate, EvaluationOnchainUpdate, EvaluationResponse, RiskLevel
from app.services.fuzzy_engine import fuzzy_risk_engine


class EvaluationService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_evaluation(self, payload: EvaluationCreate) -> EvaluationResponse:
        fuzzy_result = fuzzy_risk_engine.evaluate(
            price_volatility=payload.price_volatility,
            context_climate=payload.expected_weather,
            expected_demand=payload.expected_demand,
            author_confidence=50,
        )

        public_id = str(uuid4())
        evaluation_hash = self._build_evaluation_hash(
            public_id=public_id,
            payload=payload,
            risk_score=fuzzy_result.risk_score,
            risk_level=fuzzy_result.risk_level.value,
        )

        entity = Evaluation(
            public_id=public_id,
            price_volatility=payload.price_volatility,
            expected_weather=payload.expected_weather,
            expected_demand=payload.expected_demand,
            risk_score=fuzzy_result.risk_score,
            risk_level=fuzzy_result.risk_level.value,
            explanation=fuzzy_result.explanation,
            evaluation_hash=evaluation_hash,
        )

        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)

        return self._to_response(entity)

    def list_evaluations(self) -> list[EvaluationResponse]:
        stmt = select(Evaluation).order_by(Evaluation.created_at.desc())
        records = self.db.scalars(stmt).all()
        return [self._to_response(record) for record in records]

    def register_onchain(self, evaluation_id: str, payload: EvaluationOnchainUpdate) -> EvaluationResponse:
        stmt = select(Evaluation).where(Evaluation.public_id == evaluation_id)
        entity = self.db.scalar(stmt)
        if entity is None:
            raise ValueError("Evaluation not found")

        entity.wallet_address = payload.wallet_address
        entity.tx_hash = payload.tx_hash
        entity.chain_id = payload.chain_id
        entity.recorded_onchain_at = datetime.utcnow()

        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)

        return self._to_response(entity)

    @staticmethod
    def _build_evaluation_hash(
        public_id: str,
        payload: EvaluationCreate,
        risk_score: float,
        risk_level: str,
    ) -> str:
        digest_payload = {
            "public_id": public_id,
            "price_volatility": payload.price_volatility,
            "expected_weather": payload.expected_weather,
            "expected_demand": payload.expected_demand,
            "risk_score": risk_score,
            "risk_level": risk_level,
        }
        encoded = json.dumps(digest_payload, sort_keys=True).encode("utf-8")
        return "0x" + hashlib.sha256(encoded).hexdigest()

    @staticmethod
    def _to_response(entity: Evaluation) -> EvaluationResponse:
        return EvaluationResponse(
            id=entity.public_id,
            price_volatility=entity.price_volatility,
            expected_weather=entity.expected_weather,
            expected_demand=entity.expected_demand,
            risk_score=round(entity.risk_score, 2),
            risk_level=RiskLevel(entity.risk_level),
            explanation=entity.explanation,
            evaluation_hash=entity.evaluation_hash,
            wallet_address=entity.wallet_address,
            tx_hash=entity.tx_hash,
            chain_id=entity.chain_id,
            created_at=entity.created_at,
            recorded_onchain_at=entity.recorded_onchain_at,
        )
