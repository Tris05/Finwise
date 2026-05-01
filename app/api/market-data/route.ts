import { NextRequest, NextResponse } from 'next/server'

// Helper function to dynamically resolve unknown symbols via Yahoo Finance Search API
async function resolveYahooTicker(query: string): Promise<string | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    if (!response.ok) return null
    const data = await response.json()
    if (data.quotes && data.quotes.length > 0) {
      return data.quotes[0].symbol
    }
  } catch (error) {
    console.error(`Error resolving ticker for ${query}:`, error)
  }
  return null
}

// Global in-memory cache for CoinGecko to prevent rate limiting
interface CoinGeckoCache {
  data: any;
  timestamp: number;
}
const coinGeckoCache: Record<string, CoinGeckoCache> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Helper function for fetching pure cryptocurrency data from CoinGecko
async function fetchCoinGeckoData(rawSymbol: string) {
  try {
    const cryptoMap: Record<string, string> = {
      'BITCOIN': 'bitcoin',
      'ETHEREUM': 'ethereum',
      'TETHER': 'tether',
      'DOGECOIN': 'dogecoin',
      'BINANCE COIN': 'binancecoin',
      'SOLANA': 'solana',
      'RIPPLE': 'ripple',
      'CARDANO': 'cardano',
      'LITECOIN': 'litecoin',
      'USDT': 'tether',
      'BTC': 'bitcoin',
      'ETH': 'ethereum'
    }

    const id = cryptoMap[rawSymbol.toUpperCase()] || rawSymbol.toLowerCase()
    
    // Check cache first
    const now = Date.now();
    if (coinGeckoCache[id] && (now - coinGeckoCache[id].timestamp < CACHE_TTL_MS)) {
      return coinGeckoCache[id].data;
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`

    const response = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!response.ok) throw new Error(`CoinGecko HTTP error! status: ${response.status}`)

    const data = await response.json()
    if (!data[id]) throw new Error(`No data available for CoinGecko ID: ${id}`)

    const coinData = data[id]
    const currentPrice = coinData.usd || 0
    const dayChangePercent = coinData.usd_24h_change || 0
    const previousClose = currentPrice / (1 + (dayChangePercent / 100))
    const dayChange = currentPrice - previousClose

    const result = {
      symbol: rawSymbol,
      name: id.toUpperCase(),
      currentPrice: Math.round(currentPrice * 1000) / 1000,
      dayChange: Math.round(dayChange * 1000) / 1000,
      dayChangePercent: Math.round(dayChangePercent * 100) / 100,
      previousClose: Math.round(previousClose * 1000) / 1000,
      open: currentPrice,
      high: currentPrice,
      low: currentPrice,
      volume: coinData.usd_24h_vol || 0,
      currency: 'USD',
      exchange: 'Crypto',
      marketCap: coinData.usd_market_cap || 0,
      pe: null,
      dividend: 0,
      sector: 'Cryptocurrency',
      industry: 'Digital Assets',
      beta: null,
      week52High: currentPrice,
      week52Low: currentPrice,
      isValid: true,
      lastUpdated: new Date().toISOString()
    }

    // Save to cache
    coinGeckoCache[id] = {
      data: result,
      timestamp: now
    };

    return result;
  } catch (error: any) {
    console.error(`Error fetching CoinGecko data for ${rawSymbol}:`, error)
    return null
  }
}

// Simple stock data fetcher using direct HTTP requests to Yahoo Finance
async function fetchStockData(rawSymbol: string) {
  let symbol = rawSymbol
  let isResolvedFormally = false
  try {
    // Map common crypto names to Yahoo Finance ticker pairs
    const cryptoMap: Record<string, string> = {
      'BITCOIN': 'BTC-USD',
      'ETHEREUM': 'ETH-USD',
      'TETHER': 'USDT-USD',
      'DOGECOIN': 'DOGE-USD',
      'BINANCE COIN': 'BNB-USD',
      'SOLANA': 'SOL-USD',
      'RIPPLE': 'XRP-USD',
      'CARDANO': 'ADA-USD',
      'LITECOIN': 'LTC-USD'
    }

    if (cryptoMap[rawSymbol.toUpperCase()]) {
      symbol = cryptoMap[rawSymbol.toUpperCase()]
      isResolvedFormally = true
    } else {
      // For plain names (like SHIBA INU, or RELIANCE), ask Yahoo what the canonical ticker is
      if (!rawSymbol.includes('.') && !rawSymbol.includes('-')) {
        const resolvedTicker = await resolveYahooTicker(rawSymbol)
        if (resolvedTicker) {
          symbol = resolvedTicker
          isResolvedFormally = true
        }
      }
    }

    // Yahoo Finance API endpoint (unofficial but widely used)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    // If 404, try adding .NS for Indian stocks if not already present
    // Skip this for cryptocurrencies to prevent formatting like BTC-USD.NS
    // Also skip if Yahoo already specifically resolved the canon ticker for us.
    const isCrypto = !!cryptoMap[rawSymbol.toUpperCase()] || symbol.includes('-USD')
    if (response.status === 404 && !symbol.includes('.') && !isCrypto && !isResolvedFormally) {
      return fetchStockData(`${symbol}.NS`)
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data available for this symbol')
    }

    const result = data.chart.result[0]
    const meta = result.meta
    const quotes = result.indicators?.quote?.[0] || {}
    const timestamps = result.timestamp || []

    let currentPrice = meta.regularMarketPrice
    let openPrice = currentPrice
    let highPrice = meta.regularMarketDayHigh || currentPrice
    let lowPrice = meta.regularMarketDayLow || currentPrice
    let volume = meta.regularMarketVolume || 0

    // Get the latest data from timestamps if available
    if (timestamps.length > 0 && quotes.close && quotes.close.length > 0) {
      const latestIndex = timestamps.length - 1
      if (quotes.close[latestIndex] != null) currentPrice = quotes.close[latestIndex]
      if (quotes.open?.[latestIndex] != null) openPrice = quotes.open[latestIndex]
      if (quotes.high?.[latestIndex] != null) highPrice = quotes.high[latestIndex]
      if (quotes.low?.[latestIndex] != null) lowPrice = quotes.low[latestIndex]
      if (quotes.volume?.[latestIndex] != null) volume = quotes.volume[latestIndex] || volume
    } else if (currentPrice == null) {
      throw new Error('No price history or market price available')
    }

    const previousClose = meta.previousClose || meta.chartPreviousClose || currentPrice
    const dayChange = currentPrice - previousClose
    const dayChangePercent = previousClose !== 0 ? (dayChange / previousClose) * 100 : 0

    return {
      symbol: meta.symbol,
      name: meta.longName || meta.shortName || symbol,
      currentPrice: Math.round(currentPrice * 100) / 100,
      dayChange: Math.round(dayChange * 100) / 100,
      dayChangePercent: Math.round(dayChangePercent * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      open: Math.round(openPrice * 100) / 100,
      high: Math.round(highPrice * 100) / 100,
      low: Math.round(lowPrice * 100) / 100,
      volume: volume,
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || 'Unknown',
      marketCap: meta.marketCap || 0,
      pe: meta.trailingPE || null,
      dividend: meta.dividendYield ? meta.dividendYield * 100 : 0,
      sector: meta.sector || 'Unknown',
      industry: meta.industry || 'Unknown',
      beta: meta.beta || null,
      week52High: meta.fiftyTwoWeekHigh || currentPrice,
      week52Low: meta.fiftyTwoWeekLow || currentPrice,
      isValid: true,
      lastUpdated: new Date().toISOString()
    }
  } catch (error: any) {
    // Only log if it's not a generic 404 error we expect for unsupported symbols
    if (!error.message?.includes('status: 404')) {
      console.error(`Error fetching data for ${symbol}:`, error)
    }
    return null
  }
}

async function searchStocks(query: string, limit: number = 10) {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []

  try {
    // Prefer Yahoo's search endpoint so company-name queries work reliably.
    const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(normalizedQuery)}`
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    let candidateSymbols: string[] = []

    if (response.ok) {
      const payload = await response.json()
      const quotes = Array.isArray(payload?.quotes) ? payload.quotes : []

      candidateSymbols = quotes
        .filter((q: any) => q?.symbol && q?.quoteType !== 'INDEX')
        .map((q: any) => String(q.symbol).toUpperCase())
    }

    // Fallback for cases where Yahoo search returns no quotes.
    if (candidateSymbols.length === 0) {
      candidateSymbols = [
        normalizedQuery.toUpperCase(),
        `${normalizedQuery.toUpperCase()}.NS`,
        `${normalizedQuery.toUpperCase()}.BO`
      ]
    }

    const uniqueSymbols = [...new Set(candidateSymbols)].slice(0, Math.max(1, Math.min(limit, 10)))
    const results = await Promise.all(uniqueSymbols.map((symbol) => fetchStockData(symbol)))

    return results.filter(Boolean)
  } catch (error) {
    console.error(`Error searching stocks for query "${normalizedQuery}":`, error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action || 'get_stock'

    if (action === 'search_stocks') {
      const query = body.query
      const limit = body.limit || 10

      if (!query) {
        return NextResponse.json({
          success: false,
          error: 'Search query is required'
        }, { status: 400 })
      }

      const results = await searchStocks(query, limit)

      return NextResponse.json({
        success: true,
        data: results
      })
    }

    if (action === 'get_stock') {
      const symbol = body.symbol
      const type = (body.type || '').toLowerCase()

      if (!symbol) {
        return NextResponse.json({
          success: false,
          error: 'Symbol is required'
        }, { status: 400 })
      }

      const isCrypto = type === 'crypto' || ['bitcoin', 'ethereum', 'tether', 'dogecoin', 'solana', 'ripple', 'cardano', 'litecoin', 'usdt', 'btc', 'eth'].includes(symbol.toLowerCase())

      const data = isCrypto ? await fetchCoinGeckoData(symbol) : await fetchStockData(symbol)

      if (data) {
        return NextResponse.json({
          success: true,
          data: data
        })
      } else {
        return NextResponse.json({
          success: false,
          error: `No data found for symbol: ${symbol}`
        }, { status: 404 })
      }
    }

    if (action === 'get_detailed_stock') {
      const symbol = body.symbol

      if (!symbol) {
        return NextResponse.json({
          success: false,
          error: 'Symbol is required'
        }, { status: 400 })
      }

      const data = await fetchStockData(symbol)

      if (data) {
        // Add additional detailed information
        const detailedData = {
          ...data,
          shortName: data.name,
          forwardPE: null,
          pegRatio: null,
          priceToBook: null,
          priceToSales: null,
          payoutRatio: null,
          volatility: Math.random() * 30 + 10, // Mock volatility
          riskLevel: data.beta && data.beta > 1.5 ? 'High' : data.beta && data.beta < 0.8 ? 'Low' : 'Medium',
          recommendation: data.dayChangePercent > 2 ? 'Buy' : data.dayChangePercent < -2 ? 'Sell' : 'Hold',
          volumeRatio: data.volume > 0 ? Math.random() * 2 + 0.5 : 1,
          debtToEquity: null,
          currentRatio: null,
          quickRatio: null,
          revenueGrowth: null,
          earningsGrowth: null,
          profitMargins: null,
          ma20: data.currentPrice * (0.95 + Math.random() * 0.1),
          ma50: data.currentPrice * (0.9 + Math.random() * 0.2),
          website: null,
          description: `${data.name} is a company in the ${data.sector} sector.`,
          employees: null,
          city: '',
          state: '',
          country: data.exchange === 'NSE' ? 'India' : 'United States',
          logoUrl: null
        }

        return NextResponse.json({
          success: true,
          data: detailedData
        })
      } else {
        return NextResponse.json({
          success: false,
          error: `No detailed data found for symbol: ${symbol}`
        }, { status: 404 })
      }
    }

    if (action === 'get_portfolio') {
      const portfolio = body.portfolio || []
      const updatedPortfolio = []

      for (const investment of portfolio) {
        const symbol = investment.symbol
        const type = investment.type?.toLowerCase() || ''

        const isDebt = ['bond', 'debt', 'mutual fund', 'fixed income', 'fd', 'ppf'].includes(type) ||
          symbol.toLowerCase().includes('fd-') ||
          symbol.toLowerCase().includes('ppf')

        const isCrypto = type === 'crypto' || ['bitcoin', 'ethereum', 'tether', 'dogecoin', 'solana', 'ripple', 'cardano', 'litecoin', 'usdt', 'btc', 'eth'].includes(symbol.toLowerCase())

        let data = null
        if (isCrypto) {
          data = await fetchCoinGeckoData(symbol)
        } else if (!isDebt) {
          data = await fetchStockData(symbol)
        }

        if (data) {
          const quantity = investment.quantity || 0
          const investedAmount = investment.investedAmount || 0
          const currentValue = quantity * data.currentPrice
          const totalGain = currentValue - investedAmount
          const gainPercent = investedAmount > 0 ? (totalGain / investedAmount) * 100 : 0

          updatedPortfolio.push({
            ...investment,
            currentPrice: data.currentPrice,
            currency: data.currency || 'USD',
            dayChange: data.dayChange,
            dayChangePercent: data.dayChangePercent,
            marketCap: data.marketCap,
            pe: data.pe,
            dividend: data.dividend,
            riskLevel: data.beta && data.beta > 1.5 ? 'High' : (data.beta && data.beta < 0.8 ? 'Low' : 'Medium'),
            recommendation: data.dayChangePercent > 2 ? 'Buy' : (data.dayChangePercent < -2 ? 'Sell' : 'Hold'),
            sector: data.sector,
            volatility: Math.random() * 30 + 10,
            currentValue: Math.round(currentValue * 100) / 100,
            totalGain: Math.round(totalGain * 100) / 100,
            gainPercent: Math.round(gainPercent * 100) / 100,
            volume: data.volume || 0,
            week52High: data.week52High || data.currentPrice,
            week52Low: data.week52Low || data.currentPrice,
            lastUpdated: data.lastUpdated
          })
        } else if (isDebt) {
          // Handle FDs and Bonds that don't have ticker symbols
          const investedAmount = Number(investment.investedAmount) || 0
          const rate = Number(investment.rate) || 0.07 // Default 7%
          const purchaseDateStr = investment.purchaseDate || investment.date || new Date().toISOString()
          const purchaseDate = new Date(purchaseDateStr)
          const now = new Date()

          const diffTime = Math.max(0, now.getTime() - purchaseDate.getTime())
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

          // Simple accrued interest: P * r * (days/365)
          const accruedInterest = investedAmount * rate * (diffDays / 365)
          const currentValue = investedAmount + accruedInterest
          const totalGain = accruedInterest

          updatedPortfolio.push({
            ...investment,
            currentPrice: investment.currentPrice || (investedAmount / (Number(investment.quantity) || 1)),
            dayChange: 0,
            dayChangePercent: 0,
            currentValue: Math.round(currentValue * 100) / 100,
            totalGain: Math.round(totalGain * 100) / 100,
            gainPercent: investedAmount > 0 ? Math.round((totalGain / investedAmount) * 10000) / 100 : 0,
            lastUpdated: now.toISOString()
          })
        } else {
          // If not debt and fetch failed, keep as is but ensure no NaNs
          updatedPortfolio.push({
            ...investment,
            currentValue: investment.currentValue || investment.investedAmount || 0,
            totalGain: investment.totalGain || 0,
            dayChange: investment.dayChange || 0,
            dayChangePercent: investment.dayChangePercent || 0
          })
        }
      }

      return NextResponse.json({
        success: true,
        data: updatedPortfolio,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action specified'
    }, { status: 400 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Market Data API - Use POST method to fetch data',
    endpoints: {
      'POST /api/market-data': 'Fetch real-time market data',
      actions: ['search_stocks', 'get_stock', 'get_detailed_stock', 'get_portfolio']
    }
  })
}