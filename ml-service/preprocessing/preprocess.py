import os
import pandas as pd


# ─── Feature column definitions ──────────────────────────────────────────────
# These constants are shared between training/train_model.py and main.py
# so that the same feature structure is always used for both training and
# inference — preventing training/serving skew.

CATEGORICAL_COLS = ["provider", "service", "region"]

NUMERIC_FEATURE_COLS = [
    "cpu_utilization",
    "memory_utilization",
    "storage_utilization",
    "usage_hours",
    "request_count",
    "data_transfer_gb",
]

TARGET_COL = "monthly_cost"


# ─── Public API ──────────────────────────────────────────────────────────────

def load_data(file_path: str) -> pd.DataFrame:
    """
    Load cloud cost CSV dataset into a Pandas DataFrame.
    Raises FileNotFoundError if the path does not exist.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(
            f"Cloud cost dataset not found at path: {file_path}"
        )
    df = pd.read_csv(file_path)
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Sanitise the raw DataFrame:
    - Convert numeric columns to float, coercing non-numeric values to 0.
    - Drop rows where monthly_cost is missing or <= 0 (invalid targets).
    - Strip whitespace from string columns.
    """
    cleaned = df.copy()

    # Numeric columns that must exist
    all_numeric = NUMERIC_FEATURE_COLS + [TARGET_COL]
    for col in all_numeric:
        if col in cleaned.columns:
            cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce").fillna(0.0)

    # Strip whitespace from categorical text columns
    for col in CATEGORICAL_COLS:
        if col in cleaned.columns:
            cleaned[col] = cleaned[col].astype(str).str.strip()

    # Remove rows with zero or negative target — they cannot be learned from
    if TARGET_COL in cleaned.columns:
        cleaned = cleaned[cleaned[TARGET_COL] > 0]

    return cleaned.reset_index(drop=True)


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Return a DataFrame containing only the columns required by the ML model
    (both categorical and numeric feature columns).
    Missing columns are filled with sensible defaults.
    """
    feature_cols = CATEGORICAL_COLS + NUMERIC_FEATURE_COLS
    available = [c for c in feature_cols if c in df.columns]
    features = df[available].copy()

    # Fill any remaining NaN in numeric columns with 0
    for col in NUMERIC_FEATURE_COLS:
        if col in features.columns:
            features[col] = features[col].fillna(0.0)

    return features


def prepare_target(df: pd.DataFrame) -> pd.Series:
    """
    Return the target Series (monthly_cost) from a cleaned DataFrame.
    """
    if TARGET_COL not in df.columns:
        raise ValueError(f"Target column '{TARGET_COL}' not found in DataFrame.")
    return df[TARGET_COL].copy()
