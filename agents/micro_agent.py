# micro_agent.py
"""
Enhanced Micro Agent Implementation for Agentic Portfolio Management System.

Responsibilities:
- Select specific assets (stocks, crypto, mutual funds, gold, fixed income) based on macro allocation
- Integrate with data agent's market data
- Apply user preferences and constraints
- Provide detailed rationale for each selection

Inputs:
- market_data: From data agent (nested in asset_classes)
- macro_allocation: From macro agent (percentage allocations)
- total_assets: User's total investment amount
- user_profile: User preferences, risk score, investment horizon, constraints
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Any, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Field name mappings for data agent compatibility
FIELD_KEYS = {
    "mf_nav": "nav",
    "mf_return_1y": "one_year_return",
    "mf_expense_ratio": "expense_ratio",
    "stock_price": "current_price",
    "crypto_price": "current_price_inr",
    "gold_price_per_gram": "current_price_per_gram"
}


@dataclass
class AssetRecommendation:
    """Standard format for asset recommendations"""
    symbol: str
    name: str
    asset_class: str
    amount: float
    quantity: float
    price: float
    rationale: str
    score: float


class StockSelector:
    """Selects individual stocks based on risk-adjusted returns and user preferences"""
    
    def select(self, amount: float, available_stocks: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Select stocks based on scoring algorithm
        
        Args:
            amount: Amount to allocate to stocks
            available_stocks: Stock data from data agent
            user_profile: User preferences and constraints
        """
        if amount <= 0 or not available_stocks:
            logger.warning(f"Stock selection skipped: amount={amount}, stocks_available={len(available_stocks) if available_stocks else 0}")
            return []

        try:
            risk_score = user_profile.get("risk_score", 0.5)
            preferences = user_profile.get("preferences", [])
            constraints = user_profile.get("constraints", {})
            preferred_stocks = constraints.get("preferred_stocks", [])
            exclude_sectors = constraints.get("exclude_sectors", [])
            
            scored = []
            for sym, d in available_stocks.items():
                # Extract price and metrics
                price = d.get(FIELD_KEYS["stock_price"], d.get("price", 0)) or 0.0
                if price <= 0:
                    continue
                    
                mean_return = d.get("mean_return", d.get("return_1y", 0.0)) or 0.0
                volatility = d.get("volatility", 0.01) or 0.01
                sector = d.get("sector", "").lower()
                
                # Skip excluded sectors
                if sector and any(excl.lower() in sector for excl in exclude_sectors):
                    logger.info(f"Skipping {sym} - excluded sector: {sector}")
                    continue
                
                # Calculate risk-adjusted score
                score = (mean_return / max(volatility, 1e-6)) * 100
                
                # Boost for preferred stocks
                if sym in preferred_stocks or any(pref in sym for pref in preferred_stocks):
                    score *= 1.3
                    logger.info(f"Boosting {sym} - preferred stock")
                
                # Boost for market cap if available
                mc = d.get("market_cap")
                if mc:
                    score *= (1 + min(1.0, mc / (1e11 + mc)) * 0.1)
                
                # Boost for user preferences (e.g., "technology" sector)
                if sector and any(pref.lower() in sector for pref in preferences):
                    score *= 1.2
                    logger.info(f"Boosting {sym} - matches preference: {sector}")
                
                scored.append((sym, d, price, score))

            if not scored:
                logger.warning("No stocks passed filtering criteria")
                return []

            # Sort by score and select top stocks
            scored.sort(key=lambda x: x[3], reverse=True)
            n = min(len(scored), 5)  # Diversify across max 5 stocks
            
            logger.info(f"Selected top {n} stocks from {len(scored)} candidates")
            
            # Allocate amount proportionally based on scores
            top_stocks = scored[:n]
            total_score = sum(s[3] for s in top_stocks)
            
            recs = []
            for sym, d, price, score in top_stocks:
                weight = score / total_score if total_score > 0 else 1.0 / n
                stock_amount = amount * weight
                qty = stock_amount / price
                
                recs.append({
                    "symbol": sym.replace(".NS", ""),
                    "name": d.get("name", sym),
                    "asset_class": "stocks",
                    "amount": round(stock_amount, 2),
                    "quantity": qty,
                    "current_price": price,
                    "sector": d.get("sector", "Unknown"),
                    "rationale": f"Risk-adjusted score: {score:.2f}. Return: {mean_return*100:.2f}%, Volatility: {volatility*100:.2f}%",
                    "score": float(round(score, 2)),
                    "expected_return": mean_return,
                    "risk_score": min(volatility * 5, 1.0)
                })
            
            logger.info(f"Stock allocation complete: {len(recs)} stocks, total ₹{sum(r['amount'] for r in recs):,.0f}")
            return recs
            
        except Exception as e:
            logger.error(f"Error in stock selection: {str(e)}", exc_info=True)
            return []


class CryptoSelector:
    """Selects cryptocurrencies with core allocation strategy (BTC/ETH)"""
    
    def select(self, amount: float, available_crypto: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Select cryptocurrencies with 70/30 BTC/ETH split
        
        Args:
            amount: Amount to allocate to crypto
            available_crypto: Crypto data from data agent
            user_profile: User preferences
        """
        if amount <= 0:
            logger.info("Crypto selection skipped: amount <= 0")
            return []
            
        if not available_crypto:
            logger.warning("No crypto data available")
            return []

        try:
            # Normalize keys to lowercase for matching
            prioritized = {k.lower(): v for k, v in available_crypto.items()}
            
            # Initialize picks dictionary (FIX: was missing initialization)
            picks = {}
            
            # Prefer BTC and ETH
            if "bitcoin" in prioritized or "btc" in prioritized:
                key = "bitcoin" if "bitcoin" in prioritized else "btc"
                picks[key] = prioritized[key]
            if "ethereum" in prioritized or "eth" in prioritized:
                key = "ethereum" if "ethereum" in prioritized else "eth"
                picks[key] = prioritized[key]

            # Fallback to top 2 available cryptos
            if not picks:
                items = list(available_crypto.items())[:2]
                picks = {k.lower(): v for k, v in items}
                logger.info(f"Using fallback crypto selection: {list(picks.keys())}")

            # Apply 70/30 weighting if we have 2 cryptos, else equal weight
            keys = list(picks.keys())
            weights = {}
            if len(keys) == 2:
                weights[keys[0]] = 0.7
                weights[keys[1]] = 0.3
            elif len(keys) == 1:
                weights[keys[0]] = 1.0
            else:
                # More than 2, distribute evenly
                for k in keys:
                    weights[k] = 1.0 / len(keys)

            recs = []
            for k, w in weights.items():
                data = picks[k]
                price = data.get(FIELD_KEYS["crypto_price"], data.get("price", 1)) or 1.0
                alloc = amount * w
                qty = alloc / price if price else 0.0
                
                recs.append({
                    "symbol": k.upper(),
                    "name": data.get("name", k.title()),
                    "asset_class": "crypto",
                    "amount": round(alloc, 2),
                    "quantity": qty,
                    "current_price": price,
                    "rationale": f"Core crypto allocation ({w*100:.0f}% of crypto budget)",
                    "score": 8.0,
                    "volatility": data.get("volatility", 0.5),
                    "daily_change": data.get("daily_change", 0.0)
                })
            
            logger.info(f"Crypto allocation complete: {len(recs)} assets, total ₹{sum(r['amount'] for r in recs):,.0f}")
            return recs
            
        except Exception as e:
            logger.error(f"Error in crypto selection: {str(e)}", exc_info=True)
            return []


class MutualFundSelector:
    """Selects mutual funds based on multi-factor scoring"""
    
    def select(self, amount: float, user_profile: Dict[str, Any], available_funds: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Select mutual funds based on returns, expense ratio, and category fit
        
        Args:
            amount: Amount to allocate to mutual funds
            user_profile: User risk profile and preferences
            available_funds: Fund data from data agent
        """
        if amount <= 0:
            logger.info("Mutual fund selection skipped: amount <= 0")
            return []

        try:
            risk = user_profile.get("risk_score", 0.5)
            recs = []

            # Data-driven selection if funds available
            if available_funds:
                scored = []
                for fid, meta in available_funds.items():
                    nav = meta.get(FIELD_KEYS["mf_nav"], meta.get("nav", 1.0)) or 1.0
                    one_y = meta.get(FIELD_KEYS["mf_return_1y"], meta.get("one_year_return", meta.get("return_1y", 0.0))) or 0.0
                    exp = meta.get(FIELD_KEYS["mf_expense_ratio"], meta.get("expense_ratio", 0.01)) or 0.01
                    cat = (meta.get("category", meta.get("type", "Equity")) or "Equity").lower()

                    # Base score: reward returns, penalize expense ratio
                    score = (one_y * 100.0) / (exp + 0.01)

                    # Adjust by category vs user risk
                    if risk < 0.4 and cat in ("debt", "liquid", "short-term", "index"):
                        score *= 1.2
                    if risk > 0.7 and cat in ("small cap", "mid cap", "flexi cap", "sector"):
                        score *= 1.15

                    # Boost for AUM (larger funds)
                    aum = meta.get("aum")
                    if aum:
                        score *= (1 + min(0.5, aum / (1e9 + aum)))

                    scored.append((fid, meta, nav, score, cat))

                # Sort and select top funds
                scored.sort(key=lambda x: x[3], reverse=True)
                top_k = min(5, len(scored))
                
                if top_k > 0:
                    top = scored[:top_k]
                    total_score = sum(max(s[3], 0.0001) for s in top)
                    
                    for fid, meta, nav, score, cat in top:
                        weight = (score / total_score) if total_score > 0 else 1.0 / top_k
                        alloc = amount * weight
                        units = alloc / nav if nav else 0.0
                        
                        recs.append({
                            "symbol": fid,
                            "name": meta.get("name", fid),
                            "asset_class": "mutual_funds",
                            "amount": round(alloc, 2),
                            "quantity": units,
                            "current_price": nav,
                            "category": cat,
                            "rationale": f"Multi-factor score: {score:.2f} (Category: {cat}, 1Y Return: {one_y*100:.1f}%, Expense: {exp*100:.2f}%)",
                            "score": float(round(score, 2)),
                            "expense_ratio": exp,
                            "one_year_return": one_y
                        })
                    
                    logger.info(f"MF allocation (data-driven): {len(recs)} funds, total ₹{sum(r['amount'] for r in recs):,.0f}")
                    return recs

            # Fallback to risk-based recommendations
            logger.info(f"Using fallback MF recommendations for risk_score={risk}")
            nav = 100.0
            
            if risk <= 0.4:  # Conservative
                recs.extend([
                    {
                        "symbol": "MF-INDEX",
                        "name": "Nifty 50 Index Fund",
                        "asset_class": "mutual_funds",
                        "amount": round(amount * 0.9, 2),
                        "quantity": (amount * 0.9) / nav,
                        "current_price": nav,
                        "category": "index",
                        "rationale": "Conservative index allocation for stable returns",
                        "score": 5.0
                    },
                    {
                        "symbol": "MF-DEBT",
                        "name": "Short Term Debt Fund",
                        "asset_class": "mutual_funds",
                        "amount": round(amount * 0.1, 2),
                        "quantity": (amount * 0.1) / nav,
                        "current_price": nav,
                        "category": "debt",
                        "rationale": "Debt exposure for stability",
                        "score": 5.0
                    }
                ])
            elif risk <= 0.7:  # Moderate
                recs.extend([
                    {
                        "symbol": "MF-FLEX",
                        "name": "Flexi Cap Fund",
                        "asset_class": "mutual_funds",
                        "amount": round(amount * 0.7, 2),
                        "quantity": (amount * 0.7) / nav,
                        "current_price": nav,
                        "category": "flexi cap",
                        "rationale": "Balanced flexi-cap allocation",
                        "score": 6.5
                    },
                    {
                        "symbol": "MF-NEXT50",
                        "name": "Nifty Next 50 Index",
                        "asset_class": "mutual_funds",
                        "amount": round(amount * 0.3, 2),
                        "quantity": (amount * 0.3) / nav,
                        "current_price": nav,
                        "category": "index",
                        "rationale": "Mid-cap index exposure",
                        "score": 6.0
                    }
                ])
            else:  # Aggressive
                recs.extend([
                    {
                        "symbol": "MF-SMALL",
                        "name": "Small Cap Fund",
                        "asset_class": "mutual_funds",
                        "amount": round(amount * 0.6, 2),
                        "quantity": (amount * 0.6) / nav,
                        "current_price": nav,
                        "category": "small cap",
                        "rationale": "High-growth small-cap allocation",
                        "score": 6.0
                    },
                    {
                        "symbol": "MF-MID",
                        "name": "Mid Cap Fund",
                        "asset_class": "mutual_funds",
                        "amount": round(amount * 0.4, 2),
                        "quantity": (amount * 0.4) / nav,
                        "current_price": nav,
                        "category": "mid cap",
                        "rationale": "Mid-cap growth exposure",
                        "score": 6.0
                    }
                ])
            
            logger.info(f"MF allocation (fallback): {len(recs)} funds, total ₹{sum(r['amount'] for r in recs):,.0f}")
            return recs
            
        except Exception as e:
            logger.error(f"Error in mutual fund selection: {str(e)}", exc_info=True)
            return []


class GoldSelector:
    """Selects gold investment (ETF preferred)"""
    
    def select(self, amount: float, gold_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Select gold ETF allocation
        
        Args:
            amount: Amount to allocate to gold
            gold_data: Gold price data from data agent
        """
        if amount <= 0:
            logger.info("Gold selection skipped: amount <= 0")
            return []
            
        try:
            price_per_gram = gold_data.get(FIELD_KEYS["gold_price_per_gram"], gold_data.get("current_price_per_gram"))
            
            if price_per_gram is None:
                price_per_gram = 6000.0  # Fallback price
                logger.warning(f"Using fallback gold price: ₹{price_per_gram}/gram")
            
            # ETF unit price heuristic
            etf_unit_price = max(1.0, price_per_gram / 10.0)
            qty = amount / etf_unit_price
            
            rec = {
                "symbol": gold_data.get("preferred_etf_symbol", "GOLDBEES"),
                "name": gold_data.get("preferred_etf_name", "Gold ETF"),
                "asset_class": "gold",
                "amount": round(amount, 2),
                "quantity": qty,
                "current_price": etf_unit_price,
                "rationale": f"Gold ETF for inflation hedge and portfolio diversification (Gold: ₹{price_per_gram:.0f}/gram)",
                "score": 9.0,
                "underlying_gold_price": price_per_gram
            }
            
            logger.info(f"Gold allocation: {rec['name']}, ₹{amount:,.0f}")
            return [rec]
            
        except Exception as e:
            logger.error(f"Error in gold selection: {str(e)}", exc_info=True)
            return []


class FixedIncomeSelector:
    """Selects fixed income products (PPF, FD, bonds)"""
    
    def select(self, amount: float, fi_data: Dict[str, Any], user_profile: Dict[str, Any], constants: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Select fixed income allocation (PPF vs FD based on horizon)
        
        Args:
            amount: Amount to allocate to fixed income
            fi_data: Fixed income data from data agent
            user_profile: User profile with investment horizon
            constants: System constants (e.g., PPF limits)
        """
        if amount <= 0:
            logger.info("Fixed income selection skipped: amount <= 0")
            return []
            
        try:
            constants = constants or {}
            ppf_limit = constants.get("ppf_annual_limit", 150000)
            horizon = user_profile.get("investment_horizon", 5)
            recs = []

            # Extract FD and bond products if available
            fd_products = fi_data.get("fd_products") if isinstance(fi_data, dict) else None
            
            # If DataAgent exposes fd_sbi / fd_hdfc entries rather than a list, collect them
            if not fd_products and isinstance(fi_data, dict):
                fd_products = []
                for k, v in fi_data.items():
                    if isinstance(k, str) and k.lower().startswith("fd_") and isinstance(v, dict):
                        fd_products.append({
                            "id": k.upper(),
                            "bank": v.get("bank", k.upper()),
                            "rate": v.get("rate", 0.0),
                            "tenure_options": v.get("tenure_options", v.get("tenure_options", [1,3,5]))
                        })

            # PPF allocation for long-term investors
            ppf_alloc = 0.0
            if horizon >= 15:
                ppf_alloc = min(amount * 0.5, ppf_limit)
            elif horizon >= 10:
                ppf_alloc = min(amount * 0.3, ppf_limit)
            
            remaining = max(0.0, amount - ppf_alloc)

            # Add PPF if allocated
            if ppf_alloc > 0:
                ppf_rate = fi_data.get("ppf", {}).get("rate", 0.071) if isinstance(fi_data, dict) else 0.071
                recs.append({
                    "symbol": "PPF",
                    "name": "Public Provident Fund",
                    "asset_class": "fd_ppf",
                    "amount": round(ppf_alloc, 2),
                    "quantity": 1,
                    "current_price": ppf_alloc,
                    "rate": ppf_rate,
                    "tenure": 15,
                    "rationale": f"Tax-free long-term savings at {ppf_rate*100:.1f}% p.a. (Horizon: {horizon} years)",
                    "score": 9.0,
                    "tax_benefit": "80C + Tax-free returns"
                })

            # FD allocation
            if remaining > 0:
                if fd_products and isinstance(fd_products, list):
                    # Select best FD by rate
                    best = max(fd_products, key=lambda x: x.get("rate", 0))
                    fd_rate = best.get("rate", 0.065)
                    fd_bank = best.get("bank", "SBI")
                    fd_tenure = best.get("tenure_options", [5])[0] if best.get("tenure_options") else 5
                    
                    recs.append({
                        "symbol": best.get("id", "FD-CHOICE"),
                        "name": f"{fd_bank} Fixed Deposit",
                        "asset_class": "fd_ppf",
                        "amount": round(remaining, 2),
                        "quantity": 1,
                        "current_price": remaining,
                        "rate": fd_rate,
                        "tenure": fd_tenure,
                        "rationale": f"Fixed deposit at {fd_rate*100:.2f}% p.a. for {fd_tenure} years",
                        "score": float(fd_rate * 10),
                        "bank": fd_bank
                    })
                else:
                    # Fallback FD
                    fd_rate = 0.065
                    recs.append({
                        "symbol": "FD-FALLBACK",
                        "name": "SBI Fixed Deposit",
                        "asset_class": "fd_ppf",
                        "amount": round(remaining, 2),
                        "quantity": 1,
                        "current_price": remaining,
                        "rate": fd_rate,
                        "tenure": min(horizon, 5),
                        "rationale": f"Safe fixed deposit at {fd_rate*100:.1f}% p.a.",
                        "score": 7.0,
                        "bank": "SBI"
                    })

            logger.info(f"Fixed income allocation: {len(recs)} products, total ₹{sum(r['amount'] for r in recs):,.0f}")
            return recs
            
        except Exception as e:
            logger.error(f"Error in fixed income selection: {str(e)}", exc_info=True)
            return []


class MicroAgent:
    """
    Main Micro Agent - Selects specific assets based on macro allocation
    
    Integrates with:
    - Data Agent: market_data
    - Macro Agent: macro_allocation
    - User inputs: total_assets, user_profile
    """
    
    def __init__(self):
        self.stock_selector = StockSelector()
        self.crypto_selector = CryptoSelector()
        self.mf_selector = MutualFundSelector()
        self.gold_selector = GoldSelector()
        self.fi_selector = FixedIncomeSelector()
        logger.info("Micro Agent initialized with all selectors")

    def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute micro allocation based on macro allocation and market data
        
        Required state inputs:
        - total_assets: Total investment amount
        - macro_allocation: Asset class percentages from macro agent
        - market_data: Market data from data agent
        - user_profile: User preferences and constraints
        
        Returns:
        - Updated state with asset_recommendations
        """
        try:
            logger.info("=" * 60)
            logger.info("MICRO AGENT EXECUTION STARTED")
            logger.info("=" * 60)
            
            # Extract required inputs
            total_assets = state.get("total_assets", 0) or 0
            if total_assets == 0:
                total_assets = 100000.0
                logger.warning(f"total_assets missing - using fallback: ₹{total_assets:,.0f}")

            macro_alloc = state.get("macro_allocation", {})
            if not macro_alloc:
                logger.error("macro_allocation missing in state!")
                return {**state, "error": "Missing macro_allocation", "asset_recommendations": {}}
            
            market_data = state.get("market_data", {}) or {}
            user_profile = state.get("user_profile", {}) or {}
            constants = state.get("constants", {})
            
            logger.info(f"Total Assets: ₹{total_assets:,.0f}")
            logger.info(f"Macro Allocation: {macro_alloc}")
            logger.info(f"User Risk Score: {user_profile.get('risk_score', 'N/A')}")
            logger.info(f"Investment Horizon: {user_profile.get('investment_horizon', 'N/A')} years")

            # Helper to safely extract market data
            def get_market_data(asset_class: str) -> Dict[str, Any]:
                """Extract market data with fallback to nested structure"""
                if asset_class in market_data:
                    return market_data[asset_class]
                if "asset_classes" in market_data and asset_class in market_data["asset_classes"]:
                    return market_data["asset_classes"][asset_class]
                return {}

            recs = {}

            # 1. Stocks
            logger.info("\n--- Stock Selection ---")
            stocks_amt = macro_alloc.get("stocks", 0) * total_assets
            logger.info(f"Stock budget: ₹{stocks_amt:,.0f} ({macro_alloc.get('stocks', 0):.1%})")
            recs["stocks"] = self.stock_selector.select(
                stocks_amt, 
                get_market_data("stocks"), 
                user_profile
            )

            # 2. Crypto
            logger.info("\n--- Crypto Selection ---")
            crypto_amt = macro_alloc.get("crypto", 0) * total_assets
            logger.info(f"Crypto budget: ₹{crypto_amt:,.0f} ({macro_alloc.get('crypto', 0):.1%})")
            recs["crypto"] = self.crypto_selector.select(
                crypto_amt, 
                get_market_data("crypto"), 
                user_profile
            )

            # 3. Mutual Funds
            logger.info("\n--- Mutual Fund Selection ---")
            mf_amt = macro_alloc.get("mutual_funds", 0) * total_assets
            logger.info(f"MF budget: ₹{mf_amt:,.0f} ({macro_alloc.get('mutual_funds', 0):.1%})")
            recs["mutual_funds"] = self.mf_selector.select(
                mf_amt, 
                user_profile, 
                get_market_data("mutual_funds")
            )

            # 4. Gold
            logger.info("\n--- Gold Selection ---")
            gold_amt = macro_alloc.get("gold", 0) * total_assets
            logger.info(f"Gold budget: ₹{gold_amt:,.0f} ({macro_alloc.get('gold', 0):.1%})")
            recs["gold"] = self.gold_selector.select(
                gold_amt, 
                get_market_data("gold")
            )

            # 5. Fixed Income
            logger.info("\n--- Fixed Income Selection ---")
            fi_amt = macro_alloc.get("fd_ppf", 0) * total_assets
            logger.info(f"FI budget: ₹{fi_amt:,.0f} ({macro_alloc.get('fd_ppf', 0):.1%})")
            recs["fd_ppf"] = self.fi_selector.select(
                fi_amt, 
                get_market_data("fixed_income"), 
                user_profile, 
                constants
            )

            # Validation
            self._validate_recommendations(recs, macro_alloc, total_assets)

            logger.info("\n" + "=" * 60)
            logger.info("MICRO AGENT EXECUTION COMPLETED")
            logger.info(f"Total recommendations: {sum(len(v) for v in recs.values())}")
            logger.info("=" * 60)

            return {
                **state,
                "asset_recommendations": recs,
                "current_step": "risk_validation",
                "micro_generated_at": datetime.utcnow().isoformat() + "Z"
            }
            
        except Exception as e:
            logger.exception("MICRO AGENT FAILED")
            return {
                **state, 
                "error": f"Micro Agent error: {str(e)}", 
                "asset_recommendations": {}
            }

    def _validate_recommendations(self, recs: Dict[str, List[Dict]], macro_alloc: Dict[str, float], total_assets: float) -> None:
        """Validate that recommendations match macro allocation"""
        logger.info("\n--- Validation ---")
        
        for asset_class, allocation_pct in macro_alloc.items():
            expected_amount = allocation_pct * total_assets
            actual_amount = sum(item.get("amount", 0) for item in recs.get(asset_class, []))
            
            diff = abs(expected_amount - actual_amount)
            diff_pct = (diff / total_assets * 100) if total_assets > 0 else 0
            
            status = "✓" if diff < total_assets * 0.02 else "⚠"  # 2% tolerance
            logger.info(f"{status} {asset_class}: Expected ₹{expected_amount:,.0f}, Actual ₹{actual_amount:,.0f} (Δ {diff_pct:.2f}%)")


# For standalone testing
if __name__ == "__main__":
    agent = MicroAgent()
    
    # Mock state
    test_state = {
        "total_assets": 1000000,
        "macro_allocation": {
            "stocks": 0.3,
            "crypto": 0.1,
            "mutual_funds": 0.3,
            "gold": 0.1,
            "fd_ppf": 0.2
        },
        "market_data": {
            "stocks": {
                "RELIANCE.NS": {"current_price": 2500, "mean_return": 0.001, "volatility": 0.02, "sector": "Energy"},
                "TCS.NS": {"current_price": 3500, "mean_return": 0.0008, "volatility": 0.015, "sector": "IT"}
            },
            "crypto": {
                "bitcoin": {"current_price_inr": 3500000, "volatility": 0.45},
                "ethereum": {"current_price_inr": 200000, "volatility": 0.50}
            },
            "gold": {"current_price_per_gram": 6000},
            "fixed_income": {
                "ppf": {"rate": 0.071},
                "fd_products": [{"id": "SBI-FD", "bank": "SBI", "rate": 0.065, "tenure_options": [5]}]
            }
        },
        "user_profile": {
            "risk_score": 0.6,
            "investment_horizon": 10,
            "preferences": ["technology"],
            "constraints": {"max_crypto": 0.15, "preferred_stocks": ["TCS.NS"]}
        }
    }
    
    result = agent.execute(test_state)
    
    print("\n" + "=" * 60)
    print("ASSET RECOMMENDATIONS")
    print("=" * 60)
    for asset_class, recommendations in result["asset_recommendations"].items():
        print(f"\n{asset_class.upper()}:")
        for rec in recommendations:
            print(f"  • {rec['name']}: ₹{rec['amount']:,.0f}")
