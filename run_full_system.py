import sys
import os
import json
from pathlib import Path

# Add agents directory to sys.path
root_dir = Path(__file__).parent.absolute()
agents_dir = root_dir / "agents"
sys.path.insert(0, str(agents_dir))

# Import the OrchestrationAgent
try:
    from orchestration_agent import OrchestrationAgent
except ImportError as e:
    print(f"Error importing OrchestrationAgent: {e}")
    sys.exit(1)

def run_flow():
    # Sample input from orchestration_agent.py
    sample_input = {
        "user_profile": {
            "risk_score": 0.6,
            "investment_horizon": 5,
            "age": 30,
            "annual_income": 1200000,
            "preferences": ["tax_saving", "growth"],
            "constraints": {
                "max_crypto": 0.15,
                "max_single_stock": 0.10,
                "min_fixed_income": 0.20,
                "exclude_sectors": [],
                "preferred_stocks": ["RELIANCE.NS", "TCS.NS"],
                "investment_style": "moderate"
            }
        },
        "financial_details": {
            "total_assets": 1000000,
            "monthly_surplus": 50000,
            "emergency_fund": 300000,
            "existing_investments": {},
            "debts": {}
        },
        "goals": [
            {
                "name": "Retirement Planning",
                "target_amount": 10000000,
                "time_horizon": 30,
                "priority": "high"
            }
        ],
        "market_preferences": {
            "preferred_exchanges": ["NSE", "BSE"],
            "currency": "INR",
            "update_frequency": "monthly",
            "rebalancing_threshold": 0.05
        }
    }

    print("--- Initializing Orchestration Agent ---")
    orchestrator = OrchestrationAgent(max_iterations=2)
    
    print("\n--- Executing Portfolio Optimization Workflow ---")
    try:
        result = orchestrator.execute_portfolio_optimization(sample_input)
        print("\n--- Final Portfolio Recommendation ---")
        print(json.dumps(result, indent=2, default=str))
        
        # Save output to a file for verification
        with open("full_flow_output.json", "w") as f:
            json.dump(result, f, indent=2, default=str)
        print("\n[SUCCESS] Output saved to full_flow_output.json")
        
    except Exception as e:
        print(f"\n[ERROR] Flow execution failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_flow()
