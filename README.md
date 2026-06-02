# FinWise — AI Financial Coaching Platform (Indian Context)

FinWise is a comprehensive, production-ready AI-driven financial advisor and planner tailored specifically for the Indian financial context (INR, NSE/BSE markets, Section 80C tax rules, and local bank comparisons). It leverages Next.js on the frontend and a Python Flask backend executing agentic AI workflows, Monte Carlo simulations, and LayoutLM document intelligence.

---

## 🚀 Commands to Run

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **Python** (v3.10 or later)
- **Poppler** (for PDF parsing and OCR, optional but recommended)

### 2. Frontend Setup (Next.js)
```bash
# Navigate to the project root directory
cd Finwise

# Install frontend dependencies
npm install

# Start the local development server
npm run dev
```
The Next.js site will be available at `http://localhost:3000`.

### 3. Backend Setup (Flask Server)
```bash
# Navigate to the backend directory
cd Finwise/backend

# Install python dependencies
pip install -r requirements.txt

# Start the Flask backend server
python app.py
```
The Python Flask server will start on `http://localhost:8000`.


## 🖥️ Page-by-Page Features

### 📊 Dashboard (`/dashboard`)
- **Portfolio Analytics**: Aggregates and displays current net worth, investments breakdown, and savings rates in INR.
- **Market Tickers**: Live charts and tickers tracking major Indian indices like Nifty 50 and Sensex.
- **Recent Activity**: Displays recent transaction history and pending financial tasks.

### 💬 AI Advisor Chat (`/advisor`)
- **Conversational Coach**: Interactive chat panel with typing micro-animations and markdown support.
- **What-If Scenario Simulation**: Uses LLM intent detection. If the user asks a "What-If" question (e.g. *"What if I invest ₹10,000 in crypto?"*), it automatically queries the **Monte Carlo Simulation Engine** using historical volatility parameters to project worst-case drawdowns and expected gains.
- **Demo Prompts**: 12 pre-loaded prompt chips for quick product demonstrations.

### 📈 Investments & Credit Cards (`/investments`)
- **Holdings Breakdown**: Visually depicts holdings using interactive Recharts pie/bar charts.
- **Smart Rebalancer**: Executes a portfolio optimization check, returning recommended target weights, SHAP value feature explanations, and LLM advice.
- **Credit Card Optimizer**: Recommends the best 3 Indian credit cards (e.g. HDFC Diners, SBI SimplyCLICK, Axis Flipkart) based on the user's monthly spending breakdown (dining, shopping, travel).

### 📄 Document Analysis (`/documents`)
- **OCR Analysis**: Processes uploaded financial PDFs or images (e.g. bank statements, salary slips).
- **Interactive Overlay Canvas**: Automatically overlays bounding boxes on the document images using a LayoutLM model, color-coding high-risk, medium-risk, and low-risk clauses.
- **Complete PII Redaction**: Automatically redacts sensitive fields (PAN, Aadhaar, email, phone, bank account numbers) locally before sending text to the LLM.
- **AI Jargon Summarizer**: Translates complex clauses into simple summaries, explaining importance, risks, and next steps.

### 💸 Salary Optimizer (`/salary`)
- **Take-Home Calculator**: Estimates net income based on old vs new tax regimes.
- **Growth Tracker**: Simulates future salary growth compound projection.
- **Savings Allocation**: Suggests automated savings plans based on Indian tax deductions (Section 80C).

### 🏦 Loan & EMI Planner (`/loan`)
- **EMI Simulator**: Dynamically calculates EMI values, total interest paid, and shows an interactive amortization chart.
- **Interest Comparison**: Lists and compares current home/car/education loan rates across major Indian banks (SBI, HDFC, ICICI, Axis, Kotak).
- **Affordability Assessor**: Checks debt-to-income ratio, warning users if a loan is too risky and recommending mitigations.

### 🎓 Gamified Learning (`/learning`)
- **Knowledge Modules**: Tracks progress through financial literacy paths (budgeting, tax planning, asset classes).
- **Quizzes & Flashcards**: Reinforces concepts with interactive quizzes and flashcards.
- **Engagement Mechanics**: Earn XP, collect achievements/badges, and maintain daily learning streaks.

### 🔒 Security Logs (`/security`)
- **Access Logs**: Monitors account logins with location, status, and IP addresses.
- **2FA Toggle**: Quick configurations for enabling/disabling multi-factor authentication.
- **Suspicious Activity CTAs**: Acknowledge logins or immediately report suspicious accesses.

---

## ☁️ Vercel Deployment Guide

FinWise is designed to be deployed as a multi-service structure:
1. **Frontend (Next.js)** is hosted on **Vercel**.
2. **Backend (Python Flask Server)** is hosted on a service that supports persistent runtimes and Python packages (e.g., **Railway**, **Render**, **AWS EC2**, or **Google Cloud Run**).

### Deploying the Next.js Frontend to Vercel
1. Push the code repository to GitHub/GitLab/Bitbucket.
2. Link the repository to your Vercel Dashboard.
3. In the project **Environment Variables** settings, configure the following keys:
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_API_BASE` (Point this to your deployed Flask backend URL, e.g., `https://finwise-backend.up.railway.app`)
   - Firebase public keys (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`, etc.)
4. Click **Deploy**. Vercel will automatically package the App Router routes and deploy them globally.

### Deploying the Python Flask Backend
1. Ensure the Flask server environment has Python 3.10+ and Poppler binary installed (for rendering PDFs).
2. Configure environment variables on the backend hosting provider:
   - `GEMINI_API_KEY`
   - `ALLOWED_ORIGINS` (Point this to your Next.js Vercel URL, e.g., `https://finwise.vercel.app`)
3. Create a `serviceAccountKey.json` containing your Firebase Admin credentials in the `Finwise/backend` folder or upload it securely.
4. Deploy the backend service. It will listen on port 8000 or the `$PORT` environment variable specified by the host.
