# Environment Setup Guide for Finwise

This guide will help you set up the environment variables needed for the Finwise financial management application.

## Quick Start

1. Copy the environment template:
   ```bash
   cp env.template .env.local
   ```

2. Fill in your actual API keys and configuration values in `.env.local`

3. Restart your development server:
   ```bash
   npm run dev
   ```

## Required Environment Variables

### 🔥 Firebase Configuration (Required)
These are already configured with your project values, but you can override them:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 🤖 AI Services (Required for AI Advisor)
Choose one of these AI providers:

**Google Gemini (Recommended)**
```env
GEMINI_API_KEY=your-gemini-api-key
```
Get your key from: https://makersuite.google.com/app/apikey

**OpenAI (Alternative)**
```env
OPENAI_API_KEY=your-openai-api-key
```

## Optional Services

### 📊 Financial Data APIs
For real-time market data and financial information:

```env
# Alpha Vantage (Free tier available)
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key

# Finnhub (Free tier available)
FINNHUB_API_KEY=your-finnhub-key

# Polygon.io (Free tier available)
POLYGON_API_KEY=your-polygon-key
```

### 🏦 Banking Integration
For connecting to bank accounts:

```env
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENVIRONMENT=sandbox
```

### 📧 Email Services
For sending notifications and emails:

```env
# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@finwise.com

# Or Resend (alternative)
RESEND_API_KEY=your-resend-api-key
```

### 📁 File Storage
For document uploads and file storage:

```env
# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=finwise-documents

# Or Cloudinary (alternative)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 🗄️ Database (Optional)
If you want to use a database instead of Firebase:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finwise

# Or PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/finwise
```

## Feature Flags

Control which features are enabled:

```env
NEXT_PUBLIC_ENABLE_AI_ADVISOR=true
NEXT_PUBLIC_ENABLE_GAMIFICATION=true
NEXT_PUBLIC_ENABLE_DOCUMENT_UPLOAD=true
NEXT_PUBLIC_ENABLE_PORTFOLIO_REBALANCING=true
```

## Security Configuration

```env
# JWT Secret for session management
JWT_SECRET=your-super-secret-jwt-key-here

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## Development vs Production

### Development
- Use `.env.local` for local development
- Set `NODE_ENV=development`
- Use sandbox/test API keys

### Production
- Use your hosting platform's environment variable settings
- Set `NODE_ENV=production`
- Use production API keys
- Enable all security features

## Getting API Keys

### Google Gemini
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key to `GEMINI_API_KEY`

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > General
4. Copy the configuration values

### Financial Data APIs
- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key
- **Finnhub**: https://finnhub.io/register
- **Polygon**: https://polygon.io/

### Banking Integration
- **Plaid**: https://dashboard.plaid.com/

### Email Services
- **SendGrid**: https://app.sendgrid.com/
- **Resend**: https://resend.com/

### File Storage
- **AWS S3**: https://aws.amazon.com/s3/
- **Cloudinary**: https://cloudinary.com/

## Troubleshooting

### Common Issues

1. **"Module not found: Can't resolve 'react-markdown'"**
   - Solution: Run `npm install react-markdown`

2. **"Missing GEMINI_API_KEY"**
   - Solution: Add your Gemini API key to `.env.local`

3. **Firebase authentication not working**
   - Solution: Check your Firebase configuration in `.env.local`

4. **Build errors in production**
   - Solution: Ensure all environment variables are set in your hosting platform

### Environment Variable Not Loading
- Make sure your `.env.local` file is in the root directory
- Restart your development server after adding new variables
- Check that variable names match exactly (case-sensitive)

## Security Best Practices

1. **Never commit `.env.local` to version control**
2. **Use different API keys for development and production**
3. **Rotate API keys regularly**
4. **Use environment-specific configurations**
5. **Enable rate limiting in production**

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all required environment variables are set
3. Ensure API keys are valid and have proper permissions
4. Check the console for specific error messages

For additional help, refer to the individual service documentation or contact support.
