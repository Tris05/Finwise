import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { amount, rate, tenure, loanType } = await req.json()
  
  // Calculate EMI using the formula: EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
  const monthlyRate = rate / 100 / 12
  const emi = Math.round((amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1))
  
  // Calculate loan balance schedule
  const schedule = []
  let balance = amount
  for (let month = 1; month <= tenure; month += 12) {
    if (month <= tenure) {
      const remainingMonths = tenure - month + 1
      const remainingEMI = Math.round((balance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / (Math.pow(1 + monthlyRate, remainingMonths) - 1))
      balance = Math.max(0, balance - (emi * 12))
      schedule.push({ month, balance: Math.round(balance) })
    }
  }
  
  // Determine affordability and risk based on loan type and amount
  let affordability = "Medium"
  let risk = "Medium"
  let mitigations = []
  
  if (loanType === "house") {
    if (amount > 10000000) {
      affordability = "Low"
      risk = "High"
      mitigations = [
        "Consider increasing down payment to reduce EMI burden",
        "Look for lower interest rates from SBI or HDFC",
        "Ensure monthly EMI is less than 40% of income",
        "Consider longer tenure with prepayment flexibility"
      ]
    } else {
      mitigations = [
        "SBI offers lowest home loan rates (8.4%)",
        "Consider prepayment to save interest",
        "Maintain DTI < 40% as per RBI guidelines",
        "Check for government subsidies if eligible"
      ]
    }
  } else if (loanType === "car") {
    if (amount > 1500000) {
      affordability = "Low"
      risk = "High"
      mitigations = [
        "Consider higher down payment to reduce EMI",
        "Compare rates from multiple banks",
        "Ensure EMI doesn't exceed 20% of monthly income",
        "Consider shorter tenure for car loans"
      ]
    } else {
      mitigations = [
        "HDFC offers competitive car loan rates",
        "Consider shorter tenure (3-5 years) for cars",
        "Check for manufacturer financing offers",
        "Maintain good credit score for better rates"
      ]
    }
  } else if (loanType === "student") {
    mitigations = [
      "SBI offers lowest education loan rates (7.5%)",
      "Moratorium period available during studies",
      "Interest subsidy available for certain courses",
      "Consider government education loan schemes"
    ]
  }
  
  const response = {
    emi,
    affordability,
    risk,
    schedule,
    mitigations
  }
  
  return NextResponse.json(response)
}
