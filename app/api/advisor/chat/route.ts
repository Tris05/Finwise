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
import fs from "fs"

const LOG_FILE = path.join(process.cwd(), "agentic_ai", "logs", "chat_api.log")

function logToFile(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}${data ? "\n" + JSON.stringify(data, null, 2) : ""}\n---\n`
  try {
    fs.appendFileSync(LOG_FILE, logEntry)
  } catch (e) {
    console.error("Failed to write to log file:", e)
  }
}

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json()
    } catch (e: any) {
      logToFile("Request JSON parse error", e.message)
      return NextResponse.json({ error: "Invalid JSON in request body", details: e.message }, { status: 400 })
    }

    const { prompt, portfolioSummary, userId } = body
    const apiKey = process.env.GEMINI_API_KEY
    
    logToFile("Request received", { userId, hasPortfolio: !!portfolioSummary, promptLength: prompt?.length })

    if (!apiKey) {
      logToFile("Error: Missing GEMINI_API_KEY")
      return NextResponse.json({ error: "Missing GEMINI_API_KEY environment variable." }, { status: 500 })
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + apiKey,
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
            const rawText = intentData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
            intent = JSON.parse(rawText)
            logToFile("Intent detected", intent)
        } catch (e: any) {
            logToFile("Intent parse error", { error: e.message, raw: intentData?.candidates?.[0]?.content?.parts?.[0]?.text })
        }
    } else {
        const intentError = await intentRes.json().catch(() => ({}))
        logToFile("Intent API Error", intentError)
    }

    let scenarioResults = ""
    // --- STEP 2: Execute Scenario Engine ---
    if (intent.is_scenario && userId) {
        logToFile("Executing scenario engine...")
        const enginePath = path.join(process.cwd(), "agentic_ai", "agents", "advisor_scenario_engine.py")
        const result = spawnSync("python", [enginePath, userId, JSON.stringify(intent)], { encoding: 'utf-8' })

        if (result.status === 0) {
            try {
                const lines = result.stdout.trim().split('\n')
                const lastLine = lines[lines.length - 1]
                const data = JSON.parse(lastLine)
                scenarioResults = `\n\n**Data-Driven Scenario Simulation Results:**\n${JSON.stringify(data, null, 2)}`
                logToFile("Scenario results generated")
            } catch (e: any) {
                logToFile("Engine output parse error", { error: e.message, stdout: result.stdout })
            }
        } else {
            logToFile("Scenario engine error", { stderr: result.stderr, status: result.status })
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
              Provide detailed but concise advice. Use bullet points for readability and keep the overall response to a reasonable length (around 200-300 words). Ensure you finish your sentences and provide a complete conclusion.
              
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
        maxOutputTokens: 1500,
      },
    }

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalBody),
      }
    )

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        logToFile("Gemini API Final Synthesis Error", errorData)
        return NextResponse.json({ 
            error: "Gemini API Error", 
            details: errorData.error?.message || "Check server logs for details" 
        }, { status: res.status });
    }

    const data = await res.json()
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response."
    
    logToFile("Success", { replyLength: reply.length })

    return NextResponse.json({ reply })
  } catch (error: any) {
    logToFile("Unhandled Chat API error", error.message)
    return NextResponse.json({ 
        error: "Internal server error", 
        details: error.message 
    }, { status: 500 })
  }
}
 