"""
Smart Urban Services - AI Cost & Fair-Wage Estimator Model
Module: ai/models/cost_estimator.py
"""

from typing import Dict, Any, Optional


class DynamicCostEstimator:
    """
    Predicts fair labor and service rates across Sri Lankan municipal districts based on:
    - Base trade index (LKR)
    - District living index coefficient (e.g. Colombo 1.25, Kandy 1.10, Rural 0.95)
    - Urgency multiplier (Emergency 1.40x, High 1.20x, Standard 1.00x)
    - Estimated duration & scope of work
    """

    BASE_TRADE_RATES_LKR = {
        "tree-cutting": {"hourly": 850, "base_job": 4500},
        "plumbing": {"hourly": 750, "base_job": 3500},
        "painting": {"hourly": 700, "base_job": 4000},
        "tech": {"hourly": 900, "base_job": 3200},
        "cleaning": {"hourly": 600, "base_job": 2800},
        "odd_jobs": {"hourly": 650, "base_job": 2500},
    }

    DISTRICT_MULTIPLIERS = {
        "Colombo": 1.25,
        "Gampaha": 1.15,
        "Kalutara": 1.05,
        "Kandy": 1.10,
        "Galle": 1.08,
        "Matara": 1.02,
        "Jaffna": 1.05,
        "Kurunegala": 1.00,
        "Anuradhapura": 0.95,
        "Badulla": 0.95,
        "Ratnapura": 0.98,
    }

    URGENCY_MULTIPLIERS = {
        "CRITICAL": 1.45,
        "HIGH": 1.25,
        "MEDIUM": 1.05,
        "LOW": 1.00,
    }

    def estimate_job_cost(
        self,
        trade_category: str,
        district: str = "Colombo",
        urgency: str = "MEDIUM",
        estimated_hours: float = 3.0,
        materials_cost_lkr: float = 0.0,
    ) -> Dict[str, Any]:
        category_key = trade_category.lower() if trade_category.lower() in self.BASE_TRADE_RATES_LKR else "odd_jobs"
        rates = self.BASE_TRADE_RATES_LKR[category_key]

        district_factor = self.DISTRICT_MULTIPLIERS.get(district, 1.05)
        urgency_factor = self.URGENCY_MULTIPLIERS.get(urgency.upper(), 1.00)

        # Compute labor cost
        hourly_rate = round(rates["hourly"] * district_factor * urgency_factor)
        base_labor = round(rates["base_job"] * district_factor * urgency_factor)
        labor_total = max(base_labor, int(hourly_rate * estimated_hours))

        # Platform insurance & guarantee fee (5%)
        insurance_fee = round(labor_total * 0.05)

        total_estimate = labor_total + materials_cost_lkr + insurance_fee

        return {
            "success": True,
            "trade_category": category_key,
            "district": district,
            "urgency": urgency.upper(),
            "recommended_hourly_rate_lkr": hourly_rate,
            "estimated_labor_lkr": labor_total,
            "estimated_materials_lkr": materials_cost_lkr,
            "platform_guarantee_fee_lkr": insurance_fee,
            "total_estimated_lkr": total_estimate,
            "price_range": {
                "min_lkr": round(total_estimate * 0.85),
                "max_lkr": round(total_estimate * 1.18),
            },
        }
