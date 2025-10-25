"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { CustomBudgetCategories } from "./custom-budget-categories"
import { loadUserPreferences, saveUserPreferences, getDefaultBudgetCategories, type UserPreferences } from "@/lib/user-preferences"

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
  const [monthlySalary, setMonthlySalary] = useState(100000)
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

  const calculateBudget = () => {
    const needs = monthlySalary * 0.5 // 50% for needs
    const wants = monthlySalary * 0.3 // 30% for wants
    const savings = monthlySalary * 0.2 // 20% for savings

    setBudgetAllocation({ needs, wants, savings, total: monthlySalary })

    // Calculate breakdown using custom categories
    const needsBreakdown: Record<string, number> = {}
    const wantsBreakdown: Record<string, number> = {}
    const savingsBreakdown: Record<string, number> = {}

    // Add null checks to prevent errors
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
    if (customCategories?.needs && customCategories?.wants && customCategories?.savings) {
      calculateBudget()
    }
  }, [monthlySalary, customCategories])

  const handleCategoriesUpdate = (newCategories: typeof customCategories) => {
    setCustomCategories(newCategories)
    // Save to localStorage
    const preferences = loadUserPreferences() || { budgetCategories: getDefaultBudgetCategories(), careerGoals: [] }
    preferences.budgetCategories = newCategories
    saveUserPreferences(preferences)
  }

  if (showCustomization) {
    return (
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Customize Budget Categories</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowCustomization(false)}
          >
            Back to Budget
          </Button>
        </div>
        <CustomBudgetCategories />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>50/30/20 Budget Rule</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCustomization(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize Categories
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
          
          {budgetAllocation && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">₹{budgetAllocation.needs.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Needs (50%)</div>
                  <Progress value={50} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">₹{budgetAllocation.wants.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Wants (30%)</div>
                  <Progress value={30} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">₹{budgetAllocation.savings.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Savings (20%)</div>
                  <Progress value={20} className="mt-2" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {budgetBreakdown && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Needs Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Needs (50%)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customCategories?.needs?.map((category) => (
                <div key={category.id} className="flex justify-between">
                  <span className="text-sm">{category.name}</span>
                  <span className="text-sm font-medium">
                    ₹{budgetBreakdown?.needs?.[category.name]?.toLocaleString() || 0}
                  </span>
                </div>
              )) || []}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Needs</span>
                <Badge variant="destructive">₹{budgetAllocation?.needs.toLocaleString()}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Wants Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Wants (30%)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customCategories?.wants?.map((category) => (
                <div key={category.id} className="flex justify-between">
                  <span className="text-sm">{category.name}</span>
                  <span className="text-sm font-medium">
                    ₹{budgetBreakdown?.wants?.[category.name]?.toLocaleString() || 0}
                  </span>
                </div>
              )) || []}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Wants</span>
                <Badge variant="default">₹{budgetAllocation?.wants.toLocaleString()}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Savings Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Savings (20%)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customCategories?.savings?.map((category) => (
                <div key={category.id} className="flex justify-between">
                  <span className="text-sm">{category.name}</span>
                  <span className="text-sm font-medium">
                    ₹{budgetBreakdown?.savings?.[category.name]?.toLocaleString() || 0}
                  </span>
                </div>
              )) || []}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Savings</span>
                <Badge variant="secondary">₹{budgetAllocation?.savings.toLocaleString()}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Budget Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>💡 <strong>Emergency Fund:</strong> Aim for 6 months of expenses in your emergency fund</div>
          <div>💡 <strong>Investments:</strong> Consider SIPs, PPF, or ELSS for long-term growth</div>
          <div>💡 <strong>Needs:</strong> Try to keep needs under 50% to have more flexibility</div>
          <div>💡 <strong>Wants:</strong> Track your wants spending to avoid lifestyle inflation</div>
        </CardContent>
      </Card>
    </div>
  )
}
