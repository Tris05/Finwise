"""
Data Agent Implementation for Agentic Portfolio Management System
Handles market data collection, processing, and validation
"""

import yfinance as yf
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import time
import json
import hashlib
from dataclasses import dataclass
import logging
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MarketDataResponse:
    """Standard response format for market data"""
    data: Dict[str, Any]
    timestamp: datetime
    source: str
    success: bool
    error_message: Optional[str] = None

class BaseTool(ABC):
    """Base class for all data agent tools"""
    
    @abstractmethod
    def execute(self, *args, **kwargs) -> Any:
        pass

class MarketDataFetcher(BaseTool):
    """Tool for fetching market data from various APIs"""
    
    def __init__(self):
        self.indian_stocks = [
            "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", 
            "ICICIBANK.NS", "HINDUNILVR.NS", "SBIN.NS", "BHARTIARTL.NS"
        ]
        self.crypto_symbols = ["bitcoin", "ethereum", "binancecoin", "cardano", "solana"]
        
    def execute(self, data_types: List[str] = None) -> MarketDataResponse:
        """
        Fetch market data for specified data types
        
        Args:
            data_types: List of data types to fetch ['stocks', 'crypto', 'gold', 'fixed_income']
        """
        if data_types is None:
            data_types = ['stocks', 'crypto', 'gold', 'fixed_income']
        
        try:
            market_data = {}
            
            if 'stocks' in data_types:
                market_data['stocks'] = self.fetch_stock_data()
            
            if 'crypto' in data_types:
                market_data['crypto'] = self.fetch_crypto_data()
            
            if 'gold' in data_types:
                market_data['gold'] = self.fetch_gold_data()
            
            if 'fixed_income' in data_types:
                market_data['fixed_income'] = self.fetch_fixed_income_data()
            
            return MarketDataResponse(
                data=market_data,
                timestamp=datetime.now(),
                source="MarketDataFetcher",
                success=True
            )
            
        except Exception as e:
            logger.error(f"Error fetching market data: {str(e)}")
            return MarketDataResponse(
                data={},
                timestamp=datetime.now(),
                source="MarketDataFetcher",
                success=False,
                error_message=str(e)
            )
    
    def fetch_stock_data(self) -> Dict[str, Any]:
        """Fetch Indian stock data using yfinance"""
        stock_data = {}
        
        try:
            for symbol in self.indian_stocks:
                try:
                    ticker = yf.Ticker(symbol)
                    # Get 1 month of data for performance
                    hist = ticker.history(period="1mo")
                    
                    if not hist.empty:
                        # Calculate basic metrics
                        returns = hist['Close'].pct_change().dropna()
                        
                        stock_data[symbol] = {
                            "symbol": symbol,
                            "current_price": float(hist['Close'].iloc[-1]),
                            "previous_close": float(hist['Close'].iloc[-2]) if len(hist) > 1 else float(hist['Close'].iloc[-1]),
                            "daily_change": float(returns.iloc[-1]) if len(returns) > 0 else 0.0,
                            "volatility": float(returns.std()) if len(returns) > 1 else 0.1,
                            "mean_return": float(returns.mean()) if len(returns) > 0 else 0.0,
                            "volume": int(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0,
                            "high_52w": float(hist['High'].max()),
                            "low_52w": float(hist['Low'].min()),
                            "data_points": len(hist),
                            "last_updated": datetime.now().isoformat()
                        }
                    
                except Exception as e:
                    logger.warning(f"Failed to fetch data for {symbol}: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error in stock data fetching: {str(e)}")
            
        return stock_data
    
    def fetch_crypto_data(self) -> Dict[str, Any]:
        """Fetch cryptocurrency data using CoinGecko API"""
        crypto_data = {}
        
        try:
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                "ids": ",".join(self.crypto_symbols),
                "vs_currencies": "inr,usd",
                "include_24hr_change": "true",
                "include_market_cap": "true",
                "include_24hr_vol": "true"
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                for symbol in self.crypto_symbols:
                    if symbol in data:
                        crypto_info = data[symbol]
                        crypto_data[symbol] = {
                            "symbol": symbol,
                            "current_price_inr": crypto_info.get("inr", 0),
                            "current_price_usd": crypto_info.get("usd", 0),
                            "daily_change": crypto_info.get("inr_24h_change", 0) / 100,  # Convert to decimal
                            "market_cap": crypto_info.get("inr_market_cap", 0),
                            "volume_24h": crypto_info.get("inr_24h_vol", 0),
                            "volatility": abs(crypto_info.get("inr_24h_change", 10)) / 100,  # Rough volatility estimate
                            "last_updated": datetime.now().isoformat()
                        }
            else:
                logger.warning(f"CoinGecko API returned status code: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error fetching crypto data: {str(e)}")
            # Return default data if API fails
            crypto_data = self._get_default_crypto_data()
            
        return crypto_data
    
    def fetch_gold_data(self) -> Dict[str, Any]:
        """Fetch gold price data"""
        gold_data = {}
        
        try:
            # Try multiple gold APIs for reliability
            apis = [
                "https://api.metals.live/v1/spot/gold",
                "https://api.goldapi.io/api/XAU/INR"  # Alternative API
            ]
            
            for api_url in apis:
                try:
                    response = requests.get(api_url, timeout=5)
                    if response.status_code == 200:
                        data = response.json()
                        
                        # Parse response based on API structure
                        if "metals.live" in api_url:
                            price = data.get("price", 5500)
                        else:
                            price = data.get("price", 5500)
                        
                        gold_data = {
                            "current_price_per_gram": float(price),
                            "currency": "INR",
                            "daily_change": 0.002,  # Default small change
                            "volatility": 0.15,
                            "last_updated": datetime.now().isoformat(),
                            "source": api_url
                        }
                        break
                        
                except Exception as e:
                    logger.warning(f"Gold API {api_url} failed: {str(e)}")
                    continue
            
            # Fallback to default if all APIs fail
            if not gold_data:
                gold_data = {
                    "current_price_per_gram": 5500.0,  # Default INR price
                    "currency": "INR",
                    "daily_change": 0.002,
                    "volatility": 0.15,
                    "last_updated": datetime.now().isoformat(),
                    "source": "default_fallback"
                }
                
        except Exception as e:
            logger.error(f"Error fetching gold data: {str(e)}")
            gold_data = {
                "current_price_per_gram": 5500.0,
                "currency": "INR",
                "daily_change": 0.0,
                "volatility": 0.15,
                "last_updated": datetime.now().isoformat(),
                "source": "error_fallback"
            }
            
        return gold_data
    
    def fetch_fixed_income_data(self) -> Dict[str, Any]:
        """Fetch fixed income rates (PPF, FD, etc.)"""
        fixed_income_data = {
            "ppf": {
                "rate": 0.071,  # Current PPF rate 7.1%
                "tenure": 15,
                "tax_benefit": True,
                "minimum_investment": 500,
                "maximum_investment": 150000,
                "last_updated": datetime.now().isoformat()
            },
            "fd_sbi": {
                "rate": 0.065,  # SBI FD rate
                "tenure_options": [1, 2, 3, 5],
                "minimum_investment": 1000,
                "bank": "SBI",
                "last_updated": datetime.now().isoformat()
            },
            "fd_hdfc": {
                "rate": 0.067,  # HDFC FD rate
                "tenure_options": [1, 2, 3, 5],
                "minimum_investment": 5000,
                "bank": "HDFC",
                "last_updated": datetime.now().isoformat()
            },
            "nsc": {
                "rate": 0.068,  # NSC rate
                "tenure": 5,
                "tax_benefit": True,
                "minimum_investment": 1000,
                "last_updated": datetime.now().isoformat()
            }
        }
        
        return fixed_income_data
    
    def _get_default_crypto_data(self) -> Dict[str, Any]:
        """Default crypto data when API fails"""
        return {
            "bitcoin": {
                "symbol": "bitcoin",
                "current_price_inr": 3500000,
                "current_price_usd": 43000,
                "daily_change": 0.02,
                "market_cap": 850000000000,
                "volume_24h": 25000000000,
                "volatility": 0.45,
                "last_updated": datetime.now().isoformat()
            },
            "ethereum": {
                "symbol": "ethereum", 
                "current_price_inr": 200000,
                "current_price_usd": 2500,
                "daily_change": 0.015,
                "market_cap": 300000000000,
                "volume_24h": 15000000000,
                "volatility": 0.50,
                "last_updated": datetime.now().isoformat()
            }
        }

class DataProcessor(BaseTool):
    """Tool for processing and normalizing market data"""
    
    def execute(self, raw_data: Dict[str, Any], user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process raw market data into structured format
        
        Args:
            raw_data: Raw market data from MarketDataFetcher
            user_profile: User preferences and constraints
        """
        try:
            processed_data = {
                "processed_timestamp": datetime.now().isoformat(),
                "user_profile": user_profile,
                "asset_classes": {}
            }
            
            # Process stocks
            if "stocks" in raw_data:
                processed_data["asset_classes"]["stocks"] = self._process_stocks(raw_data["stocks"])
            
            # Process crypto
            if "crypto" in raw_data:
                processed_data["asset_classes"]["crypto"] = self._process_crypto(raw_data["crypto"])
            
            # Process gold
            if "gold" in raw_data:
                processed_data["asset_classes"]["gold"] = self._process_gold(raw_data["gold"])
            
            # Process fixed income
            if "fixed_income" in raw_data:
                processed_data["asset_classes"]["fixed_income"] = self._process_fixed_income(raw_data["fixed_income"])
            
            # Calculate correlation matrix
            processed_data["correlations"] = self._calculate_correlations(processed_data["asset_classes"])
            
            # Add market summary
            processed_data["market_summary"] = self._generate_market_summary(processed_data["asset_classes"])
            
            return processed_data
            
        except Exception as e:
            logger.error(f"Error processing data: {str(e)}")
            return {"error": str(e), "processed_timestamp": datetime.now().isoformat()}
    
    def _process_stocks(self, stock_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process stock data"""
        processed_stocks = {}
        
        for symbol, data in stock_data.items():
            # Calculate additional metrics
            risk_score = min(data.get("volatility", 0.2) * 5, 1.0)  # Scale volatility to 0-1
            return_score = (data.get("mean_return", 0) + 1) ** 252 - 1  # Annualized return
            
            processed_stocks[symbol] = {
                **data,
                "risk_score": risk_score,
                "annualized_return": return_score,
                "sharpe_ratio": return_score / (data.get("volatility", 0.2) + 0.001),
                "price_momentum": data.get("daily_change", 0),
                "liquidity_score": min(data.get("volume", 0) / 1000000, 1.0),  # Normalized volume
                "asset_class": "equity"
            }
        
        return processed_stocks
    
    def _process_crypto(self, crypto_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process cryptocurrency data"""
        processed_crypto = {}
        
        for symbol, data in crypto_data.items():
            # Calculate risk metrics for crypto
            volatility = data.get("volatility", 0.5)
            risk_score = min(volatility * 2, 1.0)  # Crypto typically higher volatility
            
            processed_crypto[symbol] = {
                **data,
                "risk_score": risk_score,
                "market_cap_score": min(data.get("market_cap", 0) / 1000000000000, 1.0),  # Normalized market cap
                "volume_score": min(data.get("volume_24h", 0) / 10000000000, 1.0),
                "price_momentum": data.get("daily_change", 0),
                "asset_class": "crypto"
            }
        
        return processed_crypto
    
    def _process_gold(self, gold_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process gold data"""
        return {
            **gold_data,
            "risk_score": 0.3,  # Gold typically lower risk
            "hedge_score": 0.8,  # Good inflation hedge
            "asset_class": "commodity"
        }
    
    def _process_fixed_income(self, fixed_income_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process fixed income data"""
        processed_fi = {}
        
        for instrument, data in fixed_income_data.items():
            processed_fi[instrument] = {
                **data,
                "risk_score": 0.1,  # Very low risk
                "liquidity_score": 0.3 if instrument == "ppf" else 0.7,  # PPF has lock-in
                "tax_efficiency": 1.0 if data.get("tax_benefit", False) else 0.5,
                "asset_class": "fixed_income"
            }
        
        return processed_fi
    
    def _calculate_correlations(self, asset_classes: Dict[str, Any]) -> Dict[str, float]:
        """Calculate simplified correlation matrix"""
        # Simplified correlation estimates (in real implementation, use historical data)
        correlations = {
            "stocks_crypto": 0.3,
            "stocks_gold": -0.1,
            "stocks_fixed_income": 0.1,
            "crypto_gold": 0.0,
            "crypto_fixed_income": -0.2,
            "gold_fixed_income": 0.0
        }
        
        return correlations
    
    def _generate_market_summary(self, asset_classes: Dict[str, Any]) -> Dict[str, Any]:
        """Generate overall market summary"""
        summary = {
            "total_assets_analyzed": sum(len(assets) for assets in asset_classes.values()),
            "market_sentiment": "neutral",  # Could be enhanced with sentiment analysis
            "volatility_level": "moderate",
            "recommended_rebalance": False
        }
        
        # Calculate average volatility across all assets
        total_volatility = 0
        count = 0
        
        for asset_class, assets in asset_classes.items():
            if isinstance(assets, dict):
                for asset_name, asset_data in assets.items():
                    if isinstance(asset_data, dict) and "volatility" in asset_data:
                        total_volatility += asset_data["volatility"]
                        count += 1
        
        if count > 0:
            avg_volatility = total_volatility / count
            if avg_volatility > 0.3:
                summary["volatility_level"] = "high"
            elif avg_volatility < 0.15:
                summary["volatility_level"] = "low"
        
        return summary

class CacheManager(BaseTool):
    """Tool for caching market data to improve performance"""
    
    def __init__(self, cache_duration_minutes: int = 30):
        self.cache = {}
        self.cache_duration = timedelta(minutes=cache_duration_minutes)
    
    def execute(self, operation: str, key: str = None, data: Any = None) -> Any:
        """
        Manage cache operations
        
        Args:
            operation: 'get', 'store', 'clear', 'is_fresh'
            key: Cache key
            data: Data to store (for store operation)
        """
        if operation == "get":
            return self._get_cached_data(key)
        elif operation == "store":
            return self._store_data(key, data)
        elif operation == "clear":
            return self._clear_cache()
        elif operation == "is_fresh":
            return self._is_data_fresh(key)
        else:
            raise ValueError(f"Unknown cache operation: {operation}")
    
    def _get_cached_data(self, key: str) -> Optional[Any]:
        """Retrieve data from cache if fresh"""
        if key in self.cache:
            cached_item = self.cache[key]
            if self._is_data_fresh(key):
                logger.info(f"Cache hit for key: {key}")
                return cached_item["data"]
            else:
                # Remove stale data
                del self.cache[key]
                logger.info(f"Cache expired for key: {key}")
        
        return None
    
    def _store_data(self, key: str, data: Any) -> bool:
        """Store data in cache with timestamp"""
        try:
            self.cache[key] = {
                "data": data,
                "timestamp": datetime.now(),
                "size": len(str(data))  # Rough size estimate
            }
            logger.info(f"Data cached for key: {key}")
            return True
        except Exception as e:
            logger.error(f"Error storing cache data: {str(e)}")
            return False
    
    def _is_data_fresh(self, key: str) -> bool:
        """Check if cached data is still fresh"""
        if key not in self.cache:
            return False
        
        cached_time = self.cache[key]["timestamp"]
        return datetime.now() - cached_time < self.cache_duration
    
    def _clear_cache(self) -> bool:
        """Clear all cached data"""
        try:
            self.cache.clear()
            logger.info("Cache cleared successfully")
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
            return False
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_size = sum(item["size"] for item in self.cache.values())
        fresh_items = sum(1 for key in self.cache.keys() if self._is_data_fresh(key))
        
        return {
            "total_items": len(self.cache),
            "fresh_items": fresh_items,
            "stale_items": len(self.cache) - fresh_items,
            "total_size_estimate": total_size,
            "cache_duration_minutes": self.cache_duration.total_seconds() / 60
        }

class ApiRateLimiter(BaseTool):
    """Tool for managing API call rates and quotas"""
    
    def __init__(self):
        self.api_calls = {}
        self.rate_limits = {
            "yfinance": {"calls_per_minute": 60, "calls_per_hour": 2000},
            "coingecko": {"calls_per_minute": 10, "calls_per_hour": 1000},
            "gold_api": {"calls_per_minute": 30, "calls_per_hour": 1000}
        }
    
    def execute(self, api_name: str, operation: str = "check") -> bool:
        """
        Manage API rate limiting
        
        Args:
            api_name: Name of the API
            operation: 'check', 'record', 'reset'
        """
        if operation == "check":
            return self._rate_limit_check(api_name)
        elif operation == "record":
            return self._record_api_call(api_name)
        elif operation == "reset":
            return self._reset_api_calls(api_name)
        else:
            raise ValueError(f"Unknown operation: {operation}")
    
    def _rate_limit_check(self, api_name: str) -> bool:
        """Check if API call is within rate limits"""
        if api_name not in self.rate_limits:
            return True  # No limits defined for this API
        
        current_time = datetime.now()
        
        # Initialize tracking if not exists
        if api_name not in self.api_calls:
            self.api_calls[api_name] = []
        
        # Clean old calls outside the window
        self._clean_old_calls(api_name, current_time)
        
        # Check minute limit
        minute_calls = self._count_calls_in_window(api_name, current_time, minutes=1)
        if minute_calls >= self.rate_limits[api_name]["calls_per_minute"]:
            logger.warning(f"Rate limit exceeded for {api_name}: {minute_calls} calls in last minute")
            return False
        
        # Check hour limit
        hour_calls = self._count_calls_in_window(api_name, current_time, minutes=60)
        if hour_calls >= self.rate_limits[api_name]["calls_per_hour"]:
            logger.warning(f"Rate limit exceeded for {api_name}: {hour_calls} calls in last hour")
            return False
        
        return True
    
    def _record_api_call(self, api_name: str) -> bool:
        """Record an API call"""
        if api_name not in self.api_calls:
            self.api_calls[api_name] = []
        
        self.api_calls[api_name].append(datetime.now())
        return True
    
    def _clean_old_calls(self, api_name: str, current_time: datetime):
        """Remove calls older than 1 hour"""
        cutoff_time = current_time - timedelta(hours=1)
        self.api_calls[api_name] = [
            call_time for call_time in self.api_calls[api_name]
            if call_time > cutoff_time
        ]
    
    def _count_calls_in_window(self, api_name: str, current_time: datetime, minutes: int) -> int:
        """Count API calls within specified time window"""
        cutoff_time = current_time - timedelta(minutes=minutes)
        return sum(1 for call_time in self.api_calls[api_name] if call_time > cutoff_time)
    
    def _reset_api_calls(self, api_name: str) -> bool:
        """Reset API call tracking for specific API"""
        if api_name in self.api_calls:
            self.api_calls[api_name] = []
            return True
        return False
    
    def get_api_usage_stats(self) -> Dict[str, Any]:
        """Get current API usage statistics"""
        current_time = datetime.now()
        stats = {}
        
        for api_name in self.api_calls:
            if api_name in self.rate_limits:
                minute_calls = self._count_calls_in_window(api_name, current_time, minutes=1)
                hour_calls = self._count_calls_in_window(api_name, current_time, minutes=60)
                
                stats[api_name] = {
                    "calls_last_minute": minute_calls,
                    "calls_last_hour": hour_calls,
                    "minute_limit": self.rate_limits[api_name]["calls_per_minute"],
                    "hour_limit": self.rate_limits[api_name]["calls_per_hour"],
                    "minute_remaining": self.rate_limits[api_name]["calls_per_minute"] - minute_calls,
                    "hour_remaining": self.rate_limits[api_name]["calls_per_hour"] - hour_calls
                }
        
        return stats

class DataValidator(BaseTool):
    """Tool for validating data quality and completeness"""
    
    def execute(self, data: Dict[str, Any], validation_type: str = "comprehensive") -> Dict[str, Any]:
        """
        Validate data quality
        
        Args:
            data: Data to validate
            validation_type: 'basic', 'comprehensive', 'minimal'
        """
        validation_result = {
            "is_valid": True,
            "warnings": [],
            "errors": [],
            "data_quality_score": 1.0,
            "validation_timestamp": datetime.now().isoformat()
        }
        
        try:
            if validation_type == "basic":
                validation_result = self._basic_validation(data, validation_result)
            elif validation_type == "comprehensive":
                validation_result = self._comprehensive_validation(data, validation_result)
            elif validation_type == "minimal":
                validation_result = self._minimal_validation(data, validation_result)
            
            # Calculate overall validity
            validation_result["is_valid"] = len(validation_result["errors"]) == 0
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error during validation: {str(e)}")
            validation_result["errors"].append(f"Validation error: {str(e)}")
            validation_result["is_valid"] = False
            return validation_result
    
    def _basic_validation(self, data: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
        """Basic data validation"""
        # Check if data exists
        if not data:
            result["errors"].append("No data provided for validation")
            return result
        
        # Check for required asset classes
        required_classes = ["stocks", "crypto", "gold", "fixed_income"]
        missing_classes = []
        
        for asset_class in required_classes:
            if asset_class not in data:
                missing_classes.append(asset_class)
        
        if missing_classes:
            result["warnings"].append(f"Missing asset classes: {missing_classes}")
            result["data_quality_score"] *= 0.8
        
        return result
    
    def _comprehensive_validation(self, data: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
        """Comprehensive data validation"""
        result = self._basic_validation(data, result)
        
        # Validate each asset class
        for asset_class, asset_data in data.items():
            if asset_class in ["stocks", "crypto"]:
                result = self._validate_price_data(asset_data, asset_class, result)
            elif asset_class == "gold":
                result = self._validate_gold_data(asset_data, result)
            elif asset_class == "fixed_income":
                result = self._validate_fixed_income_data(asset_data, result)
        
        return result
    
    def _minimal_validation(self, data: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
        """Minimal validation for performance"""
        if not data:
            result["errors"].append("Empty data")
        
        return result
    
    def _validate_price_data(self, asset_data: Dict[str, Any], asset_class: str, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate price-based asset data"""
        for symbol, data in asset_data.items():
            if not isinstance(data, dict):
                result["errors"].append(f"Invalid data format for {asset_class} {symbol}")
                continue
            
            # Check required fields
            required_fields = ["current_price", "volatility", "last_updated"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                result["warnings"].append(f"Missing fields in {asset_class} {symbol}: {missing_fields}")
                result["data_quality_score"] *= 0.95
            
            # Check data ranges
            if "current_price" in data:
                price = data["current_price"]
                if not isinstance(price, (int, float)) or price <= 0:
                    result["errors"].append(f"Invalid price for {asset_class} {symbol}: {price}")
            
            if "volatility" in data:
                vol = data["volatility"]
                if not isinstance(vol, (int, float)) or vol < 0 or vol > 2:
                    result["warnings"].append(f"Unusual volatility for {asset_class} {symbol}: {vol}")
                    result["data_quality_score"] *= 0.98
        
        return result
    
    def _validate_gold_data(self, gold_data: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate gold data"""
        required_fields = ["current_price_per_gram", "currency"]
        missing_fields = [field for field in required_fields if field not in gold_data]
        
        if missing_fields:
            result["warnings"].append(f"Missing fields in gold data: {missing_fields}")
            result["data_quality_score"] *= 0.95
        
        return result
    
    def _validate_fixed_income_data(self, fi_data: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate fixed income data"""
        for instrument, data in fi_data.items():
            if "rate" not in data:
                result["errors"].append(f"Missing rate for {instrument}")
            elif not isinstance(data["rate"], (int, float)) or data["rate"] <= 0 or data["rate"] > 0.2:
                result["warnings"].append(f"Unusual rate for {instrument}: {data['rate']}")
                result["data_quality_score"] *= 0.98
        
        return result

class DataAgent:
    """Main Data Agent class that coordinates all data tools"""
    
    def __init__(self):
        self.market_data_fetcher = MarketDataFetcher()
        self.data_processor = DataProcessor()
        self.cache_manager = CacheManager()
        self.api_rate_limiter = ApiRateLimiter()
        self.data_validator = DataValidator()
        
        logger.info("Data Agent initialized with all tools")
    
    def execute(self, user_profile: Dict[str, Any], force_refresh: bool = False) -> Dict[str, Any]:
        """
        Main execution method for Data Agent
        
        Args:
            user_profile: User preferences and constraints
            force_refresh: Whether to bypass cache and fetch fresh data
        """
        try:
            # Generate cache key based on user profile
            cache_key = self._generate_cache_key(user_profile)
            
            # Try to get cached data first (if not forcing refresh)
            if not force_refresh:
                cached_result = self.cache_manager.execute("get", cache_key)
                if cached_result:
                    logger.info("Returning cached data")
                    return cached_result
            
            # Check API rate limits
            apis_to_check = ["yfinance", "coingecko", "gold_api"]
            for api in apis_to_check:
                if not self.api_rate_limiter.execute(api, "check"):
                    logger.warning(f"Rate limit exceeded for {api}, using cached/default data")
                    # Could implement fallback logic here
            
            # Fetch fresh market data
            logger.info("Fetching fresh market data")
            market_response = self.market_data_fetcher.execute()
            
            # Record API calls
            for api in apis_to_check:
                self.api_rate_limiter.execute(api, "record")
            
            if not market_response.success:
                logger.error(f"Market data fetch failed: {market_response.error_message}")
                return {"error": "Failed to fetch market data", "timestamp": datetime.now().isoformat()}
            
            # Process the data
            logger.info("Processing market data")
            processed_data = self.data_processor.execute(market_response.data, user_profile)
            
            # Validate the processed data
            logger.info("Validating processed data")
            validation_result = self.data_validator.execute(processed_data, "comprehensive")
            
            # Combine results
            final_result = {
                "market_data": processed_data,
                "validation": validation_result,
                "fetch_timestamp": market_response.timestamp.isoformat(),
                "processing_timestamp": datetime.now().isoformat(),
                "cache_key": cache_key,
                "api_usage": self.api_rate_limiter.get_api_usage_stats()
            }
            
            # Cache the result if validation passed
            if validation_result["is_valid"]:
                self.cache_manager.execute("store", cache_key, final_result)
                logger.info("Data cached successfully")
            
            return final_result
            
        except Exception as e:
            logger.error(f"Error in Data Agent execution: {str(e)}")
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "fallback_data": self._get_fallback_data(user_profile)
            }
    
    def _generate_cache_key(self, user_profile: Dict[str, Any]) -> str:
        """Generate cache key based on user profile"""
        # Create a hash of relevant user profile elements
        profile_str = json.dumps({
            "risk_score": user_profile.get("risk_score", 0.5),
            "investment_horizon": user_profile.get("investment_horizon", 5),
            "preferences": sorted(user_profile.get("preferences", [])),
            "date": datetime.now().date().isoformat()
        }, sort_keys=True)
        
        return hashlib.md5(profile_str.encode()).hexdigest()
    
    def _get_fallback_data(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Get minimal fallback data when everything fails"""
        return {
            "asset_classes": {
                "stocks": {
                    "RELIANCE.NS": {"current_price": 2500, "volatility": 0.25, "mean_return": 0.15},
                    "TCS.NS": {"current_price": 3500, "volatility": 0.20, "mean_return": 0.12}
                },
                "fixed_income": {
                    "ppf": {"rate": 0.071, "tenure": 15, "risk_score": 0.1}
                },
                "gold": {"current_price_per_gram": 5500, "volatility": 0.15},
                "crypto": {
                    "bitcoin": {"current_price_inr": 3500000, "volatility": 0.6, "daily_change": 0.02}
                }
            },
            "correlations": {"stocks_crypto": 0.3, "stocks_gold": -0.1},
            "market_summary": {"volatility_level": "moderate", "market_sentiment": "neutral"}
        }
    
    def get_agent_status(self) -> Dict[str, Any]:
        """Get current status of all tools"""
        return {
            "cache_stats": self.cache_manager.get_cache_stats(),
            "api_usage": self.api_rate_limiter.get_api_usage_stats(),
            "agent_ready": True,
            "last_check": datetime.now().isoformat()
        }
    
    def clear_cache(self) -> bool:
        """Clear all cached data"""
        return self.cache_manager.execute("clear")