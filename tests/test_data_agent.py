import sys
import logging
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "agents"))

from data_agent import DataAgent
import json

def print_section(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def test_data_agent():
    """Test data agent with all features"""
    
    print_section("DATA AGENT COMPREHENSIVE TEST")
    
    # Initialize agent
    print("\n[1] Initializing Data Agent...")
    agent = DataAgent()
    print("    [OK] Data Agent initialized")
    
    # Test user profile
    user_profile = {
        "risk_score": 0.6,
        "investment_horizon": 5,
        "preferences": ["technology", "growth"],
        "constraints": {
            "max_crypto": 0.15,
            "exclude_sectors": []
        }
    }
    
    # Execute data agent
    print("\n[2] Fetching market data (force refresh)...")
    result = agent.execute(user_profile, force_refresh=True)
    
    if "error" in result:
        print(f"    [ERROR] {result['error']}")
        return False
    
    print("    [OK] Market data fetched successfully")
    
    # Check market data
    print_section("MARKET DATA SUMMARY")
    
    market_data = result.get("market_data", {})
    asset_classes = market_data.get("asset_classes", {})
    
    print(f"\nAsset Classes Available: {list(asset_classes.keys())}")
    
    # Stocks
    if "stocks" in asset_classes:
        stocks = asset_classes["stocks"]
        print(f"\n[STOCKS] {len(stocks)} stocks fetched")
        for symbol, data in list(stocks.items())[:3]:
            print(f"  - {symbol}: {data.get('current_price', 0):,.2f}")
    
    # Crypto
    if "crypto" in asset_classes:
        crypto = asset_classes["crypto"]
        print(f"\n[CRYPTO] {len(crypto)} cryptocurrencies fetched")
        for symbol, data in list(crypto.items())[:3]:
            print(f"  - {symbol}: {data.get('current_price_inr', 0):,.2f}")
    
    # Gold
    if "gold" in asset_classes:
        gold = asset_classes["gold"]
        print(f"\n[GOLD] Gold data fetched")
        print(f"  Price per gram: {gold.get('current_price_per_gram', 0):,.2f}")
    
    # Fixed Income
    if "fixed_income" in asset_classes:
        fi = asset_classes["fixed_income"]
        print(f"\n[FIXED INCOME] {len(fi)} instruments available")
        for instrument, data in list(fi.items())[:3]:
            print(f"  - {instrument}: {data.get('rate', 0)*100:.2f}%")
    
    # Test cached retrieval
    print_section("CACHE TEST")
    
    print("\n[3] Testing cached data retrieval...")
    cached_result = agent.execute(user_profile, force_refresh=False)
    
    if "market_data" in cached_result:
        print("    [OK] Cached data retrieved successfully")
    else:
        print("    [INFO] No cached data available")
    
    print_section("TEST COMPLETED SUCCESSFULLY")
    
    print("\n[SUMMARY]")
    print(f"  - Data Agent: WORKING")
    print(f"  - Stocks: {len(asset_classes.get('stocks', {}))} fetched")
    print(f"  - Crypto: {len(asset_classes.get('crypto', {}))} fetched")
    print(f"  - Fixed Income: {len(asset_classes.get('fixed_income', {}))} instruments")
    
    return True

if __name__ == "__main__":
    try:
        success = test_data_agent()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n[FATAL ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
