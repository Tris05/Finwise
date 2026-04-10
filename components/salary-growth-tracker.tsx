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
import { useUserProfile } from "@/hooks/useUserProfile"

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
  const { annualIncome, age } = useUserProfile()
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

  // Sync with profile
  useEffect(() => {
    if (annualIncome) {
      setCurrentSalary(annualIncome)
    }
  }, [annualIncome])

  const calculateProjections = () => {
    const projections: SalaryGrowth[] = []
    const currentYear = new Date().getFullYear()

    for (let i = 0; i <= 10; i++) {
      const year = currentYear + i
      const projectedSalary = currentSalary * Math.pow(1 + annualGrowthRate / 100, i)

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
    ((currentSalary - (milestones[milestones.indexOf(nextMilestone) - 1]?.salary || 0)) /
      (nextMilestone.salary - (milestones[milestones.indexOf(nextMilestone) - 1]?.salary || 0) || 1)) * 100 : 100

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
              <CardTitle>Growth Projections</CardTitle>
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
              <div className="flex justify-between">
                <Label htmlFor="current-salary">Current Annual Salary (₹)</Label>
                {annualIncome && (
                  <Badge variant="outline" className="text-[10px] h-5">Synced</Badge>
                )}
              </div>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestone Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {nextMilestone && nextMilestone.salary ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-lg font-semibold">Next Career Level</div>
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

            <div className="pt-4 border-t">
              <div className="text-sm font-medium">5-Year Projected Salary</div>
              <div className="text-2xl font-bold text-green-600">
                ₹{Math.round(salaryProjections[5]?.projectedSalary || 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {(((salaryProjections[5]?.projectedSalary || 1) / (currentSalary || 1)) - 1).toLocaleString(undefined, { style: 'percent' })} total growth
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
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="year" />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Projected Salary"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
