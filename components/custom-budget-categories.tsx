"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Button as UIButton } from "@/components/ui/button"
import { Plus, Trash2, Edit2, Save, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { loadUserPreferences, saveUserPreferences, getDefaultBudgetCategories } from "@/lib/user-preferences"

interface BudgetCategory {
  id: string
  name: string
  percentage: number
  description?: string
}

interface BudgetCategories {
  needs: BudgetCategory[]
  wants: BudgetCategory[]
  savings: BudgetCategory[]
}

export function CustomBudgetCategories() {
  const [categories, setCategories] = useState<BudgetCategories>(() => {
    try {
      const preferences = loadUserPreferences()
      return preferences?.budgetCategories || getDefaultBudgetCategories()
    } catch (error) {
      console.error('Error loading user preferences:', error)
      return getDefaultBudgetCategories()
    }
  })

  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState<{ type: keyof BudgetCategories | null }>({ type: null })

  const addCategory = (type: keyof BudgetCategories, category: Omit<BudgetCategory, 'id'>) => {
    const newCategory: BudgetCategory = {
      ...category,
      id: Date.now().toString()
    }
    
    const updatedCategories = {
      ...categories,
      [type]: [...(categories[type] || []), newCategory]
    }
    
    setCategories(updatedCategories)
    saveUserPreferences({ budgetCategories: updatedCategories, careerGoals: [] })
    setIsAddingCategory({ type: null })
  }

  const updateCategory = (type: keyof BudgetCategories, updatedCategory: BudgetCategory) => {
    const updatedCategories = {
      ...categories,
      [type]: (categories[type] || []).map(cat => 
        cat.id === updatedCategory.id ? updatedCategory : cat
      )
    }
    
    setCategories(updatedCategories)
    saveUserPreferences({ budgetCategories: updatedCategories, careerGoals: [] })
    setEditingCategory(null)
  }

  const deleteCategory = (type: keyof BudgetCategories, categoryId: string) => {
    const updatedCategories = {
      ...categories,
      [type]: (categories[type] || []).filter(cat => cat.id !== categoryId)
    }
    
    setCategories(updatedCategories)
    saveUserPreferences({ budgetCategories: updatedCategories, careerGoals: [] })
  }

  const getTotalPercentage = (type: keyof BudgetCategories) => {
    return categories[type]?.reduce((sum, cat) => sum + cat.percentage, 0) || 0
  }

  const getCategoryTypeColor = (type: keyof BudgetCategories) => {
    switch (type) {
      case 'needs': return 'text-red-600'
      case 'wants': return 'text-blue-600'
      case 'savings': return 'text-green-600'
    }
  }

  const getCategoryTypeBadgeVariant = (type: keyof BudgetCategories) => {
    switch (type) {
      case 'needs': return 'destructive' as const
      case 'wants': return 'default' as const
      case 'savings': return 'secondary' as const
    }
  }

  const renderCategoryCard = (type: keyof BudgetCategories, title: string) => {
    const totalPercentage = getTotalPercentage(type)
    const isOverAllocated = totalPercentage > 100

    return (
      <Card key={type}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={getCategoryTypeColor(type)}>
              {title} ({totalPercentage}%)
            </CardTitle>
            <Dialog open={isAddingCategory.type === type} onOpenChange={(open) => setIsAddingCategory({ type: open ? type : null })}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New {title} Category</DialogTitle>
                </DialogHeader>
                <CategoryForm
                  onSubmit={(category) => addCategory(type, category)}
                  onCancel={() => setIsAddingCategory({ type: null })}
                />
              </DialogContent>
            </Dialog>
          </div>
          {isOverAllocated && (
            <Badge variant="destructive" className="w-fit">
              Over-allocated by {totalPercentage - 100}%
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {(categories[type] || []).map((category) => (
            <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{category.name}</span>
                  <Badge variant={getCategoryTypeBadgeVariant(type)}>
                    {category.percentage}%
                  </Badge>
                </div>
                {category.description && (
                  <div className="text-sm text-muted-foreground">{category.description}</div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingCategory(category)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteCategory(type, category.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customize Your Budget Categories</CardTitle>
          <p className="text-sm text-muted-foreground">
            Personalize your budget by adding, editing, or removing categories for needs, wants, and savings.
            Each category should represent a percentage of your total budget allocation.
          </p>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {renderCategoryCard('needs', 'Needs')}
        {renderCategoryCard('wants', 'Wants')}
        {renderCategoryCard('savings', 'Savings')}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              initialData={editingCategory}
              onSubmit={(updatedCategory) => {
                const type = Object.keys(categories).find(key => 
                  (categories[key as keyof BudgetCategories] || []).some(cat => cat.id === editingCategory.id)
                ) as keyof BudgetCategories
                updateCategory(type, updatedCategory)
              }}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CategoryFormProps {
  initialData?: BudgetCategory
  onSubmit: (category: BudgetCategory) => void
  onCancel: () => void
}

function CategoryForm({ initialData, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [percentage, setPercentage] = useState(initialData?.percentage || 0)
  const [description, setDescription] = useState(initialData?.description || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && percentage > 0) {
      onSubmit({
        id: initialData?.id || Date.now().toString(),
        name,
        percentage,
        description
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category-name">Category Name</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Gym Membership"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category-percentage">Percentage (%)</Label>
        <Input
          id="category-percentage"
          type="number"
          value={percentage}
          onChange={(e) => setPercentage(Number(e.target.value))}
          placeholder="e.g., 15"
          min="0"
          max="100"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="category-description">Description (Optional)</Label>
        <Input
          id="category-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Monthly gym and fitness expenses"
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {initialData ? 'Update' : 'Add'} Category
        </Button>
      </div>
    </form>
  )
}
