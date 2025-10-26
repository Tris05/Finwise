"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Star, 
  CreditCard, 
  Gift, 
  Plane, 
  Car, 
  ShoppingBag, 
  Utensils, 
  Fuel,
  TrendingUp,
  Shield,
  Clock,
  Award,
  Zap,
  Heart,
  Target,
  CheckCircle,
  XCircle,
  Info,
  Calculator,
  PieChart,
  BarChart3
} from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useState } from "react"
import { motion } from "framer-motion"

interface CreditCard {
  id: string
  name: string
  issuer: string
  category: string
  annualFee: number
  joiningFee: number
  creditLimit: string
  interestRate: string
  rewardsRate: string
  image: string
  rating: number
  popularity: string
  targetAudience: string
  eligibility: {
    minIncome: number
    minAge: number
    maxAge: number
    employmentType: string[]
  }
  features: string[]
  rewards: {
    dining: string
    travel: string
    shopping: string
    fuel: string
    groceries: string
    entertainment: string
  }
  benefits: string[]
  fees: {
    annualFee: number
    joiningFee: number
    latePaymentFee: number
    overlimitFee: number
    cashAdvanceFee: string
    foreignTransactionFee: string
  }
  pros: string[]
  cons: string[]
  bestFor: string[]
  notFor: string[]
}

interface CreditCardComparisonProps {
  selectedCards: CreditCard[]
  userProfile: {
    monthlyIncome: number
    monthlySpending: number
    spendingCategories: {
      dining: number
      travel: number
      shopping: number
      fuel: number
      groceries: number
      entertainment: number
    }
  }
}

export function CreditCardComparison({ selectedCards, userProfile }: CreditCardComparisonProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const calculateRewardValue = (card: CreditCard) => {
    const { spendingCategories, monthlySpending } = userProfile
    let totalRewards = 0

    Object.entries(spendingCategories).forEach(([category, percentage]) => {
      const categorySpending = (monthlySpending * percentage) / 100
      const rewardRate = parseFloat(card.rewards[category as keyof typeof card.rewards].replace(/[^\d.]/g, ''))
      totalRewards += (categorySpending * rewardRate) / 100
    })

    return totalRewards
  }

  const calculateROI = (card: CreditCard) => {
    const annualRewards = calculateRewardValue(card) * 12
    const totalFees = card.annualFee + card.joiningFee
    return ((annualRewards - totalFees) / totalFees) * 100
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      "Premium": Award,
      "E-commerce": ShoppingBag,
      "Online Shopping": ShoppingBag,
      "Rewards": Gift,
      "Travel": Plane,
      "Fuel": Fuel,
      "Dining": Utensils
    }
    return icons[category as keyof typeof icons] || CreditCard
  }

  const getRewardIcon = (category: string) => {
    const icons = {
      "dining": Utensils,
      "travel": Plane,
      "shopping": ShoppingBag,
      "fuel": Fuel,
      "groceries": ShoppingBag,
      "entertainment": Heart
    }
    return icons[category as keyof typeof icons] || Gift
  }

  if (selectedCards.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Select credit cards to compare</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comparison Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Credit Card Comparison ({selectedCards.length} cards)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedCards.map((card) => {
              const CategoryIcon = getCategoryIcon(card.category)
              return (
                <Badge key={card.id} variant="outline" className="flex items-center gap-1">
                  <CategoryIcon className="h-3 w-3" />
                  {card.name}
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Feature</th>
                      {selectedCards.map(card => (
                        <th key={card.id} className="text-center p-2 min-w-48">
                          <div className="font-medium">{card.name}</div>
                          <div className="text-xs text-muted-foreground">{card.issuer}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Annual Fee</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          {formatINR(card.annualFee)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Joining Fee</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          {formatINR(card.joiningFee)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Credit Limit</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          {card.creditLimit}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Interest Rate</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          {card.interestRate}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Rating</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span>{card.rating}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Category</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          <Badge variant="outline">{card.category}</Badge>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rewards Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Category</th>
                      {selectedCards.map(card => (
                        <th key={card.id} className="text-center p-2 min-w-48">
                          <div className="font-medium">{card.name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(selectedCards[0]?.rewards || {}).map(([category, _]) => {
                      const RewardIcon = getRewardIcon(category)
                      return (
                        <tr key={category} className="border-b">
                          <td className="p-2 font-medium flex items-center gap-2">
                            <RewardIcon className="h-4 w-4" />
                            <span className="capitalize">{category}</span>
                          </td>
                          {selectedCards.map(card => (
                            <td key={card.id} className="text-center p-2">
                              {card.rewards[category as keyof typeof card.rewards]}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Fee Type</th>
                      {selectedCards.map(card => (
                        <th key={card.id} className="text-center p-2 min-w-48">
                          <div className="font-medium">{card.name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Annual Fee</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          {formatINR(card.fees.annualFee)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Joining Fee</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          {formatINR(card.fees.joiningFee)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Late Payment Fee</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          {formatINR(card.fees.latePaymentFee)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Overlimit Fee</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          {formatINR(card.fees.overlimitFee)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Cash Advance Fee</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          {card.fees.cashAdvanceFee}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Foreign Transaction Fee</td>
                      {selectedCards.map(card => (
                        <td key={card.id} className="text-center p-2">
                          {card.fees.foreignTransactionFee}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Monthly Rewards Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Monthly Rewards Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedCards.map(card => {
                    const monthlyRewards = calculateRewardValue(card)
                    return (
                      <div key={card.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">{card.name}</div>
                          <div className="text-sm text-muted-foreground">{card.issuer}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {formatINR(monthlyRewards)}
                          </div>
                          <div className="text-xs text-muted-foreground">per month</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ROI Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Return on Investment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedCards.map(card => {
                    const roi = calculateROI(card)
                    return (
                      <div key={card.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium">{card.name}</div>
                          <div className="text-sm text-muted-foreground">{card.issuer}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">annual ROI</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pros and Cons */}
          <Card>
            <CardHeader>
              <CardTitle>Pros & Cons Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCards.map(card => (
                  <div key={card.id} className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">{card.name}</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center gap-1 text-sm font-medium text-green-600 mb-1">
                            <CheckCircle className="h-4 w-4" />
                            Pros
                          </div>
                          <ul className="text-sm space-y-1">
                            {card.pros.map((pro, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-sm font-medium text-red-600 mb-1">
                            <XCircle className="h-4 w-4" />
                            Cons
                          </div>
                          <ul className="text-sm space-y-1">
                            {card.cons.map((con, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
