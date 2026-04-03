#!/usr/bin/env python3
"""
Script to examine the XGBoost model structure and understand expected features
"""

import pickle
import numpy as np

def examine_model():
    """Examine the XGBoost models to understand their structure"""
    try:
        from pathlib import Path
        base_path = Path(__file__).parent.parent / "models"
        
        # Load the risk model
        with open(base_path / 'xgb_risk_model.pkl', 'rb') as f:
            risk_model = pickle.load(f)
        
        print("Risk Model Type:", type(risk_model))
        print("Risk Model Features:", risk_model.n_features_in_)
        
        # Load the approval model
        with open(base_path / 'xgb_approval_model.pkl', 'rb') as f:
            approval_model = pickle.load(f)
        
        print("Approval Model Type:", type(approval_model))
        print("Approval Model Features:", approval_model.n_features_in_)
        
        # Try to get feature names if available
        if hasattr(risk_model, 'feature_names_in_'):
            print("Risk Model Feature Names:", risk_model.feature_names_in_)
        
        if hasattr(approval_model, 'feature_names_in_'):
            print("Approval Model Feature Names:", approval_model.feature_names_in_)
        
        # Create a test array with the expected number of features
        test_features = np.zeros((1, risk_model.n_features_in_))
        print(f"Created test array with shape: {test_features.shape}")
        
        # Try to make a prediction
        try:
            risk_pred = risk_model.predict(test_features)
            approval_pred = approval_model.predict_proba(test_features)
            print("✓ Models can make predictions with correct feature count")
            print(f"Risk prediction: {risk_pred[0]}")
            print(f"Approval probability: {approval_pred[0]}")
        except Exception as e:
            print(f"✗ Prediction failed: {e}")
        
    except Exception as e:
        print(f"Error examining models: {e}")

if __name__ == "__main__":
    examine_model()
