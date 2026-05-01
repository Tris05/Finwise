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
import { useEffect, useMemo, useState } from "react"

export type GoalOption = { id: string; name: string }

interface AddTransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTransaction: (transaction: any) => void
  goals?: GoalOption[]
  initialAsset?: {
    symbol?: string
    category?: string
    currentPrice?: number
    currency?: string
  } | null
}

export function AddTransactionModal({ open, onOpenChange, onAddTransaction, goals = [], initialAsset = null }: AddTransactionModalProps) {
  const [formData, setFormData] = useState({
    asset: "",
    type: "Buy",
    quantity: "",
    price: "",
    amount: "",
    date: new Date(),
    category: "Equity",
    notes: "",
    goalId: "none" as string,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isFetchingPrice, setIsFetchingPrice] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [liveCurrency, setLiveCurrency] = useState<string>("INR")
  const isAssetLocked = Boolean(initialAsset?.symbol)

  const supportsLivePrice = useMemo(
    () => ["Equity", "Crypto", "Commodity"].includes(formData.category),
    [formData.category]
  )

  const recalculateAmount = (quantityRaw: string, priceRaw: string) => {
    const quantity = parseFloat(quantityRaw)
    const price = parseFloat(priceRaw)
    if (!Number.isNaN(quantity) && quantity > 0 && !Number.isNaN(price) && price > 0) {
      setFormData((prev) => ({ ...prev, amount: (quantity * price).toString() }))
    } else {
      setFormData((prev) => ({ ...prev, amount: "" }))
    }
  }

  const fetchLivePrice = async (asset: string, category: string) => {
    const symbol = asset.trim().toUpperCase()
    if (!symbol || !["Equity", "Crypto", "Commodity"].includes(category)) {
      return
    }

    setIsFetchingPrice(true)
    setPriceError(null)
    try {
      const response = await fetch("/api/market-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_stock",
          symbol,
          type: category.toLowerCase(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Could not fetch live price (${response.status})`)
      }

      const result = await response.json()
      if (!result.success || !result.data?.currentPrice) {
        throw new Error(result.error || "No live price found")
      }

      const livePrice = String(result.data.currentPrice)
      setLiveCurrency(result.data.currency || "USD")
      setFormData((prev) => {
        const next = { ...prev, price: livePrice }
        const quantity = parseFloat(prev.quantity)
        if (!Number.isNaN(quantity) && quantity > 0) {
          next.amount = String(quantity * Number(livePrice))
        }
        return next
      })
    } catch (error) {
      console.error("Error fetching live price:", error)
      setPriceError("Live price unavailable. Try a valid symbol.")
      setFormData((prev) => ({ ...prev, price: "", amount: "" }))
    } finally {
      setIsFetchingPrice(false)
    }
  }

  useEffect(() => {
    if (!open) return
    if (!initialAsset?.symbol) return

    setLiveCurrency(initialAsset.currency || "INR")
    setFormData((prev) => ({
      ...prev,
      asset: initialAsset.symbol || prev.asset,
      category: initialAsset.category || prev.category,
      price: initialAsset.currentPrice ? String(initialAsset.currentPrice) : prev.price,
    }))
  }, [open, initialAsset])

  useEffect(() => {
    if (!open) return
    if (!supportsLivePrice) {
      setPriceError(null)
      return
    }
    if (!formData.asset.trim()) return

    const timeout = setTimeout(() => {
      void fetchLivePrice(formData.asset, formData.category)
    }, 300)

    return () => clearTimeout(timeout)
  }, [open, formData.asset, formData.category, supportsLivePrice])

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
        date: format(formData.date, "yyyy-MM-dd"),
        type: formData.type,
        asset: formData.asset.toUpperCase(),
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        amount: parseFloat(formData.amount),
        currency: liveCurrency,
        status: "Completed",
        category: formData.category,
        notes: formData.notes,
        ...(formData.goalId && formData.goalId !== "none" ? { goalId: formData.goalId } : {}),
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
        notes: "",
        goalId: "none",
      })
      setErrors({})
      setPriceError(null)
      setLiveCurrency("INR")
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
                disabled={isAssetLocked}
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
                onChange={(e) => {
                  const quantity = e.target.value
                  setFormData(prev => ({ ...prev, quantity }))
                  recalculateAmount(quantity, formData.price)
                }}
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Unit * ({liveCurrency})</Label>
              <Input
                id="price"
                type="number"
                placeholder={supportsLivePrice ? "Fetched from live market data" : "2450.50"}
                value={formData.price}
                readOnly
                className={errors.price ? "border-red-500" : ""}
              />
              {supportsLivePrice && (
                <p className="text-xs text-muted-foreground">
                  {isFetchingPrice ? "Fetching live price..." : "Live market price is used automatically."}
                </p>
              )}
              {priceError && <p className="text-xs text-red-500">{priceError}</p>}
              {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount * ({liveCurrency})</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Auto-calculated"
                value={formData.amount}
                readOnly
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))} disabled={isAssetLocked}>
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

          {goals.length > 0 && (
            <div className="space-y-2">
              <Label>Link to goal (optional)</Label>
              <Select
                value={formData.goalId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, goalId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
