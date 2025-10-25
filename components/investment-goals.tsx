"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Target, Calendar, DollarSign, TrendingUp, Plus, Edit, Trash2 } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useState } from "react"

interface InvestmentGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  category: 'Retirement' | 'Education' | 'House' | 'Emergency' | 'Travel' | 'Other'
  priority: 'High' | 'Medium' | 'Low'
  status: 'On Track' | 'Behind' | 'Ahead' | 'Completed'
  monthlyContribution: number
  expectedReturn: number
}

interface InvestmentGoalsProps {
  goals: InvestmentGoal[]
  onAddGoal?: () => void
  onEditGoal?: (goal: InvestmentGoal) => void
  onDeleteGoal?: (goalId: string) => void
}

export function InvestmentGoals({ 
  goals, 
  onAddGoal, 
  onEditGoal, 
  onDeleteGoal 
}: InvestmentGoalsProps) {
  const [selectedGoal, setSelectedGoal] = useState<InvestmentGoal | null>(null)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track': return 'bg-green-100 text-green-800'
      case 'Behind': return 'bg-red-100 text-red-800'
      case 'Ahead': return 'bg-blue-100 text-blue-800'
      case 'Completed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Retirement': 'bg-blue-100 text-blue-800',
      'Education': 'bg-green-100 text-green-800',
      'House': 'bg-orange-100 text-orange-800',
      'Emergency': 'bg-red-100 text-red-800',
      'Travel': 'bg-purple-100 text-purple-800',
      'Other': 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const calculateProgress = (goal: InvestmentGoal) => {
    return (goal.currentAmount / goal.targetAmount) * 100
  }

  const calculateMonthsRemaining = (targetDate: string) => {
    const target = new Date(targetDate)
    const now = new Date()
    const diffTime = target.getTime() - now.getTime()
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
    return Math.max(0, diffMonths)
  }

  const calculateRequiredMonthlyContribution = (goal: InvestmentGoal) => {
    const monthsRemaining = calculateMonthsRemaining(goal.targetDate)
    if (monthsRemaining === 0) return 0
    
    const remainingAmount = goal.targetAmount - goal.currentAmount
    const monthlyReturn = goal.expectedReturn / 12 / 100
    
    if (monthlyReturn === 0) {
      return remainingAmount / monthsRemaining
    }
    
    return remainingAmount * monthlyReturn / (Math.pow(1 + monthlyReturn, monthsRemaining) - 1)
  }

  return (
    <div className="space-y-6">
      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <div className="text-sm text-muted-foreground">Active goals</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatINR(goals.reduce((sum, goal) => sum + goal.targetAmount, 0))}
            </div>
            <div className="text-sm text-muted-foreground">Across all goals</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatINR(goals.reduce((sum, goal) => sum + goal.currentAmount, 0))}
            </div>
            <div className="text-sm text-muted-foreground">Invested amount</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.filter(goal => goal.status === 'On Track').length}
            </div>
            <div className="text-sm text-muted-foreground">Goals on track</div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Investment Goals</CardTitle>
          <Button onClick={onAddGoal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal)
            const monthsRemaining = calculateMonthsRemaining(goal.targetDate)
            const requiredContribution = calculateRequiredMonthlyContribution(goal)
            
            return (
              <div
                key={goal.id}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedGoal(goal)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{goal.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className={getCategoryColor(goal.category)}>
                          {goal.category}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                          {goal.priority}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(goal.status)}>
                          {goal.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditGoal?.(goal)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteGoal?.(goal.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Target Amount</div>
                    <div className="font-semibold">{formatINR(goal.targetAmount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Amount</div>
                    <div className="font-semibold">{formatINR(goal.currentAmount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Target Date</div>
                    <div className="font-semibold">{new Date(goal.targetDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Months Remaining</div>
                    <div className="font-semibold">{monthsRemaining}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Monthly Contribution</div>
                    <div className="font-medium">{formatINR(goal.monthlyContribution)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Required Monthly</div>
                    <div className="font-medium">{formatINR(requiredContribution)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Expected Return</div>
                    <div className="font-medium">{goal.expectedReturn}% p.a.</div>
                  </div>
                </div>
              </div>
            )
          })}

          {goals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No investment goals set. Create your first goal to get started!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Goal Details */}
      {selectedGoal && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6" />
                <div>
                  <CardTitle>{selectedGoal.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className={getCategoryColor(selectedGoal.category)}>
                      {selectedGoal.category}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(selectedGoal.priority)}>
                      {selectedGoal.priority} Priority
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedGoal(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Goal Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Target Amount:</span>
                      <span className="font-medium">{formatINR(selectedGoal.targetAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Amount:</span>
                      <span className="font-medium">{formatINR(selectedGoal.currentAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target Date:</span>
                      <span className="font-medium">{new Date(selectedGoal.targetDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Return:</span>
                      <span className="font-medium">{selectedGoal.expectedReturn}% p.a.</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{calculateProgress(selectedGoal).toFixed(1)}%</span>
                    </div>
                    <Progress value={calculateProgress(selectedGoal)} className="h-2" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Contribution Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Current Monthly:</span>
                      <span className="font-medium">{formatINR(selectedGoal.monthlyContribution)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Required Monthly:</span>
                      <span className="font-medium">{formatINR(calculateRequiredMonthlyContribution(selectedGoal))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Months Remaining:</span>
                      <span className="font-medium">{calculateMonthsRemaining(selectedGoal.targetDate)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <div className="text-sm text-muted-foreground">
                    {selectedGoal.status === 'Behind' && (
                      <p>Consider increasing your monthly contribution to stay on track.</p>
                    )}
                    {selectedGoal.status === 'Ahead' && (
                      <p>Great job! You're ahead of schedule. Consider adjusting your contribution.</p>
                    )}
                    {selectedGoal.status === 'On Track' && (
                      <p>You're on track to meet your goal. Keep up the good work!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
