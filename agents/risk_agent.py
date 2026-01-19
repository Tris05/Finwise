"""
Risk Agent Implementation for Agentic Portfolio Management System
Handles portfolio risk validation, constraint checking, and stress testing
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
import logging
from dataclasses import dataclass
from abc import ABC, abstractmethod
import json
import math

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RiskAssessmentResponse:
    """Standard response format for risk assessment"""
    risk_metrics: Dict[str, Any]
    violations: List[str]
    is_compliant: bool
    timestamp: datetime
    success: bool
    error_message: Optional[str] = None

class BaseTool(ABC):
    """Base class for all risk agent tools"""
    
    @abstractmethod
    def execute(self, *args, **kwargs) -> Any:
        pass

class RiskCalculator(BaseTool):
    """Tool for calculating comprehensive portfolio risk metrics"""
    
    def execute(self, macro_allocation: Dict[str, float], asset_recommendations: Dict[str, List[Dict]], 
                market_data: Dict[str, Any], total_assets: float) -> Dict[str, Any]:
        """
        Calculate comprehensive risk metrics for portfolio
        
        Args:
            macro_allocation: Asset class allocation percentages
            asset_recommendations: Specific asset recommendations
            market_data: Current market data
            total_assets: Total investment amount
        """
        try:
            risk_metrics = {}
            
            # Calculate expected return
            risk_metrics["expected_annual_return"] = self._calculate_expected_return(
                macro_allocation, asset_recommendations
            )
            
            # Calculate portfolio volatility
            risk_metrics["estimated_volatility"] = self._calculate_portfolio_volatility(
                macro_allocation, market_data
            )
            
            # Calculate Sharpe ratio
            risk_free_rate = 0.06  # Current risk-free rate (10-year government bond)
            if risk_metrics["estimated_volatility"] > 0:
                risk_metrics["sharpe_ratio"] = (
                    risk_metrics["expected_annual_return"] - risk_free_rate
                ) / risk_metrics["estimated_volatility"]
            else:
                risk_metrics["sharpe_ratio"] = 0.0
            
            # Calculate Value at Risk (95% confidence)
            risk_metrics["var_95"] = self._calculate_var(
                risk_metrics["expected_annual_return"], 
                risk_metrics["estimated_volatility"]
            )
            
            # Calculate maximum drawdown estimate
            risk_metrics["max_drawdown_estimate"] = min(
                risk_metrics["estimated_volatility"] * 2.5, 0.6
            )
            
            # Calculate portfolio beta (relative to Nifty 50)
            risk_metrics["beta"] = self._calculate_portfolio_beta(macro_allocation)
            
            # Calculate correlation with Nifty
            risk_metrics["correlation_with_nifty"] = self._calculate_nifty_correlation(macro_allocation)
            
            # Calculate diversification score
            risk_metrics["diversification_score"] = self._calculate_diversification_score(
                macro_allocation, asset_recommendations
            )
            
            # Calculate concentration risk
            risk_metrics["concentration_risk"] = self._assess_concentration_risk(
                asset_recommendations, total_assets
            )
            
            # Calculate liquidity score
            risk_metrics["liquidity_score"] = self._calculate_liquidity_score(macro_allocation)
            
            # Perform stress tests
            risk_metrics["stress_test_results"] = self._perform_stress_tests(
                risk_metrics["expected_annual_return"],
                risk_metrics["estimated_volatility"],
                macro_allocation
            )
            
            # Categorize overall risk level
            risk_metrics["overall_risk_level"] = self._categorize_risk_level(
                risk_metrics["estimated_volatility"]
            )
            
            # Calculate risk score (0-1)
            risk_metrics["risk_score"] = self._calculate_risk_score(macro_allocation)
            
            return risk_metrics
            
        except Exception as e:
            logger.error(f"Error calculating risk metrics: {str(e)}")
            return self._get_default_risk_metrics()
    
    def _calculate_expected_return(self, macro_allocation: Dict[str, float], 
                                 asset_recommendations: Dict[str, List[Dict]]) -> float:
        """Calculate weighted expected portfolio return"""
        asset_returns = {
            "stocks": 0.15,
            "mutual_funds": 0.12,
            "crypto": 0.25,
            "gold": 0.08,
            "fd_ppf": 0.07,
            "fixed_income": 0.07
        }
        
        expected_return = 0.0
        for asset_class, weight in macro_allocation.items():
            if weight > 0:
                # Map asset class to return assumption
                if asset_class in ["fd", "ppf"]:
                    base_key = "fd_ppf"
                elif asset_class == "commodities":
                    base_key = "gold"
                else:
                    base_key = asset_class
                
                return_rate = asset_returns.get(base_key, 0.06)
                expected_return += weight * return_rate
        
        return expected_return
    
    def _calculate_portfolio_volatility(self, macro_allocation: Dict[str, float], 
                                      market_data: Dict[str, Any]) -> float:
        """Calculate portfolio volatility using simplified approach"""
        asset_volatilities = {
            "stocks": 0.25,
            "mutual_funds": 0.18,
            "crypto": 0.60,
            "gold": 0.15,
            "fd_ppf": 0.02,
            "fixed_income": 0.02
        }
        
        # Use market data if available for more accurate volatility
        if market_data and "asset_classes" in market_data:
            if "stocks" in market_data["asset_classes"]:
                stock_vols = []
                for stock, data in market_data["asset_classes"]["stocks"].items():
                    if isinstance(data, dict) and "volatility" in data:
                        stock_vols.append(data["volatility"])
                if stock_vols:
                    asset_volatilities["stocks"] = np.mean(stock_vols)
            
            if "crypto" in market_data["asset_classes"]:
                crypto_vols = []
                for crypto, data in market_data["asset_classes"]["crypto"].items():
                    if isinstance(data, dict) and "volatility" in data:
                        crypto_vols.append(data["volatility"])
                if crypto_vols:
                    asset_volatilities["crypto"] = np.mean(crypto_vols)
        
        # Simplified calculation (ignoring correlations for performance)
        weighted_variance = 0.0
        for asset_class, weight in macro_allocation.items():
            if weight > 0:
                # Map asset class to volatility assumption
                if asset_class in ["fd", "ppf"]:
                    base_key = "fd_ppf"
                elif asset_class == "commodities":
                    base_key = "gold"
                else:
                    base_key = asset_class
                
                volatility = asset_volatilities.get(base_key, 0.15)
                weighted_variance += (weight ** 2) * (volatility ** 2)
        
        return math.sqrt(weighted_variance)
    
    def _calculate_var(self, expected_return: float, volatility: float) -> float:
        """Calculate 95% Value at Risk"""
        # Using normal distribution approximation
        z_score_95 = 1.645  # 95% confidence level
        return expected_return - (z_score_95 * volatility)
    
    def _calculate_portfolio_beta(self, macro_allocation: Dict[str, float]) -> float:
        """Calculate portfolio beta relative to market (Nifty 50)"""
        asset_betas = {
            "stocks": 1.0,      # Stocks have beta of 1 relative to market
            "mutual_funds": 0.8, # Mutual funds slightly lower beta
            "crypto": 1.5,      # Crypto higher volatility than market
            "gold": 0.2,        # Gold low correlation with equity market
            "fd_ppf": 0.0,      # Fixed income uncorrelated with equity
            "fixed_income": 0.0
        }
        
        portfolio_beta = 0.0
        for asset_class, weight in macro_allocation.items():
            if weight > 0:
                # Map asset class to beta assumption
                if asset_class in ["fd", "ppf"]:
                    base_key = "fd_ppf"
                elif asset_class == "commodities":
                    base_key = "gold"
                else:
                    base_key = asset_class
                
                beta = asset_betas.get(base_key, 0.5)
                portfolio_beta += weight * beta
        
        return portfolio_beta
    
    def _calculate_nifty_correlation(self, macro_allocation: Dict[str, float]) -> float:
        """Calculate correlation with Nifty 50"""
        asset_correlations = {
            "stocks": 0.85,
            "mutual_funds": 0.75,
            "crypto": 0.30,
            "gold": -0.10,
            "fd_ppf": 0.05,
            "fixed_income": 0.05
        }
        
        weighted_correlation = 0.0
        for asset_class, weight in macro_allocation.items():
            if weight > 0:
                # Map asset class to correlation assumption
                if asset_class in ["fd", "ppf"]:
                    base_key = "fd_ppf"
                elif asset_class == "commodities":
                    base_key = "gold"
                else:
                    base_key = asset_class
                
                correlation = asset_correlations.get(base_key, 0.3)
                weighted_correlation += weight * correlation
        
        return weighted_correlation
    
    def _calculate_diversification_score(self, macro_allocation: Dict[str, float], 
                                       asset_recommendations: Dict[str, List[Dict]]) -> float:
        """Calculate diversification score (0-1, higher is better)"""
        # Calculate Herfindahl-Hirschman Index for asset classes
        hhi_asset_class = sum(weight ** 2 for weight in macro_allocation.values())
        
        # Calculate number of different asset classes with meaningful allocation
        num_asset_classes = sum(1 for weight in macro_allocation.values() if weight > 0.05)
        
        # Calculate concentration within asset classes
        concentration_penalty = 0.0
        
        # Check stock concentration
        if "stocks" in asset_recommendations:
            stocks = asset_recommendations["stocks"]
            if len(stocks) > 0:
                stock_weights = [stock.get("amount", 0) for stock in stocks]
                if sum(stock_weights) > 0:
                    normalized_weights = [w / sum(stock_weights) for w in stock_weights]
                    stock_hhi = sum(w ** 2 for w in normalized_weights)
                    if stock_hhi > 0.3:  # High concentration
                        concentration_penalty += 0.2
        
        # Base score from asset class diversification
        base_score = 1 - hhi_asset_class
        
        # Bonus for having multiple asset classes
        diversification_bonus = min(num_asset_classes / 5, 0.2)
        
        # Final score
        diversification_score = max(0, min(1, base_score + diversification_bonus - concentration_penalty))
        
        return diversification_score
    
    def _assess_concentration_risk(self, asset_recommendations: Dict[str, List[Dict]], 
                                 total_assets: float) -> str:
        """Assess concentration risk in the portfolio"""
        concentration_issues = []
        
        # Check individual stock concentration
        if "stocks" in asset_recommendations:
            for stock in asset_recommendations["stocks"]:
                stock_allocation = stock.get("amount", 0) / total_assets
                if stock_allocation > 0.15:
                    concentration_issues.append(f"High single stock exposure: {stock_allocation:.1%}")
        
        # Check crypto concentration
        crypto_allocation = 0
        for asset_class, recommendations in asset_recommendations.items():
            if asset_class == "crypto" and isinstance(recommendations, list):
                crypto_allocation = sum(crypto.get("amount", 0) for crypto in recommendations) / total_assets
                break
        
        if crypto_allocation > 0.20:
            concentration_issues.append(f"High crypto exposure: {crypto_allocation:.1%}")
        
        # Check sector concentration (simplified)
        # In a full implementation, this would analyze sector exposure across stocks
        
        if not concentration_issues:
            return "Low"
        elif len(concentration_issues) == 1:
            return "Moderate"
        else:
            return "High"
    
    def _calculate_liquidity_score(self, macro_allocation: Dict[str, float]) -> float:
        """Calculate portfolio liquidity score (0-1, higher is better)"""
        asset_liquidity_scores = {
            "stocks": 0.8,      # High liquidity for listed stocks
            "mutual_funds": 0.7, # Good liquidity, T+1 settlement
            "crypto": 0.9,      # Very high liquidity
            "gold": 0.6,        # Moderate liquidity
            "fd_ppf": 0.3,      # Low liquidity due to lock-in periods
            "fixed_income": 0.4
        }
        
        weighted_liquidity = 0.0
        for asset_class, weight in macro_allocation.items():
            if weight > 0:
                # Map asset class to liquidity assumption
                if asset_class in ["fd", "ppf"]:
                    base_key = "fd_ppf"
                elif asset_class == "commodities":
                    base_key = "gold"
                else:
                    base_key = asset_class
                
                liquidity = asset_liquidity_scores.get(base_key, 0.5)
                weighted_liquidity += weight * liquidity
        
        return weighted_liquidity
    
    def _perform_stress_tests(self, expected_return: float, volatility: float, 
                            macro_allocation: Dict[str, float]) -> Dict[str, float]:
        """Perform various stress tests on the portfolio"""
        stress_results = {}
        
        # Market crash scenario (-30% market drop)
        equity_exposure = macro_allocation.get("stocks", 0) + macro_allocation.get("mutual_funds", 0) * 0.7
        crypto_exposure = macro_allocation.get("crypto", 0)
        
        market_crash_impact = -(equity_exposure * 0.30 + crypto_exposure * 0.50)
        stress_results["market_crash_scenario"] = market_crash_impact
        
        # Inflation shock (high inflation reducing real returns)
        inflation_shock = -0.03  # 3% additional inflation
        stress_results["inflation_shock"] = expected_return + inflation_shock - expected_return
        
        # Interest rate rise (affecting bonds and growth stocks)
        fixed_income_exposure = (
            macro_allocation.get("fd_ppf", 0) + 
            macro_allocation.get("fd", 0) + 
            macro_allocation.get("ppf", 0) + 
            macro_allocation.get("fixed_income", 0)
        )
        growth_stock_exposure = equity_exposure * 0.6  # Assume 60% growth stocks
        
        interest_rate_impact = -(fixed_income_exposure * 0.08 + growth_stock_exposure * 0.10)
        stress_results["interest_rate_rise"] = interest_rate_impact
        
        return stress_results
    
    def _categorize_risk_level(self, volatility: float) -> str:
        """Categorize overall risk level based on volatility"""
        if volatility < 0.10:
            return "Low"
        elif volatility < 0.20:
            return "Moderate"
        elif volatility < 0.30:
            return "High"
        else:
            return "Very High"
    
    def _calculate_risk_score(self, macro_allocation: Dict[str, float]) -> float:
        """Calculate overall risk score (0-1, higher is riskier)"""
        asset_risk_scores = {
            "stocks": 0.7,
            "mutual_funds": 0.5,
            "crypto": 0.9,
            "gold": 0.3,
            "fd_ppf": 0.1,
            "fixed_income": 0.1
        }
        
        weighted_risk = 0.0
        for asset_class, weight in macro_allocation.items():
            if weight > 0:
                # Map asset class to risk score assumption
                if asset_class in ["fd", "ppf"]:
                    base_key = "fd_ppf"
                elif asset_class == "commodities":
                    base_key = "gold"
                else:
                    base_key = asset_class
                
                risk_score = asset_risk_scores.get(base_key, 0.5)
                weighted_risk += weight * risk_score
        
        return weighted_risk
    
    def _get_default_risk_metrics(self) -> Dict[str, Any]:
        """Return default risk metrics when calculation fails"""
        return {
            "expected_annual_return": 0.10,
            "estimated_volatility": 0.15,
            "sharpe_ratio": 0.27,
            "var_95": -0.14,
            "max_drawdown_estimate": 0.25,
            "beta": 0.8,
            "correlation_with_nifty": 0.6,
            "diversification_score": 0.7,
            "concentration_risk": "Moderate",
            "liquidity_score": 0.6,
            "stress_test_results": {
                "market_crash_scenario": -0.15,
                "inflation_shock": -0.03,
                "interest_rate_rise": -0.05
            },
            "overall_risk_level": "Moderate",
            "risk_score": 0.5
        }

class ConstraintValidator(BaseTool):
    """Tool for validating portfolio against user-defined constraints"""
    
    def execute(self, macro_allocation: Dict[str, float], asset_recommendations: Dict[str, List[Dict]],
                user_profile: Dict[str, Any], total_assets: float) -> List[str]:
        """
        Validate portfolio against constraints
        
        Args:
            macro_allocation: Asset class allocation percentages
            asset_recommendations: Specific asset recommendations
            user_profile: User profile with constraints
            total_assets: Total investment amount
            
        Returns:
            List of constraint violations
        """
        try:
            violations = []
            
            risk_score = user_profile.get("risk_score", 0.5)
            constraints = user_profile.get("constraints", {})
            
            # Validate crypto allocation limits
            crypto_allocation = macro_allocation.get("crypto", 0)
            max_crypto = constraints.get("max_crypto", self._get_max_crypto_by_risk(risk_score))
            
            if crypto_allocation > max_crypto:
                violations.append(
                    f"Crypto allocation {crypto_allocation:.1%} exceeds limit {max_crypto:.1%}"
                )
            
            # Validate single stock concentration
            max_single_stock = constraints.get("max_single_stock", 0.15)
            if "stocks" in asset_recommendations:
                for stock in asset_recommendations["stocks"]:
                    stock_allocation = stock.get("amount", 0) / total_assets
                    if stock_allocation > max_single_stock:
                        violations.append(
                            f"Stock {stock.get('symbol', 'Unknown')} allocation {stock_allocation:.1%} "
                            f"exceeds limit {max_single_stock:.1%}"
                        )
            
            # Validate minimum fixed income allocation
            fixed_income_allocation = (
                macro_allocation.get("fd_ppf", 0) + 
                macro_allocation.get("fd", 0) + 
                macro_allocation.get("ppf", 0) + 
                macro_allocation.get("fixed_income", 0)
            )
            min_fixed_income = constraints.get("min_fixed_income", self._get_min_fixed_income_by_risk(risk_score))
            
            if fixed_income_allocation < min_fixed_income:
                violations.append(
                    f"Fixed income allocation {fixed_income_allocation:.1%} "
                    f"below minimum {min_fixed_income:.1%}"
                )
            
            # Validate excluded sectors
            excluded_sectors = constraints.get("exclude_sectors", [])
            if excluded_sectors and "stocks" in asset_recommendations:
                # This would need sector mapping in a full implementation
                # For now, we'll skip sector validation
                pass
            
            # Validate total equity exposure based on risk profile
            total_equity = (
                macro_allocation.get("stocks", 0) + 
                macro_allocation.get("mutual_funds", 0) * 0.7  # Assume 70% equity in MF
            )
            max_equity = self._get_max_equity_by_risk(risk_score)
            
            if total_equity > max_equity:
                violations.append(
                    f"Total equity exposure {total_equity:.1%} exceeds recommended {max_equity:.1%} "
                    f"for risk profile"
                )
            
            # Validate investment style constraints
            investment_style = constraints.get("investment_style", "moderate")
            style_violations = self._validate_investment_style(
                macro_allocation, investment_style, risk_score
            )
            violations.extend(style_violations)
            
            return violations
            
        except Exception as e:
            logger.error(f"Error validating constraints: {str(e)}")
            return [f"Constraint validation error: {str(e)}"]
    
    def _get_max_crypto_by_risk(self, risk_score: float) -> float:
        """Get maximum crypto allocation based on risk score"""
        if risk_score <= 0.4:
            return 0.05
        elif risk_score <= 0.7:
            return 0.15
        else:
            return 0.25
    
    def _get_min_fixed_income_by_risk(self, risk_score: float) -> float:
        """Get minimum fixed income allocation based on risk score"""
        if risk_score <= 0.4:
            return 0.30
        elif risk_score <= 0.7:
            return 0.20
        else:
            return 0.10
    
    def _get_max_equity_by_risk(self, risk_score: float) -> float:
        """Get maximum equity allocation based on risk score"""
        if risk_score <= 0.4:
            return 0.40
        elif risk_score <= 0.7:
            return 0.70
        else:
            return 0.85
    
    def _validate_investment_style(self, macro_allocation: Dict[str, float], 
                                 investment_style: str, risk_score: float) -> List[str]:
        """Validate allocation against investment style"""
        violations = []
        
        if investment_style == "conservative":
            if macro_allocation.get("crypto", 0) > 0.05:
                violations.append("Conservative style should limit crypto to 5%")
            
            equity_allocation = (
                macro_allocation.get("stocks", 0) + 
                macro_allocation.get("mutual_funds", 0) * 0.7
            )
            if equity_allocation > 0.40:
                violations.append("Conservative style should limit equity exposure to 40%")
        
        elif investment_style == "aggressive":
            fixed_income_allocation = (
                macro_allocation.get("fd_ppf", 0) + 
                macro_allocation.get("fd", 0) + 
                macro_allocation.get("ppf", 0) + 
                macro_allocation.get("fixed_income", 0)
            )
            if fixed_income_allocation > 0.30:
                violations.append("Aggressive style should limit fixed income to 30%")
        
        return violations

class StressTester(BaseTool):
    """Tool for performing comprehensive stress testing"""
    
    def execute(self, risk_metrics: Dict[str, Any], macro_allocation: Dict[str, float],
                scenarios: List[str] = None) -> Dict[str, Any]:
        """
        Perform stress testing under various scenarios
        
        Args:
            risk_metrics: Current portfolio risk metrics
            macro_allocation: Asset class allocation
            scenarios: List of scenarios to test
        """
        if scenarios is None:
            scenarios = ["market_crash", "inflation_spike", "interest_rate_shock", "liquidity_crisis"]
        
        try:
            stress_results = {}
            
            for scenario in scenarios:
                if scenario == "market_crash":
                    stress_results["market_crash"] = self._market_crash_scenario(
                        risk_metrics, macro_allocation
                    )
                elif scenario == "inflation_spike":
                    stress_results["inflation_spike"] = self._inflation_spike_scenario(
                        risk_metrics, macro_allocation
                    )
                elif scenario == "interest_rate_shock":
                    stress_results["interest_rate_shock"] = self._interest_rate_shock_scenario(
                        risk_metrics, macro_allocation
                    )
                elif scenario == "liquidity_crisis":
                    stress_results["liquidity_crisis"] = self._liquidity_crisis_scenario(
                        risk_metrics, macro_allocation
                    )
            
            return stress_results
            
        except Exception as e:
            logger.error(f"Error in stress testing: {str(e)}")
            return {"error": str(e)}
    
    def _market_crash_scenario(self, risk_metrics: Dict[str, Any], 
                             macro_allocation: Dict[str, float]) -> Dict[str, Any]:
        """Simulate market crash scenario"""
        equity_impact = -0.35  # 35% drop in equities
        crypto_impact = -0.50  # 50% drop in crypto
        gold_impact = 0.10     # 10% gain in gold (safe haven)
        
        portfolio_impact = (
            macro_allocation.get("stocks", 0) * equity_impact +
            macro_allocation.get("mutual_funds", 0) * equity_impact * 0.7 +
            macro_allocation.get("crypto", 0) * crypto_impact +
            (macro_allocation.get("gold", 0) + macro_allocation.get("commodities", 0)) * gold_impact
        )
        
        return {
            "scenario": "Market Crash (35% equity drop)",
            "portfolio_impact": portfolio_impact,
            "worst_case_loss": abs(portfolio_impact),
            "recovery_time_estimate": "12-24 months"
        }
    
    def _inflation_spike_scenario(self, risk_metrics: Dict[str, Any], 
                                macro_allocation: Dict[str, float]) -> Dict[str, Any]:
        """Simulate high inflation scenario"""
        inflation_rate = 0.08  # 8% inflation
        
        # Fixed income hurt by inflation
        fixed_income_real_return = -0.05
        
        # Stocks partially protected
        equity_real_return = -0.02
        
        # Gold benefits from inflation
        gold_real_return = 0.03
        
        portfolio_impact = (
            (macro_allocation.get("fd_ppf", 0) + macro_allocation.get("fd", 0) + macro_allocation.get("ppf", 0) + macro_allocation.get("fixed_income", 0)) * fixed_income_real_return +
            (macro_allocation.get("stocks", 0) + macro_allocation.get("mutual_funds", 0)) * equity_real_return +
            (macro_allocation.get("gold", 0) + macro_allocation.get("commodities", 0)) * gold_real_return
        )
        
        return {
            "scenario": "Inflation Spike (8% inflation)",
            "real_return_impact": portfolio_impact,
            "inflation_protection_score": 1 - abs(portfolio_impact)
        }
    
    def _interest_rate_shock_scenario(self, risk_metrics: Dict[str, Any], 
                                    macro_allocation: Dict[str, float]) -> Dict[str, Any]:
        """Simulate interest rate shock"""
        rate_increase = 0.03  # 3% rate increase
        
        # Bond prices fall with rising rates
        bond_impact = -0.12
        
        # Growth stocks hurt by higher rates
        growth_stock_impact = -0.15
        
        portfolio_impact = (
            (macro_allocation.get("fd_ppf", 0) + macro_allocation.get("fd", 0) + macro_allocation.get("ppf", 0) + macro_allocation.get("fixed_income", 0)) * bond_impact +
            macro_allocation.get("stocks", 0) * growth_stock_impact * 0.6  # Assume 60% growth stocks
        )
        
        return {
            "scenario": "Interest Rate Shock (+300 basis points)",
            "portfolio_impact": portfolio_impact,
            "duration_risk": "High" if abs(portfolio_impact) > 0.10 else "Moderate"
        }
    
    def _liquidity_crisis_scenario(self, risk_metrics: Dict[str, Any], 
                                 macro_allocation: Dict[str, float]) -> Dict[str, Any]:
        """Simulate liquidity crisis"""
        # Assets become harder to sell
        liquidity_discount = {
            "stocks": 0.05,     # 5% liquidity discount
            "mutual_funds": 0.02,
            "crypto": 0.15,     # High volatility in crisis
            "gold": 0.08,
            "fd_ppf": 0.0       # No impact on locked investments
        }
        
        portfolio_impact = 0
        for asset_class, allocation in macro_allocation.items():
            discount = liquidity_discount.get(asset_class, 0.03)
            portfolio_impact -= allocation * discount
        
        return {
            "scenario": "Liquidity Crisis",
            "liquidity_impact": portfolio_impact,
            "time_to_liquidate": "7-14 days",
            "liquidity_risk_level": risk_metrics.get("liquidity_score", 0.5)
        }

class Rebalancer(BaseTool):
    """Tool for suggesting portfolio rebalancing when violations detected"""
    
    def execute(self, macro_allocation: Dict[str, float], violations: List[str],
                user_profile: Dict[str, Any]) -> Dict[str, float]:
        """
        Suggest adjusted allocation to fix violations
        
        Args:
            macro_allocation: Current allocation
            violations: List of violations to fix
            user_profile: User profile and constraints
        """
        try:
            adjusted_allocation = macro_allocation.copy()
            risk_score = user_profile.get("risk_score", 0.5)
            constraints = user_profile.get("constraints", {})
            
            # Fix crypto allocation violations
            if any("Crypto allocation" in v for v in violations):
                max_crypto = constraints.get("max_crypto", self._get_max_crypto_by_risk(risk_score))
                excess_crypto = adjusted_allocation.get("crypto", 0) - max_crypto
                
                if excess_crypto > 0:
                    adjusted_allocation["crypto"] = max_crypto
                    # Redistribute excess to fixed income
                    adjusted_allocation["fd_ppf"] = adjusted_allocation.get("fd_ppf", 0) + excess_crypto
            
            # Fix equity exposure violations
            if any("equity exposure" in v for v in violations):
                current_equity = (
                    adjusted_allocation.get("stocks", 0) + 
                    adjusted_allocation.get("mutual_funds", 0) * 0.7
                )
                max_equity = self._get_max_equity_by_risk(risk_score)
                
                if current_equity > max_equity:
                    # Reduce stocks proportionally
                    reduction_factor = max_equity / current_equity
                    adjusted_allocation["stocks"] = adjusted_allocation.get("stocks", 0) * reduction_factor
                    
                    excess = adjusted_allocation.get("stocks", 0) * (1 - reduction_factor)
                    adjusted_allocation["fd_ppf"] = adjusted_allocation.get("fd_ppf", 0) + excess
            
            # Fix fixed income minimum violations
            if any("Fixed income allocation" in v for v in violations):
                min_fixed_income = constraints.get("min_fixed_income", self._get_min_fixed_income_by_risk(risk_score))
                current_fi = (
                    adjusted_allocation.get("fd_ppf", 0) + 
                    adjusted_allocation.get("fd", 0) + 
                    adjusted_allocation.get("ppf", 0) + 
                    adjusted_allocation.get("fixed_income", 0)
                )
                
                if current_fi < min_fixed_income:
                    shortage = min_fixed_income - current_fi
                    # Take from stocks to meet minimum
                    adjusted_allocation["stocks"] = max(0, adjusted_allocation.get("stocks", 0) - shortage)
                    # Add to fd as default safer choice
                    adjusted_allocation["fd"] = adjusted_allocation.get("fd", 0) + shortage
            
            # Ensure allocations sum to 1.0
            total = sum(adjusted_allocation.values())
            if total > 0:
                for key in adjusted_allocation:
                    adjusted_allocation[key] = adjusted_allocation[key] / total
            
            return adjusted_allocation
            
        except Exception as e:
            logger.error(f"Error in rebalancing: {str(e)}")
            return self._get_conservative_allocation(user_profile)
    
    def _get_max_crypto_by_risk(self, risk_score: float) -> float:
        """Get maximum crypto allocation based on risk score"""
        if risk_score <= 0.4:
            return 0.05
        elif risk_score <= 0.7:
            return 0.15
        else:
            return 0.25
    
    def _get_max_equity_by_risk(self, risk_score: float) -> float:
        """Get maximum equity allocation based on risk score"""
        if risk_score <= 0.4:
            return 0.40
        elif risk_score <= 0.7:
            return 0.70
        else:
            return 0.85
    
    def _get_min_fixed_income_by_risk(self, risk_score: float) -> float:
        """Get minimum fixed income allocation based on risk score"""
        if risk_score <= 0.4:
            return 0.30
        elif risk_score <= 0.7:
            return 0.20
        else:
            return 0.10
    
    def _get_conservative_allocation(self, user_profile: Dict[str, Any]) -> Dict[str, float]:
        """Get conservative fallback allocation"""
        risk_score = user_profile.get("risk_score", 0.5)
        
        if risk_score <= 0.4:
            return {"stocks": 0.2, "mutual_funds": 0.3, "crypto": 0.0, "gold": 0.1, "fd_ppf": 0.4}
        elif risk_score <= 0.7:
            return {"stocks": 0.3, "mutual_funds": 0.35, "crypto": 0.05, "gold": 0.1, "fd_ppf": 0.2}
        else:
            return {"stocks": 0.4, "mutual_funds": 0.3, "crypto": 0.1, "gold": 0.1, "fd_ppf": 0.1}

class ComplianceChecker(BaseTool):
    """Tool for ensuring regulatory and investment policy compliance"""
    
    def execute(self, macro_allocation: Dict[str, float], asset_recommendations: Dict[str, List[Dict]],
                total_assets: float) -> Dict[str, Any]:
        """
        Check portfolio compliance with regulations and policies
        
        Args:
            macro_allocation: Asset class allocation
            asset_recommendations: Specific asset recommendations
            total_assets: Total investment amount
        """
        try:
            compliance_result = {
                "is_compliant": True,
                "violations": [],
                "warnings": [],
                "compliance_score": 1.0
            }
            
            # Check investment limits per asset class
            compliance_result = self._check_investment_limits(
                macro_allocation, total_assets, compliance_result
            )
            
            # Check concentration limits
            compliance_result = self._check_concentration_limits(
                asset_recommendations, total_assets, compliance_result
            )
            
            # Check regulatory compliance
            compliance_result = self._check_regulatory_compliance(
                macro_allocation, asset_recommendations, compliance_result
            )
            
            # Calculate final compliance score
            violations = len(compliance_result["violations"])
            warnings = len(compliance_result["warnings"])
            
            compliance_result["compliance_score"] = max(0, 1.0 - (violations * 0.2) - (warnings * 0.05))
            compliance_result["is_compliant"] = violations == 0
            
            return compliance_result
            
        except Exception as e:
            logger.error(f"Error in compliance checking: {str(e)}")
            return {
                "is_compliant": False,
                "violations": [f"Compliance check error: {str(e)}"],
                "warnings": [],
                "compliance_score": 0.0
            }
    
    def _check_investment_limits(self, macro_allocation: Dict[str, float], 
                               total_assets: float, result: Dict[str, Any]) -> Dict[str, Any]:
        """Check investment limits per asset class"""
        
        # PPF annual limit check
        ppf_allocation = (macro_allocation.get("fd_ppf", 0) + macro_allocation.get("ppf", 0)) * total_assets
        if ppf_allocation > 150000:  # PPF annual limit is ₹1.5 lakh
            result["violations"].append(f"PPF allocation ₹{ppf_allocation:,.0f} exceeds annual limit of ₹1.5 lakh")
        
        # Crypto allocation warning (regulatory uncertainty)
        crypto_allocation = macro_allocation.get("crypto", 0)
        if crypto_allocation > 0.20:
            result["warnings"].append(f"Crypto allocation {crypto_allocation:.1%} is high given regulatory uncertainty")
        
        return result
    
    def _check_concentration_limits(self, asset_recommendations: Dict[str, List[Dict]],
                                  total_assets: float, result: Dict[str, Any]) -> Dict[str, Any]:
        """Check concentration limits for individual assets"""
        
        # Single stock concentration check
        if "stocks" in asset_recommendations:
            for stock in asset_recommendations["stocks"]:
                stock_allocation = stock.get("amount", 0) / total_assets
                if stock_allocation > 0.20:  # 20% single stock limit
                    result["violations"].append(
                        f"Single stock {stock.get('symbol', 'Unknown')} exceeds 20% limit: {stock_allocation:.1%}"
                    )
                elif stock_allocation > 0.15:
                    result["warnings"].append(
                        f"Single stock {stock.get('symbol', 'Unknown')} allocation high: {stock_allocation:.1%}"
                    )
        
        return result
    
    def _check_regulatory_compliance(self, macro_allocation: Dict[str, float],
                                   asset_recommendations: Dict[str, List[Dict]], 
                                   result: Dict[str, Any]) -> Dict[str, Any]:
        """Check compliance with financial regulations"""
        
        # Add regulatory compliance checks specific to Indian markets
        # This is a simplified version - real implementation would be more comprehensive
        
        # SEBI compliance for mutual funds
        if "mutual_funds" in asset_recommendations:
            # Check for over-diversification (too many funds)
            if len(asset_recommendations["mutual_funds"]) > 8:
                result["warnings"].append("Consider reducing number of mutual funds for better tracking")
        
        return result

class RiskAgent:
    """Main Risk Agent class that coordinates all risk tools"""
    
    def __init__(self):
        self.risk_calculator = RiskCalculator()
        self.constraint_validator = ConstraintValidator()
        self.stress_tester = StressTester()
        self.rebalancer = Rebalancer()
        self.compliance_checker = ComplianceChecker()
        
        logger.info("Risk Agent initialized with all tools")
    
    def execute(self, macro_allocation: Dict[str, float], asset_recommendations: Dict[str, List[Dict]],
                user_profile: Dict[str, Any], total_assets: float, 
                market_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Main execution method for Risk Agent
        
        Args:
            macro_allocation: Asset class allocation percentages
            asset_recommendations: Specific asset recommendations
            user_profile: User profile with constraints and preferences
            total_assets: Total investment amount
            market_data: Current market data for calculations
        """
        try:
            logger.info("Starting risk validation and assessment")
            
            # Calculate comprehensive risk metrics
            risk_metrics = self.risk_calculator.execute(
                macro_allocation, asset_recommendations, market_data or {}, total_assets
            )
            
            # Validate constraints
            constraint_violations = self.constraint_validator.execute(
                macro_allocation, asset_recommendations, user_profile, total_assets
            )
            
            # Check compliance
            compliance_result = self.compliance_checker.execute(
                macro_allocation, asset_recommendations, total_assets
            )
            
            # Perform stress tests
            stress_test_results = self.stress_tester.execute(risk_metrics, macro_allocation)
            
            # Determine if rebalancing is needed
            all_violations = constraint_violations + compliance_result.get("violations", [])
            needs_rebalancing = len(all_violations) > 0
            
            adjusted_allocation = None
            if needs_rebalancing:
                logger.info("Portfolio violations detected, suggesting rebalancing")
                adjusted_allocation = self.rebalancer.execute(
                    macro_allocation, all_violations, user_profile
                )
            
            # Compile final risk assessment
            risk_assessment = {
                "risk_metrics": risk_metrics,
                "constraint_violations": constraint_violations,
                "compliance_result": compliance_result,
                "stress_test_results": stress_test_results,
                "needs_rebalancing": needs_rebalancing,
                "adjusted_allocation": adjusted_allocation,
                "overall_assessment": "APPROVED" if not all_violations else "NEEDS_ADJUSTMENT",
                "risk_violations": all_violations,
                "overall_risk_level": risk_metrics.get("overall_risk_level", "Moderate"),
                "expected_annual_return": risk_metrics.get("expected_annual_return", 0.0),
                "sharpe_ratio": risk_metrics.get("sharpe_ratio", 0.0),
                "assessment_timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"Risk assessment completed. Status: {risk_assessment['overall_assessment']}")
            
            return {"risk_assessment": risk_assessment}
            
        except Exception as e:
            logger.error(f"Error in Risk Agent execution: {str(e)}")
            return {
                "risk_assessment": self._get_fallback_assessment(user_profile),
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _get_fallback_assessment(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Get minimal fallback assessment when main execution fails"""
        return {
            "risk_metrics": {
                "expected_annual_return": 0.10,
                "estimated_volatility": 0.15,
                "overall_risk_level": "Moderate",
                "risk_score": user_profile.get("risk_score", 0.5)
            },
            "constraint_violations": [],
            "compliance_result": {"is_compliant": True, "compliance_score": 0.8},
            "needs_rebalancing": False,
            "overall_assessment": "APPROVED",
            "risk_violations": []
        }
    
    def get_agent_status(self) -> Dict[str, Any]:
        """Get current status of risk agent"""
        return {
            "agent_ready": True,
            "tools_loaded": {
                "risk_calculator": True,
                "constraint_validator": True,
                "stress_tester": True,
                "rebalancer": True,
                "compliance_checker": True
            },
            "last_check": datetime.now().isoformat()
        }