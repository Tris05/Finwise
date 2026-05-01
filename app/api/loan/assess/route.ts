import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { amount, rate, tenure, loanType, annualIncome } = await req.json()
  
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
  
  // Calculate DTI ratio (EMI as % of Monthly Income)
  const monthlyIncome = annualIncome ? annualIncome / 12 : 100000 // Default to 1L if not provided
  const emiStress = Math.round(Math.min(100, (emi / monthlyIncome) * 100))
  
  // Determine affordability and risk based on DTI ratio
  let affordability: "Low" | "Medium" | "High" = "Medium"
  let risk: "Low" | "Medium" | "High" = "Medium"
  let mitigations: string[] = []
  
  // DTI-based affordability and risk assessment
  if (emiStress > 50) {
    affordability = "Low"
    risk = "High"
    mitigations = [
      "Reduce loan amount or increase down payment",
      "Look for lower interest rates from SBI or HDFC", 
      "Consider longer loan tenure to reduce EMI",
      "Increase income before applying for this loan amount"
    ]
  } else if (emiStress > 35) {
    affordability = "Medium" 
    risk = "Medium"
    mitigations = [
      "Monitor EMI burden carefully",
      "Consider prepayment to reduce interest cost",
      "Maintain emergency fund for loan payments",
      "Look for opportunities to refinance at better rates"
    ]
  } else {
    affordability = "High"
    risk = "Low"
    mitigations = [
      "This loan is well within your affordability",
      "Consider prepayment to save on interest",
      "Maintain good credit score for better rates",
      "Check for government subsidies if eligible"
    ]
  }

  // Add loan-type specific mitigations
  if (loanType === "house") {
    mitigations.push("Section 24(b): Tax deduction up to ₹2L on interest")
    mitigations.push("Section 80C: Tax deduction on principal repayment")
  } else if (loanType === "car") {
    mitigations.push("Consider zero-depreciation insurance for new cars")
    mitigations.push("Avoid long tenure for depreciating assets")
  } else if (loanType === "student") {
    mitigations.push("Section 80E: Full interest deduction for 8 years")
    mitigations.push("Utilize moratorium period effectively")
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
