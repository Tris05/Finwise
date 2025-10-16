import { NextResponse } from "next/server"
import data from "@/data/loan/assess.json"

export async function POST() {
  return NextResponse.json(data)
}
