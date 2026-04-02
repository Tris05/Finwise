# Macro Agent Documentation

## Overview
The **Macro Agent** is the "Strategist" of the Finwise system. It is responsible for determining the high-level asset allocation (e.g., 50% Stocks, 30% Bonds, 20% Gold) for a user's portfolio. It combines **Modern Portfolio Theory (Markowitz Optimization)** for a mathematical baseline with **Reinforcement Learning (PPO)** for tactical adjustments based on market regimes.

## Responsibilities
1.  **Asset Allocation**: Calculate optimal weights for asset classes (Stocks, Mutual Funds, Crypto, Gold, Fixed Income).
2.  **Risk Management**: Enforce user constraints (e.g., "Max 5% Crypto") and investment horizon limits.
3.  **Market Adaptation**: Adjust allocations dynamically based on market volatility and trends.

## Inputs
The agent requires the following inputs in the `state` dictionary:

### 1. User Profile
*   `risk_score` (float, 0.0-1.0): User's risk tolerance.
*   `investment_horizon` (int): Investment duration in years.
*   `constraints` (dict): Hard limits (e.g., `{"max_crypto": 0.1}`).

### 2. Processed Market Data
*   `expected_returns` (vector): Forecasted returns for each asset class.
*   `covariance_matrix` (matrix): Correlation and volatility structure of assets.
*   `market_summary` (dict): High-level market signals (e.g., `volatility_level`).

## Logic Flow

### Step 1: Markowitz Optimization (Baseline)
*   **Goal**: Maximize Sharpe Ratio (Risk-Adjusted Return).
*   **Method**: `scipy.optimize.minimize` (SLSQP).
*   **Formula**: Maximize $\frac{E[R_p] - R_f}{\sigma_p}$ subject to constraints.
*   **Constraints**:
    *   Sum of weights = 1.0.
    *   No short selling ($w_i \ge 0$).
    *   User-defined min/max bounds.

### Step 2: PPO Refinement (Tactical)
*   **Goal**: Adjust baseline weights to account for short-term market conditions.
*   **Method**: Proximal Policy Optimization (RL).
*   **Action**: Output $\Delta w$ (weight adjustments).
*   **Fallback**: If no model is loaded, uses a heuristic (e.g., reduce equity if volatility is "High").

## Output
The agent updates the state with:
```json
{
  "macro_allocation": {
    "stocks": 0.45,
    "mutual_funds": 0.25,
    "crypto": 0.05,
    "gold": 0.10,
    "fd": 0.15,
    "ppf": 0.15
  },
  "strategy_metadata": {
    "strategy_used": "markowitz_ppo_hybrid",
    "timestamp": "2023-10-27T10:00:00"
  }
}
```

## File Structure
*   `agents/macro_agent.py`: Main implementation.
*   `MarkowitzOptimizer`: Class for mean-variance optimization.
*   `PPORefinementAgent`: Class for RL-based adjustments.
