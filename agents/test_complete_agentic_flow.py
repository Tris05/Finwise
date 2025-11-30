#!/usr/bin/env python3
"""
Complete Agentic Workflow Test
Tests all 6 agents working together to provide comprehensive portfolio recommendations
"""

from orchestration_agent import OrchestrationAgent
import json
import time
from datetime import datetime

def create_test_user_profile():
    """Create a comprehensive test user profile"""
    return {
        'user_profile': {
            'risk_score': 0.65,  # Moderate-high risk
            'investment_horizon': 10,
            'age': 35,
            'annual_income': 2500000,
            'preferences': [
                'growth', 
                'tax_saving', 
                'dividend_income',
                'liquidity'
            ],
            'constraints': {
                'max_crypto': 0.18,
                'max_single_stock': 0.12,
                'min_fixed_income': 0.18,
                'exclude_sectors': ['tobacco', 'alcohol'],
                'preferred_stocks': ['RELIANCE.NS', 'TCS.NS', 'INFY.NS'],
                'investment_style': 'moderate'
            }
        },
        'financial_details': {
            'total_assets': 2500000,  # ₹25 lakhs
            'monthly_surplus': 100000,
            'emergency_fund': 600000,
            'existing_investments': {
                'stocks': 300000,
                'mutual_funds': 400000,
                'fd_ppf': 200000,
                'crypto': 50000,
                'gold': 50000
            },
            'debts': {
                'home_loan': 3000000,
                'personal_loan': 0,
                'credit_card': 50000
            }
        },
        'goals': [
            {
                'name': 'Child Education Fund',
                'target_amount': 4000000,
                'time_horizon': 12,
                'priority': 'high'
            },
            {
                'name': 'Retirement Corpus',
                'target_amount': 15000000,
                'time_horizon': 25,
                'priority': 'high'
            },
            {
                'name': 'Vacation Fund',
                'target_amount': 500000,
                'time_horizon': 2,
                'priority': 'low'
            }
        ],
        'market_preferences': {
            'preferred_exchanges': ['NSE', 'BSE'],
            'currency': 'INR',
            'update_frequency': 'monthly',
            'rebalancing_threshold': 0.05
        }
    }

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"{title:^60}")
    print(f"{'='*60}")

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{title}")
    print('-' * len(title))

def analyze_workflow_results(result):
    """Analyze and display comprehensive workflow results"""
    
    print_header("COMPLETE AGENTIC PORTFOLIO WORKFLOW RESULTS")
    
    portfolio = result.get('portfolio_recommendation', {})
    if not portfolio:
        print("❌ No portfolio recommendation generated!")
        return
    
    # Extract all components
    meta_data = portfolio.get('meta_data', {})
    macro_allocation = portfolio.get('macro_allocation', {})
    micro_allocation = portfolio.get('micro_allocation', {})
    risk_assessment = portfolio.get('risk_assessment', {})
    actionable_advice = portfolio.get('actionable_advice', {})
    workflow_summary = portfolio.get('workflow_summary', {})
    errors = portfolio.get('errors', [])
    
    # 1. WORKFLOW METADATA
    print_section("📋 WORKFLOW METADATA")
    print(f"   User ID: {meta_data.get('user_id', 'Unknown')}")
    print(f"   Recommendation ID: {meta_data.get('recommendation_id', 'Unknown')}")
    print(f"   Generated: {meta_data.get('generated_timestamp', 'Unknown')}")
    print(f"   Risk Profile: {meta_data.get('risk_profile', 'Unknown')}")
    print(f"   Total Investment: ₹{meta_data.get('total_investment', 0):,}")
    print(f"   Currency: {meta_data.get('currency', 'Unknown')}")
    
    # 2. AGENT EXECUTION STATUS
    print_section("🤖 AGENT EXECUTION STATUS")
    agents_status = {
        'Data Agent': 'SUCCESS' if 'market_data' in str(result) else 'FAILED',
        'Macro Agent': 'SUCCESS' if macro_allocation else 'FAILED',
        'Micro Agent': 'SUCCESS' if micro_allocation else 'FAILED',
        'Risk Agent': 'SUCCESS' if risk_assessment else 'FAILED', 
        'Explanation Agent': 'SUCCESS' if actionable_advice else 'FAILED',
        'Orchestrator': 'SUCCESS' if meta_data else 'FAILED'
    }
    
    for agent, status in agents_status.items():
        status_icon = "✅" if status == "SUCCESS" else "❌"
        print(f"   {status_icon} {agent:<20}: {status}")
    
    # 3. MACRO ALLOCATION ANALYSIS
    if macro_allocation:
        print_section("💰 MACRO ALLOCATION (Asset Class Distribution)")
        total_percentage = 0
        total_amount = 0
        
        for asset_class, details in macro_allocation.items():
            if isinstance(details, dict):
                percentage = details.get('percentage', 0)
                amount = details.get('amount', 0)
                rationale = details.get('rationale', 'No rationale provided')
                
                if percentage > 0:
                    print(f"   {asset_class.replace('_', ' ').title():<15}: {percentage*100:5.1f}% (₹{amount:9,.0f})")
                    print(f"   {'→':<15} {rationale}")
                    total_percentage += percentage
                    total_amount += amount
        
        print(f"\n   {'TOTAL':<15}: {total_percentage*100:5.1f}% (₹{total_amount:9,.0f})")
    
    # 4. MICRO ALLOCATION ANALYSIS
    if micro_allocation:
        print_section("🎯 MICRO ALLOCATION (Specific Asset Recommendations)")
        grand_total = 0
        
        for asset_type, recommendations in micro_allocation.items():
            if recommendations and isinstance(recommendations, list):
                print(f"\n   {asset_type.replace('_', ' ').title()}:")
                asset_type_total = 0
                
                for i, rec in enumerate(recommendations, 1):
                    name = rec.get('name', 'Unknown Asset')
                    amount = rec.get('amount', 0)
                    quantity = rec.get('quantity', 0)
                    current_price = rec.get('current_price', 0)
                    score = rec.get('score', 0)
                    rationale = rec.get('rationale', 'No rationale provided')
                    
                    print(f"     {i}. {name}")
                    print(f"        Amount: ₹{amount:,.0f} | Qty: {quantity} | Price: ₹{current_price} | Score: {score}")
                    print(f"        Rationale: {rationale}")
                    
                    asset_type_total += amount
                    grand_total += amount
                
                print(f"     Subtotal: ₹{asset_type_total:,.0f}")
        
        print(f"\n   GRAND TOTAL ALLOCATED: ₹{grand_total:,.0f}")
    
    # 5. RISK ASSESSMENT ANALYSIS
    if risk_assessment:
        print_section("⚠️  RISK ASSESSMENT & VALIDATION")
        
        risk_metrics = risk_assessment.get('risk_metrics', {})
        if risk_metrics:
            print("   Portfolio Risk Metrics:")
            print(f"     • Expected Annual Return: {risk_metrics.get('expected_annual_return', 0)*100:.2f}%")
            print(f"     • Portfolio Volatility: {risk_metrics.get('estimated_volatility', 0)*100:.2f}%")
            print(f"     • Sharpe Ratio: {risk_metrics.get('sharpe_ratio', 0):.3f}")
            print(f"     • Risk Level: {risk_metrics.get('risk_level', 'Unknown')}")
            print(f"     • Max Drawdown Estimate: {risk_metrics.get('max_drawdown_estimate', 0)*100:.1f}%")
        
        violations = risk_assessment.get('risk_violations', [])
        if violations:
            print(f"\n   ⚠️  Risk Violations Detected ({len(violations)}):")
            for i, violation in enumerate(violations, 1):
                print(f"     {i}. {violation}")
        else:
            print("\n   ✅ No risk violations detected - Portfolio is compliant")
        
        overall_status = risk_assessment.get('overall_assessment', 'Unknown')
        print(f"\n   Overall Risk Assessment: {overall_status}")
    
    # 6. ACTIONABLE ADVICE & EXPLANATIONS
    if actionable_advice:
        print_section("💡 EXPLANATION AGENT OUTPUT")
        
        # Portfolio summary
        allocation_summary = actionable_advice.get('allocation_summary', '')
        if allocation_summary:
            print("   Portfolio Summary:")
            if isinstance(allocation_summary, str):
                sentences = [s.strip() for s in allocation_summary.split('.') if s.strip()]
                for sentence in sentences[:3]:  # First 3 sentences
                    print(f"     • {sentence}.")
            else:
                print(f"     • {allocation_summary}")
        
        # Immediate action items
        immediate_actions = actionable_advice.get('immediate_actions', [])
        if immediate_actions:
            print("\n   Immediate Action Items:")
            for i, action in enumerate(immediate_actions, 1):
                print(f"     {i}. {action}")
        
        # Risk assessment explanation
        risk_explanation = actionable_advice.get('risk_assessment', '')
        if risk_explanation:
            print("\n   Risk Analysis:")
            if isinstance(risk_explanation, str):
                risk_sentences = [s.strip() for s in risk_explanation.split('.') if s.strip()]
                for sentence in risk_sentences[:2]:  # First 2 sentences
                    print(f"     • {sentence}.")
            else:
                print(f"     • {risk_explanation}")
        
        # Important considerations
        considerations = actionable_advice.get('important_considerations', '')
        if considerations:
            print("\n   Important Considerations:")
            if isinstance(considerations, str):
                consid_sentences = [s.strip() for s in considerations.split('.') if s.strip()]
                for sentence in consid_sentences[:3]:  # First 3 sentences
                    print(f"     • {sentence}.")
            else:
                print(f"     • {considerations}")
    
    # 7. WORKFLOW SUMMARY
    if workflow_summary:
        print_section("📊 WORKFLOW SUMMARY")
        print(f"   Total Investment: ₹{workflow_summary.get('total_investment', 0):,}")
        print(f"   Risk Profile: {workflow_summary.get('risk_profile', 'Unknown')}")
        print(f"   Workflow Success: {workflow_summary.get('workflow_success', 'Unknown')}")
        print(f"   Iterations Required: {workflow_summary.get('iterations_required', 0)}")
        
        allocation_summary = workflow_summary.get('allocation_summary', {})
        if allocation_summary:
            print("\n   Asset Allocation Summary:")
            for asset, details in allocation_summary.items():
                if isinstance(details, dict):
                    print(f"     • {asset.title()}: {details.get('percentage', 0)*100:.1f}% (₹{details.get('amount', 0):,.0f})")
        
        key_recommendations = workflow_summary.get('key_recommendations', [])
        if key_recommendations:
            print("\n   Key Recommendations:")
            for i, rec in enumerate(key_recommendations, 1):
                print(f"     {i}. {rec}")
    
    # 8. ERRORS AND WARNINGS
    if errors:
        print_section("⚠️  ERRORS & WARNINGS")
        for i, error in enumerate(errors, 1):
            print(f"   {i}. {error}")
    else:
        print_section("✅ NO ERRORS DETECTED")
        print("   All agents executed successfully without critical errors")
    
    return {
        'agents_working': sum(1 for status in agents_status.values() if status == 'SUCCESS'),
        'total_agents': len(agents_status),
        'has_allocation': bool(macro_allocation),
        'has_recommendations': bool(micro_allocation), 
        'has_risk_assessment': bool(risk_assessment),
        'has_explanations': bool(actionable_advice),
        'error_count': len(errors)
    }

def main():
    """Main test function for complete agentic workflow"""
    
    print_header("COMPLETE AGENTIC PORTFOLIO WORKFLOW TEST")
    print(f"Testing all 6 specialized agents working together")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Create test user profile
    user_input = create_test_user_profile()
    print(f"\n📊 Test Configuration:")
    print(f"   Risk Score: {user_input['user_profile']['risk_score']} (Moderate-High)")
    print(f"   Investment Amount: ₹{user_input['financial_details']['total_assets']:,}")
    print(f"   Investment Horizon: {user_input['user_profile']['investment_horizon']} years")
    print(f"   Number of Goals: {len(user_input['goals'])}")
    print(f"   Existing Investments: ₹{sum(user_input['financial_details']['existing_investments'].values()):,}")
    
    print(f"\n⏳ Initializing Orchestration Agent...")
    start_time = time.time()
    
    try:
        # Initialize orchestration agent with debug settings
        orchestrator = OrchestrationAgent(max_iterations=3)
        print(f"✅ Orchestration Agent initialized successfully")
        
        print(f"\n🚀 Executing Complete Workflow (All 6 Agents)...")
        print(f"   1. Data Agent → Market data collection")
        print(f"   2. Macro Agent → Asset class allocation")  
        print(f"   3. Micro Agent → Specific asset selection")
        print(f"   4. Risk Agent → Risk validation & assessment")
        print(f"   5. Explanation Agent → Human-readable explanations")
        print(f"   6. Orchestrator → Workflow coordination")
        
        # Execute complete workflow
        result = orchestrator.execute_portfolio_optimization(user_input)
        execution_time = time.time() - start_time
        
        print(f"\n✅ Workflow execution completed in {execution_time:.2f} seconds")
        
        # Analyze and display results
        summary = analyze_workflow_results(result)
        
        # Save detailed results
        output_filename = f"complete_workflow_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_filename, 'w') as f:
            json.dump(result, f, indent=2, default=str)
        
        print_header("WORKFLOW TEST SUMMARY")
        print(f"✅ Agents Working: {summary['agents_working']}/{summary['total_agents']}")
        print(f"✅ Macro Allocation: {'Generated' if summary['has_allocation'] else 'Missing'}")
        print(f"✅ Asset Recommendations: {'Generated' if summary['has_recommendations'] else 'Missing'}")
        print(f"✅ Risk Assessment: {'Completed' if summary['has_risk_assessment'] else 'Missing'}")
        print(f"✅ Explanations: {'Generated' if summary['has_explanations'] else 'Missing'}")
        print(f"⚠️  Errors/Warnings: {summary['error_count']}")
        print(f"⏱️  Execution Time: {execution_time:.2f} seconds")
        print(f"📄 Detailed Results: {output_filename}")
        
        # Overall success assessment
        success_rate = summary['agents_working'] / summary['total_agents']
        if success_rate >= 0.8:
            print(f"\n🎉 WORKFLOW TEST: SUCCESS!")
            print(f"   All critical agents working, complete portfolio generated")
        elif success_rate >= 0.5:
            print(f"\n⚠️  WORKFLOW TEST: PARTIAL SUCCESS")
            print(f"   Most agents working, portfolio generated with some limitations")
        else:
            print(f"\n❌ WORKFLOW TEST: NEEDS ATTENTION")
            print(f"   Multiple agent failures, workflow needs debugging")
            
    except Exception as e:
        execution_time = time.time() - start_time
        print(f"\n❌ Workflow execution failed after {execution_time:.2f} seconds")
        print(f"Error: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)