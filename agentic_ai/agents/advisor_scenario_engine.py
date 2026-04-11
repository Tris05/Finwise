import sys
import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from firebase_admin import credentials, firestore
import firebase_admin

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from data_agent import DataAgent

class AdvisorScenarioEngine:
    def __init__(self):
        self.data_agent = DataAgent()
        self.db = self._init_firebase()
        
    def _init_firebase(self):
        """Initialize Firebase Admin SDK if not already initialized."""
        if not firebase_admin._apps:
            # Try multiple locations for the service account key
            root_dir = Path(__file__).parent.parent.parent.absolute()
            search_paths = [
                Path(__file__).parent.parent / "serviceAccountKey.json",
                root_dir / "serviceAccountKey.json",
                Path.cwd() / "serviceAccountKey.json",
            ]
            
            cred_path = None
            for path in search_paths:
                if path.exists():
                    cred_path = path
                    break
            
            if cred_path:
                cred = credentials.Certificate(str(cred_path))
                firebase_admin.initialize_app(cred)
            else:
                print("Warning: serviceAccountKey.json not found. Scenario engine will use mock data.")
                return None
        return firestore.client()

    def fetch_user_portfolio_detailed(self, user_id):
        """Fetch all individual holdings from the user's portfolio."""
        if not self.db:
            return []
        
        try:
            portfolio_ref = self.db.collection("users").document(user_id).collection("portfolio")
            docs = portfolio_ref.stream()
            
            holdings = []
            for doc in docs:
                data = doc.to_dict()
                # Ensure we have essential fields
                holdings.append({
                    "id": doc.id,
                    "name": data.get("name", "Unknown"),
                    "symbol": data.get("symbol", ""),
                    "category": data.get("category", "").lower(),
                    "quantity": float(data.get("quantity", 0)),
                    "currentPrice": float(data.get("currentPrice", 0)),
                    "investedAmount": float(data.get("investedAmount", 0))
                })
            return holdings
        except Exception as e:
            print(f"Error fetching portfolio: {e}")
            return []

    def get_market_parameters(self, holdings):
        """Get 1-year historical mean returns and volatilities for portfolio symbols."""
        # Collect symbols
        symbols = [h["symbol"] for h in holdings if h["symbol"] and h["category"] in ["equity", "stocks"]]
        
        # Mapping for asset classes
        params = {}
        
        # Fetch stock data (1y window)
        if symbols:
            # We use a dummy user profile for the agent
            dummy_profile = {"constraints": {}}
            # DataAgent.execute doesn't take data_types directly, filter logic is internal
            stock_data_response = self.data_agent.execute(
                user_profile=dummy_profile, 
                period="1y"
            )
            
            stocks = stock_data_response.get("market_data", {}).get("asset_classes", {}).get("stocks", {})
            for sym in symbols:
                if sym in stocks:
                    data = stocks[sym]
                    # DataAgent returns daily daily_mean and standard daily volatility
                    params[sym] = {
                        "annual_return": (1 + data.get("mean_return", 0.0005)) ** 252 - 1,
                        "annual_vol": data.get("volatility", 0.012) * np.sqrt(252)
                    }
        
        # Default parameters for non-stock categories
        defaults = {
            "crypto": {"annual_return": 0.35, "annual_vol": 0.70},
            "mutual fund": {"annual_return": 0.12, "annual_vol": 0.15},
            "gold": {"annual_return": 0.08, "annual_vol": 0.12},
            "commodity": {"annual_return": 0.08, "annual_vol": 0.12},
            "stable": {"annual_return": 0.07, "annual_vol": 0.01},
            "fixed income": {"annual_return": 0.07, "annual_vol": 0.01}
        }
        
        return params, defaults

    def run_monte_carlo(self, holdings, scenario_mod=None, days=365, simulations=1000):
        """
        Run a Monte Carlo simulation on the portfolio.
        scenario_mod: optional modification (e.g., {"type": "add", "category": "crypto", "amount": 10000})
        """
        params, defaults = self.get_market_parameters(holdings)
        
        total_initial_value = 0
        asset_configs = []
        
        # 1. Prepare asset initial values and parameters
        for h in holdings:
            qty = h["quantity"]
            price = h["currentPrice"]
            value = qty * price if qty and price else h["investedAmount"]
            
            if value <= 0: continue
            
            total_initial_value += value
            
            # Identify parameters
            cat = h["category"].lower()
            sym = h["symbol"]
            
            if sym in params:
                mu = params[sym]["annual_return"]
                sigma = params[sym]["annual_vol"]
            else:
                # Use defaults based on category mapping
                matched_cat = "stable"
                for k in defaults.keys():
                    if k in cat:
                        matched_cat = k
                        break
                mu = defaults[matched_cat]["annual_return"]
                sigma = defaults[matched_cat]["annual_vol"]
                
            asset_configs.append({"value": value, "mu": mu, "sigma": sigma, "name": h["name"]})
            
        # 2. Add scenario modification if present
        if scenario_mod:
            mod_type = scenario_mod.get("type")
            if mod_type == "add":
                val = scenario_mod.get("amount", 0)
                cat = scenario_mod.get("category", "equity").lower()
                
                matched_cat = "stable"
                for k in defaults.keys():
                    if k in cat:
                        matched_cat = k
                        break
                mu = defaults[matched_cat]["annual_return"]
                sigma = defaults[matched_cat]["annual_vol"]
                
                asset_configs.append({"value": val, "mu": mu, "sigma": sigma, "name": f"New {cat.capitalize()} Investment"})
                total_initial_value += val

        if not asset_configs:
            return {"error": "Portfolio is empty"}

        # 3. Simulate
        dt = 1/252 # daily step
        num_steps = int(days * (252/365))
        
        # Results matrix [simulations]
        final_values = np.zeros(simulations)
        
        for sim in range(simulations):
            portfolio_final = 0
            for asset in asset_configs:
                # Geometric Brownian Motion for each asset
                # S_T = S_0 * exp((mu - 0.5*sigma^2)T + sigma * sqrt(T) * Z)
                z = np.random.standard_normal()
                # T in years = days/365
                T = days / 365
                drift = (asset["mu"] - 0.5 * asset["sigma"]**2) * T
                diffusion = asset["sigma"] * np.sqrt(T) * z
                
                asset_final = asset["value"] * np.exp(drift + diffusion)
                portfolio_final += asset_final
            final_values[sim] = portfolio_final
            
        # 4. Aggregate Results
        mean_final = np.mean(final_values)
        median_final = np.median(final_values)
        p5 = np.percentile(final_values, 5)
        p95 = np.percentile(final_values, 95)
        
        expected_gain_pct = (mean_final / total_initial_value - 1) * 100
        worst_case_pct = (p5 / total_initial_value - 1) * 100
        best_case_pct = (p95 / total_initial_value - 1) * 100
        
        return {
            "initial_value": total_initial_value,
            "simulated_days": days,
            "expected_final_value": mean_final,
            "median_final_value": median_final,
            "p5_value": p5,
            "p95_value": p95,
            "expected_gain_pct": expected_gain_pct,
            "worst_case_drawdown_pct": worst_case_pct,
            "optimistic_upside_pct": best_case_pct,
            "confidence": "95% (based on 1-year historical volatility)",
            "sample_size": simulations
        }

    def execute_scenario(self, user_id, prompt_intent):
        """
        Main entry point for AI Advisor.
        prompt_intent: result of Gemini's intent parsing (JSON)
        """
        holdings = self.fetch_user_portfolio_detailed(user_id)
        if not holdings:
            return {"error": "No portfolio found for this user. Please add investments first."}
            
        scenario_type = prompt_intent.get("scenario_type", "base")
        mod = prompt_intent.get("modification") # e.g. {"type": "add", "category": "crypto", "amount": 10000}
        
        # Adjust simulations based on urgency/complexity
        days = prompt_intent.get("horizon_days", 365)
        
        result = self.run_monte_carlo(holdings, scenario_mod=mod, days=days)
        
        # Enhance result with data-driven context
        result["market_context"] = "Calculated using 1-year historical prices for equity holdings and standard benchmarks for other assets."
        result["scenario_type"] = scenario_type
        
        return result

if __name__ == "__main__":
    # Test execution if run directly
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
        engine = AdvisorScenarioEngine()
        # Mock what-if intent
        mock_intent = {"scenario_type": "what-if", "modification": {"type": "add", "category": "crypto", "amount": 50000}}
        print(json.dumps(engine.execute_scenario(user_id, mock_intent), indent=2))
