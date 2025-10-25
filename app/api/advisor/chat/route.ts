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
 
export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    // Try to get API key from environment, fallback to direct key
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAQZyjL6eaqbbjQbS60dSxDo9tOXd2k4S0"

    console.log("=== CHAT API DEBUG ===")
    console.log("API Key exists:", !!apiKey)
    console.log("API Key length:", apiKey?.length || 0)
    console.log("API Key starts with:", apiKey?.substring(0, 10) || "N/A")
    console.log("Prompt received:", prompt)
    console.log("All env vars with GEMINI:", Object.keys(process.env).filter(key => key.includes('GEMINI')))
    console.log("Using fallback key:", !process.env.GEMINI_API_KEY)
    console.log("=====================")

    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY environment variable")
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }
 
    // Construct the conversation with system context
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are an expert **Financial Advisor AI** who provides accurate, detailed, and structured answers
about Indian finance, taxation, investments, insurance, and related topics in 1500 words.
Always format the answer clearly using Markdown — include sections, bullet points, examples, and tables when helpful.
 
Now answer the user's query:
"${prompt}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500, // limit length of response
      },
    }
 
    // Call Gemini API
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )
 
    if (!res.ok) {
      const err = await res.text()
      console.error("Gemini API error:", err)
      throw new Error(`Gemini API error: ${err}`)
    }

    const data = await res.json()
    console.log("Gemini API response:", data)
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response."

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
 