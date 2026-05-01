"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil } from "lucide-react"
import { useState, useEffect } from "react"

export type HoldingForEdit = {
  id: string
  symbol: string
  name: string
  quantity: number
  investedAmount: number
  notes?: string
}

interface EditHoldingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  investment: HoldingForEdit | null
  onSave: (payload: { quantity: number; investedAmount: number; notes: string }) => void | Promise<void>
}

export function EditHoldingModal({ open, onOpenChange, investment, onSave }: EditHoldingModalProps) {
  const [quantity, setQuantity] = useState("")
  const [investedAmount, setInvestedAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (investment) {
      setQuantity(String(investment.quantity ?? ""))
      setInvestedAmount(String(investment.investedAmount ?? ""))
      setNotes(investment.notes ?? "")
      setErrors({})
    }
  }, [investment, open])

  const validate = () => {
    const next: Record<string, string> = {}
    const q = parseFloat(quantity)
    const inv = parseFloat(investedAmount)
    if (!quantity || q < 0) next.quantity = "Valid quantity required"
    if (!investedAmount || inv < 0) next.investedAmount = "Valid invested amount required"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !investment) return
    try {
      await Promise.resolve(
        onSave({
          quantity: parseFloat(quantity),
          investedAmount: parseFloat(investedAmount),
          notes: notes.trim(),
        })
      )
      onOpenChange(false)
    } catch {
      // Parent shows toast; keep dialog open
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit position
          </DialogTitle>
        </DialogHeader>
        {investment && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {investment.symbol} — {investment.name}
            </p>
            <div className="space-y-2">
              <Label htmlFor="edit-holding-qty">Quantity</Label>
              <Input
                id="edit-holding-qty"
                type="number"
                min={0}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-holding-inv">Invested amount (cost basis)</Label>
              <Input
                id="edit-holding-inv"
                type="number"
                min={0}
                step="any"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                className={errors.investedAmount ? "border-red-500" : ""}
              />
              {errors.investedAmount && <p className="text-sm text-red-500">{errors.investedAmount}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-holding-notes">Notes (optional)</Label>
              <Textarea
                id="edit-holding-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!investment}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
