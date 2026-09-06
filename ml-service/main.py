import os
import json
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from preprocessing.preprocess import load_data, clean_data, prepare_features
from optimization.optimizer import generate_recommendations, generate_single_resource_recommendations

app = FastAPI(
    title="AI Cloud Cost Optimizer ML Service",
    description="Python AI/ML optimization engine and cost prediction service for cloud cost management",
    version="1.0.0"
)

# Configure CORS Middleware for local React development
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safe relative paths based on location of main.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "cloud_cost_data.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "cost_prediction_model.pkl")
METADATA_PATH = os.path.join(BASE_DIR, "models", "model_metadata.json")

# Load trained Machine Learning model once at startup safely
trained_model = None
if os.path.exists(MODEL_PATH):
    try:
        trained_model = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Warning: Failed to load trained model from {MODEL_PATH}: {e}")
else:
    print(f"Warning: Model file not found at {MODEL_PATH}. Train the model first.")


# Pydantic schema for cost prediction requests
class CostPredictionRequest(BaseModel):
    provider: str = Field(..., example="AWS", description="Cloud provider (AWS, Azure, GCP)")
    service: str = Field(..., example="EC2", description="Cloud service (EC2, S3, RDS, Virtual Machines, etc.)")
    region: str = Field(..., example="Mumbai", description="Cloud region (Mumbai, US East, etc.)")
    cpu_utilization: float = Field(..., ge=0.0, le=100.0, description="CPU utilization percentage (0-100)")
    memory_utilization: float = Field(..., ge=0.0, le=100.0, description="Memory utilization percentage (0-100)")
    storage_utilization: float = Field(..., ge=0.0, le=100.0, description="Storage utilization percentage (0-100)")
    usage_hours: float = Field(..., ge=0.0, description="Total usage hours (>= 0)")
    request_count: float = Field(..., ge=0.0, description="Total request count (>= 0)")
    data_transfer_gb: float = Field(..., ge=0.0, description="Data transfer in GB (>= 0)")


@app.get("/")
def read_root():
    """Root status endpoint."""
    return {"message": "AI Cloud Cost Optimizer ML Service is running"}


@app.get("/health")
def health_check():
    """Service health check endpoint."""
    return {
        "status": "healthy",
        "service": "ml-optimizer"
    }


@app.post("/api/analyze")
def analyze_cloud_costs():
    """
    Run rule-based optimization engine over cloud cost dataset and return recommendations & summary metrics.
    """
    try:
        raw_df = load_data(DATA_PATH)
        cleaned_df = clean_data(raw_df)
        
        # Prepare feature matrix for ML model readiness
        _features_df = prepare_features(cleaned_df)
        
        # Run rule-based optimization engine
        recommendations = generate_recommendations(cleaned_df)
        
        total_resources = len(cleaned_df)
        rec_count = len(recommendations)
        total_savings = round(sum(r["monthly_savings"] for r in recommendations), 2)
        
        return {
            "success": True,
            "total_resources": total_resources,
            "recommendations_count": rec_count,
            "total_monthly_savings": total_savings,
            "recommendations": recommendations
        }
    except FileNotFoundError as fnf_err:
        raise HTTPException(status_code=404, detail="Dataset file not found.")
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Error analyzing cloud costs: {str(err)}")


@app.get("/api/optimization-summary")
def get_optimization_summary():
    """
    Return summary metrics calculated dynamically from cloud cost dataset and recommendations.
    """
    try:
        raw_df = load_data(DATA_PATH)
        cleaned_df = clean_data(raw_df)
        recommendations = generate_recommendations(cleaned_df)
        
        total_resources = len(cleaned_df)
        optimized_resources = len(recommendations)
        potential_savings = round(sum(r["monthly_savings"] for r in recommendations), 2)
        
        avg_savings_pct = (
            round(sum(r["savings_percentage"] for r in recommendations) / optimized_resources, 2)
            if optimized_resources > 0
            else 0.0
        )
        
        high_impact = sum(1 for r in recommendations if r["impact"] == "High")
        medium_impact = sum(1 for r in recommendations if r["impact"] == "Medium")
        low_impact = sum(1 for r in recommendations if r["impact"] == "Low")
        
        return {
            "total_resources": total_resources,
            "optimized_resources": optimized_resources,
            "potential_monthly_savings": potential_savings,
            "average_savings_percentage": avg_savings_pct,
            "high_impact_count": high_impact,
            "medium_impact_count": medium_impact,
            "low_impact_count": low_impact
        }
    except FileNotFoundError as fnf_err:
        raise HTTPException(status_code=404, detail="Dataset file not found.")
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Error fetching summary: {str(err)}")


@app.post("/api/predict-cost")
def predict_cloud_cost(request: CostPredictionRequest):
    """
    Predict future monthly cloud cost using the trained Random Forest ML model.
    """
    global trained_model

    # Check if model is available
    if trained_model is None:
        if os.path.exists(MODEL_PATH):
            try:
                trained_model = joblib.load(MODEL_PATH)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to load trained model: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Trained ML model file not found. Please run training/train_model.py first."
            )

    try:
        # Convert request payload to DataFrame with exact column structure used during training
        input_data = pd.DataFrame([{
            "provider": request.provider,
            "service": request.service,
            "region": request.region,
            "cpu_utilization": request.cpu_utilization,
            "memory_utilization": request.memory_utilization,
            "storage_utilization": request.storage_utilization,
            "usage_hours": request.usage_hours,
            "request_count": request.request_count,
            "data_transfer_gb": request.data_transfer_gb
        }])

        # Generate real ML cost prediction
        prediction_val = float(trained_model.predict(input_data)[0])
        
        # Clamp prediction to zero if negative and round to 2 decimal places
        predicted_cost = max(0.0, round(prediction_val, 2))

        # Get model name from metadata if available
        model_name = "RandomForestRegressor"
        if os.path.exists(METADATA_PATH):
            try:
                with open(METADATA_PATH, "r") as f:
                    meta = json.load(f)
                    model_name = meta.get("model_name", model_name)
            except Exception:
                pass

        return {
            "success": True,
            "predicted_monthly_cost": predicted_cost,
            "currency": "INR",
            "model": model_name,
            "message": "Monthly cloud cost predicted successfully"
        }
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating cost prediction: {str(err)}"
        )


@app.get("/api/model-info")
def get_model_info():
    """
    Return training metadata and performance metrics of the trained ML model.
    """
    if not os.path.exists(METADATA_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model metadata file not found. Please run training/train_model.py first."
        )

    try:
        with open(METADATA_PATH, "r") as f:
            metadata = json.load(f)

        # Include target variable explicitly
        metadata["target"] = "monthly_cost"

        return metadata
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading model metadata: {str(err)}"
        )


@app.post("/api/optimize")
def optimize_cloud_cost(request: CostPredictionRequest):
    """
    Predict monthly cloud cost and generate intelligent cost optimization recommendations based on utilization metrics.
    """
    global trained_model

    if trained_model is None:
        if os.path.exists(MODEL_PATH):
            try:
                trained_model = joblib.load(MODEL_PATH)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to load trained model: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Trained ML model file not found. Please run training/train_model.py first."
            )

    try:
        req_dict = request.dict()
        input_data = pd.DataFrame([req_dict])

        # Generate ML cost prediction
        prediction_val = float(trained_model.predict(input_data)[0])
        predicted_cost = max(0.0, round(prediction_val, 2))

        # Generate optimization recommendations
        recs, total_savings = generate_single_resource_recommendations(req_dict, predicted_cost)

        return {
            "success": True,
            "predicted_monthly_cost": predicted_cost,
            "currency": "INR",
            "recommendations": recs,
            "total_estimated_savings": total_savings,
            "message": "AI-powered optimization recommendations generated successfully"
        }
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating optimization recommendations: {str(err)}"
        )

