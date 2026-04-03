# Firebase Google OAuth Setup Guide

## 1. Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (project-997042770279)
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. If you don't have a web app, click "Add app" and select Web
6. Copy the configuration object

## 2. Update Firebase Configuration

Replace the values in `lib/firebase.ts` with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
}
```

## 3. Enable Google Authentication

1. In Firebase Console, go to Authentication
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Add your domain to authorized domains

## 4. Test the Integration

1. Run your app: `npm run dev`
2. Go to login page
3. Click "Continue with Google"
4. Google popup should appear for sign-in

## Features Included

✅ Google OAuth popup authentication
✅ Loading states and error handling
✅ Success/error toast notifications
✅ Automatic redirect to dashboard
✅ Clean Google branding and styling
