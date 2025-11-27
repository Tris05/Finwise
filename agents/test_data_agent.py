
import logging
import json
from data_agent import DataAgent

# Configure logging
logging.basicConfig(level=logging.INFO)

def test_data_agent():
    print("Initializing Data Agent...")
    agent = DataAgent()
    
    # Mock user profile
    user_profile = {
        "risk_score": 0.5,
        "investment_horizon": 5
    }
    
    print("Fetching data...")
    # Force refresh to test live fetching
    result = agent.execute(user_profile, force_refresh=True)
    
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print("\nData Fetch Successful!")
        market_data = result.get("market_data", {})
        print(f"Market Summary: {json.dumps(market_data.get('market_summary'), indent=2)}")
        
        # Print sample stock data
        stocks = market_data.get("asset_classes", {}).get("stocks", {})
        if stocks:
            first_stock = list(stocks.keys())[0]
            print(f"\nSample Stock ({first_stock}):")
            print(json.dumps(stocks[first_stock], indent=2))
            
        # Print sample crypto data
        crypto = market_data.get("asset_classes", {}).get("crypto", {})
        if crypto:
            first_crypto = list(crypto.keys())[0]
            print(f"\nSample Crypto ({first_crypto}):")
            print(json.dumps(crypto[first_crypto], indent=2))

if __name__ == "__main__":
    test_data_agent()
