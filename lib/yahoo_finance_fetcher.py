import yfinance as yf
import pandas as pd
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class YahooFinanceDataFetcher:
    def __init__(self):
        self.symbol_mapping = {
            # Indian stocks with their Yahoo Finance symbols
            'RELIANCE': 'RELIANCE.NS',
            'TCS': 'TCS.NS', 
            'HDFC': 'HDFCBANK.NS',
            'SBI': 'SBIN.NS',
            'AXIS': 'AXISBANK.NS',
            # Crypto
            'BTC': 'BTC-USD',
            'ETH': 'ETH-USD',
            # Gold
            'GOLD': 'GC=F'
        }
        
        # Common exchanges and their suffixes
        self.exchange_suffixes = {
            'NSE': '.NS',      # National Stock Exchange (India)
            'BSE': '.BO',      # Bombay Stock Exchange (India)
            'NASDAQ': '',      # No suffix for US stocks
            'NYSE': '',        # No suffix for US stocks
            'LSE': '.L',       # London Stock Exchange
            'TSE': '.T',       # Tokyo Stock Exchange
            'HKEX': '.HK',     # Hong Kong Exchange
            'ASX': '.AX',      # Australian Securities Exchange
        }
    
    def get_stock_data(self, symbol: str) -> Optional[Dict]:
        """Fetch comprehensive stock data from Yahoo Finance"""
        try:
            yahoo_symbol = self.symbol_mapping.get(symbol, f"{symbol}.NS")
            ticker = yf.Ticker(yahoo_symbol)
            
            # Get current price and basic info
            info = ticker.info
            
            # Get historical data for calculations
            hist = ticker.history(period="1y")
            hist_1d = ticker.history(period="2d")
            
            if hist.empty or hist_1d.empty:
                logger.warning(f"No data available for {symbol}")
                return None
            
            # Current price
            current_price = hist_1d['Close'].iloc[-1]
            previous_close = hist_1d['Close'].iloc[-2] if len(hist_1d) > 1 else current_price
            
            # Calculate day change
            day_change = current_price - previous_close
            day_change_percent = (day_change / previous_close) * 100
            
            # Calculate 52-week high/low
            week_52_high = hist['High'].max()
            week_52_low = hist['Low'].min()
            
            # Calculate volatility (30-day)
            returns = hist['Close'].pct_change().dropna()
            volatility = returns.std() * (252 ** 0.5) * 100  # Annualized volatility
            
            # Get additional metrics
            market_cap = info.get('marketCap', 0)
            pe_ratio = info.get('trailingPE', None)
            dividend_yield = info.get('dividendYield', None)
            if dividend_yield:
                dividend_yield = dividend_yield * 100
            
            # Determine sector and industry
            sector = info.get('sector', 'Unknown')
            industry = info.get('industry', 'Unknown')
            
            # Calculate risk level based on volatility
            if volatility < 20:
                risk_level = 'Low'
            elif volatility < 40:
                risk_level = 'Medium'
            else:
                risk_level = 'High'
            
            # Generate recommendation based on technical and fundamental analysis
            recommendation = self._generate_recommendation(
                current_price, previous_close, pe_ratio, 
                dividend_yield, volatility, market_cap
            )
            
            return {
                'symbol': symbol,
                'name': info.get('longName', symbol),
                'currentPrice': round(current_price, 2),
                'dayChange': round(day_change, 2),
                'dayChangePercent': round(day_change_percent, 2),
                'previousClose': round(previous_close, 2),
                'week52High': round(week_52_high, 2),
                'week52Low': round(week_52_low, 2),
                'marketCap': market_cap,
                'pe': pe_ratio,
                'dividend': dividend_yield,
                'volatility': round(volatility, 2),
                'riskLevel': risk_level,
                'recommendation': recommendation,
                'sector': sector,
                'industry': industry,
                'currency': info.get('currency', 'INR'),
                'exchange': info.get('exchange', 'NSE'),
                'lastUpdated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {str(e)}")
            return None
    
    def _generate_recommendation(self, current_price: float, previous_close: float, 
                               pe_ratio: Optional[float], dividend_yield: Optional[float],
                               volatility: float, market_cap: int) -> str:
        """Generate investment recommendation based on multiple factors"""
        score = 0
        
        # Price momentum (30% weight)
        price_change_percent = ((current_price - previous_close) / previous_close) * 100
        if price_change_percent > 2:
            score += 3
        elif price_change_percent > 0:
            score += 1
        elif price_change_percent < -2:
            score -= 2
        
        # Valuation (25% weight)
        if pe_ratio:
            if pe_ratio < 15:
                score += 2
            elif pe_ratio < 25:
                score += 1
            elif pe_ratio > 35:
                score -= 2
        
        # Dividend yield (20% weight)
        if dividend_yield:
            if dividend_yield > 3:
                score += 2
            elif dividend_yield > 1:
                score += 1
        
        # Volatility/Risk (15% weight)
        if volatility < 20:
            score += 1
        elif volatility > 40:
            score -= 1
        
        # Market cap (10% weight)
        if market_cap > 1000000000000:  # Large cap
            score += 1
        
        # Generate recommendation
        if score >= 4:
            return 'Strong Buy'
        elif score >= 2:
            return 'Buy'
        elif score >= 0:
            return 'Hold'
        elif score >= -2:
            return 'Sell'
        else:
            return 'Strong Sell'
    
    def get_multiple_stocks_data(self, symbols: List[str]) -> Dict[str, Dict]:
        """Fetch data for multiple stocks"""
        results = {}
        for symbol in symbols:
            data = self.get_stock_data(symbol)
            if data:
                results[symbol] = data
        return results
    
    def search_stocks(self, query: str, limit: int = 10) -> List[Dict]:
        """Search for stocks by symbol or company name"""
        try:
            # Try different symbol variations
            search_variations = [
                query.upper(),
                f"{query.upper()}.NS",  # NSE
                f"{query.upper()}.BO",  # BSE
                f"{query.upper()}.L",   # LSE
                f"{query.upper()}.T",   # TSE
                f"{query.upper()}.HK",  # HKEX
                f"{query.upper()}.AX",  # ASX
            ]
            
            results = []
            for symbol in search_variations[:limit]:
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    
                    if info and 'symbol' in info:
                        # Get basic data
                        hist = ticker.history(period="5d")
                        if not hist.empty:
                            current_price = hist['Close'].iloc[-1]
                            previous_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                            day_change = current_price - previous_close
                            day_change_percent = (day_change / previous_close) * 100
                            
                            results.append({
                                'symbol': info.get('symbol', symbol),
                                'name': info.get('longName', info.get('shortName', symbol)),
                                'exchange': info.get('exchange', 'Unknown'),
                                'currentPrice': round(current_price, 2),
                                'dayChange': round(day_change, 2),
                                'dayChangePercent': round(day_change_percent, 2),
                                'currency': info.get('currency', 'USD'),
                                'marketCap': info.get('marketCap', 0),
                                'sector': info.get('sector', 'Unknown'),
                                'industry': info.get('industry', 'Unknown'),
                                'pe': info.get('trailingPE'),
                                'dividend': info.get('dividendYield', 0) * 100 if info.get('dividendYield') else 0,
                                'volume': info.get('volume', 0),
                                'avgVolume': info.get('averageVolume', 0),
                                'beta': info.get('beta'),
                                'website': info.get('website'),
                                'description': info.get('longBusinessSummary', ''),
                                'employees': info.get('fullTimeEmployees'),
                                'city': info.get('city', ''),
                                'state': info.get('state', ''),
                                'country': info.get('country', ''),
                                'logoUrl': info.get('logo_url', ''),
                                'isValid': True
                            })
                except Exception as e:
                    logger.debug(f"Failed to fetch data for {symbol}: {e}")
                    continue
            
            return results[:limit]
            
        except Exception as e:
            logger.error(f"Error searching stocks: {str(e)}")
            return []
    
    def get_detailed_stock_data(self, symbol: str) -> Optional[Dict]:
        """Get comprehensive stock data including historical data, financials, etc."""
        try:
            yahoo_symbol = self.symbol_mapping.get(symbol, symbol)
            ticker = yf.Ticker(yahoo_symbol)
            
            # Get all available data
            info = ticker.info
            hist_1y = ticker.history(period="1y")
            hist_1d = ticker.history(period="2d")
            hist_5d = ticker.history(period="5d")
            
            if hist_1d.empty:
                logger.warning(f"No data available for {symbol}")
                return None
            
            # Current price data
            current_price = hist_1d['Close'].iloc[-1]
            previous_close = hist_1d['Close'].iloc[-2] if len(hist_1d) > 1 else current_price
            day_change = current_price - previous_close
            day_change_percent = (day_change / previous_close) * 100
            
            # Historical data
            week_52_high = hist_1y['High'].max() if not hist_1y.empty else current_price
            week_52_low = hist_1y['Low'].min() if not hist_1y.empty else current_price
            
            # Calculate technical indicators
            volatility = 0
            if not hist_1y.empty:
                returns = hist_1y['Close'].pct_change().dropna()
                volatility = returns.std() * (252 ** 0.5) * 100
            
            # Moving averages
            ma_20 = hist_5d['Close'].rolling(window=20).mean().iloc[-1] if len(hist_5d) >= 20 else current_price
            ma_50 = hist_1y['Close'].rolling(window=50).mean().iloc[-1] if len(hist_1y) >= 50 else current_price
            
            # Financial metrics
            market_cap = info.get('marketCap', 0)
            pe_ratio = info.get('trailingPE')
            forward_pe = info.get('forwardPE')
            peg_ratio = info.get('pegRatio')
            price_to_book = info.get('priceToBook')
            price_to_sales = info.get('priceToSalesTrailing12Months')
            dividend_yield = info.get('dividendYield', 0) * 100 if info.get('dividendYield') else 0
            payout_ratio = info.get('payoutRatio')
            
            # Growth metrics
            revenue_growth = info.get('revenueGrowth')
            earnings_growth = info.get('earningsGrowth')
            profit_margins = info.get('profitMargins')
            
            # Risk metrics
            beta = info.get('beta')
            debt_to_equity = info.get('debtToEquity')
            current_ratio = info.get('currentRatio')
            quick_ratio = info.get('quickRatio')
            
            # Volume data
            volume = info.get('volume', 0)
            avg_volume = info.get('averageVolume', 0)
            volume_ratio = volume / avg_volume if avg_volume > 0 else 1
            
            # Determine risk level
            if volatility < 20:
                risk_level = 'Low'
            elif volatility < 40:
                risk_level = 'Medium'
            else:
                risk_level = 'High'
            
            # Generate recommendation
            recommendation = self._generate_recommendation(
                current_price, previous_close, pe_ratio, 
                dividend_yield, volatility, market_cap
            )
            
            return {
                'symbol': symbol,
                'name': info.get('longName', symbol),
                'shortName': info.get('shortName', symbol),
                'currentPrice': round(current_price, 2),
                'dayChange': round(day_change, 2),
                'dayChangePercent': round(day_change_percent, 2),
                'previousClose': round(previous_close, 2),
                'open': round(hist_1d['Open'].iloc[-1], 2),
                'high': round(hist_1d['High'].iloc[-1], 2),
                'low': round(hist_1d['Low'].iloc[-1], 2),
                'week52High': round(week_52_high, 2),
                'week52Low': round(week_52_low, 2),
                'marketCap': market_cap,
                'pe': pe_ratio,
                'forwardPE': forward_pe,
                'pegRatio': peg_ratio,
                'priceToBook': price_to_book,
                'priceToSales': price_to_sales,
                'dividend': dividend_yield,
                'payoutRatio': payout_ratio,
                'volatility': round(volatility, 2),
                'riskLevel': risk_level,
                'recommendation': recommendation,
                'sector': info.get('sector', 'Unknown'),
                'industry': info.get('industry', 'Unknown'),
                'currency': info.get('currency', 'USD'),
                'exchange': info.get('exchange', 'Unknown'),
                'volume': volume,
                'avgVolume': avg_volume,
                'volumeRatio': round(volume_ratio, 2),
                'beta': beta,
                'debtToEquity': debt_to_equity,
                'currentRatio': current_ratio,
                'quickRatio': quick_ratio,
                'revenueGrowth': revenue_growth,
                'earningsGrowth': earnings_growth,
                'profitMargins': profit_margins,
                'ma20': round(ma_20, 2),
                'ma50': round(ma_50, 2),
                'website': info.get('website'),
                'description': info.get('longBusinessSummary', ''),
                'employees': info.get('fullTimeEmployees'),
                'city': info.get('city', ''),
                'state': info.get('state', ''),
                'country': info.get('country', ''),
                'logoUrl': info.get('logo_url', ''),
                'lastUpdated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching detailed data for {symbol}: {str(e)}")
            return None
    
    def get_portfolio_data(self, portfolio: List[Dict]) -> List[Dict]:
        """Update portfolio with real-time data"""
        updated_portfolio = []
        
        for investment in portfolio:
            symbol = investment.get('symbol', '')
            real_data = self.get_stock_data(symbol)
            
            if real_data:
                # Update with real data while preserving user-specific data
                updated_investment = {
                    **investment,
                    'currentPrice': real_data['currentPrice'],
                    'dayChange': real_data['dayChange'],
                    'dayChangePercent': real_data['dayChangePercent'],
                    'marketCap': real_data['marketCap'],
                    'pe': real_data['pe'],
                    'dividend': real_data['dividend'],
                    'riskLevel': real_data['riskLevel'],
                    'recommendation': real_data['recommendation'],
                    'sector': real_data['sector'],
                    'volatility': real_data['volatility'],
                    'lastUpdated': real_data['lastUpdated']
                }
                
                # Recalculate current value and gains
                quantity = investment.get('quantity', 0)
                invested_amount = investment.get('investedAmount', 0)
                current_value = quantity * real_data['currentPrice']
                total_gain = current_value - invested_amount
                gain_percent = (total_gain / invested_amount) * 100 if invested_amount > 0 else 0
                
                updated_investment.update({
                    'currentValue': round(current_value, 2),
                    'totalGain': round(total_gain, 2),
                    'gainPercent': round(gain_percent, 2)
                })
                
                updated_portfolio.append(updated_investment)
            else:
                # Keep original data if real data unavailable
                updated_portfolio.append(investment)
        
        return updated_portfolio

def main():
    """Test the data fetcher"""
    fetcher = YahooFinanceDataFetcher()
    
    # Test with sample symbols
    test_symbols = ['RELIANCE', 'TCS', 'HDFC', 'BTC', 'ETH']
    
    print("Fetching real-time market data...")
    for symbol in test_symbols:
        data = fetcher.get_stock_data(symbol)
        if data:
            print(f"\n{symbol}:")
            print(f"  Price: ₹{data['currentPrice']}")
            print(f"  Change: {data['dayChangePercent']:.2f}%")
            print(f"  Recommendation: {data['recommendation']}")
            print(f"  Risk Level: {data['riskLevel']}")
        else:
            print(f"Failed to fetch data for {symbol}")

if __name__ == "__main__":
    main()
