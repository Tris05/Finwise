"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface SalaryBreakdown {
  grossSalary: number
  basicSalary: number
  hra: number
  pf: number
  esi: number
  tds: number
  professionalTax: number
  otherDeductions: number
  takeHome: number
}

export function TakeHomeCalculator() {
  const [grossSalary, setGrossSalary] = useState(1200000)
  const [basicPercentage, setBasicPercentage] = useState(40)
  const [hraPercentage, setHraPercentage] = useState(40)
  const [otherAllowances, setOtherAllowances] = useState(0)
  const [breakdown, setBreakdown] = useState<SalaryBreakdown | null>(null)

  const calculateTakeHome = () => {
    const basicSalary = (grossSalary * basicPercentage) / 100
    const hra = (grossSalary * hraPercentage) / 100
    const specialAllowance = grossSalary - basicSalary - hra - otherAllowances

    // PF calculation (12% of basic salary, max ₹1800/month)
    const pf = Math.min(basicSalary * 0.12, 1800 * 12)

    // ESI calculation (0.75% of gross salary, max ₹21,000)
    const esi = Math.min(grossSalary * 0.0075, 21000)

    // Professional Tax (varies by state, using Maharashtra rates)
    const professionalTax = grossSalary > 1000000 ? 2500 : 2500

    // TDS calculation (simplified)
    const taxableIncome = grossSalary - pf - esi - professionalTax
    let tds = 0
    if (taxableIncome > 1500000) {
      tds = (taxableIncome - 1500000) * 0.3 + 150000
    } else if (taxableIncome > 1000000) {
      tds = (taxableIncome - 1000000) * 0.2 + 75000
    } else if (taxableIncome > 500000) {
      tds = (taxableIncome - 500000) * 0.1 + 25000
    } else if (taxableIncome > 250000) {
      tds = (taxableIncome - 250000) * 0.05
    }

    const totalDeductions = pf + esi + tds + professionalTax + otherAllowances
    const takeHome = grossSalary - totalDeductions

    setBreakdown({
      grossSalary,
      basicSalary,
      hra,
      pf,
      esi,
      tds,
      professionalTax,
      otherDeductions: otherAllowances,
      takeHome
    })
  }

  useEffect(() => {
    calculateTakeHome()
  }, [grossSalary, basicPercentage, hraPercentage, otherAllowances])

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Salary Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gross-salary">Gross Annual Salary (₹)</Label>
            <Input
              id="gross-salary"
              type="number"
              value={grossSalary}
              onChange={(e) => setGrossSalary(Number(e.target.value))}
              placeholder="1200000"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="basic-percentage">Basic Salary %</Label>
            <Input
              id="basic-percentage"
              type="number"
              value={basicPercentage}
              onChange={(e) => setBasicPercentage(Number(e.target.value))}
              placeholder="40"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hra-percentage">HRA %</Label>
            <Input
              id="hra-percentage"
              type="number"
              value={hraPercentage}
              onChange={(e) => setHraPercentage(Number(e.target.value))}
              placeholder="40"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="other-allowances">Other Allowances (₹)</Label>
            <Input
              id="other-allowances"
              type="number"
              value={otherAllowances}
              onChange={(e) => setOtherAllowances(Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      {breakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Take-Home Pay Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Gross Annual Salary</span>
                <span className="font-medium">₹{breakdown.grossSalary.toLocaleString()}</span>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">Deductions:</div>
              
              <div className="flex justify-between text-sm">
                <span>Provident Fund (PF)</span>
                <span>₹{breakdown.pf.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>ESI</span>
                <span>₹{breakdown.esi.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Professional Tax</span>
                <span>₹{breakdown.professionalTax.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Income Tax (TDS)</span>
                <span>₹{breakdown.tds.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Other Deductions</span>
                <span>₹{breakdown.otherDeductions.toLocaleString()}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Take-Home Pay</span>
                <Badge variant="secondary" className="text-lg">
                  ₹{breakdown.takeHome.toLocaleString()}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Monthly: ₹{(breakdown.takeHome / 12).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
