// import { NextResponse } from "next/server"
 
// export async function POST(req: Request) {
//   try {
//     const { prompt } = await req.json()
 
//     // Use your Gemini API key (store in .env.local)
//     const apiKey = process.env.GEMINI_API_KEY
//     if (!apiKey) {
//       return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
//     }
 
//     // Make call to Gemini
//     const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [
//           {
//             role: "user",
//             parts: [{ text: prompt }],
//           },
//         ],
//       }),
//     })
 
//     if (!response.ok) {
//       const errorText = await response.text()
//       throw new Error(`Gemini API error: ${errorText}`)
//     }
 
//     const data = await response.json()
//     const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn’t generate a response."
 
//     return NextResponse.json({ reply })
//   } catch (error) {
//     console.error(error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }
import { NextResponse } from "next/server"
import { spawnSync } from "child_process"
import path from "path"

export async function POST(req: Request) {
  try {
    const { prompt, portfolioSummary, userId } = await req.json()
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAQZyjL6eaqbbjQbS60dSxDo9tOXd2k4S0"

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

    // --- STEP 1: Intent Detection ---
    const intentBody = {
      contents: [{
        role: "user",
        parts: [{
          text: `Analyze if the user is asking for a "What-If" financial scenario simulation.
          Examples: "What if I invest 10k in BTC?", "What if market crashes?", "Portfolio in 5 years?"
          
          Return JSON ONLY:
          {
            "is_scenario": true,
            "scenario_type": "investment_addition" | "market_stress" | "long_term_projection",
            "modification": { "type": "add" | "crash", "category": "crypto" | "equity" | "gold", "amount": number },
            "horizon_days": number (default 365)
          }
          Else: { "is_scenario": false }
          
          Query: "${prompt}"`
        }]
      }],
      generationConfig: { response_mime_type: "application/json" }
    }

    const intentRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intentBody),
      }
    )

    let intent = { is_scenario: false }
    if (intentRes.ok) {
        const intentData = await intentRes.json()
        try {
            intent = JSON.parse(intentData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}")
        } catch (e) {
            console.error("Intent parse error:", e)
        }
    }

    let scenarioResults = ""
    // --- STEP 2: Execute Scenario Engine ---
    if (intent.is_scenario && userId) {
        const enginePath = path.join(process.cwd(), "agentic_ai", "agents", "advisor_scenario_engine.py")
        const result = spawnSync("python", [enginePath, userId, JSON.stringify(intent)], { encoding: 'utf-8' })

        if (result.status === 0) {
            try {
                const lines = result.stdout.trim().split('\n')
                const lastLine = lines[lines.length - 1]
                const data = JSON.parse(lastLine)
                scenarioResults = `\n\n**Data-Driven Scenario Simulation Results:**\n${JSON.stringify(data, null, 2)}`
            } catch (e) {
                console.error("Engine parse error:", e)
            }
        }
    }

    // --- STEP 3: Final Synthesis ---
    const finalBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are an expert **Financial Advisor AI**.
              
              **User's Current Portfolio Context:**
              ${portfolioSummary || "No portfolio data provided."}
              
              ${scenarioResults ? `**Simulation Context (1-Year Historical Real-Time Data):**\n${scenarioResults}\n\nUse these simulation figures for your recommendation.` : "Note: Base your answer on general financial principles."}
              
              Query: "${prompt}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalBody),
      }
    )

    if (!res.ok) throw new Error("Gemini synthesis error")

    const data = await res.json()
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response."

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
 