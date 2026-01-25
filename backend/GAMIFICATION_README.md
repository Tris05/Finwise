# Gamification Backend Module

This module implements a pluggable, adaptive gamification agent for FinWise.

## Architecture

- **Language**: Python (Flask)
- **Database**: Firebase Cloud Firestore (with in-memory mock fallback)
- **AI**: Google Gemini API (fallback to static questions if disabled)
- **Agent**: `GamificationAgent` class in `backend/gamification_agent.py`

## Features

1.  **Hybrid Question Strategy**:
    - Checks Firestore cache first.
    - If cache miss, calls Gemini API to generate questions.
    - Stores generated questions in Firestore for future use.
2.  **Adaptive Difficulty**:
    - **Easy**: Initial state / <40% accuracy (if currently medium)
    - **Medium**: >80% accuracy on Easy / <40% on Hard
    - **Hard**: >80% accuracy on Medium
3.  **XP and Badges**:
    - Tracks user XP and calculates Level (XP / 500).
    - Unlocks badges (logic can be extended).

## API Endpoints (`/api/gamification`)

### 1. Get User Status
`GET /api/gamification/user/status?userId=<ID>`

**Response**:
```json
{
  "level": 1,
  "xp": 320,
  "badges": [],
  "topics": {
    "Stock Market": "easy",
    "Mutual Funds": "medium"
  }
}
```

### 2. Fetch Questions
`GET /api/gamification/questions?topic=<TOPIC>&userId=<ID>&limit=5`

**Response**:
```json
{
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "..."
    }
  ]
}
```

### 3. Submit Quiz
`POST /api/gamification/quiz/submit`

**Body**:
```json
{
  "userId": "test_user_123",
  "topic": "Stock Market",
  "attempted": 5,
  "correct": 4
}
```

**Response**:
```json
{
  "accuracy": 80.0,
  "difficultyUpdate": "increased",
  "newDifficulty": "medium",
  "xpEarned": 40,
  "level": 2,
  "badgesUnlocked": []
}
```

## Setup

1.  **Environment Variables**:
    - `GEMINI_API_KEY`: Required for AI generation.
    - `FIREBASE_SERVICE_ACCOUNT_KEY`: (Optional) Path to service account JSON. If missing, it tries default credentials or falls back to mock mode.
2.  **Dependencies**:
    - `firebase-admin`
    - `google-generativeai`
