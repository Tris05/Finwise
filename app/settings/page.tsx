"use client"

import { AppShell } from "@/components/app-shell"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Plus, Trash2, Target, TrendingUp, Home, Car, GraduationCap, Save, Loader2 } from "lucide-react"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useFinancialGoals, FinancialGoal, GoalType } from "@/hooks/useFinancialGoals"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

type RiskProfile = "Conservative" | "Moderate" | "Aggressive"

export default function SettingsPage() {
  const { annualIncome, name, email, phone, city, riskProfile, settings, loading: profileLoading } = useUserProfile()
  const { goals, addGoal: addGoalDb, deleteGoal: deleteGoalDb, loading: goalsLoading } = useFinancialGoals()
  const { toast } = useToast()

  const [localProfile, setLocalProfile] = useState({
    name: "",
    email: "",
    phone: "",
    city: ""
  })

  const [newGoal, setNewGoal] = useState<Partial<FinancialGoal>>({
    type: "Emergency Fund",
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    targetDate: "",
    priority: "Medium",
    monthlyContribution: 0,
    expectedReturn: 8
  })

  const [isSavingProfile, setIsSavingProfile] = useState(false)

  useEffect(() => {
    if (name || email || phone || city) {
      setLocalProfile({
        name: name || "",
        email: email || "",
        phone: phone || "",
        city: city || ""
      })
    }
  }, [name, email, phone, city])

  const handleUpdateSettings = async (updates: any) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, {
        settings: {
          ...settings,
          ...updates
        }
      }, { merge: true })
    } catch (error) {
      console.error("Error updating settings:", error)
    }
  }

  const handleUpdateRiskProfile = async (profile: RiskProfile) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, {
        profile: {
          riskProfile: profile
        }
      }, { merge: true })
    } catch (error) {
      console.error("Error updating risk profile:", error)
    }
  }

  const handleSavePersonalInfo = async () => {
    const user = auth.currentUser
    if (!user) return

    setIsSavingProfile(true)
    try {
      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, {
        profile: {
          ...localProfile,
          riskProfile // Preserve risk profile
        }
      }, { merge: true })
      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved successfully."
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleAddGoal = async () => {
    if (newGoal.name && newGoal.targetAmount && newGoal.targetDate) {
      await addGoalDb({
        type: newGoal.type as GoalType,
        name: newGoal.name,
        targetAmount: newGoal.targetAmount,
        currentAmount: newGoal.currentAmount || 0,
        targetDate: newGoal.targetDate,
        priority: newGoal.priority as "High" | "Medium" | "Low",
        monthlyContribution: newGoal.monthlyContribution || 0,
        expectedReturn: newGoal.expectedReturn || 8
      })
      setNewGoal({
        type: "Emergency Fund",
        name: "",
        targetAmount: 0,
        currentAmount: 0,
        targetDate: "",
        priority: "Medium",
        monthlyContribution: 0,
        expectedReturn: 8
      })
    }
  }

  const getGoalIcon = (type: GoalType) => {
    switch (type) {
      case "Emergency Fund": return <Target className="h-4 w-4" />
      case "Home Purchase": return <Home className="h-4 w-4" />
      case "Car Purchase": return <Car className="h-4 w-4" />
      case "Education": return <GraduationCap className="h-4 w-4" />
      case "Retirement": return <TrendingUp className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800"
      case "Medium": return "bg-yellow-100 text-yellow-800"
      case "Low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getRiskProfileDescription = (profile: RiskProfile) => {
    switch (profile) {
      case "Conservative":
        return "Low risk tolerance. Prefers stable returns with minimal volatility. Suitable for short-term goals and risk-averse investors."
      case "Moderate":
        return "Balanced approach between risk and return. Mix of stable and growth investments. Suitable for medium-term goals."
      case "Aggressive":
        return "High risk tolerance. Focuses on growth investments with higher volatility. Suitable for long-term goals and young investors."
    }
  }

  return (
    <AppShell>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="risk">Risk Profile</TabsTrigger>
          <TabsTrigger value="goals">Financial Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Personal Information</CardTitle>
                <Button
                  size="sm"
                  onClick={handleSavePersonalInfo}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <label className="text-sm flex items-center">Name</label>
                <Input
                  value={localProfile.name}
                  onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                  aria-label="Name"
                />
                <label className="text-sm flex items-center">Email</label>
                <Input
                  value={localProfile.email}
                  onChange={(e) => setLocalProfile({ ...localProfile, email: e.target.value })}
                  aria-label="Email"
                />
                <label className="text-sm flex items-center">Phone</label>
                <Input
                  value={localProfile.phone}
                  onChange={(e) => setLocalProfile({ ...localProfile, phone: e.target.value })}
                  aria-label="Phone"
                />
                <label className="text-sm flex items-center">City</label>
                <Input
                  value={localProfile.city}
                  onChange={(e) => setLocalProfile({ ...localProfile, city: e.target.value })}
                  aria-label="City"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="space-y-2">
                  <Button variant="outline" className="w-full">Change Password</Button>
                  <Button variant="outline" className="w-full">Update Security Questions</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme">Dark Mode</Label>
                  <Switch
                    id="theme"
                    checked={settings.theme === "dark"}
                    onCheckedChange={(v) => {
                      const newTheme = v ? "dark" : "light"
                      handleUpdateSettings({ theme: newTheme })
                      document.documentElement.classList.toggle("dark", v)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency Display</Label>
                  <Select value={settings.currency} onValueChange={(v) => handleUpdateSettings({ currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inr">INR (₹)</SelectItem>
                      <SelectItem value="usd">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.email}
                    onCheckedChange={(v) => handleUpdateSettings({ notifications: { ...settings.notifications, email: v } })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <Switch
                    id="push-notifications"
                    checked={settings.notifications.push}
                    onCheckedChange={(v) => handleUpdateSettings({ notifications: { ...settings.notifications, push: v } })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <Switch
                    id="sms-notifications"
                    checked={settings.notifications.sms}
                    onCheckedChange={(v) => handleUpdateSettings({ notifications: { ...settings.notifications, sms: v } })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Risk Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select your risk tolerance</Label>
                  <Select value={riskProfile as RiskProfile} onValueChange={(value: RiskProfile) => handleUpdateRiskProfile(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Conservative">Conservative</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">{riskProfile} Profile</h4>
                  <p className="text-sm text-blue-700">{getRiskProfileDescription(riskProfile as RiskProfile)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Investment Horizon</span>
                    <span className="font-medium">5-10 years</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Volatility Tolerance</span>
                    <span className="font-medium">
                      {riskProfile === "Conservative" ? "Low" : riskProfile === "Moderate" ? "Medium" : "High"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expected Return</span>
                    <span className="font-medium">
                      {riskProfile === "Conservative" ? "6-8%" : riskProfile === "Moderate" ? "8-12%" : "12-15%"}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Button className="w-full">Retake Assessment</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Financial Goal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Goal Type</Label>
                    <Select value={newGoal.type} onValueChange={(value: GoalType) => setNewGoal({ ...newGoal, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Emergency Fund">Emergency Fund</SelectItem>
                        <SelectItem value="Home Purchase">Home Purchase</SelectItem>
                        <SelectItem value="Car Purchase">Car Purchase</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Retirement">Retirement</SelectItem>
                        <SelectItem value="Vacation">Vacation</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Goal Name</Label>
                    <Input
                      value={newGoal.name || ""}
                      onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                      placeholder="e.g., Emergency Fund"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Amount (₹)</Label>
                    <Input
                      type="number"
                      value={newGoal.targetAmount || ""}
                      onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                      placeholder="500000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Amount (₹)</Label>
                    <Input
                      type="number"
                      value={newGoal.currentAmount || ""}
                      onChange={(e) => setNewGoal({ ...newGoal, currentAmount: Number(e.target.value) })}
                      placeholder="150000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Date</Label>
                    <Input
                      type="date"
                      value={newGoal.targetDate || ""}
                      onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newGoal.priority} onValueChange={(value: "High" | "Medium" | "Low") => setNewGoal({ ...newGoal, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Contribution (₹)</Label>
                    <Input
                      type="number"
                      value={newGoal.monthlyContribution || ""}
                      onChange={(e) => setNewGoal({ ...newGoal, monthlyContribution: Number(e.target.value) })}
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Return (% p.a.)</Label>
                    <Input
                      type="number"
                      value={newGoal.expectedReturn || ""}
                      onChange={(e) => setNewGoal({ ...newGoal, expectedReturn: Number(e.target.value) })}
                      placeholder="8"
                    />
                  </div>
                </div>
                <Button onClick={handleAddGoal} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {goals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100
                const remaining = goal.targetAmount - goal.currentAmount
                const monthsLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))
                const monthlyTarget = remaining / Math.max(monthsLeft, 1)

                return (
                  <Card key={goal.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getGoalIcon((goal.type ?? "Other") as GoalType)}
                          <div>
                            <h3 className="font-semibold">{goal.name}</h3>
                            <p className="text-sm text-muted-foreground">{goal.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteGoalDb(goal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Current: </span>
                            <span className="font-medium">₹{goal.currentAmount.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Target: </span>
                            <span className="font-medium">₹{goal.targetAmount.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Remaining: </span>
                            <span className="font-medium">₹{remaining.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Monthly Target: </span>
                            <span className="font-medium">₹{Math.round(monthlyTarget).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
