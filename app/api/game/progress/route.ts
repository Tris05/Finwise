import { NextResponse } from "next/server"
import data from "@/data/game/progress.json"

export async function GET() {
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { action, xp } = await req.json()
  
  // Mock response - in a real app, this would update the database
  let response = { ...data }
  
  if (action === "learning_completed" && xp) {
    response.xp += xp
    response.level = Math.floor(response.xp / 100) + 1
    
    // Add learning-specific badges
    if (xp >= 50 && !response.badges.includes("Quiz Champion")) {
      response.badges.push("Quiz Champion")
    }
    if (xp >= 30 && !response.badges.includes("Flashcard Master")) {
      response.badges.push("Flashcard Master")
    }
    
    // Update learning stats
    if (response.learningStats) {
      response.learningStats.totalLearningXP += xp
      response.learningStats.currentStreak += 1
      response.learningStats.longestStreak = Math.max(
        response.learningStats.longestStreak, 
        response.learningStats.currentStreak
      )
    }
  } else if (action === "lesson_saved" && xp) {
    response.xp += xp
    response.level = Math.floor(response.xp / 100) + 1
  }
  
  return NextResponse.json(response)
}
