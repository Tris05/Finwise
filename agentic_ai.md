Agentic AI Workflow
1. Orchestrator Agent (Central Coordinator)
Purpose:
Acts as the central hub for all user requests and agent communication.


Maintains session context: user profile, current portfolio, past allocations, risk profile.


Routes tasks to relevant agents and aggregates their outputs.


Responsibilities:
Receive user input (total assets, risk score, goals, preferences).


Trigger Data Agent → then Macro Agent → then Micro Agent.


Forward outputs to Risk Agent for validation.


Pass decisions to Explanation Agent.


Merge all responses into final JSON/dashboard output.



2. Data Agent (Market & User Data Fetcher)
Purpose:
Collect all necessary real-time and historical data for portfolio optimization.


Inputs:
API sources: NSE/BSE, Yahoo Finance, CoinGecko, MCX, AMFI, RBI, banks.


User portfolio & preferences from Orchestrator.


Responsibilities:
Fetch prices, returns, volatility, benchmark data for all asset classes.


Preprocess & normalize data for Macro & Micro agents.


Maintain cached historical data for RL agent simulations.


Output:
Structured dataset: {stocks: [...], crypto: [...], funds: [...], commodities: [...], fd_ppf: [...]}



3. Macro Agent (High-Level Allocation)
Purpose:
Decide allocation percentages across asset classes.


Inputs:
User profile (risk score, investment horizon, preferences).


Market & benchmark data from Data Agent.


Past portfolio state.


Responsibilities:
Compute optimal weights for: stocks, mutual funds, crypto, commodities, FD/PPF.


Can use PPO / Markowitz + RL for risk-adjusted allocation.


Ensure allocations respect risk constraints.


Output:
Macro allocation: e.g., {stocks: 50%, mutual_funds: 25%, crypto: 15%, gold: 5%, fd_ppf: 5%}



4. Micro Agent (Asset-Level Allocation)
Purpose:
Decide specific assets within each class and their respective amounts/shares.


Inputs:
Allocated budget per class from Macro Agent.


Asset data from Data Agent.


User preferences (e.g., preferred funds, max crypto exposure).


Responsibilities:
Rank assets using scoring formulas (return, volatility, CAGR, expense ratio, etc.).


Allocate amounts to selected assets until class allocation is exhausted.


Ensure micro-level diversification and guardrails.


Output:
Asset-level recommendations:


{
  "stocks": [{"name": "RELIANCE", "amount": 50000, "shares": 12}, ...],
  "crypto": [{"name": "BTC", "amount": 30000}, ...]
}


5. Risk Agent (Guardrails & Validation)
Purpose:
Enforce risk limits, drawdowns, leverage, exposure constraints.


Inputs:
Macro + Micro Agent outputs.


Historical volatility, covariance, credit/EMI data from Data Agent.


Responsibilities:
Check if portfolio exceeds user-defined risk thresholds.


Penalize over-concentration or violation of constraints.


Suggest adjustments to Macro/Micro Agents if needed.


Output:
Validated allocation & risk assessment:


{
  "overall_risk_level": "Moderate",
  "max_drawdown": 0.12,
  "violations": ["crypto allocation exceeds recommended %"]
}


6. Explanation Agent (Advisor / LLM Layer)
Purpose:
Generate human-understandable reasoning for portfolio decisions.


Inputs:
Macro + Micro allocations.


Risk assessment from Risk Agent.


User profile & past interactions.


Responsibilities:
Translate technical outputs into plain language.


Provide actionable suggestions, e.g., increase gold, reduce crypto.


Optional: include educational notes or quizzes.


Output:
{
  "advice_text": "Given your moderate risk profile, the AI recommends increasing gold allocation for stability and reducing crypto exposure to control volatility.",
  "recommended_actions": ["Increase gold SIP by 5%", "Review crypto holdings monthly"]
}
