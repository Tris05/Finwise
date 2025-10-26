"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
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
  Filter,
  Search,
  BarChart3,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCardComparison } from "./credit-card-comparison"
import creditCardsData from "@/data/credit-cards-detailed.json"
import { useMutation } from "@tanstack/react-query"

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

interface AIRecommendation {
  cardId: string
  cardName: string
  reasoning: string
  expectedMonthlyRewards: string
  roi: string
  keyBenefits: string[]
  matchScore: number
}

interface AIAnalysis {
  totalMonthlySpend: string
  potentialMonthlyRewards: string
  annualSavings: string
}

interface AIRecommendationsResponse {
  recommendations: AIRecommendation[]
  analysis: AIAnalysis
  warnings: string[]
}

interface UserProfile {
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
  goals: string[]
  preferences: string[]
  experience: string
}

export function CreditCardRecommendations() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [filteredCards, setFilteredCards] = useState<CreditCard[]>([])
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile>({
    monthlyIncome: 50000,
    monthlySpending: 30000,
    spendingCategories: {
      dining: 20,
      travel: 15,
      shopping: 25,
      fuel: 10,
      groceries: 20,
      entertainment: 10
    },
    goals: [],
    preferences: [],
    experience: "beginner"
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendationsResponse | null>(null)
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)

  // AI Recommendation mutation
  const aiRecommendationMutation = useMutation({
    mutationFn: async (data: { userProfile: any, spendingPatterns: any, preferences: any }): Promise<AIRecommendationsResponse> => {
      const res = await fetch("/api/credit-cards/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error("AI Recommendations API error:", errorData)
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to fetch AI recommendations`)
      }

      return res.json()
    },
    onSuccess: (data) => {
      console.log("AI Recommendations received:", data)
      console.log("Recommendations data:", data.recommendations)
      console.log("Analysis data:", data.recommendations?.analysis)
      setAiRecommendations(data.recommendations || data)
      setShowAIRecommendations(true)
    },
    onError: (error) => {
      console.error("AI Recommendation error:", error)
      // Show error state
      setAiRecommendations({
        recommendations: [],
        analysis: {
          totalMonthlySpend: "₹0",
          potentialMonthlyRewards: "₹0",
          annualSavings: "₹0"
        },
        warnings: ["Failed to get AI recommendations. Please try again."]
      })
      setShowAIRecommendations(true)
    }
  })

  // Load credit card data
  useEffect(() => {
    // Use imported data directly
    setCreditCards(creditCardsData.creditCards)
    setFilteredCards(creditCardsData.creditCards)
  }, [])

  // Filter and sort cards
  useEffect(() => {
    let filtered = creditCards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === "all" || card.category === filterCategory
      return matchesSearch && matchesCategory
    })

    // Sort cards
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "annualFee":
          return a.annualFee - b.annualFee
        case "rewardsRate":
          return parseFloat(b.rewardsRate) - parseFloat(a.rewardsRate)
        case "popularity":
          const popularityOrder = { "Very High": 4, "High": 3, "Medium": 2, "Low": 1 }
          return popularityOrder[b.popularity as keyof typeof popularityOrder] - 
                 popularityOrder[a.popularity as keyof typeof popularityOrder]
        default:
          return 0
      }
    })

    setFilteredCards(filtered)
  }, [creditCards, searchTerm, filterCategory, sortBy])

  const handleCardSelect = (cardId: string) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    )
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

  const getCategoryColor = (category: string) => {
    const colors = {
      "Premium": "bg-purple-100 text-purple-800",
      "E-commerce": "bg-blue-100 text-blue-800",
      "Online Shopping": "bg-blue-100 text-blue-800",
      "Rewards": "bg-green-100 text-green-800",
      "Travel": "bg-orange-100 text-orange-800",
      "Fuel": "bg-yellow-100 text-yellow-800",
      "Dining": "bg-red-100 text-red-800"
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
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

  const getAIRecommendations = () => {
    const spendingPatterns = {
      dining: userProfile.spendingCategories.dining,
      travel: userProfile.spendingCategories.travel,
      shopping: userProfile.spendingCategories.shopping,
      fuel: userProfile.spendingCategories.fuel,
      groceries: userProfile.spendingCategories.groceries,
      entertainment: userProfile.spendingCategories.entertainment,
      onlineShopping: userProfile.spendingCategories.onlineShopping
    }

    const preferences = {
      primaryGoal: userProfile.goals[0] || "General rewards",
      preferredBenefits: userProfile.preferences.join(", "),
      annualFeePreference: userProfile.annualFeePreference,
      travelFrequency: userProfile.travelFrequency
    }

    aiRecommendationMutation.mutate({
      userProfile,
      spendingPatterns,
      preferences
    })
  }

  return (
    <div className="space-y-6">
      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Personalize Your Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Income</label>
              <Input
                type="number"
                value={userProfile.monthlyIncome}
                onChange={(e) => setUserProfile(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Spending</label>
              <Input
                type="number"
                value={userProfile.monthlySpending}
                onChange={(e) => setUserProfile(prev => ({ ...prev, monthlySpending: Number(e.target.value) }))}
                placeholder="30000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Experience Level</label>
              <Select
                value={userProfile.experience}
                onValueChange={(value) => setUserProfile(prev => ({ ...prev, experience: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Goals</label>
              <Select
                value={userProfile.goals[0] || ""}
                onValueChange={(value) => setUserProfile(prev => ({ ...prev, goals: [value] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="dining">Dining</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="general">General Rewards</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get personalized credit card recommendations based on your spending patterns and preferences using AI.
            </p>
            <Button 
              onClick={getAIRecommendations}
              disabled={aiRecommendationMutation.isPending}
              className="w-full md:w-auto"
            >
              {aiRecommendationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Getting AI Recommendations...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Get AI Recommendations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations Results */}
      {showAIRecommendations && aiRecommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Analysis Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {aiRecommendations.analysis?.totalMonthlySpend || "₹0"}
                </div>
                <div className="text-sm text-muted-foreground">Monthly Spending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {aiRecommendations.analysis?.potentialMonthlyRewards || "₹0"}
                </div>
                <div className="text-sm text-muted-foreground">Monthly Rewards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {aiRecommendations.analysis?.annualSavings || "₹0"}
                </div>
                <div className="text-sm text-muted-foreground">Annual Savings</div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Top Recommendations</h3>
              {aiRecommendations.recommendations?.length > 0 ? (
                aiRecommendations.recommendations.map((rec, index) => {
                const card = creditCards.find(c => c.id === rec.cardId)
                if (!card) return null
                
                return (
                  <Card key={rec.cardId} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              #{index + 1} Recommendation
                            </Badge>
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {rec.matchScore}% Match
                            </Badge>
                          </div>
                          <h4 className="text-lg font-semibold">{rec.cardName}</h4>
                          <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm font-medium text-green-600">{rec.expectedMonthlyRewards}</div>
                          <div className="text-xs text-muted-foreground">Monthly Rewards</div>
                          <div className="text-sm font-medium text-blue-600">{rec.roi} ROI</div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h5 className="text-sm font-medium mb-2">Key Benefits:</h5>
                        <div className="flex flex-wrap gap-2">
                          {rec.keyBenefits.map((benefit, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2" />
                  <p>No AI recommendations available. Please try again.</p>
                </div>
              )}
            </div>

            {/* Warnings */}
            {aiRecommendations.warnings?.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Important Considerations</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {aiRecommendations.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search credit cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
                <SelectItem value="E-commerce">E-commerce</SelectItem>
                <SelectItem value="Online Shopping">Online Shopping</SelectItem>
                <SelectItem value="Rewards">Rewards</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Fuel">Fuel</SelectItem>
                <SelectItem value="Dining">Dining</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="annualFee">Annual Fee</SelectItem>
                <SelectItem value="rewardsRate">Rewards Rate</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Credit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredCards.map((card) => {
            const CategoryIcon = getCategoryIcon(card.category)
            const isSelected = selectedCards.includes(card.id)
            
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="h-5 w-5 text-blue-600" />
                        <Badge variant="outline" className={getCategoryColor(card.category)}>
                          {card.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{card.rating}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{card.issuer}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Key Features */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Key Features</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Annual Fee:</span>
                          <div className="font-medium">{formatINR(card.annualFee)}</div>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Rewards:</span>
                          <div className="font-medium">{card.rewardsRate}</div>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Credit Limit:</span>
                          <div className="font-medium">{card.creditLimit}</div>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Popularity:</span>
                          <div className="font-medium">{card.popularity}</div>
                        </div>
                      </div>
                    </div>

                    {/* Rewards Breakdown */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Rewards</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(card.rewards).map(([category, rate]) => {
                          const RewardIcon = getRewardIcon(category)
                          return (
                            <div key={category} className="flex items-center gap-1 text-xs">
                              <RewardIcon className="h-3 w-3" />
                              <span className="capitalize">{category}:</span>
                              <span className="font-medium">{rate}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Best For */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Best For</h4>
                      <div className="flex flex-wrap gap-1">
                        {card.bestFor.slice(0, 3).map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCardSelect(card.id)}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Info className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Comparison Section */}
      {selectedCards.length > 0 && (
        <CreditCardComparison 
          selectedCards={selectedCards.map(cardId => creditCards.find(c => c.id === cardId)).filter(Boolean) as CreditCard[]}
          userProfile={userProfile}
        />
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Complete your profile to get personalized credit card recommendations</p>
            <Button className="mt-4">Get Recommendations</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
