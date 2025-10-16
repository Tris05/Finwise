# Components

- AppShell
  - Props: children
  - Usage: Wrap page content for persistent Sidebar + Topbar.

- PortfolioPie
  - Props: { data: { name: string; value: number; color?: string }[], onSliceClick?: (slice) => void }
  - Example: <PortfolioPie data={[{ name:'Stocks', value: 40 }]} />

- RebalanceModal
  - Props: { open: boolean; onOpenChange: (v:boolean) => void }
  - UX: Calls POST /api/portfolio/rebalance and shows allocation + SHAP/summary.

- CreditCardList
  - Props: none
  - UX: GET /api/credit/recommend, compare up to 3, “Why recommended?” modal (SHAP text).

- ChatbotPanel
  - Props: none
  - UX: POST /api/advisor/chat with typing animation. Saves XP via /api/game/progress.

- DocUpload
  - Props: none
  - UX: Simulated upload progress → POST /api/docs/upload → extracted fields + risk summary.

- SalaryOptimizerForm
  - Props: none
  - UX: POST /api/salary/optimize; shows <SalaryResultCard>.

- SalaryResultCard
  - Props: { data: { before[], after[], taxSavings, bullets[] } }
  - UX: Bar chart “Before vs After”.

- LoanCalculator
  - Props: none
  - UX: POST /api/loan/assess; shows EMI, risk, schedule chart, mitigations.

- GamificationCard
  - Props: none
  - UX: GET /api/game/progress; shows XP, badges, streak.

- SecurityTimeline
  - Props: none
  - UX: GET /api/security/logs; actions POST acknowledge/report.
