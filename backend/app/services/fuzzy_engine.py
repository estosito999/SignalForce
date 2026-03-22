from dataclasses import dataclass

import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

from app.schemas.evaluation import RiskLevel


@dataclass
class FuzzyEvaluationResult:
    risk_score: float
    risk_level: RiskLevel
    explanation: str


class FuzzyRiskEngine:
    def __init__(self) -> None:
        self.volatility = ctrl.Antecedent(np.arange(0, 101, 1), "volatility")
        self.climate = ctrl.Antecedent(np.arange(0, 101, 1), "climate")
        self.demand = ctrl.Antecedent(np.arange(0, 101, 1), "demand")
        self.confidence = ctrl.Antecedent(np.arange(0, 101, 1), "confidence")
        self.risk = ctrl.Consequent(np.arange(0, 101, 1), "risk")

        self._define_memberships()
        self.control_system = ctrl.ControlSystem(self._build_rules())

    def _define_memberships(self) -> None:
        self.volatility["low"] = fuzz.trapmf(self.volatility.universe, [0, 0, 25, 45])
        self.volatility["medium"] = fuzz.trimf(self.volatility.universe, [30, 50, 70])
        self.volatility["high"] = fuzz.trapmf(self.volatility.universe, [55, 75, 100, 100])

        self.climate["favorable"] = fuzz.trapmf(self.climate.universe, [0, 0, 25, 45])
        self.climate["uncertain"] = fuzz.trimf(self.climate.universe, [30, 50, 70])
        self.climate["adverse"] = fuzz.trapmf(self.climate.universe, [55, 75, 100, 100])

        self.demand["low"] = fuzz.trapmf(self.demand.universe, [0, 0, 25, 45])
        self.demand["medium"] = fuzz.trimf(self.demand.universe, [30, 50, 70])
        self.demand["high"] = fuzz.trapmf(self.demand.universe, [55, 75, 100, 100])

        self.confidence["low"] = fuzz.trapmf(self.confidence.universe, [0, 0, 25, 45])
        self.confidence["medium"] = fuzz.trimf(self.confidence.universe, [30, 50, 70])
        self.confidence["high"] = fuzz.trapmf(self.confidence.universe, [55, 75, 100, 100])

        self.risk["low"] = fuzz.trapmf(self.risk.universe, [0, 0, 25, 45])
        self.risk["medium"] = fuzz.trimf(self.risk.universe, [30, 50, 70])
        self.risk["high"] = fuzz.trapmf(self.risk.universe, [55, 75, 100, 100])

    def _build_rules(self) -> list[ctrl.Rule]:
        return [
            # Matriz principal (sensibilidad fuerte a volatilidad y demanda)
            ctrl.Rule(self.volatility["low"] & self.demand["high"], self.risk["low"]),
            ctrl.Rule(self.volatility["low"] & self.demand["medium"], self.risk["low"]),
            ctrl.Rule(self.volatility["low"] & self.demand["low"], self.risk["medium"]),
            ctrl.Rule(self.volatility["medium"] & self.demand["high"], self.risk["low"]),
            ctrl.Rule(self.volatility["medium"] & self.demand["medium"], self.risk["medium"]),
            ctrl.Rule(self.volatility["medium"] & self.demand["low"], self.risk["high"]),
            ctrl.Rule(self.volatility["high"] & self.demand["high"], self.risk["medium"]),
            ctrl.Rule(self.volatility["high"] & self.demand["medium"], self.risk["high"]),
            ctrl.Rule(self.volatility["high"] & self.demand["low"], self.risk["high"]),
            # Ajustes secundarios (solo afectan en extremos)
            ctrl.Rule(self.climate["adverse"] & self.demand["low"], self.risk["high"]),
            ctrl.Rule(self.climate["favorable"] & self.demand["high"], self.risk["low"]),
            ctrl.Rule(self.confidence["low"] & self.volatility["high"], self.risk["high"]),
            ctrl.Rule(self.confidence["high"] & self.demand["high"], self.risk["low"]),
        ]

    def evaluate(
        self,
        price_volatility: float,
        expected_demand: float,
        context_climate: float = 50.0,
        author_confidence: float = 50.0,
    ) -> FuzzyEvaluationResult:
        simulation = ctrl.ControlSystemSimulation(self.control_system)
        simulation.input["volatility"] = price_volatility
        simulation.input["climate"] = context_climate
        simulation.input["demand"] = expected_demand
        simulation.input["confidence"] = author_confidence
        simulation.compute()

        risk_score = float(np.clip(simulation.output["risk"], 0, 100))
        risk_level = self._risk_level_from_score(risk_score)
        explanation = self._build_explanation(
            risk_level=risk_level,
            price_volatility=price_volatility,
            context_climate=context_climate,
            expected_demand=expected_demand,
            author_confidence=author_confidence,
        )

        return FuzzyEvaluationResult(
            risk_score=round(risk_score, 2),
            risk_level=risk_level,
            explanation=explanation,
        )

    @staticmethod
    def _risk_level_from_score(risk_score: float) -> RiskLevel:
        if risk_score <= 33:
            return RiskLevel.low
        if risk_score <= 66:
            return RiskLevel.medium
        return RiskLevel.high

    @staticmethod
    def _build_explanation(
        risk_level: RiskLevel,
        price_volatility: float,
        context_climate: float,
        expected_demand: float,
        author_confidence: float,
    ) -> str:
        reasons: list[str] = []

        if price_volatility >= 65:
            reasons.append("la volatilidad del precio es elevada")
        elif price_volatility <= 35:
            reasons.append("la volatilidad del precio se mantiene contenida")

        if context_climate >= 65:
            reasons.append("el clima esperado es adverso")
        elif context_climate <= 35:
            reasons.append("el clima esperado es favorable")

        if expected_demand <= 35:
            reasons.append("la demanda esperada es debil")
        elif expected_demand >= 65:
            reasons.append("la demanda esperada es fuerte")

        if author_confidence <= 35:
            reasons.append("la confianza del autor es baja")
        elif author_confidence >= 65:
            reasons.append("la confianza del autor es alta")

        if not reasons:
            reasons.append("las variables estan en una zona intermedia")

        joined = ", ".join(reasons)

        if risk_level == RiskLevel.high:
            return f"Riesgo alto porque {joined}."
        if risk_level == RiskLevel.medium:
            return f"Riesgo medio: {joined}."
        return f"Riesgo bajo dado que {joined}."


fuzzy_risk_engine = FuzzyRiskEngine()
