# FinWise — AI Financial Coaching Platform (Mock)

Production-like Next.js (App Router) + Tailwind + shadcn/ui frontend with mock APIs. Implements dashboard, investments (rebalance + credit cards), advisor chat, documents, salary optimizer, loan/EMI, learning (gamification), security, and settings.

Run and Preview
- Publish from v0 or open Preview. The Next.js runtime infers deps.
- Routes:
  - /dashboard, /investments, /advisor, /documents, /salary, /loan, /learning, /security, /settings
- Persisted UI: Sidebar + Topbar on all pages.

Key Behaviors (mocked)
- Rebalance → POST /api/portfolio/rebalance → modal with proposed weights, risk, confidence, SHAP text, and LLM summary. Accept/Reject toasts.
- Credit cards → GET /api/credit/recommend → list with “Why recommended?” modal and compare.
- Chat → POST /api/advisor/chat → typing effect; increments XP via /api/game/progress (mock).
- Documents → Upload shows progress; POST /api/docs/upload → parsed fields + risk summary.
- Salary → POST /api/salary/optimize → before/after chart + savings bullets.
- Loan → POST /api/loan/assess → EMI, affordability/risk, line chart, mitigations.
- Gamification → GET/POST /api/game/progress tracks XP, badges, streak.
- Security → GET/POST /api/security/logs with Acknowledge/Report CTAs.
- Settings → Theme switch (localStorage), 2FA toggle (localStorage only).

Where to Change/Mock Responses
- Data JSON: /data/*.json
- API routes: /app/api/** returning the JSON above.

Notes
- UI uses shadcn components and Recharts. Colors use CSS vars (no hard-coded hex).
- Forms are accessible with labels and ARIA.
- Replace mocks with real endpoints preserving response shapes for minimal refactor.
