def calculate_savings(current_cost: float, estimated_optimized_cost: float) -> dict:
    """
    Calculate monetary monthly savings and savings percentage with zero-division safety.
    Rounds monetary values and percentage figures to 2 decimal places.
    """
    if current_cost <= 0:
        return {
            "monthly_savings": 0.0,
            "savings_percentage": 0.0
        }
    
    monthly_savings = max(0.0, current_cost - estimated_optimized_cost)
    savings_percentage = (monthly_savings / current_cost) * 100.0

    return {
        "monthly_savings": round(monthly_savings, 2),
        "savings_percentage": round(savings_percentage, 2)
    }
