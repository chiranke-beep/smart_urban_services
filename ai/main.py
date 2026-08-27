"""
Smart Urban Services - AI Microservice Engine
Entrypoint: ai/main.py
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import base64

from models.hazard_classifier import HazardVisionClassifier
from models.geo_dispatcher import SmartGeoDispatcher
from models.cost_estimator import DynamicCostEstimator
from models.nic_validator import SriLankanNICValidator

app = FastAPI(
    title="Smart Urban Services - AI & ML Engine",
    description="Machine Learning Microservice for Hazard Vision, Dispatch Optimization, Cost Estimation & NIC Verification",
    version="1.0.0",
)

# Enable CORS for Frontend and Backend services
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate AI Models
vision_model = HazardVisionClassifier()
geo_dispatcher = SmartGeoDispatcher()
cost_estimator = DynamicCostEstimator()
nic_validator = SriLankanNICValidator()


# ─── Pydantic Request Schemas ──────────────────────────────────────────────────

class Base64VisionRequest(BaseModel):
    imageBase64: str
    description: Optional[str] = ""

class GeoDispatchRequest(BaseModel):
    incident_lat: float
    incident_lng: float
    required_category: str
    providers: List[Dict[str, Any]]
    max_radius_km: Optional[float] = 35.0

class CostEstimateRequest(BaseModel):
    trade_category: str
    district: Optional[str] = "Colombo"
    urgency: Optional[str] = "MEDIUM"
    estimated_hours: Optional[float] = 3.0
    materials_cost_lkr: Optional[float] = 0.0

class NICValidationRequest(BaseModel):
    nic_number: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Smart Urban Services AI Engine",
        "version": "1.0.0",
        "models": {
            "hazard_vision": "active",
            "geo_dispatcher": "active",
            "cost_estimator": "active",
            "nic_validator": "active",
        },
    }


# 1. Computer Vision Hazard Detection (File Upload or Base64)
@app.post("/api/ai/vision-scan")
async def vision_scan(
    file: Optional[UploadFile] = File(None),
    imageBase64: Optional[str] = Form(None),
    description: Optional[str] = Form(""),
):
    image_bytes = None

    if file:
        image_bytes = await file.read()
    elif imageBase64:
        if "," in imageBase64:
            imageBase64 = imageBase64.split(",")[1]
        try:
            image_bytes = base64.b64decode(imageBase64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data.")

    if not image_bytes:
        raise HTTPException(status_code=400, detail="No image file or base64 provided.")

    result = vision_model.analyze_image_bytes(image_bytes, user_description=description)
    return result


@app.post("/api/ai/vision-scan-json")
async def vision_scan_json(req: Base64VisionRequest):
    data = req.imageBase64
    if "," in data:
        data = data.split(",")[1]
    try:
        image_bytes = base64.b64decode(data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image payload.")

    result = vision_model.analyze_image_bytes(image_bytes, user_description=req.description)
    return result


# 2. Smart Geo-Dispatch & Provider Ranking
@app.post("/api/ai/recommend-dispatch")
def recommend_dispatch(req: GeoDispatchRequest):
    ranked = geo_dispatcher.rank_providers(
        incident_lat=req.incident_lat,
        incident_lng=req.incident_lng,
        required_category=req.required_category,
        providers=req.providers,
        max_radius_km=req.max_radius_km,
    )
    return {
        "success": True,
        "total_evaluated": len(req.providers),
        "total_matching": len(ranked),
        "recommendations": ranked,
    }


# 3. Dynamic Cost & Fair-Wage Estimator
@app.post("/api/ai/estimate-cost")
def estimate_cost(req: CostEstimateRequest):
    return cost_estimator.estimate_job_cost(
        trade_category=req.trade_category,
        district=req.district,
        urgency=req.urgency,
        estimated_hours=req.estimated_hours,
        materials_cost_lkr=req.materials_cost_lkr,
    )


# 4. Sri Lankan NIC Validator & Demographic Parser
@app.post("/api/ai/verify-nic")
def verify_nic(req: NICValidationRequest):
    return nic_validator.validate_and_parse(req.nic_number)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
