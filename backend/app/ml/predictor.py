"""
Machine Learning Predictor
Uses Scikit-learn to predict future expenses based on historical data.
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression


def predict_next_month(monthly_expenses, all_transactions):
    """
    Predict next month's total expenses using a simple Linear Regression model
    on the last N months of aggregated data.
    """
    # Require at least 2 data points for a meaningful regression
    valid_expenses = [e for e in monthly_expenses if e > 0]
    
    if len(valid_expenses) < 2:
        # Fallback to weighted average if not enough data
        weights = [0.2, 0.3, 0.5]
        if len(monthly_expenses) == 3 and all(e > 0 for e in monthly_expenses):
            return sum(e * w for e, w in zip(monthly_expenses, weights))
        elif valid_expenses:
            return sum(valid_expenses) / len(valid_expenses)
        return 0

    # Prepare data for Scikit-learn
    # X = [1, 2, 3] (Months sequence)
    # y = [Exp1, Exp2, Exp3]
    X = np.array(range(1, len(valid_expenses) + 1)).reshape(-1, 1)
    y = np.array(valid_expenses)

    model = LinearRegression()
    model.fit(X, y)

    # Predict the next month (e.g., month 4)
    next_month_idx = np.array([[len(valid_expenses) + 1]])
    prediction = model.predict(next_month_idx)
    
    # Ensure prediction is non-negative
    return max(0.0, float(prediction[0]))


def categorize_transaction(description, user_history):
    """
    Categorize a new transaction based on past user transactions
    (Optional future ML expansion using NLP / Naive Bayes).
    """
    # For now, it's a placeholder. CrewAI agents will handle complex NLP categorization.
    pass
