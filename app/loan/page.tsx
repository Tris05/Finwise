"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { LoanCalculator } from "@/components/loan-calculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, RadialBarChart, RadialBar } from "recharts"
import { useState } from "react"

const gauge = [{ name: "EMI Stress", value: 62 }]

// Indian bank comparison data for different loan types
const bankComparison = {
  house: [
    { bank: "SBI", rate: "8.4%", emi: "₹20,500", features: "Lowest rate, Govt bank" },
    { bank: "HDFC", rate: "8.7%", emi: "₹20,800", features: "Quick approval" },
    { bank: "ICICI", rate: "8.9%", emi: "₹21,100", features: "Flexible tenure" },
    { bank: "Axis", rate: "9.1%", emi: "₹21,400", features: "Online process" },
    { bank: "Kotak", rate: "9.3%", emi: "₹21,700", features: "Pre-approved offers" }
  ],
  car: [
    { bank: "HDFC", rate: "9.2%", emi: "₹18,500", features: "Quick processing" },
    { bank: "ICICI", rate: "9.5%", emi: "₹18,800", features: "Low down payment" },
    { bank: "SBI", rate: "9.7%", emi: "₹19,100", features: "Govt bank security" },
    { bank: "Axis", rate: "10.1%", emi: "₹19,400", features: "Flexible EMI" },
    { bank: "Kotak", rate: "10.3%", emi: "₹19,700", features: "Online approval" }
  ],
  student: [
    { bank: "SBI", rate: "7.5%", emi: "₹15,200", features: "Lowest rate, Govt bank" },
    { bank: "HDFC", rate: "8.2%", emi: "₹15,800", features: "Moratorium period" },
    { bank: "ICICI", rate: "8.5%", emi: "₹16,100", features: "Flexible repayment" },
    { bank: "Axis", rate: "8.8%", emi: "₹16,400", features: "Career guidance" },
    { bank: "Kotak", rate: "9.1%", emi: "₹16,700", features: "Online application" }
  ]
}

export default function LoanPage() {
  const [loanType, setLoanType] = useState<"house" | "car" | "student">("house")
  const compare = bankComparison[loanType]

  return (
    <QueryProvider>
      <AppShell>
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
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
                    <div className="text-sm text-gray-600">8.4% - 9.3%</div>
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
            <LoanCalculator loanType={loanType} />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>EMI Gauge</CardTitle>
              </CardHeader>
              <CardContent className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart data={gauge} innerRadius="60%" outerRadius="100%" startAngle={180} endAngle={0}>
                    <RadialBar minAngle={15} clockWise dataKey="value" fill="var(--chart-6)" cornerRadius={8} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center text-sm mt-1">Stress: {gauge[0].value}% (target &lt; 40%)</div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Bank Comparison - {loanType.charAt(0).toUpperCase() + loanType.slice(1)} Loan</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="grid grid-cols-4 gap-2 font-medium mb-2">
                  <div>Bank</div>
                  <div>Rate</div>
                  <div>EMI</div>
                  <div>Features</div>
                </div>
                {compare.map((r) => (
                  <div key={r.bank} className="grid grid-cols-4 gap-2 border-b py-2">
                    <div className="font-medium">{r.bank}</div>
                    <div className="text-green-600">{r.rate}</div>
                    <div>{r.emi}</div>
                    <div className="text-xs text-gray-600">{r.features}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Tip</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {loanType === "house" && "SBI offers the lowest home loan rates. Consider prepayment to save interest."}
                {loanType === "car" && "HDFC provides quick car loan processing. Compare down payment options."}
                {loanType === "student" && "SBI education loans have lowest rates. Moratorium period available during studies."}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </QueryProvider>
  )
}
