"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

type GameProgress = { xp: number; level: number; badges: string[]; streak: number }

export function GamificationCard() {
  const { data } = useQuery({
    queryKey: ["game-progress"],
    queryFn: async (): Promise<GameProgress> => {
      const res = await fetch("/api/game/progress")
      return res.json()
    },
  })

  const xpPct = Math.min(100, (data?.xp ?? 0) % 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gamification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          Level: {data?.level ?? 1} • Streak: {data?.streak ?? 0} days
        </div>
        <Progress value={xpPct} />
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
