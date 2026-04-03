#!/usr/bin/env python3
"""
Loan Prediction Service using the actual .pkl models
This script loads the trained models and makes predictions
"""

import sys
import json
import pickle
import numpy as np
import pandas as pd
from pathlib import Path

def load_models():
    """Load all the required .pkl models"""
    try:
        base_path = Path(__file__).parent.parent / "models"
        
        # Load the XGBoost models (these work)
        with open(base_path / 'xgb_risk_model.pkl', 'rb') as f:
            xgb_risk = pickle.load(f)
        
        with open(base_path / 'xgb_approval_model.pkl', 'rb') as f:
            xgb_approval = pickle.load(f)
        
        # Try to load scikit-learn models, but handle errors gracefully
        scaler = None
        ordinal_encoder = None
        one_hot_encoder = None
        
        try:
            with open(base_path / 'scaler.pkl', 'rb') as f:
                scaler = pickle.load(f)
        except Exception as e:
            print(f"Warning: Could not load scaler.pkl: {e}", file=sys.stderr)
            # Create a simple scaler as fallback
            from sklearn.preprocessing import StandardScaler
            scaler = StandardScaler()
        
        try:
            with open(base_path / 'ordinal_encoder.pkl', 'rb') as f:
                ordinal_encoder = pickle.load(f)
        except Exception as e:
            print(f"Warning: Could not load ordinal_encoder.pkl: {e}", file=sys.stderr)
            # Create a simple ordinal encoder as fallback
            from sklearn.preprocessing import OrdinalEncoder
            ordinal_encoder = OrdinalEncoder()
        
        try:
            with open(base_path / 'one_hot_encoder.pkl', 'rb') as f:
                one_hot_encoder = pickle.load(f)
        except Exception as e:
            print(f"Warning: Could not load one_hot_encoder.pkl: {e}", file=sys.stderr)
            # Create a simple one-hot encoder as fallback
            from sklearn.preprocessing import OneHotEncoder
            one_hot_encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
        
        return {
            'xgb_risk': xgb_risk,
            'xgb_approval': xgb_approval,
            'scaler': scaler,
            'ordinal_encoder': ordinal_encoder,
            'one_hot_encoder': one_hot_encoder,
            'loaded': True
        }
    except Exception as e:
        print(f"Error loading models: {e}", file=sys.stderr)
        return {'loaded': False, 'error': str(e)}

def prepare_features(input_data):
    """Prepare features for the model using the exact feature names from the trained model"""
    try:
        # Convert input to DataFrame
        df = pd.DataFrame([input_data])
        
        # Define the exact feature names that the model expects (50 features)
        feature_names = [
            'Age', 'AnnualIncome', 'CreditScore', 'EmploymentStatus', 'Experience',
            'LoanAmount', 'LoanDuration', 'MonthlyDebtPayments',
            'CreditCardUtilizationRate', 'NumberOfOpenCreditLines',
            'NumberOfCreditInquiries', 'DebtToIncomeRatio', 'BankruptcyHistory',
            'PreviousLoanDefaults', 'PaymentHistory', 'LengthOfCreditHistory',
            'SavingsAccountBalance', 'CheckingAccountBalance', 'TotalAssets',
            'TotalLiabilities', 'MonthlyIncome', 'UtilityBillsPaymentHistory',
            'JobTenure', 'NetWorth', 'BaseInterestRate', 'InterestRate',
            'MonthlyLoanPayment', 'TotalDebtToIncomeRatio', 'LoanToIncomeRatio',
            'AssetsToLoanRatio', 'MonthlyLoanToIncome', 'EducationLevel_Bachelor',
            'EducationLevel_Doctorate', 'EducationLevel_High School',
            'EducationLevel_Master', 'MaritalStatus_Married', 'MaritalStatus_Single',
            'MaritalStatus_Widowed', 'HomeOwnershipStatus_Other',
            'HomeOwnershipStatus_Own', 'HomeOwnershipStatus_Rent',
            'LoanPurpose_Debt Consolidation', 'LoanPurpose_Education',
            'LoanPurpose_Home', 'LoanPurpose_Other', 'NumberOfDependents_1',
            'NumberOfDependents_2', 'NumberOfDependents_3', 'NumberOfDependents_4',
            'NumberOfDependents_5'
        ]
        
        # Create feature vector with proper mapping
        feature_vector = []
        
        for feature_name in feature_names:
            if feature_name in df.columns:
                feature_vector.append(df[feature_name].iloc[0])
            else:
                # Handle derived features and categorical encodings
                if feature_name == 'LoanToIncomeRatio':
                    loan_amount = df.get('LoanAmount', [0])[0]
                    annual_income = df.get('AnnualIncome', [1])[0]
                    feature_vector.append(loan_amount / annual_income if annual_income > 0 else 0)
                elif feature_name == 'AssetsToLoanRatio':
                    total_assets = df.get('TotalAssets', [0])[0]
                    loan_amount = df.get('LoanAmount', [1])[0]
                    feature_vector.append(total_assets / loan_amount if loan_amount > 0 else 0)
                elif feature_name == 'MonthlyLoanToIncome':
                    monthly_payment = df.get('MonthlyLoanPayment', [0])[0]
                    monthly_income = df.get('MonthlyIncome', [1])[0]
                    feature_vector.append(monthly_payment / monthly_income if monthly_income > 0 else 0)
                elif feature_name.startswith('EducationLevel_'):
                    education = df.get('EducationLevel', ['Bachelor'])[0]
                    feature_vector.append(1 if education in feature_name else 0)
                elif feature_name.startswith('MaritalStatus_'):
                    marital = df.get('MaritalStatus', ['Single'])[0]
                    feature_vector.append(1 if marital in feature_name else 0)
                elif feature_name.startswith('HomeOwnershipStatus_'):
                    home = df.get('HomeOwnershipStatus', ['Rent'])[0]
                    feature_vector.append(1 if home in feature_name else 0)
                elif feature_name.startswith('LoanPurpose_'):
                    purpose = df.get('LoanPurpose', ['Education'])[0]
                    feature_vector.append(1 if purpose in feature_name else 0)
                elif feature_name.startswith('NumberOfDependents_'):
                    dependents = df.get('NumberOfDependents', [0])[0]
                    dep_num = int(feature_name.split('_')[1])
                    feature_vector.append(1 if dependents == dep_num else 0)
                else:
                    # Map common field names
                    mapping = {
                        'Age': 'age',
                        'AnnualIncome': 'annualIncome',
                        'CreditScore': 'creditScore',
                        'EmploymentStatus': 'employmentStatus',
                        'Experience': 'experience',
                        'LoanAmount': 'loanAmount',
                        'LoanDuration': 'loanDuration',
                        'MonthlyDebtPayments': 'monthlyDebtPayments',
                        'CreditCardUtilizationRate': 'creditCardUtilizationRate',
                        'NumberOfOpenCreditLines': 'numberOfOpenCreditLines',
                        'NumberOfCreditInquiries': 'numberOfCreditInquiries',
                        'DebtToIncomeRatio': 'totalDebtToIncomeRatio',
                        'BankruptcyHistory': 'bankruptcyHistory',
                        'PreviousLoanDefaults': 'previousLoanDefaults',
                        'PaymentHistory': 'paymentHistory',
                        'LengthOfCreditHistory': 'lengthOfCreditHistory',
                        'SavingsAccountBalance': 'savingsAccountBalance',
                        'CheckingAccountBalance': 'checkingAccountBalance',
                        'TotalAssets': 'totalAssets',
                        'TotalLiabilities': 'totalLiabilities',
                        'MonthlyIncome': 'monthlyIncome',
                        'UtilityBillsPaymentHistory': 'utilityBillsPaymentHistory',
                        'JobTenure': 'jobTenure',
                        'NetWorth': 'netWorth',
                        'BaseInterestRate': 'baseInterestRate',
                        'InterestRate': 'interestRate',
                        'MonthlyLoanPayment': 'monthlyLoanPayment',
                        'TotalDebtToIncomeRatio': 'totalDebtToIncomeRatio'
                    }
                    
                    mapped_name = mapping.get(feature_name)
                    if mapped_name and mapped_name in df.columns:
                        feature_vector.append(df[mapped_name].iloc[0])
                    else:
                        feature_vector.append(0)  # Default value
        
        # Convert to numpy array and reshape for prediction
        features = np.array(feature_vector).reshape(1, -1)
        
        return features
        
    except Exception as e:
        print(f"Error preparing features: {e}", file=sys.stderr)
        return None

def predict_loan(input_data):
    """Make loan prediction using the loaded models"""
    try:
        # Load models
        models = load_models()
        if not models['loaded']:
            return {
                'error': 'Models not loaded',
                'details': models.get('error', 'Unknown error')
            }
        
        # Prepare features
        features = prepare_features(input_data)
        if features is None:
            return {'error': 'Feature preparation failed'}
        
        # Make predictions
        risk_score = models['xgb_risk'].predict(features)[0]
        approval_prob = models['xgb_approval'].predict_proba(features)[0][1]  # Probability of approval
        
        # Convert to loan approval (threshold at 0.5)
        loan_approved = approval_prob > 0.5
        
        # Calculate EIRR (Effective Interest Rate of Return)
        base_rate = input_data.get('baseInterestRate', 8.5)
        risk_premium = (risk_score / 100) * 5  # Max 5% risk premium
        eirr = base_rate + risk_premium
        
        # Calculate acceptance score
        acceptance_score = max(0, 100 - risk_score)
        
        # Determine risk level
        if risk_score < 30:
            risk_level = "LOW RISK - Excellent creditworthiness"
        elif risk_score < 50:
            risk_level = "MODERATE RISK - Good creditworthiness"
        elif risk_score < 70:
            risk_level = "MEDIUM-HIGH RISK - Fair creditworthiness"
        else:
            risk_level = "HIGH RISK - Poor creditworthiness"
        
        # Calculate confidence
        confidence = min(95, 60 + (input_data.get('creditScore', 700) / 10) + (input_data.get('jobTenure', 3) * 2))
        
        # Generate recommendations
        recommendations = []
        if risk_score > 60:
            recommendations.extend([
                "Improve credit score before applying",
                "Reduce existing debt obligations",
                "Increase down payment amount",
                "Consider co-applicant with better credit"
            ])
        elif risk_score > 40:
            recommendations.extend([
                "Consider shorter loan tenure",
                "Maintain stable employment",
                "Keep debt-to-income ratio below 40%"
            ])
        else:
            recommendations.extend([
                "Excellent credit profile - negotiate for better rates",
                "Consider prepayment options",
                "You qualify for premium loan products"
            ])
        
        return {
            'riskScore': round(float(risk_score), 2),
            'loanApproved': bool(loan_approved),
            'approvalProbability': round(float(approval_prob), 3),
            'eirr': round(float(eirr), 2),
            'acceptanceScore': round(float(acceptance_score), 2),
            'riskLevel': risk_level,
            'confidence': round(float(confidence), 2),
            'recommendations': recommendations,
            'modelsUsed': True
        }
        
    except Exception as e:
        return {
            'error': 'Prediction failed',
            'details': str(e),
            'modelsUsed': False
        }

def main():
    """Main function to handle command line input"""
    try:
        # Read input from stdin
        input_str = sys.stdin.read()
        input_data = json.loads(input_str)
        
        # Make prediction
        result = predict_loan(input_data)
        
        # Output result
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': 'Script execution failed',
            'details': str(e),
            'modelsUsed': False
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()
