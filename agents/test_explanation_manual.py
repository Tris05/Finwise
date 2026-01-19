
import logging
from datetime import datetime
from agents.explanation_agent import ExplanationAgent

# Configure basic logging
logging.basicConfig(level=logging.INFO)

def test_explanation_generation():
    print("Initializing ExplanationAgent...")
    # Initialize without API key to test fallback mode
    agent = ExplanationAgent()
    
    # Create mock input data matching the latest successful test run
    mock_data = {
        "macro_allocation": {
            "stocks": 0.0,
            "mutual_funds": 0.142,
            "crypto": 0.0,
            "commodities": 0.0,
            "fd": 0.312,
            "ppf": 0.546
        },
        "asset_recommendations": {
            "stocks": [],
            "mutual_funds": [{"name": "Flexi Cap", "amount": 142000}],
            "crypto": [],
            "commodities": [],
            "fd": [{"name": "FD 1", "amount": 312000}],
            "ppf": [{"name": "PPF", "amount": 546000}]
        },
        "market_data": {
            "market_summary": {
                "market_sentiment": "Neutral",
                "volatility_level": "Moderate",
                "total_assets_analyzed": "Multiple"
            }
        },
        "risk_agent_output": {
            "risk_assessment": {
                "risk_metrics": {
                    "expected_annual_return": 0.077,
                    "estimated_volatility": 0.0,
                    "sharpe_ratio": 0.60,
                    "overall_risk_level": "Low"
                },
                "risk_violations": [
                    "PPF allocation exceeds annual limit"
                ],
                "stress_test_results": {}
            }
        },
        "user_profile": {
            "risk_score": 0.6,
            "investment_horizon": 5,
            "age": 30,
            "preferences": []
        },
        "total_assets": 1000000.0
    }

    print("\nExecuting explanation generation...")
    try:
        # Call the execute method
        result = agent.execute(
            data_agent_output=mock_data["market_data"],
            macro_agent_output={"allocation": mock_data["macro_allocation"]},
            micro_agent_output={"asset_recommendations": mock_data["asset_recommendations"]},
            risk_agent_output=mock_data["risk_agent_output"],
            user_profile=mock_data["user_profile"],
            total_assets=mock_data["total_assets"]
        )
        
        print("\n[OK] Execution completed.")
        print(f"Success: {result.get('success', False)}")
        
        explanations = result.get('explanations', {})
        if explanations:
            print(f"Generated components: {list(explanations.keys())}")
            
            if "portfolio_summary" in explanations:
                print("\nSAMPLE OUTPUT (Portfolio Summary):")
                print("-" * 50)
                summary_content = explanations["portfolio_summary"].get("content", {})
                if isinstance(summary_content, dict):
                     # Fallback/Structured format
                     print(summary_content.get("raw_content", str(summary_content)))
                else:
                     print(summary_content)
                print("-" * 50)
        else:
            print("Generated components: [] (Expected in fallback mode if execute() returns empty dict on failure)")
            
            # Print the raw result to inspect what IS returned
            print(f"\nFull Result keys: {list(result.keys())}")
            if "error" in result:
                print(f"Error in result: {result['error']}")
            
        if "visualizations" in result:
            print(f"\nVisualizations generated: {list(result['visualizations'].get('visualizations', {}).keys())}")
            
    except Exception as e:
        print(f"\n[FAIL] Execution failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_explanation_generation()
