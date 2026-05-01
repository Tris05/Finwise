"""
Orchestration Agent for LangGraph-based Portfolio Management System

This agent coordinates the workflow between all specialized agents and manages
the overall portfolio optimization process using LangGraph framework.
"""

from typing import TypedDict, List, Dict, Optional, Any
from langgraph.graph import StateGraph, END
import json
import logging
from datetime import datetime

# Import all agents
from data_agent import DataAgent
from macro_agent import MacroAgent
from micro_agent import MicroAgent
from risk_agent import RiskAgent
from explanation_agent import ExplanationAgent


class PortfolioState(TypedDict):
    """State schema for the portfolio optimization workflow"""
    # User inputs
    user_profile: Dict[str, Any]  # risk_score, investment_horizon, preferences
    financial_details: Dict[str, Any]  # total_assets, monthly_surplus, etc.
    goals: List[Dict[str, Any]]  # investment goals
    market_preferences: Dict[str, Any]  # currency, exchanges, etc.
    
    # Agent outputs
    market_data: Optional[Dict[str, Any]]
    processed_data: Optional[Dict[str, Any]]
    allocation: Optional[Dict[str, float]]  # Changed from macro_allocation
    asset_recommendations: Optional[Dict[str, List[Dict]]]
    risk_assessment: Optional[Dict[str, Any]]
    validated_portfolio: Optional[Dict[str, Any]]
    final_advice: Optional[Dict[str, Any]]
    
    # Flow control
    current_step: str
    errors: List[str]
    iteration_count: int
    max_iterations: int
    workflow_metadata: Dict[str, Any]


class OrchestrationAgent:
    """
    Central orchestration agent that manages the entire portfolio workflow
    """
    
    def __init__(self, max_iterations: int = 3):
        """
        Initialize the orchestration agent
        
        Args:
            max_iterations: Maximum number of rebalancing iterations allowed
        """
        self.max_iterations = max_iterations
        self.logger = self._setup_logging()
        
        # Initialize all specialized agents
        self.data_agent = DataAgent()
        self.macro_agent = MacroAgent()
        self.micro_agent = MicroAgent()
        self.risk_agent = RiskAgent()
        self.explanation_agent = ExplanationAgent()
        
        # Create and compile the workflow
        self.workflow = self._create_workflow()
    
    def _setup_logging(self) -> logging.Logger:
        """Setup logging for the orchestration agent"""
        logger = logging.getLogger("OrchestrationAgent")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def orchestrator_node(self, state: PortfolioState) -> PortfolioState:
        """
        Central coordinator that manages the workflow routing
        """
        try:
            current_step = state.get("current_step", "start")
            iteration_count = state.get("iteration_count", 0)
            
            self.logger.info(f"Orchestrator - Current Step: {current_step}, Iteration: {iteration_count}")
            
            if current_step == "start":
                # Initialize workflow
                return self._initialize_workflow(state)
            
            elif current_step == "validation_failed":
                # Handle rebalancing if risk validation fails
                return self._handle_validation_failure(state)
            
            elif current_step == "complete":
                return self._finalize_workflow(state)
            
            elif current_step == "error":
                return self._handle_error(state)
            
            else:
                # Default routing based on current step
                return state
                
        except Exception as e:
            self.logger.error(f"Orchestrator error: {str(e)}")
            return self._handle_error(state, error_message=str(e))
    
    def _initialize_workflow(self, state: PortfolioState) -> PortfolioState:
        """Initialize the workflow with user input validation"""
        try:
            # Validate required user inputs
            validation_errors = self._validate_user_inputs(state)
            
            if validation_errors:
                return {
                    **state,
                    "current_step": "error",
                    "errors": state.get("errors", []) + validation_errors
                }
            
            # Initialize workflow metadata
            total_assets = state["financial_details"]["total_assets"]
            workflow_metadata = {
                "start_time": datetime.now().isoformat(),
                "workflow_version": "1.0",
                "total_investment": total_assets,
                "risk_profile": self._categorize_risk_profile(state["user_profile"]["risk_score"]),
                "new_user": total_assets == 0  # Flag for new users
            }
            
            return {
                **state,
                "current_step": "data_collection",
                "iteration_count": 0,
                "max_iterations": self.max_iterations,
                "workflow_metadata": workflow_metadata,
                "errors": []
            }
            
        except Exception as e:
            self.logger.error(f"Workflow initialization error: {str(e)}")
            return self._handle_error(state, error_message=f"Initialization error: {str(e)}")
    
    def _handle_validation_failure(self, state: PortfolioState) -> PortfolioState:
        """Handle risk validation failures with rebalancing attempts"""
        iteration_count = state.get("iteration_count", 0)
        max_iterations = state.get("max_iterations", self.max_iterations)
        
        if iteration_count < max_iterations:
            self.logger.info(f"Attempting rebalancing - Iteration {iteration_count + 1}/{max_iterations}")
            return {
                **state,
                "current_step": "macro_allocation",
                "iteration_count": iteration_count + 1
            }
        else:
            # Max iterations reached, use fallback allocation
            self.logger.warning("Max rebalancing iterations reached, using conservative fallback")
            fallback_allocation = self._conservative_fallback(state)
            
            return {
                **state,
                "macro_allocation": fallback_allocation,
                "current_step": "micro_allocation",
                "errors": state.get("errors", []) + ["Used conservative fallback due to risk violations"]
            }
    
    def _conservative_fallback(self, state: PortfolioState) -> Dict[str, float]:
        """Generate conservative fallback allocation when optimization fails"""
        risk_score = state["user_profile"]["risk_score"]
        total_assets = state["financial_details"]["total_assets"]
        
        # For new users with zero assets, provide recommended allocation percentages
        if total_assets == 0:
            self.logger.info("New user with zero assets - providing recommended allocation percentages")
        
        # Conservative allocations based on risk score
        if risk_score <= 0.4:  # Low risk
            allocation = {
                "fd_ppf": 0.6,
                "mutual_funds": 0.3,
                "stocks": 0.1,
                "gold": 0.0,
                "crypto": 0.0
            }
        elif risk_score <= 0.7:  # Moderate risk
            allocation = {
                "fd_ppf": 0.4,
                "mutual_funds": 0.4,
                "stocks": 0.15,
                "gold": 0.05,
                "crypto": 0.0
            }
        else:  # High risk
            allocation = {
                "fd_ppf": 0.2,
                "mutual_funds": 0.3,
                "stocks": 0.4,
                "gold": 0.05,
                "crypto": 0.05
            }
        
        self.logger.info(f"Generated conservative fallback allocation: {allocation}")
        return allocation
    
    def _finalize_workflow(self, state: PortfolioState) -> PortfolioState:
        """Finalize the workflow with metadata and summary"""
        workflow_metadata = state.get("workflow_metadata", {})
        workflow_metadata.update({
            "end_time": datetime.now().isoformat(),
            "total_iterations": state.get("iteration_count", 0),
            "success": True,
            "errors_encountered": len(state.get("errors", []))
        })
        
        # Generate workflow summary
        summary = self._generate_workflow_summary(state)
        
        return {
            **state,
            "workflow_metadata": workflow_metadata,
            "workflow_summary": summary,
            "current_step": "complete"
        }
    
    def _handle_error(self, state: PortfolioState, error_message: str = None) -> PortfolioState:
        """Handle errors in the workflow"""
        errors = state.get("errors", [])
        if error_message:
            errors.append(error_message)
        
        # Generate minimal fallback advice
        fallback_advice = self._generate_fallback_advice(state)
        
        workflow_metadata = state.get("workflow_metadata", {})
        workflow_metadata.update({
            "end_time": datetime.now().isoformat(),
            "success": False,
            "error_count": len(errors)
        })
        
        return {
            **state,
            "current_step": "complete",
            "errors": errors,
            "final_advice": fallback_advice,
            "workflow_metadata": workflow_metadata
        }
    
    def _validate_user_inputs(self, state: PortfolioState) -> List[str]:
        """Validate required user inputs"""
        errors = []
        
        # Check user profile
        user_profile = state.get("user_profile", {})
        if not user_profile:
            errors.append("User profile is required")
        else:
            if "risk_score" not in user_profile or not (0 <= user_profile["risk_score"] <= 1):
                errors.append("Valid risk_score (0-1) is required in user profile")
            
            if "investment_horizon" not in user_profile or user_profile["investment_horizon"] <= 0:
                errors.append("Valid investment_horizon is required in user profile")
        
        # Check financial details
        financial_details = state.get("financial_details", {})
        if not financial_details:
            errors.append("Financial details are required")
        else:
            if "total_assets" not in financial_details or financial_details["total_assets"] < 0:
                errors.append("Valid total_assets amount is required (cannot be negative)")
            
            # For new users with zero assets, provide a helpful message
            if financial_details.get("total_assets", 0) == 0:
                # This is valid for new users, but we should note it
                pass  # Allow zero assets for new users
        
        return errors
    
    def _categorize_risk_profile(self, risk_score: float) -> str:
        """Categorize risk profile based on risk score"""
        if risk_score <= 0.4:
            return "Conservative"
        elif risk_score <= 0.7:
            return "Moderate"
        else:
            return "Aggressive"
    
    def _generate_workflow_summary(self, state: PortfolioState) -> Dict[str, Any]:
        """Generate a summary of the workflow execution"""
        total_investment = state["financial_details"]["total_assets"]
        macro_allocation = state.get("macro_allocation", {})
        workflow_metadata = state.get("workflow_metadata", {})
        
        summary = {
            "total_investment": total_investment,
            "risk_profile": workflow_metadata["risk_profile"],
            "allocation_summary": {},
            "key_recommendations": [],
            "workflow_success": True,
            "iterations_required": state.get("iteration_count", 0),
            "new_user": workflow_metadata.get("new_user", False)
        }
        
        # Summarize allocation
        for asset_class, percentage in macro_allocation.items():
            if percentage > 0:
                amount = total_investment * percentage
                summary["allocation_summary"][asset_class] = {
                    "percentage": percentage,
                    "amount": amount
                }
        
        # Add special recommendations for new users
        if total_investment == 0:
            summary["key_recommendations"] = [
                "Start with systematic investment plans (SIPs) as low as INR 500 per month",
                "Build emergency fund first (6 months of expenses)",
                "Consider tax-saving options like PPF and ELSS",
                "Focus on diversified mutual funds for beginners"
            ]
        
        # Extract key recommendations
        if "final_advice" in state and state["final_advice"]:
            advice = state["final_advice"]
            if "immediate_actions" in advice:
                summary["key_recommendations"] = advice["immediate_actions"][:3]  # Top 3 actions
        
        return summary
    
    def _generate_fallback_advice(self, state: PortfolioState) -> Dict[str, Any]:
        """Generate minimal fallback advice when workflow fails"""
        total_assets = state.get("financial_details", {}).get("total_assets", 0)
        
        if total_assets == 0:
            # Special advice for new users
            return {
                "allocation_summary": "Recommended allocation percentages for your risk profile. Start with small amounts.",
                "specific_recommendations": "Start with SIPs as low as INR 500/month and build gradually.",
                "risk_assessment": "Risk assessment completed based on your profile.",
                "action_items": [
                    "Open a demat and trading account",
                    "Start emergency fund in bank FD",
                    "Begin SIP in diversified equity mutual fund",
                    "Consider PPF for tax-saving (minimum INR 500/year)"
                ],
                "important_considerations": "Start small and increase investments gradually as you gain confidence.",
                "total_investment": 0,
                "risk_profile": self._categorize_risk_profile(state.get("user_profile", {}).get("risk_score", 0.5)),
                "new_user_guidance": True
            }
        else:
            # Standard fallback advice for existing investors
            return {
                "allocation_summary": "Portfolio allocation could not be completed due to technical issues.",
                "specific_recommendations": "Please consult with a financial advisor for personalized recommendations.",
                "risk_assessment": "Risk assessment could not be completed.",
                "action_items": [
                    "Consult with a qualified financial advisor",
                    "Review your investment goals and risk tolerance",
                    "Consider starting with conservative investments like PPF or FDs"
                ],
                "important_considerations": "This system encountered technical difficulties. Please seek professional financial advice.",
                "total_investment": total_assets,
                "risk_profile": "Unknown"
            }
    
    def data_collection_node(self, state: PortfolioState) -> PortfolioState:
        """Execute data collection through Data Agent"""
        try:
            self.logger.info("Executing Data Collection Agent")
            result = self.data_agent.execute(
                user_profile=state["user_profile"],
                force_refresh=False  # Use cache for performance
            )
            
            if "error" in result:
                return {
                    **state,
                    "market_data": result.get("market_data", result.get("fallback_data", {})),
                    "processed_data": result.get("processed_data", result.get("fallback_data", {})),
                    "errors": state.get("errors", []) + [f"Data collection error: {result['error']}"],
                    "current_step": "macro_allocation"  # Continue with fallback data
                }
            
            return {
                **state,
                "market_data": result.get("market_data"),
                "processed_data": result.get("processed_data"),
                "current_step": "macro_allocation"
            }
            
        except Exception as e:
            self.logger.error(f"Data collection node error: {str(e)}")
            return {
                **state,
                "errors": state.get("errors", []) + [f"Data collection error: {str(e)}"],
                "current_step": "macro_allocation"
            }
    
    def macro_allocation_node(self, state: PortfolioState) -> PortfolioState:
        """Execute macro allocation through Macro Agent"""
        try:
            self.logger.info("Executing Macro Allocation Agent")
            macro_state = {
                "user_profile": state["user_profile"],
                "market_data": state.get("processed_data", {}),
                "constraints": state["user_profile"].get("constraints", {}),
                "financial_details": state.get("financial_details", {})
            }
            result = self.macro_agent.execute(macro_state)
            
            if "error" in result:
                # Use fallback allocation
                fallback_allocation = self._conservative_fallback(state)
                return {
                    **state,
                    "macro_allocation": fallback_allocation,
                    "errors": state.get("errors", []) + [f"Macro allocation error: {result['error']}"],
                    "current_step": "micro_allocation"
                }
            
            # The macro agent updates the state and returns it
            result["current_step"] = "micro_allocation"
            # Map macro_allocation to allocation to avoid key conflicts
            if "macro_allocation" in result:
                result["allocation"] = result.pop("macro_allocation")
            return {**state, **result}
            
        except Exception as e:
            self.logger.error(f"Macro allocation node error: {str(e)}")
            fallback_allocation = self._conservative_fallback(state)
            return {
                **state,
                "allocation": fallback_allocation,
                "errors": state.get("errors", []) + [f"Macro allocation error: {str(e)}"],
                "current_step": "micro_allocation"
            }
    
    def micro_allocation_node(self, state: PortfolioState) -> PortfolioState:
        """Execute micro allocation through Micro Agent"""
        try:
            self.logger.info("Executing Micro Allocation Agent")
            micro_state = {
                "user_profile": state["user_profile"],
                "macro_allocation": state["allocation"],
                "market_data": state.get("market_data", {}),
                "financial_details": state.get("financial_details", {}),
                "total_investment": state["financial_details"]["total_assets"]
            }
            result = self.micro_agent.execute(micro_state)
            
            if "error" in result:
                return {
                    **state,
                    "errors": state.get("errors", []) + [f"Micro allocation error: {result['error']}"],
                    "current_step": "risk_validation"
                }
            
            # The micro agent updates the state and returns it  
            result["current_step"] = "risk_validation"
            return {**state, **result}
            
        except Exception as e:
            self.logger.error(f"Micro allocation node error: {str(e)}")
            return {
                **state,
                "errors": state.get("errors", []) + [f"Micro allocation error: {str(e)}"],
                "current_step": "risk_validation"
            }
    
    def risk_validation_node(self, state: PortfolioState) -> PortfolioState:
        """Execute risk validation through Risk Agent"""
        try:
            self.logger.info("Executing Risk Validation Agent")
            result = self.risk_agent.execute(
                macro_allocation=state.get("allocation", {}),
                asset_recommendations=state.get("asset_recommendations", {}),
                user_profile=state["user_profile"],
                total_assets=state["financial_details"]["total_assets"],
                market_data=state.get("market_data", {})
            )
            
            # Risk agent returns the updated state, extract risk_assessment
            risk_assessment = result.get("risk_assessment", {})
            violations = risk_assessment.get("risk_violations", [])
            
            if violations and state.get("iteration_count", 0) < state.get("max_iterations", self.max_iterations):
                # Risk violations found, trigger rebalancing
                return {
                    **state,
                    **result,
                    "current_step": "validation_failed"
                }
            else:
                # No violations or max iterations reached
                return {
                    **state,
                    **result,
                    "validated_portfolio": {
                        "allocation": state.get("allocation", {}),
                        "asset_recommendations": state.get("asset_recommendations", {})
                    },
                    "current_step": "explanation_generation"
                }
                
        except Exception as e:
            self.logger.error(f"Risk validation node error: {str(e)}")
            return {
                **state,
                "errors": state.get("errors", []) + [f"Risk validation error: {str(e)}"],
                "current_step": "explanation_generation"
            }
    
    def explanation_generation_node(self, state: PortfolioState) -> PortfolioState:
        """Execute explanation generation through Explanation Agent"""
        try:
            self.logger.info("Executing Explanation Generation Agent")
            result = self.explanation_agent.execute(
                data_agent_output={"market_data": state.get("market_data", {}), "processed_data": state.get("processed_data", {})},
                macro_agent_output={"allocation": state.get("allocation", {})},
                micro_agent_output={"recommendations": state.get("asset_recommendations", {})},
                risk_agent_output={"risk_assessment": state.get("risk_assessment", {})},
                user_profile=state["user_profile"],
                total_assets=state["financial_details"]["total_assets"]
            )
            
            # The explanation agent updates the state and returns it
            result["current_step"] = "complete"
            return {**state, **result}
            
        except Exception as e:
            self.logger.error(f"Explanation generation node error: {str(e)}")
            fallback_advice = self._generate_fallback_advice(state)
            return {
                **state,
                "final_advice": fallback_advice,
                "errors": state.get("errors", []) + [f"Explanation generation error: {str(e)}"],
                "current_step": "complete"
            }
    
    def _create_workflow(self) -> StateGraph:
        """Create and compile the LangGraph workflow"""
        # Create state graph
        workflow = StateGraph(PortfolioState)
        
        # Add nodes
        workflow.add_node("orchestrator", self.orchestrator_node)
        workflow.add_node("data_collection", self.data_collection_node)
        workflow.add_node("macro_allocation", self.macro_allocation_node)
        workflow.add_node("micro_allocation", self.micro_allocation_node)
        workflow.add_node("risk_validation", self.risk_validation_node)
        workflow.add_node("explanation_generation", self.explanation_generation_node)
        
        # Define routing function
        def route_next_step(state: PortfolioState) -> str:
            return state.get("current_step", "complete")
        
        # Set entry point
        workflow.set_entry_point("orchestrator")
        
        # Define conditional edges
        workflow.add_conditional_edges(
            "orchestrator",
            route_next_step,
            {
                "data_collection": "data_collection",
                "macro_allocation": "macro_allocation",
                "validation_failed": "orchestrator",  # Loop back for rebalancing
                "complete": END,
                "error": END
            }
        )
        
        workflow.add_conditional_edges(
            "data_collection",
            route_next_step,
            {"macro_allocation": "macro_allocation"}
        )
        
        workflow.add_conditional_edges(
            "macro_allocation",
            route_next_step,
            {"micro_allocation": "micro_allocation"}
        )
        
        workflow.add_conditional_edges(
            "micro_allocation",
            route_next_step,
            {"risk_validation": "risk_validation"}
        )
        
        workflow.add_conditional_edges(
            "risk_validation",
            route_next_step,
            {
                "explanation_generation": "explanation_generation",
                "validation_failed": "orchestrator"  # Loop back for rebalancing
            }
        )
        
        workflow.add_conditional_edges(
            "explanation_generation",
            route_next_step,
            {"complete": END}
        )
        
        return workflow.compile()
    
    def execute_portfolio_optimization(self, user_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main function to execute the complete portfolio optimization workflow
        
        Args:
            user_input: Complete user input as specified in the documentation
            
        Returns:
            Complete portfolio recommendation as specified in the documentation
        """
        try:
            # Initialize state
            initial_state = PortfolioState(
                user_profile=user_input["user_profile"],
                financial_details=user_input["financial_details"],
                goals=user_input.get("goals", []),
                market_preferences=user_input.get("market_preferences", {}),
                current_step="start",
                errors=[],
                iteration_count=0,
                max_iterations=self.max_iterations,
                workflow_metadata={}
            )
            
            self.logger.info("Starting portfolio optimization workflow")
            
            # Execute workflow
            result = self.workflow.invoke(initial_state)
            
            # Format final output
            portfolio_recommendation = self._format_final_output(result)
            
            self.logger.info("Portfolio optimization completed successfully")
            return portfolio_recommendation
            
        except Exception as e:
            self.logger.error(f"Portfolio optimization failed: {str(e)}")
            raise Exception(f"Portfolio optimization failed: {str(e)}")
    
    def _format_final_output(self, state: PortfolioState) -> Dict[str, Any]:
        """Format the final output according to the system specification"""
        workflow_metadata = state.get("workflow_metadata", {})
        total_investment = state["financial_details"]["total_assets"]
        
        # Create meta_data section
        meta_data = {
            "user_id": f"user_{hash(str(state['user_profile']))}", 
            "recommendation_id": f"rec_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "generated_timestamp": datetime.now().isoformat(),
            "model_version": "v1.0",
            "risk_profile": workflow_metadata.get("risk_profile", "Unknown"),
            "total_investment": total_investment,
            "currency": "INR"
        }
        
        # Format allocation with rationale
        macro_allocation = {}
        if "allocation" in state and state["allocation"]:
            for asset_class, percentage in state["allocation"].items():
                amount = total_investment * percentage
                macro_allocation[asset_class] = {
                    "percentage": percentage,
                    "amount": amount,
                    "rationale": self._get_allocation_rationale(asset_class, percentage, total_investment == 0)
                }
        
        # Get micro allocation (asset recommendations)
        micro_allocation = state.get("asset_recommendations", {})
        
        # Get risk assessment
        risk_assessment = state.get("risk_assessment", {})
        
        # Get final advice
        final_advice = state.get("final_advice", {})
        
        # Create complete portfolio recommendation
        portfolio_recommendation = {
            "portfolio_recommendation": {
                "meta_data": meta_data,
                "macro_allocation": macro_allocation,
                "micro_allocation": micro_allocation,
                "risk_assessment": risk_assessment,
                "actionable_advice": final_advice,
                "workflow_summary": state.get("workflow_summary", {}),
                "errors": state.get("errors", []),
                "compliance_and_disclaimers": {
                    "regulatory_compliance": [
                        "Recommendations comply with SEBI guidelines",
                        "Tax implications shown are estimates only",
                        "Past performance doesn't guarantee future results"
                    ],
                    "important_disclaimers": [
                        "This is AI-generated advice for educational purposes",
                        "Please consult a qualified financial advisor",
                        "Market risks apply to all investments"
                    ],
                    "data_sources": [
                        "NSE/BSE for stock prices",
                        "CoinGecko for cryptocurrency prices",
                        "RBI for fixed income rates"
                    ]
                }
            }
        }
        
        return portfolio_recommendation
    
    def _get_allocation_rationale(self, asset_class: str, percentage: float, is_new_user: bool = False) -> str:
        """Get rationale for asset class allocation"""
        if is_new_user:
            # Special rationales for new users
            rationales = {
                "stocks": f"Recommended {percentage:.0%} equity exposure for long-term growth. Start with SIPs.",
                "mutual_funds": f"Professional management with {percentage:.0%} allocation. Begin with diversified funds.",
                "crypto": f"Consider {percentage:.0%} allocation only after building core portfolio (high risk).",
                "gold": f"Inflation hedge with {percentage:.0%} allocation. Consider gold ETFs or sovereign gold bonds.",
                "fd_ppf": f"Capital protection and tax benefits with {percentage:.0%} allocation. PPF offers 8%+ tax-free returns."
            }
        else:
            # Standard rationales for existing investors
            rationales = {
                "stocks": f"Growth potential with {percentage:.0%} equity exposure aligned with risk profile",
                "mutual_funds": f"Professional management and diversification with {percentage:.0%} allocation",
                "crypto": f"Small {percentage:.0%} allocation for high growth potential and portfolio diversification",
                "gold": f"Inflation hedge and currency risk protection with {percentage:.0%} allocation",
                "fd_ppf": f"Capital protection and tax benefits through {percentage:.0%} fixed income allocation"
            }
        return rationales.get(asset_class, f"{percentage:.0%} allocation based on portfolio optimization")


# Example usage and testing
if __name__ == "__main__":
    # Sample input for testing
    sample_input = {
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
                "preferred_stocks": ["RELIANCE.NS", "TCS.NS"],
                "investment_style": "moderate"
            }
        },
        "financial_details": {
            "total_assets": 1000000,
            "monthly_surplus": 50000,
            "emergency_fund": 300000,
            "existing_investments": {},
            "debts": {}
        },
        "goals": [
            {
                "name": "Retirement Planning",
                "target_amount": 10000000,
                "time_horizon": 30,
                "priority": "high"
            }
        ],
        "market_preferences": {
            "preferred_exchanges": ["NSE", "BSE"],
            "currency": "INR",
            "update_frequency": "monthly",
            "rebalancing_threshold": 0.05
        }
    }
    
    # Initialize and test orchestration agent
    orchestrator = OrchestrationAgent(max_iterations=2)
    
    try:
        result = orchestrator.execute_portfolio_optimization(sample_input)
        print("=== Portfolio Optimization Result ===")
        print(json.dumps(result, indent=2, default=str))
    except Exception as e:
        print(f"Error: {e}")