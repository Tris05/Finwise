import { NextResponse } from "next/server"
import data from "@/data/docs/sample-parse.json"

export async function POST() {
  return NextResponse.json(data)
}
