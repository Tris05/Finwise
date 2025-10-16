import { NextResponse } from "next/server"
import data from "@/data/portfolio-rebalance.json"

export async function POST() {
  return NextResponse.json(data)
}
