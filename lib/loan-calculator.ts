/**
 * Comprehensive Loan Calculator with EMI, Prepayment Analysis, and Bank Comparison
 * Integrates with ML models for loan prediction
 */

export interface LoanInputs {
  principal: number
  annualRate: number
  termMonths: number
  extraPayment?: number
}

export interface EMICalculation {
  emi: number
  totalPayment: number
  totalInterest: number
  principal: number
  termMonths: number
  annualRate: number
}

export interface AmortizationEntry {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export interface PrepaymentImpact {
  interestSaved: number
  monthsReduced: number
  monthsNeeded: number
  totalInterestPaid: number
  totalPayment: number
}

export interface BankOffer {
  name: string
  rate: number
  processingFee: number
  minCreditScore: number
  emi: number
  totalInterest: number
  totalCost: number
  features: string[]
}

export interface LoanPredictionInput {
  // Dynamic inputs from user
  loanAmount: number
  loanDuration: number
  baseInterestRate: number
  monthlyLoanPayment: number
  
  // Static profile data (should come from user profile)
  age: number
  annualIncome: number
  creditScore: number
  employmentStatus: string
  experience: number
  monthlyDebtPayments: number
  creditCardUtilizationRate: number
  numberOfOpenCreditLines: number
  numberOfCreditInquiries: number
  bankruptcyHistory: number
  previousLoanDefaults: number
  paymentHistory: number
  lengthOfCreditHistory: number
  savingsAccountBalance: number
  checkingAccountBalance: number
  totalAssets: number
  totalLiabilities: number
  monthlyIncome: number
  utilityBillsPaymentHistory: number
  jobTenure: number
  netWorth: number
  interestRate: number
  totalDebtToIncomeRatio: number
  educationLevel: string
  maritalStatus: string
  homeOwnershipStatus: string
  loanPurpose: string
  numberOfDependents: number
}

export interface LoanPredictionResult {
  riskScore: number
  loanApproved: boolean
  eirr: number
  acceptanceScore: number
  riskLevel: string
}

/**
 * Calculate EMI using the standard formula
 */
export function calculateEMI(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) {
    return principal / termMonths
  }
  
  const monthlyRate = annualRate / 100 / 12
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
              (Math.pow(1 + monthlyRate, termMonths) - 1)
  
  return Math.round(emi * 100) / 100
}

/**
 * Generate amortization schedule
 */
export function generateAmortizationSchedule(
  principal: number, 
  annualRate: number, 
  termMonths: number,
  extraPayment: number = 0,
  monthsToShow: number = 12
): AmortizationEntry[] {
  const monthlyRate = annualRate / 100 / 12
  const schedule: AmortizationEntry[] = []
  let balance = principal
  
  for (let month = 1; month <= Math.min(termMonths, monthsToShow); month++) {
    const interestPayment = balance * monthlyRate
    const principalPayment = Math.min(balance, calculateEMI(principal, annualRate, termMonths) - interestPayment + extraPayment)
    const totalPayment = principalPayment + interestPayment
    
    balance = Math.max(0, balance - principalPayment)
    
    schedule.push({
      month,
      payment: Math.round(totalPayment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.round(balance * 100) / 100
    })
    
    if (balance <= 0) break
  }
  
  return schedule
}

/**
 * Calculate prepayment impact
 */
export function calculatePrepaymentImpact(
  principal: number,
  annualRate: number,
  termMonths: number,
  extraPayment: number
): PrepaymentImpact {
  // Calculate normal loan details
  const normalEMI = calculateEMI(principal, annualRate, termMonths)
  const normalTotalPayment = normalEMI * termMonths
  const normalTotalInterest = normalTotalPayment - principal
  
  // Calculate with prepayment
  let balance = principal
  let totalPaid = 0
  let monthsNeeded = 0
  
  for (let month = 1; month <= termMonths; month++) {
    const monthlyRate = annualRate / 100 / 12
    const interestPayment = balance * monthlyRate
    const principalPayment = Math.min(balance, normalEMI - interestPayment + extraPayment)
    const totalPayment = principalPayment + interestPayment
    
    balance = Math.max(0, balance - principalPayment)
    totalPaid += totalPayment
    monthsNeeded = month
    
    if (balance <= 0) break
  }
  
  const interestSaved = normalTotalInterest - (totalPaid - principal)
  const monthsReduced = termMonths - monthsNeeded
  
  return {
    interestSaved: Math.round(interestSaved * 100) / 100,
    monthsReduced,
    monthsNeeded,
    totalInterestPaid: Math.round((totalPaid - principal) * 100) / 100,
    totalPayment: Math.round(totalPaid * 100) / 100
  }
}

/**
 * Calculate Effective Interest Rate of Return (EIRR)
 */
export function calculateEIRR(riskScore: number, baseRate: number): number {
  const riskPremium = (riskScore / 100) * 5 // Max 5% risk premium
  return Math.round((baseRate + riskPremium) * 100) / 100
}

/**
 * Get risk level description
 */
export function getRiskLevel(riskScore: number): string {
  if (riskScore < 30) return "LOW RISK - Excellent creditworthiness"
  if (riskScore < 50) return "MODERATE RISK - Good creditworthiness"
  if (riskScore < 70) return "MEDIUM-HIGH RISK - Fair creditworthiness"
  return "HIGH RISK - Poor creditworthiness"
}

/**
 * Sample bank offers data
 */
export function getBankOffers(loanAmount: number, termMonths: number): BankOffer[] {
  const banks = [
    {
      name: 'HDFC Bank',
      rate: 8.5,
      processingFee: 0.5,
      minCreditScore: 700,
      features: ['Quick approval', 'Online process', 'Flexible tenure']
    },
    {
      name: 'ICICI Bank',
      rate: 8.75,
      processingFee: 1.0,
      minCreditScore: 680,
      features: ['Low down payment', 'Flexible EMI', 'Quick processing']
    },
    {
      name: 'SBI',
      rate: 8.25,
      processingFee: 0.35,
      minCreditScore: 720,
      features: ['Lowest rate', 'Govt bank security', 'Subsidies available']
    },
    {
      name: 'Axis Bank',
      rate: 9.0,
      processingFee: 1.5,
      minCreditScore: 650,
      features: ['Online approval', 'Flexible EMI', 'Quick disbursal']
    },
    {
      name: 'Kotak Mahindra',
      rate: 8.9,
      processingFee: 1.0,
      minCreditScore: 690,
      features: ['Pre-approved offers', 'Online process', 'Competitive rates']
    }
  ]
  
  return banks.map(bank => {
    const emi = calculateEMI(loanAmount, bank.rate, termMonths)
    const totalPayment = emi * termMonths
    const totalInterest = totalPayment - loanAmount
    const processingFee = loanAmount * (bank.processingFee / 100)
    const totalCost = totalPayment + processingFee
    
    return {
      ...bank,
      emi: Math.round(emi * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100
    }
  }).sort((a, b) => a.totalCost - b.totalCost)
}

/**
 * Create loan prediction input from user data
 */
export function createLoanPredictionInput(
  loanAmount: number,
  loanDuration: number,
  baseInterestRate: number,
  userProfile?: Partial<LoanPredictionInput>
): LoanPredictionInput {
  const monthlyLoanPayment = calculateEMI(loanAmount, baseInterestRate, loanDuration)
  
  // Default static profile data (should be replaced with actual user data)
  const defaultProfile = {
    age: 28,
    annualIncome: 600000,
    creditScore: 720,
    employmentStatus: 'Employed',
    experience: 5,
    monthlyDebtPayments: 5000,
    creditCardUtilizationRate: 0.3,
    numberOfOpenCreditLines: 3,
    numberOfCreditInquiries: 1,
    bankruptcyHistory: 0,
    previousLoanDefaults: 0,
    paymentHistory: 0,
    lengthOfCreditHistory: 36,
    savingsAccountBalance: 50000,
    checkingAccountBalance: 30000,
    totalAssets: 100000,
    totalLiabilities: 50000,
    monthlyIncome: 50000,
    utilityBillsPaymentHistory: 1,
    jobTenure: 3,
    netWorth: 50000,
    interestRate: baseInterestRate + 1.0,
    totalDebtToIncomeRatio: 0.33,
    educationLevel: 'Bachelor',
    maritalStatus: 'Single',
    homeOwnershipStatus: 'Rent',
    loanPurpose: 'Education',
    numberOfDependents: 0
  }
  
  return {
    ...defaultProfile,
    ...userProfile,
    loanAmount,
    loanDuration,
    baseInterestRate,
    monthlyLoanPayment
  }
}

/**
 * Loan tips and recommendations
 */
export function getLoanTips(): Record<string, string[]> {
  return {
    "Improve Credit Score": [
      "Pay all bills on time",
      "Keep credit utilization below 30%",
      "Don't close old credit accounts",
      "Limit credit inquiries"
    ],
    "Reduce Interest Burden": [
      "Make prepayments when possible",
      "Choose shorter loan tenure if affordable",
      "Compare offers from multiple banks",
      "Negotiate interest rates"
    ],
    "Loan Approval Success": [
      "Maintain stable employment",
      "Keep debt-to-income ratio low",
      "Have emergency savings",
      "Provide complete documentation"
    ],
    "Future Financial Planning": [
      "Build emergency fund (6 months expenses)",
      "Invest in assets alongside loan repayment",
      "Review and adjust budget regularly",
      "Plan for aspirations after loan closure"
    ]
  }
}

/**
 * Security configuration
 */
export const SECURITY_CONFIG = {
  location: 'Mumbai',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  locale: 'en_IN',
  securityLevel: 'high',
  encryptionEnabled: true
}

/**
 * Validate loan inputs
 */
export function validateLoanInputs(inputs: LoanInputs): string[] {
  const errors: string[] = []
  
  if (inputs.principal <= 0) {
    errors.push("Loan amount must be greater than 0")
  }
  
  if (inputs.annualRate < 0 || inputs.annualRate > 50) {
    errors.push("Interest rate must be between 0% and 50%")
  }
  
  if (inputs.termMonths <= 0 || inputs.termMonths > 360) {
    errors.push("Loan tenure must be between 1 and 360 months")
  }
  
  if (inputs.extraPayment && inputs.extraPayment < 0) {
    errors.push("Extra payment cannot be negative")
  }
  
  return errors
}
