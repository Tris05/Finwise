import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "agents"))

from macro_agent import MacroAgent

agent = MacroAgent()

# Test Case 2: Bullish and Low Volatility
print("\n--- Test Case 2: Bullish & Low Volatility ---")
mock_state_bullish = {
    "user_profile": {
        "risk_score": 0.7, 
        "investment_horizon": 10, 
        "constraints": {} 
    },
    "processed_data": {
        "asset_classes": {
            "stocks": {"REL": {"mean_return": 0.0005, "volatility": 0.015}}, 
            "crypto": {"BTC": {"mean_return": 0.002, "volatility": 0.04}},
            "gold": {"GOLD": {"mean_return": 0.0001, "volatility": 0.005}}
        },
        "market_summary": {
            "volatility_level": "low",
            "trend": "bullish"
        }
    }
}

result = agent.execute(mock_state_bullish)
print("Allocation:", result["macro_allocation"])
print("Strategy:", result["strategy_metadata"]["strategy_used"])
