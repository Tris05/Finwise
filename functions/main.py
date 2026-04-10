from firebase_functions import https_fn
from firebase_admin import initialize_app
import pickle
import numpy as np
import pandas as pd
import os
import json
import yfinance as yf

initialize_app()

# Load models globally (cold start optimization)
models = {}

def load_models():
    if models.get('loaded'):
        return models

    try:
        # Load XGBoost models
        # Note: In Cloud Functions, files are in the same directory
        with open('xgb_risk_model.pkl', 'rb') as f:
            models['xgb_risk'] = pickle.load(f)
        
        with open('xgb_approval_model.pkl', 'rb') as f:
            models['xgb_approval'] = pickle.load(f)
        
        # Load encoders (graceful fallback)
        try:
            with open('scaler.pkl', 'rb') as f:
                models['scaler'] = pickle.load(f)
        except:
            from sklearn.preprocessing import StandardScaler
            models['scaler'] = StandardScaler()
            
        models['loaded'] = True
        print("Models loaded successfully")
    except Exception as e:
        print(f"Error loading models: {e}")
        models['error'] = str(e)
    
    return models

def prepare_features(input_data):
    """Replicated logic from loan_prediction.py"""
    try:
        df = pd.DataFrame([input_data])
        
        # Define the exact 50 features
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
        
        feature_vector = []
        for feature_name in feature_names:
            if feature_name in df.columns:
                feature_vector.append(df[feature_name].iloc[0])
            else:
                # Handle derived features (Simplified logic for brevity/consistency)
                target_val = 0
                if feature_name == 'LoanToIncomeRatio':
                    loan = df.get('LoanAmount', [0])[0]
                    income = df.get('AnnualIncome', [1])[0]
                    target_val = loan / income if income > 0 else 0
                elif feature_name in ['AssetsToLoanRatio', 'MonthlyLoanToIncome']:
                     target_val = 0 # Simplified, ideally duplicate full logic
                # ... (We assume the input JSON usually contains pre-calculated fields or raw fields)
                # For robust implementation, we should copy the FULL logic from loan_prediction.py
                # But for this snippet, I strictly follow the existing python script's logic structure
                
                # RE-IMPLEMENTING FULL LOGIC TO BE SAFE
                if feature_name == 'LoanToIncomeRatio':
                    loan = df.get('LoanAmount', [0])[0]
                    income = df.get('AnnualIncome', [1])[0]
                    feature_vector.append(loan / income if income > 0 else 0)
                elif feature_name == 'AssetsToLoanRatio':
                    assets = df.get('TotalAssets', [0])[0]
                    loan = df.get('LoanAmount', [1])[0]
                    feature_vector.append(assets / loan if loan > 0 else 0)
                elif feature_name == 'MonthlyLoanToIncome':
                    payment = df.get('MonthlyLoanPayment', [0])[0]
                    income = df.get('MonthlyIncome', [1])[0]
                    feature_vector.append(payment / income if income > 0 else 0)
                elif feature_name.startswith('EducationLevel_'):
                    edu = df.get('EducationLevel', ['Bachelor'])[0]
                    feature_vector.append(1 if edu in feature_name else 0)
                elif feature_name.startswith('MaritalStatus_'):
                    mar = df.get('MaritalStatus', ['Single'])[0]
                    feature_vector.append(1 if mar in feature_name else 0)
                elif feature_name.startswith('HomeOwnershipStatus_'):
                    home = df.get('HomeOwnershipStatus', ['Rent'])[0]
                    feature_vector.append(1 if home in feature_name else 0)
                elif feature_name.startswith('LoanPurpose_'):
                    purp = df.get('LoanPurpose', ['Education'])[0]
                    feature_vector.append(1 if purp in feature_name else 0)
                elif feature_name.startswith('NumberOfDependents_'):
                    dep = df.get('NumberOfDependents', [0])[0]
                    dep_num = int(feature_name.split('_')[1])
                    feature_vector.append(1 if dep == dep_num else 0)
                else:
                    # Mappings
                    mapping = {
                        'Age': 'age', 'AnnualIncome': 'annualIncome', 'CreditScore': 'creditScore',
                        'EmploymentStatus': 'employmentStatus', 'Experience': 'experience',
                        'LoanAmount': 'loanAmount', 'LoanDuration': 'loanDuration',
                        'MonthlyDebtPayments': 'monthlyDebtPayments', 'CreditCardUtilizationRate': 'creditCardUtilizationRate',
                        'NumberOfOpenCreditLines': 'numberOfOpenCreditLines', 'NumberOfCreditInquiries': 'numberOfCreditInquiries',
                        'DebtToIncomeRatio': 'totalDebtToIncomeRatio', 'BankruptcyHistory': 'bankruptcyHistory',
                        'PreviousLoanDefaults': 'previousLoanDefaults', 'PaymentHistory': 'paymentHistory',
                        'LengthOfCreditHistory': 'lengthOfCreditHistory', 'SavingsAccountBalance': 'savingsAccountBalance',
                        'CheckingAccountBalance': 'checkingAccountBalance', 'TotalAssets': 'totalAssets',
                        'TotalLiabilities': 'totalLiabilities', 'MonthlyIncome': 'monthlyIncome',
                        'UtilityBillsPaymentHistory': 'utilityBillsPaymentHistory', 'JobTenure': 'jobTenure',
                        'NetWorth': 'netWorth', 'BaseInterestRate': 'baseInterestRate', 'InterestRate': 'interestRate',
                        'MonthlyLoanPayment': 'monthlyLoanPayment', 'TotalDebtToIncomeRatio': 'totalDebtToIncomeRatio'
                    }
                    mapped = mapping.get(feature_name)
                    if mapped and mapped in df.columns:
                        feature_vector.append(df[mapped].iloc[0])
                    else:
                        feature_vector.append(0)

        return np.array(feature_vector).reshape(1, -1)
    except Exception as e:
        print(f"Feature error: {e}")
        return None

@https_fn.on_request(memory=512)
def predict_loan(req: https_fn.Request) -> https_fn.Response:
    # 1. CORS headers
    if req.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return https_fn.Response('', status=204, headers=headers)

    headers = {'Access-Control-Allow-Origin': '*'}

    # 2. Parse Input
    try:
        input_data = req.get_json()
    except Exception:
        return https_fn.Response(json.dumps({'error': 'Invalid JSON'}), status=400, headers=headers)

    # 3. Load Models
    loaded_models = load_models()
    if not loaded_models.get('loaded'):
        return https_fn.Response(
            json.dumps({'error': 'Model loading failed', 'details': loaded_models.get('error')}), 
            status=500, headers=headers
        )

    # 4. Predict
    features = prepare_features(input_data)
    if features is None:
        return https_fn.Response(json.dumps({'error': 'Feature prep failed'}), status=500, headers=headers)

    try:
        risk_score = float(loaded_models['xgb_risk'].predict(features)[0])
        approval_prob = float(loaded_models['xgb_approval'].predict_proba(features)[0][1])
        
        loan_approved = approval_prob > 0.5
        base_rate = input_data.get('baseInterestRate', 8.5)
        risk_premium = (risk_score / 100) * 5
        eirr = base_rate + risk_premium
        acceptance_score = max(0, 100 - risk_score)
        
        # Risk Level
        if risk_score < 30: risk_level = "LOW RISK - Excellent creditworthiness"
        elif risk_score < 50: risk_level = "MODERATE RISK - Good creditworthiness"
        elif risk_score < 70: risk_level = "MEDIUM-HIGH RISK - Fair creditworthiness"
        else: risk_level = "HIGH RISK - Poor creditworthiness"

        # Recommendations
        recommendations = []
        if risk_score > 60:
            recommendations = ["Improve credit score", "Reduce debt", "Increase down payment"]
        elif risk_score > 40:
            recommendations = ["Consider shorter tenure", "Maintain employment"]
        else:
            recommendations = ["Negotiate based on excellent profile"]

        return https_fn.Response(json.dumps({
            'riskScore': round(risk_score, 2),
            'loanApproved': loan_approved,
            'approvalProbability': round(approval_prob, 3),
            'eirr': round(eirr, 2),
            'acceptanceScore': round(acceptance_score, 2),
            'riskLevel': risk_level,
            'recommendations': recommendations,
            'source': 'cloud_function'
        }), status=200, headers=headers, mimetype='application/json')

    except Exception as e:
        return https_fn.Response(json.dumps({'error': 'Prediction runtime error', 'details': str(e)}), status=500, headers=headers)

@https_fn.on_request(memory=512)
def get_market_data(req: https_fn.Request) -> https_fn.Response:
    # 1. CORS headers
    if req.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return https_fn.Response('', status=204, headers=headers)

    headers = {'Access-Control-Allow-Origin': '*'}
    
    try:
        data = req.get_json()
        symbol = data.get('symbol')
        
        if not symbol:
             return https_fn.Response(json.dumps({'error': 'Symbol required'}), status=400, headers=headers)
        
        # Use yfinance
        updated_symbol = f"{symbol}.NS" if not (symbol.endswith('.NS') or symbol.endswith('.BO')) and 'SENSEX' not in symbol else symbol
        
        ticker = yf.Ticker(updated_symbol)
        info = ticker.info
        hist = ticker.history(period="5d")
        
        if hist.empty:
             # Try without suffix
             ticker = yf.Ticker(symbol)
             info = ticker.info
             hist = ticker.history(period="5d")
             
        if hist.empty:
             return https_fn.Response(json.dumps({'error': 'No data found'}), status=404, headers=headers)

        current_price = info.get('currentPrice') or info.get('regularMarketPrice') or hist['Close'].iloc[-1]
        prev_close = info.get('previousClose') or hist['Close'].iloc[-2] if len(hist) > 1 else current_price
        
        response_data = {
            'symbol': symbol,
            'name': info.get('longName') or info.get('shortName') or symbol,
            'currentPrice': current_price,
            'previousClose': prev_close,
            'dayChange': current_price - prev_close,
            'dayChangePercent': ((current_price - prev_close) / prev_close) * 100,
            'marketCap': info.get('marketCap'),
            'pe': info.get('trailingPE'),
            'sector': info.get('sector'),
            'currency': info.get('currency'),
            'lastUpdated': str(hist.index[-1])
        }
        
        return https_fn.Response(json.dumps({'success': True, 'data': response_data}), status=200, headers=headers)
    except Exception as e:
        return https_fn.Response(json.dumps({'error': str(e)}), status=500, headers=headers)
