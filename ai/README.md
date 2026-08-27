# Smart Urban Services - AI & Machine Learning Microservice 🧠

Welcome to the AI microservice for **Smart Urban Services**. This service provides intelligent vision classification, spatial geo-dispatching, dynamic cost prediction, and identity document validation.

---

## 📦 AI Models & Capabilities

1. **📷 Hazard Computer Vision Scanner (`/api/ai/vision-scan`)**
   - Classifies civic hazard images (fallen trees, burst pipelines, power lines, road potholes).
   - Generates confidence score, required municipal equipment, and estimated base cost.

2. **📍 Smart Geo-Dispatch & Provider Ranking (`/api/ai/recommend-dispatch`)**
   - Calculates real-time Haversine distance from incident to registered providers.
   - Evaluates composite score based on trade match (35%), proximity (30%), rating (20%), and verified status (15%).
   - Computes estimated arrival time (ETA) based on local traffic factors.

3. **💰 Dynamic Cost & Fair-Wage Estimator (`/api/ai/estimate-cost`)**
   - Computes fair market rates across 11 Sri Lankan districts with inflation coefficients and urgency multipliers.

4. **🛡️ Sri Lankan NIC Validator (`/api/ai/verify-nic`)**
   - Validates Old (9-digit + V/X) and New (12-digit) NIC formats.
   - Extracts exact Date of Birth, Gender, Age, and Adult status for background verification.

---

## 🚀 Quick Setup & Run

### 1. Install Python Dependencies
```bash
cd ai
pip install -r requirements.txt
```

### 2. Start the AI Server
```bash
python main.py
# Or with uvicorn directly:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger API docs available at: **`http://localhost:8000/docs`**
