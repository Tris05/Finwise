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
import json
import time
import os
import logging
from dataclasses import dataclass
from abc import ABC, abstractmethod
from utils.universe_manager import UniverseManager

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base directory for data files (agentic_ai/)
BASE_DATA_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

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
        self.universe_manager = UniverseManager()
        self.crypto_fallback_list = ["bitcoin", "ethereum", "ripple", "litecoin", "binancecoin", "cardano", "tron", "dogecoin", "solana", "tether"]
        self.price_cache_path = os.path.join(self.universe_manager.CACHE_DIR, "price_cache.json")
        self.crypto_universe_path = os.path.join(self.universe_manager.CACHE_DIR, "crypto_universe.json")
        self.price_ttl_hours = 1
        
    def execute(self, data_types: List[str] = None, sector_pattern: str = None) -> MarketDataResponse:
        """
        Fetch market data for specified data types
        """
        if data_types is None:
            data_types = ['stocks', 'crypto', 'gold', 'silver', 'fixed_income', 'mutual_funds']
        
        try:
            market_data = {}
            
            if 'stocks' in data_types:
                market_data['stocks'] = self.fetch_stock_data(sector_pattern=sector_pattern)
            
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
    
    def fetch_stock_data(self, sector_pattern: str = None) -> Dict[str, Any]:
        """Fetch Indian stock data using batch yfinance calls with caching"""
        # 1. Check Cache first
        cache_key = f"stocks_{sector_pattern or 'all'}"
        if self._is_price_cache_valid(cache_key):
            try:
                with open(self.price_cache_path, 'r') as f:
                    cache = json.load(f)
                    logger.info(f"Using cached stock data for {cache_key}")
                    return cache[cache_key]['data']
            except Exception:
                pass

        # 2. Get Universe
        symbols = self.universe_manager.get_symbols(sector_pattern=sector_pattern)
        if not symbols:
            return self._get_fallback_stock_data()

        stock_data = {}
        try:
            logger.info(f"Batch fetching data for {len(symbols)} symbols from yfinance...")
            # yfinance supports download(list_of_symbols)
            tickers = yf.download(symbols, period="1mo", interval="1d", group_by='ticker', threads=True, progress=False, timeout=20)
            
            for symbol in symbols:
                try:
                    # Handle both single ticker and multi-ticker DataFrame structures
                    hist = tickers[symbol] if len(symbols) > 1 else tickers
                    
                    if not hist.empty and 'Close' in hist.columns:
                        valid_close = hist['Close'].dropna()
                        if len(valid_close) < 2: continue
                        
                        returns = valid_close.pct_change().dropna()
                        stock_data[symbol] = {
                            "symbol": symbol,
                            "current_price": float(valid_close.iloc[-1]),
                            "previous_close": float(valid_close.iloc[-2]),
                            "daily_change": float(returns.iloc[-1]) if len(returns) > 0 else 0.0,
                            "volatility": float(returns.std()) if len(returns) > 1 else 0.1,
                            "mean_return": float(returns.mean()) if len(returns) > 0 else 0.0,
                            "volume": int(hist['Volume'].iloc[-1]) if 'Volume' in hist.columns else 0,
                            "high_52w": float(hist['High'].max()),
                            "low_52w": float(hist['Low'].min()),
                            "data_points": len(valid_close),
                            "last_updated": datetime.now().isoformat()
                        }
                except Exception:
                    continue
        except Exception as e:
            logger.error(f"Error in batch stock data fetching: {str(e)}")
            
        if not stock_data:
            logger.info("Providing fallback stock data")
            stock_data = self._get_fallback_stock_data()
        else:
            self._save_to_price_cache(cache_key, stock_data)
            
        return stock_data

    def _is_price_cache_valid(self, key: str) -> bool:
        if not os.path.exists(self.price_cache_path):
            return False
        try:
            with open(self.price_cache_path, 'r') as f:
                cache = json.load(f)
                if key in cache:
                    file_time = cache[key].get('timestamp', 0)
                    return (time.time() - file_time) / 3600 < self.price_ttl_hours
        except Exception:
            pass
        return False

    def _save_to_price_cache(self, key: str, data: Dict[str, Any]):
        cache = {}
        if os.path.exists(self.price_cache_path):
            try:
                with open(self.price_cache_path, 'r') as f:
                    cache = json.load(f)
            except Exception:
                pass
        
        cache[key] = {
            "timestamp": time.time(),
            "data": data
        }
        try:
            with open(self.price_cache_path, 'w') as f:
                json.dump(cache, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to write price cache: {e}")
    
    def fetch_crypto_universe(self, force_refresh: bool = False) -> List[str]:
        """Fetch top 10 cryptocurrencies by market cap from CoinGecko with 24h cache"""
        if not force_refresh and self._is_cache_valid(self.crypto_universe_path, 1): # 1 day TTL
            try:
                with open(self.crypto_universe_path, 'r') as f:
                    data = json.load(f)
                    logger.info("Loaded crypto universe from cache.")
                    return data.get('ids', self.crypto_fallback_list)
            except Exception:
                pass

        logger.info("Fetching top 10 cryptos by market cap from CoinGecko...")
        try:
            url = "https://api.coingecko.com/api/v3/coins/markets"
            params = {
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 10,
                "page": 1,
                "sparkline": "false"
            }
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                crypto_ids = [coin['id'] for coin in data]
                
                # Cache the results
                with open(self.crypto_universe_path, 'w') as f:
                    json.dump({"timestamp": time.time(), "ids": crypto_ids}, f)
                
                return crypto_ids
        except Exception as e:
            logger.warning(f"Failed to fetch crypto universe: {e}")
        
        return self.crypto_fallback_list

    def fetch_crypto_data(self) -> Dict[str, Any]:
        """Fetch crypto data for the dynamically discovered top 10 list"""
        crypto_ids = self.fetch_crypto_universe()
        crypto_data = {}
        try:
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                "ids": ",".join(crypto_ids),
                "vs_currencies": "inr,usd",
                "include_market_cap": "true",
                "include_24hr_vol": "true",
                "include_24hr_change": "true"
            }
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                for symbol in crypto_ids:
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
            logger.warning(f"Crypto data fetch failed: {e}")
            
        if not crypto_data:
            crypto_data = self._get_default_crypto_data()
        return crypto_data

    def _is_cache_valid(self, path: str, ttl_days: int) -> bool:
        if not os.path.exists(path):
            return False
        try:
            with open(path, 'r') as f:
                data = json.load(f)
                file_time = data.get('timestamp', 0)
                age_days = (time.time() - file_time) / (24 * 3600)
                return age_days < ttl_days
        except Exception:
            return False

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
            fd_path = os.path.join(BASE_DATA_DIR, "fd.json")
            if os.path.exists(fd_path):
                with open(fd_path, "r", encoding="utf-8") as f:
                    fd_json = json.load(f)
                    fi_data["fd_rates"] = fd_json # Store the whole structure
            else:
                logger.warning(f"fd.json not found at {fd_path}")
        except Exception as e:
            logger.error(f"Error fetching FD data: {e}")
            
        return fi_data

    def fetch_mutual_funds_data(self) -> Dict[str, Any]:
        """Fetch Mutual Funds data from JSON"""
        mf_data = {}
        try:
            mf_path = os.path.join(BASE_DATA_DIR, "mutual_funds.json")
            if os.path.exists(mf_path):
                with open(mf_path, "r", encoding="utf-8") as f:
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
            # Extract sector pattern for regex filtering if provided
            sector_pattern = user_profile.get("constraints", {}).get("sector_filter")
            
            market_response = self.market_data_fetcher.execute(sector_pattern=sector_pattern)
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
