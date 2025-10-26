"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, TrendingDown, Minus } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"

interface RealInvestment {
  id: string
  symbol: string
  name: string
  type: 'Stock' | 'Crypto' | 'Commodity' | 'Mutual Fund' | 'Bond' | 'Real Estate'
  category: 'Equity' | 'Crypto' | 'Commodity' | 'Debt' | 'Real Estate'
  currentPrice: number
  quantity: number
  investedAmount: number
  currentValue: number
  totalGain: number
  gainPercent: number
  dayChange: number
  dayChangePercent: number
  color: string
  sector: string
  marketCap: string
  pe: number | string
  dividend: number | string
  recommendation: 'Buy' | 'Hold' | 'Sell' | 'Strong Buy' | 'Strong Sell'
  riskLevel: 'Low' | 'Medium' | 'High'
}

interface SellInvestmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  investment: RealInvestment | null
  onSellInvestment: (sellData: any) => void
}

export function SellInvestmentModal({ open, onOpenChange, investment, onSellInvestment }: SellInvestmentModalProps) {
  const [formData, setFormData] = useState({
    quantity: "",
    price: "",
    amount: "",
    date: new Date(),
    reason: "",
    notes: ""
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Valid quantity is required"
    }
    
    if (investment && parseFloat(formData.quantity) > investment.quantity) {
      newErrors.quantity = "Cannot sell more than you own"
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required"
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required"
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = "Reason for selling is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm() && investment) {
      const sellData = {
        investmentId: investment.id,
        symbol: investment.symbol,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        amount: parseFloat(formData.amount),
        date: format(formData.date, "yyyy-MM-dd"),
        reason: formData.reason,
        notes: formData.notes,
        type: "Sell"
      }
      
      onSellInvestment(sellData)
      onOpenChange(false)
      
      // Reset form
      setFormData({
        quantity: "",
        price: "",
        amount: "",
        date: new Date(),
        reason: "",
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

  const calculateGainLoss = () => {
    if (!investment || !formData.quantity || !formData.price) return 0
    
    const sellQuantity = parseFloat(formData.quantity)
    const sellPrice = parseFloat(formData.price)
    const avgCost = investment.investedAmount / investment.quantity
    const sellAmount = sellQuantity * sellPrice
    const costBasis = sellQuantity * avgCost
    
    return sellAmount - costBasis
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <span>Sell Investment</span>
          </DialogTitle>
        </DialogHeader>
        
        {investment && (
          <div className="space-y-6 py-4">
            {/* Investment Info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{investment.symbol}</h3>
                  <p className="text-sm text-muted-foreground">{investment.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Current Price</div>
                  <div className="font-semibold">₹{investment.currentPrice.toLocaleString()}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Quantity Owned</div>
                  <div className="font-medium">{investment.quantity}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Current Value</div>
                  <div className="font-medium">₹{investment.currentValue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Gain</div>
                  <div className={`font-medium ${investment.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{investment.totalGain.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity to Sell *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="10"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  onBlur={calculateAmount}
                  className={errors.quantity ? "border-red-500" : ""}
                />
                {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Sell Price per Unit *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder={investment.currentPrice.toString()}
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  onBlur={calculateAmount}
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="24500"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
              </div>
              
              <div className="space-y-2">
                <Label>Sell Date</Label>
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
              <Label htmlFor="reason">Reason for Selling *</Label>
              <Select value={formData.reason} onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}>
                <SelectTrigger className={errors.reason ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Profit Taking">Profit Taking</SelectItem>
                  <SelectItem value="Stop Loss">Stop Loss</SelectItem>
                  <SelectItem value="Portfolio Rebalancing">Portfolio Rebalancing</SelectItem>
                  <SelectItem value="Funds Needed">Funds Needed</SelectItem>
                  <SelectItem value="Change in Strategy">Change in Strategy</SelectItem>
                  <SelectItem value="Market Conditions">Market Conditions</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this sale..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Gain/Loss Preview */}
            {formData.quantity && formData.price && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h4 className="font-semibold mb-2">Transaction Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Sell Amount</div>
                    <div className="font-medium">₹{formData.amount || '0'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Gain/Loss</div>
                    <div className={`font-medium ${calculateGainLoss() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{calculateGainLoss().toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700">
            <Minus className="h-4 w-4 mr-2" />
            Sell Investment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
