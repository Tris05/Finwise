"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Minus } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction: (transaction: any) => void
}

export function AddTransactionModal({ open, onOpenChange, onAddTransaction }: AddTransactionModalProps) {
  const [formData, setFormData] = useState({
    asset: "",
    type: "Buy",
    quantity: "",
    price: "",
    amount: "",
    date: new Date(),
    category: "Equity",
    notes: ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.asset.trim()) {
      newErrors.asset = "Asset symbol is required"
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Valid quantity is required"
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required"
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      const transaction = {
        id: Date.now().toString(),
        date: format(formData.date, "yyyy-MM-dd"),
        type: formData.type,
        asset: formData.asset.toUpperCase(),
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        amount: parseFloat(formData.amount),
        status: "Completed",
        category: formData.category,
        notes: formData.notes
      }

      onAddTransaction(transaction)
      onOpenChange(false)

      // Reset form
      setFormData({
        asset: "",
        type: "Buy",
        quantity: "",
        price: "",
        amount: "",
        date: new Date(),
        category: "Equity",
        notes: ""
      })
      setErrors({})
    }
  }

  const calculateAmount = () => {
    const quantity = parseFloat(formData.quantity)
    const price = parseFloat(formData.price)
    if (quantity && price) {
      setFormData(prev => ({ ...prev, amount: (quantity * price).toString() }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Transaction</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset">Asset Symbol *</Label>
              <Input
                id="asset"
                placeholder="e.g., RELIANCE, BTC, GOLD"
                value={formData.asset}
                onChange={(e) => setFormData(prev => ({ ...prev, asset: e.target.value }))}
                className={errors.asset ? "border-red-500" : ""}
              />
              {errors.asset && <p className="text-sm text-red-500">{errors.asset}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buy">Buy</SelectItem>
                  <SelectItem value="Sell">Sell</SelectItem>
                  <SelectItem value="Dividend">Dividend</SelectItem>
                  <SelectItem value="Interest">Interest</SelectItem>
                  <SelectItem value="Bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="150"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                onBlur={calculateAmount}
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Unit *</Label>
              <Input
                id="price"
                type="number"
                placeholder="2450.50"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                onBlur={calculateAmount}
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="367575"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
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
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Debt">Debt</SelectItem>
                  <SelectItem value="Commodity">Commodity</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transaction Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this transaction..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
