import sys
import os
import json
from datetime import datetime

# Add the lib directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'lib'))

from yahoo_finance_fetcher import YahooFinanceDataFetcher

def handler(request):
    """Handle API requests for market data"""
    try:
        # Parse request data
        if hasattr(request, 'json'):
            request_data = request.json
        else:
            request_data = {}
        
        fetcher = YahooFinanceDataFetcher()
        
        # Handle different types of requests
        action = request_data.get('action', 'get_portfolio')
        
        if action == 'get_portfolio':
            # Update portfolio with real-time data
            portfolio = request_data.get('portfolio', [])
            updated_portfolio = fetcher.get_portfolio_data(portfolio)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({
                    'success': True,
                    'data': updated_portfolio,
                    'timestamp': datetime.now().isoformat()
                })
            }
        
        elif action == 'get_stock':
            # Get data for a specific stock
            symbol = request_data.get('symbol', '')
            if not symbol:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'success': False,
                        'error': 'Symbol is required'
                    })
                }
            
            stock_data = fetcher.get_stock_data(symbol)
            if stock_data:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'data': stock_data
                    })
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'success': False,
                        'error': f'No data found for symbol: {symbol}'
                    })
                }
        
        elif action == 'get_multiple':
            # Get data for multiple stocks
            symbols = request_data.get('symbols', [])
            if not symbols:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'success': False,
                        'error': 'Symbols list is required'
                    })
                }
            
            stocks_data = fetcher.get_multiple_stocks_data(symbols)
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'data': stocks_data
                })
            }
        
        elif action == 'search_stocks':
            # Search for stocks
            query = request_data.get('query', '')
            limit = request_data.get('limit', 10)
            
            if not query:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'success': False,
                        'error': 'Search query is required'
                    })
                }
            
            search_results = fetcher.search_stocks(query, limit)
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'data': search_results
                })
            }
        
        elif action == 'get_detailed_stock':
            # Get detailed stock data
            symbol = request_data.get('symbol', '')
            if not symbol:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'success': False,
                        'error': 'Symbol is required'
                    })
                }
            
            detailed_data = fetcher.get_detailed_stock_data(symbol)
            if detailed_data:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'data': detailed_data
                    })
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'success': False,
                        'error': f'No detailed data found for symbol: {symbol}'
                    })
                }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'success': False,
                    'error': 'Invalid action specified'
                })
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': False,
                'error': f'Internal server error: {str(e)}'
            })
        }

# For local testing
if __name__ == "__main__":
    class MockRequest:
        def __init__(self, data):
            self.json = data
    
    # Test the handler
    test_request = MockRequest({
        'action': 'get_portfolio',
        'portfolio': [
            {
                'symbol': 'RELIANCE',
                'quantity': 150,
                'investedAmount': 350000
            },
            {
                'symbol': 'TCS',
                'quantity': 50,
                'investedAmount': 180000
            }
        ]
    })
    
    result = handler(test_request)
    print(json.loads(result['body']))
