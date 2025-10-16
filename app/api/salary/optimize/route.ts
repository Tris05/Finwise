import { NextResponse } from "next/server"
import data from "@/data/salary/optimize.json"

export async function POST() {
  return NextResponse.json(data)
}
