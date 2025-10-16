import { NextResponse } from "next/server"
import data from "@/data/credit-cards.json"
export async function GET() {
  return NextResponse.json(data)
}
