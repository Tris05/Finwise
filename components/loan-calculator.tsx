"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area, AreaChart, CartesianGrid } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import {
  calculateEMI,
  generateAmortizationSchedule,
  calculatePrepaymentImpact,
  getBankOffers,
  createLoanPredictionInput,
  getLoanTips,
  validateLoanInputs,
  type LoanInputs,
  type EMICalculation,
  type AmortizationEntry,
  type PrepaymentImpact,
  type BankOffer
} from "@/lib/loan-calculator"
import { useLoans } from "@/hooks/useLoans"
import { useUserProfile } from "@/hooks/useUserProfile"

type AssessResponse = {
  emi: number
  affordability: "Low" | "Medium" | "High"
  risk: "Low" | "Medium" | "High"
  schedule: { month: number; balance: number }[]
  mitigations: string[]
}

type LoanType = "house" | "car" | "student"

interface LoanCalculatorProps {
  loanType: LoanType
  onValuesChange?: (values: { amount: number; rate: number; tenure: number }) => void
}

export function LoanCalculator({ loanType, onValuesChange }: LoanCalculatorProps) {
  const { annualIncome } = useUserProfile()
  
  // Default values based on loan type
  const getDefaultValues = (type: LoanType) => {
    switch (type) {
      case "house":
        return { amount: 5000000, rate: 8.5, tenure: 240 } // 20 years
      case "car":
        return { amount: 800000, rate: 9.5, tenure: 60 } // 5 years
      case "student":
        return { amount: 2000000, rate: 8.0, tenure: 120 } // 10 years
      default:
        return { amount: 1000000, rate: 10, tenure: 60 }
    }
  }

  const defaults = getDefaultValues(loanType)
  const [amount, setAmount] = useState(defaults.amount)
  const [rate, setRate] = useState(defaults.rate)
  const [tenure, setTenure] = useState(defaults.tenure)
  const [extraPayment, setExtraPayment] = useState(0)
  const [monthsShown, setMonthsShown] = useState(12)
  const [showSchedule, setShowSchedule] = useState(false)
  const [showPrepayment, setShowPrepayment] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const { loanProfile, saveLoanProfile } = useLoans()

  // Prepopulate if exists
  useEffect(() => {
    if (loanProfile && loanProfile.type === loanType) {
      setAmount(loanProfile.amount)
      setRate(loanProfile.rate)
      setTenure(loanProfile.tenure)
    }
  }, [loanProfile, loanType])

  // Update values when loan type changes
  useEffect(() => {
    const newDefaults = getDefaultValues(loanType)
    setAmount(newDefaults.amount)
    setRate(newDefaults.rate)
    setTenure(newDefaults.tenure)
    setExtraPayment(0)
    setMonthsShown(12)
  }, [loanType])

  // Notify parent component when values change
  useEffect(() => {
    if (onValuesChange) {
      onValuesChange({ amount, rate, tenure })
    }
  }, [amount, rate, tenure, onValuesChange])

  // Calculate EMI and related values
  const emi = calculateEMI(amount, rate, tenure)
  const totalPayment = emi * tenure
  const totalInterest = totalPayment - amount

  // Generate amortization schedule
  const amortizationSchedule = generateAmortizationSchedule(amount, rate, tenure, extraPayment, monthsShown)

  // Calculate prepayment impact
  const prepaymentImpact = calculatePrepaymentImpact(amount, rate, tenure, extraPayment)

  // Get bank offers
  const bankOffers = getBankOffers(amount, tenure)

  // Get loan tips
  const loanTips = getLoanTips()

  // Validate inputs
  const inputErrors = validateLoanInputs({ principal: amount, annualRate: rate, termMonths: tenure, extraPayment })

  const assess = useMutation({
    mutationFn: async (): Promise<AssessResponse> => {
      // Save to profile when assessing
      await saveLoanProfile({ amount, rate, tenure, type: loanType })

      const res = await fetch("/api/loan/assess", {
        method: "POST",
        body: JSON.stringify({ amount, rate, tenure, loanType, annualIncome }),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const predictLoan = useMutation({
    mutationFn: async (): Promise<any> => {
      const predictionInput = createLoanPredictionInput(amount, tenure, rate)
      const res = await fetch("/api/loan/predict", {
        method: "POST",
        body: JSON.stringify(predictionInput),
      })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>{loanType.charAt(0).toUpperCase() + loanType.slice(1)} Loan Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loan Amount (₹)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter loan amount"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Interest Rate (%)</label>
              <Input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                placeholder="Enter interest rate"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Loan Tenure (months)</label>
              <Input
                type="number"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                placeholder="Enter tenure in months"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Extra Monthly Payment (₹)</label>
              <Input
                type="number"
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
                placeholder="Optional extra payment"
              />
            </div>
          </div>

          {inputErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
              <ul className="text-sm text-red-700 list-disc pl-5">
                {inputErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => assess.mutate()}
              disabled={assess.isPending}
              className="min-w-[120px]"
            >
              {assess.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : "Assess Loan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={!showSchedule && !showPrepayment && !showComparison ? "default" : "outline"}
          onClick={() => {
            setShowSchedule(false)
            setShowPrepayment(false)
            setShowComparison(false)
          }}
        >
          EMI Details
        </Button>
        <Button
          variant={showSchedule ? "default" : "outline"}
          onClick={() => {
            setShowSchedule(true)
            setShowPrepayment(false)
            setShowComparison(false)
          }}
        >
          Amortization
        </Button>
        <Button
          variant={showPrepayment ? "default" : "outline"}
          onClick={() => {
            setShowSchedule(false)
            setShowPrepayment(true)
            setShowComparison(false)
          }}
        >
          Prepayment
        </Button>
        <Button
          variant={showComparison ? "default" : "outline"}
          onClick={() => {
            setShowSchedule(false)
            setShowPrepayment(false)
            setShowComparison(true)
          }}
        >
          Bank Comparison
        </Button>
      </div>

      {/* EMI Details (Default View) */}
      {!showSchedule && !showPrepayment && !showComparison && (

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>EMI Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly EMI:</span>
                  <span className="font-semibold">₹{emi.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Payment:</span>
                  <span className="font-semibold">₹{totalPayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Interest:</span>
                  <span className="font-semibold">₹{totalInterest.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Principal Amount:</span>
                  <span className="font-semibold">₹{amount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loan Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                {assess.data ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Affordability:</span>
                      <Badge variant={assess.data.affordability === "High" ? "default" : assess.data.affordability === "Medium" ? "secondary" : "destructive"}>
                        {assess.data.affordability}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Risk Level:</span>
                      <Badge variant={assess.data.risk === "Low" ? "default" : assess.data.risk === "Medium" ? "secondary" : "destructive"}>
                        {assess.data.risk}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                      <ul className="text-sm text-gray-600 list-disc pl-5">
                        {assess.data.mitigations.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Click "Assess Loan" to see detailed analysis</p>
                )}
              </CardContent>
            </Card>
          </div>

          {assess.data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Balance Over Time
                  <Badge variant="outline" className="text-xs">
                    {assess.data.schedule.length} years
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track your loan balance reduction over the entire tenure
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={assess.data.schedule}
                      margin={{ top: 10, right: 30, left: 60, bottom: 40 }}
                    >
                      <defs>
                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#e5e7eb" 
                        className="opacity-30"
                      />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        label={{ 
                          value: 'Time (Months)', 
                          position: 'insideBottom', 
                          offset: -5,
                          style: { fontSize: 12, fill: '#6b7280' }
                        }}
                        tickFormatter={(value) => {
                          if (value % 12 === 0) {
                            return `Year ${value / 12}`
                          }
                          return ''
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        label={{ 
                          value: 'Outstanding Balance (₹)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fontSize: 12, fill: '#6b7280' }
                        }}
                        tickFormatter={(value) => {
                          if (value >= 100000) {
                            return `₹${(value / 100000).toFixed(0)}L`
                          }
                          return `₹${(value / 1000).toFixed(0)}K`
                        }}
                      />
                      <Tooltip 
                        formatter={(value: any, name: any) => [
                          `₹${Number(value).toLocaleString()}`,
                          'Outstanding Balance'
                        ]}
                        labelFormatter={(label) => {
                          const month = Number(label)
                          const year = Math.floor(month / 12)
                          const remainingMonth = month % 12
                          return `Month ${month} (${year > 0 ? `Year ${year}` : 'Start'}${remainingMonth > 0 ? `, Month ${remainingMonth}` : ''})`
                        }}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          backdropFilter: 'blur(8px)'
                        }}
                        labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#balanceGradient)"
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 font-medium">Starting Balance</div>
                    <div className="text-lg font-bold text-blue-700">
                      ₹{assess.data.schedule[0]?.balance?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-600 font-medium">Final Balance</div>
                    <div className="text-lg font-bold text-green-700">
                      ₹{assess.data.schedule[assess.data.schedule.length - 1]?.balance?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs text-purple-600 font-medium">Total Paid</div>
                    <div className="text-lg font-bold text-purple-700">
                      ₹{assess.data.emi ? (assess.data.emi * assess.data.schedule[assess.data.schedule.length - 1]?.month || 0).toLocaleString() : '0'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Amortization Schedule */}
      {showSchedule && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Amortization Schedule</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMonthsShown(Math.min(monthsShown + 12, tenure))}
                  disabled={monthsShown >= tenure}
                >
                  Show More
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMonthsShown(12)}
                >
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                Showing months 1-{Math.min(monthsShown, tenure)} of {tenure} total months
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-right p-2">Payment</th>
                      <th className="text-right p-2">Principal</th>
                      <th className="text-right p-2">Interest</th>
                      <th className="text-right p-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortizationSchedule.map((entry) => (
                      <tr key={entry.month} className="border-b">
                        <td className="p-2">{entry.month}</td>
                        <td className="text-right p-2">₹{entry.payment.toLocaleString()}</td>
                        <td className="text-right p-2">₹{entry.principal.toLocaleString()}</td>
                        <td className="text-right p-2">₹{entry.interest.toLocaleString()}</td>
                        <td className="text-right p-2">₹{entry.balance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Prepayment Analysis */}
      {showPrepayment && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Prepayment Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Interest Saved:</span>
                  <span className="font-semibold text-green-600">₹{prepaymentImpact.interestSaved.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Months Reduced:</span>
                  <span className="font-semibold">{prepaymentImpact.monthsReduced} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">New Duration:</span>
                  <span className="font-semibold">{prepaymentImpact.monthsNeeded} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Interest Paid:</span>
                  <span className="font-semibold">₹{prepaymentImpact.totalInterestPaid.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prepayment Scenarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[0, 1000, 2000, 5000, 10000].map((extra) => {
                    const impact = calculatePrepaymentImpact(amount, rate, tenure, extra)
                    return (
                      <div key={extra} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">₹{extra}/month</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">Save ₹{impact.interestSaved.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{impact.monthsReduced} months less</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>💡 Cushney Loan Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">With Prepayment:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Save ₹{prepaymentImpact.interestSaved.toLocaleString()} in interest</li>
                    <li>• Become debt-free {prepaymentImpact.monthsReduced} months earlier</li>
                    <li>• Effective interest rate reduced</li>
                    <li>• Build equity faster</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Financial Freedom:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Redirect EMI to investments</li>
                    <li>• Achieve goals sooner</li>
                    <li>• Reduce financial stress</li>
                    <li>• Build wealth faster</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bank Comparison */}
      {showComparison && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bank Comparison - ₹{amount.toLocaleString()} Loan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Bank</th>
                      <th className="text-right p-2">Rate</th>
                      <th className="text-right p-2">EMI</th>
                      <th className="text-right p-2">Total Interest</th>
                      <th className="text-right p-2">Total Cost</th>
                      <th className="text-left p-2">Features</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankOffers.map((bank, index) => (
                      <tr key={bank.name} className={`border-b ${index === 0 ? 'bg-green-50' : ''}`}>
                        <td className="p-2 font-medium">{bank.name}</td>
                        <td className="text-right p-2">{bank.rate}%</td>
                        <td className="text-right p-2">₹{bank.emi.toLocaleString()}</td>
                        <td className="text-right p-2">₹{bank.totalInterest.toLocaleString()}</td>
                        <td className="text-right p-2">₹{bank.totalCost.toLocaleString()}</td>
                        <td className="p-2 text-xs text-gray-600">{bank.features.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bankOffers.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="text-green-800 font-medium">💰 Best Offer:</span>
                    <span className="text-green-700">{bankOffers[0].name}</span>
                    <span className="text-green-600">- Lowest Total Cost: ₹{bankOffers[0].totalCost.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loan Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Loan Tips & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(loanTips).map(([category, tips]) => (
              <div key={category}>
                <h4 className="font-medium mb-2">{category}:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {tips.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
