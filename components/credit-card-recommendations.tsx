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
  Info,
  Calculator,
  PieChart
} from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCardComparison } from "./credit-card-comparison"
import creditCardsData from "@/data/credit-cards-detailed.json"
import { processCSVFiles, ParsedCreditCard } from "@/lib/csv-parser"

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
  cibilScore: {
    min: number
    max?: number
    description: string
  }
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
  keyBenefits: string[]
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

interface UserProfile {
  monthlyIncome: number
  monthlySpending: number
  cibilScore: number
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
    cibilScore: 750,
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

  // Load credit card data
  useEffect(() => {
    const loadCreditCards = async () => {
      try {
        console.log('Loading credit cards...')
        // Load CSV data first
        const csvCards = await processCSVFiles()
        console.log('CSV Cards loaded:', csvCards.length)
        
        // Convert CSV cards to match interface
        const convertedCards: CreditCard[] = csvCards.map(card => ({
          ...card,
          // Ensure all required fields are present
          features: card.features || [],
          benefits: card.benefits || [],
          keyBenefits: card.keyBenefits || [],
          pros: card.pros || [],
          cons: card.cons || [],
          bestFor: card.bestFor || [],
          notFor: card.notFor || [],
          cibilScore: card.cibilScore || { min: 700, description: '700+' }
        }))
        
        console.log('Converted cards:', convertedCards.length)
        console.log('Sample converted card:', convertedCards[0])
        
        // Fallback to JSON data if CSV loading fails
        const fallbackCards = csvCards.length === 0 ? creditCardsData.creditCards : []
        
        const allCards = [...convertedCards, ...fallbackCards]
        console.log('Total cards to set:', allCards.length)
        setCreditCards(allCards)
        setFilteredCards(allCards)
      } catch (error) {
        console.error('Error loading credit cards:', error)
        // Fallback to JSON data
    setCreditCards(creditCardsData.creditCards)
    setFilteredCards(creditCardsData.creditCards)
      }
    }
    
    loadCreditCards()
  }, [])

  // Filter and sort cards
  useEffect(() => {
    let filtered = creditCards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (card.keyBenefits || []).some(benefit => 
                             benefit.toLowerCase().includes(searchTerm.toLowerCase())
                           )
      
      const matchesCibilScore = !card.cibilScore || userProfile.cibilScore >= card.cibilScore.min
      
      // Handle advanced filters
      let matchesFilter = true
      if (filterCategory === "free") {
        matchesFilter = card.annualFee === 0
      } else if (filterCategory === "low-fee") {
        matchesFilter = card.annualFee > 0 && card.annualFee < 1000
      } else if (filterCategory === "no-cibil") {
        matchesFilter = !card.cibilScore || card.cibilScore.min === 0
      } else if (filterCategory === "low-cibil") {
        matchesFilter = card.cibilScore && card.cibilScore.min >= 600 && card.cibilScore.min < 750
      } else if (filterCategory === "high-cibil") {
        matchesFilter = card.cibilScore && card.cibilScore.min >= 750
      } else if (filterCategory !== "all") {
        matchesFilter = card.category === filterCategory
      }
      
      return matchesSearch && matchesCibilScore && matchesFilter
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
        case "cibilScore":
          const aScore = a.cibilScore?.min || 999
          const bScore = b.cibilScore?.min || 999
          return aScore - bScore
        default:
          return 0
      }
    })

    setFilteredCards(filtered)
  }, [creditCards, searchTerm, filterCategory, sortBy, userProfile.cibilScore])

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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Find The Right Card</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Explore a curated selection of credit cards tailored to your needs. Compare benefits, rewards, and offers to find the perfect card for your lifestyle.
        </p>
      </div>

      {/* User Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Personalize Your Experience
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tell us about yourself to get personalized recommendations
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="text-sm font-medium">CIBIL Score</label>
              <Input
                type="number"
                value={userProfile.cibilScore}
                onChange={(e) => setUserProfile(prev => ({ ...prev, cibilScore: Number(e.target.value) }))}
                placeholder="750"
                min="300"
                max="900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Goal</label>
              <Select
                value={userProfile.goals[0] || ""}
                onValueChange={(value) => setUserProfile(prev => ({ ...prev, goals: [value] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                  <SelectItem value="dining">Dining & Entertainment</SelectItem>
                  <SelectItem value="shopping">Online Shopping</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="general">General Rewards</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{creditCards.length}</div>
              <div className="text-sm text-muted-foreground">Total Cards</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {creditCards.filter(card => !card.cibilScore || userProfile.cibilScore >= card.cibilScore.min).length}
              </div>
              <div className="text-sm text-muted-foreground">Eligible Cards</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatINR(Math.round(creditCards.reduce((sum, card) => sum + card.annualFee, 0) / creditCards.length))}
              </div>
              <div className="text-sm text-muted-foreground">Avg Annual Fee</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {creditCards.filter(card => card.annualFee === 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Free Cards</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </div>
            <Button variant="outline" size="sm" onClick={() => setFilterCategory("all")}>
              Clear All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Card Type Filters */}
            <div>
              <h4 className="font-medium mb-3">Card Type</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={filterCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory("all")}
                >
                  All Cards
                </Button>
                <Button 
                  variant={filterCategory === "Travel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory("Travel")}
                >
                  Travel
                </Button>
                <Button 
                  variant={filterCategory === "Cashback" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory("Cashback")}
                >
                  Cashback
                </Button>
                <Button 
                  variant={filterCategory === "Premium" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory("Premium")}
                >
                  Premium
                </Button>
                <Button 
                  variant={filterCategory === "Secured" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory("Secured")}
                >
                  Secured
                </Button>
                <Button 
                  variant={filterCategory === "free" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategory("free")}
                >
                  Lifetime Free
                </Button>
              </div>
            </div>

            {/* Bank Filters */}
            <div>
              <h4 className="font-medium mb-3">Banks</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(creditCards.map(card => card.issuer))).slice(0, 6).map(bank => (
                  <Button 
                    key={bank}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Filter by bank logic would go here
                    }}
                  >
                    {bank}
                  </Button>
                ))}
                <Button variant="outline" size="sm">
                  View More
                </Button>
              </div>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for credit cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">RPC Rating</SelectItem>
                  <SelectItem value="annualFee">Annual Fee</SelectItem>
                  <SelectItem value="rewardsRate">Rewards Rate</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {filteredCards.length} Cards
            {filterCategory !== "all" && ` • ${filterCategory}`}
          </h2>
          <p className="text-muted-foreground">Curated For You</p>
        </div>
      </div>

      {/* Credit Cards Grid */}
      <div className="space-y-6">
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
                <Card className={`transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Side - Card Info */}
                      <div className="flex-1 space-y-4">
                        {/* Card Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getCategoryColor(card.category)}>
                                {card.category}
                              </Badge>
                              {card.annualFee === 0 && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  LIFETIME FREE
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-xl font-bold">{card.name}</h3>
                            <p className="text-sm text-muted-foreground">{card.issuer}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-600">{card.rating}</div>
                            <div className="text-sm text-muted-foreground">out of 5</div>
                            <div className="text-xs text-muted-foreground">RPC Rating</div>
                          </div>
                        </div>

                        {/* Best For */}
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Best for</h4>
                          <p className="text-sm">
                            {card.bestFor.length > 0 
                              ? card.bestFor[0] 
                              : `Frequent ${card.category.toLowerCase()} users seeking ${card.category.toLowerCase()} benefits`
                            }
                          </p>
                        </div>

                        {/* Key Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Annual Fee</h4>
                            <p className="text-sm font-medium">
                              {card.annualFee === 0 ? '₹0 (Lifetime Free)' : `${formatINR(card.annualFee)} + GST`}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">Joining Benefit</h4>
                            <p className="text-sm font-medium">
                              {card.joiningFee === 0 ? 'No joining fee' : `${formatINR(card.joiningFee)} joining fee`}
                            </p>
                          </div>
                        </div>

                        {/* Key Hack */}
                        <div className="bg-muted p-3 rounded-lg">
                          <h4 className="font-medium text-sm mb-1">1 Hack</h4>
                          <p className="text-sm">
                            {card.keyBenefits.length > 0 
                              ? card.keyBenefits[0]
                              : `${card.rewardsRate} rewards on all purchases`
                            }
                          </p>
                        </div>
                      </div>

                      {/* Right Side - Actions */}
                      <div className="lg:w-48 space-y-4">
                        <div className="flex flex-col gap-2">
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="w-full"
                            onClick={() => handleCardSelect(card.id)}
                          >
                            {isSelected ? "Selected" : "Apply Now"}
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full">
                            Know More
                          </Button>
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CIBIL Required:</span>
                            <span className="font-medium">{card.cibilScore?.description || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rewards Rate:</span>
                            <span className="font-medium">{card.rewardsRate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Credit Limit:</span>
                            <span className="font-medium">{card.creditLimit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Smart Recommendations Based on Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Smart Recommendations for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Based on CIBIL Score */}
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">Perfect Match Cards</h4>
              <div className="space-y-2">
                {creditCards
                  .filter(card => !card.cibilScore || userProfile.cibilScore >= card.cibilScore.min)
                  .sort((a, b) => b.rating - a.rating)
                  .slice(0, 3)
                  .map((card, index) => (
                    <div key={card.id} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                         onClick={() => handleCardSelect(card.id)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{card.name}</div>
                          <div className="text-xs text-muted-foreground">{card.issuer}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {card.annualFee === 0 ? 'Free' : formatINR(card.annualFee)}
                          </div>
                          <div className="text-xs text-muted-foreground">Rating: {card.rating}</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Based on Income */}
            <div className="space-y-3">
              <h4 className="font-medium text-blue-600">Income Appropriate</h4>
              <div className="space-y-2">
                {creditCards
                  .filter(card => {
                    const incomeThreshold = userProfile.monthlyIncome * 12
                    return card.eligibility.minIncome <= incomeThreshold && 
                           (!card.cibilScore || userProfile.cibilScore >= card.cibilScore.min)
                  })
                  .sort((a, b) => b.rating - a.rating)
                  .slice(0, 3)
                  .map((card, index) => (
                    <div key={card.id} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                         onClick={() => handleCardSelect(card.id)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{card.name}</div>
                          <div className="text-xs text-muted-foreground">{card.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-600">
                            {card.annualFee === 0 ? 'Free' : formatINR(card.annualFee)}
                          </div>
                          <div className="text-xs text-muted-foreground">Min: ₹{formatINR(card.eligibility.minIncome)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Best Value */}
            <div className="space-y-3">
              <h4 className="font-medium text-purple-600">Best Value</h4>
              <div className="space-y-2">
                {creditCards
                  .filter(card => !card.cibilScore || userProfile.cibilScore >= card.cibilScore.min)
                  .sort((a, b) => {
                    const aValue = a.annualFee === 0 ? 999 : (a.rating / a.annualFee) * 1000
                    const bValue = b.annualFee === 0 ? 999 : (b.rating / b.annualFee) * 1000
                    return bValue - aValue
                  })
                  .slice(0, 3)
                  .map((card, index) => (
                    <div key={card.id} className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                         onClick={() => handleCardSelect(card.id)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{card.name}</div>
                          <div className="text-xs text-muted-foreground">{card.keyBenefits[0]?.slice(0, 30)}...</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-purple-600">
                            {card.annualFee === 0 ? 'Free' : formatINR(card.annualFee)}
                          </div>
                          <div className="text-xs text-muted-foreground">Value: {card.rating}/5</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Section */}
      {selectedCards.length > 0 && (
        <CreditCardComparison 
          selectedCards={selectedCards.map(cardId => creditCards.find(c => c.id === cardId)).filter(Boolean) as CreditCard[]}
          userProfile={userProfile}
        />
      )}
    </div>
  )
}
