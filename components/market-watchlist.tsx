"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, Star, StarOff, Plus, Search, Eye } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useState } from "react"

interface MarketAsset {
  symbol: string
  name: string
  price: number
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
}

export function MarketWatchlist({ 
  assets, 
  onToggleWatch, 
  onBuyAsset, 
  onViewDetails 
}: MarketWatchlistProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [showWatchedOnly, setShowWatchedOnly] = useState(false)

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nifty 50</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">21,456.78</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +234.56 (+1.11%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sensex</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">71,234.56</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +456.78 (+0.65%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gold (24K)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹6,234</div>
            <div className="flex items-center text-sm text-red-600">
              <TrendingDown className="h-4 w-4 mr-1" />
              -45.67 (-0.73%)
            </div>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
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
                      <TableCell>{asset.name}</TableCell>
                      <TableCell className="font-medium">{formatINR(asset.price)}</TableCell>
                      <TableCell>
                        <div className={`flex items-center ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                          {isGain ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                          <span>{formatINR(Math.abs(asset.change))} ({asset.changePercent.toFixed(2)}%)</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatVolume(asset.volume)}</TableCell>
                      <TableCell>{formatINR(asset.marketCap)}</TableCell>
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
