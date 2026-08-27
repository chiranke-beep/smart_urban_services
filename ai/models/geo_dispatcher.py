"""
Smart Urban Services - AI Geo-Dispatch & Worker Recommendation Model
Module: ai/models/geo_dispatcher.py
"""

import math
from typing import List, Dict, Any, Optional


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points in km."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


class SmartGeoDispatcher:
    """
    Evaluates candidate providers for an incident or service dispatch:
    Score = (TradeMatch * 0.35) + (ProximityScore * 0.30) + (RatingScore * 0.20) + (VerifiedBonus * 0.15)
    """

    def rank_providers(
        self,
        incident_lat: float,
        incident_lng: float,
        required_category: str,
        providers: List[Dict[str, Any]],
        max_radius_km: float = 35.0,
    ) -> List[Dict[str, Any]]:
        ranked = []

        for p in providers:
            p_lat = float(p.get("lat") or 6.9271)
            p_lng = float(p.get("lng") or 79.8612)
            dist_km = haversine_distance_km(incident_lat, incident_lng, p_lat, p_lng)

            if dist_km > max_radius_km:
                continue

            # Trade Match Score (0.0 to 1.0)
            p_trade = (p.get("category") or p.get("trade") or "").lower()
            if required_category.lower() in p_trade or p_trade in required_category.lower():
                trade_match = 1.0
            else:
                trade_match = 0.4

            # Proximity Score (exponential decay)
            proximity_score = max(0.0, 1.0 - (dist_km / max_radius_km))

            # Rating Score (0.0 to 1.0 from 5.0 scale)
            rating = float(p.get("rating") or 4.5)
            rating_score = min(1.0, rating / 5.0)

            # Verified & Experience Score
            is_verified = bool(p.get("verifiedBadge") or p.get("verified"))
            verified_score = 1.0 if is_verified else 0.5

            composite_score = (
                (trade_match * 0.35) +
                (proximity_score * 0.30) +
                (rating_score * 0.20) +
                (verified_score * 0.15)
            )

            # Estimated Arrival Time (assuming 30 km/h urban traffic in Sri Lanka + 5 min dispatch setup)
            est_minutes = int(round((dist_km / 30.0) * 60 + 5))

            ranked.append({
                **p,
                "distance_km": dist_km,
                "composite_score": round(composite_score * 100, 1),
                "estimated_arrival_minutes": max(est_minutes, 6),
                "recommended": False,
            })

        # Sort descending by composite score
        ranked.sort(key=lambda x: x["composite_score"], reverse=True)

        if ranked:
            ranked[0]["recommended"] = True

        return ranked
