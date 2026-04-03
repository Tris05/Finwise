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
    
    from pathlib import Path
    base_path = Path(__file__).parent.parent / "models"
    
    for file_name in model_files:
        full_path = base_path / file_name
        try:
            if full_path.exists():
                with open(full_path, 'rb') as f:
                    model = pickle.load(f)
                    results[file_name] = f"SUCCESS - Type: {type(model).__name__}"
                    print(f"SUCCESS {file_name}: {type(model).__name__}")
            else:
                results[file_name] = "FILE NOT FOUND"
                print(f"FAILED {file_name}: FILE NOT FOUND at {full_path}")
        except Exception as e:
            results[file] = f"ERROR: {str(e)}"
            print(f"FAILED {file}: ERROR - {str(e)}")
    
    return results

if __name__ == "__main__":
    print("Testing .pkl file loading...")
    test_pkl_files()
    print("Test completed!")
