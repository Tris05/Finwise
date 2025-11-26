# LangGraph Agentic Portfolio Management System

## Overview
This document outlines the implementation of a multi-agent portfolio management system using LangGraph, designed for hackathon development with optimized performance for 4GB VRAM RTX 3050 GPU constraints.

## System Input and Output Specification

### User Input Format

The system expects a structured input containing the following information:

```python
user_input = {
    "user_profile": {
        "risk_score": 0.6,                    # Float 0-1 (0=conservative, 1=aggressive)
        "investment_horizon": 5,              # Integer years (1-30)
        "age": 30,                           # Integer age of investor
        "annual_income": 1200000,            # Float in INR
        "preferences": [                     # List of strings
            "tax_saving", 
            "growth", 
            "dividend_income",
            "liquidity"
        ],
        "constraints": {                     # Dictionary of limits
            "max_crypto": 0.15,              # Maximum crypto allocation (0-1)
            "max_single_stock": 0.10,        # Maximum single stock allocation
            "min_fixed_income": 0.20,        # Minimum fixed income allocation
            "exclude_sectors": ["tobacco", "alcohol"],  # Sectors to avoid
            "preferred_stocks": ["RELIANCE.NS", "TCS.NS"],  # Preferred stocks
            "investment_style": "moderate"    # "conservative", "moderate", "aggressive"
        }
    },
    "financial_details": {
        "total_assets": 1000000,             # Float in INR - total investable amount
        "monthly_surplus": 50000,            # Float in INR - monthly investment capacity
        "emergency_fund": 300000,            # Float in INR - existing emergency fund
        "existing_investments": {            # Optional - current portfolio
            "stocks": 200000,
            "mutual_funds": 150000,
            "fd_ppf": 100000,
            "crypto": 50000,
            "gold": 25000
        },
        "debts": {                          # Optional - existing liabilities
            "home_loan": 2000000,
            "personal_loan": 0,
            "credit_card": 50000
        }
    },
    "goals": [                              # List of investment goals
        {
            "name": "Child Education",
            "target_amount": 2000000,
            "time_horizon": 15,
            "priority": "high"
        },
        {
            "name": "Retirement Planning", 
            "target_amount": 10000000,
            "time_horizon": 30,
            "priority": "medium"
        },
        {
            "name": "House Down Payment",
            "target_amount": 1500000,
            "time_horizon": 7,
            "priority": "high"
        }
    ],
    "market_preferences": {                 # Optional market preferences
        "preferred_exchanges": ["NSE", "BSE"],
        "currency": "INR",
        "update_frequency": "monthly",       # "weekly", "monthly", "quarterly"
        "rebalancing_threshold": 0.05        # 5% drift before rebalancing
    }
}
```

### System Output Format

The system returns a comprehensive portfolio recommendation in the following structured format:

```python
system_output = {
    "portfolio_recommendation": {
        "meta_data": {
            "user_id": "user_12345",
            "recommendation_id": "rec_67890",
            "generated_timestamp": "2025-01-26T10:30:00Z",
            "model_version": "v1.0",
            "risk_profile": "Moderate",
            "total_investment": 1000000,
            "currency": "INR"
        },
        
        "macro_allocation": {                # High-level asset class allocation
            "stocks": {
                "percentage": 0.45,          # 45% allocation
                "amount": 450000,            # INR amount
                "rationale": "Growth potential aligned with moderate risk profile"
            },
            "mutual_funds": {
                "percentage": 0.25,
                "amount": 250000,
                "rationale": "Professional management and diversification"
            },
            "crypto": {
                "percentage": 0.10,
                "amount": 100000,
                "rationale": "Small allocation for high growth potential"
            },
            "gold": {
                "percentage": 0.05,
                "amount": 50000,
                "rationale": "Hedge against inflation and currency risk"
            },
            "fixed_income": {
                "percentage": 0.15,
                "amount": 150000,
                "rationale": "Stability and tax benefits through PPF/FD"
            }
        },
        
        "micro_allocation": {               # Specific asset recommendations
            "stocks": [
                {
                    "symbol": "RELIANCE.NS",
                    "company_name": "Reliance Industries",
                    "shares": 18,
                    "amount": 45000,
                    "current_price": 2500,
                    "sector": "Energy",
                    "rationale": "Market leader with diversified business model",
                    "risk_score": 0.6,
                    "expected_return": 0.15
                },
                {
                    "symbol": "TCS.NS", 
                    "company_name": "Tata Consultancy Services",
                    "shares": 115,
                    "amount": 402500,
                    "current_price": 3500,
                    "sector": "IT",
                    "rationale": "Stable IT services with global presence",
                    "risk_score": 0.4,
                    "expected_return": 0.12
                }
            ],
            "mutual_funds": [
                {
                    "fund_name": "SBI Blue Chip Fund",
                    "fund_type": "Large Cap Equity",
                    "amount": 100000,
                    "nav": 45.67,
                    "units": 2189.5,
                    "expense_ratio": 0.0065,
                    "cagr_3yr": 0.14,
                    "rationale": "Consistent performer in large cap category"
                },
                {
                    "fund_name": "HDFC Mid-Cap Opportunities Fund",
                    "fund_type": "Mid Cap Equity", 
                    "amount": 150000,
                    "nav": 89.23,
                    "units": 1681.2,
                    "expense_ratio": 0.018,
                    "cagr_3yr": 0.18,
                    "rationale": "Higher growth potential through mid-cap exposure"
                }
            ],
            "crypto": [
                {
                    "symbol": "BTC",
                    "name": "Bitcoin",
                    "amount": 60000,
                    "quantity": 0.0171,
                    "current_price_inr": 3500000,
                    "rationale": "Store of value and portfolio diversifier"
                },
                {
                    "symbol": "ETH",
                    "name": "Ethereum", 
                    "amount": 40000,
                    "quantity": 0.2,
                    "current_price_inr": 200000,
                    "rationale": "Platform for decentralized applications"
                }
            ],
            "gold": [
                {
                    "type": "Gold ETF",
                    "fund_name": "HDFC Gold ETF",
                    "amount": 50000,
                    "units": 909.1,
                    "price_per_unit": 55,
                    "rationale": "Liquid and cost-effective gold exposure"
                }
            ],
            "fixed_income": [
                {
                    "type": "PPF",
                    "amount": 100000,
                    "rate": 0.071,
                    "tenure": 15,
                    "tax_benefit": "80C + Tax-free returns",
                    "maturity_value": 279000,
                    "rationale": "Tax-efficient long-term wealth creation"
                },
                {
                    "type": "Fixed Deposit",
                    "bank": "SBI",
                    "amount": 50000,
                    "rate": 0.065,
                    "tenure": 5,
                    "maturity_value": 69000,
                    "rationale": "Capital protection and guaranteed returns"
                }
            ]
        },
        
        "risk_assessment": {
            "overall_risk_level": "Moderate",
            "risk_score": 0.62,
            "expected_annual_return": 0.136,     # 13.6%
            "expected_volatility": 0.18,         # 18% 
            "sharpe_ratio": 0.76,
            "max_drawdown_estimate": 0.25,       # 25%
            "var_95": 0.08,                      # 8% Value at Risk
            "beta": 0.85,                        # Beta vs market
            "correlation_with_nifty": 0.78,
            "diversification_score": 0.82,       # 0-1 scale
            "concentration_risk": "Low",
            "liquidity_score": 0.75,            # 0-1 scale
            "stress_test_results": {
                "market_crash_scenario": -0.22,  # -22% portfolio drop
                "inflation_shock": -0.08,        # -8% real returns
                "interest_rate_rise": -0.05      # -5% impact
            },
            "risk_violations": []                # Any constraint violations
        },
        
        "financial_projections": {
            "year_wise_projection": [
                {
                    "year": 1,
                    "portfolio_value": 1136000,
                    "gain_loss": 136000,
                    "return_percentage": 0.136
                },
                {
                    "year": 5, 
                    "portfolio_value": 1928000,
                    "gain_loss": 928000,
                    "return_percentage": 0.136
                },
                {
                    "year": 10,
                    "portfolio_value": 3717000,
                    "gain_loss": 2717000, 
                    "return_percentage": 0.136
                }
            ],
            "goal_achievement": [
                {
                    "goal_name": "Child Education",
                    "target_amount": 2000000,
                    "projected_amount": 2100000,
                    "achievement_probability": 0.85,
                    "shortfall_risk": 0.15,
                    "recommendation": "On track with current allocation"
                }
            ],
            "retirement_corpus": {
                "projected_amount": 12500000,
                "monthly_sip_required": 45000,
                "retirement_readiness_score": 0.78
            }
        },
        
        "actionable_advice": {
            "immediate_actions": [
                "Open PPF account if not existing and invest ₹100,000",
                "Start SIP in recommended mutual funds with ₹20,000/month",
                "Purchase recommended stocks in 3 tranches over next month",
                "Set up automatic rebalancing alerts for quarterly review"
            ],
            "monthly_sip_recommendation": {
                "total_sip_amount": 50000,
                "mutual_funds": 35000,
                "stocks": 10000,
                "ppf": 5000,
                "crypto": 0  # Not recommended for SIP
            },
            "tax_optimization": [
                "Utilize full ₹1.5L limit under 80C through PPF",
                "Consider ELSS funds for additional tax saving",
                "Plan capital gains harvesting in March"
            ],
            "rebalancing_triggers": [
                "Rebalance if any asset class deviates >5% from target",
                "Review allocation quarterly",
                "Consider tactical shifts based on market conditions"
            ],
            "risk_mitigation": [
                "Maintain 6 months emergency fund separately",
                "Consider term insurance of ₹1 crore",
                "Diversify across sectors and market caps"
            ]
        },
        
        "educational_content": {
            "key_concepts": [
                {
                    "concept": "Asset Allocation",
                    "explanation": "Dividing investments among different asset classes to optimize risk-return profile",
                    "importance": "Determines 90% of portfolio performance"
                },
                {
                    "concept": "Systematic Investment Plan (SIP)",
                    "explanation": "Regular investment of fixed amount to benefit from rupee cost averaging",
                    "importance": "Reduces timing risk and builds discipline"
                }
            ],
            "market_insights": [
                "Current market conditions favor balanced approach",
                "Technology sector showing strong fundamentals",
                "Gold allocation recommended due to global uncertainty"
            ],
            "common_mistakes": [
                "Don't chase last year's best performers",
                "Avoid emotional decisions during market volatility",
                "Don't neglect regular portfolio review"
            ]
        },
        
        "compliance_and_disclaimers": {
            "regulatory_compliance": [
                "Recommendations comply with SEBI guidelines",
                "Tax implications shown are estimates only",
                "Past performance doesn't guarantee future results"
            ],
            "important_disclaimers": [
                "This is AI-generated advice for educational purposes",
                "Please consult a qualified financial advisor",
                "Market risks apply to all investments",
                "Systematic investment plan doesn't guarantee profits"
            ],
            "data_sources": [
                "NSE/BSE for stock prices",
                "AMFI for mutual fund data", 
                "CoinGecko for cryptocurrency prices",
                "RBI for fixed income rates"
            ]
        }
    }
}
```

### Input-Output Flow Summary

**Input Summary:**
- User provides: Investment amount, risk profile, goals, constraints, preferences
- System expects: Structured JSON with financial details and investment preferences

**Processing:**
- Data Agent: Fetches real-time market data
- Macro Agent: Determines asset class allocation percentages
- Micro Agent: Selects specific assets within each class  
- Risk Agent: Validates and adjusts for risk compliance
- Explanation Agent: Generates human-readable advice and projections

**Output Summary:**
- Complete portfolio breakdown with specific buy recommendations
- Risk analysis and stress testing results
- Financial projections and goal achievement probability
- Actionable steps and ongoing investment strategy
- Educational content and compliance information

## Architecture Overview

### System Components
- **LangGraph Orchestrator**: Central workflow coordinator
- **6 Specialized Agents**: Data, Macro, Micro, Risk, Explanation, and Orchestrator agents
- **Lightweight Models**: Optimized for low computational requirements
- **State Management**: Efficient state passing between agents

## LangGraph Implementation Structure

### 1. State Schema Definition

```python
from typing import TypedDict, List, Dict, Optional
from langgraph import StateGraph
import json

class PortfolioState(TypedDict):
    # User inputs
    user_profile: Dict[str, any]  # risk_score, investment_horizon, preferences
    total_assets: float
    existing_portfolio: Optional[Dict[str, any]]
    
    # Data agent outputs
    market_data: Optional[Dict[str, any]]
    processed_data: Optional[Dict[str, any]]
    
    # Macro agent outputs
    macro_allocation: Optional[Dict[str, float]]
    
    # Micro agent outputs
    asset_recommendations: Optional[Dict[str, List[Dict]]]
    
    # Risk agent outputs
    risk_assessment: Optional[Dict[str, any]]
    validated_portfolio: Optional[Dict[str, any]]
    
    # Explanation agent outputs
    final_advice: Optional[Dict[str, str]]
    
    # Flow control
    current_step: str
    errors: List[str]
    iteration_count: int
```

### 2. Agent Implementations

#### A. Orchestrator Agent (Entry Point)

```python
def orchestrator_agent(state: PortfolioState) -> PortfolioState:
    """
    Central coordinator that manages the workflow
    """
    if state["current_step"] == "start":
        # Initialize workflow
        return {
            **state,
            "current_step": "data_collection",
            "iteration_count": 0
        }
    
    elif state["current_step"] == "validation_failed":
        # Handle rebalancing if risk validation fails
        if state["iteration_count"] < 3:  # Max 3 iterations
            return {
                **state,
                "current_step": "macro_allocation",
                "iteration_count": state["iteration_count"] + 1
            }
        else:
            # Fallback to conservative allocation
            return conservative_fallback(state)
    
    elif state["current_step"] == "complete":
        return state
    
    return state

def conservative_fallback(state: PortfolioState) -> PortfolioState:
    """Fallback conservative allocation when optimization fails"""
    total_assets = state["total_assets"]
    risk_score = state["user_profile"]["risk_score"]
    
    # Conservative allocation based on risk score
    if risk_score <= 0.4:  # Low risk
        allocation = {
            "fd_ppf": 0.6,
            "mutual_funds": 0.3,
            "stocks": 0.1,
            "gold": 0.0,
            "crypto": 0.0
        }
    elif risk_score <= 0.7:  # Moderate risk
        allocation = {
            "fd_ppf": 0.4,
            "mutual_funds": 0.4,
            "stocks": 0.15,
            "gold": 0.05,
            "crypto": 0.0
        }
    else:  # High risk
        allocation = {
            "fd_ppf": 0.2,
            "mutual_funds": 0.3,
            "stocks": 0.4,
            "gold": 0.05,
            "crypto": 0.05
        }
    
    return {
        **state,
        "macro_allocation": allocation,
        "current_step": "micro_allocation"
    }
```

#### B. Data Agent (Market Data Collection)

```python
import yfinance as yf
import requests
from datetime import datetime, timedelta

def data_agent(state: PortfolioState) -> PortfolioState:
    """
    Lightweight data collection optimized for performance
    """
    try:
        # Fetch only essential data to minimize API calls
        market_data = fetch_essential_market_data()
        processed_data = preprocess_market_data(market_data, state["user_profile"])
        
        return {
            **state,
            "market_data": market_data,
            "processed_data": processed_data,
            "current_step": "macro_allocation"
        }
    except Exception as e:
        return {
            **state,
            "errors": state["errors"] + [f"Data collection error: {str(e)}"],
            "current_step": "macro_allocation"  # Continue with cached/default data
        }

def fetch_essential_market_data():
    """
    Fetch minimal essential data for performance
    """
    data = {}
    
    # Sample Indian stocks (top performers/stable)
    indian_stocks = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS"]
    
    try:
        # Fetch last 30 days data only (performance optimization)
        stock_data = {}
        for stock in indian_stocks:
            ticker = yf.Ticker(stock)
            hist = ticker.history(period="1mo")
            if not hist.empty:
                returns = hist['Close'].pct_change().dropna()
                stock_data[stock] = {
                    "current_price": hist['Close'][-1],
                    "returns": returns.tolist(),
                    "volatility": returns.std(),
                    "mean_return": returns.mean()
                }
        data["stocks"] = stock_data
        
        # Crypto data (top 5 only for performance)
        crypto_data = fetch_crypto_data_lightweight()
        data["crypto"] = crypto_data
        
        # Fixed income rates (simplified)
        data["fixed_income"] = {
            "ppf_rate": 0.071,  # Current PPF rate
            "fd_rate": 0.065,   # Average FD rate
        }
        
        # Gold price (single API call)
        data["gold"] = fetch_gold_price()
        
    except Exception as e:
        # Return minimal default data if APIs fail
        data = get_default_market_data()
    
    return data

def fetch_crypto_data_lightweight():
    """Fetch top 5 crypto currencies only"""
    try:
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": "bitcoin,ethereum,binancecoin,cardano,solana",
            "vs_currencies": "inr",
            "include_24hr_change": "true"
        }
        response = requests.get(url, params=params, timeout=5)
        return response.json() if response.status_code == 200 else {}
    except:
        return {}

def fetch_gold_price():
    """Fetch current gold price"""
    try:
        # Using a free API for gold prices
        response = requests.get("https://api.metals.live/v1/spot/gold", timeout=5)
        return response.json() if response.status_code == 200 else {"price": 5500}  # Default INR price
    except:
        return {"price": 5500}  # Default fallback price per gram
```

#### C. Macro Agent (Asset Class Allocation)

```python
import numpy as np
from scipy.optimize import minimize

def macro_agent(state: PortfolioState) -> PortfolioState:
    """
    Simplified Markowitz optimization for asset class allocation
    """
    try:
        user_profile = state["user_profile"]
        processed_data = state.get("processed_data", {})
        
        # Simplified asset classes for performance
        asset_classes = ["stocks", "mutual_funds", "crypto", "gold", "fd_ppf"]
        
        # Calculate expected returns and covariance (simplified)
        expected_returns = calculate_expected_returns(processed_data, asset_classes)
        risk_matrix = calculate_simplified_risk_matrix(asset_classes, user_profile["risk_score"])
        
        # Optimize allocation
        optimal_weights = optimize_portfolio_lightweight(
            expected_returns, 
            risk_matrix, 
            user_profile["risk_score"],
            user_profile.get("constraints", {})
        )
        
        # Convert to allocation dictionary
        macro_allocation = {
            asset_classes[i]: float(optimal_weights[i]) 
            for i in range(len(asset_classes))
        }
        
        return {
            **state,
            "macro_allocation": macro_allocation,
            "current_step": "micro_allocation"
        }
    
    except Exception as e:
        # Fallback to rule-based allocation
        return rule_based_macro_allocation(state)

def optimize_portfolio_lightweight(expected_returns, risk_matrix, risk_score, constraints):
    """
    Lightweight portfolio optimization using simplified Markowitz
    """
    n_assets = len(expected_returns)
    
    # Constraints
    constraints_list = [
        {"type": "eq", "fun": lambda x: np.sum(x) - 1.0},  # Weights sum to 1
    ]
    
    # Bounds based on risk score and asset type
    bounds = get_asset_bounds(risk_score, constraints)
    
    # Objective function (minimize negative Sharpe ratio)
    def objective(weights):
        portfolio_return = np.sum(weights * expected_returns)
        portfolio_risk = np.sqrt(np.dot(weights, np.dot(risk_matrix, weights)))
        risk_free_rate = 0.06  # Simplified risk-free rate
        sharpe_ratio = (portfolio_return - risk_free_rate) / (portfolio_risk + 1e-8)
        return -sharpe_ratio  # Minimize negative Sharpe ratio
    
    # Initial guess (equal weights)
    x0 = np.array([1.0/n_assets] * n_assets)
    
    # Optimize
    result = minimize(
        objective, 
        x0, 
        method='SLSQP',
        bounds=bounds,
        constraints=constraints_list,
        options={'maxiter': 100}  # Limit iterations for performance
    )
    
    return result.x if result.success else x0

def get_asset_bounds(risk_score, user_constraints):
    """
    Define bounds for each asset class based on risk score
    """
    if risk_score <= 0.4:  # Conservative
        bounds = [
            (0.0, 0.3),   # stocks
            (0.2, 0.6),   # mutual_funds
            (0.0, 0.05),  # crypto
            (0.0, 0.2),   # gold
            (0.3, 0.8),   # fd_ppf
        ]
    elif risk_score <= 0.7:  # Moderate
        bounds = [
            (0.1, 0.5),   # stocks
            (0.2, 0.5),   # mutual_funds
            (0.0, 0.15),  # crypto
            (0.0, 0.2),   # gold
            (0.1, 0.5),   # fd_ppf
        ]
    else:  # Aggressive
        bounds = [
            (0.2, 0.7),   # stocks
            (0.1, 0.4),   # mutual_funds
            (0.0, 0.25),  # crypto
            (0.0, 0.2),   # gold
            (0.0, 0.3),   # fd_ppf
        ]
    
    # Apply user-specific constraints
    if "max_crypto" in user_constraints:
        bounds[2] = (bounds[2][0], min(bounds[2][1], user_constraints["max_crypto"]))
    
    return bounds

def rule_based_macro_allocation(state: PortfolioState):
    """
    Fallback rule-based allocation when optimization fails
    """
    risk_score = state["user_profile"]["risk_score"]
    
    # Simple rule-based allocation
    if risk_score <= 0.4:
        allocation = {"stocks": 0.2, "mutual_funds": 0.3, "crypto": 0.0, "gold": 0.1, "fd_ppf": 0.4}
    elif risk_score <= 0.7:
        allocation = {"stocks": 0.3, "mutual_funds": 0.35, "crypto": 0.1, "gold": 0.05, "fd_ppf": 0.2}
    else:
        allocation = {"stocks": 0.45, "mutual_funds": 0.25, "crypto": 0.2, "gold": 0.05, "fd_ppf": 0.05}
    
    return {
        **state,
        "macro_allocation": allocation,
        "current_step": "micro_allocation"
    }
```

#### D. Micro Agent (Specific Asset Selection)

```python
def micro_agent(state: PortfolioState) -> PortfolioState:
    """
    Select specific assets within each allocated class
    """
    try:
        macro_allocation = state["macro_allocation"]
        total_assets = state["total_assets"]
        market_data = state.get("market_data", {})
        user_profile = state["user_profile"]
        
        asset_recommendations = {}
        
        # Allocate stocks
        if macro_allocation.get("stocks", 0) > 0:
            stock_amount = total_assets * macro_allocation["stocks"]
            asset_recommendations["stocks"] = select_stocks(
                stock_amount, market_data.get("stocks", {}), user_profile
            )
        
        # Allocate mutual funds (simplified selection)
        if macro_allocation.get("mutual_funds", 0) > 0:
            mf_amount = total_assets * macro_allocation["mutual_funds"]
            asset_recommendations["mutual_funds"] = select_mutual_funds(
                mf_amount, user_profile
            )
        
        # Allocate crypto
        if macro_allocation.get("crypto", 0) > 0:
            crypto_amount = total_assets * macro_allocation["crypto"]
            asset_recommendations["crypto"] = select_crypto(
                crypto_amount, market_data.get("crypto", {}), user_profile
            )
        
        # Allocate gold
        if macro_allocation.get("gold", 0) > 0:
            gold_amount = total_assets * macro_allocation["gold"]
            asset_recommendations["gold"] = select_gold_allocation(gold_amount)
        
        # Allocate fixed deposits/PPF
        if macro_allocation.get("fd_ppf", 0) > 0:
            fd_ppf_amount = total_assets * macro_allocation["fd_ppf"]
            asset_recommendations["fd_ppf"] = select_fixed_income(fd_ppf_amount, user_profile)
        
        return {
            **state,
            "asset_recommendations": asset_recommendations,
            "current_step": "risk_validation"
        }
    
    except Exception as e:
        return {
            **state,
            "errors": state["errors"] + [f"Micro allocation error: {str(e)}"],
            "current_step": "risk_validation"
        }

def select_stocks(amount, stock_data, user_profile):
    """
    Select specific stocks based on scoring algorithm
    """
    if not stock_data:
        return []
    
    risk_score = user_profile["risk_score"]
    
    # Score stocks based on risk profile
    scored_stocks = []
    for stock, data in stock_data.items():
        # Simplified scoring (adapt weights based on risk profile)
        if risk_score <= 0.4:  # Conservative
            score = 0.3 * data["mean_return"] + 0.6 * (1 / (data["volatility"] + 0.001)) + 0.1 * data["current_price"]
        elif risk_score <= 0.7:  # Moderate
            score = 0.5 * data["mean_return"] + 0.4 * (1 / (data["volatility"] + 0.001)) + 0.1 * data["current_price"]
        else:  # Aggressive
            score = 0.7 * data["mean_return"] + 0.2 * (1 / (data["volatility"] + 0.001)) + 0.1 * data["current_price"]
        
        scored_stocks.append({
            "symbol": stock,
            "score": score,
            "price": data["current_price"],
            "expected_return": data["mean_return"],
            "volatility": data["volatility"]
        })
    
    # Sort by score and select top stocks
    scored_stocks.sort(key=lambda x: x["score"], reverse=True)
    
    # Allocate amount across top stocks
    selected_stocks = []
    remaining_amount = amount
    max_stocks = min(5, len(scored_stocks))  # Diversify across max 5 stocks
    
    for i in range(max_stocks):
        if remaining_amount <= 0:
            break
        
        stock = scored_stocks[i]
        # Allocate proportionally based on score (simplified)
        allocation_ratio = stock["score"] / sum([s["score"] for s in scored_stocks[:max_stocks]])
        stock_amount = amount * allocation_ratio
        shares = int(stock_amount / stock["price"])
        
        if shares > 0:
            selected_stocks.append({
                "symbol": stock["symbol"].replace(".NS", ""),
                "shares": shares,
                "amount": shares * stock["price"],
                "price": stock["price"]
            })
            remaining_amount -= shares * stock["price"]
    
    return selected_stocks

def select_mutual_funds(amount, user_profile):
    """
    Select mutual funds based on user profile (simplified)
    """
    risk_score = user_profile["risk_score"]
    
    # Simplified fund selection based on risk profile
    if risk_score <= 0.4:  # Conservative
        funds = [
            {"name": "Large Cap Equity Fund", "allocation": 0.6, "expected_return": 0.12},
            {"name": "Debt Fund", "allocation": 0.4, "expected_return": 0.08}
        ]
    elif risk_score <= 0.7:  # Moderate
        funds = [
            {"name": "Large Cap Equity Fund", "allocation": 0.4, "expected_return": 0.12},
            {"name": "Mid Cap Fund", "allocation": 0.4, "expected_return": 0.15},
            {"name": "Debt Fund", "allocation": 0.2, "expected_return": 0.08}
        ]
    else:  # Aggressive
        funds = [
            {"name": "Small Cap Fund", "allocation": 0.4, "expected_return": 0.18},
            {"name": "Mid Cap Fund", "allocation": 0.4, "expected_return": 0.15},
            {"name": "Large Cap Fund", "allocation": 0.2, "expected_return": 0.12}
        ]
    
    selected_funds = []
    for fund in funds:
        fund_amount = amount * fund["allocation"]
        if fund_amount > 500:  # Minimum investment check
            selected_funds.append({
                "name": fund["name"],
                "amount": fund_amount,
                "expected_return": fund["expected_return"]
            })
    
    return selected_funds

def select_crypto(amount, crypto_data, user_profile):
    """
    Select cryptocurrencies (simplified)
    """
    if not crypto_data or amount < 1000:  # Minimum crypto investment
        return []
    
    risk_score = user_profile["risk_score"]
    
    # Simplified crypto selection
    crypto_allocations = []
    if risk_score > 0.5:  # Only for moderate to high risk
        crypto_allocations = [
            {"name": "Bitcoin", "symbol": "BTC", "allocation": 0.6},
            {"name": "Ethereum", "symbol": "ETH", "allocation": 0.4}
        ]
    
    selected_crypto = []
    for crypto in crypto_allocations:
        crypto_amount = amount * crypto["allocation"]
        selected_crypto.append({
            "name": crypto["name"],
            "symbol": crypto["symbol"],
            "amount": crypto_amount
        })
    
    return selected_crypto

def select_gold_allocation(amount):
    """
    Allocate to gold investments
    """
    return [{
        "type": "Gold ETF",
        "amount": amount,
        "description": "Digital Gold Investment"
    }]

def select_fixed_income(amount, user_profile):
    """
    Allocate to fixed income instruments
    """
    # Split between PPF and FD based on amount and profile
    allocations = []
    
    # PPF allocation (max 1.5L per year)
    ppf_amount = min(amount * 0.6, 150000)
    if ppf_amount > 500:
        allocations.append({
            "type": "PPF",
            "amount": ppf_amount,
            "rate": 0.071,
            "tenure": 15
        })
    
    # FD allocation
    fd_amount = amount - ppf_amount
    if fd_amount > 1000:
        allocations.append({
            "type": "Fixed Deposit",
            "amount": fd_amount,
            "rate": 0.065,
            "tenure": user_profile.get("investment_horizon", 5)
        })
    
    return allocations
```

#### E. Risk Agent (Validation & Constraints)

```python
def risk_agent(state: PortfolioState) -> PortfolioState:
    """
    Validate portfolio against risk constraints
    """
    try:
        macro_allocation = state.get("macro_allocation", {})
        asset_recommendations = state.get("asset_recommendations", {})
        user_profile = state["user_profile"]
        total_assets = state["total_assets"]
        
        risk_assessment = validate_portfolio_risk(
            macro_allocation, 
            asset_recommendations, 
            user_profile, 
            total_assets
        )
        
        if risk_assessment["risk_violations"]:
            # Adjust portfolio if violations found
            adjusted_allocation = adjust_for_risk_violations(
                macro_allocation, 
                risk_assessment["risk_violations"], 
                user_profile
            )
            
            return {
                **state,
                "macro_allocation": adjusted_allocation,
                "risk_assessment": risk_assessment,
                "current_step": "validation_failed"  # Trigger reallocation
            }
        else:
            return {
                **state,
                "risk_assessment": risk_assessment,
                "validated_portfolio": {
                    "macro_allocation": macro_allocation,
                    "asset_recommendations": asset_recommendations
                },
                "current_step": "explanation_generation"
            }
    
    except Exception as e:
        return {
            **state,
            "errors": state["errors"] + [f"Risk validation error: {str(e)}"],
            "current_step": "explanation_generation"
        }

def validate_portfolio_risk(macro_allocation, asset_recommendations, user_profile, total_assets):
    """
    Comprehensive risk validation
    """
    risk_violations = []
    risk_metrics = {}
    
    risk_score = user_profile["risk_score"]
    
    # Check crypto allocation limits
    crypto_allocation = macro_allocation.get("crypto", 0)
    max_crypto_by_risk = {0.4: 0.05, 0.7: 0.15, 1.0: 0.25}
    max_crypto = max_crypto_by_risk.get(min(1.0, max(0.4, risk_score)), 0.05)
    
    if crypto_allocation > max_crypto:
        risk_violations.append(f"Crypto allocation {crypto_allocation:.1%} exceeds recommended {max_crypto:.1%}")
    
    # Check concentration risk
    stock_recommendations = asset_recommendations.get("stocks", [])
    if stock_recommendations:
        max_single_stock = max([stock["amount"] for stock in stock_recommendations]) / total_assets
        if max_single_stock > 0.15:  # No single stock should exceed 15%
            risk_violations.append(f"Single stock concentration {max_single_stock:.1%} exceeds 15% limit")
    
    # Check equity exposure based on risk profile
    equity_allocation = macro_allocation.get("stocks", 0) + macro_allocation.get("mutual_funds", 0) * 0.7  # Assume 70% equity in MF
    max_equity_by_risk = {0.4: 0.4, 0.7: 0.7, 1.0: 0.9}
    max_equity = max_equity_by_risk.get(min(1.0, max(0.4, risk_score)), 0.4)
    
    if equity_allocation > max_equity:
        risk_violations.append(f"Total equity exposure {equity_allocation:.1%} exceeds recommended {max_equity:.1%}")
    
    # Calculate portfolio metrics
    expected_return = calculate_portfolio_expected_return(macro_allocation, asset_recommendations)
    estimated_volatility = estimate_portfolio_volatility(macro_allocation, risk_score)
    
    risk_metrics = {
        "expected_annual_return": expected_return,
        "estimated_volatility": estimated_volatility,
        "sharpe_ratio": (expected_return - 0.06) / estimated_volatility if estimated_volatility > 0 else 0,
        "max_drawdown_estimate": estimated_volatility * 1.5,  # Simplified estimate
        "risk_level": categorize_risk_level(estimated_volatility)
    }
    
    return {
        "risk_violations": risk_violations,
        "risk_metrics": risk_metrics,
        "overall_assessment": "APPROVED" if not risk_violations else "NEEDS_ADJUSTMENT"
    }

def adjust_for_risk_violations(macro_allocation, violations, user_profile):
    """
    Adjust allocation to fix risk violations
    """
    adjusted_allocation = macro_allocation.copy()
    
    # Simple adjustment logic
    for violation in violations:
        if "Crypto allocation" in violation:
            # Reduce crypto, increase FD/PPF
            excess_crypto = adjusted_allocation.get("crypto", 0) - 0.05
            adjusted_allocation["crypto"] = 0.05
            adjusted_allocation["fd_ppf"] = adjusted_allocation.get("fd_ppf", 0) + excess_crypto
        
        if "equity exposure" in violation:
            # Reduce equity exposure
            stocks_reduction = adjusted_allocation.get("stocks", 0) * 0.2
            adjusted_allocation["stocks"] = adjusted_allocation.get("stocks", 0) - stocks_reduction
            adjusted_allocation["fd_ppf"] = adjusted_allocation.get("fd_ppf", 0) + stocks_reduction
    
    # Normalize to ensure sum = 1
    total = sum(adjusted_allocation.values())
    if total > 0:
        for key in adjusted_allocation:
            adjusted_allocation[key] = adjusted_allocation[key] / total
    
    return adjusted_allocation

def calculate_portfolio_expected_return(macro_allocation, asset_recommendations):
    """
    Calculate expected portfolio return
    """
    # Simplified expected returns by asset class
    asset_returns = {
        "stocks": 0.15,
        "mutual_funds": 0.12,
        "crypto": 0.25,
        "gold": 0.08,
        "fd_ppf": 0.07
    }
    
    expected_return = 0
    for asset, weight in macro_allocation.items():
        expected_return += weight * asset_returns.get(asset, 0.06)
    
    return expected_return

def estimate_portfolio_volatility(macro_allocation, risk_score):
    """
    Estimate portfolio volatility
    """
    # Simplified volatility by asset class
    asset_volatilities = {
        "stocks": 0.25,
        "mutual_funds": 0.18,
        "crypto": 0.60,
        "gold": 0.15,
        "fd_ppf": 0.02
    }
    
    # Simplified calculation (ignoring correlations for performance)
    weighted_volatility = 0
    for asset, weight in macro_allocation.items():
        weighted_volatility += (weight ** 2) * (asset_volatilities.get(asset, 0.1) ** 2)
    
    return weighted_volatility ** 0.5

def categorize_risk_level(volatility):
    """
    Categorize risk level based on volatility
    """
    if volatility < 0.1:
        return "Low"
    elif volatility < 0.2:
        return "Moderate"
    else:
        return "High"
```

#### F. Explanation Agent (Human-Readable Advice)

```python
def explanation_agent(state: PortfolioState) -> PortfolioState:
    """
    Generate human-readable explanations and advice
    """
    try:
        macro_allocation = state["macro_allocation"]
        asset_recommendations = state["asset_recommendations"]
        risk_assessment = state.get("risk_assessment", {})
        user_profile = state["user_profile"]
        total_assets = state["total_assets"]
        
        # Generate comprehensive advice
        advice = generate_portfolio_advice(
            macro_allocation, 
            asset_recommendations, 
            risk_assessment, 
            user_profile, 
            total_assets
        )
        
        return {
            **state,
            "final_advice": advice,
            "current_step": "complete"
        }
    
    except Exception as e:
        return {
            **state,
            "errors": state["errors"] + [f"Explanation generation error: {str(e)}"],
            "final_advice": generate_fallback_advice(state),
            "current_step": "complete"
        }

def generate_portfolio_advice(macro_allocation, asset_recommendations, risk_assessment, user_profile, total_assets):
    """
    Generate comprehensive human-readable advice
    """
    risk_score = user_profile["risk_score"]
    risk_level = "Conservative" if risk_score <= 0.4 else "Moderate" if risk_score <= 0.7 else "Aggressive"
    
    # Main allocation summary
    allocation_summary = "Based on your {} risk profile, here's your recommended portfolio allocation:\n\n".format(risk_level)
    
    for asset_class, weight in macro_allocation.items():
        if weight > 0:
            amount = total_assets * weight
            allocation_summary += f"• {asset_class.replace('_', ' ').title()}: {weight:.1%} (₹{amount:,.0f})\n"
    
    # Specific recommendations
    recommendations = "\n\n📊 Specific Investment Recommendations:\n\n"
    
    # Stock recommendations
    if "stocks" in asset_recommendations:
        recommendations += "🏢 **Stocks:**\n"
        for stock in asset_recommendations["stocks"]:
            recommendations += f"  • {stock['symbol']}: {stock['shares']} shares (₹{stock['amount']:,.0f})\n"
        recommendations += "\n"
    
    # Mutual fund recommendations
    if "mutual_funds" in asset_recommendations:
        recommendations += "📈 **Mutual Funds:**\n"
        for fund in asset_recommendations["mutual_funds"]:
            recommendations += f"  • {fund['name']}: ₹{fund['amount']:,.0f}\n"
        recommendations += "\n"
    
    # Crypto recommendations
    if "crypto" in asset_recommendations:
        recommendations += "₿ **Cryptocurrency:**\n"
        for crypto in asset_recommendations["crypto"]:
            recommendations += f"  • {crypto['name']}: ₹{crypto['amount']:,.0f}\n"
        recommendations += "\n"
    
    # Fixed income recommendations
    if "fd_ppf" in asset_recommendations:
        recommendations += "🏦 **Fixed Income:**\n"
        for fi in asset_recommendations["fd_ppf"]:
            recommendations += f"  • {fi['type']}: ₹{fi['amount']:,.0f} at {fi['rate']:.1%} for {fi['tenure']} years\n"
        recommendations += "\n"
    
    # Risk assessment
    risk_info = "\n\n⚠️ **Risk Assessment:**\n\n"
    if "risk_metrics" in risk_assessment:
        metrics = risk_assessment["risk_metrics"]
        risk_info += f"• Expected Annual Return: {metrics.get('expected_annual_return', 0):.1%}\n"
        risk_info += f"• Portfolio Volatility: {metrics.get('estimated_volatility', 0):.1%}\n"
        risk_info += f"• Risk Level: {metrics.get('risk_level', 'Moderate')}\n"
        risk_info += f"• Sharpe Ratio: {metrics.get('sharpe_ratio', 0):.2f}\n"
    
    # Action items
    action_items = "\n\n✅ **Immediate Action Items:**\n\n"
    action_items += "1. Start with highest priority investments (PPF/FD for tax benefits)\n"
    action_items += "2. Set up SIPs for mutual funds to benefit from rupee cost averaging\n"
    action_items += "3. Gradually build stock positions over 2-3 months\n"
    action_items += "4. Review and rebalance portfolio quarterly\n"
    
    if macro_allocation.get("crypto", 0) > 0:
        action_items += "5. Monitor crypto investments closely due to high volatility\n"
    
    # Warnings and considerations
    warnings = "\n\n⚠️ **Important Considerations:**\n\n"
    warnings += "• This is an AI-generated recommendation. Please consult a financial advisor for personalized advice\n"
    warnings += "• Past performance does not guarantee future results\n"
    warnings += "• Consider your financial goals, emergency fund, and insurance before investing\n"
    warnings += "• Rebalance your portfolio periodically to maintain target allocation\n"
    
    if risk_assessment.get("risk_violations"):
        warnings += f"• Risk Alerts: {'; '.join(risk_assessment['risk_violations'])}\n"
    
    return {
        "allocation_summary": allocation_summary,
        "specific_recommendations": recommendations,
        "risk_assessment": risk_info,
        "action_items": action_items,
        "important_considerations": warnings,
        "total_investment": total_assets,
        "risk_profile": risk_level
    }

def generate_fallback_advice(state):
    """
    Generate basic advice when detailed generation fails
    """
    return {
        "allocation_summary": "Portfolio allocation generated with basic parameters.",
        "specific_recommendations": "Please review individual recommendations in the detailed breakdown.",
        "risk_assessment": "Standard risk assessment applied based on your risk profile.",
        "action_items": "1. Review recommendations\n2. Consult financial advisor\n3. Start with conservative investments",
        "important_considerations": "This is a simplified recommendation. Please seek professional advice.",
        "total_investment": state["total_assets"],
        "risk_profile": "Not determined"
    }
```

### 3. LangGraph Workflow Definition

```python
from langgraph import StateGraph, END

def create_portfolio_workflow():
    """
    Define the complete LangGraph workflow
    """
    workflow = StateGraph(PortfolioState)
    
    # Add nodes
    workflow.add_node("orchestrator", orchestrator_agent)
    workflow.add_node("data_collection", data_agent)
    workflow.add_node("macro_allocation", macro_agent)
    workflow.add_node("micro_allocation", micro_agent)
    workflow.add_node("risk_validation", risk_agent)
    workflow.add_node("explanation_generation", explanation_agent)
    
    # Define conditional routing
    def route_next_step(state):
        return state["current_step"]
    
    # Set entry point
    workflow.set_entry_point("orchestrator")
    
    # Define edges
    workflow.add_conditional_edges(
        "orchestrator",
        route_next_step,
        {
            "data_collection": "data_collection",
            "macro_allocation": "macro_allocation",
            "complete": END
        }
    )
    
    workflow.add_conditional_edges(
        "data_collection",
        route_next_step,
        {"macro_allocation": "macro_allocation"}
    )
    
    workflow.add_conditional_edges(
        "macro_allocation",
        route_next_step,
        {"micro_allocation": "micro_allocation"}
    )
    
    workflow.add_conditional_edges(
        "micro_allocation",
        route_next_step,
        {"risk_validation": "risk_validation"}
    )
    
    workflow.add_conditional_edges(
        "risk_validation",
        route_next_step,
        {
            "explanation_generation": "explanation_generation",
            "validation_failed": "orchestrator"  # Loop back for rebalancing
        }
    )
    
    workflow.add_conditional_edges(
        "explanation_generation",
        route_next_step,
        {"complete": END}
    )
    
    return workflow.compile()

# Example usage
def run_portfolio_optimization(user_input):
    """
    Main function to run portfolio optimization
    """
    # Initialize state
    initial_state = PortfolioState(
        user_profile=user_input["user_profile"],
        total_assets=user_input["total_assets"],
        existing_portfolio=user_input.get("existing_portfolio"),
        current_step="start",
        errors=[],
        iteration_count=0
    )
    
    # Create and run workflow
    workflow = create_portfolio_workflow()
    result = workflow.invoke(initial_state)
    
    return result

# Sample input format
sample_input = {
    "user_profile": {
        "risk_score": 0.6,  # 0-1 scale
        "investment_horizon": 5,  # years
        "age": 30,
        "preferences": ["tax_saving", "growth"],
        "constraints": {"max_crypto": 0.15}
    },
    "total_assets": 1000000,  # ₹10 Lakhs
    "existing_portfolio": {}  # Optional
}
```

## Performance Optimizations for 4GB VRAM RTX 3050

### 1. Model Selection
- Use lightweight language models (e.g., Llama-2 7B quantized, Mistral 7B)
- Implement model quantization (4-bit/8-bit) using libraries like `bitsandbytes`
- Use CPU for most computation, GPU only for critical ML tasks

### 2. Data Processing Optimizations
- Limit historical data to 30-90 days for analysis
- Use caching mechanisms for API responses
- Implement batch processing for multiple calculations
- Reduce the number of assets analyzed (top 50 stocks, top 10 crypto)

### 3. Algorithm Optimizations
- Use simplified Markowitz optimization with reduced iterations
- Implement rule-based fallbacks when optimization fails
- Use approximate methods for correlation calculations
- Limit portfolio rebalancing iterations to 3 maximum

### 4. Memory Management
```python
# Example memory optimization techniques
import gc
import torch

def optimize_memory():
    """Clear memory between heavy operations"""
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    gc.collect()

# Use context managers for model loading
from contextlib import contextmanager

@contextmanager
def load_model_temporarily(model_path):
    """Load model only when needed"""
    model = load_model(model_path)
    try:
        yield model
    finally:
        del model
        optimize_memory()
```

## Implementation Timeline (Hackathon Optimized)

### Day 1: Core Infrastructure
- Set up LangGraph workflow structure
- Implement basic agent shells
- Create state management system
- Test workflow connectivity

### Day 2: Data Integration & Basic Logic  
- Implement data collection agents
- Add simplified portfolio optimization
- Create basic asset selection logic
- Test with sample data

### Day 3: Risk Management & UI
- Implement risk validation logic
- Add explanation generation
- Create simple web interface (Streamlit/FastAPI)
- Integration testing and bug fixes

## Deployment Considerations

### Hardware Requirements
- Minimum 16GB RAM for development
- RTX 3050 4GB VRAM (use CPU offloading for larger models)
- SSD storage for faster data access

### Software Stack
```python
# Key dependencies
langgraph>=0.1.0
torch>=2.0.0
scipy>=1.10.0
numpy>=1.24.0
yfinance>=0.2.0
requests>=2.28.0
streamlit>=1.28.0  # For UI
fastapi>=0.100.0   # For API
```

### Environment Setup
```bash
# Create virtual environment
python -m venv portfolio_agent
source portfolio_agent/bin/activate  # Linux/Mac
# or
portfolio_agent\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="your_key_here"  # If using OpenAI
export COINGECKO_API_KEY="your_key"    # For crypto data
```

## Testing Strategy

### Unit Tests
- Test each agent independently
- Mock external API calls
- Validate state transitions
- Test error handling

### Integration Tests  
- Test complete workflow end-to-end
- Validate agent communication
- Test with various risk profiles
- Performance benchmarking

### Edge Case Handling
- API failures and timeouts
- Invalid user inputs
- Market data anomalies
- Memory overflow scenarios

## Agent Tool Configuration

Each agent in the LangGraph workflow is equipped with specific tools to perform its designated functions. Below is the comprehensive breakdown of tools assigned to each agent:

### 1. Orchestrator Agent Tools

**Tool Name: `workflow_router`**
- **Purpose**: Route tasks between agents based on current workflow state
- **Functions**: State management, error handling, iteration control
- **Usage**: Determines next agent in sequence, handles retry logic

**Tool Name: `session_manager`**
- **Purpose**: Maintain user session context and conversation history
- **Functions**: Store user preferences, track portfolio changes over time
- **Usage**: Context preservation across multiple interactions

**Tool Name: `fallback_allocator`**
- **Purpose**: Provide conservative portfolio allocation when optimization fails
- **Functions**: Rule-based allocation, emergency portfolio generation
- **Usage**: Backup allocation when agents encounter errors

### 2. Data Agent Tools

**Tool Name: `market_data_fetcher`**
- **Purpose**: Collect real-time and historical market data
- **Functions**: API calls to NSE/BSE, Yahoo Finance, CoinGecko
- **Usage**: `fetch_stock_data()`, `fetch_crypto_prices()`, `fetch_mf_nav()`

**Tool Name: `data_processor`**
- **Purpose**: Clean, normalize, and structure collected market data
- **Functions**: Calculate returns, volatility, moving averages
- **Usage**: `calculate_returns()`, `normalize_prices()`, `compute_volatility()`

**Tool Name: `cache_manager`**
- **Purpose**: Store and retrieve cached market data for performance
- **Functions**: Redis/local caching, data freshness validation
- **Usage**: `get_cached_data()`, `store_data()`, `is_data_fresh()`

**Tool Name: `api_rate_limiter`**
- **Purpose**: Manage API call rates to prevent quota exhaustion
- **Functions**: Request throttling, retry mechanisms
- **Usage**: `rate_limit_check()`, `queue_request()`, `retry_on_failure()`

**Tool Name: `data_validator`**
- **Purpose**: Validate data quality and completeness
- **Functions**: Check for missing data, outlier detection
- **Usage**: `validate_stock_data()`, `check_completeness()`, `detect_anomalies()`

### 3. Macro Agent Tools

**Tool Name: `markowitz_optimizer`**
- **Purpose**: Perform Modern Portfolio Theory optimization
- **Functions**: Calculate efficient frontier, optimal weights
- **Usage**: `optimize_portfolio()`, `calculate_efficient_frontier()`, `compute_sharpe_ratio()`

**Tool Name: `risk_profiler`**
- **Purpose**: Map user risk score to allocation constraints
- **Functions**: Risk-based asset allocation limits, constraint generation
- **Usage**: `get_risk_bounds()`, `map_risk_to_allocation()`, `generate_constraints()`

**Tool Name: `correlation_calculator`**
- **Purpose**: Calculate asset correlation matrix for diversification
- **Functions**: Covariance matrix computation, correlation analysis
- **Usage**: `compute_correlation_matrix()`, `calculate_covariance()`, `diversification_score()`

**Tool Name: `ppo_agent`** (Optional - for advanced implementation)
- **Purpose**: Reinforcement learning for dynamic allocation adjustment
- **Functions**: Policy optimization, reward calculation
- **Usage**: `update_policy()`, `calculate_reward()`, `adjust_weights()`

**Tool Name: `scenario_analyzer`**
- **Purpose**: Stress testing portfolio under different market conditions
- **Functions**: Monte Carlo simulation, scenario modeling
- **Usage**: `stress_test()`, `monte_carlo_simulation()`, `scenario_analysis()`

### 4. Micro Agent Tools

**Tool Name: `stock_screener`**
- **Purpose**: Screen and rank individual stocks based on criteria
- **Functions**: Fundamental analysis, technical scoring
- **Usage**: `screen_stocks()`, `calculate_stock_score()`, `rank_by_performance()`

**Tool Name: `mutual_fund_analyzer`**
- **Purpose**: Analyze and select mutual funds
- **Functions**: CAGR calculation, expense ratio analysis, category matching
- **Usage**: `analyze_fund_performance()`, `calculate_cagr()`, `compare_expense_ratios()`

**Tool Name: `crypto_selector`**
- **Purpose**: Select and allocate cryptocurrency investments
- **Functions**: Market cap analysis, volatility assessment, trend analysis
- **Usage**: `select_crypto()`, `analyze_trends()`, `assess_market_cap()`

**Tool Name: `commodity_allocator`**
- **Purpose**: Handle gold and commodity investments
- **Functions**: Price trend analysis, allocation optimization
- **Usage**: `allocate_gold()`, `analyze_commodity_trends()`, `optimize_commodity_mix()`

**Tool Name: `fixed_income_optimizer`**
- **Purpose**: Optimize FD and PPF allocations
- **Functions**: Interest rate comparison, tenure optimization
- **Usage**: `compare_fd_rates()`, `optimize_ppf_allocation()`, `calculate_maturity_value()`

**Tool Name: `diversification_engine`**
- **Purpose**: Ensure proper diversification within asset classes
- **Functions**: Concentration risk analysis, diversification scoring
- **Usage**: `check_concentration()`, `calculate_herfindahl_index()`, `ensure_diversification()`

### 5. Risk Agent Tools

**Tool Name: `risk_calculator`**
- **Purpose**: Calculate comprehensive portfolio risk metrics
- **Functions**: VaR calculation, beta computation, drawdown analysis
- **Usage**: `calculate_var()`, `compute_portfolio_beta()`, `analyze_drawdown()`

**Tool Name: `constraint_validator`**
- **Purpose**: Validate portfolio against user-defined constraints
- **Functions**: Allocation limit checking, regulatory compliance
- **Usage**: `validate_allocation_limits()`, `check_regulatory_limits()`, `verify_constraints()`

**Tool Name: `stress_tester`**
- **Purpose**: Perform stress testing under adverse scenarios
- **Functions**: Market crash simulation, interest rate shock testing
- **Usage**: `market_crash_test()`, `interest_rate_shock()`, `liquidity_stress_test()`

**Tool Name: `rebalancer`**
- **Purpose**: Suggest portfolio rebalancing when violations detected
- **Functions**: Weight adjustment, risk mitigation strategies
- **Usage**: `suggest_rebalancing()`, `adjust_for_risk()`, `minimize_violations()`

**Tool Name: `compliance_checker`**
- **Purpose**: Ensure regulatory and investment policy compliance
- **Functions**: Investment limit verification, policy adherence
- **Usage**: `check_investment_limits()`, `verify_policy_compliance()`, `validate_regulations()`

### 6. Explanation Agent Tools

**Tool Name: `natural_language_generator`**
- **Purpose**: Convert technical analysis into human-readable explanations
- **Functions**: Text generation, financial terminology explanation
- **Usage**: `generate_explanation()`, `simplify_technical_terms()`, `create_summary()`

**Tool Name: `visualization_generator`**
- **Purpose**: Create charts and graphs for portfolio presentation
- **Functions**: Pie charts, allocation graphs, performance charts
- **Usage**: `create_allocation_chart()`, `generate_performance_graph()`, `plot_risk_return()`

**Tool Name: `recommendation_engine`**
- **Purpose**: Generate actionable investment recommendations
- **Functions**: Priority-based suggestions, action item generation
- **Usage**: `generate_recommendations()`, `prioritize_actions()`, `create_action_plan()`

**Tool Name: `educational_content_provider`**
- **Purpose**: Provide educational content about investments
- **Functions**: Investment concept explanation, risk education
- **Usage**: `explain_concepts()`, `provide_risk_education()`, `generate_tips()`

**Tool Name: `report_formatter`**
- **Purpose**: Format final output into structured reports
- **Functions**: JSON formatting, PDF generation, dashboard creation
- **Usage**: `format_json_output()`, `create_dashboard()`, `generate_report()`

**Tool Name: `sentiment_analyzer`** (Optional)
- **Purpose**: Analyze market sentiment and incorporate into advice
- **Functions**: News sentiment analysis, market mood assessment
- **Usage**: `analyze_news_sentiment()`, `assess_market_mood()`, `incorporate_sentiment()`

## Tool Integration Example

```python
# Example of how tools are integrated with agents
from langgraph import Agent

class DataAgent(Agent):
    def __init__(self):
        self.tools = [
            MarketDataFetcher(),
            DataProcessor(), 
            CacheManager(),
            ApiRateLimiter(),
            DataValidator()
        ]
    
    def execute(self, state):
        # Use tools in sequence
        raw_data = self.tools[0].fetch_stock_data(symbols=["RELIANCE.NS", "TCS.NS"])
        processed_data = self.tools[1].calculate_returns(raw_data)
        self.tools[2].store_data(processed_data)
        return processed_data

class MacroAgent(Agent):
    def __init__(self):
        self.tools = [
            MarkowitzOptimizer(),
            RiskProfiler(),
            CorrelationCalculator(),
            ScenarioAnalyzer()
        ]
    
    def execute(self, state):
        risk_bounds = self.tools[1].get_risk_bounds(state.user_profile.risk_score)
        correlation_matrix = self.tools[2].compute_correlation_matrix(state.processed_data)
        optimal_weights = self.tools[0].optimize_portfolio(
            data=state.processed_data,
            bounds=risk_bounds,
            correlation_matrix=correlation_matrix
        )
        return optimal_weights
```

## Tool Performance Considerations

### Lightweight Tool Implementation
- **Caching**: All data-fetching tools implement aggressive caching
- **Batch Processing**: Tools process multiple assets simultaneously
- **Async Operations**: Non-blocking API calls for better performance
- **Error Recovery**: Graceful degradation when tools fail

### Memory Optimization
- **Lazy Loading**: Tools load only when needed
- **Memory Cleanup**: Automatic garbage collection after tool execution
- **Resource Pooling**: Shared resources across tool instances
- **Quantized Models**: ML-based tools use quantized models for GPU efficiency

