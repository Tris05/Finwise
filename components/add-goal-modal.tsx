"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Target, Plus } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"

interface AddGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddGoal: (goal: any) => void
}

export function AddGoalModal({ open, onOpenChange, onAddGoal }: AddGoalModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    category: "Retirement",
    priority: "Medium",
    monthlyContribution: "",
    expectedReturn: "10"
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Goal name is required"
    }
    
    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = "Valid target amount is required"
    }
    
    if (!formData.currentAmount || parseFloat(formData.currentAmount) < 0) {
      newErrors.currentAmount = "Valid current amount is required"
    }
    
    if (!formData.monthlyContribution || parseFloat(formData.monthlyContribution) <= 0) {
      newErrors.monthlyContribution = "Valid monthly contribution is required"
    }
    
    if (!formData.expectedReturn || parseFloat(formData.expectedReturn) <= 0) {
      newErrors.expectedReturn = "Valid expected return is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      const goal = {
        id: Date.now().toString(),
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        targetDate: format(formData.targetDate, "yyyy-MM-dd"),
        category: formData.category,
        priority: formData.priority,
        monthlyContribution: parseFloat(formData.monthlyContribution),
        expectedReturn: parseFloat(formData.expectedReturn),
        status: "On Track" // Will be calculated based on progress
      }
      
      onAddGoal(goal)
      onOpenChange(false)
      
      // Reset form
      setFormData({
        name: "",
        targetAmount: "",
        currentAmount: "",
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        category: "Retirement",
        priority: "Medium",
        monthlyContribution: "",
        expectedReturn: "10"
      })
      setErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Add New Investment Goal</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Retirement Fund, House Purchase, Child Education"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount *</Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder="1000000"
                value={formData.targetAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                className={errors.targetAmount ? "border-red-500" : ""}
              />
              {errors.targetAmount && <p className="text-sm text-red-500">{errors.targetAmount}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Amount *</Label>
              <Input
                id="currentAmount"
                type="number"
                placeholder="100000"
                value={formData.currentAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
                className={errors.currentAmount ? "border-red-500" : ""}
              />
              {errors.currentAmount && <p className="text-sm text-red-500">{errors.currentAmount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyContribution">Monthly Contribution *</Label>
              <Input
                id="monthlyContribution"
                type="number"
                placeholder="10000"
                value={formData.monthlyContribution}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlyContribution: e.target.value }))}
                className={errors.monthlyContribution ? "border-red-500" : ""}
              />
              {errors.monthlyContribution && <p className="text-sm text-red-500">{errors.monthlyContribution}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expectedReturn">Expected Return (%) *</Label>
              <Input
                id="expectedReturn"
                type="number"
                placeholder="10"
                value={formData.expectedReturn}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedReturn: e.target.value }))}
                className={errors.expectedReturn ? "border-red-500" : ""}
              />
              {errors.expectedReturn && <p className="text-sm text-red-500">{errors.expectedReturn}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retirement">Retirement</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
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

          <div className="space-y-2">
            <Label>Target Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.targetDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.targetDate}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, targetDate: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
