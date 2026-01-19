"""
Complete Workflow Integration Test
Tests the full agentic portfolio management workflow:
Data Agent -> Macro Agent -> Micro Agent -> Risk Agent -> Explanation Agent
"""

import sys
import json
from pathlib import Path
from datetime import datetime

# Add agents directory to path
sys.path.insert(0, str(Path(__file__).parent))

from data_agent import DataAgent
from macro_agent import MacroAgent
from micro_agent import MicroAgent
from risk_agent import RiskAgent
from explanation_agent import ExplanationAgent

def print_header(title):
    """Print section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def print_subsection(title):
    """Print subsection"""
    print(f"\n--- {title} ---")

def safe_print(text):
    """Print text handling Unicode errors"""
    try:
        print(text)
    except UnicodeEncodeError:
        # Replace problematic characters
        safe_text = text.encode('ascii', 'replace').decode('ascii')
        print(safe_text)

def test_complete_workflow():
    """Test the complete agentic workflow"""
    
    print_header("AGENTIC PORTFOLIO MANAGEMENT WORKFLOW TEST")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Define user input as per documentation
    user_input = {
        "user_profile": {
            "risk_score": 0.6,
            "investment_horizon": 5,
            "age": 30,
            "annual_income": 1200000,
            "preferences": ["tax_saving", "growth"],
            "constraints": {
                "max_crypto": 0.15,
                "max_single_stock": 0.10,
                "min_fixed_income": 0.20,
                "exclude_sectors": [],
                "preferred_stocks": ["TCS.NS"],
                "investment_style": "moderate"
            }
        },
        "financial_details": {
            "total_assets": 1000000,
            "monthly_surplus": 50000,
            "emergency_fund": 300000
        }
    }
    
    # Initialize state
    state = {
        "user_profile": user_input["user_profile"],
        "total_assets": user_input["financial_details"]["total_assets"],
        "current_step": "data_collection",
        "errors": [],
        "iteration_count": 0
    }
    
    print(f"\nUser Profile:")
    print(f"  Risk Score: {state['user_profile']['risk_score']}")
    print(f"  Investment Horizon: {state['user_profile']['investment_horizon']} years")
    print(f"  Total Assets: Rs.{state['total_assets']:,.0f}")
    
    # ========================================================================
    # STEP 1: DATA AGENT
    # ========================================================================
    print_header("STEP 1: DATA AGENT - Market Data Collection")
    
    try:
        data_agent = DataAgent()
        print("[OK] Data Agent initialized")
        
        data_result = data_agent.execute(
            user_profile=state["user_profile"],
            force_refresh=False
        )
        
        if "error" in data_result:
            print(f"[ERROR] Data Agent failed: {data_result['error']}")
            if "fallback_data" in data_result:
                print("[INFO] Using fallback data")
                state["market_data"] = data_result["fallback_data"]
                state["processed_data"] = data_result["fallback_data"]
        else:
            state["market_data"] = data_result.get("market_data", {})
            state["processed_data"] = data_result.get("market_data", {})
            print("[OK] Market data fetched successfully")
            
            # Show summary
            if "market_summary" in state["market_data"]:
                summary = state["market_data"]["market_summary"]
                print(f"  Market Sentiment: {summary.get('market_sentiment', 'N/A')}")
                print(f"  Volatility Level: {summary.get('volatility_level', 'N/A')}")
            
            # Show asset counts
            asset_classes = state["market_data"].get("asset_classes", state["market_data"])
            print(f"\n  Assets Available:")
            for asset_class, data in asset_classes.items():
                if isinstance(data, dict):
                    count = len(data)
                    print(f"    {asset_class}: {count} items")
        
        state["current_step"] = "macro_allocation"
        
    except Exception as e:
        print(f"[ERROR] Data Agent exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # ========================================================================
    # STEP 2: MACRO AGENT
    # ========================================================================
    print_header("STEP 2: MACRO AGENT - Asset Class Allocation")
    
    try:
        macro_agent = MacroAgent()
        print("[OK] Macro Agent initialized")
        
        macro_result = macro_agent.execute(state)
        
        if "error" in macro_result:
            print(f"[ERROR] Macro Agent failed: {macro_result['error']}")
            return False
        
        state["macro_allocation"] = macro_result.get("macro_allocation", {})
        state["strategy_metadata"] = macro_result.get("strategy_metadata", {})
        
        print("[OK] Macro allocation completed")
        print(f"  Strategy: {state['strategy_metadata'].get('strategy_used', 'N/A')}")
        print(f"\n  Asset Allocation:")
        
        for asset_class, allocation in state["macro_allocation"].items():
            amount = allocation * state["total_assets"]
            safe_print(f"    {asset_class}: {allocation:.1%} (Rs.{amount:,.0f})")
        
        state["current_step"] = "micro_allocation"
        
    except Exception as e:
        print(f"[ERROR] Macro Agent exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # ========================================================================
    # STEP 3: MICRO AGENT
    # ========================================================================
    print_header("STEP 3: MICRO AGENT - Specific Asset Selection")
    
    try:
        micro_agent = MicroAgent()
        print("[OK] Micro Agent initialized")
        
        micro_result = micro_agent.execute(state)
        
        if "error" in micro_result:
            print(f"[ERROR] Micro Agent failed: {micro_result['error']}")
            return False
        
        state["asset_recommendations"] = micro_result.get("asset_recommendations", {})
        
        print("[OK] Asset recommendations generated")
        print(f"\n  Recommendations by Asset Class:")
        
        total_recs = 0
        for asset_class, recs in state["asset_recommendations"].items():
            count = len(recs)
            total_recs += count
            total_amount = sum(r.get("amount", 0) for r in recs)
            safe_print(f"    {asset_class}: {count} assets, Rs.{total_amount:,.0f}")
        
        print(f"\n  Total Recommendations: {total_recs}")
        
        state["current_step"] = "risk_validation"
        
    except Exception as e:
        print(f"[ERROR] Micro Agent exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # ========================================================================
    # STEP 4: RISK AGENT
    # ========================================================================
    print_header("STEP 4: RISK AGENT - Risk Assessment & Validation")
    
    try:
        risk_agent = RiskAgent()
        print("[OK] Risk Agent initialized")
        
        risk_result = risk_agent.execute(
            macro_allocation=state["macro_allocation"],
            asset_recommendations=state["asset_recommendations"],
            user_profile=state["user_profile"],
            total_assets=state["total_assets"]
        )
        
        if "error" in risk_result:
            print(f"[ERROR] Risk Agent failed: {risk_result['error']}")
            return False
        
        state["risk_assessment"] = risk_result.get("risk_assessment", {})
        state["validated_portfolio"] = risk_result.get("validated_portfolio", {})
        
        risk_metrics = state["risk_assessment"]
        
        print("[OK] Risk assessment completed")
        print(f"\n  Risk Metrics:")
        print(f"    Overall Risk Level: {risk_metrics.get('overall_risk_level', 'N/A')}")
        print(f"    Risk Score: {risk_metrics.get('risk_score', 0):.2f}")
        print(f"    Expected Return: {risk_metrics.get('expected_annual_return', 0):.1%}")
        print(f"    Volatility: {risk_metrics.get('estimated_volatility', 0):.1%}")
        print(f"    Sharpe Ratio: {risk_metrics.get('sharpe_ratio', 0):.2f}")
        print(f"    Diversification Score: {risk_metrics.get('diversification_score', 0):.2f}")
        
        violations = risk_metrics.get("risk_violations", [])
        if violations:
            print(f"\n  [WARNING] Risk Violations: {len(violations)}")
            for v in violations[:3]:
                safe_print(f"    - {v}")
        else:
            print(f"\n  [OK] No risk violations")
        
        state["current_step"] = "explanation_generation"
        
    except Exception as e:
        print(f"[ERROR] Risk Agent exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # ========================================================================
    # STEP 5: EXPLANATION AGENT
    # ========================================================================
    print_header("STEP 5: EXPLANATION AGENT - Generate User-Facing Advice")
    
    try:
        # Note: Explanation agent requires Gemini API key
        # We'll test initialization only
        explanation_agent = ExplanationAgent()
        print("[OK] Explanation Agent initialized")
        
        # The explanation agent would generate:
        # - Portfolio summary
        # - Risk explanation
        # - Action items
        # - Educational content
        # - Investment rationale
        
        print("\n  [INFO] Explanation Agent would generate:")
        print("    - Portfolio summary with rationale")
        print("    - Risk explanation in simple terms")
        print("    - Actionable investment steps")
        print("    - Educational content")
        print("    - Tax optimization strategies")
        
        print("\n  [NOTE] Full execution requires Gemini API key")
        
        state["current_step"] = "complete"
        
    except Exception as e:
        print(f"[ERROR] Explanation Agent exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    # ========================================================================
    # FINAL VALIDATION
    # ========================================================================
    print_header("WORKFLOW VALIDATION")
    
    # Check required fields per documentation
    required_fields = {
        "user_profile": ["risk_score", "investment_horizon"],
        "total_assets": None,
        "market_data": None,
        "macro_allocation": ["stocks", "mutual_funds", "crypto", "commodities", "fd", "ppf"],
        "asset_recommendations": ["stocks", "mutual_funds", "crypto", "commodities", "fd", "ppf"],
        "risk_assessment": ["overall_risk_level", "expected_annual_return", "sharpe_ratio"]
    }
    
    validation_passed = True
    
    for field, subfields in required_fields.items():
        if field not in state:
            print(f"[FAIL] Missing required field: {field}")
            validation_passed = False
        elif subfields:
            for subfield in subfields:
                if subfield not in state[field]:
                    print(f"[FAIL] Missing subfield: {field}.{subfield}")
                    validation_passed = False
    
    if validation_passed:
        print("[OK] All required fields present")
    
    # Verify state flow
    print(f"\n  State Flow:")
    print(f"    Final Step: {state.get('current_step', 'N/A')}")
    print(f"    Errors: {len(state.get('errors', []))}")
    print(f"    Iterations: {state.get('iteration_count', 0)}")
    
    # ========================================================================
    # SUMMARY
    # ========================================================================
    print_header("WORKFLOW TEST SUMMARY")
    
    print("\n  Agent Execution Status:")
    print("    [OK] Data Agent")
    print("    [OK] Macro Agent")
    print("    [OK] Micro Agent")
    print("    [OK] Risk Agent")
    print("    [OK] Explanation Agent (initialization)")
    
    print(f"\n  Portfolio Summary:")
    safe_print(f"    Total Investment: Rs.{state['total_assets']:,.0f}")
    print(f"    Asset Classes: {len(state.get('macro_allocation', {}))}")
    print(f"    Total Recommendations: {sum(len(v) for v in state.get('asset_recommendations', {}).values())}")
    print(f"    Risk Level: {state.get('risk_assessment', {}).get('overall_risk_level', 'N/A')}")
    print(f"    Expected Return: {state.get('risk_assessment', {}).get('expected_annual_return', 0):.1%}")
    
    print(f"\n  Validation: {'PASSED' if validation_passed else 'FAILED'}")
    
    print_header("TEST COMPLETED")
    print(f"Test finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return validation_passed

if __name__ == "__main__":
    try:
        success = test_complete_workflow()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n[FATAL ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
