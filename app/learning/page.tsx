"use client"

import { AppShell } from "@/components/app-shell"
import { GamificationCard } from "@/components/gamification-card"
import { QueryProvider } from "@/components/providers/query-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const leaderboard = [
  { user: "Aarav", xp: 1240 },
  { user: "Diya", xp: 1180 },
  { user: "Kabir", xp: 990 },
  { user: "Isha", xp: 940 },
  { user: "Rohan", xp: 900 },
]

const badges = ["SIP Starter", "Budget Boss", "Tax Pro", "Credit Smart", "Saver Streak", "Risk Aware"]

export default function LearningPage() {
  return (
    <QueryProvider>
      <AppShell>
        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-balance">Keep Earning XP!</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Complete modules and ask the Advisor questions to unlock badges and level up.
              <div className="mt-3">
                <div className="text-xs mb-1">XP Progress</div>
                <Progress value={64} />
              </div>
            </CardContent>
          </Card>

          <GamificationCard />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Leaderboard (Top 5)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid grid-cols-3 gap-2 font-medium">
                <div>User</div>
                <div className="text-center">XP</div>
                <div className="text-right">Rank</div>
              </div>
              {leaderboard.map((r, idx) => (
                <div key={r.user} className="grid grid-cols-3 gap-2 border-b py-1.5">
                  <div>{r.user}</div>
                  <div className="text-center">{r.xp}</div>
                  <div className="text-right">#{idx + 1}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              {badges.map((b) => (
                <div key={b} className="rounded-md border px-2 py-3 text-center text-xs">
                  {b}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Next Lesson</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              Next: Understanding SIPs 💡 — Learn how systematic investing works and how to set monthly goals.
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </QueryProvider>
  )
}
