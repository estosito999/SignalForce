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
        self.volatility["low"] = fuzz.trimf(self.volatility.universe, [0, 0, 40])
        self.volatility["medium"] = fuzz.trimf(self.volatility.universe, [20, 50, 80])
        self.volatility["high"] = fuzz.trimf(self.volatility.universe, [60, 100, 100])

        self.climate["favorable"] = fuzz.trimf(self.climate.universe, [0, 0, 40])
        self.climate["uncertain"] = fuzz.trimf(self.climate.universe, [20, 50, 80])
        self.climate["adverse"] = fuzz.trimf(self.climate.universe, [60, 100, 100])

        self.demand["low"] = fuzz.trimf(self.demand.universe, [0, 0, 40])
        self.demand["medium"] = fuzz.trimf(self.demand.universe, [20, 50, 80])
        self.demand["high"] = fuzz.trimf(self.demand.universe, [60, 100, 100])

        self.confidence["low"] = fuzz.trimf(self.confidence.universe, [0, 0, 40])
        self.confidence["medium"] = fuzz.trimf(self.confidence.universe, [20, 50, 80])
        self.confidence["high"] = fuzz.trimf(self.confidence.universe, [60, 100, 100])

        self.risk["low"] = fuzz.trimf(self.risk.universe, [0, 0, 40])
        self.risk["medium"] = fuzz.trimf(self.risk.universe, [25, 50, 75])
        self.risk["high"] = fuzz.trimf(self.risk.universe, [60, 100, 100])

    def _build_rules(self) -> list[ctrl.Rule]:
        return [
            ctrl.Rule(self.volatility["high"] | self.climate["adverse"], self.risk["high"]),
            ctrl.Rule(self.demand["low"] & self.volatility["medium"], self.risk["high"]),
            ctrl.Rule(self.demand["low"] & self.climate["adverse"], self.risk["high"]),
            ctrl.Rule(self.confidence["low"] & self.volatility["high"], self.risk["high"]),
            ctrl.Rule(self.confidence["low"] & self.climate["uncertain"], self.risk["high"]),
            ctrl.Rule(
                self.volatility["low"] & self.climate["favorable"] & self.demand["high"] & self.confidence["high"],
                self.risk["low"],
            ),
            ctrl.Rule(
                self.volatility["low"] & self.climate["favorable"] & self.demand["medium"] & self.confidence["high"],
                self.risk["low"],
            ),
            ctrl.Rule(
                self.volatility["low"] & self.climate["favorable"] & self.demand["low"] & self.confidence["high"],
                self.risk["medium"],
            ),
            ctrl.Rule(self.volatility["medium"] & self.climate["uncertain"], self.risk["medium"]),
            ctrl.Rule(self.volatility["medium"] & self.climate["favorable"] & self.demand["high"], self.risk["medium"]),
            ctrl.Rule(self.volatility["low"] & self.climate["uncertain"] & self.demand["high"], self.risk["medium"]),
            ctrl.Rule(
                self.volatility["medium"] | self.demand["medium"] | self.climate["uncertain"] | self.confidence["medium"],
                self.risk["medium"],
            ),
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
