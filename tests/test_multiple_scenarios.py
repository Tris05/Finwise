import sys
import os
from pathlib import Path
import json
import time

# Add agents directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "agents"))

from orchestration_agent import OrchestrationAgent

def get_scenarios():
    return [
        {
            "name": "Conservative_Low_Income",
            "user_profile": {
                "risk_score": 0.2,
                "investment_horizon": 3,
                "age": 55,
                "annual_income": 600000,
                "preferences": ["capital_protection", "liquidity"],
                "constraints": {"max_crypto": 0.0, "max_single_stock": 0.05, "min_fixed_income": 0.70}
            },
            "financial_details": {"total_assets": 500000, "monthly_surplus": 10000, "emergency_fund": 200000}
        },
        {
            "name": "Aggressive_High_Income",
            "user_profile": {
                "risk_score": 0.8,
                "investment_horizon": 15,
                "age": 28,
                "annual_income": 3600000,
                "preferences": ["growth", "high_risk"],
                "constraints": {"max_crypto": 0.20, "max_single_stock": 0.15, "min_fixed_income": 0.05}
            },
            "financial_details": {"total_assets": 2000000, "monthly_surplus": 150000, "emergency_fund": 500000}
        },
        {
            "name": "Moderate_Mid_Income",
            "user_profile": {
                "risk_score": 0.5,
                "investment_horizon": 7,
                "age": 35,
                "annual_income": 1800000,
                "preferences": ["balanced", "tax_saving"],
                "constraints": {"max_crypto": 0.05, "max_single_stock": 0.10, "min_fixed_income": 0.30}
            },
            "financial_details": {"total_assets": 1200000, "monthly_surplus": 60000, "emergency_fund": 400000}
        },
        {
            "name": "Very_Aggressive_Young",
            "user_profile": {
                "risk_score": 0.95,
                "investment_horizon": 25,
                "age": 22,
                "annual_income": 1200000,
                "preferences": ["wealth_creation", "crypto_focus"],
                "constraints": {"max_crypto": 0.30, "max_single_stock": 0.20, "min_fixed_income": 0.0}
            },
            "financial_details": {"total_assets": 300000, "monthly_surplus": 40000, "emergency_fund": 100000}
        },
        {
            "name": "Ultra_Conservative_Retiree",
            "user_profile": {
                "risk_score": 0.1,
                "investment_horizon": 5,
                "age": 65,
                "annual_income": 0,
                "preferences": ["regular_income", "safety"],
                "constraints": {"max_crypto": 0.0, "max_single_stock": 0.0, "min_fixed_income": 0.90}
            },
            "financial_details": {"total_assets": 5000000, "monthly_surplus": 0, "emergency_fund": 1000000}
        }
    ]

def run_multi_scenario():
    orchestrator = OrchestrationAgent()
    scenarios = get_scenarios()
    all_results = {}

    print(f"Starting Multi-Scenario Validation ({len(scenarios)} profiles)...")
    
    for i, scenario in enumerate(scenarios, 1):
        name = scenario["name"]
        print(f"\n[{i}/{len(scenarios)}] Running Scenario: {name}")
        print(f"    Risk: {scenario['user_profile']['risk_score']} | Age: {scenario['user_profile']['age']}")
        
        try:
            start_time = time.time()
            result = orchestrator.execute_portfolio_optimization(scenario)
            duration = time.time() - start_time
            
            portfolio = result.get("portfolio_recommendation", {})
            macro = portfolio.get("macro_allocation", {})
            risk_metrics = portfolio.get("risk_assessment", {}).get("risk_metrics", {})
            
            # Simplified Analysis
            analysis = {
                "duration": f"{duration:.2f}s",
                "risk_level": risk_metrics.get("risk_level", "N/A"),
                "expected_return": f"{risk_metrics.get('expected_annual_return', 0)*100:.2f}%",
                "macro_allocation": {k: f"{v*100:.1f}%" if isinstance(v, float) else (f"{v.get('percentage',0)*100:.1f}%" if isinstance(v, dict) else str(v)) for k, v in macro.items()}
            }
            
            all_results[name] = analysis
            print(f"    [OK] Duration: {duration:.2f}s | Level: {analysis['risk_level']}")
            
        except Exception as e:
            print(f"    [FAIL] Error: {str(e)}")
            all_results[name] = {"error": str(e)}

    # Save summary
    with open("multi_scenario_results.json", "w") as f:
        json.dump(all_results, f, indent=2)
    
    print("\n" + "="*50)
    print("RESUlTS SUMMARY")
    print("="*50)
    for name, data in all_results.items():
        if "error" in data:
            print(f"{name:<25}: FAILED - {data['error']}")
        else:
            print(f"{name:<25}: Return: {data['expected_return']:>7} | {data['risk_level']}")
    
    print("\nFull results saved to multi_scenario_results.json")

if __name__ == "__main__":
    run_multi_scenario()
