import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { prompt } = await req.json()
  
  // Indian financial advisor responses
  const responses: { [key: string]: string } = {
    "crypto": "Yes, crypto is highly volatile and not regulated by RBI. It's riskier than traditional investments like mutual funds or PPF. Consider limiting crypto to 5% of your portfolio maximum.",
    "ppf": "PPF (Public Provident Fund) is a government-backed savings scheme with 7.1% annual interest. It's tax-free under Section 80C with 15-year lock-in. Great for long-term wealth building and tax savings.",
    "sip": "SIP (Systematic Investment Plan) in mutual funds offers rupee cost averaging and compound growth. Better than FD for long-term goals due to higher potential returns, though with market risk.",
    "fd": "Fixed Deposits offer guaranteed returns (6-7% p.a.) but lower than equity. Good for emergency fund and short-term goals. Consider SBI, HDFC, or ICICI for better rates.",
    "nifty": "Nifty 50 represents top 50 companies on NSE. It's a good benchmark for Indian equity market performance. Consider Nifty 50 index funds for broad market exposure.",
    "sensex": "Sensex is BSE's benchmark index with 30 large-cap stocks. It's India's oldest stock market index and reflects overall market sentiment.",
    "hdfc": "HDFC Bank offers competitive rates on FDs (6.8% p.a.), credit cards, and home loans. Consider their Millennia card for online spends or Regalia for premium benefits.",
    "icici": "ICICI Bank provides good FD rates (6.9% p.a.) and credit cards. Their Coral card offers travel benefits and the Rubyx card is good for dining rewards.",
    "sbi": "SBI offers government-backed security with competitive rates. Their SimplyCLICK card is great for online shopping with 5x rewards and fuel surcharge waiver.",
    "axis": "Axis Bank has good FD rates (7.0% p.a.) and credit cards. Their My Zone card offers dining rewards and movie vouchers.",
    "kotak": "Kotak Mahindra Bank offers the 811 credit card with no annual fee and 1.5% cashback. Good for building credit history.",
    "risk": "Your risk profile depends on age, income stability, and goals. Young investors can take more equity risk, while those near retirement should focus on capital preservation.",
    "investment": "For Indian investors, consider: 1) PPF for tax-free growth, 2) ELSS mutual funds for tax savings, 3) Nifty 50 index funds for equity exposure, 4) Gold ETFs for diversification.",
    "tax": "Maximize Section 80C (₹1.5L) with PPF, ELSS, EPF. Use HRA exemption, LTA benefits, and health insurance deductions. Consider NPS for additional ₹50K deduction.",
    "emergency": "Keep 6 months expenses in liquid form - HDFC/ICICI savings account, liquid mutual funds, or short-term FDs. Avoid premature withdrawal penalties.",
    "loan": "Compare rates from SBI, HDFC, ICICI, Axis. Maintain DTI < 40% as per RBI guidelines. Consider prepayment to save interest.",
    "balance": "Check your Kotak credit card balance by logging into net banking or mobile app. Current limit: ₹2,50,000, Available: ₹1,80,000, Due: ₹15,000 (due in 5 days).",
    "transactions": "Last 5 transactions: 1) Amazon purchase ₹2,500, 2) Fuel at HP ₹1,200, 3) Swiggy order ₹450, 4) Netflix subscription ₹199, 5) ATM withdrawal ₹5,000.",
    "account": "To open ICICI savings account: Visit branch with Aadhaar, PAN, address proof. Minimum balance ₹10,000. Benefits: Free ATM transactions, net banking, mobile app access.",
    "short-term": "Best short-term investments: 1) Liquid mutual funds (6-7% p.a.), 2) Short-term FDs (6.5-7% p.a.), 3) Arbitrage funds (5-6% p.a.), 4) Ultra-short debt funds.",
    "tax-free": "Yes, PPF is completely tax-free - no tax on deposits, interest, or withdrawals. It's the best tax-saving instrument for long-term wealth building in India.",
    "compare": "SBI FD: 6.8% p.a., 5-year lock-in, government security. Axis FD: 7.0% p.a., flexible tenure, private bank. Choose based on your risk preference and tenure needs.",
    "trend": "Nifty 50 current trend: Up 2.1% this week, trading at 19,850. Key drivers: Strong Q3 results, FII inflows, positive global cues. Support at 19,500, resistance at 20,000."
  }
  
  // Find matching response
  const lowerPrompt = prompt.toLowerCase()
  let reply = ""
  
  for (const [key, response] of Object.entries(responses)) {
    if (lowerPrompt.includes(key)) {
      reply = response
      break
    }
  }
  
  if (!reply) {
    reply = `Based on your query: "${prompt}". For Indian investors with moderate risk profile, consider allocating ~60% to equities (Nifty 50 + mutual funds), 25% to fixed income (PPF/FD), 10% to gold, and 5% to crypto. Keep an emergency fund of 6 months in liquid instruments.`
  }
  
  // Add follow-up suggestions
  const followUps = [
    "Compare this with other investment options",
    "What are the tax implications?",
    "How can I reduce risk in this investment?"
  ]
  
  reply += `\n\nFollow-up suggestions:\n1. ${followUps[0]}\n2. ${followUps[1]}\n3. ${followUps[2]}`

  return NextResponse.json({ reply })
}
