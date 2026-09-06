import pandas as pd
from typing import List, Dict, Any
from utils.calculations import calculate_savings


# Configuration downgrade mappings for realistic recommendations
INSTANCE_DOWNGRADE_MAP = {
    "t3.large": "t3.medium",
    "m5.xlarge": "m5.large",
    "c5.large": "c5.medium",
    "c5.xlarge": "c5.large",
    "m5.2xlarge": "m5.xlarge",
    "db.t3.large": "db.t3.medium",
    "db.m5.xlarge": "db.m5.large",
    "db.m5.large": "db.m5.medium",
    "db.r5.large": "db.r5.medium",
    "1024 MB": "512 MB",
    "2048 MB": "1024 MB",
    "1536 MB": "768 MB",
    "D4s v5": "D2s v5",
    "E4s v5": "E2s v5",
    "D8s v5": "D4s v5",
    "E2s v5": "B2s",
    "vCore 4": "vCore 2",
    "vCore 8": "vCore 4",
    "e2-standard-4": "e2-standard-2",
    "n2-standard-8": "n2-standard-4",
    "e2-standard-8": "e2-standard-4",
    "n2-standard-4": "n2-standard-2",
    "Standard Storage": "Intelligent-Tiering",
    "Hot Tier": "Cool Tier",
    "Standard": "Nearline"
}


def analyze_resource(row: pd.Series, record_id: int) -> Dict[str, Any]:
    """
    Evaluate resource utilization metrics against optimization rules and generate
    a recommendation object if underutilized.
    """
    provider = str(row.get("provider", "AWS"))
    service = str(row.get("service", "EC2"))
    region = str(row.get("region", "US East"))
    resource_type = str(row.get("resource_type", service))
    current_config = str(row.get("instance_type", "Standard"))
    cpu = float(row.get("cpu_utilization", 0.0))
    memory = float(row.get("memory_utilization", 0.0))
    storage = float(row.get("storage_utilization", 0.0))
    current_cost = float(row.get("monthly_cost", 0.0))

    if current_cost <= 0:
        return None

    recommendation_needed = False
    recommended_config = INSTANCE_DOWNGRADE_MAP.get(current_config, f"Optimized {current_config}")
    estimated_cost = current_cost
    reason = ""

    # Rule 1: Compute Underutilization (EC2 / Compute Engine)
    if service in ["EC2", "Compute Engine"]:
        if cpu < 30.0 and memory < 40.0:
            recommendation_needed = True
            estimated_cost = current_cost * 0.52
            reason = f"Instance CPU ({cpu:.1f}%) and Memory ({memory:.1f}%) are underutilized below threshold rules."

    # Rule 2: Storage Tier Optimization (S3 / Cloud Storage / Blob Storage)
    elif service in ["S3", "Cloud Storage", "Blob Storage"]:
        if storage < 40.0:
            recommendation_needed = True
            estimated_cost = current_cost * 0.68
            reason = f"Storage utilization ({storage:.1f}%) indicates lifecycle tiering opportunity."

    # Rule 3: Database Instance Optimization (RDS / SQL Database)
    elif service in ["RDS", "SQL Database"]:
        if cpu < 35.0 and memory < 45.0:
            recommendation_needed = True
            estimated_cost = current_cost * 0.62
            reason = f"Database CPU ({cpu:.1f}%) and Memory ({memory:.1f}%) operating under allocated capacity."

    # Rule 4: Serverless Function Memory Optimization (Lambda)
    elif service == "Lambda":
        if memory < 40.0:
            recommendation_needed = True
            estimated_cost = current_cost * 0.70
            reason = f"Function memory utilization ({memory:.1f}%) is higher than observed execution requirements."

    # Rule 5: Virtual Machine Sizing Optimization (Virtual Machines)
    elif service == "Virtual Machines":
        if cpu < 30.0:
            recommendation_needed = True
            estimated_cost = current_cost * 0.55
            reason = f"VM CPU utilization ({cpu:.1f}%) indicates over-provisioned compute capacity."

    if not recommendation_needed:
        return None

    savings_info = calculate_savings(current_cost, estimated_cost)
    savings_pct = savings_info["savings_percentage"]
    monthly_savings = savings_info["monthly_savings"]

    # Impact Level Classification Rules
    if savings_pct >= 40.0:
        impact = "High"
    elif savings_pct >= 20.0:
        impact = "Medium"
    else:
        impact = "Low"

    return {
        "id": record_id,
        "provider": provider,
        "service": service,
        "region": region,
        "resource_type": resource_type,
        "current_configuration": current_config,
        "recommended_configuration": recommended_config,
        "current_cost": round(current_cost, 2),
        "estimated_optimized_cost": round(estimated_cost, 2),
        "monthly_savings": monthly_savings,
        "savings_percentage": savings_pct,
        "impact": impact,
        "reason": reason
    }


def generate_recommendations(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Run rule-based optimization engine over the dataset DataFrame and return recommendation list.
    """
    recommendations = []
    rec_counter = 1

    for idx, row in df.iterrows():
        rec = analyze_resource(row, rec_counter)
        if rec is not None:
            recommendations.append(rec)
            rec_counter += 1

    return recommendations


def generate_single_resource_recommendations(data: dict, predicted_cost: float):
    """
    Generate tailored cloud cost optimization recommendations for a single resource query
    based on utilization thresholds, service type, and predicted monthly cost.
    """
    provider = str(data.get("provider", "AWS"))
    service = str(data.get("service", "EC2"))
    region = str(data.get("region", "Mumbai"))
    cpu = float(data.get("cpu_utilization", 0.0))
    memory = float(data.get("memory_utilization", 0.0))
    storage = float(data.get("storage_utilization", 0.0))
    usage_hours = float(data.get("usage_hours", 720.0))
    data_transfer = float(data.get("data_transfer_gb", 0.0))

    recommendations = []

    # Rule 1: Service-specific optimization rules
    if provider == "AWS" and service == "EC2" and cpu < 30.0:
        savings = round(predicted_cost * 0.20, 2)
        recommendations.append({
            "title": "Right-size AWS EC2 Compute Instance",
            "description": f"AWS EC2 instance CPU utilization ({cpu:.1f}%) is below 30%. Consider downsizing from current instance to a smaller instance type (e.g., t3.large to t3.medium).",
            "impact": "High",
            "estimated_savings": savings,
            "category": "Compute Optimization",
            "priority": 1
        })

    elif service == "S3" and storage < 40.0:
        savings = round(predicted_cost * 0.15, 2)
        recommendations.append({
            "title": "S3 Storage Class & Lifecycle Optimization",
            "description": f"S3 storage utilization ({storage:.1f}%) is below 40%. Review unused storage and consider moving data to S3 Intelligent-Tiering or Infrequent Access.",
            "impact": "Medium",
            "estimated_savings": savings,
            "category": "Storage Optimization",
            "priority": 1
        })

    elif service == "RDS" and cpu < 30.0 and memory < 30.0:
        savings = round(predicted_cost * 0.22, 2)
        recommendations.append({
            "title": "Right-size Database Instance (RDS)",
            "description": f"RDS database CPU ({cpu:.1f}%) and Memory ({memory:.1f}%) are operating significantly below allocated capacity. Recommend rightsizing the DB instance.",
            "impact": "High",
            "estimated_savings": savings,
            "category": "Database Optimization",
            "priority": 1
        })

    # Rule 2: Generic CPU Utilization (< 30%)
    if cpu < 30.0 and not any(r["category"] == "Compute Optimization" for r in recommendations):
        impact = "High" if cpu < 20.0 else "Medium"
        savings_pct = 0.22 if cpu < 20.0 else 0.14
        savings = round(predicted_cost * savings_pct, 2)
        recommendations.append({
            "title": "Right-size Underutilized Compute",
            "description": f"Consider downsizing or rightsizing the compute instance because CPU utilization ({cpu:.1f}%) is low.",
            "impact": impact,
            "estimated_savings": savings,
            "category": "Compute Optimization",
            "priority": len(recommendations) + 1
        })

    # Rule 3: Memory Utilization (< 30%)
    if memory < 30.0 and not any(r["category"] == "Database Optimization" for r in recommendations):
        savings = round(predicted_cost * 0.12, 2)
        recommendations.append({
            "title": "Optimize Memory Allocation",
            "description": f"Consider using a smaller memory-optimized configuration because memory utilization ({memory:.1f}%) is under 30%.",
            "impact": "Medium",
            "estimated_savings": savings,
            "category": "Memory Optimization",
            "priority": len(recommendations) + 1
        })

    # Rule 4: Storage Utilization (< 40%)
    if storage < 40.0 and not any(r["category"] == "Storage Optimization" for r in recommendations):
        impact = "Medium" if storage < 20.0 else "Low"
        savings_pct = 0.12 if storage < 20.0 else 0.06
        savings = round(predicted_cost * savings_pct, 2)
        recommendations.append({
            "title": "Review Allocated Storage & Delete Unused Data",
            "description": f"Review unused storage and consider reducing allocated storage because current storage utilization is {storage:.1f}%.",
            "impact": impact,
            "estimated_savings": savings,
            "category": "Storage Optimization",
            "priority": len(recommendations) + 1
        })

    # Rule 5: Usage Hours scheduling (< 500 hours)
    if usage_hours < 500.0:
        impact = "High" if usage_hours < 300.0 else "Medium"
        savings_pct = 0.20 if usage_hours < 300.0 else 0.12
        savings = round(predicted_cost * savings_pct, 2)
        recommendations.append({
            "title": "Implement Off-Hours Auto-Scheduling",
            "description": f"Resource is only utilized for {usage_hours:.0f} hours/month. Consider scheduling automatic shutdown during non-business hours.",
            "impact": impact,
            "estimated_savings": savings,
            "category": "Usage Scheduling",
            "priority": len(recommendations) + 1
        })

    # Rule 6: Continuous Low-Utilized Resource (Usage hours >= 600 & CPU < 30%)
    if usage_hours >= 600.0 and cpu < 30.0 and not any(r["category"] == "Usage Scheduling" for r in recommendations):
        savings = round(predicted_cost * 0.25, 2)
        recommendations.append({
            "title": "Schedule Continuous Low-Utilized Resource",
            "description": f"Resource is running continuously ({usage_hours:.0f} hrs/month) with low CPU utilization ({cpu:.1f}%). Consider rightsizing or scheduling automatic non-peak shutdowns.",
            "impact": "High",
            "estimated_savings": savings,
            "category": "Resource Rightsizing & Scheduling",
            "priority": len(recommendations) + 1
        })

    # Rule 7: High Data Transfer (> 200 GB)
    if data_transfer > 200.0:
        impact = "Medium" if data_transfer > 500.0 else "Low"
        savings_pct = 0.10 if data_transfer > 500.0 else 0.05
        savings = round(predicted_cost * savings_pct, 2)
        recommendations.append({
            "title": "Optimize Data Transfer & Traffic Patterns",
            "description": f"High data transfer detected ({data_transfer:.0f} GB). Review data transfer patterns and consider reducing unnecessary cross-region or external data transfer.",
            "impact": impact,
            "estimated_savings": savings,
            "category": "Network & Data Transfer",
            "priority": len(recommendations) + 1
        })

    # Fallback if no rules matched
    if not recommendations:
        savings = round(predicted_cost * 0.05, 2)
        recommendations.append({
            "title": "Explore Long-Term Reserved Instances / Savings Plans",
            "description": "Resource utilization metrics are within optimal operational thresholds. Consider 1-year or 3-year Savings Plans or Reserved Instances for long-term cost optimization.",
            "impact": "Low",
            "estimated_savings": savings,
            "category": "Commitment Savings",
            "priority": 1
        })

    # Re-index priorities
    for idx, rec in enumerate(recommendations, 1):
        rec["priority"] = idx

    raw_total_savings = sum(r["estimated_savings"] for r in recommendations)
    max_allowed_savings = round(predicted_cost * 0.45, 2)
    total_estimated_savings = min(raw_total_savings, max_allowed_savings) if predicted_cost > 0 else raw_total_savings

    return recommendations, round(total_estimated_savings, 2)

