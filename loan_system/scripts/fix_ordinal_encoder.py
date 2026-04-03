#!/usr/bin/env python3
"""
Script to fix the ordinal encoder issue and regenerate it properly
"""

import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, OrdinalEncoder, OneHotEncoder

def create_sample_data():
    """Create sample data to fit the preprocessing models"""
    np.random.seed(42)  # For reproducible results
    
    # Create sample loan data with the expected features
    n_samples = 1000
    
    data = {
        # Numerical features
        'Age': np.random.randint(18, 65, n_samples),
        'AnnualIncome': np.random.randint(200000, 2000000, n_samples),
        'CreditScore': np.random.randint(300, 850, n_samples),
        'Experience': np.random.randint(0, 40, n_samples),
        'LoanAmount': np.random.randint(100000, 10000000, n_samples),
        'LoanDuration': np.random.randint(12, 360, n_samples),
        'MonthlyDebtPayments': np.random.randint(5000, 100000, n_samples),
        'CreditCardUtilizationRate': np.random.uniform(0, 1, n_samples),
        'NumberOfOpenCreditLines': np.random.randint(1, 20, n_samples),
        'NumberOfCreditInquiries': np.random.randint(0, 10, n_samples),
        'DebtToIncomeRatio': np.random.uniform(0.1, 0.8, n_samples),
        'BankruptcyHistory': np.random.choice([0, 1], n_samples, p=[0.95, 0.05]),
        'PreviousLoanDefaults': np.random.choice([0, 1, 2, 3], n_samples, p=[0.8, 0.15, 0.04, 0.01]),
        'PaymentHistory': np.random.choice([0, 1, 2, 3], n_samples, p=[0.7, 0.2, 0.08, 0.02]),
        'LengthOfCreditHistory': np.random.randint(1, 30, n_samples),
        'SavingsAccountBalance': np.random.randint(0, 1000000, n_samples),
        'CheckingAccountBalance': np.random.randint(0, 500000, n_samples),
        'TotalAssets': np.random.randint(100000, 5000000, n_samples),
        'TotalLiabilities': np.random.randint(0, 2000000, n_samples),
        'MonthlyIncome': np.random.randint(20000, 200000, n_samples),
        'UtilityBillsPaymentHistory': np.random.choice([0, 1, 2], n_samples, p=[0.8, 0.15, 0.05]),
        'JobTenure': np.random.randint(0, 20, n_samples),
        'NetWorth': np.random.randint(-500000, 3000000, n_samples),
        'BaseInterestRate': np.random.uniform(6.0, 15.0, n_samples),
        'InterestRate': np.random.uniform(6.0, 18.0, n_samples),
        'MonthlyLoanPayment': np.random.randint(5000, 100000, n_samples),
        'TotalDebtToIncomeRatio': np.random.uniform(0.1, 0.8, n_samples),
        'LoanToIncomeRatio': np.random.uniform(0.5, 10.0, n_samples),
        'AssetsToLoanRatio': np.random.uniform(0.1, 5.0, n_samples),
        'MonthlyLoanToIncome': np.random.uniform(0.1, 0.6, n_samples),
        
        # Categorical features - ensure proper string types
        'EmploymentStatus': np.random.choice(['Employed', 'Self-employed', 'Unemployed'], n_samples, p=[0.7, 0.25, 0.05]),
        'EducationLevel': np.random.choice(['High School', 'Bachelor', 'Master', 'Doctorate'], n_samples, p=[0.3, 0.4, 0.25, 0.05]),
        'MaritalStatus': np.random.choice(['Single', 'Married', 'Widowed'], n_samples, p=[0.4, 0.55, 0.05]),
        'HomeOwnershipStatus': np.random.choice(['Own', 'Rent', 'Other'], n_samples, p=[0.4, 0.5, 0.1]),
        'LoanPurpose': np.random.choice(['Home', 'Education', 'Debt Consolidation', 'Other'], n_samples, p=[0.4, 0.2, 0.25, 0.15]),
        'NumberOfDependents': np.random.choice(['0', '1', '2', '3', '4', '5'], n_samples, p=[0.2, 0.3, 0.25, 0.15, 0.08, 0.02])
    }
    
    return pd.DataFrame(data)

def fix_ordinal_encoder():
    """Fix the ordinal encoder with proper categorical handling"""
    print("Creating sample data...")
    df = create_sample_data()
    
    categorical_features = [
        'EmploymentStatus', 'EducationLevel', 'MaritalStatus', 'HomeOwnershipStatus',
        'LoanPurpose', 'NumberOfDependents'
    ]
    
    print(f"Categorical features: {len(categorical_features)}")
    
    # Create a new ordinal encoder with proper handling
    print("\nCreating fixed OrdinalEncoder...")
    ordinal_encoder = OrdinalEncoder(
        handle_unknown='use_encoded_value', 
        unknown_value=-1,
        dtype=np.int64
    )
    
    # Fit on categorical data
    ordinal_encoder.fit(df[categorical_features])
    
    from pathlib import Path
    base_path = Path(__file__).parent.parent / "models"
    
    # Save the fixed ordinal encoder
    with open(base_path / 'ordinal_encoder.pkl', 'wb') as f:
        pickle.dump(ordinal_encoder, f)
    print(f"SUCCESS: Fixed ordinal_encoder.pkl saved successfully to {base_path}")
    
    # Test the encoder
    print("\nTesting the fixed ordinal encoder...")
    test_data = df[categorical_features].head(5)
    encoded_data = ordinal_encoder.transform(test_data)
    print(f"SUCCESS: Ordinal encoder transformation works: {encoded_data.shape}")
    print(f"Sample encoded values: {encoded_data[0]}")
    
    return ordinal_encoder

if __name__ == "__main__":
    print("Fixing ordinal encoder...")
    fix_ordinal_encoder()
    print("\nOrdinal encoder fixed successfully!")
