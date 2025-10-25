"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Edit2, Save, X, Target, Calendar } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { loadUserPreferences, saveUserPreferences, getDefaultCareerGoals } from "@/lib/user-preferences"

interface CareerGoal {
  id: string
  title: string
  description: string
  targetSalary: number
  targetDate: string
  currentProgress: number
  skills: string[]
  milestones: CareerMilestone[]
}

interface CareerMilestone {
  id: string
  title: string
  description: string
  targetDate: string
  completed: boolean
}

export function CustomCareerGoals() {
  const [goals, setGoals] = useState<CareerGoal[]>(() => {
    const preferences = loadUserPreferences()
    return preferences?.careerGoals || getDefaultCareerGoals()
  })

  const [editingGoal, setEditingGoal] = useState<CareerGoal | null>(null)
  const [isAddingGoal, setIsAddingGoal] = useState(false)

  const addGoal = (goal: Omit<CareerGoal, 'id'>) => {
    const newGoal: CareerGoal = {
      ...goal,
      id: Date.now().toString()
    }
    const updatedGoals = [...goals, newGoal]
    setGoals(updatedGoals)
    saveUserPreferences({ budgetCategories: [], careerGoals: updatedGoals })
    setIsAddingGoal(false)
  }

  const updateGoal = (updatedGoal: CareerGoal) => {
    const updatedGoals = goals.map(goal => 
      goal.id === updatedGoal.id ? updatedGoal : goal
    )
    setGoals(updatedGoals)
    saveUserPreferences({ budgetCategories: [], careerGoals: updatedGoals })
    setEditingGoal(null)
  }

  const deleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId)
    setGoals(updatedGoals)
    saveUserPreferences({ budgetCategories: [], careerGoals: updatedGoals })
  }

  const updateMilestone = (goalId: string, milestoneId: string, completed: boolean) => {
    const updatedGoals = goals.map(goal => 
      goal.id === goalId 
        ? {
            ...goal,
            milestones: goal.milestones.map(milestone =>
              milestone.id === milestoneId 
                ? { ...milestone, completed }
                : milestone
            )
          }
        : goal
    )
    setGoals(updatedGoals)
    saveUserPreferences({ budgetCategories: [], careerGoals: updatedGoals })
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600"
    if (progress >= 60) return "text-blue-600"
    if (progress >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressVariant = (progress: number) => {
    if (progress >= 80) return "default" as const
    if (progress >= 60) return "secondary" as const
    if (progress >= 40) return "outline" as const
    return "destructive" as const
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Your Career Goals</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Define and track your personal career milestones and salary targets
              </p>
            </div>
            <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Career Goal</DialogTitle>
                </DialogHeader>
                <GoalForm
                  onSubmit={addGoal}
                  onCancel={() => setIsAddingGoal(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {goals.map((goal) => (
          <Card key={goal.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{goal.title}</span>
                    <Badge variant={getProgressVariant(goal.currentProgress)}>
                      {goal.currentProgress}%
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Target: ₹{goal.targetSalary.toLocaleString()} by {new Date(goal.targetDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingGoal(goal)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className={getProgressColor(goal.currentProgress)}>
                    {goal.currentProgress}%
                  </span>
                </div>
                <Progress value={goal.currentProgress} className="h-2" />
              </div>

              {goal.skills.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Required Skills</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {goal.skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Milestones</Label>
                <div className="space-y-2 mt-2">
                  {goal.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={milestone.completed}
                        onChange={(e) => updateMilestone(goal.id, milestone.id, e.target.checked)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{milestone.title}</span>
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(milestone.targetDate).toLocaleDateString()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Career Goal</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <GoalForm
              initialData={editingGoal}
              onSubmit={updateGoal}
              onCancel={() => setEditingGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface GoalFormProps {
  initialData?: CareerGoal
  onSubmit: (goal: CareerGoal) => void
  onCancel: () => void
}

function GoalForm({ initialData, onSubmit, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [targetSalary, setTargetSalary] = useState(initialData?.targetSalary || 0)
  const [targetDate, setTargetDate] = useState(initialData?.targetDate || '')
  const [currentProgress, setCurrentProgress] = useState(initialData?.currentProgress || 0)
  const [skills, setSkills] = useState(initialData?.skills || [])
  const [newSkill, setNewSkill] = useState('')
  const [milestones, setMilestones] = useState<CareerMilestone[]>(initialData?.milestones || [])

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove))
  }

  const addMilestone = () => {
    const newMilestone: CareerMilestone = {
      id: Date.now().toString(),
      title: '',
      description: '',
      targetDate: '',
      completed: false
    }
    setMilestones(prev => [...prev, newMilestone])
  }

  const updateMilestone = (milestoneId: string, updates: Partial<CareerMilestone>) => {
    setMilestones(prev => prev.map(milestone =>
      milestone.id === milestoneId ? { ...milestone, ...updates } : milestone
    ))
  }

  const removeMilestone = (milestoneId: string) => {
    setMilestones(prev => prev.filter(milestone => milestone.id !== milestoneId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title && targetSalary > 0 && targetDate) {
      onSubmit({
        id: initialData?.id || Date.now().toString(),
        title,
        description,
        targetSalary,
        targetDate,
        currentProgress,
        skills,
        milestones: milestones.filter(m => m.title && m.targetDate)
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="goal-title">Goal Title *</Label>
          <Input
            id="goal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="target-salary">Target Salary (₹) *</Label>
          <Input
            id="target-salary"
            type="number"
            value={targetSalary}
            onChange={(e) => setTargetSalary(Number(e.target.value))}
            placeholder="1800000"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target-date">Target Date *</Label>
          <Input
            id="target-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="current-progress">Current Progress (%)</Label>
          <Input
            id="current-progress"
            type="number"
            value={currentProgress}
            onChange={(e) => setCurrentProgress(Number(e.target.value))}
            min="0"
            max="100"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-description">Description</Label>
        <Textarea
          id="goal-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your career goal and what it means to you..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Required Skills</Label>
        <div className="flex space-x-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          />
          <Button type="button" onClick={addSkill} variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {skills.map((skill, index) => (
            <Badge key={index} variant="secondary" className="flex items-center space-x-1">
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Milestones</Label>
          <Button type="button" onClick={addMilestone} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </div>
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 border rounded-lg">
              <Input
                value={milestone.title}
                onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                placeholder="Milestone title"
              />
              <Input
                type="date"
                value={milestone.targetDate}
                onChange={(e) => updateMilestone(milestone.id, { targetDate: e.target.value })}
              />
              <Input
                value={milestone.description}
                onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                placeholder="Description"
                className="col-span-2"
              />
              <Button
                type="button"
                onClick={() => removeMilestone(milestone.id)}
                variant="ghost"
                size="sm"
                className="col-span-2 w-fit"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {initialData ? 'Update' : 'Add'} Goal
        </Button>
      </div>
    </form>
  )
}
