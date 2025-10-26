"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { LoanCalculator } from "@/components/loan-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"

// Security configuration updated from Bangalore to Mumbai
const SECURITY_CONFIG = {
  location: 'Mumbai',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  locale: 'en_IN',
  securityLevel: 'high',
  encryptionEnabled: true
}

// Dynamic EMI stress calculation based on loan type and amount
const calculateEMIStress = (loanType: LoanType, amount: number, rate: number, tenure: number) => {
  // Calculate EMI
  const monthlyRate = rate / 100 / 12
  const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1)
  
  // Calculate stress based on loan type and amount
  let stressPercentage = 0
  
  if (loanType === "house") {
    // For home loans, stress is based on EMI vs typical income ratios
    const typicalIncome = 50000 // Monthly income assumption
    const emiRatio = (emi / typicalIncome) * 100
    stressPercentage = Math.min(100, Math.max(0, emiRatio * 1.2)) // Scale up for visual impact
  } else if (loanType === "car") {
    // For car loans, stress is based on EMI vs typical income ratios
    const typicalIncome = 50000
    const emiRatio = (emi / typicalIncome) * 100
    stressPercentage = Math.min(100, Math.max(0, emiRatio * 1.5)) // Car loans are typically shorter term
  } else if (loanType === "student") {
    // For student loans, stress is typically lower due to moratorium period
    const typicalIncome = 30000 // Lower income assumption for students
    const emiRatio = (emi / typicalIncome) * 100
    stressPercentage = Math.min(100, Math.max(0, emiRatio * 0.8)) // Lower stress for education loans
  }
  
  return Math.round(stressPercentage)
}

// Enhanced Indian bank comparison data for different loan types
const bankComparison = {
  house: [
    { bank: "SBI", rate: "8.25%", emi: "₹20,500", features: "Lowest rate, Govt bank", processingFee: "0.35%" },
    { bank: "HDFC", rate: "8.5%", emi: "₹20,800", features: "Quick approval", processingFee: "0.5%" },
    { bank: "ICICI", rate: "8.75%", emi: "₹21,100", features: "Flexible tenure", processingFee: "1.0%" },
    { bank: "Axis", rate: "9.0%", emi: "₹21,400", features: "Online process", processingFee: "1.5%" },
    { bank: "Kotak", rate: "8.9%", emi: "₹21,700", features: "Pre-approved offers", processingFee: "1.0%" }
  ],
  car: [
    { bank: "HDFC", rate: "9.2%", emi: "₹18,500", features: "Quick processing", processingFee: "0.5%" },
    { bank: "ICICI", rate: "9.5%", emi: "₹18,800", features: "Low down payment", processingFee: "1.0%" },
    { bank: "SBI", rate: "9.7%", emi: "₹19,100", features: "Govt bank security", processingFee: "0.35%" },
    { bank: "Axis", rate: "10.1%", emi: "₹19,400", features: "Flexible EMI", processingFee: "1.5%" },
    { bank: "Kotak", rate: "10.3%", emi: "₹19,700", features: "Online approval", processingFee: "1.0%" }
  ],
  student: [
    { bank: "SBI", rate: "7.5%", emi: "₹15,200", features: "Lowest rate, Govt bank", processingFee: "0.35%" },
    { bank: "HDFC", rate: "8.2%", emi: "₹15,800", features: "Moratorium period", processingFee: "0.5%" },
    { bank: "ICICI", rate: "8.5%", emi: "₹16,100", features: "Flexible repayment", processingFee: "1.0%" },
    { bank: "Axis", rate: "8.8%", emi: "₹16,400", features: "Career guidance", processingFee: "1.5%" },
    { bank: "Kotak", rate: "9.1%", emi: "₹16,700", features: "Online application", processingFee: "1.0%" }
  ]
}

export default function LoanPage() {
  const [loanType, setLoanType] = useState<"house" | "car" | "student">("house")
  const [modelStatus, setModelStatus] = useState<any>(null)
  const [loanValues, setLoanValues] = useState({ amount: 5000000, rate: 8.5, tenure: 240 })
  const compare = bankComparison[loanType]

  // Calculate dynamic EMI stress using current loan values
  const emiStress = calculateEMIStress(loanType, loanValues.amount, loanValues.rate, loanValues.tenure)
  
  // Create gauge data with dynamic values
  const gaugeData = [
    { name: "EMI Stress", value: emiStress, fill: emiStress > 60 ? "#ef4444" : emiStress > 40 ? "#f59e0b" : "#10b981" }
  ]

  // Check model status on component mount
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

  return (
    <QueryProvider>
      <AppShell>
        <div className="space-y-6">
          {/* Security Configuration Alert */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">📍 {SECURITY_CONFIG.location}</Badge>
                <Badge variant="outline">🔒 {SECURITY_CONFIG.securityLevel} Security</Badge>
                <Badge variant="outline">💰 {SECURITY_CONFIG.currency}</Badge>
                {modelStatus && (
                  <Badge variant={modelStatus.modelsLoaded ? "default" : "secondary"}>
                    🤖 {modelStatus.modelsLoaded ? "ML Models Active" : "Simulation Mode"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loan Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Type Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setLoanType("house")}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    loanType === "house" 
                      ? "bg-blue-50 border-blue-200 text-blue-700" 
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-medium">🏠 Home Loan</div>
                  <div className="text-sm text-gray-600">8.25% - 9.0%</div>
                </button>
                <button
                  onClick={() => setLoanType("car")}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    loanType === "car" 
                      ? "bg-blue-50 border-blue-200 text-blue-700" 
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-medium">🚗 Car Loan</div>
                  <div className="text-sm text-gray-600">9.2% - 10.3%</div>
                </button>
                <button
                  onClick={() => setLoanType("student")}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    loanType === "student" 
                      ? "bg-blue-50 border-blue-200 text-blue-700" 
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-medium">🎓 Education Loan</div>
                  <div className="text-sm text-gray-600">7.5% - 9.1%</div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Loan Calculator */}
          <LoanCalculator 
            loanType={loanType} 
            onValuesChange={setLoanValues}
          />

          {/* Enhanced EMI Stress Gauge */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>EMI Stress Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Visual Gauge */}
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart data={gaugeData} innerRadius="50%" outerRadius="90%" startAngle={180} endAngle={0}>
                      <RadialBar 
                        minAngle={15} 
                        clockWise 
                        dataKey="value" 
                        fill={gaugeData[0].fill}
                        cornerRadius={8}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  
                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold" style={{ color: gaugeData[0].fill }}>
                      {emiStress}%
                    </div>
                    <div className="text-sm text-gray-600 font-medium">EMI Stress</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {emiStress <= 30 ? "🟢 Excellent" :
                       emiStress <= 50 ? "🟡 Good" :
                       emiStress <= 70 ? "🟠 Fair" :
                       "🔴 Poor"}
                    </div>
                  </div>
                  
                  {/* Progress Indicators */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Analysis Details */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Stress Level Analysis</h4>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: gaugeData[0].fill }}
                      ></div>
                      <span className="text-sm">
                        {emiStress <= 30 ? "🟢 Low Stress - Excellent affordability" :
                         emiStress <= 50 ? "🟡 Moderate Stress - Manageable" :
                         emiStress <= 70 ? "🟠 High Stress - Requires attention" :
                         "🔴 Critical Stress - High risk"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Quick Adjustments</h4>
                    <div className="text-sm space-y-1">
                      <div>• Increase tenure: Reduce EMI by ~₹{Math.round((loanValues.amount * loanValues.rate / 100 / 12) * 0.1)}</div>
                      <div>• Increase down payment: Reduce loan amount</div>
                      <div>• Compare rates: Save up to ₹{Math.round((loanValues.amount * loanValues.rate / 100 / 12) * 0.05)}/month</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">EMI Calculation</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Monthly EMI:</span>
                        <span className="font-medium">₹{Math.round((loanValues.amount * loanValues.rate / 100 / 12 * Math.pow(1 + loanValues.rate / 100 / 12, loanValues.tenure)) / (Math.pow(1 + loanValues.rate / 100 / 12, loanValues.tenure) - 1)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Interest:</span>
                        <span className="font-medium">₹{Math.round(((loanValues.amount * loanValues.rate / 100 / 12 * Math.pow(1 + loanValues.rate / 100 / 12, loanValues.tenure)) / (Math.pow(1 + loanValues.rate / 100 / 12, loanValues.tenure) - 1)) * loanValues.tenure - loanValues.amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Payment:</span>
                        <span className="font-medium">₹{Math.round(((loanValues.amount * loanValues.rate / 100 / 12 * Math.pow(1 + loanValues.rate / 100 / 12, loanValues.tenure)) / (Math.pow(1 + loanValues.rate / 100 / 12, loanValues.tenure) - 1)) * loanValues.tenure).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Target Guidelines</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Ideal EMI/Income:</span>
                        <span className="font-medium">&lt; 30%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Acceptable EMI/Income:</span>
                        <span className="font-medium">&lt; 40%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current EMI/Income:</span>
                        <span className="font-medium">{emiStress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Bank Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Bank Comparison - {loanType.charAt(0).toUpperCase() + loanType.slice(1)} Loan</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid grid-cols-5 gap-2 font-medium mb-2">
                <div>Bank</div>
                <div>Rate</div>
                <div>EMI</div>
                <div>Processing Fee</div>
                <div>Features</div>
              </div>
              {compare.map((r, index) => (
                <div key={r.bank} className={`grid grid-cols-5 gap-2 border-b py-2 ${index === 0 ? 'bg-green-50' : ''}`}>
                  <div className="font-medium">{r.bank}</div>
                  <div className="text-green-600">{r.rate}</div>
                  <div>{r.emi}</div>
                  <div className="text-xs text-gray-600">{r.processingFee}</div>
                  <div className="text-xs text-gray-600">{r.features}</div>
                </div>
              ))}
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                💰 Best Offer: {compare[0].bank} - Lowest rate at {compare[0].rate}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>💡 Smart Loan Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {loanType === "house" && (
                <div className="space-y-2">
                  <p><strong>SBI offers the lowest home loan rates (8.25%).</strong> Consider prepayment to save interest.</p>
                  <p>• Maintain EMI below 40% of monthly income</p>
                  <p>• Check for government subsidies if eligible</p>
                  <p>• Compare processing fees across banks</p>
                </div>
              )}
              {loanType === "car" && (
                <div className="space-y-2">
                  <p><strong>HDFC provides quick car loan processing.</strong> Compare down payment options.</p>
                  <p>• Consider shorter tenure (3-5 years) for cars</p>
                  <p>• Check for manufacturer financing offers</p>
                  <p>• Maintain good credit score for better rates</p>
                </div>
              )}
              {loanType === "student" && (
                <div className="space-y-2">
                  <p><strong>SBI education loans have lowest rates (7.5%).</strong> Moratorium period available during studies.</p>
                  <p>• Interest subsidy available for certain courses</p>
                  <p>• Consider government education loan schemes</p>
                  <p>• Flexible repayment options available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </QueryProvider>
  )
}
