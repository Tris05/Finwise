"""
Macro Agent Implementation for Agentic Portfolio Management System
Handles high-level asset class allocation using Markowitz Optimization and PPO Reinforcement Learning
"""

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from typing import Dict, List, Optional, Any, Tuple
import logging
from dataclasses import dataclass
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MacroAllocationResponse:
    """Standard response format for macro allocation"""
    allocation: Dict[str, float]
    strategy_used: str
    confidence_score: float
    timestamp: datetime
    success: bool
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class MarkowitzOptimizer:
    """
    Implements Modern Portfolio Theory (Markowitz) optimization
    """
    
    def __init__(self):
        self.risk_free_rate = 0.065  # Default approx risk-free rate (e.g., 10y bond/FD)

    def optimize(self, expected_returns: np.ndarray, cov_matrix: np.ndarray, 
                 risk_aversion: float, asset_names: List[str], constraints: Dict[str, Any] = None) -> np.ndarray:
        """
        Perform Mean-Variance Optimization
        
        Args:
            expected_returns: Array of expected returns for each asset class
            cov_matrix: Covariance matrix of asset returns
            risk_aversion: User's risk aversion parameter (lambda)
            asset_names: List of asset class names corresponding to the arrays
            constraints: Dictionary of constraints (e.g., {'max_crypto': 0.1})
            
        Returns:
            Optimal weights array
        """
        num_assets = len(expected_returns)
        
        # Initial guess (equal allocation)
        initial_weights = np.array([1.0 / num_assets] * num_assets)
        
        # Define constraints
        # 1. Sum of weights = 1
        constraints_list = [{'type': 'eq', 'fun': lambda x: np.sum(x) - 1}]
        
        # 2. Bounds (0 <= w <= 1) - Default
        # We update these based on user constraints
        bounds = []
        
        for i, asset in enumerate(asset_names):
            # Default bounds
            min_w = 0.0
            max_w = 1.0
            
            if constraints:
                # Check for specific max constraints (e.g., "max_crypto")
                if f"max_{asset}" in constraints:
                    max_w = min(max_w, float(constraints[f"max_{asset}"]))
                
                # Min constraint
                if f"min_{asset}" in constraints:
                    min_w = max(min_w, float(constraints[f"min_{asset}"]))
            
            bounds.append((min_w, max_w))
            
        # Check if all expected returns are negative or very low
        # If so, we might want to switch to Minimum Variance Portfolio (minimize risk only)
        # instead of maximizing Sharpe, which can behave erratically with negative returns.
        all_negative_returns = np.all(expected_returns < self.risk_free_rate)
        
        def objective_function(weights):
            portfolio_return = np.sum(expected_returns * weights)
            portfolio_variance = np.dot(weights.T, np.dot(cov_matrix, weights))
            portfolio_volatility = np.sqrt(portfolio_variance)
            
            if all_negative_returns:
                # Minimum Variance Objective
                # Minimize Variance directly
                return portfolio_variance * 1000 # Scale up for solver
            else:
                # Maximize Sharpe Ratio
                # (Rp - Rf) / Sigma_p
                sharpe_ratio = (portfolio_return - self.risk_free_rate) / (portfolio_volatility + 1e-6)
                return -sharpe_ratio # Minimize negative Sharpe

        result = minimize(
            objective_function,
            initial_weights,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints_list,
            options={'ftol': 1e-9, 'disp': False}
        )
        
        if not result.success:
            logger.warning(f"Optimization failed: {result.message}. Using equal weights.")
            return initial_weights
            
        return result.x

class PPORefinementAgent:
    """
    Simulates a PPO (Proximal Policy Optimization) RL agent for dynamic rebalancing.
    
    In a production environment, this would load a trained PyTorch/TensorFlow model.
    For this implementation, we provide the structure and a heuristic-based 'forward pass'
    to demonstrate compatibility with the architecture.
    """
    
    def __init__(self, model_path: str = None):
        self.model_path = model_path
        self.is_loaded = False
        if model_path:
            self.load_model(model_path)
            
    def load_model(self, path: str):
        """Load pre-trained PPO model"""
        # Placeholder for model loading logic
        # self.model = torch.load(path)
        self.is_loaded = True
        logger.info(f"PPO Model loaded from {path}")

    def predict_adjustment(self, state: Dict[str, Any], baseline_weights: Dict[str, float]) -> Dict[str, float]:
        """
        Predict weight adjustments (Delta w) based on current state.
        
        Args:
            state: Current market and user state
            baseline_weights: Weights from Markowitz optimization
            
        Returns:
            Dictionary of weight adjustments (e.g., {'stocks': 0.05, 'bonds': -0.05})
        """
        if not self.is_loaded:
            return self._heuristic_adjustment(state, baseline_weights)
            
        # Real model inference would go here
        # observation = self._preprocess_state(state)
        # action = self.model.predict(observation)
        # return self._postprocess_action(action)
        return {}

    def _heuristic_adjustment(self, state: Dict[str, Any], baseline_weights: Dict[str, float]) -> Dict[str, float]:
        """
        Fallback heuristic logic when no RL model is present.
        Simulates 'smart' adjustments based on market regime.
        """
        adjustments = {k: 0.0 for k in baseline_weights.keys()}
        
        market_summary = state.get('processed_data', {}).get('market_summary', {})
        # If market summary is missing, try to infer from raw data or default
        if not market_summary:
             market_summary = {"volatility_level": "moderate", "trend": "neutral"}

        volatility_level = market_summary.get('volatility_level', 'moderate')
        market_trend = market_summary.get('trend', 'neutral') # bullish, bearish, neutral
        
        logger.info(f"PPO Heuristic Input: Volatility={volatility_level}, Trend={market_trend}")

        # --- Rule 1: Volatility Scaling ---
        # High volatility -> Reduce Risk Assets (Stocks, Crypto) -> Increase Safe Assets (FD, Gold)
        if volatility_level == 'high':
            if 'stocks' in adjustments:
                adjustments['stocks'] -= 0.05
            if 'crypto' in adjustments:
                adjustments['crypto'] -= 0.05
            if 'fd' in adjustments:
                adjustments['fd'] += 0.07
            if 'commodities' in adjustments:
                adjustments['commodities'] += 0.03
            logger.info("PPO Heuristic: High volatility. Reducing risk exposure.")

        elif volatility_level == 'low':
            # Low volatility -> Slight leverage into risk
            if 'stocks' in adjustments:
                adjustments['stocks'] += 0.03
            if 'fd' in adjustments:
                adjustments['fd'] -= 0.03
            logger.info("PPO Heuristic: Low volatility. Increasing equity exposure.")

        # --- Rule 2: Trend Following ---
        # Bullish -> Increase Momentum Assets (Stocks, Crypto)
        # Bearish -> Increase Defensive Assets (Gold, FD)
        if market_trend == 'bullish':
            if 'stocks' in adjustments:
                adjustments['stocks'] += 0.05
            if 'crypto' in adjustments:
                adjustments['crypto'] += 0.02
            if 'fd' in adjustments:
                adjustments['fd'] -= 0.05
            if 'commodities' in adjustments:
                adjustments['commodities'] -= 0.02
            logger.info("PPO Heuristic: Bullish trend. Increasing momentum assets.")
            
        elif market_trend == 'bearish':
            if 'stocks' in adjustments:
                adjustments['stocks'] -= 0.05
            if 'crypto' in adjustments:
                adjustments['crypto'] -= 0.05 # Crypto suffers in bear markets
            if 'commodities' in adjustments:
                adjustments['commodities'] += 0.05 # Flight to safety
            if 'fd' in adjustments:
                adjustments['fd'] += 0.05
            logger.info("PPO Heuristic: Bearish trend. Defensive shift.")

        # --- Rule 3: Inflation/Uncertainty (Commodities Proxy) ---
        # If Commodities volatility is high but return is positive, it might be an uncertainty spike
        # We check this via a simple proxy or if explicitly passed
        inflation_signal = market_summary.get('inflation_signal', 'normal')
        if inflation_signal == 'high':
             if 'commodities' in adjustments:
                adjustments['commodities'] += 0.05
             if 'stocks' in adjustments:
                adjustments['stocks'] -= 0.02
             if 'fd' in adjustments:
                adjustments['fd'] -= 0.03 # Real rates might be negative
             logger.info("PPO Heuristic: High inflation signal. Increasing Commodities.")

        return adjustments

class MacroAgent:
    """
    Main Macro Agent class coordinating the allocation strategy.
    """
    
    def __init__(self):
        self.optimizer = MarkowitzOptimizer()
        self.rl_agent = PPORefinementAgent() # Can pass model path here
        self.asset_classes = ["stocks", "mutual_funds", "crypto", "commodities", "fd", "ppf"]
        
    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute macro allocation logic.
        
        Args:
            state: PortfolioState containing user_profile and processed_data
            
        Returns:
            Updated state with macro_allocation
        """
        try:
            logger.info("Starting Macro Allocation...")
            
            user_profile = state.get("user_profile", {})
            processed_data = state.get("processed_data", {})
            
            # 1. Prepare Data for Optimization
            expected_returns, cov_matrix, asset_mapping = self._prepare_optimization_inputs(processed_data)
            
            if expected_returns is None:
                # Fallback if data is missing
                logger.warning("Insufficient data for optimization. Using rule-based fallback.")
                allocation = self._rule_based_fallback(user_profile.get("risk_score", 0.5))
                strategy = "rule_based_fallback"
            else:
            # 2. Run Markowitz Optimization (Baseline)
                risk_score = user_profile.get("risk_score", 0.5)
                constraints = user_profile.get("constraints", {})
                investment_horizon = user_profile.get("investment_horizon", 10)
                
                # Enforce Investment Horizon Limits
                # If horizon is short, force max_allocation for risky assets to 0 or low
                if investment_horizon < 3:
                    # Short term: No Crypto, Low Stocks
                    constraints["max_crypto"] = 0.0
                    constraints["max_stocks"] = 0.2
                    logger.info("Short investment horizon detected (<3 years). Restricting risky assets.")
                elif investment_horizon < 5:
                    # Medium term: Low Crypto
                    constraints["max_crypto"] = 0.05
                    
                optimal_weights = self.optimizer.optimize(
                    expected_returns, 
                    cov_matrix, 
                    risk_aversion=risk_score,
                    asset_names=asset_mapping,
                    constraints=constraints
                )
                
                # Map array back to dictionary
                allocation = {
                    asset_mapping[i]: float(optimal_weights[i]) 
                    for i in range(len(asset_mapping))
                }
                strategy = "markowitz_baseline"
                
                # 3. Apply PPO Refinement (RL Adjustment)
                # The RL agent observes the state and the baseline, and suggests deltas
                adjustments = self.rl_agent.predict_adjustment(state, allocation)
                
                # Apply adjustments and re-normalize
                for asset, delta in adjustments.items():
                    if asset in allocation:
                        allocation[asset] += delta
                
                # Ensure constraints (0 <= w <= 1) and Sum = 1
                allocation = self._normalize_allocation(allocation)
                if adjustments:
                    strategy = "markowitz_ppo_hybrid"

            logger.info(f"Macro Allocation Complete. Strategy: {strategy}")
            logger.info(f"Allocation: {allocation}")

            return {
                **state,
                "macro_allocation": allocation,
                "strategy_metadata": {
                    "strategy_used": strategy,
                    "timestamp": datetime.now().isoformat()
                },
                "current_step": "micro_allocation"
            }

        except Exception as e:
            logger.error(f"Error in Macro Agent: {str(e)}")
            return {
                **state,
                "error": str(e),
                "macro_allocation": self._rule_based_fallback(0.5) # Safe fallback
            }

    def _prepare_optimization_inputs(self, processed_data: Dict[str, Any]) -> Tuple[Optional[np.ndarray], Optional[np.ndarray], List[str]]:
        """
        Extract E[R] and Covariance Matrix from processed data.
        """
        asset_classes_data = processed_data.get("asset_classes", {})
        if not asset_classes_data:
            return None, None, []

        # We need to aggregate data per asset class to get a single E[R] and Volatility for the class
        # For simplicity in this hackathon version, we will use representative indices or averages
        
        means = []
        volatilities = []
        mapping = []
        
        # Define default assumptions if data is missing (Annualized)
        defaults = {
            "stocks": {"return": 0.12, "vol": 0.18},
            "mutual_funds": {"return": 0.10, "vol": 0.12},
            "crypto": {"return": 0.40, "vol": 0.60},
            "commodities": {"return": 0.08, "vol": 0.15},
            "fd": {"return": 0.07, "vol": 0.01},
            "ppf": {"return": 0.071, "vol": 0.005}
        }

        for asset_class in self.asset_classes:
            mapping.append(asset_class)
            
            # Special handling for FD and PPF which are inside 'fixed_income'
            if asset_class == 'fd':
                class_data = asset_classes_data.get('fixed_income', {}).get('representative_fd', {})
                # Wrap in dict to match generic logic if it's a single item
                if class_data: class_data = {'fd': class_data}
            elif asset_class == 'ppf':
                class_data = asset_classes_data.get('fixed_income', {}).get('ppf', {})
                if class_data: class_data = {'ppf': class_data}
            else:
                class_data = asset_classes_data.get(asset_class, {})
            
            # If we have individual assets, average them
            if isinstance(class_data, dict) and class_data:
                # Extract returns and vols from items
                # Note: Data Agent structure for stocks: {'RELIANCE.NS': {'mean_return': ..., 'volatility': ...}}
                r_list = []
                v_list = []
                for item in class_data.values():
                    if isinstance(item, dict):
                        # Data Agent returns daily mean return. Annualize it.
                        # (1 + r)^252 - 1
                        daily_r = item.get("mean_return", 0)
                        daily_v = item.get("volatility", 0)
                        
                        ann_r = (1 + daily_r) ** 252 - 1
                        ann_v = daily_v * np.sqrt(252)
                        
                        r_list.append(ann_r)
                        v_list.append(ann_v)
                
                if r_list:
                    means.append(np.mean(r_list))
                    volatilities.append(np.mean(v_list))
                else:
                    # Use default
                    means.append(defaults[asset_class]["return"])
                    volatilities.append(defaults[asset_class]["vol"])
            else:
                 # Use default
                means.append(defaults[asset_class]["return"])
                volatilities.append(defaults[asset_class]["vol"])

        expected_returns = np.array(means)
        
        # Construct Covariance Matrix
        # Since we don't have full historical series for correlation here, 
        # we will build a synthetic covariance matrix using volatilities and a correlation matrix assumption.
        
        # Assumed Correlation Matrix (Simplified)
        # Stocks, MF, Crypto, Commodities, FD
        corr_matrix = np.array([
            [1.0, 0.8, 0.3, 0.1, 0.0, 0.0], # Stocks
            [0.8, 1.0, 0.2, 0.1, 0.0, 0.0], # MF
            [0.3, 0.2, 1.0, 0.1, 0.0, 0.0], # Crypto
            [0.1, 0.1, 0.1, 1.0, 0.1, 0.1], # Commodities
            [0.0, 0.0, 0.0, 0.1, 1.0, 0.5], # FD
            [0.0, 0.0, 0.0, 0.1, 0.5, 1.0]  # PPF
        ])
        
        # Cov_ij = Corr_ij * Vol_i * Vol_j
        cov_matrix = np.zeros((len(means), len(means)))
        for i in range(len(means)):
            for j in range(len(means)):
                cov_matrix[i][j] = corr_matrix[i][j] * volatilities[i] * volatilities[j]
                
        return expected_returns, cov_matrix, mapping

    def _normalize_allocation(self, allocation: Dict[str, float]) -> Dict[str, float]:
        """Ensure weights sum to 1 and are non-negative"""
        # Clip negative values
        for k, v in allocation.items():
            allocation[k] = max(0.0, v)
            
        # Normalize sum
        total = sum(allocation.values())
        if total > 0:
            for k in allocation:
                allocation[k] /= total
        else:
            # Fallback to equal weights if all zero
            n = len(allocation)
            for k in allocation:
                allocation[k] = 1.0 / n
                
        return allocation

    def _rule_based_fallback(self, risk_score: float) -> Dict[str, float]:
        """Simple rule-based allocation for fallback"""
        if risk_score <= 0.3: # Conservative
            return {"stocks": 0.1, "mutual_funds": 0.2, "crypto": 0.0, "commodities": 0.2, "fd": 0.3, "ppf": 0.2}
        elif risk_score <= 0.7: # Moderate
            return {"stocks": 0.3, "mutual_funds": 0.3, "crypto": 0.05, "commodities": 0.15, "fd": 0.1, "ppf": 0.1}
        else: # Aggressive
            return {"stocks": 0.5, "mutual_funds": 0.2, "crypto": 0.15, "commodities": 0.1, "fd": 0.05, "ppf": 0.0}

if __name__ == "__main__":
    # Simple test
    agent = MacroAgent()
    
    # Mock State
    mock_state = {
        "user_profile": {
            "risk_score": 0.6, 
            "investment_horizon": 2, # Short horizon test (<3 years)
            "constraints": {"max_gold": 0.1} # Explicit constraint
        },
        "processed_data": {
            "asset_classes": {
                "stocks": {"REL": {"mean_return": 0.0005, "volatility": 0.015}}, 
                "crypto": {"BTC": {"mean_return": 0.002, "volatility": 0.04}},
                "gold": {"GOLD": {"mean_return": 0.0001, "volatility": 0.005}}
            },
            "market_summary": {
                "volatility_level": "high",
                "trend": "bearish"
            }
        }
    }
    
    result = agent.execute(mock_state)
    print("Allocation Result:", result["macro_allocation"])
    print("Strategy:", result["strategy_metadata"]["strategy_used"])
