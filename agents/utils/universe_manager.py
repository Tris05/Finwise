import requests
import pandas as pd
import io
import os
import json
import time
import re
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class UniverseManager:
    """
    Manages the dynamic discovery and caching of the stock universe (Nifty 50).
    Implements a 7-day cache for the index list and provides regex-based filtering.
    """
    
    NSE_URL = "https://nsearchives.nseindia.com/content/indices/ind_nifty50list.csv"
    CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cache")
    UNIVERSE_CACHE_PATH = os.path.join(CACHE_DIR, "ticker_universe.json")
    UNIVERSE_TTL_DAYS = 7

    def __init__(self):
        if not os.path.exists(self.CACHE_DIR):
            os.makedirs(self.CACHE_DIR)
        
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'text/csv,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.nseindia.com/'
        }

    def get_universe(self, force_refresh=False) -> pd.DataFrame:
        """
        Get the full Nifty 50 universe as a DataFrame.
        Uses cache if available and not expired.
        """
        if not force_refresh and self._is_cache_valid(self.UNIVERSE_CACHE_PATH, self.UNIVERSE_TTL_DAYS):
            try:
                with open(self.UNIVERSE_CACHE_PATH, 'r') as f:
                    data = json.load(f)
                    df = pd.DataFrame(data['constituents'])
                    logger.info("Loaded Nifty 50 universe from cache.")
                    return df
            except Exception as e:
                logger.warning(f"Failed to load universe cache: {e}. Re-fetching...")

        return self._fetch_and_cache_universe()

    def get_symbols(self, sector_pattern: str = None) -> list:
        """
        Get a list of stock symbols with .NS suffix.
        Optionally filtered by sector using regex.
        """
        df = self.get_universe()
        if df.empty:
            return ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS"] # Minimal fallback

        if sector_pattern:
            try:
                # Use regex for sector filtering as requested
                regex = re.compile(sector_pattern, re.IGNORECASE)
                df = df[df['Industry'].apply(lambda x: bool(regex.search(str(x))))]
                logger.info(f"Filtered universe by sector pattern '{sector_pattern}': {len(df)} stocks found.")
            except Exception as e:
                logger.error(f"Regex filtering error for pattern '{sector_pattern}': {e}")
        
        symbols = [f"{s}.NS" for s in df['Symbol'].tolist()]
        return symbols

    def _is_cache_valid(self, path: str, ttl_days: int) -> bool:
        if not os.path.exists(path):
            return False
        
        file_time = os.path.getmtime(path)
        current_time = time.time()
        age_days = (current_time - file_time) / (24 * 3600)
        
        return age_days < ttl_days

    def _fetch_and_cache_universe(self) -> pd.DataFrame:
        """Fetches the latest Nifty 50 constituents from NSE Archives"""
        logger.info(f"Fetching Nifty 50 universe from {self.NSE_URL}...")
        try:
            # Note: NSE often requires multiple requests to establish a session, 
            # but for Archives direct download usually works with a proper UA.
            session = requests.Session()
            # Visit main page first to get cookies if needed (often required by NSE)
            session.get("https://www.nseindia.com/", headers=self.headers, timeout=10)
            
            response = session.get(self.NSE_URL, headers=self.headers, timeout=15)
            response.raise_for_status()
            
            df = pd.read_csv(io.StringIO(response.text))
            
            # Clean symbols (remove spaces)
            df['Symbol'] = df['Symbol'].str.strip()
            
            # Cache the result
            cache_data = {
                "last_updated": datetime.now().isoformat(),
                "constituents": df.to_dict('records')
            }
            with open(self.UNIVERSE_CACHE_PATH, 'w') as f:
                json.dump(cache_data, f, indent=2)
            
            logger.info(f"Successfully cached {len(df)} Nifty 50 constituents.")
            return df
            
        except Exception as e:
            logger.error(f"Error fetching Nifty 50 list from NSE: {e}")
            # Try to load expired cache as last resort
            if os.path.exists(self.UNIVERSE_CACHE_PATH):
                with open(self.UNIVERSE_CACHE_PATH, 'r') as f:
                    data = json.load(f)
                    return pd.DataFrame(data['constituents'])
            return pd.DataFrame()

if __name__ == "__main__":
    # Test script
    logging.basicConfig(level=logging.INFO)
    mgr = UniverseManager()
    print("All Symbols:", mgr.get_symbols()[:5])
    print("Banking Symbols:", mgr.get_symbols(sector_pattern="BANK"))
    print("IT Symbols:", mgr.get_symbols(sector_pattern="IT|TECHNOLOGY"))
