import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { prompt } = await req.json()
  const reply = `Based on your query: "${prompt}". For a moderate risk profile, consider allocating ~60% to equities (stocks + mutual funds), 25% to fixed income (PPF/FD), 10% to gold, and 5% to crypto. Keep an emergency fund of 6 months.`

  return NextResponse.json({ reply })
}
