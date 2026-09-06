"""
train_model.py
--------------
Trains and evaluates two Scikit-learn regression models on the cloud cost
dataset, selects the better performer, and saves it to models/.

Run from the ml-service directory:
    python training/train_model.py

NOTE: The dataset is SYNTHETIC SAMPLE DATA for demonstration purposes.
      It does not represent real AWS, Azure, or GCP billing records.
"""

import os
import sys
import json
import math
from datetime import datetime

import joblib
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# Allow imports from the ml-service root when running as a script
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from preprocessing.preprocess import (
    load_data,
    clean_data,
    prepare_features,
    prepare_target,
    CATEGORICAL_COLS,
    NUMERIC_FEATURE_COLS,
)

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH    = os.path.join(BASE_DIR, "data", "cloud_cost_data.csv")
MODELS_DIR   = os.path.join(BASE_DIR, "models")
MODEL_PATH   = os.path.join(MODELS_DIR, "cost_prediction_model.pkl")
METADATA_PATH = os.path.join(MODELS_DIR, "model_metadata.json")

os.makedirs(MODELS_DIR, exist_ok=True)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def evaluate(name: str, y_true, y_pred) -> dict:
    """Print and return MAE, RMSE, R² for a model."""
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = math.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)

    print(f"\n{name}:")
    print(f"  MAE  : {mae:,.2f}")
    print(f"  RMSE : {rmse:,.2f}")
    print(f"  R²   : {r2:.4f}")

    return {"mae": round(mae, 2), "rmse": round(rmse, 2), "r2": round(r2, 4)}


def build_pipeline(regressor) -> Pipeline:
    """
    Wrap a regressor in a Pipeline that encodes categoricals with OneHotEncoder
    (ignoring unknown categories at inference time) and scales numeric features.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_COLS),
            ("num", StandardScaler(), NUMERIC_FEATURE_COLS),
        ],
        remainder="drop",
    )
    return Pipeline(steps=[("preprocessor", preprocessor), ("regressor", regressor)])


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 55)
    print("  AI Cloud Cost Optimizer - ML Training Script")
    print("=" * 55)

    # 1. Load & clean dataset
    print(f"\nLoading dataset from: {DATA_PATH}")
    raw_df = load_data(DATA_PATH)
    df = clean_data(raw_df)
    print(f"Dataset shape after cleaning: {df.shape}")

    # 2. Prepare features and target
    X = prepare_features(df)
    y = prepare_target(df)
    print(f"\nFeatures : {list(X.columns)}")
    print(f"Target   : monthly_cost  (min={y.min():.0f}, max={y.max():.0f}, mean={y.mean():.0f})")

    # 3. Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\nTraining records : {len(X_train)}")
    print(f"Test records     : {len(X_test)}")

    # 4. Linear Regression
    print("\n" + "-" * 40)
    print("Training Linear Regression...")
    lr_pipeline = build_pipeline(LinearRegression())
    lr_pipeline.fit(X_train, y_train)
    lr_pred   = lr_pipeline.predict(X_test)
    lr_metrics = evaluate("Linear Regression", y_test, lr_pred)

    # 5. Random Forest
    print("\n" + "-" * 40)
    print("Training Random Forest Regressor (n_estimators=200)...")
    rf_pipeline = build_pipeline(
        RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
    )
    rf_pipeline.fit(X_train, y_train)
    rf_pred    = rf_pipeline.predict(X_test)
    rf_metrics = evaluate("Random Forest Regressor", y_test, rf_pred)

    # 6. Select best model
    print("\n" + "-" * 40)
    # Prefer higher R² as the primary metric; break ties with lower RMSE
    if rf_metrics["r2"] >= lr_metrics["r2"]:
        best_model   = rf_pipeline
        best_name    = "RandomForestRegressor"
        best_metrics = rf_metrics
    else:
        best_model   = lr_pipeline
        best_name    = "LinearRegression"
        best_metrics = lr_metrics

    print(f"\nBest Model : {best_name}")
    print(f"  MAE  : {best_metrics['mae']:,.2f}")
    print(f"  RMSE : {best_metrics['rmse']:,.2f}")
    print(f"  R²   : {best_metrics['r2']:.4f}")

    # 7. Save model
    joblib.dump(best_model, MODEL_PATH)
    print(f"\nModel saved to : {MODEL_PATH}")

    # 8. Save metadata
    metadata = {
        "model_name":        best_name,
        "mae":               best_metrics["mae"],
        "rmse":              best_metrics["rmse"],
        "r2":                best_metrics["r2"],
        "training_records":  int(len(X_train)),
        "test_records":      int(len(X_test)),
        "features":          CATEGORICAL_COLS + NUMERIC_FEATURE_COLS,
        "trained_at":        datetime.utcnow().isoformat() + "Z",
    }
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved to : {METADATA_PATH}")
    print("\nTraining complete.\n")


if __name__ == "__main__":
    main()
