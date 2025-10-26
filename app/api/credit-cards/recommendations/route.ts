import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userProfile, spendingPatterns, preferences } = await req.json()
    
    // Try to get API key from environment, fallback to direct key
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAQZyjL6eaqbbjQbS60dSxDo9tOXd2k4S0"

    console.log("=== CREDIT CARD RECOMMENDATIONS API DEBUG ===")
    console.log("API Key exists:", !!apiKey)
    console.log("User Profile:", userProfile)
    console.log("Spending Patterns:", spendingPatterns)
    console.log("Preferences:", preferences)
    console.log("=============================================")

    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY environment variable")
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

    // Create a comprehensive prompt for credit card recommendations
    const totalMonthlySpend = (spendingPatterns.dining || 0) + (spendingPatterns.travel || 0) + (spendingPatterns.shopping || 0) + (spendingPatterns.fuel || 0) + (spendingPatterns.groceries || 0) + (spendingPatterns.entertainment || 0) + (spendingPatterns.onlineShopping || 0)
    
    const prompt = `You are a financial advisor. Recommend credit cards based on this user profile:

User Profile:
- Monthly Income: ₹${userProfile.monthlyIncome || 50000}
- Monthly Spending: ₹${userProfile.monthlySpending || 30000}
- Experience: ${userProfile.experience || 'beginner'}

Spending Breakdown (monthly):
- Dining: ₹${spendingPatterns.dining || 0}
- Travel: ₹${spendingPatterns.travel || 0}  
- Shopping: ₹${spendingPatterns.shopping || 0}
- Fuel: ₹${spendingPatterns.fuel || 0}
- Groceries: ₹${spendingPatterns.groceries || 0}
- Entertainment: ₹${spendingPatterns.entertainment || 0}
- Online Shopping: ₹${spendingPatterns.onlineShopping || 0}

Total Monthly Spend: ₹${totalMonthlySpend}

Goals: ${preferences.primaryGoal || 'General rewards'}

Available Cards:
1. HDFC Diners Club Black (Premium) - 4-6% rewards, ₹10,000 fee
2. ICICI Sapphiro (Premium) - 3-4% rewards, ₹5,000 fee  
3. SBI SimplyCLICK (Online) - 5% online rewards, ₹500 fee
4. Axis Flipkart (E-commerce) - 4% Flipkart cashback, ₹500 fee
5. Citi Rewards (No Fee) - 2-3% rewards, ₹0 fee
6. Amex Gold (Premium) - 3-4% rewards, ₹4,500 fee

Analyze their spending patterns and recommend the best 3 cards. Calculate expected monthly rewards based on their actual spending.

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations. Start with { and end with }.

Example response:
{
  "recommendations": [
    {
      "cardId": "sbi-simplyclick",
      "cardName": "SBI SimplyCLICK",
      "reasoning": "Perfect for online shopping with 5% rewards",
      "expectedMonthlyRewards": "₹1,500",
      "roi": "12%",
      "keyBenefits": ["5% online rewards", "Low fee"],
      "matchScore": 90
    }
  ],
  "analysis": {
    "totalMonthlySpend": "₹${totalMonthlySpend}",
    "potentialMonthlyRewards": "₹1,500",
    "annualSavings": "₹18,000"
  },
  "warnings": []
}`

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("Gemini API error:", err)
      throw new Error(`Gemini API error: ${err}`)
    }

    const data = await res.json()
    console.log("Gemini API response:", data)
    
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate credit card recommendations."

    console.log("Raw AI response:", reply)

    // Try to extract JSON from the response (in case AI adds extra text)
    let jsonText = reply.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '')
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '')
    }
    
    // Remove any leading/trailing text and find JSON boundaries
    const jsonStart = jsonText.indexOf('{')
    const jsonEnd = jsonText.lastIndexOf('}')
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1)
    }
    
    // Additional cleanup - remove any remaining non-JSON text
    jsonText = jsonText.replace(/^[^{]*/, '').replace(/[^}]*$/, '')
    
    // Ensure it starts and ends with braces
    if (!jsonText.startsWith('{')) {
      const firstBrace = jsonText.indexOf('{')
      if (firstBrace !== -1) {
        jsonText = jsonText.substring(firstBrace)
      }
    }
    
    if (!jsonText.endsWith('}')) {
      const lastBrace = jsonText.lastIndexOf('}')
      if (lastBrace !== -1) {
        jsonText = jsonText.substring(0, lastBrace + 1)
      }
    }

    console.log("Extracted JSON text:", jsonText)

    // Try to parse the JSON response
    let recommendations
    try {
      recommendations = JSON.parse(jsonText)
      
      // Ensure all required fields exist
      if (!recommendations.recommendations) {
        recommendations.recommendations = []
      }
      if (!recommendations.analysis) {
        recommendations.analysis = {
          totalMonthlySpend: "₹0",
          potentialMonthlyRewards: "₹0",
          annualSavings: "₹0"
        }
      }
      if (!recommendations.warnings) {
        recommendations.warnings = []
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError)
      console.error("Raw response:", reply)
      
      // Create intelligent recommendations based on spending patterns
      const totalSpend = userProfile.monthlySpending || 30000
      const onlineSpend = spendingPatterns.onlineShopping || 0
      const diningSpend = spendingPatterns.dining || 0
      const travelSpend = spendingPatterns.travel || 0
      const fuelSpend = spendingPatterns.fuel || 0
      
      // Calculate potential rewards based on spending patterns
      const onlineRewards = Math.round(onlineSpend * 0.05) // 5% for online
      const diningRewards = Math.round(diningSpend * 0.04) // 4% for dining
      const generalRewards = Math.round((totalSpend - onlineSpend - diningSpend) * 0.02) // 2% for others
      const totalPotentialRewards = onlineRewards + diningRewards + generalRewards
      
      // Determine best cards based on spending patterns
      const recommendations = []
      
      // If high online spending, recommend SBI SimplyCLICK
      if (onlineSpend > 5000) {
        recommendations.push({
          cardId: "sbi-simplyclick",
          cardName: "SBI SimplyCLICK",
          reasoning: `Perfect for your ₹${onlineSpend.toLocaleString()} monthly online spending with 5% rewards`,
          expectedMonthlyRewards: `₹${onlineRewards}`,
          roi: "15%",
          keyBenefits: ["5% online rewards", "Low annual fee", "Fuel surcharge waiver"],
          matchScore: 90
        })
      }
      
      // If high dining spending, recommend Amex Gold
      if (diningSpend > 3000) {
        recommendations.push({
          cardId: "amex-gold",
          cardName: "American Express Gold Card",
          reasoning: `Excellent for your ₹${diningSpend.toLocaleString()} monthly dining with 3X rewards`,
          expectedMonthlyRewards: `₹${Math.round(diningSpend * 0.06)}`,
          roi: "18%",
          keyBenefits: ["3X dining rewards", "Lounge access", "No joining fee"],
          matchScore: 88
        })
      }
      
      // If high travel spending, recommend HDFC Diners Black
      if (travelSpend > 5000) {
        recommendations.push({
          cardId: "hdfc-diners-black",
          cardName: "HDFC Diners Club Black",
          reasoning: `Ideal for your ₹${travelSpend.toLocaleString()} monthly travel with premium benefits`,
          expectedMonthlyRewards: `₹${Math.round(travelSpend * 0.08)}`,
          roi: "20%",
          keyBenefits: ["4X travel rewards", "Unlimited lounge access", "Premium benefits"],
          matchScore: 92
        })
      }
      
      // If moderate spending, recommend Citi Rewards
      if (totalSpend < 25000) {
        recommendations.push({
          cardId: "citi-rewards",
          cardName: "Citi Rewards Credit Card",
          reasoning: "No annual fee with consistent 2% rewards on all your spending",
          expectedMonthlyRewards: `₹${Math.round(totalSpend * 0.02)}`,
          roi: "10%",
          keyBenefits: ["No annual fee", "2% on all spends", "Easy to use"],
          matchScore: 80
        })
      }
      
      // If high overall spending, recommend ICICI Sapphiro
      if (totalSpend > 40000) {
        recommendations.push({
          cardId: "icici-sapphiro",
          cardName: "ICICI Bank Sapphiro",
          reasoning: `Great for your ₹${totalSpend.toLocaleString()} monthly spending with premium benefits`,
          expectedMonthlyRewards: `₹${Math.round(totalSpend * 0.04)}`,
          roi: "16%",
          keyBenefits: ["3X rewards", "Movie benefits", "Lounge access"],
          matchScore: 85
        })
      }
      
      // Fallback if no specific patterns match
      if (recommendations.length === 0) {
        recommendations.push({
          cardId: "citi-rewards",
          cardName: "Citi Rewards Credit Card",
          reasoning: "Good all-around card with no annual fee and consistent rewards",
          expectedMonthlyRewards: `₹${Math.round(totalSpend * 0.02)}`,
          roi: "8%",
          keyBenefits: ["No annual fee", "2% on all spends", "Easy to use"],
          matchScore: 75
        })
      }
      
      return NextResponse.json({ 
        recommendations: {
          recommendations: recommendations.slice(0, 3), // Top 3
          analysis: {
            totalMonthlySpend: `₹${totalSpend.toLocaleString()}`,
            potentialMonthlyRewards: `₹${totalPotentialRewards}`,
            annualSavings: `₹${totalPotentialRewards * 12}`
          },
          warnings: ["AI parsing failed, showing intelligent recommendations based on your spending patterns"]
        }
      })
    }

    return NextResponse.json({ recommendations })
  } catch (error: any) {
    console.error("Credit Card Recommendations API error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
