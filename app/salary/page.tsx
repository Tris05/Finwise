"use client"

import { AppShell } from "@/components/app-shell"

import { TakeHomeCalculator } from "@/components/take-home-calculator"
import { SalaryBudgetingTool } from "@/components/salary-budgeting-tool"
import { SalaryGrowthTracker } from "@/components/salary-growth-tracker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useUserProfile } from "@/hooks/useUserProfile"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { Save, CheckCircle2, Loader2 } from "lucide-react"

export default function SalaryPage() {
  const { annualIncome } = useUserProfile()
  const { toast } = useToast()
  const [grossSalary, setGrossSalary] = useState(1200000)
  const [monthlyTakeHome, setMonthlyTakeHome] = useState(100000)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Sync with profile income once loaded
  useEffect(() => {
    if (annualIncome) {
      setGrossSalary(annualIncome)
      setHasUnsavedChanges(false)
    }
  }, [annualIncome])

  useEffect(() => {
    if (annualIncome && grossSalary !== annualIncome) {
      setHasUnsavedChanges(true)
    } else {
      setHasUnsavedChanges(false)
    }
  }, [grossSalary, annualIncome])

  const handleSaveToProfile = async () => {
    const user = auth.currentUser
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save changes.",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      // Create a new portfolio request to update the profile
      // This ensures all agents pick up the new income
      const requestsRef = collection(db, "users", user.uid, "portfolio_requests")

      // Get the last request to preserve other details if possible
      let lastInput: any = {}
      const q = query(requestsRef, orderBy("created_at", "desc"), limit(1))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        lastInput = snapshot.docs[0].data().input || {}
      }

      await addDoc(requestsRef, {
        status: "completed",
        created_at: serverTimestamp(),
        input: {
          ...lastInput,
          user_profile: {
            ...(lastInput.user_profile || {}),
            annual_income: grossSalary
          }
        },
        output: {
          note: "Updated via Salary Management tool"
        }
      })

      setHasUnsavedChanges(false)
      toast({
        title: "Profile Updated",
        description: `Your annual income has been updated to ₹${grossSalary.toLocaleString()}`,
        variant: "default"
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Take-Home Pay Calculator</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Calculate your actual take-home salary after all deductions
                    </p>
                  </div>
                  {hasUnsavedChanges && (
                    <Button
                      onClick={handleSaveToProfile}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700 shadow-md animate-pulse"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save to Profile
                    </Button>
                  )}
                </div>
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
  )
}
