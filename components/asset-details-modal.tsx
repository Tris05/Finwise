"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatINR } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useEffect, useRef, memo } from "react"

interface AssetDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  asset: any
}

// TradingView Widget Component
const TradingViewWidget = memo(({ symbol, category }: { symbol: string, category: string }) => {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Format symbol for TradingView
    let tvSymbol = symbol
    
    if (category === 'Crypto') {
      // For crypto like 'bitcoin', we need a ticker. But wait, if symbol is 'BTC', use BINANCE:BTCUSDT
      // We will just let TradingView try to resolve it, or use CRYPTO prefix.
      if (symbol.toLowerCase() === 'bitcoin') tvSymbol = 'BINANCE:BTCUSDT'
      else if (symbol.toLowerCase() === 'ethereum') tvSymbol = 'BINANCE:ETHUSDT'
      else tvSymbol = `CRYPTO:${symbol.toUpperCase()}USD`
    } else if (category === 'Equity') {
      if (symbol.includes('.NS')) {
        tvSymbol = `NSE:${symbol.replace('.NS', '')}`
      } else if (symbol.includes('.BO')) {
        tvSymbol = `BSE:${symbol.replace('.BO', '')}`
      } else {
        // Assume US stock or let TV decide
        tvSymbol = symbol
      }
    }

    let script = document.getElementById('tradingview-widget-script') as HTMLScriptElement
    
    const initWidget = () => {
      if (typeof (window as any).TradingView !== 'undefined' && container.current) {
        container.current.innerHTML = ''
        const wrapper = document.createElement("div")
        wrapper.id = `tradingview_${tvSymbol.replace(/[^a-zA-Z0-9]/g, '')}`
        wrapper.style.height = "100%"
        wrapper.style.width = "100%"
        container.current.appendChild(wrapper)

        new (window as any).TradingView.widget({
          "autosize": true,
          "symbol": tvSymbol,
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "light",
          "style": "1",
          "locale": "en",
          "enable_publishing": false,
          "backgroundColor": "rgba(255, 255, 255, 1)",
          "gridColor": "rgba(0, 0, 0, 0.06)",
          "hide_top_toolbar": false,
          "hide_legend": false,
          "save_image": false,
          "width": "100%",
          "height": "100%",
          "container_id": wrapper.id
        })
      }
    }

    if (!script) {
      script = document.createElement("script")
      script.id = 'tradingview-widget-script'
      script.src = "https://s3.tradingview.com/tv.js"
      script.async = true
      script.onload = initWidget
      document.head.appendChild(script)
    } else {
      initWidget()
    }
  }, [symbol, category])

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%", minHeight: "100%" }}>
    </div>
  )
})
TradingViewWidget.displayName = "TradingViewWidget"

export { TradingViewWidget }

export function AssetDetailsModal({ isOpen, onClose, asset }: AssetDetailsModalProps) {
  if (!asset) return null

  // Handle different asset structures (watchlist vs stock search)
  const price = asset.price || asset.currentPrice || 0
  const change = asset.change || asset.dayChange || 0
  const changePercent = asset.changePercent || asset.dayChangePercent || 0
  const currency = asset.currency || (asset.exchange?.includes('NASDAQ') || asset.exchange?.includes('NYSE') || asset.symbol?.includes('.US') ? 'USD' : 'INR')
  const isGain = change >= 0

  // Format price based on currency
  const formatPrice = (value: number) => {
    if (currency === 'USD') {
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return formatINR(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[95vw] w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">{asset.symbol}</span>
              <span className="text-muted-foreground text-lg">{asset.name}</span>
            </div>
            <div className="text-right pr-6">
              <div className="text-2xl font-bold">{formatPrice(price)}</div>
              <div className={`flex items-center text-sm ${isGain ? 'text-green-600' : 'text-red-600'} justify-end`}>
                {isGain ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {formatPrice(Math.abs(change))} ({changePercent.toFixed(2)}%)
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 mt-4 border rounded-md overflow-hidden bg-white">
          <TradingViewWidget 
            symbol={asset.symbol} 
            category={asset.category || asset.sector === 'Cryptocurrency' ? 'Crypto' : 'Equity'} 
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <div className="text-sm text-muted-foreground">Category</div>
            <div className="font-medium">{asset.category || asset.sector || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Market Cap</div>
            <div className="font-medium">{formatPrice(asset.marketCap || 0)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Volume</div>
            <div className="font-medium">{asset.volume ? asset.volume.toLocaleString() : 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="font-medium">
              {asset.isOwned && <span className="text-blue-600 mr-2">Owned</span>}
              {asset.isWatched && <span className="text-yellow-600">Watched</span>}
              {!asset.isOwned && !asset.isWatched && <span>Not in portfolio</span>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
