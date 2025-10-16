import { NextResponse } from "next/server"
import data from "@/data/learning/flashcards.json"

export async function GET() {
  return NextResponse.json(data)
}
