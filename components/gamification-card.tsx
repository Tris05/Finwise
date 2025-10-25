"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Brain, Trophy, Flame } from "lucide-react"

type LearningStats = {
  flashcardsCompleted: number
  quizzesCompleted: number
  totalLearningXP: number
  currentStreak: number
  longestStreak: number
}

type GameProgress = { 
  xp: number
  level: number
  badges: string[]
  streak: number
  learningStats: LearningStats
}

export function GamificationCard() {
  const { data } = useQuery({
    queryKey: ["game-progress"],
    queryFn: async (): Promise<GameProgress> => {
      const res = await fetch("/api/game/progress")
      return res.json()
    },
  })

  const xpPct = Math.min(100, (data?.xp ?? 0) % 100)
  const learningStats = data?.learningStats

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gamification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          Level: {data?.level ?? 1} • Streak: {data?.streak ?? 0} days
        </div>
        <Progress value={xpPct} />
        
        {learningStats && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Learning Progress</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span>{learningStats.flashcardsCompleted} Flashcards</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-green-500" />
                <span>{learningStats.quizzesCompleted} Quizzes</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>{learningStats.totalLearningXP} Learning XP</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{learningStats.currentStreak} Day Streak</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {(data?.badges ?? []).map((b) => (
            <Badge key={b} variant="secondary">
              {b}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
