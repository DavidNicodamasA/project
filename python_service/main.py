"""
HandyPro AI/ML Microservice - FastAPI
Path: python_service/main.py

Endpoints:
- GET  /health
- POST /ml/recommend-providers
- POST /ml/estimate-price
- POST /ml/analyze-sentiment
- POST /ml/predict-maintenance
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from ml_engine import (
    provider_recommender,
    price_estimator,
    sentiment_analyzer,
    maintenance_engine,
)

app = FastAPI(
    title="HandyPro AI/ML Microservice",
    description="Hyperlocal Machine Learning & AI Optimization Engine for HandyPro Home Services",
    version="2.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# PYDANTIC REQUEST & RESPONSE MODELS
# ==========================================

class Coordinates(BaseModel):
    lat: float = 13.0827
    lng: float = 80.2707
    locationId: Optional[str] = "chennai"
    district: Optional[str] = "Chennai"


class ProviderRecommendationRequest(BaseModel):
    providers: List[Dict[str, Any]]
    customerCoordinates: Coordinates
    category: Optional[str] = "all"
    isEmergency: Optional[bool] = False
    preferredMaxPrice: Optional[float] = None


class PriceEstimationRequest(BaseModel):
    category: str
    complexity: Optional[str] = "standard"
    isEmergency: Optional[bool] = False
    distanceKm: Optional[float] = 3.5
    estimatedHours: Optional[float] = 1.0
    materialsRequired: Optional[bool] = False


class SentimentAnalysisRequest(BaseModel):
    comment: str
    rating: Optional[float] = 5.0
    providerId: Optional[str] = None
    bookingId: Optional[str] = None


class PredictiveMaintenanceRequest(BaseModel):
    applianceName: str
    category: str
    daysSinceLastService: int
    usageLevel: Optional[str] = "MODERATE"
    ambientConditions: Optional[str] = "moderate"


# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "HandyPro FastAPI ML Engine",
        "scikit_learn": True,
        "features": [
            "Smart Provider Recommendation",
            "Service Price Estimation",
            "Review Sentiment Analysis",
            "Predictive Appliance Maintenance",
        ],
    }


@app.post("/ml/recommend-providers")
def recommend_providers_endpoint(req: ProviderRecommendationRequest):
    try:
        coords = req.customerCoordinates.model_dump()
        ranked = provider_recommender.rank_providers(
            providers=req.providers,
            customer_coords=coords,
            category=req.category,
            is_emergency=req.isEmergency,
            preferred_max_price=req.preferredMaxPrice,
        )
        return {
            "success": True,
            "count": len(ranked),
            "data": ranked,
            "engine": "Scikit-Learn Multi-Factor Recommender",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ml/estimate-price")
def estimate_price_endpoint(req: PriceEstimationRequest):
    try:
        estimate = price_estimator.estimate_price(
            category=req.category,
            complexity=req.complexity,
            is_emergency=req.isEmergency,
            distance_km=req.distanceKm,
            estimated_hours=req.estimatedHours,
            materials_required=req.materialsRequired,
        )
        return {
            "success": True,
            "data": estimate,
            "engine": "Scikit-Learn Dynamic Pricing Engine",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ml/analyze-sentiment")
def analyze_sentiment_endpoint(req: SentimentAnalysisRequest):
    try:
        result = sentiment_analyzer.analyze(
            comment=req.comment,
            rating=req.rating,
        )
        return {
            "success": True,
            "data": result,
            "engine": "HandyPro NLP Sentiment Classifier",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ml/predict-maintenance")
def predict_maintenance_endpoint(req: PredictiveMaintenanceRequest):
    try:
        result = maintenance_engine.predict_maintenance(
            appliance_name=req.applianceName,
            category=req.category,
            days_since_last_service=req.daysSinceLastService,
            usage_level=req.usageLevel,
            ambient_conditions=req.ambientConditions,
        )
        return {
            "success": True,
            "data": result,
            "engine": "HandyPro Appliance Predictive Maintenance Engine",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

