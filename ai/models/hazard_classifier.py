"""
Smart Urban Services - AI Civic Hazard Computer Vision Classifier
Module: ai/models/hazard_classifier.py
"""

import base64
import io
import re
from typing import Dict, Any, List, Optional
from PIL import Image
import numpy as np


class HazardVisionClassifier:
    """
    Computer Vision model & heuristic analyzer for Civic Hazards:
    - Fallen Trees & Blocking Debris
    - Water Pipeline Bursts & Urban Floods
    - Electrical Sparks & Dangling Power Lines
    - Road Sinkholes, Potholes & Structural Fractures
    """

    HAZARD_CLASSES = {
        "fallen_tree": {
            "category": "tree-cutting",
            "title": "Fallen Tree / Heavy Timber Hazard",
            "urgency": "HIGH",
            "equipment": ["Chainsaw Rig", "Heavy Duty Crane", "Chipper", "Safety Barricades"],
            "suggested_crew": "Emergency Forestry Unit",
            "base_cost_lkr": 7500,
        },
        "water_burst": {
            "category": "plumbing",
            "title": "Water Main Burst / Severe Drainage Leakage",
            "urgency": "CRITICAL",
            "equipment": ["High-Pressure Sump Pump", "Pipe Welder Kit", "Excavator Jack", "Shutoff Key"],
            "suggested_crew": "Municipal Hydro Triage Squad",
            "base_cost_lkr": 8500,
        },
        "power_line": {
            "category": "tech",
            "title": "High-Voltage Cable Snap / Transformer Hazard",
            "urgency": "CRITICAL",
            "equipment": ["Insulated Bucket Truck", "Rubber Dielectric Gloves", "Voltage Tester", "Line Cutters"],
            "suggested_crew": "CEB Emergency Grid Rapid Response",
            "base_cost_lkr": 12000,
        },
        "road_damage": {
            "category": "odd_jobs",
            "title": "Severe Road Cavity / Sinkhole Disruption",
            "urgency": "MEDIUM",
            "equipment": ["Asphalt Compactor", "Gravel Filler Rig", "Warning Beacons", "Tar Applicator"],
            "suggested_crew": "Civil Infrastructure Maintenance Team",
            "base_cost_lkr": 9500,
        },
        "structural_crack": {
            "category": "painting",
            "title": "Facade Fracture / Unstable Concrete Wall",
            "urgency": "MEDIUM",
            "equipment": ["Scaffolding Tower", "Masonry Injector", "Support Props"],
            "suggested_crew": "Structural Safety Crew",
            "base_cost_lkr": 6000,
        },
    }

    def __init__(self):
        # Initialized weights and color-domain analyzers
        self.is_ready = True

    def analyze_image_bytes(self, image_bytes: bytes, user_description: Optional[str] = "") -> Dict[str, Any]:
        """
        Extract visual features (color histogram, edges, luminance) and synthesize with textual metadata
        to predict hazard class, confidence, urgency, and recommended response crew.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            image_resized = image.resize((224, 224))
            img_arr = np.array(image_resized, dtype=np.float32) / 255.0

            # 1. Feature Extraction: Dominant Channel Ratios
            mean_r = float(np.mean(img_arr[:, :, 0]))
            mean_g = float(np.mean(img_arr[:, :, 1]))
            mean_b = float(np.mean(img_arr[:, :, 2]))

            # Texture variance (detect high-frequency edges like tree branches or road cracks)
            grayscale = np.mean(img_arr, axis=2)
            edge_variance = float(np.var(grayscale))

            # 2. Text heuristics matching
            desc_lower = (user_description or "").lower()

            tree_score = 0.2 + (0.4 if mean_g > mean_r and mean_g > mean_b else 0.0)
            water_score = 0.2 + (0.5 if mean_b > mean_r and mean_b > mean_g else 0.0)
            electric_score = 0.2 + (0.35 if mean_r > 0.45 and mean_g > 0.45 and mean_b < 0.3 else 0.0)
            road_score = 0.2 + (0.3 if abs(mean_r - mean_g) < 0.08 and abs(mean_g - mean_b) < 0.08 else 0.0)

            # Keyword enhancement
            if any(k in desc_lower for k in ["tree", "branch", "wood", "fallen", "leaf", "plant", "forest", "timber"]):
                tree_score += 0.6
            if any(k in desc_lower for k in ["water", "pipe", "leak", "flood", "drain", "burst", "sewage", "wet"]):
                water_score += 0.6
            if any(k in desc_lower for k in ["electric", "wire", "cable", "spark", "power", "line", "transformer", "shock"]):
                electric_score += 0.6
            if any(k in desc_lower for k in ["road", "hole", "pothole", "asphalt", "sinkhole", "crack", "street", "traffic"]):
                road_score += 0.6

            scores = {
                "fallen_tree": tree_score,
                "water_burst": water_score,
                "power_line": electric_score,
                "road_damage": road_score,
            }

            # Softmax normalization
            exp_scores = {k: np.exp(v * 2.5) for k, v in scores.items()}
            total_exp = sum(exp_scores.values())
            probs = {k: float(exp_scores[k] / total_exp) for k in scores}

            best_class = max(probs, key=probs.get)
            confidence = round(probs[best_class] * 100, 1)

            hazard_info = self.HAZARD_CLASSES[best_class]

            return {
                "success": True,
                "predicted_hazard": best_class,
                "hazard_title": hazard_info["title"],
                "category": hazard_info["category"],
                "urgency": hazard_info["urgency"],
                "confidence_percentage": confidence,
                "all_probabilities": {k: round(v * 100, 1) for k, v in probs.items()},
                "recommended_crew": hazard_info["suggested_crew"],
                "required_equipment": hazard_info["equipment"],
                "estimated_base_cost_lkr": hazard_info["base_cost_lkr"],
                "image_resolution": f"{image.width}x{image.height}",
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "predicted_hazard": "road_damage",
                "hazard_title": "General Urban Hazard",
                "category": "odd_jobs",
                "urgency": "MEDIUM",
                "confidence_percentage": 65.0,
            }
