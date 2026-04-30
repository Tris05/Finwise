"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Target, Plus, Edit, Trash2 } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useState, useMemo } from "react"
import { useFinancialGoals, FinancialGoal, goalTypeToCategory } from "@/hooks/useFinancialGoals"
import { AddGoalModal } from "@/components/add-goal-modal"
import { db } from "@/lib/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/components/providers/auth-provider"
import { useInvestments } from "@/hooks/useInvestments"

// ─── Helpers ───────────────────────────────────────────────────────────────────

function resolveCategory(goal: FinancialGoal): string {
  if (goal.category) return goal.category
  if (goal.type) return goalTypeToCategory[goal.type] ?? "Other"
  return "Other"
}

function getMonthsRemaining(targetDate: string): number {
  const diffMs = new Date(targetDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)))
}

function getRequiredMonthly(goal: FinancialGoal): number {
  const months = getMonthsRemaining(goal.targetDate)
  if (months === 0) return 0
  const remaining = (goal.targetAmount ?? 0) - (goal.currentAmount ?? 0)
  const annualReturn = goal.expectedReturn ?? 8
  const r = annualReturn / 12 / 100
  if (r === 0) return remaining / months
  return (remaining * r) / (Math.pow(1 + r, months) - 1)
}

function computeStatus(goal: FinancialGoal): "On Track" | "Behind" | "Ahead" | "Completed" {
  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
  if (pct >= 100) return "Completed"
  if (goal.monthlyContribution == null) return "On Track"
  const req = getRequiredMonthly(goal)
  if (req === 0) return "Completed"
  if (goal.monthlyContribution >= req * 1.1) return "Ahead"
  if (goal.monthlyContribution >= req * 0.9) return "On Track"
  return "Behind"
}

const priorityColor: Record<string, string> = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-green-100 text-green-800",
}
const statusColor: Record<string, string> = {
  "On Track": "bg-green-100 text-green-800",
  Behind: "bg-red-100 text-red-800",
  Ahead: "bg-blue-100 text-blue-800",
  Completed: "bg-purple-100 text-purple-800",
}
const categoryColor: Record<string, string> = {
  Retirement: "bg-blue-100 text-blue-800",
  Education: "bg-green-100 text-green-800",
  House: "bg-orange-100 text-orange-800",
  Emergency: "bg-red-100 text-red-800",
  Travel: "bg-purple-100 text-purple-800",
  Other: "bg-gray-100 text-gray-800",
}
const cls = (map: Record<string, string>, k: string) => map[k] ?? "bg-gray-100 text-gray-800"

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Self-fetching Investment Goals component.
 * Props onAddGoal / onEditGoal / onDeleteGoal are kept optional for backward compat
 * but the component now manages its own data via useFinancialGoals (Firestore).
 */
export function InvestmentGoals() {
  const { user } = useAuth()
  const { goals: rawGoals, loading, deleteGoal } = useFinancialGoals()
  const { investments } = useInvestments()
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  // ─── Automated Goal Distribution Logic ───
  // Calculate total liquid portfolio value
  const totalPortfolioValue = investments.reduce((sum, inv) => sum + (Number(inv.currentValue) || 0), 0)

  // Distribute portfolio value across goals sequentially by priority & target date urgency
  const goals = useMemo(() => {
    if (!rawGoals.length) return []
    const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 }

    const sortedGoals = [...rawGoals].sort((a, b) => {
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority]
      }
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
    })

    let remainingValue = totalPortfolioValue
    const distributedGoals = sortedGoals.map(goal => {
      const allocation = Math.min(goal.targetAmount, remainingValue)
      remainingValue = Math.max(0, remainingValue - allocation)
      return {
        ...goal,
        // Automated system takes the maximum of manual tracking or automated portfolio funneling
        currentAmount: Math.max(goal.currentAmount || 0, allocation),
        isAutomated: allocation > (goal.currentAmount || 0)
      }
    })

    return rawGoals.map(g => distributedGoals.find(dg => dg.id === g.id)!)
  }, [rawGoals, totalPortfolioValue])

  const totalTarget = goals.reduce((s, g) => s + (g.targetAmount ?? 0), 0)
  const totalCurrent = goals.reduce((s, g) => s + (g.currentAmount ?? 0), 0)
  const onTrackCount = goals.filter(g => {
    const s = computeStatus(g); return s === "On Track" || s === "Ahead"
  }).length

  const handleAddGoal = async (goal: any) => {
    if (!user) return
    const { id, ...rest } = goal
    await addDoc(collection(db, "users", user.uid, "goals"), {
      ...rest,
      created_at: serverTimestamp(),
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          ["Total Goals", goals.length, "Active goals"],
          ["Total Target", formatINR(totalTarget), "Across all goals"],
          ["Current Progress", formatINR(totalCurrent), "Invested amount"],
          ["On Track", onTrackCount, "Goals on track"],
        ].map(([label, value, sub]) => (
          <Card key={label as string}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-sm text-muted-foreground">{sub}</div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Goals list */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Investment Goals</CardTitle>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            [...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)
          ) : goals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No investment goals set. Create your first goal to get started!
            </div>
          ) : (
            goals.map((goal) => {
              const category = resolveCategory(goal)
              const status = computeStatus(goal)
              const progress = goal.targetAmount > 0
                ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0
              const required = getRequiredMonthly(goal)
              const months = getMonthsRemaining(goal.targetDate)
              const contrib = goal.monthlyContribution

              return (
                <div
                  key={goal.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedGoal(prev => prev?.id === goal.id ? null : goal)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Target className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{goal.name}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge variant="outline" className={cls(categoryColor, category)}>{category}</Badge>
                          <Badge variant="outline" className={cls(priorityColor, goal.priority)}>{goal.priority}</Badge>
                          <Badge variant="outline" className={cls(statusColor, status)}>{status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id) }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Target Amount</div>
                      <div className="font-semibold">{formatINR(goal.targetAmount ?? 0)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        Current Amount
                        {(goal as any).isAutomated && (
                          <Badge variant="outline" className="ml-2 text-[8px] h-4 px-1 uppercase bg-primary/10">Auto</Badge>
                        )}
                      </div>
                      <div className="font-semibold">{formatINR(goal.currentAmount ?? 0)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Target Date</div>
                      <div className="font-semibold">{new Date(goal.targetDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Months Remaining</div>
                      <div className="font-semibold">{months}</div>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Monthly Contribution</div>
                      <div className="font-medium">{contrib != null ? formatINR(contrib) : "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Required Monthly</div>
                      <div className="font-medium">{formatINR(required)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Expected Return</div>
                      <div className="font-medium">
                        {goal.expectedReturn != null ? `${goal.expectedReturn}% p.a.` : "8% p.a. (default)"}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Expanded detail panel */}
      {selectedGoal && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6" />
                <div>
                  <CardTitle>{selectedGoal.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <Badge variant="outline" className={cls(categoryColor, resolveCategory(selectedGoal))}>
                      {resolveCategory(selectedGoal)}
                    </Badge>
                    <Badge variant="outline" className={cls(priorityColor, selectedGoal.priority)}>
                      {selectedGoal.priority} Priority
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedGoal(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Goal Details</h4>
                  <div className="space-y-2 text-sm">
                    {([
                      ["Target Amount", formatINR(selectedGoal.targetAmount ?? 0)],
                      ["Current Amount", formatINR(selectedGoal.currentAmount ?? 0) + ((selectedGoal as any).isAutomated ? ' (Auto-Assigned)' : '')],
                      ["Target Date", new Date(selectedGoal.targetDate).toLocaleDateString()],
                      ["Expected Return",
                        selectedGoal.expectedReturn != null
                          ? `${selectedGoal.expectedReturn}% p.a.`
                          : "8% p.a. (default)"],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span>{k}:</span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Progress</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {selectedGoal.targetAmount > 0
                          ? Math.min(100, (selectedGoal.currentAmount / selectedGoal.targetAmount) * 100).toFixed(1)
                          : "0.0"}%
                      </span>
                    </div>
                    <Progress
                      value={selectedGoal.targetAmount > 0
                        ? Math.min(100, (selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)
                        : 0}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Contribution Analysis</h4>
                  <div className="space-y-2 text-sm">
                    {([
                      ["Current Monthly",
                        selectedGoal.monthlyContribution != null
                          ? formatINR(selectedGoal.monthlyContribution)
                          : "Not set"],
                      ["Required Monthly", formatINR(getRequiredMonthly(selectedGoal))],
                      ["Months Remaining", String(getMonthsRemaining(selectedGoal.targetDate))],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span>{k}:</span>
                        <span className="font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      const s = computeStatus(selectedGoal)
                      if (s === "Completed") return <p>🎉 Goal achieved! Well done.</p>
                      if (s === "Behind") return <p>Consider increasing your monthly contribution to stay on track.</p>
                      if (s === "Ahead") return <p>Great job! You're ahead of schedule. You may reduce contributions slightly.</p>
                      return <p>You're on track to meet your goal. Keep it up!</p>
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Goal Modal */}
      <AddGoalModal open={addOpen} onOpenChange={setAddOpen} onAddGoal={handleAddGoal} />
    </div>
  )
}
