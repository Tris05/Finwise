import json
from data_agent import DataAgent

def print_json(data):
    """Helper to print JSON clearly, handling datetime objects"""
    print(json.dumps(data, indent=2, default=str))

def main():
    print("--- Initializing Data Agent ---")
    # 1. Initialize the Agent
    agent = DataAgent()
    
    # 2. Define a mock User Profile (Required by the execute method)
    # The agent uses this to generate cache keys and process logic
    user_profile = {
        "risk_score": 0.6,
        "investment_horizon": 5,  # years
        "preferences": ["technology", "crypto"],
        "initial_investment": 100000
    }

    print("\n--- Executing Data Fetch & Processing ---")
    # 3. Execute the agent (Fetch -> Process -> Validate -> Cache)
    # The first run will hit the APIs
    result = agent.execute(user_profile=user_profile, force_refresh=True)
    
    # 4. Display partial results to avoid flooding console
    if "error" not in result:
        print("\n[SUCCESS] Data fetched and processed.")
        
        print("\n--- Market Summary ---")
        print_json(result["market_data"]["market_summary"])
        
        print("\n--- Sample Stock Data (RELIANCE.NS) ---")
        if "stocks" in result["market_data"]["asset_classes"]:
            print_json(result["market_data"]["asset_classes"]["stocks"].get("RELIANCE.NS", "Not Found"))
            
        print("\n--- Sample Crypto Data (Bitcoin) ---")
        if "crypto" in result["market_data"]["asset_classes"]:
            print_json(result["market_data"]["asset_classes"]["crypto"].get("bitcoin", "Not Found"))
            
        print("\n--- Validation Report ---")
        print_json(result["validation"])
    else:
        print("\n[ERROR]", result["error"])

    print("\n--- Testing Cache & API Limits ---")
    # 5. Run again to test Caching (Should be instant and not hit APIs)
    print("Running execution again (expecting cache hit)...")
    cached_result = agent.execute(user_profile=user_profile)
    print(f"Source: {'Cache' if cached_result['cache_key'] == result['cache_key'] else 'API'}")

    # 6. Check System Status
    print("\n--- System Status ---")
    status = agent.get_agent_status()
    print_json(status)

if __name__ == "__main__":
    main()