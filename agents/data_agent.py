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
import os
import re

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

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
        """
        if data_types is None:
            data_types = ['stocks', 'crypto', 'gold', 'silver', 'fixed_income', 'mutual_funds']
        
        try:
            market_data = {}
            
            if 'stocks' in data_types:
                market_data['stocks'] = self.fetch_stock_data()
            
            if 'crypto' in data_types:
                market_data['crypto'] = self.fetch_crypto_data()
            
            if 'gold' in data_types:
                market_data['gold'] = self.fetch_gold_data()
            
            if 'silver' in data_types:
                market_data['silver'] = self.fetch_silver_data()
            
            if 'fixed_income' in data_types:
                market_data['fixed_income'] = self.fetch_fixed_income_data()
            
            if 'mutual_funds' in data_types:
                market_data['mutual_funds'] = self.fetch_mutual_funds_data()
            
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
                    hist = ticker.history(period="1mo", interval="1d", timeout=10)
                    
                    if not hist.empty:
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
            
        if not stock_data:
            logger.info("Providing fallback stock data due to yfinance failures")
            stock_data = self._get_fallback_stock_data()
            
        return stock_data
    
    def _get_fallback_stock_data(self) -> Dict[str, Any]:
        """Fallback stock data"""
        return {
            "RELIANCE.NS": {"symbol": "RELIANCE.NS", "current_price": 2563.40, "mean_return": 0.08, "volatility": 0.133, "last_updated": datetime.now().isoformat()},
            "TCS.NS": {"symbol": "TCS.NS", "current_price": 3136.60, "mean_return": 0.08, "volatility": 0.133, "last_updated": datetime.now().isoformat()},
            "HDFCBANK.NS": {"symbol": "HDFCBANK.NS", "current_price": 1734.25, "mean_return": 0.08, "volatility": 0.133, "last_updated": datetime.now().isoformat()},
            "INFY.NS": {"symbol": "INFY.NS", "current_price": 1566.40, "mean_return": 0.08, "volatility": 0.133, "last_updated": datetime.now().isoformat()}
        }
    
    def fetch_crypto_data(self) -> Dict[str, Any]:
        """Fetch crypto data"""
        crypto_data = {}
        try:
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                "ids": ",".join(self.crypto_symbols),
                "vs_currencies": "inr,usd",
                "include_market_cap": "true",
                "include_24hr_vol": "true",
                "include_24hr_change": "true"
            }
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                for symbol in self.crypto_symbols:
                    if symbol in data:
                        d = data[symbol]
                        crypto_data[symbol] = {
                            "symbol": symbol,
                            "current_price_inr": d.get("inr"),
                            "current_price_usd": d.get("usd"),
                            "daily_change": d.get("inr_24h_change", 0) / 100.0,
                            "market_cap": d.get("inr_market_cap"),
                            "volume_24h": d.get("inr_24h_vol"),
                            "volatility": abs(d.get("inr_24h_change", 0) / 100.0) * 5, # Estimate
                            "last_updated": datetime.now().isoformat()
                        }
        except Exception as e:
            logger.warning(f"Crypto API failed: {e}")
            
        if not crypto_data:
            crypto_data = self._get_default_crypto_data()
        return crypto_data

    def _get_default_crypto_data(self) -> Dict[str, Any]:
        return {
            "bitcoin": {"symbol": "bitcoin", "current_price_inr": 3500000, "volatility": 0.45, "last_updated": datetime.now().isoformat()},
            "ethereum": {"symbol": "ethereum", "current_price_inr": 200000, "volatility": 0.50, "last_updated": datetime.now().isoformat()}
        }

    def fetch_gold_data(self) -> Dict[str, Any]:
        """Fetch gold data using yfinance (GC=F)"""
        try:
            # Fetch Gold Futures (USD/oz) and USD/INR
            gold_ticker = yf.Ticker("GC=F")
            usd_inr_ticker = yf.Ticker("INR=X")
            
            gold_hist = gold_ticker.history(period="1d")
            usd_inr_hist = usd_inr_ticker.history(period="1d")
            
            if not gold_hist.empty and not usd_inr_hist.empty:
                price_usd_oz = float(gold_hist['Close'].iloc[-1])
                usd_inr = float(usd_inr_hist['Close'].iloc[-1])
                
                # Convert to INR/gram
                # 1 Troy Ounce = 31.1035 Grams
                price_inr_gram = (price_usd_oz * usd_inr) / 31.1035
                
                return {
                    "current_price_per_gram": round(price_inr_gram, 2),
                    "currency": "INR",
                    "source": "yfinance (GC=F)",
                    "last_updated": datetime.now().isoformat(),
                    "raw_usd_oz": price_usd_oz,
                    "usd_inr": usd_inr
                }
        except Exception as e:
            logger.warning(f"Gold fetch failed: {e}")
            
        return {"current_price_per_gram": 6000.0, "currency": "INR", "volatility": 0.15, "last_updated": datetime.now().isoformat()}

    def fetch_silver_data(self) -> Dict[str, Any]:
        """Fetch silver data using yfinance (SI=F)"""
        try:
            # Fetch Silver Futures (USD/oz) and USD/INR
            silver_ticker = yf.Ticker("SI=F")
            usd_inr_ticker = yf.Ticker("INR=X")
            
            silver_hist = silver_ticker.history(period="1d")
            usd_inr_hist = usd_inr_ticker.history(period="1d")
            
            if not silver_hist.empty and not usd_inr_hist.empty:
                price_usd_oz = float(silver_hist['Close'].iloc[-1])
                usd_inr = float(usd_inr_hist['Close'].iloc[-1])
                
                # Convert to INR/gram
                price_inr_gram = (price_usd_oz * usd_inr) / 31.1035
                
                return {
                    "current_price_per_gram": round(price_inr_gram, 2),
                    "currency": "INR",
                    "source": "yfinance (SI=F)",
                    "last_updated": datetime.now().isoformat(),
                    "raw_usd_oz": price_usd_oz,
                    "usd_inr": usd_inr
                }
        except Exception as e:
            logger.warning(f"Silver fetch failed: {e}")
            
        return {"current_price_per_gram": 75.0, "currency": "INR", "volatility": 0.20, "last_updated": datetime.now().isoformat()}

    def fetch_fixed_income_data(self) -> Dict[str, Any]:
        """Fetch FD rates from JSON and add PPF"""
        fi_data = {}
        
        # Add PPF (Hardcoded)
        fi_data["ppf"] = {
            "instrument": "PPF",
            "rate": 0.071,
            "tenure": 15,
            "tax_benefit": True,
            "minimum_investment": 500,
            "maximum_investment": 150000,
            "last_updated": datetime.now().isoformat()
        }
        
        try:
            if os.path.exists("fd.json"):
                with open("fd.json", "r") as f:
                    fd_json = json.load(f)
                    fi_data["fd_rates"] = fd_json # Store the whole structure
            else:
                logger.warning("fd.json not found")
        except Exception as e:
            logger.error(f"Error fetching FD data: {e}")
            
        return fi_data

    def fetch_mutual_funds_data(self) -> Dict[str, Any]:
        """Fetch Mutual Funds data from JSON"""
        mf_data = {}
        try:
            if os.path.exists("mutual_funds.json"):
                with open("mutual_funds.json", "r") as f:
                    mf_json = json.load(f)
                    
                # Flatten the JSON structure for easier access by ID/Name
                # Structure: Category -> List of Funds
                for category, funds in mf_json.items():
                    for fund in funds:
                        fund_name = fund.get("Fund Name", "Unknown")
                        if fund_name == "Unknown": continue
                        
                        # Normalize keys to match previous structure expected by MicroAgent
                        mf_data[fund_name] = {
                            "fund_name": fund_name,
                            "category": category, # Use the key from JSON as category
                            "risk_level": fund.get("Risk"),
                            "nav": fund.get("NAV"),
                            "expense_ratio": fund.get("Expense Ratio"),
                            "returns_1y": fund.get("1Y Returns"),
                            "returns_3y": fund.get("3Y Returns"),
                            "returns_5y": fund.get("5Y Returns"),
                            "rating": fund.get("Rating"),
                            "fund_size_cr": fund.get("Fund Size (in Cr)"),
                            "exit_load": fund.get("Exit Load"),
                            "last_updated": datetime.now().isoformat()
                        }
            else:
                logger.warning("mutual_funds.json not found")
        except Exception as e:
            logger.error(f"Error fetching MF data: {e}")
        return mf_data

class DataProcessor(BaseTool):
    """Tool for processing and normalizing market data"""
    
    def execute(self, raw_data: Dict[str, Any], user_profile: Dict[str, Any]) -> Dict[str, Any]:
        try:
            processed_data = {
                "processed_timestamp": datetime.now().isoformat(),
                "user_profile": user_profile,
                "asset_classes": {}
            }
            
            if "stocks" in raw_data:
                processed_data["asset_classes"]["stocks"] = self._process_stocks(raw_data["stocks"])
            if "crypto" in raw_data:
                processed_data["asset_classes"]["crypto"] = self._process_crypto(raw_data["crypto"])
            
            commodities = {}
            if "gold" in raw_data:
                commodities["gold"] = self._process_gold(raw_data["gold"])
            if "silver" in raw_data:
                commodities["silver"] = self._process_silver(raw_data["silver"])
            if commodities:
                processed_data["asset_classes"]["commodities"] = commodities

            if "mutual_funds" in raw_data:
                processed_data["asset_classes"]["mutual_funds"] = self._process_mutual_funds(raw_data["mutual_funds"])
            
            if "fixed_income" in raw_data:
                processed_data["asset_classes"]["fixed_income"] = self._process_fixed_income(raw_data["fixed_income"])
            
            return processed_data
        except Exception as e:
            logger.error(f"Error processing data: {str(e)}")
            return {"error": str(e)}
    
    def _process_stocks(self, stock_data: Dict[str, Any]) -> Dict[str, Any]:
        processed = {}
        for sym, data in stock_data.items():
            processed[sym] = {**data, "asset_class": "equity"}
        return processed

    def _process_crypto(self, crypto_data: Dict[str, Any]) -> Dict[str, Any]:
        processed = {}
        for sym, data in crypto_data.items():
            processed[sym] = {**data, "asset_class": "crypto"}
        return processed

    def _process_gold(self, gold_data: Dict[str, Any]) -> Dict[str, Any]:
        return {**gold_data, "mean_return": 0.0003, "volatility": 0.15, "asset_class": "commodity"}

    def _process_silver(self, silver_data: Dict[str, Any]) -> Dict[str, Any]:
        return {**silver_data, "mean_return": 0.0004, "volatility": 0.20, "asset_class": "commodity"}

    def _process_mutual_funds(self, mf_data: Dict[str, Any]) -> Dict[str, Any]:
        processed = {}
        for name, data in mf_data.items():
            # Returns are in %, e.g., 26.7 for 26.7%
            ret_pct = data.get("returns_3y")
            if not isinstance(ret_pct, (int, float)): 
                ret_pct = data.get("returns_1y", 10.0)
            
            if not isinstance(ret_pct, (int, float)):
                ret_pct = 10.0
                
            # Convert % to decimal: 26.7 -> 0.267
            ann_ret = float(ret_pct) / 100.0
            
            # Convert Annualized to Daily: (1 + r_ann)^(1/252) - 1
            daily_ret = (1 + ann_ret) ** (1/252) - 1
            
            processed[name] = {
                **data, 
                "mean_return": daily_ret, 
                "volatility": 0.01, # Assumed daily vol if not available
                "asset_class": "mutual_fund"
            }
        return processed

    def _process_fixed_income(self, fi_data: Dict[str, Any]) -> Dict[str, Any]:
        # Add mean_return to PPF for MacroAgent
        if "ppf" in fi_data:
            rate = fi_data["ppf"].get("rate", 0.071)
            fi_data["ppf"]["mean_return"] = (1 + rate) ** (1/252) - 1
            fi_data["ppf"]["volatility"] = 0.001
            
        # Add a representative FD for MacroAgent to see correct average returns
        # This won't interfere with MicroAgent if it looks for 'fd_rates' specifically
        fi_data["representative_fd"] = {
            "name": "Average FD",
            "mean_return": (1 + 0.07) ** (1/252) - 1, # Approx 7%
            "volatility": 0.001,
            "asset_class": "fixed_income"
        }
        
        return fi_data

class CacheManager(BaseTool):
    def execute(self, operation, key=None, data=None):
        return None # Simplified for now

class ApiRateLimiter(BaseTool):
    def execute(self, api, operation="check"):
        return True
    def get_api_usage_stats(self):
        return {}

class DataValidator(BaseTool):
    def execute(self, data, validation_type="comprehensive"):
        return {"is_valid": True, "errors": []}

class DataAgent:
    """Main Data Agent class"""
    def __init__(self):
        self.market_data_fetcher = MarketDataFetcher()
        self.data_processor = DataProcessor()
        self.cache_manager = CacheManager()
        self.api_rate_limiter = ApiRateLimiter()
        self.data_validator = DataValidator()
        logger.info("Data Agent initialized")
    
    def execute(self, user_profile: Dict[str, Any], force_refresh: bool = False) -> Dict[str, Any]:
        try:
            market_response = self.market_data_fetcher.execute()
            if not market_response.success:
                return {"error": "Failed to fetch market data"}
            
            processed_data = self.data_processor.execute(market_response.data, user_profile)
            return {
                "market_data": processed_data,
                "asset_classes": processed_data.get("asset_classes", {}),
                "processed_data": processed_data
            }
        except Exception as e:
            logger.error(f"Data Agent execution failed: {e}")
            return {"error": str(e)}
