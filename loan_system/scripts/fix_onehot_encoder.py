#!/usr/bin/env python3
"""
Script to fix the OneHotEncoder issue
"""

import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder

def create_sample_data():
    """Create sample data to fit the preprocessing models"""
    np.random.seed(42)  # For reproducible results
    
    # Create sample loan data with the expected features
    n_samples = 1000
    
    data = {
        # Categorical features - ensure proper string types
        'EmploymentStatus': np.random.choice(['Employed', 'Self-employed', 'Unemployed'], n_samples, p=[0.7, 0.25, 0.05]),
        'EducationLevel': np.random.choice(['High School', 'Bachelor', 'Master', 'Doctorate'], n_samples, p=[0.3, 0.4, 0.25, 0.05]),
        'MaritalStatus': np.random.choice(['Single', 'Married', 'Widowed'], n_samples, p=[0.4, 0.55, 0.05]),
        'HomeOwnershipStatus': np.random.choice(['Own', 'Rent', 'Other'], n_samples, p=[0.4, 0.5, 0.1]),
        'LoanPurpose': np.random.choice(['Home', 'Education', 'Debt Consolidation', 'Other'], n_samples, p=[0.4, 0.2, 0.25, 0.15]),
        'NumberOfDependents': np.random.choice(['0', '1', '2', '3', '4', '5'], n_samples, p=[0.2, 0.3, 0.25, 0.15, 0.08, 0.02])
    }
    
    return pd.DataFrame(data)

def fix_onehot_encoder():
    """Fix the OneHotEncoder with proper categorical handling"""
    print("Creating sample data...")
    df = create_sample_data()
    
    categorical_features = [
        'EmploymentStatus', 'EducationLevel', 'MaritalStatus', 'HomeOwnershipStatus',
        'LoanPurpose', 'NumberOfDependents'
    ]
    
    print(f"Categorical features: {len(categorical_features)}")
    
    # Create a new OneHotEncoder with proper handling
    print("\nCreating fixed OneHotEncoder...")
    one_hot_encoder = OneHotEncoder(
        sparse_output=False, 
        handle_unknown='ignore',
        dtype=np.int64
    )
    
    # Fit on categorical data
    one_hot_encoder.fit(df[categorical_features])
    
    from pathlib import Path
    base_path = Path(__file__).parent.parent / "models"
    
    # Save the fixed OneHotEncoder
    with open(base_path / 'one_hot_encoder.pkl', 'wb') as f:
        pickle.dump(one_hot_encoder, f)
    print(f"SUCCESS: Fixed one_hot_encoder.pkl saved successfully to {base_path}")
    
    # Test the encoder
    print("\nTesting the fixed OneHotEncoder...")
    test_data = df[categorical_features].head(5)
    encoded_data = one_hot_encoder.transform(test_data)
    print(f"SUCCESS: OneHotEncoder transformation works: {encoded_data.shape}")
    print(f"Number of encoded features: {encoded_data.shape[1]}")
    
    return one_hot_encoder

if __name__ == "__main__":
    print("Fixing OneHotEncoder...")
    fix_onehot_encoder()
    print("\nOneHotEncoder fixed successfully!")
