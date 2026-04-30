"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useState, useEffect } from "react"

interface Transaction {
    id: string
    date: string
    type: string
    asset: string
    quantity: number
    price: number
    amount: number
    status: string
    category: string
    notes?: string
}

interface EditTransactionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transaction: Transaction | null
    onSave: (updated: Transaction, original: Transaction) => void
}

export function EditTransactionModal({ open, onOpenChange, transaction, onSave }: EditTransactionModalProps) {
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

    useEffect(() => {
        if (transaction) {
            setFormData({
                asset: transaction.asset || "",
                type: transaction.type || "Buy",
                quantity: String(transaction.quantity ?? ""),
                price: String(transaction.price ?? ""),
                amount: String(transaction.amount ?? ""),
                date: transaction.date ? parseISO(transaction.date) : new Date(),
                category: transaction.category || "Equity",
                notes: transaction.notes || ""
            })
        }
    }, [transaction])

    const calculateAmount = () => {
        const qty = parseFloat(formData.quantity)
        const price = parseFloat(formData.price)
        if (qty && price) {
            setFormData(prev => ({ ...prev, amount: (qty * price).toString() }))
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.asset.trim()) newErrors.asset = "Asset required"
        if (!formData.quantity || parseFloat(formData.quantity) <= 0) newErrors.quantity = "Valid quantity required"
        if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Valid price required"
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = "Valid amount required"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = () => {
        if (!validateForm() || !transaction) return
        const updated: Transaction = {
            ...transaction,
            asset: formData.asset.toUpperCase(),
            type: formData.type as any,
            quantity: parseFloat(formData.quantity),
            price: parseFloat(formData.price),
            amount: parseFloat(formData.amount),
            date: format(formData.date, "yyyy-MM-dd"),
            category: formData.category as any,
            notes: formData.notes
        }
        onSave(updated, transaction)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Save className="h-5 w-5" />
                        <span>Edit Transaction</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-asset">Asset Symbol *</Label>
                            <Input
                                id="edit-asset"
                                value={formData.asset}
                                onChange={(e) => setFormData(prev => ({ ...prev, asset: e.target.value }))}
                                className={errors.asset ? "border-red-500" : ""}
                            />
                            {errors.asset && <p className="text-sm text-red-500">{errors.asset}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Transaction Type *</Label>
                            <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                            <Label htmlFor="edit-qty">Quantity *</Label>
                            <Input id="edit-qty" type="number" value={formData.quantity}
                                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                onBlur={calculateAmount}
                                className={errors.quantity ? "border-red-500" : ""} />
                            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-price">Price per Unit *</Label>
                            <Input id="edit-price" type="number" value={formData.price}
                                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                onBlur={calculateAmount}
                                className={errors.price ? "border-red-500" : ""} />
                            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount">Total Amount *</Label>
                            <Input id="edit-amount" type="number" value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                className={errors.amount ? "border-red-500" : ""} />
                            {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                                    <Calendar mode="single" selected={formData.date}
                                        onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                                        initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-notes">Notes (Optional)</Label>
                        <Textarea id="edit-notes" rows={2}
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add any notes..." />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
