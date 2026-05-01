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
import { useUserProfile } from "@/hooks/useUserProfile"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCardComparison } from "./credit-card-comparison"
import creditCardsData from "@/data/credit-cards-detailed.json"
import { processCSVFiles, ParsedCreditCard } from "@/lib/csv-parser"
import { db, auth } from "@/lib/firebase"
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { toast } from "sonner"

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
  const { annualIncome } = useUserProfile()
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [filteredCards, setFilteredCards] = useState<CreditCard[]>([])
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile>({
    monthlyIncome: annualIncome ? annualIncome / 12 : 50000,
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
  const [userId, setUserId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

  // Update monthly income when annual income changes from database
  useEffect(() => {
    if (annualIncome) {
      setUserProfile(prev => ({
        ...prev,
        monthlyIncome: annualIncome / 12
      }))
    }
  }, [annualIncome])
  const [filterBank, setFilterBank] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [loading, setLoading] = useState(true)

  // Auth and Firestore Listeners
  useEffect(() => {
    let unsubs: (() => void)[] = []

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubs.forEach(unsub => unsub())
      unsubs = []

      if (user) {
        setUserId(user.uid)

        // 1. Sync User Profile from latest completed portfolio_request or a dedicated doc
        // For now, let's check for a 'financial_profile' document first
        const profileRef = doc(db, "users", user.uid, "financial_profile", "current")
        unsubs.push(onSnapshot(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile
            setUserProfile(prev => ({
              ...prev,
              ...data
            }))
          }
        }))

        // 2. Sync Saved/Selected Cards
        const savedCardsRef = collection(db, "users", user.uid, "saved_cards")
        unsubs.push(onSnapshot(savedCardsRef, (snapshot) => {
          const savedIds = snapshot.docs.map(doc => doc.id)
          setSelectedCards(savedIds)
        }))
      } else {
        setUserId(null)
      }
    })

    return () => {
      unsubscribeAuth()
      unsubs.forEach(unsub => unsub())
    }
  }, [])

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
        const fallbackCards: CreditCard[] = csvCards.length === 0
          ? (creditCardsData.creditCards as any[]).map(card => ({
            ...card,
            features: card.features || [],
            benefits: card.benefits || [],
            keyBenefits: card.keyBenefits || [],
            pros: card.pros || [],
            cons: card.cons || [],
            bestFor: card.bestFor || [],
            notFor: card.notFor || [],
            cibilScore: card.cibilScore || { min: 700, description: '700+' }
          }))
          : []

        const allCards = [...convertedCards, ...fallbackCards]
        console.log('Total cards to set:', allCards.length)
        setCreditCards(allCards)
        setFilteredCards(allCards)
      } catch (error) {
        console.error('Error loading credit cards:', error)
        // Fallback to JSON data
        const fallback = (creditCardsData.creditCards as any[]).map(card => ({
          ...card,
          features: card.features || [],
          benefits: card.benefits || [],
          keyBenefits: card.keyBenefits || [],
          pros: card.pros || [],
          cons: card.cons || [],
          bestFor: card.bestFor || [],
          notFor: card.notFor || [],
          cibilScore: card.cibilScore || { min: 700, description: '700+' }
        }))
        setCreditCards(fallback)
        setFilteredCards(fallback)
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
      const matchesIncome = !card.eligibility?.minIncome || (userProfile.monthlyIncome * 12) >= card.eligibility.minIncome

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

      let matchesBank = true
      if (filterBank !== "all") {
        matchesBank = card.issuer === filterBank
      }

      return matchesSearch && matchesCibilScore && matchesIncome && matchesFilter && matchesBank
    })

    // Sort cards
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "annualFee":
          return a.annualFee - b.annualFee
        case "rewardsRate":
          const parseRate = (rate: string) => {
            const matches = rate.match(/(\d+(\.\d+)?)/)
            return matches ? parseFloat(matches[0]) : 0
          }
          return parseRate(b.rewardsRate) - parseRate(a.rewardsRate)
        case "savings":
          return getEstimatedSavings(b) - getEstimatedSavings(a)
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
  }, [creditCards, searchTerm, filterCategory, filterBank, sortBy, userProfile.cibilScore, userProfile.monthlyIncome, userProfile.monthlySpending])

  const handleCardSelect = async (cardId: string) => {
    if (!userId) {
      toast.error("Please login to save cards")
      return
    }

    const isSelected = selectedCards.includes(cardId)
    const cardDocRef = doc(db, "users", userId, "saved_cards", cardId)

    try {
      if (isSelected) {
        await deleteDoc(cardDocRef)
        toast.success("Card removed from selection")
      } else {
        const cardData = creditCards.find(c => c.id === cardId)
        await setDoc(cardDocRef, {
          addedAt: serverTimestamp(),
          name: cardData?.name,
          issuer: cardData?.issuer
        })
        toast.success("Card saved for comparison")
      }
    } catch (error) {
      console.error("Error updating saved cards:", error)
      toast.error("Failed to update selection")
    }
  }

  const handleProfileUpdate = async (field: keyof UserProfile, value: any) => {
    const updatedProfile = { ...userProfile, [field]: value }
    setUserProfile(updatedProfile)

    if (userId) {
      try {
        const profileRef = doc(db, "users", userId, "financial_profile", "current")
        await setDoc(profileRef, updatedProfile, { merge: true })
      } catch (error) {
        console.error("Error saving profile:", error)
      }
    }
  }

  const getEstimatedSavings = (card: CreditCard) => {
    const parseRate = (rate: string) => {
      if (!rate) return 0
      const matches = rate.match(/(\d+(\.\d+)?)/)
      return matches ? parseFloat(matches[0]) : 1 // Assume at least 1% if mentioned but not parsed
    }

    const rewards = card.rewards || { dining: "0", travel: "0", shopping: "0", fuel: "0", groceries: "0", entertainment: "0" }

    const annualRewards = (
      (userProfile.monthlySpending * (userProfile.spendingCategories.dining / 100) * parseRate(rewards.dining)) +
      (userProfile.monthlySpending * (userProfile.spendingCategories.travel / 100) * parseRate(rewards.travel)) +
      (userProfile.monthlySpending * (userProfile.spendingCategories.shopping / 100) * parseRate(rewards.shopping)) +
      (userProfile.monthlySpending * (userProfile.spendingCategories.fuel / 100) * parseRate(rewards.fuel)) +
      (userProfile.monthlySpending * (userProfile.spendingCategories.groceries / 100) * parseRate(rewards.groceries)) +
      (userProfile.monthlySpending * (userProfile.spendingCategories.entertainment / 100) * parseRate(rewards.entertainment))
    ) * 12 / 100

    return annualRewards - card.annualFee
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Income</label>
              <Input
                type="number"
                value={userProfile.monthlyIncome}
                onChange={(e) => handleProfileUpdate('monthlyIncome', Number(e.target.value))}
                placeholder="50000"
                readOnly={!!annualIncome}
                className={annualIncome ? "bg-muted" : ""}
              />
              {annualIncome && (
                <p className="text-xs text-muted-foreground">
                  Fetched from your profile (₹{annualIncome.toLocaleString()}/year)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Spending</label>
              <Input
                type="number"
                value={userProfile.monthlySpending}
                onChange={(e) => handleProfileUpdate('monthlySpending', Number(e.target.value))}
                placeholder="30000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CIBIL Score</label>
              <Input
                type="number"
                value={userProfile.cibilScore}
                onChange={(e) => handleProfileUpdate('cibilScore', Number(e.target.value))}
                placeholder="750"
                min="300"
                max="900"
              />
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterCategory("all")
                setFilterBank("all")
              }}
            >
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
                    variant={filterBank === bank ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterBank(prev => prev === bank ? "all" : bank)}
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
                  <SelectItem value="savings">Savings Potential</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Recommendations Moved Up */}
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
            const netSavings = getEstimatedSavings(card)

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`transition-all duration-200 hover:shadow-lg ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
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
                              {netSavings > 5000 && (
                                <Badge className="bg-blue-600 text-white animate-pulse">
                                  BEST VALUE FOR YOU
                                </Badge>
                              )}
                              {netSavings > 0 && netSavings <= 5000 && (
                                <Badge variant="outline" className="border-green-600 text-green-600">
                                  PROFITABLE ({formatINR(Math.round(netSavings))}/yr)
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
