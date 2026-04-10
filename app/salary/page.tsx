"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { TakeHomeCalculator } from "@/components/take-home-calculator"
import { SalaryBudgetingTool } from "@/components/salary-budgeting-tool"
import { SalaryGrowthTracker } from "@/components/salary-growth-tracker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { useUserProfile } from "@/hooks/useUserProfile"

export default function SalaryPage() {
  const { annualIncome } = useUserProfile()
  const [grossSalary, setGrossSalary] = useState(1200000)
  const [monthlyTakeHome, setMonthlyTakeHome] = useState(100000)

  // Sync with profile income once loaded
  useEffect(() => {
    if (annualIncome) {
      setGrossSalary(annualIncome)
      // Rough estimate until calculator runs
      setMonthlyTakeHome(Math.round((annualIncome * 0.8) / 12))
    }
  }, [annualIncome])

  return (
    <QueryProvider>
      <AppShell>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-heading">Salary Management</h1>
            <p className="text-muted-foreground">
              Optimize your salary, plan your budget, and track your career growth
            </p>
          </div>

          <Tabs defaultValue="take-home" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="take-home">Take-Home Calculator</TabsTrigger>
              <TabsTrigger value="budgeting">Budget Planning</TabsTrigger>
              <TabsTrigger value="growth">Career Growth</TabsTrigger>
            </TabsList>

            <TabsContent value="take-home" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Take-Home Pay Calculator</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Calculate your actual take-home salary after all deductions including PF, ESI, TDS, and Professional Tax
                  </p>
                </CardHeader>
                <CardContent>
                  <TakeHomeCalculator
                    initialGross={grossSalary}
                    onGrossChange={setGrossSalary}
                    onMonthlyTakeHomeUpdate={setMonthlyTakeHome}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budgeting" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Salary Budgeting Tool</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Plan your monthly expenses using customizable categories for needs, wants, and savings
                  </p>
                </CardHeader>
                <CardContent>
                  <SalaryBudgetingTool
                    syncedMonthlySalary={monthlyTakeHome}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="growth" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Salary Growth Tracker</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track your career progression with personalized goals, set salary targets, and plan your financial future
                  </p>
                </CardHeader>
                <CardContent>
                  <SalaryGrowthTracker />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </QueryProvider>
  )
}
