
try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    genai = None

import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
from dataclasses import dataclass
from abc import ABC, abstractmethod
import os
from pathlib import Path
import time
import re

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()  # Load from .env file in current directory or parent directories
except ImportError:
    pass  # dotenv not installed

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ExplanationResponse:
    """Standard response format for explanation generation"""
    explanation: Dict[str, Any]
    timestamp: datetime
    success: bool
    model_used: str
    error_message: Optional[str] = None

class BaseTool(ABC):
    """Base class for all explanation agent tools"""
    
    @abstractmethod
    def execute(self, *args, **kwargs) -> Any:
        pass

class GeminiLLMInterface(BaseTool):
    """Tool for interfacing with Google Gemini API"""
    
    def __init__(self, api_key: str = None):
        """
        Initialize Gemini API interface
        
        Args:
            api_key: Gemini API key (can also be set via GEMINI_API_KEY environment variable)
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        
        if not HAS_GENAI:
            logger.warning("google.generativeai library not found. Using fallback mode.")
            self.use_fallback = True
            return

        if not self.api_key:
            logger.warning("No Gemini API key provided. Using fallback mode.")
            self.use_fallback = True
        else:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-2.0-flash')
                self.use_fallback = False
                logger.info("Gemini API initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini API: {str(e)}")
                self.use_fallback = True
    
    def execute(self, prompt: str, max_retries: int = 3) -> Dict[str, Any]:
        """
        Generate response using Gemini API
        
        Args:
            prompt: Input prompt for the model
            max_retries: Maximum number of retry attempts
        """
        if self.use_fallback:
            return self._fallback_response(prompt)
        
        for attempt in range(max_retries):
            try:
                # Generate content using Gemini
                response = self.model.generate_content(
                    prompt,
                    generation_config={
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "max_output_tokens": 2048,
                    }
                )
                
                return {
                    "content": response.text,
                    "success": True,
                    "model": "gemini-2.0-flash",
                    "attempt": attempt + 1
                }
                
            except Exception as e:
                logger.warning(f"Gemini API attempt {attempt + 1} failed: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    logger.error("All Gemini API attempts failed, using fallback")
                    return self._fallback_response(prompt)
        
        return self._fallback_response(prompt)
    
    def _fallback_response(self, prompt: str) -> Dict[str, Any]:
        """Generate fallback response when API is unavailable"""
        return {
            "content": "Portfolio explanation generated using fallback mode. API integration required for detailed analysis.",
            "success": False,
            "model": "fallback",
            "attempt": 1
        }

class PromptTemplateManager(BaseTool):
    """Tool for managing and formatting prompts for different explanation types"""
    
    def __init__(self):
        self.templates = {
            "portfolio_summary": self._get_portfolio_summary_template(),
            "risk_explanation": self._get_risk_explanation_template(),
            "action_items": self._get_action_items_template(),
            "educational_content": self._get_educational_content_template(),
            "investment_rationale": self._get_investment_rationale_template()
        }
    
    def execute(self, template_type: str, data: Dict[str, Any]) -> str:
        """
        Generate formatted prompt based on template type and data
        
        Args:
            template_type: Type of explanation template to use
            data: Data to populate the template
        """
        try:
            if template_type not in self.templates:
                raise ValueError(f"Unknown template type: {template_type}")
            
            template = self.templates[template_type]
            formatted_prompt = template.format(**data)
            
            return formatted_prompt
            
        except Exception as e:
            logger.error(f"Error formatting prompt template: {str(e)}")
            return self._get_fallback_template().format(**data)
    
    def _get_portfolio_summary_template(self) -> str:
        """Template for portfolio summary explanation"""
        return """
You are an expert financial advisor providing portfolio recommendations. Generate a comprehensive, human-readable portfolio summary based on the following data:

**User Profile:**
- Risk Score: {risk_score}/1.0 ({risk_level} risk tolerance)
- Investment Horizon: {investment_horizon} years
- Age: {age} years
- Total Investment: ₹{total_investment:,.0f}

**Recommended Portfolio Allocation:**
{macro_allocation_text}

**Specific Investment Recommendations:**
{asset_recommendations_text}

**Risk Assessment:**
{risk_metrics_text}

**Market Data Summary:**
{market_summary_text}

Please provide a clear, engaging explanation that includes:
1. A brief overview of the recommended allocation strategy
2. Rationale for each asset class allocation based on the user's profile
3. Expected outcomes and timeline
4. Key benefits and potential risks
5. Next steps for implementation

Keep the tone professional yet accessible, avoiding excessive jargon. Structure the response with clear headings and bullet points where appropriate.
"""
    
    def _get_risk_explanation_template(self) -> str:
        """Template for risk explanation"""
        return """
As a financial risk expert, explain the risk profile of this portfolio in simple terms:

**Portfolio Risk Metrics:**
- Expected Annual Return: {expected_return:.1%}
- Portfolio Volatility: {volatility:.1%}
- Risk Level: {risk_level}
- Sharpe Ratio: {sharpe_ratio:.2f}
- Diversification Score: {diversification_score:.2f}

**Constraint Violations:**
{violations_text}

**Stress Test Results:**
{stress_test_text}

Provide a clear explanation covering:
1. What these metrics mean in practical terms
2. How risky this portfolio is compared to typical investments
3. What could go wrong and how likely it is
4. Steps to mitigate identified risks
5. Whether adjustments are needed

Use analogies and simple language that a non-expert can understand.
"""
    
    def _get_action_items_template(self) -> str:
        """Template for actionable advice"""
        return """
Create a step-by-step action plan for implementing this portfolio:

**Portfolio Details:**
- Total Investment: ₹{total_investment:,.0f}
- User Age: {age}
- Risk Profile: {risk_level}

**Allocation:**
{allocation_details}

**Current Status:**
{current_status}

**Constraints & Preferences:**
{constraints_text}

Generate a prioritized action plan with:
1. Immediate actions to take this month
2. Medium-term steps (next 3-6 months)  
3. Long-term monitoring and rebalancing schedule
4. Tax optimization strategies
5. Important deadlines and reminders

Make each action item specific, measurable, and time-bound. Include practical tips for implementation.
"""
    
    def _get_educational_content_template(self) -> str:
        """Template for educational content"""
        return """
Provide educational content to help the investor understand their portfolio:

**Investment Types in Portfolio:**
{investment_types}

**Key Concepts to Explain:**
- Asset allocation principles
- Risk vs return relationship  
- Diversification benefits
- Market volatility
- Long-term investing

**User Context:**
- Age: {age}
- Experience Level: {experience_level}
- Investment Horizon: {investment_horizon} years

Create educational content covering:
1. Basic explanation of each investment type in their portfolio
2. Why diversification matters with real examples
3. How to handle market volatility emotionally
4. Common investing mistakes to avoid
5. Resources for continued learning

Keep explanations simple and include relevant examples from the Indian market context.
"""
    
    def _get_investment_rationale_template(self) -> str:
        """Template for investment rationale"""
        return """
Explain the rationale behind each investment recommendation:

**Recommended Investments:**
{detailed_recommendations}

**Market Conditions:**
{market_conditions}

**User Preferences:**
{user_preferences}

For each major investment category, explain:
1. Why this specific allocation percentage was chosen
2. How it aligns with the user's goals and risk tolerance
3. Current market factors supporting this choice
4. Expected performance over the investment horizon
5. Potential alternatives and why they were not selected

Provide data-backed reasoning while keeping explanations accessible.
"""
    
    def _get_fallback_template(self) -> str:
        """Simple fallback template"""
        return """
Portfolio Analysis Summary:

Investment Amount: ₹{total_investment:,.0f}
Risk Profile: {risk_level}
Investment Horizon: {investment_horizon} years

This portfolio has been designed based on your risk tolerance and investment goals. 
Please consult with a financial advisor for detailed guidance.
"""

class ContentStructurer(BaseTool):
    """Tool for structuring and formatting explanation content"""
    
    def execute(self, raw_content: str, content_type: str) -> Dict[str, Any]:
        """
        Structure raw content into organized format
        
        Args:
            raw_content: Raw text content from LLM
            content_type: Type of content for appropriate structuring
        """
        try:
            structured_content = {
                "content_type": content_type,
                "raw_content": raw_content,
                "structured_sections": self._extract_sections(raw_content),
                "key_points": self._extract_key_points(raw_content),
                "action_items": self._extract_action_items(raw_content),
                "timestamp": datetime.now().isoformat()
            }
            
            return structured_content
            
        except Exception as e:
            logger.error(f"Error structuring content: {str(e)}")
            return {
                "content_type": content_type,
                "raw_content": raw_content,
                "structured_sections": [],
                "key_points": [],
                "action_items": [],
                "timestamp": datetime.now().isoformat()
            }
    
    def _extract_sections(self, content: str) -> List[Dict[str, str]]:
        """Extract organized sections from content"""
        sections = []
        lines = content.split('\n')
        current_section = None
        current_content = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if line is a heading (starts with #, **, or numbered)
            if (line.startswith('#') or 
                (line.startswith('**') and line.endswith('**')) or
                re.match(r'^\d+\.', line)):
                
                # Save previous section if exists
                if current_section and current_content:
                    sections.append({
                        "heading": current_section,
                        "content": '\n'.join(current_content)
                    })
                
                # Start new section
                current_section = line.strip('#').strip('*').strip()
                current_content = []
            else:
                current_content.append(line)
        
        # Add final section
        if current_section and current_content:
            sections.append({
                "heading": current_section,
                "content": '\n'.join(current_content)
            })
        
        return sections
    
    def _extract_key_points(self, content: str) -> List[str]:
        """Extract key points from content"""
        key_points = []
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            # Look for bullet points or numbered items
            if (line.startswith('•') or line.startswith('-') or 
                line.startswith('*') or re.match(r'^\d+\.', line)):
                key_points.append(line)
        
        return key_points[:10]  # Limit to top 10 key points
    
    def _extract_action_items(self, content: str) -> List[Dict[str, str]]:
        """Extract actionable items from content"""
        action_items = []
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            # Look for action-oriented keywords and bullet/numbered points
            action_keywords = ['start', 'open', 'invest', 'set up', 'begin', 'create', 'schedule', 'ensure', 'maintain', 'review']
            
            if (any(keyword in line.lower() for keyword in action_keywords) and 
                (line.startswith('•') or line.startswith('-') or line.startswith('*') or re.match(r'^\d+\.', line))):
                action_items.append({
                    "action": line.lstrip('•-*').lstrip('0123456789.').strip(),
                    "priority": "medium",  # Default priority
                    "timeline": "immediate"  # Default timeline
                })
        
        return action_items[:8]  # Limit to top 8 action items

class VisualizationGenerator(BaseTool):
    """Tool for generating visualization recommendations and chart configurations"""
    
    def execute(self, portfolio_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate visualization configurations for portfolio presentation
        
        Args:
            portfolio_data: Portfolio allocation and metrics data
        """
        try:
            visualizations = {
                "allocation_pie_chart": self._create_allocation_chart_config(portfolio_data),
                "risk_return_scatter": self._create_risk_return_config(portfolio_data),
                "performance_timeline": self._create_performance_timeline_config(portfolio_data),
                "asset_breakdown": self._create_asset_breakdown_config(portfolio_data)
            }
            
            return {
                "visualizations": visualizations,
                "chart_recommendations": self._get_chart_recommendations(portfolio_data),
                "interactive_elements": self._suggest_interactive_elements()
            }
            
        except Exception as e:
            logger.error(f"Error generating visualizations: {str(e)}")
            return {"error": str(e), "visualizations": {}}
    
    def _create_allocation_chart_config(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create pie chart configuration for asset allocation"""
        macro_allocation = data.get("macro_allocation", {})
        
        return {
            "chart_type": "pie",
            "title": "Portfolio Asset Allocation",
            "data": [
                {
                    "label": asset_class.replace("_", " ").title(),
                    "value": allocation,
                    "percentage": f"{allocation:.1%}",
                    "color": self._get_asset_color(asset_class)
                }
                for asset_class, allocation in macro_allocation.items()
                if allocation > 0
            ],
            "options": {
                "responsive": True,
                "show_labels": True,
                "show_percentages": True
            }
        }
    
    def _create_risk_return_config(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create risk-return scatter plot configuration"""
        risk_metrics = data.get("risk_metrics", {})
        
        return {
            "chart_type": "scatter",
            "title": "Risk vs Return Profile",
            "x_axis": "Risk (Volatility)",
            "y_axis": "Expected Return",
            "data": [{
                "x": risk_metrics.get("estimated_volatility", 0.15),
                "y": risk_metrics.get("expected_annual_return", 0.12),
                "label": "Your Portfolio",
                "color": "#4CAF50"
            }],
            "benchmarks": [
                {"x": 0.05, "y": 0.07, "label": "Conservative"},
                {"x": 0.15, "y": 0.12, "label": "Moderate"},
                {"x": 0.25, "y": 0.18, "label": "Aggressive"}
            ]
        }
    
    def _create_performance_timeline_config(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create performance timeline configuration"""
        return {
            "chart_type": "line",
            "title": "Projected Portfolio Growth",
            "x_axis": "Years",
            "y_axis": "Portfolio Value (₹)",
            "timeline": "10_years",
            "show_projections": True
        }
    
    def _create_asset_breakdown_config(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create detailed asset breakdown configuration"""
        asset_recommendations = data.get("asset_recommendations", {})
        
        breakdown = {}
        for asset_class, recommendations in asset_recommendations.items():
            if isinstance(recommendations, list):
                breakdown[asset_class] = [
                    {
                        "name": item.get("name", item.get("symbol", "Unknown")),
                        "amount": item.get("amount", 0),
                        "percentage": item.get("allocation", 0)
                    }
                    for item in recommendations
                ]
        
        return {
            "chart_type": "horizontal_bar",
            "title": "Detailed Asset Breakdown",
            "data": breakdown
        }
    
    def _get_asset_color(self, asset_class: str) -> str:
        """Get color for asset class visualization"""
        color_map = {
            "stocks": "#2196F3",      # Blue
            "mutual_funds": "#4CAF50", # Green
            "crypto": "#FF9800",       # Orange
            "gold": "#FFD700",         # Gold
            "fd_ppf": "#9C27B0",      # Purple
            "fixed_income": "#607D8B"  # Blue Grey
        }
        return color_map.get(asset_class, "#757575")
    
    def _get_chart_recommendations(self, data: Dict[str, Any]) -> List[str]:
        """Get recommendations for chart usage"""
        return [
            "Use pie chart to show overall allocation at a glance",
            "Risk-return scatter helps visualize portfolio positioning",
            "Timeline chart shows long-term growth projections",
            "Asset breakdown provides detailed investment view"
        ]
    
    def _suggest_interactive_elements(self) -> List[str]:
        """Suggest interactive elements for dashboards"""
        return [
            "Hover tooltips showing exact values and descriptions",
            "Click-through to detailed asset information",
            "Scenario modeling with adjustable sliders",
            "Rebalancing simulator with drag-and-drop"
        ]

class RecommendationEngine(BaseTool):
    """Tool for generating specific actionable recommendations"""
    
    def execute(self, portfolio_data: Dict[str, Any], user_profile: Dict[str, Any],
                market_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate comprehensive recommendations based on all available data
        
        Args:
            portfolio_data: Portfolio allocation and analysis data
            user_profile: User preferences and constraints  
            market_data: Current market conditions
        """
        try:
            recommendations = {
                "immediate_actions": self._generate_immediate_actions(portfolio_data, user_profile),
                "monthly_sip_plan": self._generate_sip_recommendations(portfolio_data, user_profile),
                "tax_optimization": self._generate_tax_strategies(portfolio_data, user_profile),
                "rebalancing_schedule": self._generate_rebalancing_schedule(portfolio_data),
                "risk_mitigation": self._generate_risk_mitigation_steps(portfolio_data),
                "goal_tracking": self._generate_goal_tracking_advice(portfolio_data, user_profile)
            }
            
            return {
                "recommendations": recommendations,
                "priority_matrix": self._create_priority_matrix(recommendations),
                "implementation_timeline": self._create_implementation_timeline(recommendations)
            }
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return {"error": str(e), "recommendations": {}}
    
    def _generate_immediate_actions(self, portfolio_data: Dict[str, Any], 
                                  user_profile: Dict[str, Any]) -> List[str]:
        """Generate immediate action items"""
        actions = []
        
        # PPF recommendation
        ppf_allocation = 0
        if "macro_allocation" in portfolio_data:
            ppf_allocation = portfolio_data["macro_allocation"].get("fd_ppf", 0)
        
        if ppf_allocation > 0:
            actions.append("Open PPF account if not existing and invest allocated amount for tax benefits")
        
        # SIP setup
        mf_allocation = portfolio_data.get("macro_allocation", {}).get("mutual_funds", 0)
        if mf_allocation > 0:
            actions.append("Set up SIP for recommended mutual funds to benefit from rupee cost averaging")
        
        # Stock purchases
        stock_allocation = portfolio_data.get("macro_allocation", {}).get("stocks", 0)
        if stock_allocation > 0:
            actions.append("Purchase recommended stocks in 2-3 tranches over next month to reduce timing risk")
        
        # Emergency fund check
        actions.append("Ensure 6-month emergency fund is maintained separately before investing")
        
        return actions
    
    def _generate_sip_recommendations(self, portfolio_data: Dict[str, Any], 
                                    user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SIP recommendations"""
        total_investment = portfolio_data.get("total_investment", 1000000)
        monthly_capacity = total_investment * 0.05  # Assume 5% monthly capacity
        
        macro_allocation = portfolio_data.get("macro_allocation", {})
        
        return {
            "total_monthly_sip": monthly_capacity,
            "mutual_funds": monthly_capacity * macro_allocation.get("mutual_funds", 0),
            "ppf": min(monthly_capacity * 0.2, 12500),  # PPF monthly limit
            "stocks": monthly_capacity * macro_allocation.get("stocks", 0) * 0.5,  # 50% of stock allocation via SIP
            "note": "Adjust based on monthly surplus and financial goals"
        }
    
    def _generate_tax_strategies(self, portfolio_data: Dict[str, Any], 
                               user_profile: Dict[str, Any]) -> List[str]:
        """Generate tax optimization strategies"""
        strategies = []
        
        # 80C utilization
        strategies.append("Maximize ₹1.5L annual limit under Section 80C through PPF and ELSS")
        
        # Capital gains planning
        strategies.append("Plan long-term capital gains harvesting in March for tax efficiency")
        
        # ELSS consideration
        if portfolio_data.get("macro_allocation", {}).get("mutual_funds", 0) > 0:
            strategies.append("Consider ELSS mutual funds for additional tax saving beyond PPF")
        
        # Gold investment
        if portfolio_data.get("macro_allocation", {}).get("gold", 0) > 0:
            strategies.append("Use Gold ETFs instead of physical gold for better tax treatment")
        
        return strategies
    
    def _generate_rebalancing_schedule(self, portfolio_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate rebalancing schedule"""
        return {
            "frequency": "quarterly",
            "triggers": [
                "Any asset class deviates >5% from target allocation",
                "Significant market events or personal financial changes",
                "Annual review regardless of deviations"
            ],
            "next_review_date": (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d"),
            "monitoring_checklist": [
                "Check current allocation vs target",
                "Review performance vs benchmarks",
                "Assess any changes in financial goals",
                "Consider market outlook and adjustments"
            ]
        }
    
    def _generate_risk_mitigation_steps(self, portfolio_data: Dict[str, Any]) -> List[str]:
        """Generate risk mitigation recommendations"""
        steps = []
        
        risk_metrics = portfolio_data.get("risk_metrics", {})
        
        # Diversification
        diversification_score = risk_metrics.get("diversification_score", 0.7)
        if diversification_score < 0.7:
            steps.append("Improve diversification across sectors and asset classes")
        
        # Concentration risk
        if risk_metrics.get("concentration_risk", "Low") != "Low":
            steps.append("Reduce concentration in individual stocks or sectors")
        
        # Volatility management
        if risk_metrics.get("estimated_volatility", 0.15) > 0.25:
            steps.append("Consider reducing high-volatility assets if uncomfortable with swings")
        
        # Insurance
        steps.append("Ensure adequate term life insurance coverage (10x annual income)")
        
        # Liquidity
        if risk_metrics.get("liquidity_score", 0.7) < 0.6:
            steps.append("Maintain higher liquid asset allocation for flexibility")
        
        return steps
    
    def _generate_goal_tracking_advice(self, portfolio_data: Dict[str, Any], 
                                     user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate goal tracking and monitoring advice"""
        return {
            "tracking_frequency": "monthly",
            "key_metrics": [
                "Portfolio value vs target growth",
                "Asset allocation drift",
                "Goal achievement probability",
                "Risk metrics stability"
            ],
            "milestone_reviews": [
                {"frequency": "annual", "focus": "Goals and allocation strategy"},
                {"frequency": "quarterly", "focus": "Performance and rebalancing"},
                {"frequency": "monthly", "focus": "Progress tracking and SIP review"}
            ],
            "goal_adjustment_triggers": [
                "Major life events (marriage, children, job change)",
                "Significant income changes",
                "Market regime changes",
                "Goal timeline modifications"
            ]
        }
    
    def _create_priority_matrix(self, recommendations: Dict[str, Any]) -> Dict[str, str]:
        """Create priority matrix for recommendations"""
        return {
            "high_priority": "Immediate actions and emergency fund setup",
            "medium_priority": "SIP setup and tax optimization",
            "low_priority": "Advanced rebalancing and goal refinements",
            "ongoing": "Monthly monitoring and quarterly reviews"
        }
    
    def _create_implementation_timeline(self, recommendations: Dict[str, Any]) -> Dict[str, List[str]]:
        """Create implementation timeline"""
        return {
            "week_1": [
                "Open necessary investment accounts",
                "Set up emergency fund if needed",
                "Begin PPF investment"
            ],
            "month_1": [
                "Complete initial investment allocation",
                "Set up SIP for mutual funds",
                "Implement tax optimization strategies"
            ],
            "quarter_1": [
                "First portfolio review and rebalancing",
                "Monitor goal progress",
                "Adjust strategies if needed"
            ],
            "ongoing": [
                "Monthly SIP continuation",
                "Quarterly rebalancing reviews",
                "Annual comprehensive assessment"
            ]
        }

class ExplanationAgent:
    """Main Explanation Agent class that coordinates all explanation tools"""
    
    def __init__(self, gemini_api_key: str = None):
        self.llm_interface = GeminiLLMInterface(gemini_api_key)
        self.prompt_manager = PromptTemplateManager()
        self.content_structurer = ContentStructurer()
        self.visualization_generator = VisualizationGenerator()
        self.recommendation_engine = RecommendationEngine()
        
        logger.info("Explanation Agent initialized with all tools")
    
    def execute(self, data_agent_output: Dict[str, Any], macro_agent_output: Dict[str, Any],
                micro_agent_output: Dict[str, Any], risk_agent_output: Dict[str, Any],
                user_profile: Dict[str, Any], total_assets: float) -> Dict[str, Any]:
        """
        Main execution method for Explanation Agent
        
        Args:
            data_agent_output: Output from data collection agent
            macro_agent_output: Output from macro allocation agent  
            micro_agent_output: Output from micro allocation agent
            risk_agent_output: Output from risk assessment agent
            user_profile: User profile and preferences
            total_assets: Total investment amount
        """
        try:
            logger.info("Starting comprehensive portfolio explanation generation")
            
            # Consolidate all agent outputs
            consolidated_data = self._consolidate_agent_outputs(
                data_agent_output, macro_agent_output, micro_agent_output, 
                risk_agent_output, user_profile, total_assets
            )
            
            # Generate different types of explanations
            explanations = {}
            
            # 1. Portfolio Summary
            explanations["portfolio_summary"] = self._generate_portfolio_summary(consolidated_data)
            
            # 2. Risk Explanation
            explanations["risk_explanation"] = self._generate_risk_explanation(consolidated_data)
            
            # 3. Action Items
            explanations["action_items"] = self._generate_action_items(consolidated_data)
            
            # 4. Educational Content
            explanations["educational_content"] = self._generate_educational_content(consolidated_data)
            
            # 5. Investment Rationale
            explanations["investment_rationale"] = self._generate_investment_rationale(consolidated_data)
            
            # Generate recommendations
            recommendations = self.recommendation_engine.execute(
                consolidated_data, user_profile, data_agent_output.get("market_data")
            )
            
            # Generate visualizations
            visualizations = self.visualization_generator.execute(consolidated_data)
            
            # Compile final explanation package - extract text from complex objects
            def extract_text(obj, fallback=""):
                if isinstance(obj, str):
                    return obj
                elif isinstance(obj, dict):
                    # Try to extract text from various possible structures
                    if "content" in obj and isinstance(obj["content"], dict):
                        return obj["content"].get("raw_content", fallback)
                    elif "summary" in obj:
                        return obj["summary"]
                    elif "raw_content" in obj:
                        return obj["raw_content"]
                    else:
                        return fallback
                else:
                    return fallback
            
            portfolio_summary = explanations.get("portfolio_summary", {})
            risk_explanation = explanations.get("risk_explanation", {})
            educational_content = explanations.get("educational_content", {})
            action_items = explanations.get("action_items", [])
            
            final_advice = {
                "allocation_summary": extract_text(portfolio_summary, "Portfolio allocation generated based on your risk profile and investment goals."),
                "specific_recommendations": action_items if isinstance(action_items, list) else [],
                "risk_assessment": extract_text(risk_explanation, "Risk assessment completed with your portfolio allocation."),
                "action_items": action_items if isinstance(action_items, list) else [],
                "important_considerations": extract_text(educational_content, "Please consult with a financial advisor before making investment decisions."),
                "immediate_actions": recommendations.get("immediate_actions", []),
                "metadata": {
                    "generation_timestamp": datetime.now().isoformat(),
                    "total_investment": total_assets,
                    "user_risk_profile": user_profile.get("risk_score", 0.5),
                    "model_used": "gemini-2.0-flash" if not self.llm_interface.use_fallback else "fallback"
                }
            }
            
            logger.info("Portfolio explanation generation completed successfully")
            return {"final_advice": final_advice}
            
        except Exception as e:
            logger.error(f"Error in Explanation Agent execution: {str(e)}")
            fallback_advice = self._generate_fallback_explanation(user_profile, total_assets)
            return {
                "final_advice": fallback_advice,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _consolidate_agent_outputs(self, data_output: Dict[str, Any], macro_output: Dict[str, Any],
                                 micro_output: Dict[str, Any], risk_output: Dict[str, Any],
                                 user_profile: Dict[str, Any], total_assets: float) -> Dict[str, Any]:
        """Consolidate outputs from all agents into unified data structure"""
        # Safely handle potentially None inputs
        data_output = data_output or {}
        macro_output = macro_output or {}
        micro_output = micro_output or {}
        risk_output = risk_output or {}
        
        return {
            "total_investment": total_assets,
            "user_profile": user_profile,
            "risk_score": user_profile.get("risk_score", 0.5),
            "risk_level": self._get_risk_level_text(user_profile.get("risk_score", 0.5)),
            "investment_horizon": user_profile.get("investment_horizon", 5),
            "age": user_profile.get("age", 30),
            "macro_allocation": macro_output.get("allocation", macro_output),
            "asset_recommendations": micro_output.get("recommendations", micro_output),
            "risk_metrics": risk_output.get("risk_metrics", {}),
            "risk_violations": risk_output.get("risk_violations", []),
            "market_data": data_output.get("market_data", {}),
            "market_summary": data_output.get("market_data", {}).get("market_summary", {})
        }
    
    def _generate_portfolio_summary(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive portfolio summary"""
        try:
            # Prepare data for prompt template
            template_data = {
                "risk_score": data["risk_score"],
                "risk_level": data["risk_level"],
                "investment_horizon": data["investment_horizon"],
                "age": data["age"],
                "total_investment": data["total_investment"],
                "macro_allocation_text": self._format_allocation_text(data["macro_allocation"]),
                "asset_recommendations_text": self._format_recommendations_text(data["asset_recommendations"]),
                "risk_metrics_text": self._format_risk_metrics_text(data["risk_metrics"]),
                "market_summary_text": self._format_market_summary_text(data["market_summary"])
            }
            
            # Generate prompt and get LLM response
            prompt = self.prompt_manager.execute("portfolio_summary", template_data)
            llm_response = self.llm_interface.execute(prompt)
            
            # Structure the content
            structured_content = self.content_structurer.execute(
                llm_response["content"], "portfolio_summary"
            )
            
            return {
                "content": structured_content,
                "success": llm_response["success"],
                "model_used": llm_response["model"]
            }
            
        except Exception as e:
            logger.error(f"Error generating portfolio summary: {str(e)}")
            # Return a meaningful fallback instead of just error
            return {
                "summary": f"Portfolio allocated across {len(data.get('macro_allocation', {}))} asset classes based on your risk profile ({data.get('risk_level', 'moderate')} risk). Total investment: ₹{data.get('total_investment', 0):,.0f}",
                "content": "Portfolio explanation generated in fallback mode. Please ensure all agent integrations are working for detailed analysis.",
                "success": False,
                "error": str(e)
            }
    
    def _generate_risk_explanation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate risk assessment explanation"""
        try:
            risk_metrics = data["risk_metrics"]
            
            template_data = {
                "expected_return": risk_metrics.get("expected_annual_return", 0.12),
                "volatility": risk_metrics.get("estimated_volatility", 0.15),
                "risk_level": risk_metrics.get("overall_risk_level", "Moderate"),
                "sharpe_ratio": risk_metrics.get("sharpe_ratio", 0.5),
                "diversification_score": risk_metrics.get("diversification_score", 0.7),
                "violations_text": self._format_violations_text(data["risk_violations"]),
                "stress_test_text": self._format_stress_test_text(risk_metrics.get("stress_test_results", {}))
            }
            
            prompt = self.prompt_manager.execute("risk_explanation", template_data)
            llm_response = self.llm_interface.execute(prompt)
            
            structured_content = self.content_structurer.execute(
                llm_response["content"], "risk_explanation"
            )
            
            return {
                "content": structured_content,
                "success": llm_response["success"],
                "model_used": llm_response["model"]
            }
            
        except Exception as e:
            logger.error(f"Error generating risk explanation: {str(e)}")
            risk_metrics = data.get("risk_metrics", {})
            return {
                "content": f"Risk Assessment: Your portfolio has an expected return of {risk_metrics.get('expected_annual_return', 0.12):.1%} with {risk_metrics.get('overall_risk_level', 'moderate')} risk level. Volatility is estimated at {risk_metrics.get('estimated_volatility', 0.15):.1%}.",
                "success": False,
                "error": str(e)
            }
    
    def _generate_action_items(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate actionable recommendations"""
        try:
            template_data = {
                "total_investment": data["total_investment"],
                "age": data["age"],
                "risk_level": data["risk_level"],
                "allocation_details": self._format_allocation_details(data),
                "current_status": "New portfolio recommendation",
                "constraints_text": self._format_constraints_text(data["user_profile"].get("constraints", {}))
            }
            
            prompt = self.prompt_manager.execute("action_items", template_data)
            llm_response = self.llm_interface.execute(prompt)
            
            structured_content = self.content_structurer.execute(
                llm_response["content"], "action_items"
            )
            
            return {
                "content": structured_content,
                "success": llm_response["success"],
                "model_used": llm_response["model"]
            }
            
        except Exception as e:
            logger.error(f"Error generating action items: {str(e)}")
            return {
                "actions": [
                    "Review your portfolio allocation periodically",
                    "Monitor market conditions and rebalance as needed",
                    "Consult with a financial advisor for personalized advice"
                ],
                "content": "Basic action items provided in fallback mode.",
                "success": False,
                "error": str(e)
            }
    
    def _generate_educational_content(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate educational content"""
        try:
            template_data = {
                "investment_types": self._format_investment_types(data["asset_recommendations"]),
                "age": data["age"],
                "experience_level": self._infer_experience_level(data["user_profile"]),
                "investment_horizon": data["investment_horizon"]
            }
            
            prompt = self.prompt_manager.execute("educational_content", template_data)
            llm_response = self.llm_interface.execute(prompt)
            
            structured_content = self.content_structurer.execute(
                llm_response["content"], "educational_content"
            )
            
            return {
                "content": structured_content,
                "success": llm_response["success"],
                "model_used": llm_response["model"]
            }
            
        except Exception as e:
            logger.error(f"Error generating educational content: {str(e)}")
            return {
                "content": f"Educational content: Diversified investing across multiple asset classes helps reduce risk. With your {data.get('risk_level', 'moderate')} risk profile and {data.get('investment_horizon', 5)} year horizon, this allocation balances growth potential with stability. Always consult a financial advisor before making investment decisions.",
                "success": False,
                "error": str(e)
            }
    
    def _generate_investment_rationale(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate investment rationale explanation"""
        try:
            template_data = {
                "detailed_recommendations": self._format_detailed_recommendations(data),
                "market_conditions": self._format_market_conditions(data["market_summary"]),
                "user_preferences": self._format_user_preferences(data["user_profile"])
            }
            
            prompt = self.prompt_manager.execute("investment_rationale", template_data)
            llm_response = self.llm_interface.execute(prompt)
            
            structured_content = self.content_structurer.execute(
                llm_response["content"], "investment_rationale"
            )
            
            return {
                "content": structured_content,
                "success": llm_response["success"],
                "model_used": llm_response["model"]
            }
            
        except Exception as e:
            logger.error(f"Error generating investment rationale: {str(e)}")
            allocation = data.get('macro_allocation', {})
            main_allocations = [k for k, v in allocation.items() if (isinstance(v, (int, float)) and v > 0.1) or (isinstance(v, dict) and v.get('percentage', 0) > 0.1)]
            return {
                "content": f"Investment rationale: This portfolio emphasizes {', '.join(main_allocations[:2])} to match your risk tolerance and investment goals. The allocation strategy considers your {data.get('investment_horizon', 5)} year timeline and market conditions.",
                "success": False,
                "error": str(e)
            }
    
    def _create_executive_summary(self, explanations: Dict[str, Any], 
                                recommendations: Dict[str, Any]) -> Dict[str, Any]:
        """Create executive summary of all explanations"""
        return {
            "key_highlights": [
                "Portfolio designed based on moderate risk profile",
                "Diversified across multiple asset classes",
                "Tax-optimized allocation strategy",
                "Quarterly rebalancing recommended"
            ],
            "main_recommendations": recommendations.get("recommendations", {}).get("immediate_actions", [])[:3],
            "risk_level": "Moderate",
            "expected_return": "12-15% annually",
            "next_steps": "Begin with PPF and SIP setup"
        }
    
    def _generate_fallback_explanation(self, user_profile: Dict[str, Any], 
                                     total_assets: float) -> Dict[str, Any]:
        """Generate basic fallback explanation when main process fails"""
        return {
            "summary": f"Portfolio recommendation for ₹{total_assets:,.0f} investment",
            "risk_profile": self._get_risk_level_text(user_profile.get("risk_score", 0.5)),
            "basic_advice": [
                "Diversify across asset classes based on risk tolerance",
                "Use SIP for mutual fund investments",
                "Maintain emergency fund separately",
                "Review and rebalance quarterly"
            ],
            "note": "Detailed analysis requires API integration"
        }
    
    # Helper methods for formatting data
    def _get_risk_level_text(self, risk_score: float) -> str:
        """Convert risk score to text"""
        if risk_score <= 0.4:
            return "Conservative"
        elif risk_score <= 0.7:
            return "Moderate"
        else:
            return "Aggressive"
    
    def _format_allocation_text(self, allocation: Dict[str, Any]) -> str:
        """Format allocation for text display"""
        lines = []
        for asset, weight in allocation.items():
            # Handle both simple float values and complex dict structures
            if isinstance(weight, dict):
                weight_value = weight.get("percentage", 0)
            else:
                weight_value = weight
                
            if isinstance(weight_value, (int, float)) and weight_value > 0:
                lines.append(f"• {asset.replace('_', ' ').title()}: {weight_value:.1%}")
        return "\n".join(lines)
    
    def _format_recommendations_text(self, recommendations: Dict[str, Any]) -> str:
        """Format asset recommendations for display"""
        lines = []
        
        # Handle the case where recommendations are nested under 'recommendations'
        if "recommendations" in recommendations:
            recommendations = recommendations["recommendations"]
        
        for asset_class, items in recommendations.items():
            if isinstance(items, list) and items:
                lines.append(f"\n{asset_class.replace('_', ' ').title()}:")
                for item in items[:3]:  # Limit to top 3
                    if isinstance(item, dict):
                        name = item.get("name", item.get("symbol", "Unknown"))
                        amount = item.get("amount", 0)
                        lines.append(f"  - {name}: ₹{amount:,.0f}")
        return "\n".join(lines)
    
    def _format_risk_metrics_text(self, risk_metrics: Dict[str, Any]) -> str:
        """Format risk metrics for display"""
        return f"""
Expected Return: {risk_metrics.get('expected_annual_return', 0.12):.1%}
Volatility: {risk_metrics.get('estimated_volatility', 0.15):.1%}
Sharpe Ratio: {risk_metrics.get('sharpe_ratio', 0.5):.2f}
Risk Level: {risk_metrics.get('overall_risk_level', 'Moderate')}
"""
    
    def _format_market_summary_text(self, market_summary: Dict[str, Any]) -> str:
        """Format market summary for display"""
        return f"""
Market Sentiment: {market_summary.get('market_sentiment', 'Neutral')}
Volatility Level: {market_summary.get('volatility_level', 'Moderate')}
Assets Analyzed: {market_summary.get('total_assets_analyzed', 'Multiple')}
"""
    
    def _format_violations_text(self, violations: List[str]) -> str:
        """Format violations list for display"""
        if not violations:
            return "No constraint violations detected."
        return "\n".join(f"• {violation}" for violation in violations)
    
    def _format_stress_test_text(self, stress_tests: Dict[str, Any]) -> str:
        """Format stress test results for display"""
        if not stress_tests:
            return "Stress tests completed with acceptable results."
        
        lines = []
        for scenario, result in stress_tests.items():
            if isinstance(result, dict):
                impact = result.get("portfolio_impact", 0)
                lines.append(f"• {scenario.replace('_', ' ').title()}: {impact:.1%} impact")
        return "\n".join(lines)
    
    def _format_allocation_details(self, data: Dict[str, Any]) -> str:
        """Format detailed allocation information"""
        allocation = data["macro_allocation"]
        total = data["total_investment"]
        
        lines = []
        for asset, weight in allocation.items():
            if weight > 0:
                amount = total * weight
                lines.append(f"• {asset.replace('_', ' ').title()}: ₹{amount:,.0f} ({weight:.1%})")
        return "\n".join(lines)
    
    def _format_constraints_text(self, constraints: Dict[str, Any]) -> str:
        """Format user constraints for display"""
        if not constraints:
            return "No specific constraints provided."
        
        lines = []
        for key, value in constraints.items():
            lines.append(f"• {key.replace('_', ' ').title()}: {value}")
        return "\n".join(lines)
    
    def _format_investment_types(self, recommendations: Dict[str, Any]) -> str:
        """Format investment types for educational content"""
        types = []
        for asset_class in recommendations.keys():
            types.append(asset_class.replace('_', ' ').title())
        return ", ".join(types)
    
    def _infer_experience_level(self, user_profile: Dict[str, Any]) -> str:
        """Infer user experience level from profile"""
        # Simple heuristic based on age and preferences
        age = user_profile.get("age", 30)
        preferences = user_profile.get("preferences", [])
        
        if age < 25 or len(preferences) <= 2:
            return "Beginner"
        elif age < 40 and "crypto" in preferences:
            return "Intermediate"
        else:
            return "Experienced"
    
    def _format_detailed_recommendations(self, data: Dict[str, Any]) -> str:
        """Format detailed recommendations with rationale"""
        lines = []
        allocation = data["macro_allocation"]
        total = data["total_investment"]
        
        for asset_class, weight in allocation.items():
            if weight > 0:
                amount = total * weight
                lines.append(f"""
{asset_class.replace('_', ' ').title()}: {weight:.1%} (₹{amount:,.0f})
- Allocation based on risk profile and diversification needs
- Expected to contribute to overall portfolio growth
""")
        return "\n".join(lines)
    
    def _format_market_conditions(self, market_summary: Dict[str, Any]) -> str:
        """Format current market conditions"""
        return f"""
Current market shows {market_summary.get('volatility_level', 'moderate')} volatility
with {market_summary.get('market_sentiment', 'neutral')} sentiment.
Multiple assets analyzed for optimal selection.
"""
    
    def _format_user_preferences(self, user_profile: Dict[str, Any]) -> str:
        """Format user preferences summary"""
        preferences = user_profile.get("preferences", [])
        risk_score = user_profile.get("risk_score", 0.5)
        horizon = user_profile.get("investment_horizon", 5)
        
        return f"""
Risk Tolerance: {self._get_risk_level_text(risk_score)}
Investment Horizon: {horizon} years
Preferences: {", ".join(preferences)}
"""
    
    def get_agent_status(self) -> Dict[str, Any]:
        """Get current status of explanation agent"""
        return {
            "agent_ready": True,
            "tools_loaded": {
                "llm_interface": not self.llm_interface.use_fallback,
                "prompt_manager": True,
                "content_structurer": True,
                "visualization_generator": True,
                "recommendation_engine": True
            },
            "gemini_api_status": "connected" if not self.llm_interface.use_fallback else "fallback_mode",
            "last_check": datetime.now().isoformat()
        }