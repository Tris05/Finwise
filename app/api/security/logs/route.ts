import { NextResponse } from "next/server"
import data from "@/data/security/logs.json"

export async function GET() {
  return NextResponse.json(data)
}
export async function POST() {
  return NextResponse.json({ ok: true })
}
