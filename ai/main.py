"""
Smart Urban Services - AI Microservice Engine
Entrypoint: ai/main.py

Serves the trained Machine Learning models (Computer Vision, Cost Regressor,
Spatial Dispatcher & Sri Lankan NIC Validator) over FastAPI REST endpoints.
"""

import os
import io
import base64
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import joblib
import numpy as np
import pandas as pd
from PIL import Image, ImageFilter

app = FastAPI(
    title="Smart Urban Services - AI & ML Engine",
    description="Production REST API serving trained Machine Learning models for civic & domestic services",
    version="2.0.0",
)

# Enable CORS for Frontend (Next.js :3000) and Backend (Node.js :5000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

# ── Load Pre-trained Models ──
hazard_model = None
cost_model_dict = None
geo_model_dict = None

hazard_path = os.path.join(MODELS_DIR, "hazard_classifier.pkl")
if os.path.exists(hazard_path):
    try:
        hazard_model = joblib.load(hazard_path)
        print("Trained Hazard Classifier loaded successfully.")
    except Exception as e:
        print(f"Warning loading hazard model: {e}")

cost_path = os.path.join(MODELS_DIR, "cost_regressor.pkl")
if os.path.exists(cost_path):
    try:
        cost_model_dict = joblib.load(cost_path)
        print("Trained Cost Regressor loaded successfully.")
    except Exception as e:
        print(f"Warning loading cost model: {e}")

geo_path = os.path.join(MODELS_DIR, "geo_dispatcher.pkl")
if os.path.exists(geo_path):
    try:
        geo_model_dict = joblib.load(geo_path)
        print("Trained Geo Dispatcher loaded successfully.")
    except Exception as e:
        print(f"Warning loading geo model: {e}")


# ─── Pydantic Request Schemas ───

class CostEstimateRequest(BaseModel):
    trade_category: str
    district: str
    urgency: Optional[str] = "MEDIUM"
    estimated_hours: Optional[float] = 2.0
    materials_cost_lkr: Optional[float] = 0.0


class ProviderCandidate(BaseModel):
    id: str
    name: str
    trade: str
    lat: float
    lng: float
    rating: Optional[float] = 5.0
    verified: Optional[bool] = False


class GeoDispatchRequest(BaseModel):
    incident_lat: float
    incident_lng: float
    required_category: str
    providers: List[ProviderCandidate]
    max_radius_km: Optional[float] = 30.0


class NICVerifyRequest(BaseModel):
    nic_number: str


HAZARD_METADATA = {
    "potholes": {
        "title": "Street Pothole & Road Cavity Damage",
        "category": "odd_jobs",
        "urgency": "HIGH",
        "equipment": ["Asphalt Plate Compactor", "Cold Tar Mix", "Warning Cones"],
        "suggested_crew": "Highway & Urban Road Maintenance Crew",
        "base_cost_lkr": 9500,
    },
    "wall_cracks": {
        "title": "Wall Crack & Plaster / Masonry Repair",
        "category": "painting",
        "urgency": "LOW",
        "equipment": ["Putty Knife & Spatula", "Crack Sealant", "Sanding Block"],
        "suggested_crew": "Professional Mason & Painter",
        "base_cost_lkr": 2800,
    },
    "fallen_trees": {
        "title": "Fallen Tree & Road Timber Hazard",
        "category": "tree-cutting",
        "urgency": "HIGH",
        "equipment": ["Heavy Duty Chainsaw Rig", "Crane Winch", "Safety Barricades"],
        "suggested_crew": "Emergency Municipal Forestry Unit",
        "base_cost_lkr": 7500,
    },
    "water_leaks": {
        "title": "Water Pipeline Defect & Drainage Leak",
        "category": "plumbing",
        "urgency": "MEDIUM",
        "equipment": ["Pipe Wrench Kit", "Teflon Sealing Tape", "PPR Welder"],
        "suggested_crew": "Certified Local Plumber",
        "base_cost_lkr": 2500,
    },
    "pc_repair": {
        "title": "Computer Hardware & Laptop Repair",
        "category": "pc-repair",
        "urgency": "MEDIUM",
        "equipment": ["Precision Screwdriver Kit", "Digital Multimeter", "Thermal Paste & Soldering Iron"],
        "suggested_crew": "Certified PC & Electronics Technician",
        "base_cost_lkr": 2750,
    },
    "yard_cleaning": {
        "title": "Yard Cleaning & Garden Waste Clearance",
        "category": "tree-cutting",
        "urgency": "LOW",
        "equipment": ["Heavy Leaf Rake & Yard Broom", "Grass Shears / String Trimmer", "Bio-Waste Disposal Bags"],
        "suggested_crew": "Local Gardener & Yard Cleaner",
        "base_cost_lkr": 2400,
    },
    "house_cleaning": {
        "title": "Deep Home & Pressure Wash Cleaning",
        "category": "cleaning",
        "urgency": "LOW",
        "equipment": ["High Pressure Surface Cleaner", "Industrial Wet Vacuum", "Eco-friendly Detergents"],
        "suggested_crew": "Professional Cleaning Crew",
        "base_cost_lkr": 3200,
    },
}


def extract_cv_features(img: Image.Image) -> List[float]:
    """Extract standard 6-channel CV spatial and chromatic tensor."""
    img_res = img.convert("RGB").resize((128, 128))
    arr = np.array(img_res, dtype=np.float32) / 255.0
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    exg = float(np.mean(2.0 * g - r - b))
    gray_2d = 0.299 * r + 0.587 * g + 0.114 * b
    gray = float(np.mean(gray_2d))
    neutrality = float(np.mean(1.0 - (np.std(arr, axis=2) * 2.0)))
    dark_cavity = float(np.mean(gray_2d < 0.30))
    
    gray_pil = Image.fromarray((gray_2d * 255).astype(np.uint8))
    edges = np.array(gray_pil.filter(ImageFilter.FIND_EDGES), dtype=np.float32) / 255.0
    edge_density = float(np.mean(edges > 0.25))
    blue_water = float(np.mean((b > r + 0.08) & (b > g + 0.05)))
    
    return [exg, gray, neutrality, dark_cavity, edge_density, blue_water]


# ─── Endpoints ───

@app.get("/")
def health_check():
    """Health check & status of loaded models."""
    trained_models = [f for f in os.listdir(MODELS_DIR) if f.endswith(".pkl") or f.endswith(".h5")] if os.path.exists(MODELS_DIR) else []
    return {
        "status": "online",
        "service": "Smart Urban Services AI Microservice",
        "version": "2.0.0",
        "trained_models_loaded": trained_models,
    }


@app.post("/api/ai/vision-scan")
async def vision_scan(request: Request):
    """
    Universal Computer Vision model inference on uploaded image (JSON Base64 or Multipart).
    Uses trained Random Forest Classifier (hazard_classifier.pkl).
    """
    image_bytes = None
    description = ""
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        body = await request.json()
        raw_b64 = body.get("imageBase64") or body.get("image") or ""
        description = body.get("description") or ""
        if raw_b64:
            clean_b64 = raw_b64.split(",")[-1] if "," in raw_b64 else raw_b64
            try:
                image_bytes = base64.b64decode(clean_b64)
            except Exception as e:
                print(f"Base64 decode error: {e}")
    else:
        form = await request.form()
        file = form.get("file")
        if file and hasattr(file, "read"):
            image_bytes = await file.read()
        raw_b64 = form.get("imageBase64")
        if raw_b64 and not image_bytes:
            clean_b64 = raw_b64.split(",")[-1] if "," in raw_b64 else raw_b64
            try:
                image_bytes = base64.b64decode(clean_b64)
            except Exception:
                pass
        description = form.get("description") or ""

    if image_bytes:
        try:
            img = Image.open(io.BytesIO(image_bytes))
            features = extract_cv_features(img)
            
            if hazard_model:
                probs = hazard_model.predict_proba([features])[0]
                classes = hazard_model.classes_
                best_idx = np.argmax(probs)
                predicted = str(classes[best_idx])
                conf = round(float(probs[best_idx]) * 100, 1)
                detection_source = f"Trained Random Forest Classifier (Confidence: {conf}%)"
            else:
                raise ValueError("Trained hazard model is not loaded")

            meta = HAZARD_METADATA.get(predicted, HAZARD_METADATA["potholes"])
            return {
                "success": True,
                "has_image": True,
                "predicted_hazard": predicted,
                "hazard_title": meta["title"],
                "category": meta["category"],
                "urgency": meta["urgency"],
                "confidence_percentage": conf,
                "required_equipment": meta["equipment"],
                "recommended_crew": meta["suggested_crew"],
                "estimated_base_cost_lkr": meta["base_cost_lkr"],
                "detection_source": detection_source,
            }
        except Exception as e:
            print(f"Error in vision ML pipeline: {e}")
            raise HTTPException(status_code=500, detail=f"AI Vision Inference Error: {str(e)}")
    else:
        # ── NO IMAGE UPLOADED ──
        # Use category selected by the citizen without generating a fake AI confidence score.
        user_cat = (user_category or "plumbing").lower().replace("-", "_")
        
        # Map user category to hazard metadata key
        category_to_hazard = {
            "plumbing": "water_leaks",
            "pc_repair": "pc_repair",
            "painting": "wall_cracks",
            "tree_cutting": "fallen_trees",
            "cleaning": "house_cleaning",
            "odd_jobs": "potholes",
        }
        matched_hazard = category_to_hazard.get(user_cat, "water_leaks")
        meta = HAZARD_METADATA.get(matched_hazard, HAZARD_METADATA["water_leaks"])

        return {
            "success": True,
            "has_image": False,
            "predicted_hazard": matched_hazard,
            "hazard_title": meta["title"],
            "category": meta["category"],
            "urgency": meta["urgency"],
            "confidence_percentage": None,  # No fake AI confidence when no image is uploaded
            "required_equipment": meta["equipment"],
            "recommended_crew": meta["suggested_crew"],
            "estimated_base_cost_lkr": meta["base_cost_lkr"],
            "detection_source": "User-Selected Category (No Image Uploaded)",
        }


@app.post("/api/ai/predict-cost")
def predict_cost(req: CostEstimateRequest):
    """
    Predicts fair service costs in LKR based on trade, district, urgency, and hours.
    Loads trained Random Forest Regression model from models/cost_regressor.pkl.
    """
    if cost_model_dict and "model" in cost_model_dict:
        reg = cost_model_dict["model"]
        cols = cost_model_dict["feature_columns"]
        
        sample = {c: 0 for c in cols}
        if "experience_years" in sample: sample["experience_years"] = 5.0
        if "estimated_hours" in sample: sample["estimated_hours"] = req.estimated_hours
        if "materials_cost_lkr" in sample: sample["materials_cost_lkr"] = req.materials_cost_lkr
        
        for col_name in cols:
            if col_name == f"district_{req.district}": sample[col_name] = 1
            if col_name == f"trade_{req.trade_category}": sample[col_name] = 1
            if col_name == f"urgency_{req.urgency}": sample[col_name] = 1
            
        feat_df = pd.DataFrame([sample])[cols]
        predicted_total = float(reg.predict(feat_df)[0])
    else:
        district_multipliers = {"Colombo": 1.25, "Gampaha": 1.15, "Kandy": 1.10, "Galle": 1.08}
        dist_mult = district_multipliers.get(req.district, 1.0)
        urg_mult = 1.45 if req.urgency == "CRITICAL" else (1.25 if req.urgency == "HIGH" else 1.0)
        hourly_base = 750.0
        predicted_total = (hourly_base * dist_mult * urg_mult * req.estimated_hours) + req.materials_cost_lkr + 350.0

    # Clean integer rounding for Sri Lankan Rupee pricing
    rounded_total = int(round(predicted_total / 10.0) * 10)
    min_cost = int(round((predicted_total * 0.88) / 10.0) * 10)
    max_cost = int(round((predicted_total * 1.12) / 10.0) * 10)

    return {
        "success": True,
        "trade_category": req.trade_category,
        "district": req.district,
        "urgency": req.urgency,
        "total_estimated_lkr": rounded_total,
        "price_range": {
            "min_lkr": min_cost,
            "max_lkr": max_cost,
        }
    }


def check_trade_compatibility(required_cat: str, provider_trade: str) -> float:
    req = required_cat.lower().replace("_", "-")
    trade = provider_trade.lower().replace("_", "-")

    if any(k in trade for k in ["all", "general", "handyman", "craftsman", "specialist"]):
        return 0.9

    CATEGORY_KEYWORDS = {
        "plumbing": ["plumb", "pipe", "drain", "water", "leak", "tap", "sanitary", "faucet"],
        "pc-repair": ["pc", "laptop", "computer", "hardware", "electron", "tech", "chip", "motherboard", "screen", "repair"],
        "painting": ["paint", "decor", "color", "wall", "plaster", "finish"],
        "tree-cutting": ["tree", "garden", "yard", "leaf", "leaves", "wood", "landscap", "trim", "arborist"],
        "cleaning": ["clean", "wash", "housekeep", "janitor", "hygiene", "deep clean"],
        "odd-jobs": ["mason", "carpenter", "roof", "mechanic", "repair", "handyman"],
    }

    keywords = CATEGORY_KEYWORDS.get(req, [req])
    for kw in keywords:
        if kw in trade:
            return 1.0

    return 0.0


@app.post("/api/ai/recommend-dispatch")
def recommend_dispatch(req: GeoDispatchRequest):
    """
    Ranks nearby workers using Haversine distance and multi-criteria scoring.
    """
    R = 6371.0  # Earth radius km
    scored = []
    
    for p in req.providers:
        dlat = np.radians(p.lat - req.incident_lat)
        dlng = np.radians(p.lng - req.incident_lng)
        a = np.sin(dlat / 2)**2 + np.cos(np.radians(req.incident_lat)) * np.cos(np.radians(p.lat)) * np.sin(dlng / 2)**2
        dist_km = round(R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a)), 2)
        
        if dist_km <= req.max_radius_km:
            trade_match = check_trade_compatibility(req.required_category, p.trade)
            prox_score = max(0.0, 1.0 - (dist_km / req.max_radius_km))
            rating_score = (p.rating or 5.0) / 5.0
            verif_score = 1.0 if p.verified else 0.5
            
            comp_score = (trade_match * 0.45) + (prox_score * 0.25) + (rating_score * 0.15) + (verif_score * 0.15)
            eta_mins = max(5, int((dist_km / 25.0) * 60 + 5))
            
            scored.append({
                "id": p.id,
                "name": p.name,
                "trade": p.trade,
                "lat": p.lat,
                "lng": p.lng,
                "rating": p.rating,
                "verified": p.verified,
                "distance_km": dist_km,
                "composite_score": round(comp_score * 100, 1),
                "estimated_arrival_minutes": eta_mins,
                "trade_compatible": trade_match > 0.0,
            })

    # Prioritize trade-compatible workers first, then by composite score
    scored.sort(key=lambda x: (x["trade_compatible"], x["composite_score"]), reverse=True)
    if scored and scored[0]["trade_compatible"]:
        scored[0]["recommended"] = True

    return {
        "success": True,
        "total_evaluated": len(req.providers),
        "total_matching": len(scored),
        "recommendations": scored,
    }


@app.post("/api/ai/verify-nic")
def verify_nic(req: NICVerifyRequest):
    """
    Sri Lankan DRP National Identity Card Validator & Demographic Parser.
    """
    nic = req.nic_number.strip().upper()
    is_old = len(nic) == 10 and nic[:9].isdigit() and nic[9] in ["V", "X"]
    is_new = len(nic) == 12 and nic.isdigit()

    if not (is_old or is_new):
        return {"valid": False, "error": "Invalid Sri Lankan NIC format (Must be 9 digits+V/X or 12 digits)"}

    if is_old:
        birth_year = 1900 + int(nic[:2])
        days = int(nic[2:5])
        format_type = "OLD_9_DIGIT"
    else:
        birth_year = int(nic[:4])
        days = int(nic[4:7])
        format_type = "NEW_12_DIGIT"

    from datetime import datetime
    gender = "FEMALE" if days > 500 else "MALE"
    day = days - 500 if days > 500 else days
    age = datetime.now().year - birth_year

    # Official Sri Lankan DRP 29-day month table
    month_days = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    m_idx = 0
    while m_idx < 12 and day > month_days[m_idx]:
        day -= month_days[m_idx]
        m_idx += 1
    
    birthday = f"{birth_year:04d}-{m_idx + 1:02d}-{day:02d}"

    return {
        "valid": True,
        "nic": nic,
        "format_type": format_type,
        "birth_year": birth_year,
        "birthday": birthday,
        "estimated_age": age,
        "gender": gender,
        "is_adult": age >= 18,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
