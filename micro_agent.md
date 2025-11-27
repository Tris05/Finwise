# Micro Agent Documentation

## Overview
The **Micro Agent** is the "Selector" of the Finwise system. It takes the high-level budget defined by the Macro Agent and selects specific assets (e.g., "Buy TCS", "Buy Bitcoin") to fill that budget. It uses a multi-strategy approach tailored to each asset class.

## Responsibilities
1.  **Stock Selection**: Pick individual stocks based on fundamental/technical scores and user preferences.
2.  **Crypto Selection**: Allocate to core cryptocurrencies (BTC, ETH) based on availability.
3.  **Fund Selection**: Choose Mutual Funds matching the user's risk profile.
4.  **Instrument Selection**: Select specific Gold ETFs and Fixed Income products (FD vs PPF).

## Inputs
The agent requires the following inputs in the `state` dictionary:

### 1. Macro Allocation
*   Budget per asset class (e.g., `{"stocks": 0.3, ...}`).

### 2. Market Data
*   **Stocks**: List of available stocks with metrics (`mean_return`, `volatility`, `sector`).
*   **Crypto**: Live prices for BTC, ETH, etc.
*   **Mutual Funds**: List of available funds with NAV and Category.
*   **Gold**: Current gold price per gram.

### 3. User Profile
*   `risk_score`: Influences the aggressiveness of stock/fund selection.
*   `preferences`: List of likes/dislikes (e.g., `["tech", "avoid_energy"]`).
*   `investment_horizon`: Determines FD vs PPF split.

## Selection Logic

### 1. Stocks (`StockSelector`)
*   **Scoring**: Calculates a score (0-10) based on Risk-Adjusted Return ($Return / Volatility$).
*   **Preferences**: 
    *   Boosts score (x1.2) if sector/symbol matches user preference.
    *   Penalizes score (x0.5) if matches "avoid" list.
*   **Allocation**: Selects top 5 scoring stocks.

### 2. Crypto (`CryptoSelector`)
*   **Strategy**: "Core & Satellite" (simplified to Core only for now).
*   **Weights**: Bitcoin (70%), Ethereum (30%).
*   **Fallback**: Equal weight if preferred assets unavailable.

### 3. Mutual Funds (`MutualFundSelector`)
*   **Data-Driven**: Prioritizes funds provided in `market_data`.
*   **Fallback**: Uses static high-quality recommendations based on risk:
    *   *Conservative*: Index Funds.
    *   *Moderate*: Flexi Cap + Index.
    *   *Aggressive*: Small Cap + Mid Cap.

### 4. Fixed Income (`FixedIncomeSelector`)
*   **Logic**: Splits between PPF (Tax-free, Lock-in) and FD (Liquid).
*   **Rule**: If Horizon > 15 years, allocate up to 50% to PPF. Else, 100% FD.

## Output
The agent updates the state with `asset_recommendations`:
```json
{
  "asset_recommendations": {
    "stocks": [
      {
        "symbol": "TCS.NS",
        "name": "TCS.NS",
        "amount": 15000.0,
        "rationale": "High score (8.5) based on returns...",
        "score": 8.5
      }
    ],
    "crypto": [...],
    "mutual_funds": [...]
  }
}
```

## File Structure
*   `agents/micro_agent.py`: Main implementation.
*   `StockSelector`, `CryptoSelector`, `MutualFundSelector`, `GoldSelector`, `FixedIncomeSelector`: Specialized classes.
