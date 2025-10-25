"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Settings, Target } from "lucide-react"
import { CustomCareerGoals } from "./custom-career-goals"
import { loadUserPreferences, saveUserPreferences, getDefaultCareerGoals, type UserPreferences } from "@/lib/user-preferences"

interface SalaryGrowth {
  year: number
  currentSalary: number
  projectedSalary: number
  growthRate: number
}

interface CareerMilestone {
  year?: number
  salary?: number
  milestone?: string
  description: string
  // User goal milestones have these properties:
  id?: string
  title?: string
  targetDate?: string
  completed?: boolean
}

export function SalaryGrowthTracker() {
  const [currentSalary, setCurrentSalary] = useState(1200000)
  const [experience, setExperience] = useState(3)
  const [annualGrowthRate, setAnnualGrowthRate] = useState(10)
  const [salaryProjections, setSalaryProjections] = useState<SalaryGrowth[]>([])
  const [milestones, setMilestones] = useState<CareerMilestone[]>([])
  const [showCustomization, setShowCustomization] = useState(false)
  const [userGoals, setUserGoals] = useState<Array<{
    id: string
    title: string
    description: string
    targetSalary: number
    targetDate: string
    currentProgress: number
    skills: string[]
    milestones: CareerMilestone[]
  }>>(() => {
    const preferences = loadUserPreferences()
    return preferences?.careerGoals || getDefaultCareerGoals()
  })

  const calculateProjections = () => {
    const projections: SalaryGrowth[] = []
    const currentYear = new Date().getFullYear()
    
    for (let i = 0; i <= 10; i++) {
      const year = currentYear + i
      const yearsFromNow = i
      const projectedSalary = currentSalary * Math.pow(1 + annualGrowthRate / 100, yearsFromNow)
      
      projections.push({
        year,
        currentSalary: i === 0 ? currentSalary : currentSalary * Math.pow(1 + annualGrowthRate / 100, i - 1),
        projectedSalary,
        growthRate: annualGrowthRate
      })
    }
    
    setSalaryProjections(projections)
  }

  const getCareerMilestones = () => {
    // Use the first user goal as the primary career path
    if (userGoals.length > 0) {
      setMilestones(userGoals[0].milestones)
    }
  }

  useEffect(() => {
    calculateProjections()
    getCareerMilestones()
  }, [currentSalary, annualGrowthRate, userGoals])

  const chartData = salaryProjections.map(p => ({
    year: p.year.toString(),
    current: p.currentSalary,
    projected: p.projectedSalary
  }))

  const nextMilestone = milestones.find(m => m.salary && m.salary > currentSalary)
  const progressToNext = nextMilestone && nextMilestone.salary ? 
    ((currentSalary - milestones[milestones.indexOf(nextMilestone) - 1]?.salary || 0) / 
     (nextMilestone.salary - milestones[milestones.indexOf(nextMilestone) - 1]?.salary || 1)) * 100 : 100

  const saveGoalsToStorage = (goals: typeof userGoals) => {
    const preferences = loadUserPreferences() || { budgetCategories: [], careerGoals: [] }
    preferences.careerGoals = goals
    saveUserPreferences(preferences)
  }

  if (showCustomization) {
    return (
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Customize Your Career Goals</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowCustomization(false)}
          >
            Back to Growth Tracker
          </Button>
        </div>
        <CustomCareerGoals />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Salary Growth Inputs</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowCustomization(true)}
              >
                <Target className="h-4 w-4 mr-2" />
                Customize Goals
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-salary">Current Annual Salary (₹)</Label>
              <Input
                id="current-salary"
                type="number"
                value={currentSalary}
                onChange={(e) => setCurrentSalary(Number(e.target.value))}
                placeholder="1200000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                value={experience}
                onChange={(e) => setExperience(Number(e.target.value))}
                placeholder="3"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="growth-rate">Expected Annual Growth Rate (%)</Label>
              <Input
                id="growth-rate"
                type="number"
                value={annualGrowthRate}
                onChange={(e) => setAnnualGrowthRate(Number(e.target.value))}
                placeholder="10"
              />
            </div>
            
            {userGoals.length > 0 && (
              <div className="space-y-2">
                <Label>Current Career Goal</Label>
                <div className="p-3 border rounded-lg">
                  <div className="font-medium">{userGoals[0].title}</div>
                  <div className="text-sm text-muted-foreground">{userGoals[0].description}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Target: ₹{userGoals[0].targetSalary.toLocaleString()} by {new Date(userGoals[0].targetDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Career Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextMilestone && nextMilestone.salary ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-lg font-semibold">Next Milestone</div>
                  <div className="text-2xl font-bold text-blue-600">{nextMilestone.milestone}</div>
                  <div className="text-sm text-muted-foreground">{nextMilestone.description}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Target Salary</span>
                    <span>₹{nextMilestone.salary.toLocaleString()}</span>
                  </div>
                  <Progress value={progressToNext} className="h-2" />
                  <div className="text-xs text-center text-muted-foreground">
                    {progressToNext.toFixed(1)}% to next milestone
                  </div>
                </div>
              </div>
            ) : userGoals.length > 0 ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-lg font-semibold">Current Goal</div>
                  <div className="text-2xl font-bold text-blue-600">{userGoals[0].title}</div>
                  <div className="text-sm text-muted-foreground">{userGoals[0].description}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Target Salary</span>
                    <span>₹{userGoals[0].targetSalary.toLocaleString()}</span>
                  </div>
                  <Progress value={userGoals[0].currentProgress} className="h-2" />
                  <div className="text-xs text-center text-muted-foreground">
                    {userGoals[0].currentProgress}% progress
                  </div>
                </div>
              </div>
            ) : null}
            
            <div className="space-y-2">
              <div className="text-sm font-medium">5-Year Projection</div>
              <div className="text-2xl font-bold text-green-600">
                ₹{salaryProjections[5]?.projectedSalary.toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                {((salaryProjections[5]?.projectedSalary || 0) / currentSalary - 1) * 100}% growth
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary Growth Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Current Salary"
                />
                <Line 
                  type="monotone" 
                  dataKey="projected" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Projected Salary"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Career Milestones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestones.map((milestone, index) => (
              <div key={milestone.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{milestone.milestone || milestone.title}</div>
                  <div className="text-sm text-muted-foreground">{milestone.description}</div>
                </div>
                <div className="text-right">
                  {milestone.salary && (
                    <div className="font-semibold">₹{milestone.salary.toLocaleString()}</div>
                  )}
                  {milestone.targetDate && (
                    <div className="text-sm text-muted-foreground">
                      Target: {new Date(milestone.targetDate).toLocaleDateString()}
                    </div>
                  )}
                  {milestone.year && (
                    <div className="text-sm text-muted-foreground">{milestone.year} years</div>
                  )}
                  {milestone.completed !== undefined && (
                    <div className="text-sm text-muted-foreground">
                      {milestone.completed ? '✅ Completed' : '⏳ Pending'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">💡</span>
              <span><strong>Skill Development:</strong> Invest in learning new technologies and certifications</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500">💡</span>
              <span><strong>Performance:</strong> Exceed expectations and take on additional responsibilities</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-purple-500">💡</span>
              <span><strong>Networking:</strong> Build professional relationships and industry connections</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-orange-500">💡</span>
              <span><strong>Negotiation:</strong> Research market rates and negotiate during reviews</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
