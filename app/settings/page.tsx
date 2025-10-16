"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Plus, Trash2, Target, TrendingUp, Home, Car, GraduationCap } from "lucide-react"

type RiskProfile = "Conservative" | "Moderate" | "Aggressive"
type GoalType = "Emergency Fund" | "Home Purchase" | "Car Purchase" | "Education" | "Retirement" | "Vacation" | "Other"

type FinancialGoal = {
  id: string
  type: GoalType
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  priority: "High" | "Medium" | "Low"
}

export default function SettingsPage() {
  const [twoFA, setTwoFA] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("Moderate")
  const [goals, setGoals] = useState<FinancialGoal[]>([
    {
      id: "1",
      type: "Emergency Fund",
      name: "Emergency Fund",
      targetAmount: 500000,
      currentAmount: 150000,
      targetDate: "2025-12-31",
      priority: "High"
    },
    {
      id: "2",
      type: "Home Purchase",
      name: "Home Down Payment",
      targetAmount: 2000000,
      currentAmount: 800000,
      targetDate: "2026-06-30",
      priority: "High"
    }
  ])
  const [newGoal, setNewGoal] = useState<Partial<FinancialGoal>>({
    type: "Emergency Fund",
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    targetDate: "",
    priority: "Medium"
  })

  useEffect(() => {
    setTwoFA(localStorage.getItem("twoFA") === "1")
    setTheme((localStorage.getItem("theme") as "light" | "dark") || "light")
    setRiskProfile((localStorage.getItem("riskProfile") as RiskProfile) || "Moderate")
    
    const savedGoals = localStorage.getItem("financialGoals")
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals))
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem("riskProfile", riskProfile)
  }, [riskProfile])

  useEffect(() => {
    localStorage.setItem("financialGoals", JSON.stringify(goals))
  }, [goals])

  const addGoal = () => {
    if (newGoal.name && newGoal.targetAmount && newGoal.targetDate) {
      const goal: FinancialGoal = {
        id: Date.now().toString(),
        type: newGoal.type as GoalType,
        name: newGoal.name,
        targetAmount: newGoal.targetAmount,
        currentAmount: newGoal.currentAmount || 0,
        targetDate: newGoal.targetDate,
        priority: newGoal.priority as "High" | "Medium" | "Low"
      }
      setGoals([...goals, goal])
      setNewGoal({
        type: "Emergency Fund",
        name: "",
        targetAmount: 0,
        currentAmount: 0,
        targetDate: "",
        priority: "Medium"
      })
    }
  }

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id))
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
    <QueryProvider>
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
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <label className="text-sm flex items-center">Name</label>
                  <Input defaultValue="Rajesh Kumar" aria-label="Name" />
                  <label className="text-sm flex items-center">Email</label>
                  <Input defaultValue="rajesh@example.com" aria-label="Email" />
                  <label className="text-sm flex items-center">Phone</label>
                  <Input defaultValue="+91 98765 43210" aria-label="Phone" />
                  <label className="text-sm flex items-center">City</label>
                  <Input defaultValue="Mumbai" aria-label="City" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="twofa">Enable 2FA</Label>
                    <Switch
                      id="twofa"
                      checked={twoFA}
                      onCheckedChange={(v) => {
                        setTwoFA(!!v)
                        localStorage.setItem("twoFA", v ? "1" : "0")
                      }}
                    />
                  </div>
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
                    <Switch id="theme" checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency Display</Label>
                    <Select defaultValue="inr">
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
                    <Switch id="email-notifications" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <Switch id="push-notifications" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <Switch id="sms-notifications" />
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
                    <Select value={riskProfile} onValueChange={(value: RiskProfile) => setRiskProfile(value)}>
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
                    <p className="text-sm text-blue-700">{getRiskProfileDescription(riskProfile)}</p>
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
                      <Select value={newGoal.type} onValueChange={(value: GoalType) => setNewGoal({...newGoal, type: value})}>
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
                        onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                        placeholder="e.g., Emergency Fund"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Amount (₹)</Label>
                      <Input 
                        type="number" 
                        value={newGoal.targetAmount || ""} 
                        onChange={(e) => setNewGoal({...newGoal, targetAmount: Number(e.target.value)})}
                        placeholder="500000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Current Amount (₹)</Label>
                      <Input 
                        type="number" 
                        value={newGoal.currentAmount || ""} 
                        onChange={(e) => setNewGoal({...newGoal, currentAmount: Number(e.target.value)})}
                        placeholder="150000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Date</Label>
                      <Input 
                        type="date" 
                        value={newGoal.targetDate || ""} 
                        onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={newGoal.priority} onValueChange={(value: "High" | "Medium" | "Low") => setNewGoal({...newGoal, priority: value})}>
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
                  </div>
                  <Button onClick={addGoal} className="w-full">
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
                            {getGoalIcon(goal.type)}
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
                              onClick={() => deleteGoal(goal.id)}
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
    </QueryProvider>
  )
}
