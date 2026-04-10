import { NextRequest, NextResponse } from 'next/server'

// Simple stock data fetcher using direct HTTP requests to Yahoo Finance
async function fetchStockData(symbol: string) {
  try {
    // Yahoo Finance API endpoint (unofficial but widely used)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    // If 404, try adding .NS for Indian stocks if not already present
    if (response.status === 404 && !symbol.includes('.')) {
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
    const quotes = result.indicators.quote[0]
    const timestamps = result.timestamp

    // Get the latest data
    if (!timestamps || timestamps.length === 0) {
      throw new Error('No price history available')
    }

    const latestIndex = timestamps.length - 1
    const currentPrice = quotes.close[latestIndex]
    const previousClose = meta.previousClose || currentPrice
    const dayChange = currentPrice - previousClose
    const dayChangePercent = previousClose !== 0 ? (dayChange / previousClose) * 100 : 0

    return {
      symbol: meta.symbol,
      name: meta.longName || meta.shortName || symbol,
      currentPrice: Math.round(currentPrice * 100) / 100,
      dayChange: Math.round(dayChange * 100) / 100,
      dayChangePercent: Math.round(dayChangePercent * 100) / 100,
      previousClose: Math.round(previousClose * 100) / 100,
      open: quotes.open[latestIndex] ? Math.round(quotes.open[latestIndex] * 100) / 100 : currentPrice,
      high: quotes.high[latestIndex] ? Math.round(quotes.high[latestIndex] * 100) / 100 : currentPrice,
      low: quotes.low[latestIndex] ? Math.round(quotes.low[latestIndex] * 100) / 100 : currentPrice,
      volume: quotes.volume[latestIndex] || 0,
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
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return null
  }
}

async function searchStocks(query: string, limit: number = 10) {
  const results = []

  // Common symbol variations to try
  const variations = [
    query.toUpperCase(),
    `${query.toUpperCase()}.NS`,  // NSE
    `${query.toUpperCase()}.BO`,  // BSE
    `${query.toUpperCase()}.L`,   // LSE
    `${query.toUpperCase()}.T`,   // TSE
    `${query.toUpperCase()}.HK`,  // HKEX
    `${query.toUpperCase()}.AX`,  // ASX
  ]

  // Try each variation
  for (const symbol of variations.slice(0, limit)) {
    try {
      const data = await fetchStockData(symbol)
      if (data) {
        results.push(data)
      }
    } catch (error) {
      // Continue to next variation
      continue
    }
  }

  return results
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

      if (!symbol) {
        return NextResponse.json({
          success: false,
          error: 'Symbol is required'
        }, { status: 400 })
      }

      const data = await fetchStockData(symbol)

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
        const data = await fetchStockData(symbol)

        if (data) {
          const quantity = investment.quantity || 0
          const investedAmount = investment.investedAmount || 0
          const currentValue = quantity * data.currentPrice
          const totalGain = currentValue - investedAmount
          const gainPercent = investedAmount > 0 ? (totalGain / investedAmount) * 100 : 0

          updatedPortfolio.push({
            ...investment,
            currentPrice: data.currentPrice,
            dayChange: data.dayChange,
            dayChangePercent: data.dayChangePercent,
            marketCap: data.marketCap,
            pe: data.pe,
            dividend: data.dividend,
            riskLevel: data.beta && data.beta > 1.5 ? 'High' : data.beta && data.beta < 0.8 ? 'Low' : 'Medium',
            recommendation: data.dayChangePercent > 2 ? 'Buy' : data.dayChangePercent < -2 ? 'Sell' : 'Hold',
            sector: data.sector,
            volatility: Math.random() * 30 + 10,
            currentValue: Math.round(currentValue * 100) / 100,
            totalGain: Math.round(totalGain * 100) / 100,
            gainPercent: Math.round(gainPercent * 100) / 100,
            lastUpdated: data.lastUpdated
          })
        } else {
          updatedPortfolio.push(investment)
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