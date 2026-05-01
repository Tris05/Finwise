import sys
import os
import json
import unittest
from pathlib import Path

# Add directories to sys.path
current_dir = Path(__file__).parent.absolute()
root_dir = current_dir.parent.parent
sys.path.append(str(current_dir.parent / "agents"))

from data_agent import DataAgent
from advisor_scenario_engine import AdvisorScenarioEngine

class TestAdvisorScenarios(unittest.TestCase):
    def setUp(self):
        self.data_agent = DataAgent()
        self.engine = AdvisorScenarioEngine()
        
    def test_data_agent_period(self):
        """Verify that DataAgent can fetch data for different periods."""
        print("\nTesting DataAgent with 1-month period...")
        res_1m = self.data_agent.execute({"constraints": {}}, period="1mo")
        self.assertTrue(res_1m.get("processed_data") is not None)
        
        print("Testing DataAgent with 1-year period...")
        res_1y = self.data_agent.execute({"constraints": {}}, period="1y")
        self.assertTrue(res_1y.get("processed_data") is not None)
        
        # Verify specific stock data exists in both
        self.assertIn("stocks", res_1m["processed_data"]["asset_classes"])
        self.assertIn("stocks", res_1y["processed_data"]["asset_classes"])
        print("[OK] DataAgent supports configurable periods.")

    def test_scenario_calculation(self):
        """Verify that Monte Carlo results are reasonable."""
        print("\nTesting Monte Carlo simulation logic...")
        mock_holdings = [
            {"name": "Reliance", "symbol": "RELIANCE.NS", "category": "equity", "quantity": 10, "currentPrice": 2500, "investedAmount": 20000},
            {"name": "Bitcoin", "symbol": "bitcoin", "category": "crypto", "quantity": 0.05, "currentPrice": 4000000, "investedAmount": 100000}
        ]
        
        # Base case
        res_base = self.engine.run_monte_carlo(mock_holdings, days=365)
        self.assertIn("expected_gain_pct", res_base)
        print(f"Base Case Expected Gain: {res_base['expected_gain_pct']:.2f}%")
        
        # Addition case
        mod = {"type": "add", "category": "crypto", "amount": 1000000} # Huge addition to see impact
        res_add = self.engine.run_monte_carlo(mock_holdings, scenario_mod=mod, days=365)
        print(f"Addition Case Expected Gain: {res_add['expected_gain_pct']:.2f}%")
        
        self.assertGreater(res_add['initial_value'], res_base['initial_value'])
        print("[OK] Scenario engine calculates modifications correctly.")

if __name__ == "__main__":
    unittest.main()
