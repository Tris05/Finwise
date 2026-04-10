"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useUserProfile } from "@/hooks/useUserProfile"
import { Loader2 } from "lucide-react"

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
  standardDeduction: number
  taxableIncome: number
}

export function TakeHomeCalculator() {
  const { annualIncome, loading } = useUserProfile()
  const [grossSalary, setGrossSalary] = useState(1200000)
  const [basicPercentage, setBasicPercentage] = useState(40)
  const [hraPercentage, setHraPercentage] = useState(40)
  const [otherAllowances, setOtherAllowances] = useState(0)
  const [breakdown, setBreakdown] = useState<SalaryBreakdown | null>(null)

  // Sync with profile income once loaded
  useEffect(() => {
    if (annualIncome) {
      setGrossSalary(annualIncome)
    }
  }, [annualIncome])

  const calculateTakeHome = () => {
    const basicSalary = (grossSalary * basicPercentage) / 100
    const hra = (grossSalary * hraPercentage) / 100

    const monthlyGross = grossSalary / 12

    // PF calculation (12% of basic salary, max ₹1800/month by default if opting for minimum)
    // Most private companies cap it at 1800 per month on basic of 15000.
    // If we want to be "financially correct", we should mention this assumption or make it a toggle.
    // Assuming standard cap of 1800/month for now.
    const pf = Math.min(basicSalary * 0.12, 1800 * 12)

    // ESI calculation: Only applicable if monthly gross <= 21,000
    // Rate: 0.75% of gross salary
    const esi = monthlyGross <= 21000 ? (grossSalary * 0.0075) : 0

    // Professional Tax (Monthly usually ₹200-250, using ₹2500 annual as standard for mid-high earners)
    const professionalTax = grossSalary > 120000 ? 2500 : 0

    // Income Tax (FY 2025-26 New Regime)
    const standardDeduction = 75000
    const taxableSalary = Math.max(0, grossSalary - standardDeduction - professionalTax)

    let tax = 0
    if (taxableSalary > 400000) {
      if (taxableSalary <= 800000) {
        tax = (taxableSalary - 400000) * 0.05
      } else if (taxableSalary <= 1200000) {
        tax = 20000 + (taxableSalary - 800000) * 0.10
      } else if (taxableSalary <= 1600000) {
        tax = 20000 + 40000 + (taxableSalary - 1200000) * 0.15
      } else if (taxableSalary <= 2000000) {
        tax = 20000 + 40000 + 60000 + (taxableSalary - 1600000) * 0.20
      } else if (taxableSalary <= 2400000) {
        tax = 20000 + 40000 + 60000 + 80000 + (taxableSalary - 2000000) * 0.25
      } else {
        tax = 20000 + 40000 + 60000 + 80000 + 100000 + (taxableSalary - 2400000) * 0.30
      }
    }

    // Apply Section 87A Rebate for New Regime: Income up to 12L is tax-free
    // Note: This applies to total income (taxable salary in our context)
    if (taxableSalary <= 1200000) {
      tax = 0
    }

    // Cess (4% of tax)
    const cess = tax * 0.04
    const totalTds = tax + cess

    const totalDeductions = pf + esi + totalTds + professionalTax + otherAllowances
    const takeHome = grossSalary - totalDeductions

    setBreakdown({
      grossSalary,
      basicSalary,
      hra,
      pf,
      esi,
      tds: totalTds,
      professionalTax,
      otherDeductions: otherAllowances,
      takeHome,
      standardDeduction,
      taxableIncome: taxableSalary
    })
  }

  useEffect(() => {
    calculateTakeHome()
  }, [grossSalary, basicPercentage, hraPercentage, otherAllowances])

  if (loading && !annualIncome) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile data...</span>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Salary Inputs (FY 2025-26)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="gross-salary">Gross Annual Salary (₹)</Label>
              {annualIncome && (
                <Badge variant="outline" className="text-[10px] h-5">Synced from Profile</Badge>
              )}
            </div>
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
            <Label htmlFor="other-allowances">Other Deductions (Monthly Avg ₹)</Label>
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
            <CardTitle>Calculated Take-Home Pay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Gross Annual Salary</span>
                <span className="font-medium">₹{breakdown.grossSalary.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Taxable Income (after SD)</span>
                <span>₹{breakdown.taxableIncome.toLocaleString()}</span>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">Standard Deductions:</div>
              <div className="flex justify-between text-sm">
                <span>Standard Deduction (New Regime)</span>
                <span>- ₹{breakdown.standardDeduction.toLocaleString()}</span>
              </div>

              <div className="text-sm text-muted-foreground mt-2">Deductions (Employee Share):</div>

              <div className="flex justify-between text-sm">
                <span>Provident Fund (PF)</span>
                <span>₹{breakdown.pf.toLocaleString()}</span>
              </div>

              {breakdown.esi > 0 && (
                <div className="flex justify-between text-sm">
                  <span>ESI</span>
                  <span>₹{breakdown.esi.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span>Professional Tax</span>
                <span>₹{breakdown.professionalTax.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Income Tax (inc. 4% Cess)</span>
                <span className={breakdown.tds === 0 ? "text-green-600 font-medium" : ""}>
                  {breakdown.tds === 0 ? "₹0 (87A Rebate)" : `₹${breakdown.tds.toLocaleString()}`}
                </span>
              </div>

              {breakdown.otherDeductions > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Other Deductions</span>
                  <span>₹{breakdown.otherDeductions.toLocaleString()}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Take-Home Pay</span>
                <Badge variant="secondary" className="text-lg">
                  ₹{breakdown.takeHome.toLocaleString()}
                </Badge>
              </div>

              <div className="text-center p-3 bg-muted rounded-lg mt-4">
                <div className="text-sm text-muted-foreground">Approx. Monthly Credit</div>
                <div className="text-2xl font-bold text-primary">
                  ₹{Math.round(breakdown.takeHome / 12).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
