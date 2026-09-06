const ML_API_URL = import.meta.env.VITE_ML_API_URL || "http://127.0.0.1:8001";

/**
 * Health check for FastAPI ML Service
 * GET /health
 */
export async function checkMlHealth() {
  try {
    const response = await fetch(`${ML_API_URL}/health`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return { online: false, message: "ML service health check failed" };
    }

    const data = await response.json();
    return { online: true, data };
  } catch (error) {
    return { online: false, message: error.message || "ML service unreachable" };
  }
}

/**
 * Fetch trained ML model performance metadata and information
 * GET /api/model-info
 */
export async function getModelInfo() {
  try {
    const response = await fetch(`${ML_API_URL}/api/model-info`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error (${response.status})`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Unable to fetch model information. Please verify the ML service is running.",
    };
  }
}

/**
 * Send resource metrics to predict cloud cost using trained RandomForestRegressor ML model
 * POST /api/predict-cost
 *
 * @param {Object} payload
 * @param {string} payload.provider
 * @param {string} payload.service
 * @param {string} payload.region
 * @param {number} payload.cpu_utilization
 * @param {number} payload.memory_utilization
 * @param {number} payload.storage_utilization
 * @param {number} payload.usage_hours
 * @param {number} payload.request_count
 * @param {number} payload.data_transfer_gb
 */
export async function predictCloudCost(payload) {
  try {
    const response = await fetch(`${ML_API_URL}/api/predict-cost`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        provider: String(payload.provider),
        service: String(payload.service),
        region: String(payload.region),
        cpu_utilization: Number(payload.cpu_utilization),
        memory_utilization: Number(payload.memory_utilization),
        storage_utilization: Number(payload.storage_utilization),
        usage_hours: Number(payload.usage_hours),
        request_count: Number(payload.request_count),
        data_transfer_gb: Number(payload.data_transfer_gb),
      }),
    });

    if (!response.ok) {
      let errorMessage = "Unable to predict cloud cost. Please make sure the ML service is running.";
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch (parseErr) {
        // use default message
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();

    if (data && typeof data.predicted_monthly_cost === "number") {
      return {
        success: true,
        predicted_monthly_cost: data.predicted_monthly_cost,
        currency: data.currency || "INR",
        model: data.model || "RandomForestRegressor",
        message: data.message || "Monthly cloud cost predicted successfully",
      };
    }

    return {
      success: false,
      error: "Invalid API response structure from ML service.",
    };
  } catch (error) {
    return {
      success: false,
      error: "ML service is unavailable. Please start the FastAPI service.",
      isNetworkError: true,
    };
  }
}

/**
 * Send resource metrics to generate cost prediction and intelligent optimization recommendations
 * POST /api/optimize
 *
 * @param {Object} payload
 */
export async function optimizeCloudCost(payload) {
  try {
    const response = await fetch(`${ML_API_URL}/api/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        provider: String(payload.provider),
        service: String(payload.service),
        region: String(payload.region),
        cpu_utilization: Number(payload.cpu_utilization),
        memory_utilization: Number(payload.memory_utilization),
        storage_utilization: Number(payload.storage_utilization),
        usage_hours: Number(payload.usage_hours),
        request_count: Number(payload.request_count),
        data_transfer_gb: Number(payload.data_transfer_gb),
      }),
    });

    if (!response.ok) {
      let errorMessage = "Unable to generate optimization recommendations. Please make sure the ML service is running on port 8001.";
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch (parseErr) {
        // use default message
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();

    if (data && data.success && Array.isArray(data.recommendations)) {
      return {
        success: true,
        predicted_monthly_cost: data.predicted_monthly_cost,
        currency: data.currency || "INR",
        recommendations: data.recommendations,
        total_estimated_savings: data.total_estimated_savings || 0,
        message: data.message || "AI-powered optimization recommendations generated successfully",
      };
    }

    return {
      success: false,
      error: "Invalid API response structure from optimization service.",
    };
  } catch (error) {
    return {
      success: false,
      error: "ML service is unavailable. Please make sure the FastAPI service is running on port 8001.",
      isNetworkError: true,
    };
  }
}

