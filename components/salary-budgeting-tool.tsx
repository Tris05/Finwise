"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Settings, Info, RefreshCw } from "lucide-react"
import { CustomBudgetCategories } from "./custom-budget-categories"
import { loadUserPreferences, getDefaultBudgetCategories } from "@/lib/user-preferences"
import { Slider } from "@/components/ui/slider"

interface BudgetCategory {
  id: string
  name: string
  percentage: number
  description?: string
}

interface BudgetAllocation {
  needs: number
  wants: number
  savings: number
  total: number
}

interface BudgetBreakdown {
  needs: Record<string, number>
  wants: Record<string, number>
  savings: Record<string, number>
}

interface SalaryBudgetingToolProps {
  syncedMonthlySalary: number
}

export function SalaryBudgetingTool({ syncedMonthlySalary }: SalaryBudgetingToolProps) {
  const [monthlySalary, setMonthlySalary] = useState(syncedMonthlySalary)
  const [rules, setRules] = useState({ needs: 50, wants: 30, savings: 20 })
  const [budgetAllocation, setBudgetAllocation] = useState<BudgetAllocation | null>(null)
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdown | null>(null)
  const [showCustomization, setShowCustomization] = useState(false)

  const [customCategories] = useState<{
    needs: BudgetCategory[]
    wants: BudgetCategory[]
    savings: BudgetCategory[]
  }>(() => {
    try {
      const preferences = loadUserPreferences()
      return preferences?.budgetCategories || getDefaultBudgetCategories()
    } catch (error) {
      console.error('Error loading user preferences:', error)
      return getDefaultBudgetCategories()
    }
  })

  // Sync with prop from parent (TakeHomeCalculator)
  useEffect(() => {
    setMonthlySalary(syncedMonthlySalary)
  }, [syncedMonthlySalary])

  const calculateBudget = () => {
    const needs = (monthlySalary * rules.needs) / 100
    const wants = (monthlySalary * rules.wants) / 100
    const savings = (monthlySalary * rules.savings) / 100

    setBudgetAllocation({ needs, wants, savings, total: monthlySalary })

    const needsBreakdown: Record<string, number> = {}
    const wantsBreakdown: Record<string, number> = {}
    const savingsBreakdown: Record<string, number> = {}

    if (customCategories?.needs) {
      customCategories.needs.forEach(category => {
        needsBreakdown[category.name] = (needs * category.percentage) / 100
      })
    }

    if (customCategories?.wants) {
      customCategories.wants.forEach(category => {
        wantsBreakdown[category.name] = (wants * category.percentage) / 100
      })
    }

    if (customCategories?.savings) {
      customCategories.savings.forEach(category => {
        savingsBreakdown[category.name] = (savings * category.percentage) / 100
      })
    }

    setBudgetBreakdown({
      needs: needsBreakdown,
      wants: wantsBreakdown,
      savings: savingsBreakdown
    })
  }

  useEffect(() => {
    calculateBudget()
  }, [monthlySalary, customCategories, rules])

  if (showCustomization) {
    return (
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-heading text-destructive">Customize Budget Categories</h2>
          <Button
            variant="outline"
            onClick={() => setShowCustomization(false)}
          >
            Back to Budget Rules
          </Button>
        </div>
        <CustomBudgetCategories />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 shadow-sm border-muted">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading">Budget Strategy</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomization(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Category Details
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="monthly-salary">Monthly Disposable Income (₹)</Label>
                <Badge variant="secondary" className="text-[10px] h-5 flex gap-1 items-center font-medium bg-blue-50 text-blue-700 border-blue-100">
                  <RefreshCw className="h-2 w-2" /> Synced from Calculator
                </Badge>
              </div>
              <Input
                id="monthly-salary"
                type="number"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(Number(e.target.value))}
                placeholder="100000"
                className="font-mono"
              />
            </div>

            <Separator />

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Needs (%)</Label>
                  <Badge variant="destructive" className="font-bold">{rules.needs}%</Badge>
                </div>
                <Slider
                  value={[rules.needs]}
                  max={100}
                  step={5}
                  onValueChange={(val) => {
                    const newNeeds = val[0]
                    const remaining = 100 - newNeeds
                    const ratio = rules.wants / (rules.wants + rules.savings || 1)
                    setRules({
                      needs: newNeeds,
                      wants: Math.round(remaining * ratio),
                      savings: 100 - newNeeds - Math.round(remaining * ratio)
                    })
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Wants (%)</Label>
                  <Badge variant="default" className="font-bold bg-blue-600">{rules.wants}%</Badge>
                </div>
                <Slider
                  value={[rules.wants]}
                  max={100 - rules.needs}
                  step={5}
                  onValueChange={(val) => setRules(prev => ({
                    ...prev,
                    wants: val[0],
                    savings: 100 - prev.needs - val[0]
                  }))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Savings / Investments (%)</Label>
                  <Badge variant="secondary" className="font-bold bg-green-100 text-green-700">{rules.savings}%</Badge>
                </div>
                <Slider
                  value={[rules.savings]}
                  disabled
                  max={100}
                />
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" /> Auto-calculated to complete 100%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/[0.02] border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading">Strategy Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {budgetAllocation && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600 font-semibold">Needs</span>
                    <span className="font-bold">₹{budgetAllocation.needs.toLocaleString()}</span>
                  </div>
                  <Progress value={rules.needs} className="h-2 bg-red-100" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 font-semibold">Wants</span>
                    <span className="font-bold">₹{budgetAllocation.wants.toLocaleString()}</span>
                  </div>
                  <Progress value={rules.wants} className="h-2 bg-blue-100" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-semibold">Savings</span>
                    <span className="font-bold">₹{budgetAllocation.savings.toLocaleString()}</span>
                  </div>
                  <Progress value={rules.savings} className="h-2 bg-green-100" />
                </div>

                <div className="pt-6 border-t text-center">
                  <div className="text-xs text-muted-foreground uppercase mb-1 font-bold tracking-wider">Estimated Monthly Credit</div>
                  <div className="text-3xl font-black text-primary">₹{monthlySalary.toLocaleString()}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {budgetBreakdown && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-700 text-lg font-heading">Needs Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customCategories?.needs?.map((category) => (
                <div key={category.id} className="flex justify-between group">
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{category.name}</span>
                  <span className="text-sm font-semibold">
                    ₹{Math.round(budgetBreakdown?.needs?.[category.name] || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-700 text-lg font-heading">Wants Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customCategories?.wants?.map((category) => (
                <div key={category.id} className="flex justify-between group">
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{category.name}</span>
                  <span className="text-sm font-semibold">
                    ₹{Math.round(budgetBreakdown?.wants?.[category.name] || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-700 text-lg font-heading">Savings Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customCategories?.savings?.map((category) => (
                <div key={category.id} className="flex justify-between group">
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{category.name}</span>
                  <span className="text-sm font-semibold">
                    ₹{Math.round(budgetBreakdown?.savings?.[category.name] || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
