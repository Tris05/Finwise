"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Eye, EyeOff, MoreHorizontal, Target } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AssetAllocation {
  name: string
  value: number
  percentage: number
  change: number
  changePercent: number
  color: string
  category: 'Equity' | 'Debt' | 'Commodity' | 'Crypto' | 'Real Estate' | 'Cash'
}

interface PortfolioBreakdownProps {
  assets: AssetAllocation[]
  onAssetClick?: (asset: AssetAllocation) => void
  onRebalance?: () => void
}

export function PortfolioBreakdown({ assets, onAssetClick, onRebalance }: PortfolioBreakdownProps) {
  const [showValues, setShowValues] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<AssetAllocation | null>(null)

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0)

  const handleAssetClick = (asset: AssetAllocation) => {
    setSelectedAsset(asset)
    onAssetClick?.(asset)
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Equity': 'bg-blue-100 text-blue-800',
      'Debt': 'bg-green-100 text-green-800',
      'Commodity': 'bg-yellow-100 text-yellow-800',
      'Crypto': 'bg-purple-100 text-purple-800',
      'Real Estate': 'bg-orange-100 text-orange-800',
      'Cash': 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-8">
      {/* Portfolio Overview Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Breakdown</h2>
          <p className="text-muted-foreground mt-1">Your current asset allocation and performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowValues(!showValues)}
            className="h-9 w-9 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRebalance}
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Rebalance Portfolio
          </Button>
        </div>
      </div>

      {/* Asset Allocation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => {
          const isGain = asset.change >= 0
          return (
            <Card 
              key={asset.name}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
              onClick={() => handleAssetClick(asset)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm" 
                      style={{ backgroundColor: asset.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {asset.name}
                      </h3>
                      <Badge variant="outline" className={`text-xs mt-1 ${getCategoryColor(asset.category)}`}>
                        {asset.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {showValues ? formatINR(asset.value) : '••••••'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {asset.percentage.toFixed(1)}% of portfolio
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Today's Change</span>
                    <div className={`flex items-center text-sm font-medium ${isGain ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isGain ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {formatINR(Math.abs(asset.change))} ({asset.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                  
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${asset.percentage}%`,
                        backgroundColor: asset.color,
                        opacity: 0.8
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Total Portfolio</h3>
                <p className="text-sm text-muted-foreground">Current value</p>
              </div>
            </div>
            <div className="text-2xl font-bold">{formatINR(totalValue)}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">Best Performer</h3>
                <p className="text-sm text-muted-foreground">Today's top gainer</p>
              </div>
            </div>
            <div className="text-lg font-bold">
              {assets.reduce((best, asset) => 
                asset.changePercent > best.changePercent ? asset : best
              ).name}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              +{assets.reduce((best, asset) => 
                asset.changePercent > best.changePercent ? asset : best
              ).changePercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Diversification</h3>
                <p className="text-sm text-muted-foreground">Asset classes</p>
              </div>
            </div>
            <div className="text-2xl font-bold">{assets.length}</div>
            <div className="text-sm text-muted-foreground">Different assets</div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Asset Details */}
      {selectedAsset && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
          <CardHeader className="flex items-center justify-between pb-4">
            <div className="flex items-center space-x-4">
              <div 
                className="w-8 h-8 rounded-full shadow-sm" 
                style={{ backgroundColor: selectedAsset.color }}
              />
              <div>
                <CardTitle className="text-xl">{selectedAsset.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(selectedAsset.category)}`}>
                    {selectedAsset.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedAsset.percentage.toFixed(1)}% of portfolio
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Edit Allocation</DropdownMenuItem>
                <DropdownMenuItem>Sell Position</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-muted-foreground mb-1">Current Value</div>
                <div className="text-xl font-bold">{formatINR(selectedAsset.value)}</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-muted-foreground mb-1">Allocation</div>
                <div className="text-xl font-bold">{selectedAsset.percentage.toFixed(1)}%</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-muted-foreground mb-1">Day Change</div>
                <div className={`text-xl font-bold ${selectedAsset.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {selectedAsset.change >= 0 ? '+' : ''}{formatINR(selectedAsset.change)}
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-muted-foreground mb-1">Performance</div>
                <div className={`text-xl font-bold ${selectedAsset.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {selectedAsset.changePercent >= 0 ? '+' : ''}{selectedAsset.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Portfolio Allocation</span>
                <span className="text-muted-foreground">{selectedAsset.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${selectedAsset.percentage}%`,
                    backgroundColor: selectedAsset.color,
                    opacity: 0.8
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
