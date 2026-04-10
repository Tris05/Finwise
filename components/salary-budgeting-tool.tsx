"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Settings, Info } from "lucide-react"
import { CustomBudgetCategories } from "./custom-budget-categories"
import { loadUserPreferences, saveUserPreferences, getDefaultBudgetCategories, type UserPreferences } from "@/lib/user-preferences"
import { useUserProfile } from "@/hooks/useUserProfile"
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

export function SalaryBudgetingTool() {
  const { annualIncome } = useUserProfile()
  const [monthlySalary, setMonthlySalary] = useState(100000)
  const [rules, setRules] = useState({ needs: 50, wants: 30, savings: 20 })
  const [budgetAllocation, setBudgetAllocation] = useState<BudgetAllocation | null>(null)
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdown | null>(null)
  const [showCustomization, setShowCustomization] = useState(false)

  const [customCategories, setCustomCategories] = useState<{
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

  // Sync with profile income
  useEffect(() => {
    if (annualIncome) {
      // Estimate monthly take-home if not already set or as a better default
      // Using a rough 0.8 factor if they haven't run the calculator yet
      setMonthlySalary(Math.round((annualIncome * 0.8) / 12))
    }
  }, [annualIncome])

  const calculateBudget = () => {
    const needs = (monthlySalary * rules.needs) / 100
    const wants = (monthlySalary * rules.wants) / 100
    const savings = (monthlySalary * rules.savings) / 100

    setBudgetAllocation({ needs, wants, savings, total: monthlySalary })

    // Calculate breakdown using custom categories
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
          <h2 className="text-2xl font-bold">Customize Budget Categories</h2>
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
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Budget Strategy</CardTitle>
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
              <Label htmlFor="monthly-salary">Monthly Take-Home Salary (₹)</Label>
              <Input
                id="monthly-salary"
                type="number"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(Number(e.target.value))}
                placeholder="100000"
              />
            </div>

            <Separator />

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Needs (%)</Label>
                  <Badge variant="destructive">{rules.needs}%</Badge>
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
                  <Badge variant="default">{rules.wants}%</Badge>
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
                  <Badge variant="secondary">{rules.savings}%</Badge>
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

        <Card>
          <CardHeader>
            <CardTitle>Strategy Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {budgetAllocation && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600 font-medium">Needs</span>
                    <span className="font-bold">₹{budgetAllocation.needs.toLocaleString()}</span>
                  </div>
                  <Progress value={rules.needs} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 font-medium">Wants</span>
                    <span className="font-bold">₹{budgetAllocation.wants.toLocaleString()}</span>
                  </div>
                  <Progress value={rules.wants} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">Savings</span>
                    <span className="font-bold">₹{budgetAllocation.savings.toLocaleString()}</span>
                  </div>
                  <Progress value={rules.savings} className="h-2" />
                </div>

                <div className="pt-4 border-t text-center">
                  <div className="text-sm text-muted-foreground">Total Disposable Income</div>
                  <div className="text-2xl font-black">₹{monthlySalary.toLocaleString()}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {budgetBreakdown && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-600 text-lg">Needs Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customCategories?.needs?.map((category) => (
                <div key={category.id} className="flex justify-between">
                  <span className="text-sm">{category.name}</span>
                  <span className="text-sm font-medium">
                    ₹{Math.round(budgetBreakdown?.needs?.[category.name] || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-600 text-lg">Wants Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customCategories?.wants?.map((category) => (
                <div key={category.id} className="flex justify-between">
                  <span className="text-sm">{category.name}</span>
                  <span className="text-sm font-medium">
                    ₹{Math.round(budgetBreakdown?.wants?.[category.name] || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-600 text-lg">Savings Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customCategories?.savings?.map((category) => (
                <div key={category.id} className="flex justify-between">
                  <span className="text-sm">{category.name}</span>
                  <span className="text-sm font-medium">
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
