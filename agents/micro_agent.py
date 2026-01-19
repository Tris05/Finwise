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
            
            logger.info(f"Stock allocation complete: {len(recs)} stocks, total INR {sum(r['amount'] for r in recs):,.0f}")
            return recs
            
        except Exception as e:
            logger.error(f"Error in stock selection: {str(e)}", exc_info=True)
            return []


class CryptoSelector:
    """Selects cryptocurrencies using dynamic risk-adjusted scoring"""
    
    def select(self, amount: float, available_crypto: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Select cryptocurrencies based on scoring: (DailyChange / Volatility) * log(MarketCap)
        Prioritizes blue-chip assets but adapts to market data.
        
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
            import math
            scored = []
            
            for sym, data in available_crypto.items():
                # Extract metrics
                price = data.get(FIELD_KEYS["crypto_price"], data.get("price", 0)) or 0.0
                if price <= 0: continue
                
                daily_change = data.get("daily_change", 0.0) # e.g. 0.02 for 2%
                volatility = data.get("volatility", 0.05) # e.g. 0.05
                market_cap = data.get("market_cap", 0) or 0
                
                # Minimum volatility floor to prevent division by zero/extreme scores
                volatility = max(volatility, 0.02)
                
                # Base Score: Return / Risk
                # We use a small positive bias for daily_change to avoid negative scores for stable coins in slight red
                # but primarily we want positive momentum. 
                # If daily_change is negative, score decreases.
                
                # Standardized Score Formula:
                # 1. Performance Metric: (1 + Daily_Change) / Volatility
                # 2. Safety Metric: log10(Market Cap)
                
                perf_metric = (1.0 + daily_change) / volatility
                safety_metric = math.log10(market_cap) if market_cap > 1000 else 1.0
                
                final_score = perf_metric * safety_metric
                
                # Boost for 'Blue Chips' explicitly (BTC/ETH) to ensure core stability
                sym_lower = sym.lower()
                if "bitcoin" in sym_lower or "btc" in sym_lower:
                    final_score *= 1.5
                elif "ethereum" in sym_lower or "eth" in sym_lower:
                    final_score *= 1.3
                    
                scored.append({
                    "symbol": sym,
                    "data": data,
                    "score": final_score,
                    "price": price
                })
                
            # Sort by score descending
            scored.sort(key=lambda x: x["score"], reverse=True)
            
            # Select top 3 assets
            top_picks = scored[:3]
            if not top_picks:
                return []
                
            total_score = sum(p["score"] for p in top_picks)
            
            recs = []
            for item in top_picks:
                sym = item["symbol"]
                d = item["data"]
                score = item["score"]
                price = item["price"]
                
                # Calculate weight
                weight = score / total_score if total_score > 0 else 1.0 / len(top_picks)
                alloc_amt = amount * weight
                qty = alloc_amt / price
                
                recs.append({
                    "symbol": sym.upper(),
                    "name": d.get("name", sym.title()),
                    "asset_class": "crypto",
                    "amount": round(alloc_amt, 2),
                    "quantity": qty,
                    "current_price": price,
                    "rationale": f"Dynamic Score: {score:.1f} (Vol: {d.get('volatility',0):.2f}, Cap: ₹{d.get('market_cap',0)/1e7:.0f}Cr)",
                    "score": float(round(score, 2)),
                    "volatility": d.get("volatility"),
                    "daily_change": d.get("daily_change")
                })
                
            logger.info(f"Crypto allocation complete: {len(recs)} assets selected")
            return recs

        except Exception as e:
            logger.error(f"Error in crypto selection: {str(e)}", exc_info=True)
            return []


class MutualFundSelector:
    """Selects mutual funds based on risk profile and standard categories"""
    
    def select(self, amount: float, user_profile: Dict[str, Any], available_funds: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Select mutual funds based on risk score and industry standard categories.
        
        Categories:
        - Large Cap, Mid Cap, Small Cap, Flexi Cap
        - Aggressive Hybrid, Balanced Advantage
        - Corporate Bond/Debt
        
        Args:
            amount: Amount to allocate
            user_profile: User risk profile
            available_funds: Fund data from data agent
        """
        if amount <= 0:
            logger.info("Mutual fund selection skipped: amount <= 0")
            return []

        try:
            risk = user_profile.get("risk_score", 0.5)
            horizon = user_profile.get("investment_horizon", 5)
            recs = []
            
            # Define allocation rules based on risk score and horizon
            # Format: (Category Name, Weight)
            allocation_rules = []
            
            # Horizon Override Logic
            # 1. Short Term (< 3 years): Force Conservative Mix regardless of risk score
            # 2. Medium Term (3-5 years): Cap Aggressiveness (No Heavy Small Cap)
            # 3. Long Term (> 5 years): Use Risk Score fully
            
            effective_risk_category = "high" # default
            
            if horizon < 3:
                effective_risk_category = "low"
                logger.info("Horizon < 3 years: Enforcing conservative MF allocation")
            elif horizon < 5:
                if risk > 0.7:
                     effective_risk_category = "medium" # Downgrade high risk to medium
                     logger.info("Horizon < 5 years: Capping aggressive MF allocation to medium")
                else:
                    # Use actual risk score if already low/medium
                    effective_risk_category = "low" if risk < 0.4 else "medium"
            else:
                 # Horizon >= 5: Trust the risk score
                 if risk < 0.4: effective_risk_category = "low"
                 elif risk <= 0.7: effective_risk_category = "medium"
                 else: effective_risk_category = "high"

            if effective_risk_category == "low":  # Low Risk / Short Horizon
                allocation_rules = [
                    ("Balanced Advantage", 0.40),
                    ("Large Cap", 0.30),
                    ("Corporate Bond", 0.20),
                    ("Aggressive Hybrid", 0.10)
                ]
            elif effective_risk_category == "medium":  # Medium Risk / Medium Horizon
                allocation_rules = [
                    ("Flexi Cap", 0.35),
                    ("Large Cap", 0.30),
                    ("Mid Cap", 0.20),
                    ("Aggressive Hybrid", 0.15)
                ]
            else:  # High Risk / Long Horizon
                allocation_rules = [
                    ("Small Cap", 0.40),
                    ("Mid Cap", 0.30),
                    ("Flexi Cap", 0.20),
                    ("Large Cap", 0.10)
                ]
            
            logger.info(f"MF Allocation Strategy (Risk: {risk}): {allocation_rules}")

            # Helper to find best fund in a category
            def get_best_fund(category_name: str) -> Optional[Dict[str, Any]]:
                if not available_funds:
                    return None
                
                candidates = []
                for fid, meta in available_funds.items():
                    # Check if category matches
                    # We check both 'category' field and fund name for keywords
                    cat_str = str(meta.get("category", "")).lower()
                    name_str = str(meta.get("fund_name", "")).lower()
                    
                    match = False
                    target = category_name.lower()
                    
                    # Specific mapping logic
                    if target == "large cap":
                        if "large cap" in cat_str or "bluechip" in cat_str or "large cap" in name_str: match = True
                    elif target == "mid cap":
                        if "mid cap" in cat_str or "emerging" in cat_str or "mid cap" in name_str: match = True
                    elif target == "small cap":
                        if "small cap" in cat_str or "small cap" in name_str: match = True
                    elif target == "flexi cap":
                        if "flexi cap" in cat_str or "multi cap" in cat_str or "flexi cap" in name_str: match = True
                    elif target == "aggressive hybrid":
                        if "aggressive hybrid" in cat_str or "equity hybrid" in cat_str: match = True
                    elif target == "balanced advantage":
                        if "balanced advantage" in cat_str or "dynamic asset" in cat_str or "balanced advantage" in name_str: match = True
                    elif target == "corporate bond":
                        if "corporate bond" in cat_str or "ultra short" in cat_str or "debt" in cat_str or "liquid" in cat_str: match = True
                    
                    if match:
                        # Get return (prioritize 3Y, then 1Y)
                        ret = meta.get("returns_3y")
                        if not isinstance(ret, (int, float)):
                            ret = meta.get("returns_1y", 0.0)
                        if not isinstance(ret, (int, float)):
                            ret = 0.0
                        candidates.append((fid, meta, ret))
                
                if not candidates:
                    return None
                
                # Sort by return descending
                candidates.sort(key=lambda x: x[2], reverse=True)
                return candidates[0] # Return best fund (fid, meta, ret)

            # Execute allocation
            for cat_name, weight in allocation_rules:
                alloc_amt = amount * weight
                if alloc_amt <= 0: continue
                
                best_fund_tuple = get_best_fund(cat_name)
                
                if best_fund_tuple:
                    fid, meta, ret = best_fund_tuple
                    nav = meta.get(FIELD_KEYS["mf_nav"], meta.get("nav", 10.0)) or 10.0
                    
                    recs.append({
                        "symbol": fid,
                        "name": meta.get("fund_name", fid),
                        "asset_class": "mutual_funds",
                        "amount": round(alloc_amt, 2),
                        "quantity": alloc_amt / nav,
                        "current_price": nav,
                        "category": cat_name,
                        "rationale": f"Best {cat_name} fund based on returns ({ret*100:.1f}%). Allocation: {weight*100:.0f}%",
                        "score": 9.0,
                        "return_metric": ret
                    })
                else:
                    # Fallback if no fund found in Excel for this category
                    # Create a generic placeholder
                    recs.append({
                        "symbol": f"MF-{cat_name.upper().replace(' ', '-')}",
                        "name": f"Generic {cat_name} Fund",
                        "asset_class": "mutual_funds",
                        "amount": round(alloc_amt, 2),
                        "quantity": alloc_amt / 100.0,
                        "current_price": 100.0,
                        "category": cat_name,
                        "rationale": f"Recommended {cat_name} allocation ({weight*100:.0f}%). (No specific fund data found)",
                        "score": 5.0
                    })

            logger.info(f"MF allocation complete: {len(recs)} funds, total INR {sum(r['amount'] for r in recs):,.0f}")
            return recs

        except Exception as e:
            logger.error(f"Error in mutual fund selection: {str(e)}", exc_info=True)
            return []


class CommoditySelector:
    """Selects commodities (Gold & Silver) investment based on risk, horizon, and GSR"""
    
    def select(self, amount: float, commodity_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Select commodity allocation (Gold & Silver)
        
        Args:
            amount: Amount to allocate to commodities
            commodity_data: Commodity data from data agent (contains 'gold' and 'silver')
            user_profile: User preferences (risk_score, investment_horizon)
        """
        if amount <= 0:
            logger.info("Commodity selection skipped: amount <= 0")
            return []
            
        try:
            recs = []
            risk_score = user_profile.get("risk_score", 0.5)
            horizon = user_profile.get("investment_horizon", 5)
            
            # 1. Base Allocation by Risk Score
            if risk_score < 0.4:
                gold_weight = 0.85
                silver_weight = 0.15
            elif risk_score <= 0.7:
                gold_weight = 0.70
                silver_weight = 0.30
            else:
                gold_weight = 0.55
                silver_weight = 0.45
                
            logger.info(f"Base Commodity Split (Risk {risk_score}): Gold {gold_weight:.2f}, Silver {silver_weight:.2f}")

            # 2. Horizon Adjustment
            if horizon < 3:
                # Short term -> More Gold (+5%)
                adjustment = 0.05
                gold_weight += adjustment
                silver_weight -= adjustment
                logger.info(f"Horizon Adjustment (<3y): Gold +5%, Silver -5%")
            elif horizon > 7:
                # Long term -> More Silver (+5%)
                adjustment = 0.05
                gold_weight -= adjustment
                silver_weight += adjustment
                logger.info(f"Horizon Adjustment (>7y): Gold -5%, Silver +5%")

            # 3. Market Trend Adjustment (GSR)
            gold_data = commodity_data.get("gold", {})
            silver_data = commodity_data.get("silver", {})
            
            gold_price = gold_data.get("current_price_per_gram", 0)
            silver_price = silver_data.get("current_price_per_gram", 0)
            
            if gold_price > 0 and silver_price > 0:
                gsr = gold_price / silver_price
                logger.info(f"Gold-Silver Ratio (GSR): {gsr:.2f}")
                
                if gsr > 80:
                    # Silver undervalued -> Shift to Silver
                    gold_weight -= 0.05
                    silver_weight += 0.05
                    logger.info("GSR > 80: Silver undervalued -> Silver +5%")
                elif gsr < 70:
                    # Silver expensive -> Shift to Gold
                    gold_weight += 0.05
                    silver_weight -= 0.05
                    logger.info("GSR < 70: Silver expensive -> Gold +5%")
            else:
                logger.warning("Could not calculate GSR (missing prices)")

            # Normalize weights (ensure 0 <= w <= 1 and sum = 1)
            gold_weight = max(0.0, min(1.0, gold_weight))
            silver_weight = max(0.0, min(1.0, silver_weight))
            
            # Re-normalize if sum != 1 (due to clamping)
            total_w = gold_weight + silver_weight
            if total_w > 0:
                gold_weight /= total_w
                silver_weight /= total_w
            
            logger.info(f"Final Commodity Split: Gold {gold_weight:.2%}, Silver {silver_weight:.2%}")

            # --- Gold Allocation ---
            if gold_weight > 0:
                gold_amt = amount * gold_weight
                price_per_gram = gold_data.get("current_price_per_gram", 6000.0)
                
                # ETF unit price heuristic (approx 1/10th gram or 1 gram)
                etf_unit_price = max(1.0, price_per_gram / 10.0)
                qty = gold_amt / etf_unit_price
                
                recs.append({
                    "symbol": "GOLDBEES",
                    "name": "Gold ETF",
                    "asset_class": "commodities",
                    "amount": round(gold_amt, 2),
                    "quantity": qty,
                    "current_price": etf_unit_price,
                    "rationale": f"Gold allocation ({gold_weight*100:.0f}%) for stability. Price: INR {price_per_gram:.0f}/g",
                    "score": 9.0,
                    "sub_asset_class": "gold"
                })
                
            # --- Silver Allocation ---
            if silver_weight > 0:
                silver_amt = amount * silver_weight
                price_per_gram = silver_data.get("current_price_per_gram", 75.0)
                
                # Silver ETF unit price heuristic
                etf_unit_price = max(1.0, price_per_gram * 10.0) # Silver ETFs often represent more grams
                qty = silver_amt / etf_unit_price
                
                recs.append({
                    "symbol": "SILVERBEES",
                    "name": "Silver ETF",
                    "asset_class": "commodities",
                    "amount": round(silver_amt, 2),
                    "quantity": qty,
                    "current_price": etf_unit_price,
                    "rationale": f"Silver allocation ({silver_weight*100:.0f}%) for growth. Price: INR {price_per_gram:.0f}/g",
                    "score": 8.5,
                    "sub_asset_class": "silver"
                })
            
            logger.info(f"Commodity allocation: {len(recs)} assets, total INR {sum(r['amount'] for r in recs):,.0f}")
            return recs
            
        except Exception as e:
            logger.error(f"Error in commodity selection: {str(e)}", exc_info=True)
            return []


class FixedIncomeSelector:
    """Selects fixed income products (PPF, FD) based on detailed matrix"""
    
    def select_ppf(self, amount: float, fi_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Select PPF allocation"""
        if amount <= 0: return []
        
        recs = []
        ppf_rate = fi_data.get("ppf", {}).get("rate", 0.071)
        recs.append({
            "symbol": "PPF",
            "name": "Public Provident Fund",
            "asset_class": "ppf",
            "amount": round(amount, 2),
            "quantity": 1,
            "current_price": amount,
            "rate": ppf_rate,
            "tenure": 15,
            "rationale": f"Tax-free long-term savings at {ppf_rate*100:.1f}% p.a.",
            "score": 9.0,
            "tax_benefit": "80C + Tax-free returns"
        })
        return recs

    def select_fd(self, amount: float, fi_data: Dict[str, Any], user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Select FD allocation based on risk and horizon"""
        if amount <= 0: return []
        
        try:
            risk_score = user_profile.get("risk_score", 0.5)
            horizon = user_profile.get("investment_horizon", 5)
            age = user_profile.get("age", 30)
            is_senior = age >= 60
            
            recs = []
            
            # --- FD Matrix Allocation Logic ---
            allocation = {}

            # 1. LOW RISK (< 0.4)
            if risk_score < 0.4:
                if horizon < 3:
                    if is_senior: allocation = {"Senior_1_3y": 1.0}
                    else: allocation = {"Regular_1_3y": 1.0}
                elif horizon <= 7:
                    if is_senior: allocation = {"Senior_5_10y": 1.0}
                    else: allocation = {"Regular_5_10y": 1.0}
                else: # > 7
                    if is_senior: allocation = {"Senior_5_10y": 1.0}
                    else: allocation = {"Regular_5_10y": 1.0}

            # 2. MODERATE RISK (0.4 <= risk <= 0.7)
            elif risk_score <= 0.7:
                if horizon < 3:
                    if is_senior:
                        allocation = {"Senior_1_3y": 0.70, "Corporate_Senior_1y": 0.30}
                    else:
                        allocation = {"Regular_1_3y": 0.70, "Corporate_1y": 0.30}
                elif horizon <= 7:
                    if is_senior:
                        allocation = {"Senior_5_10y": 0.60, "Corporate_Senior_3y": 0.40}
                    else:
                        allocation = {"Regular_5_10y": 0.60, "Corporate_3y": 0.40}
                else: # > 7
                    if is_senior:
                        allocation = {"Senior_5_10y": 0.55, "Corporate_Senior_5y": 0.45}
                    else:
                        allocation = {"Regular_5_10y": 0.55, "Corporate_5y": 0.45}

            # 3. HIGH RISK (> 0.7)
            else:
                if horizon < 3:
                    if is_senior:
                        allocation = {"Senior_1_3y": 0.20, "Corporate_Senior_1y": 0.80}
                    else:
                        allocation = {"Regular_1_3y": 0.20, "Corporate_1y": 0.80}
                elif horizon <= 7:
                    if is_senior:
                        allocation = {"Senior_5_10y": 0.10, "Corporate_Senior_3y": 0.90}
                    else:
                        allocation = {"Regular_5_10y": 0.10, "Corporate_3y": 0.90}
                else: # > 7
                    if is_senior:
                        allocation = {"Senior_5_10y": 0.10, "Corporate_Senior_5y": 0.90}
                    else:
                        allocation = {"Regular_5_10y": 0.10, "Corporate_5y": 0.90}

            logger.info(f"FD Matrix Allocation: {allocation}")

            # --- Product Selection Helpers ---
            fd_rates = fi_data.get("fd_rates", {})
            regular_fds = fd_rates.get("regularFd", {})
            corporate_fds = fd_rates.get("corporateFd", [])

            def get_best_bank_fds(tenure_key, is_senior_rate, count=2):
                candidates = regular_fds.get(tenure_key, [])
                valid = []
                for c in candidates:
                    rate = c.get("seniorRate") if is_senior_rate else c.get("generalRate")
                    if rate is not None:
                        valid.append((c, rate))
                valid.sort(key=lambda x: x[1], reverse=True)
                return valid[:count]

            def get_best_corporate_fd(tenure_field, is_senior_rate):
                valid = []
                for c in corporate_fds:
                    base_rate = c.get(tenure_field)
                    if base_rate is not None:
                        rate = base_rate + (c.get("seniorBonus", 0) if is_senior_rate else 0)
                        valid.append((c, rate))
                valid.sort(key=lambda x: x[1], reverse=True)
                return valid[0] if valid else None

            # --- Execute Allocation ---
            for category, weight in allocation.items():
                alloc_amt = amount * weight
                if alloc_amt <= 0: continue

                if "Regular" in category or "Senior" in category and "Corporate" not in category:
                    # Bank FD
                    tenure_key = "tenure_1_3_years" if "1_3y" in category else "tenure_5_10_years"
                    use_senior_rate = "Senior" in category
                    
                    best_fds = get_best_bank_fds(tenure_key, use_senior_rate, count=2)
                    splits = [0.6, 0.4] if len(best_fds) > 1 else [1.0]
                    
                    for i, (fd, rate) in enumerate(best_fds):
                        split_amt = alloc_amt * splits[i]
                        recs.append({
                            "symbol": f"FD-BANK-{fd.get('bank', 'Unknown').upper().replace(' ', '-')}",
                            "name": f"{fd.get('bank')} FD ({'Senior' if use_senior_rate else 'Regular'})",
                            "asset_class": "fd",
                            "amount": round(split_amt, 2),
                            "quantity": 1,
                            "current_price": split_amt,
                            "rate": rate / 100.0,
                            "tenure": 1 if "1_3y" in category else 5,
                            "rationale": f"Top Bank FD for {category} at {rate}%",
                            "score": 8.0,
                            "bank": fd.get("bank")
                        })

                elif "Corporate" in category:
                    # Corporate FD
                    if "1y" in category: tenure_field = "oneYear"
                    elif "3y" in category: tenure_field = "threeYear"
                    else: tenure_field = "fiveYear"
                    
                    use_senior_rate = "Senior" in category
                    best_corp = get_best_corporate_fd(tenure_field, use_senior_rate)
                    
                    if best_corp:
                        fd, rate = best_corp
                        recs.append({
                            "symbol": f"FD-CORP-{fd.get('company', 'Unknown').upper().replace(' ', '-')}",
                            "name": f"{fd.get('company')} FD ({'Senior' if use_senior_rate else 'Regular'})",
                            "asset_class": "fd",
                            "amount": round(alloc_amt, 2),
                            "quantity": 1,
                            "current_price": alloc_amt,
                            "rate": rate / 100.0,
                            "tenure": 1 if "1y" in category else (3 if "3y" in category else 5),
                            "rationale": f"Best Corporate FD for {category} at {rate}% (Rating: {fd.get('creditRating')})",
                            "score": 7.5,
                            "company": fd.get("company")
                        })

            logger.info(f"FD allocation: {len(recs)} products, total INR {sum(r['amount'] for r in recs):,.0f}")
            return recs
            
        except Exception as e:
            logger.error(f"Error in FD selection: {str(e)}", exc_info=True)
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
        self.commodity_selector = CommoditySelector()
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
                logger.warning(f"total_assets missing - using fallback: INR {total_assets:,.0f}")

            macro_alloc = state.get("macro_allocation", {})
            if not macro_alloc:
                logger.error("macro_allocation missing in state!")
                return {**state, "error": "Missing macro_allocation", "asset_recommendations": {}}
            
            market_data = state.get("market_data", {}) or {}
            user_profile = state.get("user_profile", {}) or {}
            constants = state.get("constants", {})
            
            logger.info(f"Total Assets: INR {total_assets:,.0f}")
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
            logger.info(f"Stock budget: INR {stocks_amt:,.0f} ({macro_alloc.get('stocks', 0):.1%})")
            recs["stocks"] = self.stock_selector.select(
                stocks_amt, 
                get_market_data("stocks"), 
                user_profile
            )

            # 2. Crypto
            logger.info("\n--- Crypto Selection ---")
            crypto_amt = macro_alloc.get("crypto", 0) * total_assets
            logger.info(f"Crypto budget: INR {crypto_amt:,.0f} ({macro_alloc.get('crypto', 0):.1%})")
            recs["crypto"] = self.crypto_selector.select(
                crypto_amt, 
                get_market_data("crypto"), 
                user_profile
            )

            # 3. Mutual Funds
            logger.info("\n--- Mutual Fund Selection ---")
            mf_amt = macro_alloc.get("mutual_funds", 0) * total_assets
            logger.info(f"MF budget: INR {mf_amt:,.0f} ({macro_alloc.get('mutual_funds', 0):.1%})")
            recs["mutual_funds"] = self.mf_selector.select(
                mf_amt, 
                user_profile, 
                get_market_data("mutual_funds")
            )

            # 4. Commodities
            logger.info("\n--- Commodity Selection ---")
            comm_amt = macro_alloc.get("commodities", 0) * total_assets
            logger.info(f"Commodity budget: INR {comm_amt:,.0f} ({macro_alloc.get('commodities', 0):.1%})")
            recs["commodities"] = self.commodity_selector.select(comm_amt, get_market_data("commodities"), user_profile)

            # 5. Fixed Income (FD & PPF)
            logger.info("\n--- Fixed Income Selection ---")
            
            # PPF Logic with Spillover
            ppf_max_limit = 150000.0
            ppf_amt = macro_alloc.get("ppf", 0) * total_assets
            ppf_overflow = 0.0
            
            if ppf_amt > ppf_max_limit:
                ppf_overflow = ppf_amt - ppf_max_limit
                logger.warning(f"PPF allocation INR {ppf_amt:,.0f} exceeds limit. Capping at INR {ppf_max_limit:,.0f}. Overflow: INR {ppf_overflow:,.0f} -> Moving to FD.")
                ppf_amt = ppf_max_limit
            
            logger.info(f"PPF Final budget: INR {ppf_amt:,.0f}")
            recs["ppf"] = self.fi_selector.select_ppf(ppf_amt, get_market_data("fixed_income"))
            
            # FD (Base + Spillover)
            fd_base_amt = macro_alloc.get("fd", 0) * total_assets
            fd_amt = fd_base_amt + ppf_overflow
            
            if ppf_overflow > 0:
                logger.info(f"FD budget: INR {fd_base_amt:,.0f} (Base) + INR {ppf_overflow:,.0f} (PPF Overflow) = INR {fd_amt:,.0f}")
            else:
                logger.info(f"FD budget: INR {fd_amt:,.0f} ({macro_alloc.get('fd', 0):.1%})")
                
            recs["fd"] = self.fi_selector.select_fd(fd_amt, get_market_data("fixed_income"), user_profile)

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
            logger.info(f"{status} {asset_class}: Expected INR {expected_amount:,.0f}, Actual INR {actual_amount:,.0f} (Delta {diff_pct:.2f}%)")


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
            "commodities": 0.1,
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
            "commodities": {
                "gold": {"current_price_per_gram": 6000},
                "silver": {"current_price_per_gram": 75}
            },
            "fixed_income": {
                "ppf": {"rate": 0.071},
                "fd_products": [{"id": "SBI-FD", "bank": "SBI", "rate": 0.065, "tenure_options": [5]}]
            },
            "mutual_funds": {
                "MF-001": {"fund_name": "SBI Bluechip Fund", "category": "Large Cap", "returns_3y": 0.15},
                "MF-002": {"fund_name": "Kotak Emerging Equity", "category": "Mid Cap", "returns_3y": 0.18},
                "MF-003": {"fund_name": "Nippon Small Cap", "category": "Small Cap", "returns_3y": 0.25},
                "MF-004": {"fund_name": "Parag Parikh Flexi Cap", "category": "Flexi Cap", "returns_3y": 0.20},
                "MF-005": {"fund_name": "SBI Balanced Advantage", "category": "Balanced Advantage", "returns_3y": 0.12}
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
            print(f"  • {rec['name']}: INR {rec['amount']:,.0f}")
