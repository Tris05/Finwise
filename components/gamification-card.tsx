"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Brain, Trophy, Flame } from "lucide-react"
import { useGameProgress } from "@/hooks/useGameProgress"

export function GamificationCard() {
  const { xp, level, streak, badges, learningStats, loading } = useGameProgress()

  const xpPct = Math.min(100, xp % 100)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gamification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gamification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          Level: {level} • Streak: {streak} days
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{xp % 100} / 100 XP to next level</span>
            <span>Lv {level}</span>
          </div>
          <Progress value={xpPct} />
        </div>

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

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <Badge key={b} variant="secondary">
                {b}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
