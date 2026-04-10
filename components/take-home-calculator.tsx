"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info } from "lucide-react"

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
  hraExemption: number
}

interface TakeHomeCalculatorProps {
  initialGross: number
  onGrossChange: (val: number) => void
  onMonthlyTakeHomeUpdate: (val: number) => void
}

export function TakeHomeCalculator({
  initialGross,
  onGrossChange,
  onMonthlyTakeHomeUpdate
}: TakeHomeCalculatorProps) {
  const [basicPercentage, setBasicPercentage] = useState(40)
  const [hraPercentage, setHraPercentage] = useState(40)
  const [monthlyRent, setMonthlyRent] = useState(25000)
  const [taxRegime, setTaxRegime] = useState<"new" | "old">("new")
  const [otherAllowances, setOtherAllowances] = useState(0)
  const [breakdown, setBreakdown] = useState<SalaryBreakdown | null>(null)

  const calculateTakeHome = () => {
    const basicSalary = (initialGross * basicPercentage) / 100
    const hraReceived = (initialGross * hraPercentage) / 100
    const monthlyGross = initialGross / 12

    // PF calculation (12% of basic salary, capped at ₹1800/month standard)
    const pf = Math.min(basicSalary * 0.12, 1800 * 12)

    // ESI calculation
    const esi = monthlyGross <= 21000 ? (initialGross * 0.0075) : 0

    // Professional Tax
    const professionalTax = initialGross > 120000 ? 2500 : 0

    // Deductions & Exemptions
    let standardDeduction = taxRegime === "new" ? 75000 : 50000
    let hraExemption = 0

    if (taxRegime === "old") {
      // HRA Exemption (Simplistic calculation)
      // 1. Actual HRA
      // 2. 40% of Basic
      // 3. Rent - 10% of Basic
      const rentPaidAnnual = monthlyRent * 12
      hraExemption = Math.max(0, Math.min(
        hraReceived,
        basicSalary * 0.4,
        rentPaidAnnual - (basicSalary * 0.1)
      ))
    }

    const taxableSalary = Math.max(0, initialGross - standardDeduction - professionalTax - hraExemption)

    let tax = 0
    if (taxRegime === "new") {
      // NEW REGIME FY 2025-26
      if (taxableSalary > 400000) {
        if (taxableSalary <= 800000) {
          tax = (taxableSalary - 400000) * 0.05
        } else if (taxableSalary <= 1200000) {
          tax = 20000 + (taxableSalary - 800000) * 0.10
        } else if (taxableSalary <= 1600000) {
          tax = 60000 + (taxableSalary - 1200000) * 0.15
        } else if (taxableSalary <= 2000000) {
          tax = 120000 + (taxableSalary - 1600000) * 0.20
        } else if (taxableSalary <= 2400000) {
          tax = 200000 + (taxableSalary - 2000000) * 0.25
        } else {
          tax = 300000 + (taxableSalary - 2400000) * 0.30
        }
      }
      // 87A Rebate for New Regime (Up to 12L taxable is free)
      if (taxableSalary <= 1200000) tax = 0
    } else {
      // OLD REGIME (Standard slabs)
      if (taxableSalary > 250000) {
        if (taxableSalary <= 500000) {
          tax = (taxableSalary - 250000) * 0.05
        } else if (taxableSalary <= 1000000) {
          tax = 12500 + (taxableSalary - 500000) * 0.20
        } else {
          tax = 112500 + (taxableSalary - 1000000) * 0.30
        }
      }
      // 87A Rebate for Old Regime (Up to 5L taxable is free)
      if (taxableSalary <= 500000) tax = 0
    }

    const totalTds = tax * 1.04 // Including 4% Cess
    const totalDeductions = pf + esi + totalTds + professionalTax + otherAllowances
    const takeHome = initialGross - totalDeductions

    setBreakdown({
      grossSalary: initialGross,
      basicSalary,
      hra: hraReceived,
      pf,
      esi,
      tds: totalTds,
      professionalTax,
      otherDeductions: otherAllowances,
      takeHome,
      standardDeduction,
      taxableIncome: taxableSalary,
      hraExemption
    })

    onMonthlyTakeHomeUpdate(Math.round(takeHome / 12))
  }

  const handleGrossChange = (val: string) => {
    const num = val === "" ? 0 : Number(val)
    onGrossChange(Math.max(0, num))
  }

  const handleHraChange = (val: string) => {
    const num = val === "" ? 0 : Number(val)
    setHraPercentage(Math.max(0, Math.min(100, num)))
  }

  const handleBasicChange = (val: string) => {
    const num = val === "" ? 0 : Number(val)
    setBasicPercentage(Math.max(0, Math.min(100, num)))
  }

  const handleRentChange = (val: string) => {
    const num = val === "" ? 0 : Number(val)
    setMonthlyRent(Math.max(0, num))
  }

  const handleOtherDeductionsChange = (val: string) => {
    const num = val === "" ? 0 : Number(val)
    setOtherAllowances(Math.max(0, num))
  }

  useEffect(() => {
    calculateTakeHome()
  }, [initialGross, basicPercentage, hraPercentage, monthlyRent, taxRegime, otherAllowances])

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Salary Configuration</CardTitle>
            <Tabs value={taxRegime} onValueChange={(v) => setTaxRegime(v as "new" | "old")}>
              <TabsList className="h-8">
                <TabsTrigger value="new" className="text-xs">New Regime</TabsTrigger>
                <TabsTrigger value="old" className="text-xs">Old Regime</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gross-salary">Gross Annual Salary (₹)</Label>
            <Input
              id="gross-salary"
              type="number"
              value={initialGross || ""}
              onChange={(e) => handleGrossChange(e.target.value)}
              placeholder="e.g. 1200000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basic-percentage">Basic (%)</Label>
              <Input
                id="basic-percentage"
                type="number"
                value={basicPercentage || ""}
                onChange={(e) => handleBasicChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hra-percentage">HRA (%)</Label>
              <Input
                id="hra-percentage"
                type="number"
                value={hraPercentage || ""}
                onChange={(e) => handleHraChange(e.target.value)}
              />
            </div>
          </div>

          {taxRegime === "old" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <Label htmlFor="monthly-rent">Monthly Rent Paid (₹)</Label>
              <Input
                id="monthly-rent"
                type="number"
                value={monthlyRent || ""}
                onChange={(e) => handleRentChange(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Required for HRA exemption in Old Regime</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="other-allowances">Other Monthly Deductions (₹)</Label>
            <Input
              id="other-allowances"
              type="number"
              value={otherAllowances || ""}
              onChange={(e) => handleOtherDeductionsChange(e.target.value)}
            />
          </div>

          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="text-[11px] text-blue-800 flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5" />
              <span>
                {taxRegime === "new"
                  ? "New Regime (FY 2025-26) offers lower rates but no HRA/80C exemptions. Standard deduction is ₹75k."
                  : "Old Regime allows HRA, 80C, and other exemptions but at higher tax rates. Standard deduction is ₹50k."}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {breakdown && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader>
            <CardTitle>Take-Home Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Annual Gross</span>
                <span className="font-semibold">₹{breakdown.grossSalary.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground italic">
                <span>- Basic Component</span>
                <span>₹{breakdown.basicSalary.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground italic">
                <span>- HRA Component ({hraPercentage}%)</span>
                <span>₹{breakdown.hra.toLocaleString()}</span>
              </div>

              {breakdown.hraExemption > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>HRA Tax Exemption</span>
                  <span>- ₹{breakdown.hraExemption.toLocaleString()}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-sm">
                <span>Standard Deduction</span>
                <span>- ₹{breakdown.standardDeduction.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Taxable Income</span>
                <span className="font-bold">₹{breakdown.taxableIncome.toLocaleString()}</span>
              </div>

              <Separator />

              <div className="text-xs font-bold text-muted-foreground uppercase pt-2">Monthly Deductions</div>

              <div className="flex justify-between text-sm">
                <span>PF Contribution</span>
                <span>₹{Math.round(breakdown.pf / 12).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Income Tax (TDS)</span>
                <span className={breakdown.tds === 0 ? "text-green-600 font-bold" : "text-red-500 font-medium"}>
                  {breakdown.tds === 0 ? "₹0 (Rebate)" : `₹${Math.round(breakdown.tds / 12).toLocaleString()}`}
                </span>
              </div>

              <div className="flex justify-between text-sm font-bold pt-4 border-t">
                <span className="text-lg">Take-Home Salary</span>
                <div className="text-right">
                  <div className="text-2xl text-primary font-black">₹{Math.round(breakdown.takeHome / 12).toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Monthly Credit</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
