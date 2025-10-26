#!/bin/bash

# Installation script for Yahoo Finance integration
echo "🚀 Setting up Yahoo Finance integration for Finwise..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ Python 3 and pip3 are installed"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Test the installation
echo "🧪 Testing Yahoo Finance integration..."
python3 -c "
import yfinance as yf
import pandas as pd
print('✅ yfinance library imported successfully')
print('✅ pandas library imported successfully')

# Test fetching data
try:
    ticker = yf.Ticker('RELIANCE.NS')
    info = ticker.info
    print('✅ Successfully fetched data from Yahoo Finance')
    print(f'📊 Sample data: {info.get(\"longName\", \"Reliance Industries\")}')
except Exception as e:
    print(f'❌ Error testing Yahoo Finance: {e}')
    exit(1)
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Yahoo Finance integration setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Start your Next.js development server: npm run dev"
    echo "2. Navigate to the Investments page"
    echo "3. Click the refresh button to fetch real-time data"
    echo ""
    echo "💡 Supported symbols:"
    echo "   - Indian stocks: RELIANCE, TCS, HDFC, SBI, AXIS"
    echo "   - Crypto: BTC, ETH"
    echo "   - Commodities: GOLD"
    echo ""
    echo "⚠️  Note: Market data is fetched from Yahoo Finance and may have delays"
    echo "   during market hours. Some symbols may not be available."
else
    echo "❌ Setup failed. Please check the error messages above."
    exit 1
fi
