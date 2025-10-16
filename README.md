# FinWise — AI Financial Coaching Platform (Indian Context)

Production-like Next.js (App Router) + Tailwind + shadcn/ui frontend with mock APIs, localized for Indian financial context. Implements dashboard, investments (rebalance + credit cards), advisor chat, documents, salary optimizer, loan/EMI, learning (gamification), security, and settings.

## 🇮🇳 Indianization Features

### Indian Financial Context
- **Banks**: HDFC, ICICI, Kotak, Axis, SBI, IDFC First, Mahindra Finance
- **Markets**: NSE, BSE, Sensex, Nifty50
- **Companies**: Reliance, Infosys, TCS, Mahindra, HDFC, Bajaj
- **Currency**: All values in INR (₹) instead of USD ($)
- **Investment Options**: PPF, ELSS, Nifty 50, Gold ETFs, Indian mutual funds

### Loan Types & Bank Comparison
- **Home Loans**: SBI (8.4%), HDFC (8.7%), ICICI (8.9%), Axis (9.1%), Kotak (9.3%)
- **Car Loans**: HDFC (9.2%), ICICI (9.5%), SBI (9.7%), Axis (10.1%), Kotak (10.3%)
- **Education Loans**: SBI (7.5%), HDFC (8.2%), ICICI (8.5%), Axis (8.8%), Kotak (9.1%)

### Document Analysis (Mock)
- **Risk Score**: 70% (Moderate-High Risk)
- **Key Factors**: Credit utilization, savings ratio, EMI obligations
- **Suggestions**: Reduce utilization, increase savings, invest in PPF/Debt funds
- **Indian Banks**: HDFC, SBI, Axis FD recommendations

### AI Advisor Responses
- **Indian Context**: RBI regulations, Section 80C, tax benefits
- **Follow-up Prompts**: Contextual suggestions for each response
- **Demo Prompts**: 12 ready-to-use prompts for presentation

## Run and Preview
- Publish from v0 or open Preview. The Next.js runtime infers deps.
- Routes:
  - /dashboard, /investments, /advisor, /documents, /salary, /loan, /learning, /security, /settings
- Persisted UI: Sidebar + Topbar on all pages.

## Key Behaviors (mocked)
- Rebalance → POST /api/portfolio/rebalance → modal with proposed weights, risk, confidence, SHAP text, and LLM summary. Accept/Reject toasts.
- Credit cards → GET /api/credit/recommend → list with "Why recommended?" modal and compare.
- Chat → POST /api/advisor/chat → typing effect; increments XP via /api/game/progress (mock).
- Documents → Upload shows progress; POST /api/docs/upload → parsed fields + risk summary.
- Salary → POST /api/salary/optimize → before/after chart + savings bullets.
- Loan → POST /api/loan/assess → EMI, affordability/risk, line chart, mitigations with loan type selection.
- Gamification → GET/POST /api/game/progress tracks XP, badges, streak.
- Security → GET/POST /api/security/logs with Acknowledge/Report CTAs.
- Settings → Theme switch (localStorage), 2FA toggle (localStorage only).

## Demo Prompts
Ready-to-use prompts for presentation:
1. "Is crypto risky?"
2. "What is PPF?"
3. "Which is better — SIP or FD?"
4. "Convert $500 to INR"
5. "Show my Kotak credit card balance"
6. "Analyze my uploaded document (mock risk 70%)"
7. "Show last 5 transactions"
8. "How to open ICICI savings account?"
9. "Which is best short-term investment?"
10. "Is PPF tax-free?"
11. "Compare SBI FD vs Axis FD"
12. "Show me Nifty50 trend"

## Where to Change/Mock Responses
- Data JSON: /data/*.json
- API routes: /app/api/** returning the JSON above.
- Demo prompts: /data/demo-prompts.json

## Notes
- UI uses shadcn components and Recharts. Colors use CSS vars (no hard-coded hex).
- Forms are accessible with labels and ARIA.
- All financial data localized to Indian context with realistic bank names and rates.
- Replace mocks with real endpoints preserving response shapes for minimal refactor.
