"use client"

import { AppShell } from "@/components/app-shell"

import { LoanCalculator } from "@/components/loan-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts"
import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useUserProfile } from "@/hooks/useUserProfile"
import { calculateEMI } from "@/lib/loan-calculator"

// Security configuration
const SECURITY_CONFIG = {
  location: 'Mumbai',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  locale: 'en_IN',
  securityLevel: 'high',
  encryptionEnabled: true
}

// Enhanced Indian bank comparison data
const BANK_RATES = {
  house: [
    { bank: "SBI", rate: 8.25, features: "Lowest rate, Govt bank", processingFee: "0.35%" },
    { bank: "HDFC", rate: 8.5, features: "Quick approval", processingFee: "0.5%" },
    { bank: "ICICI", rate: 8.75, features: "Flexible tenure", processingFee: "1.0%" },
    { bank: "Axis", rate: 9.0, features: "Online process", processingFee: "1.5%" },
    { bank: "Kotak", rate: 8.9, features: "Pre-approved offers", processingFee: "1.0%" }
  ],
  car: [
    { bank: "HDFC", rate: 9.2, features: "Quick processing", processingFee: "0.5%" },
    { bank: "ICICI", rate: 9.5, features: "Low down payment", processingFee: "1.0%" },
    { bank: "SBI", rate: 9.7, features: "Govt bank security", processingFee: "0.35%" },
    { bank: "Axis", rate: 10.1, features: "Flexible EMI", processingFee: "1.5%" },
    { bank: "Kotak", rate: 10.3, features: "Online approval", processingFee: "1.0%" }
  ],
  student: [
    { bank: "SBI", rate: 7.5, features: "Lowest rate, Govt bank", processingFee: "0.35%" },
    { bank: "HDFC", rate: 8.2, features: "Moratorium period", processingFee: "0.5%" },
    { bank: "ICICI", rate: 8.5, features: "Flexible repayment", processingFee: "1.0%" },
    { bank: "Axis", rate: 8.8, features: "Career guidance", processingFee: "1.5%" },
    { bank: "Kotak", rate: 9.1, features: "Online application", processingFee: "1.0%" }
  ]
}

export default function LoanPage() {
  const { annualIncome } = useUserProfile()
  const [loanType, setLoanType] = useState<"house" | "car" | "student">("house")
  const [loanValues, setLoanValues] = useState({
    amount: 5000000,
    tenure: 240,
    rate: 8.5
  })
  const [modelStatus, setModelStatus] = useState<any>(null)
  const [loanAnalysis, setLoanAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const monthlyIncome = annualIncome ? annualIncome / 12 : 100000 // Default to 1L if not synced

  // Calculate dynamic EMI
  const currentEMI = useMemo(() =>
    calculateEMI(loanValues.amount, loanValues.rate, loanValues.tenure),
    [loanValues]
  )

  // Calculate stress: EMI as % of Monthly Income
  const emiStress = useMemo(() => {
    const stress = (currentEMI / monthlyIncome) * 100
    return Math.round(Math.min(100, stress))
  }, [currentEMI, monthlyIncome])

  // Dynamic bank comparison based on current loan amount and tenure
  const compare = useMemo(() => {
    const currentBankRates = BANK_RATES[loanType as keyof typeof BANK_RATES]
    return currentBankRates.map((bank: any) => {
      const emi = calculateEMI(loanValues.amount, bank.rate, loanValues.tenure)
      return {
        ...bank,
        rate: `${bank.rate}%`,
        emi: `₹${Math.round(emi).toLocaleString()}`
      }
    })
  }, [loanType, loanValues.amount, loanValues.tenure])

  const gaugeData = [
    { name: "EMI Stress", value: emiStress, fill: emiStress > 50 ? "#ef4444" : emiStress > 35 ? "#f59e0b" : "#10b981" }
  ]

  useEffect(() => {
    const checkModelStatus = async () => {
      try {
        const response = await fetch('/api/loan/predict')
        const data = await response.json()
        setModelStatus(data)
      } catch (error) {
        console.error('Failed to check model status:', error)
      }
    }
    checkModelStatus()
  }, [])

  // Comprehensive loan analysis function
  const analyzeLoan = async () => {
    setIsAnalyzing(true)
    try {
      // Get basic assessment
      const assessResponse = await fetch('/api/loan/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: loanValues.amount,
          rate: loanValues.rate,
          tenure: loanValues.tenure,
          loanType: loanType
        })
      })
      const assessData = await assessResponse.json()

      // Get AI prediction if models are available
      let predictData = null
      if (modelStatus?.modelsLoaded) {
        try {
          const predictResponse = await fetch('/api/loan/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              loanAmount: loanValues.amount,
              loanDuration: loanValues.tenure / 12,
              baseInterestRate: loanValues.rate,
              monthlyLoanPayment: currentEMI,
              age: 30,
              annualIncome: annualIncome || 1200000,
              creditScore: 750,
              employmentStatus: 'employed',
              experience: 5,
              monthlyDebtPayments: currentEMI * 0.3,
              creditCardUtilizationRate: 0.3,
              numberOfOpenCreditLines: 3,
              numberOfCreditInquiries: 2,
              bankruptcyHistory: 0,
              previousLoanDefaults: 0,
              paymentHistory: 0,
              lengthOfCreditHistory: 5,
              savingsAccountBalance: 100000,
              checkingAccountBalance: 50000,
              totalAssets: 2000000,
              totalLiabilities: loanValues.amount * 0.8,
              monthlyIncome: monthlyIncome,
              utilityBillsPaymentHistory: 0,
              jobTenure: 3,
              netWorth: 1500000,
              interestRate: loanValues.rate,
              totalDebtToIncomeRatio: (currentEMI * 1.3) / monthlyIncome,
              educationLevel: 'graduate',
              maritalStatus: 'single',
              homeOwnershipStatus: 'rented',
              loanPurpose: loanType,
              numberOfDependents: 0
            })
          })
          predictData = await predictResponse.json()
        } catch (predictError) {
          console.error('Failed to get AI prediction:', predictError)
        }
      }

      // Combine both analyses
      setLoanAnalysis({
        assessment: assessData,
        prediction: predictData,
        hasAI: !!predictData
      })
    } catch (error) {
      console.error('Failed to analyze loan:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">📍 {SECURITY_CONFIG.location}</Badge>
              <Badge variant="outline">🔒 {SECURITY_CONFIG.securityLevel} Security</Badge>
              <Badge variant="outline">💰 {SECURITY_CONFIG.currency}</Badge>
              {annualIncome && (
                <Badge variant="secondary">👤 Profile Synced (₹{(annualIncome / 12).toLocaleString()}/mo)</Badge>
              )}
              {modelStatus && (
                <Badge variant={modelStatus.modelsLoaded ? "default" : "secondary"}>
                  🤖 {modelStatus.modelsLoaded ? "ML Models Active" : "Simulation Mode"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loan Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setLoanType("house")}
                className={`p-3 rounded-lg border text-center transition-colors ${loanType === "house"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
              >
                <div className="font-medium">🏠 Home Loan</div>
                <div className="text-sm text-gray-600">Avg 8.5%</div>
              </button>
              <button
                onClick={() => setLoanType("car")}
                className={`p-3 rounded-lg border text-center transition-colors ${loanType === "car"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
              >
                <div className="font-medium">🚗 Car Loan</div>
                <div className="text-sm text-gray-600">Avg 9.5%</div>
              </button>
              <button
                onClick={() => setLoanType("student")}
                className={`p-3 rounded-lg border text-center transition-colors ${loanType === "student"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
              >
                <div className="font-medium">🎓 Student Loan</div>
                <div className="text-sm text-gray-600">Avg 8.0%</div>
              </button>
            </div>
          </CardContent>
        </Card>

        <LoanCalculator
          loanType={loanType}
          onValuesChange={setLoanValues}
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>EMI Stress Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart data={gaugeData} innerRadius="70%" outerRadius="100%" startAngle={180} endAngle={0}>
                    <RadialBar
                      background
                      dataKey="value"
                      fill={gaugeData[0].fill}
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                  <div className="text-4xl font-black" style={{ color: gaugeData[0].fill }}>
                    {emiStress}%
                  </div>
                  <div className="text-sm text-muted-foreground font-semibold">DTI Ratio</div>
                  <Badge variant="outline" className="mt-2">
                    {emiStress <= 30 ? "🟢 Excellent" :
                      emiStress <= 40 ? "🟡 Good" :
                        emiStress <= 50 ? "🟠 Risky" :
                          "🔴 High Debt"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-bold flex items-center gap-2">
                    Financial Impact
                    {!annualIncome && <Badge variant="outline" className="text-[10px]">Using Default Income</Badge>}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    This loan takes up <strong>{emiStress}%</strong> of your monthly take-home salary.
                    {emiStress > 40 ? " This is above the recommended 40% threshold for financial stability." : " This is within a healthy range for your income level."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground uppercase">Interest Saved</div>
                    <div className="text-xl font-bold text-green-600">₹{Math.round(currentEMI * 0.1).toLocaleString()}*</div>
                    <div className="text-[10px] text-muted-foreground">*via 0.5% rate reduction</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground uppercase">Affordability</div>
                    <div className="text-xl font-bold">
                      {emiStress <= 35 ? "High" : emiStress <= 50 ? "Moderate" : "Low"}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly EMI</span>
                    <span className="font-bold">₹{Math.round(currentEMI).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Income</span>
                    <span className="font-bold">₹{Math.round(monthlyIncome).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Bank Comparison</CardTitle>
              <div className="text-xs text-muted-foreground">Recalculated for ₹{loanValues.amount.toLocaleString()}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Bank</th>
                    <th className="text-left py-2 font-medium">Rate</th>
                    <th className="text-left py-2 font-medium">EMI</th>
                    <th className="text-left py-2 font-medium">Processing Fee</th>
                    <th className="text-left py-2 font-medium">Top Feature</th>
                  </tr>
                </thead>
                <tbody>
                  {compare.map((r, index) => (
                    <tr key={r.bank} className={`border-b hover:bg-muted/50 transition-colors ${index === 0 ? 'bg-green-50/50' : ''}`}>
                      <td className="py-3 font-semibold">{r.bank}</td>
                      <td className="py-3 text-green-700 font-medium">{r.rate}</td>
                      <td className="py-3 font-bold">{r.emi}</td>
                      <td className="py-3 text-xs">{r.processingFee}</td>
                      <td className="py-3 text-xs text-muted-foreground">{r.features}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-800 flex items-center gap-2">
              <span>🎯</span>
              Best Selection: {compare[0].bank} offers the most competitive interest rate of {compare[0].rate} for this loan profile.
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Loan Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>🔍 Comprehensive Loan Analysis</CardTitle>
              <button
                onClick={analyzeLoan}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Loan'}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loanAnalysis ? (
              <div className="space-y-6">
                {/* Basic Assessment Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">EMI Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Monthly EMI:</span>
                          <span className="font-bold">₹{loanAnalysis.assessment.emi?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Affordability:</span>
                          <span className={`font-bold ${loanAnalysis.assessment.affordability === 'High' ? 'text-green-600' : loanAnalysis.assessment.affordability === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {loanAnalysis.assessment.affordability}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Risk Level:</span>
                          <span className={`font-bold ${loanAnalysis.assessment.risk === 'Low' ? 'text-green-600' : loanAnalysis.assessment.risk === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {loanAnalysis.assessment.risk}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-700 mb-2">Recommendations</h4>
                      <ul className="space-y-1 text-sm">
                        {loanAnalysis.assessment.mitigations?.map((mitigation: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="text-gray-700">{mitigation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* AI Prediction Section (if available) */}
                {loanAnalysis.hasAI && loanAnalysis.prediction && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      🤖 AI-Powered Approval Prediction
                      <Badge variant="outline" className="text-xs">ML Models Active</Badge>
                    </h4>
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <div className="text-2xl font-bold mb-1">{loanAnalysis.prediction.loanApproved ? '✅' : '❌'}</div>
                        <div className="text-sm font-semibold">{loanAnalysis.prediction.loanApproved ? 'Approved' : 'Rejected'}</div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <div className="text-2xl font-bold mb-1">{loanAnalysis.prediction.riskScore}</div>
                        <div className="text-sm font-semibold">Risk Score</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <div className="text-2xl font-bold mb-1">{loanAnalysis.prediction.acceptanceScore}%</div>
                        <div className="text-sm font-semibold">Acceptance Score</div>
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h5 className="font-semibold text-yellow-700 mb-2">AI Risk Analysis</h5>
                      <p className="text-sm text-gray-700 mb-2">{loanAnalysis.prediction.riskLevel}</p>
                      <div className="text-sm text-gray-600">Confidence: {loanAnalysis.prediction.confidence}%</div>
                    </div>
                    {loanAnalysis.prediction.recommendations && loanAnalysis.prediction.recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-semibold text-blue-700 mb-2">AI Recommendations</h5>
                        <ul className="space-y-1 text-sm">
                          {loanAnalysis.prediction.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-600 mr-2">•</span>
                              <span className="text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Click "Analyze Loan" to get comprehensive loan analysis</p>
                {modelStatus?.modelsLoaded && (
                  <p className="text-sm mt-2">Includes AI-powered approval prediction</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>💡 Smart Management Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-bold text-primary">Prepayment Power</h4>
                <p className="text-muted-foreground">Paying just 1 extra EMI per year can reduce your 20-year loan tenure by approximately 3-4 years and save significant interest.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-primary">Insurance Factor</h4>
                <p className="text-muted-foreground">Consider Loan Shield or Term Insurance for high-value loans to protect your family from debt in unforeseen circumstances.</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-bold">Specific to {loanType.charAt(0).toUpperCase() + loanType.slice(1)} Loans:</h4>
              <div className="grid md:grid-cols-2 gap-4 text-muted-foreground">
                {loanType === "house" && (
                  <>
                    <div>• Section 24(b): Deduction up to ₹2L on interest.</div>
                    <div>• Section 80C: Deduction on principal repayment.</div>
                  </>
                )}
                {loanType === "car" && (
                  <>
                    <div>• Typically diminishing asset; avoid long tenures.</div>
                    <div>• Check for zero-depreciation insurance tie-ups.</div>
                  </>
                )}
                {loanType === "student" && (
                  <>
                    <div>• Section 80E: Full interest deduction for 8 years.</div>
                    <div>• Moratorium benefit usually ends 6-12 months post-job.</div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
