"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, Star, StarOff, Plus, Search, Eye, RefreshCw } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useState, useEffect } from "react"

interface MarketAsset {
  symbol: string
  name: string
  price: number
  currency?: string
  change: number
  changePercent: number
  volume: number
  marketCap: number
  category: 'Equity' | 'Debt' | 'Commodity' | 'Crypto' | 'Real Estate'
  isWatched: boolean
  isOwned: boolean
}

interface MarketWatchlistProps {
  assets: MarketAsset[]
  onToggleWatch?: (symbol: string) => void
  onBuyAsset?: (asset: MarketAsset) => void
  onViewDetails?: (asset: MarketAsset) => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function MarketWatchlist({ 
  assets, 
  onToggleWatch, 
  onBuyAsset, 
  onViewDetails,
  onRefresh,
  isLoading = false
}: MarketWatchlistProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [showWatchedOnly, setShowWatchedOnly] = useState(false)

  const [nifty, setNifty] = useState({ price: 21456.78, change: 234.56, changePercent: 1.11, loading: true })
  const [sensex, setSensex] = useState({ price: 71234.56, change: 456.78, changePercent: 0.65, loading: true })
  const [gold, setGold] = useState({ price: 6234, change: -45.67, changePercent: -0.73, loading: true })

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const fetchSymbol = async (symbol: string) => {
          const res = await fetch('/api/market-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_stock', symbol })
          })
          const json = await res.json()
          if (json.success && json.data) return json.data
          return null
        }

        const [niftyData, sensexData, goldData] = await Promise.all([
          fetchSymbol('^NSEI'),
          fetchSymbol('^BSESN'),
          fetchSymbol('GC=F')
        ])

        if (niftyData) {
          setNifty({
            price: niftyData.currentPrice,
            change: niftyData.dayChange,
            changePercent: niftyData.dayChangePercent,
            loading: false
          })
        } else setNifty(p => ({ ...p, loading: false }))

        if (sensexData) {
          setSensex({
            price: sensexData.currentPrice,
            change: sensexData.dayChange,
            changePercent: sensexData.dayChangePercent,
            loading: false
          })
        } else setSensex(p => ({ ...p, loading: false }))

        if (goldData) {
          // Gold from Yahoo Finance is typically in USD per Troy Ounce
          // But our API might return raw data. Let's just show raw or converted
          const usdPrice = goldData.currentPrice
          // Approximate INR conversion if not handled by API
          // Let's use 83 INR/USD and 31.1 grams per troy ounce -> INR per gram
          const inrPerGram = (usdPrice * 83) / 31.1035
          const inrChange = (goldData.dayChange * 83) / 31.1035

          setGold({
            price: Math.round(inrPerGram),
            change: Math.round(inrChange * 100) / 100,
            changePercent: goldData.dayChangePercent,
            loading: false
          })
        } else setGold(p => ({ ...p, loading: false }))

      } catch (error) {
        console.error("Error fetching indices:", error)
        setNifty(p => ({ ...p, loading: false }))
        setSensex(p => ({ ...p, loading: false }))
        setGold(p => ({ ...p, loading: false }))
      }
    }

    fetchIndices()
  }, [])

  const filteredAssets = assets.filter(asset => {
    const safeSymbol = (asset.symbol || "").toLowerCase()
    const safeName = (asset.name || "").toLowerCase()
    const normalizedSearch = searchTerm.toLowerCase()
    const matchesSearch = safeSymbol.includes(normalizedSearch) ||
                         safeName.includes(normalizedSearch)
    const matchesCategory = filterCategory === "all" || asset.category === filterCategory
    const matchesWatched = !showWatchedOnly || asset.isWatched
    
    return matchesSearch && matchesCategory && matchesWatched
  })

  const getCategoryColor = (category: string) => {
    const colors = {
      'Equity': 'bg-blue-100 text-blue-800',
      'Debt': 'bg-green-100 text-green-800',
      'Commodity': 'bg-yellow-100 text-yellow-800',
      'Crypto': 'bg-purple-100 text-purple-800',
      'Real Estate': 'bg-orange-100 text-orange-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`
    return volume.toString()
  }

  const formatCurrencyValue = (value: number, currency?: string) => {
    if (!Number.isFinite(value)) return "N/A"
    if (currency === "INR") return formatINR(value)
    if (currency === "USD") {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `${currency || "USD"} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nifty 50</CardTitle>
          </CardHeader>
          <CardContent>
            {nifty.loading ? <div className="animate-pulse h-8 bg-muted rounded w-1/2"></div> : (
              <>
                <div className="text-2xl font-bold">{nifty.price.toLocaleString('en-IN')}</div>
                <div className={`flex items-center text-sm ${nifty.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {nifty.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {nifty.change >= 0 ? '+' : ''}{nifty.change.toFixed(2)} ({nifty.change >= 0 ? '+' : ''}{nifty.changePercent.toFixed(2)}%)
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sensex</CardTitle>
          </CardHeader>
          <CardContent>
            {sensex.loading ? <div className="animate-pulse h-8 bg-muted rounded w-1/2"></div> : (
              <>
                <div className="text-2xl font-bold">{sensex.price.toLocaleString('en-IN')}</div>
                <div className={`flex items-center text-sm ${sensex.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {sensex.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {sensex.change >= 0 ? '+' : ''}{sensex.change.toFixed(2)} ({sensex.change >= 0 ? '+' : ''}{sensex.changePercent.toFixed(2)}%)
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gold (24K)</CardTitle>
          </CardHeader>
          <CardContent>
            {gold.loading ? <div className="animate-pulse h-8 bg-muted rounded w-1/2"></div> : (
              <>
                <div className="text-2xl font-bold">₹{gold.price.toLocaleString('en-IN')}</div>
                <div className={`flex items-center text-sm ${gold.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {gold.change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {gold.change >= 0 ? '+' : ''}{gold.change.toFixed(2)} ({gold.change >= 0 ? '+' : ''}{gold.changePercent.toFixed(2)}%)
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Watchlist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Market Watchlist</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={showWatchedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowWatchedOnly(!showWatchedOnly)}
              >
                <Star className="h-4 w-4 mr-2" />
                Watched Only
              </Button>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter watchlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="Equity">Equity</option>
              <option value="Debt">Debt</option>
              <option value="Commodity">Commodity</option>
              <option value="Crypto">Crypto</option>
              <option value="Real Estate">Real Estate</option>
            </select>
          </div>

          {/* Assets Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Market Cap</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const isGain = asset.change >= 0
                  return (
                    <TableRow key={asset.symbol}>
                      <TableCell className="font-medium">{asset.symbol}</TableCell>
                      <TableCell>{asset.name || asset.symbol}</TableCell>
                      <TableCell className="font-medium">{formatCurrencyValue(asset.price, asset.currency)}</TableCell>
                      <TableCell>
                        <div className={`flex items-center ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                          {isGain ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                          <span>{formatCurrencyValue(Math.abs(asset.change), asset.currency)} ({asset.changePercent.toFixed(2)}%)</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatVolume(asset.volume)}</TableCell>
                      <TableCell>{formatCurrencyValue(asset.marketCap, asset.currency)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(asset.category)}>
                          {asset.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleWatch?.(asset.symbol)}
                          >
                            {asset.isWatched ? (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetails?.(asset)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!asset.isOwned && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onBuyAsset?.(asset)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Buy
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredAssets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No assets found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
