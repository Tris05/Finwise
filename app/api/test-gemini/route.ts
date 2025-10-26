import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAQZyjL6eaqbbjQbS60dSxDo9tOXd2k4S0"
    
    console.log("=== TESTING GEMINI API ===")
    console.log("API Key exists:", !!apiKey)
    console.log("API Key length:", apiKey?.length || 0)
    console.log("========================")

    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 })
    }

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
                text: "Return ONLY this JSON: {\"test\": \"success\", \"message\": \"Gemini API is working\"}"
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("Gemini API error:", err)
      return NextResponse.json({ error: `Gemini API error: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    console.log("Gemini API response:", data)
    
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response"
    console.log("Raw reply:", reply)

    return NextResponse.json({ 
      success: true, 
      reply,
      apiKey: apiKey.substring(0, 10) + "..."
    })
  } catch (error: any) {
    console.error("Test API error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
