#!/usr/bin/env python3
"""
Test script to verify all 5 .pkl models work together
"""

import json
import subprocess
import sys

def test_loan_prediction():
    """Test the loan prediction with sample data"""
    
    # Sample loan data
    sample_data = {
        "loanAmount": 5000000,
        "loanDuration": 240,
        "baseInterestRate": 8.5,
        "monthlyLoanPayment": 45000,
        "age": 35,
        "annualIncome": 1200000,
        "creditScore": 750,
        "employmentStatus": "Employed",
        "experience": 8,
        "monthlyDebtPayments": 25000,
        "creditCardUtilizationRate": 0.3,
        "numberOfOpenCreditLines": 3,
        "numberOfCreditInquiries": 2,
        "bankruptcyHistory": 0,
        "previousLoanDefaults": 0,
        "paymentHistory": 0,
        "lengthOfCreditHistory": 10,
        "savingsAccountBalance": 500000,
        "checkingAccountBalance": 100000,
        "totalAssets": 2000000,
        "totalLiabilities": 800000,
        "monthlyIncome": 100000,
        "utilityBillsPaymentHistory": 0,
        "jobTenure": 5,
        "netWorth": 1200000,
        "interestRate": 8.5,
        "totalDebtToIncomeRatio": 0.35,
        "educationLevel": "Bachelor",
        "maritalStatus": "Married",
        "homeOwnershipStatus": "Own",
        "loanPurpose": "Home",
        "numberOfDependents": 2
    }
    
    try:
        # Convert to JSON string
        input_json = json.dumps(sample_data)
        
        # Run the loan prediction script
        result = subprocess.run(
            ['python', 'loan_prediction.py'],
            input=input_json,
            text=True,
            capture_output=True,
            timeout=30
        )
        
        if result.returncode == 0:
            # Parse the output
            output = json.loads(result.stdout)
            
            if 'error' in output:
                print(f"ERROR: {output['error']}")
                if 'details' in output:
                    print(f"Details: {output['details']}")
                return False
            else:
                print("SUCCESS: Loan prediction completed!")
                print(f"Risk Score: {output.get('riskScore', 'N/A')}")
                print(f"Loan Approved: {output.get('loanApproved', 'N/A')}")
                print(f"Approval Probability: {output.get('approvalProbability', 'N/A')}")
                print(f"Risk Level: {output.get('riskLevel', 'N/A')}")
                print(f"Models Used: {output.get('modelsUsed', 'N/A')}")
                return True
                
        else:
            print(f"ERROR: Script failed with return code {result.returncode}")
            print(f"STDERR: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("ERROR: Script timed out")
        return False
    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to parse output JSON: {e}")
        print(f"Raw output: {result.stdout}")
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        return False

def test_individual_models():
    """Test each model individually"""
    print("Testing individual models...")
    
    try:
        import pickle
        import numpy as np
        
        # Test XGBoost models
        print("\n1. Testing XGBoost Risk Model...")
        with open('xgb_risk_model.pkl', 'rb') as f:
            risk_model = pickle.load(f)
        
        # Create test data with correct number of features
        test_features = np.zeros((1, 50))
        risk_pred = risk_model.predict(test_features)
        print(f"SUCCESS: Risk model prediction: {risk_pred[0]}")
        
        print("\n2. Testing XGBoost Approval Model...")
        with open('xgb_approval_model.pkl', 'rb') as f:
            approval_model = pickle.load(f)
        
        approval_pred = approval_model.predict_proba(test_features)
        print(f"SUCCESS: Approval model prediction: {approval_pred[0]}")
        
        # Test sklearn models
        print("\n3. Testing StandardScaler...")
        with open('scaler.pkl', 'rb') as f:
            scaler = pickle.load(f)
        
        # Test with 30 numerical features
        test_numerical = np.zeros((1, 30))
        scaled_data = scaler.transform(test_numerical)
        print(f"SUCCESS: Scaler transformation: {scaled_data.shape}")
        
        print("\n4. Testing OrdinalEncoder...")
        with open('ordinal_encoder.pkl', 'rb') as f:
            ordinal_encoder = pickle.load(f)
        
        # Test with 6 categorical features - use proper string format
        test_categorical = np.array([['Employed', 'Bachelor', 'Married', 'Own', 'Home', '2']])
        ordinal_data = ordinal_encoder.transform(test_categorical)
        print(f"SUCCESS: Ordinal encoder transformation: {ordinal_data.shape}")
        
        print("\n5. Testing OneHotEncoder...")
        with open('one_hot_encoder.pkl', 'rb') as f:
            one_hot_encoder = pickle.load(f)
        
        onehot_data = one_hot_encoder.transform(test_categorical)
        print(f"SUCCESS: One-hot encoder transformation: {onehot_data.shape}")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Individual model test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing all 5 .pkl models...")
    print("=" * 50)
    
    # Test individual models first
    individual_success = test_individual_models()
    
    print("\n" + "=" * 50)
    print("Testing integrated loan prediction...")
    
    # Test integrated prediction
    prediction_success = test_loan_prediction()
    
    print("\n" + "=" * 50)
    print("FINAL RESULTS:")
    print(f"Individual Models: {'PASS' if individual_success else 'FAIL'}")
    print(f"Integrated Prediction: {'PASS' if prediction_success else 'FAIL'}")
    
    if individual_success and prediction_success:
        print("\nSUCCESS: All 5 .pkl models are working correctly!")
    else:
        print("\nISSUES DETECTED: Some models or integration needs attention.")
