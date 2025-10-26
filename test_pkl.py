#!/usr/bin/env python3
"""
Test script to verify .pkl files can be loaded
"""

import pickle
import os

def test_pkl_files():
    """Test if all .pkl files can be loaded"""
    model_files = [
        'xgb_risk_model.pkl',
        'xgb_approval_model.pkl', 
        'scaler.pkl',
        'ordinal_encoder.pkl',
        'one_hot_encoder.pkl'
    ]
    
    results = {}
    
    for file in model_files:
        try:
            if os.path.exists(file):
                with open(file, 'rb') as f:
                    model = pickle.load(f)
                    results[file] = f"SUCCESS - Type: {type(model).__name__}"
                    print(f"SUCCESS {file}: {type(model).__name__}")
            else:
                results[file] = "FILE NOT FOUND"
                print(f"FAILED {file}: FILE NOT FOUND")
        except Exception as e:
            results[file] = f"ERROR: {str(e)}"
            print(f"FAILED {file}: ERROR - {str(e)}")
    
    return results

if __name__ == "__main__":
    print("Testing .pkl file loading...")
    test_pkl_files()
    print("Test completed!")
