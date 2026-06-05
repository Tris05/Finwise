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
import crypto from "crypto"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

function getCacheKey(prompt: string, portfolioSummary: string) {
  const data = `${prompt}|${portfolioSummary || ""}`
  return crypto.createHash("sha256").update(data).digest("hex")
}

function findDemoResponse(prompt: string): string | null {
  if (!prompt) return null
  try {
    const filePath = path.join(process.cwd(), "data", "demo-prompts.json")
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8")
      const prompts = JSON.parse(fileContent)
      
      const cleanPrompt = prompt.trim().toLowerCase().replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ")
      
      for (const item of prompts) {
        const cleanItemPrompt = item.prompt.trim().toLowerCase().replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ")
        if (cleanPrompt === cleanItemPrompt) {
          return item.answer
        }
      }
    }
  } catch (err: any) {
    logToFile("Error reading demo-prompts.json in helper", err.message)
  }
  return null
}

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

// Robust fallback Gemini API Caller
async function callGeminiWithFallback(body: any, apiKey: string) {
  const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"]
  let lastError: any = null

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json()
        } catch (e) {
          const errorText = await response.text().catch(() => "No response body")
          errorData = { error: { message: errorText } }
        }
        lastError = errorData
        logToFile(`Gemini API error with model ${model}`, errorData)
        continue
      }

      const data = await response.json()
      logToFile(`Gemini API success with model ${model}`)
      return { data, success: true }
    } catch (error: any) {
      lastError = { error: { message: error.message } }
      logToFile(`Network or fetch error with model ${model}`, error.message)
      continue
    }
  }

  return { success: false, error: lastError }
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

    // --- STEP -1: Check for Demo Prompts ---
    const demoReply = findDemoResponse(prompt)
    if (demoReply) {
      logToFile("Demo prompt match found, returning dummy answer directly", { prompt })
      return NextResponse.json({ reply: demoReply })
    }

    if (!apiKey) {
      logToFile("Error: Missing GEMINI_API_KEY")
      return NextResponse.json({ error: "Missing GEMINI_API_KEY environment variable." }, { status: 500 })
    }

    // --- STEP 0: Check Cache ---
    const cacheKey = getCacheKey(prompt, portfolioSummary)
    try {
      const cacheRef = doc(db, "chat_cache", cacheKey)
      const cacheSnap = await getDoc(cacheRef)
      if (cacheSnap.exists()) {
        const cacheData = cacheSnap.data()
        const age = Date.now() - (cacheData.cached_at || 0)
        const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000
        if (age < TWELVE_HOURS_MS) {
          logToFile("Cache hit", { cacheKey, ageMs: age })
          return NextResponse.json({ reply: cacheData.reply })
        } else {
          logToFile("Cache expired", { cacheKey, ageMs: age })
        }
      }
    } catch (cacheErr: any) {
      logToFile("Cache lookup failed", cacheErr.message)
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

    const intentResult = await callGeminiWithFallback(intentBody, apiKey)
    let intent = { is_scenario: false }
    if (intentResult.success) {
        try {
            const rawText = intentResult.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
            intent = JSON.parse(rawText)
            logToFile("Intent detected", intent)
        } catch (e: any) {
            logToFile("Intent parse error", { error: e.message, raw: intentResult.data?.candidates?.[0]?.content?.parts?.[0]?.text })
        }
    } else {
        logToFile("Intent API Error (Falling back to default chat)", intentResult.error)
    }

    let scenarioResults = ""
    // --- STEP 2: Execute Scenario Engine ---
    if (intent.is_scenario && userId) {
        logToFile("Executing scenario engine...")
        
        // Try calling Flask backend API first (best for Vercel/Production deployment)
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
        let success = false;
        try {
            const apiRes = await fetch(`${API_BASE}/simulate_scenario`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, intent }),
            });
            if (apiRes.ok) {
                const data = await apiRes.json();
                scenarioResults = `\n\n**Data-Driven Scenario Simulation Results:**\n${JSON.stringify(data, null, 2)}`;
                logToFile("Scenario results generated via Python API backend");
                success = true;
            } else {
                const errText = await apiRes.text().catch(() => "");
                throw new Error(`API returned status ${apiRes.status}: ${errText}`);
            }
        } catch (apiErr: any) {
            logToFile("Python API backend simulation failed, falling back to local spawnSync:", apiErr.message);
        }

        if (!success) {
            // Fallback to local python child process spawn (for local development)
            const enginePath = path.join(process.cwd(), "agentic_ai", "agents", "advisor_scenario_engine.py")
            const result = spawnSync("python", [enginePath, userId, JSON.stringify(intent)], { encoding: 'utf-8' })
            if (result.status === 0) {
                try {
                    const lines = result.stdout.trim().split('\n')
                    const lastLine = lines[lines.length - 1]
                    const data = JSON.parse(lastLine)
                    scenarioResults = `\n\n**Data-Driven Scenario Simulation Results:**\n${JSON.stringify(data, null, 2)}`
                    logToFile("Scenario results generated via local spawnSync fallback")
                } catch (e: any) {
                    logToFile("Engine output parse error during spawnSync fallback", { error: e.message, stdout: result.stdout })
                }
            } else {
                logToFile("Scenario engine error during spawnSync fallback", { stderr: result.stderr, status: result.status })
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

    const synthResult = await callGeminiWithFallback(finalBody, apiKey)

    if (!synthResult.success) {
        const errorMsg = synthResult.error?.error?.message || "";
        let friendlyDetails = "We're experiencing issues connecting to our AI Advisor. Please try again in a few moments.";
        
        if (/quota|429|limit/i.test(errorMsg)) {
            friendlyDetails = "AI Advisor rate limit reached (Quota Exceeded). Please wait a few seconds before trying again.";
        } else if (/unavailable|503|demand/i.test(errorMsg)) {
            friendlyDetails = "The AI Advisor is temporarily unavailable due to high demand. Please try again in a moment.";
        } else if (/key/i.test(errorMsg)) {
            friendlyDetails = "Configuration error: The AI Advisor API key is missing or invalid.";
        }

        logToFile("Gemini API Final Synthesis Error", synthResult.error)
        return NextResponse.json({ 
            error: "AI service error", 
            details: friendlyDetails 
        }, { status: 503 });
    }

    const data = synthResult.data
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response."
    
    logToFile("Success", { replyLength: reply.length })

    // --- STEP 4: Save to Cache ---
    try {
      const cacheRef = doc(db, "chat_cache", cacheKey)
      await setDoc(cacheRef, {
        prompt,
        portfolioSummary: portfolioSummary || "",
        reply,
        cached_at: Date.now()
      })
      logToFile("Cache saved", { cacheKey })
    } catch (cacheSaveErr: any) {
      logToFile("Cache save failed", cacheSaveErr.message)
    }

    return NextResponse.json({ reply })
  } catch (error: any) {
    logToFile("Unhandled Chat API error", error.message)
    return NextResponse.json({ 
        error: "Internal server error", 
        details: error.message 
    }, { status: 500 })
  }
}
 