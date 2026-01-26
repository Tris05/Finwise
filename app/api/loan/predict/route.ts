import { NextResponse } from "next/server"
import fs from 'fs'
import path from 'path'
import { PythonShell } from 'python-shell'

// Using actual .pkl models via Python bridge

interface LoanPredictionInput {
  // Dynamic inputs from user
  loanAmount: number
  loanDuration: number
  baseInterestRate: number
  monthlyLoanPayment: number

  // Static profile data
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

interface LoanPredictionResult {
  riskScore: number
  loanApproved: boolean
  eirr: number
  acceptanceScore: number
  riskLevel: string
  confidence: number
  recommendations: string[]
}

/**
 * Check if model files exist
 */
function checkModelFiles() {
  try {
    const modelFiles = [
      'xgb_risk_model.pkl',
      'xgb_approval_model.pkl',
      'scaler.pkl',
      'ordinal_encoder.pkl',
      'one_hot_encoder.pkl'
    ]

    const modelPath = process.cwd()
    const existingFiles = modelFiles.filter(file =>
      fs.existsSync(path.join(modelPath, file))
    )

    console.log(`Found ${existingFiles.length}/${modelFiles.length} model files:`, existingFiles)

    return {
      modelsLoaded: existingFiles.length === modelFiles.length,
      availableModels: existingFiles,
      missingModels: modelFiles.filter(file => !existingFiles.includes(file))
    }
  } catch (error) {
    console.error('Error checking model files:', error)
    return { modelsLoaded: false, availableModels: [], missingModels: [] }
  }
}

/**
 * Make prediction using actual .pkl models via Python
 */
async function predictWithModels(input: LoanPredictionInput): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const options = {
        mode: 'text' as const,
        pythonPath: 'python', // Make sure Python is in PATH
        pythonOptions: ['-u'], // Unbuffered output
        scriptPath: process.cwd(),
        args: []
      }

      const pyshell = new PythonShell('loan_prediction.py', options)

      // Send input data to Python script
      pyshell.send(JSON.stringify(input))

      let result = ''
      pyshell.on('message', (message) => {
        result += message
      })

      pyshell.end((err, code, signal) => {
        if (err) {
          console.error('Python script error:', err)
          reject(err)
        } else {
          try {
            const parsedResult = JSON.parse(result)
            resolve(parsedResult)
          } catch (parseError) {
            console.error('Error parsing Python output:', parseError)
            reject(parseError)
          }
        }
      })

    } catch (error) {
      console.error('Error running Python script:', error)
      reject(error)
    }
  })
}

export async function POST(req: Request) {
  try {
    const input: LoanPredictionInput = await req.json()

    // Validate required fields
    if (!input.loanAmount || !input.loanDuration || !input.baseInterestRate) {
      return NextResponse.json(
        { error: "Missing required fields: loanAmount, loanDuration, baseInterestRate" },
        { status: 400 }
      )
    }

    // Check if model files exist
    const modelStatus = checkModelFiles()

    let prediction: any
    let modelsUsed = false

    // CLOUD FUNCTION URL (Set this after deployment)
    const CLOUD_FUNCTION_URL = "https://predict-loan-435728514103.us-central1.run.app" // Placeholder, needs update after deploy

    // Check if we should use Cloud Function (Production)
    if (process.env.NODE_ENV === 'production' && CLOUD_FUNCTION_URL) {
      try {
        console.log('Attempting to call Cloud Function for prediction...')
        const cloudResponse = await fetch(CLOUD_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        })

        if (cloudResponse.ok) {
          prediction = await cloudResponse.json()
          modelsUsed = true
          console.log('Successfully used Cloud Function models')
        } else {
          console.error('Cloud Function failed:', await cloudResponse.text())
          // Fallback to local logic/simulation
          throw new Error('Cloud Function returned error')
        }
      } catch (cloudError) {
        console.error('Cloud Function error, falling back:', cloudError)
        // Fallback logic proceeds below...
      }
    }

    // Local / Fallback Logic
    if (!modelsUsed) {
      if (modelStatus.modelsLoaded) {
        try {
          // Use actual .pkl models via Python (Local)
          prediction = await predictWithModels(input)
          modelsUsed = true
          console.log('Successfully used local .pkl models')
        } catch (pythonError) {
          console.error('Python model prediction failed, falling back to simulation:', pythonError)
          prediction = simulatePrediction(input)
          modelsUsed = false
          prediction.modelNote = "Models available but execution failed - using simulation"
        }
      } else {
        console.log('Model files not found, using simulation')
        prediction = simulatePrediction(input)
        modelsUsed = false
      }
    }

    // Add model status to response
    const response = {
      ...prediction,
      modelStatus: {
        modelsLoaded: modelStatus.modelsLoaded,
        availableModels: modelStatus.availableModels,
        missingModels: modelStatus.missingModels,
        modelsUsed: modelsUsed,
        note: modelsUsed
          ? "Using actual .pkl ML models"
          : modelStatus.modelsLoaded
            ? "Models found but Python execution failed - using simulation"
            : "Model files not found - using simulation"
      },
      input: {
        loanAmount: input.loanAmount,
        loanDuration: input.loanDuration,
        baseInterestRate: input.baseInterestRate,
        monthlyLoanPayment: input.monthlyLoanPayment,
        creditScore: input.creditScore,
        annualIncome: input.annualIncome
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Loan prediction error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Fallback simulation function (same as before)
 */
function simulatePrediction(input: LoanPredictionInput): any {
  let riskScore = 50 // Base risk score

  // Credit score impact (most important factor)
  if (input.creditScore >= 750) riskScore -= 20
  else if (input.creditScore >= 700) riskScore -= 15
  else if (input.creditScore >= 650) riskScore -= 10
  else if (input.creditScore >= 600) riskScore -= 5
  else riskScore += 15

  // Debt-to-income ratio impact
  if (input.totalDebtToIncomeRatio <= 0.3) riskScore -= 10
  else if (input.totalDebtToIncomeRatio <= 0.4) riskScore -= 5
  else if (input.totalDebtToIncomeRatio <= 0.5) riskScore += 5
  else riskScore += 15

  // Employment stability
  if (input.jobTenure >= 3) riskScore -= 8
  else if (input.jobTenure >= 1) riskScore -= 3
  else riskScore += 10

  // Income stability
  if (input.annualIncome >= 1000000) riskScore -= 5
  else if (input.annualIncome >= 500000) riskScore -= 2
  else if (input.annualIncome < 300000) riskScore += 10

  // Loan amount vs income
  const loanToIncomeRatio = input.loanAmount / input.annualIncome
  if (loanToIncomeRatio <= 3) riskScore -= 5
  else if (loanToIncomeRatio <= 5) riskScore += 2
  else if (loanToIncomeRatio <= 8) riskScore += 8
  else riskScore += 15

  // Payment history
  if (input.paymentHistory === 0) riskScore -= 5
  else if (input.paymentHistory <= 2) riskScore += 5
  else riskScore += 15

  // Previous defaults
  if (input.previousLoanDefaults > 0) riskScore += 20
  if (input.bankruptcyHistory > 0) riskScore += 25

  // Assets vs liabilities
  if (input.totalAssets > input.totalLiabilities * 2) riskScore -= 5
  else if (input.totalAssets < input.totalLiabilities) riskScore += 10

  // Ensure risk score is between 0 and 100
  riskScore = Math.max(0, Math.min(100, riskScore))

  // Determine approval (threshold at 60)
  const loanApproved = riskScore <= 60

  // Calculate EIRR (Effective Interest Rate of Return)
  const riskPremium = (riskScore / 100) * 5 // Max 5% risk premium
  const eirr = input.baseInterestRate + riskPremium

  // Calculate acceptance score
  const acceptanceScore = Math.max(0, 100 - riskScore)

  // Determine risk level
  let riskLevel = "HIGH RISK - Poor creditworthiness"
  if (riskScore < 30) riskLevel = "LOW RISK - Excellent creditworthiness"
  else if (riskScore < 50) riskLevel = "MODERATE RISK - Good creditworthiness"
  else if (riskScore < 70) riskLevel = "MEDIUM-HIGH RISK - Fair creditworthiness"

  // Calculate confidence based on data completeness
  const confidence = Math.min(95, 60 + (input.creditScore / 10) + (input.jobTenure * 2))

  // Generate recommendations
  const recommendations: string[] = []

  if (riskScore > 60) {
    recommendations.push("Improve credit score before applying")
    recommendations.push("Reduce existing debt obligations")
    recommendations.push("Increase down payment amount")
    recommendations.push("Consider co-applicant with better credit")
  } else if (riskScore > 40) {
    recommendations.push("Consider shorter loan tenure")
    recommendations.push("Maintain stable employment")
    recommendations.push("Keep debt-to-income ratio below 40%")
  } else {
    recommendations.push("Excellent credit profile - negotiate for better rates")
    recommendations.push("Consider prepayment options")
    recommendations.push("You qualify for premium loan products")
  }

  return {
    riskScore: Math.round(riskScore * 100) / 100,
    loanApproved,
    eirr: Math.round(eirr * 100) / 100,
    acceptanceScore: Math.round(acceptanceScore * 100) / 100,
    riskLevel,
    confidence: Math.round(confidence * 100) / 100,
    recommendations
  }
}

// Health check endpoint to verify model files
export async function GET() {
  try {
    const modelStatus = checkModelFiles()

    return NextResponse.json({
      status: "ok",
      modelsLoaded: modelStatus.modelsLoaded,
      availableModels: modelStatus.availableModels,
      missingModels: modelStatus.missingModels,
      timestamp: new Date().toISOString(),
      location: "Mumbai", // Updated from Bangalore
      securityLevel: "high",
      pythonAvailable: true // Assuming Python is available
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Health check failed" },
      { status: 500 }
    )
  }
}
