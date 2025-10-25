"use client"

import { AppShell } from "@/components/app-shell"
import { GamificationCard } from "@/components/gamification-card"
import { QueryProvider } from "@/components/providers/query-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flashcards } from "@/components/flashcards"
import { Quizzes } from "@/components/quizzes"
import { useQuery } from "@tanstack/react-query"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

const leaderboard = [
  { user: "Aarav", xp: 1240 },
  { user: "Diya", xp: 1180 },
  { user: "Kabir", xp: 990 },
  { user: "Isha", xp: 940 },
  { user: "Rohan", xp: 900 },
]

const badges = ["SIP Starter", "Budget Boss", "Tax Pro", "Credit Smart", "Saver Streak", "Risk Aware"]

type Flashcard = {
  id: string
  category: string
  question: string
  answer: string
  difficulty: string
  xp: number
}

type Quiz = {
  id: string
  title: string
  description: string
  difficulty: string
  questions: any[]
  xp: number
}

function LearningContent() {
  const [activeTab, setActiveTab] = useState("overview")
  const queryClient = useQueryClient()

  const { data: flashcards } = useQuery({
    queryKey: ["flashcards"],
    queryFn: async (): Promise<Flashcard[]> => {
      const res = await fetch("/api/learning/flashcards")
      return res.json()
    },
  })

  const { data: quizzes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: async (): Promise<Quiz[]> => {
      const res = await fetch("/api/learning/quizzes")
      return res.json()
    },
  })

  const updateProgress = useMutation({
    mutationFn: async (xp: number) => {
      const res = await fetch("/api/game/progress", {
        method: "POST",
        body: JSON.stringify({ action: "learning_completed", xp }),
      })
      if (!res.ok) throw new Error("Failed to update progress")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-progress"] })
    },
  })

  const handleLearningComplete = (xp: number) => {
    updateProgress.mutate(xp)
  }

  return (
    <AppShell>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-5">
              <Card className="bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-balance">Keep Earning XP!</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Complete flashcards, quizzes, and ask the Advisor questions to unlock badges and level up.
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
                  <CardTitle>Learning Modules</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border bg-blue-50">
                      <h4 className="font-semibold text-blue-800">📚 Flashcards</h4>
                      <p className="text-blue-600 text-sm">Learn financial concepts with interactive flashcards</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-green-50">
                      <h4 className="font-semibold text-green-800">🧠 Quizzes</h4>
                      <p className="text-green-600 text-sm">Test your knowledge with timed quizzes</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Start with flashcards to learn concepts, then test yourself with quizzes to earn XP and badges!
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="flashcards">
            <Card>
              <CardHeader>
                <CardTitle>Financial Concepts Flashcards</CardTitle>
              </CardHeader>
              <CardContent>
                {flashcards ? (
                  <Flashcards flashcards={flashcards} onComplete={handleLearningComplete} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading flashcards...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <CardTitle>Financial Knowledge Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                {quizzes ? (
                  <Quizzes quizzes={quizzes} onComplete={handleLearningComplete} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading quizzes...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <div className="grid lg:grid-cols-2 gap-5">
              <GamificationCard />
              <Card>
                <CardHeader>
                  <CardTitle>Learning Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-sm text-blue-600">Flashcards</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50">
                      <div className="text-2xl font-bold text-green-600">3</div>
                      <div className="text-sm text-green-600">Quizzes</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>This Week</span>
                      <span className="font-semibold">+150 XP</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>This Month</span>
                      <span className="font-semibold">+450 XP</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </AppShell>
  )
}

export default function LearningPage() {
  return (
    <QueryProvider>
      <LearningContent />
    </QueryProvider>
  )
}
