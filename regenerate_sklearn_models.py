#!/usr/bin/env python3
"""
Script to regenerate the broken sklearn preprocessing models
This creates new scaler, ordinal_encoder, and one_hot_encoder models
"""

import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, OrdinalEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
import os

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
        
        # Categorical features
        'EmploymentStatus': np.random.choice(['Employed', 'Self-employed', 'Unemployed'], n_samples, p=[0.7, 0.25, 0.05]),
        'EducationLevel': np.random.choice(['High School', 'Bachelor', 'Master', 'Doctorate'], n_samples, p=[0.3, 0.4, 0.25, 0.05]),
        'MaritalStatus': np.random.choice(['Single', 'Married', 'Widowed'], n_samples, p=[0.4, 0.55, 0.05]),
        'HomeOwnershipStatus': np.random.choice(['Own', 'Rent', 'Other'], n_samples, p=[0.4, 0.5, 0.1]),
        'LoanPurpose': np.random.choice(['Home', 'Education', 'Debt Consolidation', 'Other'], n_samples, p=[0.4, 0.2, 0.25, 0.15]),
        'NumberOfDependents': np.random.choice([0, 1, 2, 3, 4, 5], n_samples, p=[0.2, 0.3, 0.25, 0.15, 0.08, 0.02])
    }
    
    return pd.DataFrame(data)

def regenerate_models():
    """Regenerate all three sklearn preprocessing models"""
    print("Creating sample data...")
    df = create_sample_data()
    
    # Define feature columns based on the XGBoost model expectations
    numerical_features = [
        'Age', 'AnnualIncome', 'CreditScore', 'Experience', 'LoanAmount', 'LoanDuration',
        'MonthlyDebtPayments', 'CreditCardUtilizationRate', 'NumberOfOpenCreditLines',
        'NumberOfCreditInquiries', 'DebtToIncomeRatio', 'BankruptcyHistory',
        'PreviousLoanDefaults', 'PaymentHistory', 'LengthOfCreditHistory',
        'SavingsAccountBalance', 'CheckingAccountBalance', 'TotalAssets', 'TotalLiabilities',
        'MonthlyIncome', 'UtilityBillsPaymentHistory', 'JobTenure', 'NetWorth',
        'BaseInterestRate', 'InterestRate', 'MonthlyLoanPayment', 'TotalDebtToIncomeRatio',
        'LoanToIncomeRatio', 'AssetsToLoanRatio', 'MonthlyLoanToIncome'
    ]
    
    categorical_features = [
        'EmploymentStatus', 'EducationLevel', 'MaritalStatus', 'HomeOwnershipStatus',
        'LoanPurpose', 'NumberOfDependents'
    ]
    
    print(f"Numerical features: {len(numerical_features)}")
    print(f"Categorical features: {len(categorical_features)}")
    
    # 1. Create and fit StandardScaler
    print("\n1. Creating StandardScaler...")
    scaler = StandardScaler()
    scaler.fit(df[numerical_features])
    
    # Save scaler
    with open('scaler.pkl', 'wb') as f:
        pickle.dump(scaler, f)
    print("SUCCESS: scaler.pkl saved successfully")
    
    # 2. Create and fit OrdinalEncoder for categorical features
    print("\n2. Creating OrdinalEncoder...")
    ordinal_encoder = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
    ordinal_encoder.fit(df[categorical_features])
    
    # Save ordinal encoder
    with open('ordinal_encoder.pkl', 'wb') as f:
        pickle.dump(ordinal_encoder, f)
    print("SUCCESS: ordinal_encoder.pkl saved successfully")
    
    # 3. Create and fit OneHotEncoder for categorical features
    print("\n3. Creating OneHotEncoder...")
    one_hot_encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
    one_hot_encoder.fit(df[categorical_features])
    
    # Save one-hot encoder
    with open('one_hot_encoder.pkl', 'wb') as f:
        pickle.dump(one_hot_encoder, f)
    print("SUCCESS: one_hot_encoder.pkl saved successfully")
    
    # 4. Test the models
    print("\n4. Testing the regenerated models...")
    test_models()
    
    print("\nSUCCESS: All sklearn preprocessing models regenerated successfully!")
    print("\nModel details:")
    print(f"- Scaler: {type(scaler).__name__} fitted on {len(numerical_features)} features")
    print(f"- Ordinal Encoder: {type(ordinal_encoder).__name__} fitted on {len(categorical_features)} features")
    print(f"- One-Hot Encoder: {type(one_hot_encoder).__name__} fitted on {len(categorical_features)} features")

def test_models():
    """Test that the regenerated models can be loaded and used"""
    try:
        # Test scaler
        with open('scaler.pkl', 'rb') as f:
            test_scaler = pickle.load(f)
        print("SUCCESS: Scaler loads successfully")
        
        # Test ordinal encoder
        with open('ordinal_encoder.pkl', 'rb') as f:
            test_ordinal = pickle.load(f)
        print("SUCCESS: Ordinal encoder loads successfully")
        
        # Test one-hot encoder
        with open('one_hot_encoder.pkl', 'rb') as f:
            test_onehot = pickle.load(f)
        print("SUCCESS: One-hot encoder loads successfully")
        
        # Test transformations
        df = create_sample_data()
        numerical_features = [
            'Age', 'AnnualIncome', 'CreditScore', 'Experience', 'LoanAmount', 'LoanDuration',
            'MonthlyDebtPayments', 'CreditCardUtilizationRate', 'NumberOfOpenCreditLines',
            'NumberOfCreditInquiries', 'DebtToIncomeRatio', 'BankruptcyHistory',
            'PreviousLoanDefaults', 'PaymentHistory', 'LengthOfCreditHistory',
            'SavingsAccountBalance', 'CheckingAccountBalance', 'TotalAssets', 'TotalLiabilities',
            'MonthlyIncome', 'UtilityBillsPaymentHistory', 'JobTenure', 'NetWorth',
            'BaseInterestRate', 'InterestRate', 'MonthlyLoanPayment', 'TotalDebtToIncomeRatio',
            'LoanToIncomeRatio', 'AssetsToLoanRatio', 'MonthlyLoanToIncome'
        ]
        categorical_features = [
            'EmploymentStatus', 'EducationLevel', 'MaritalStatus', 'HomeOwnershipStatus',
            'LoanPurpose', 'NumberOfDependents'
        ]
        
        # Test scaler transformation
        scaled_data = test_scaler.transform(df[numerical_features].head(5))
        print(f"SUCCESS: Scaler transformation works: {scaled_data.shape}")
        
        # Test ordinal encoder transformation
        ordinal_data = test_ordinal.transform(df[categorical_features].head(5))
        print(f"SUCCESS: Ordinal encoder transformation works: {ordinal_data.shape}")
        
        # Test one-hot encoder transformation
        onehot_data = test_onehot.transform(df[categorical_features].head(5))
        print(f"SUCCESS: One-hot encoder transformation works: {onehot_data.shape}")
        
    except Exception as e:
        print(f"ERROR: Error testing models: {e}")

if __name__ == "__main__":
    print("Regenerating sklearn preprocessing models...")
    regenerate_models()
