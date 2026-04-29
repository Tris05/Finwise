"use client"

import { AppShell } from "@/components/app-shell"
import { GamificationCard } from "@/components/gamification-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flashcards } from "@/components/flashcards"
import { Quizzes } from "@/components/quizzes"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useGameProgress } from "@/hooks/useGameProgress"

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

  // ── Live game progress from Firestore ──────────────────────────────────────
  const {
    xp,
    level,
    badges,
    learningStats,
    weeklyXP,
    monthlyXP,
    loading: progressLoading,
    earnXP,
  } = useGameProgress()

  const xpPct = Math.min(100, xp % 100)

  // ── Flashcards & Quizzes from API ──────────────────────────────────────────
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

  const handleFlashcardComplete = (xp: number) => earnXP(xp, "flashcard")
  const handleQuizComplete = (xp: number) => earnXP(xp, "quiz")

  return (
    <AppShell>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ───────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-5">
            {/* XP Progress card */}
            <Card className="bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-balance">Keep Earning XP!</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Complete flashcards, quizzes, and ask the Advisor questions to unlock badges and level up.
                <div className="mt-3">
                  {progressLoading ? (
                    <Skeleton className="h-2 w-full" />
                  ) : (
                    <>
                      <div className="flex justify-between text-xs mb-1">
                        <span>XP Progress — Level {level}</span>
                        <span>{xpPct} / 100</span>
                      </div>
                      <Progress value={xpPct} />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gamification card (level, streak, stats) */}
            <GamificationCard />

            {/* Badges — only earned ones */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Your Badges</CardTitle>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-md" />
                    ))}
                  </div>
                ) : badges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No badges yet — complete flashcards and quizzes to earn your first one!
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {badges.map((b) => (
                      <div key={b} className="rounded-md border px-2 py-3 text-center text-xs font-medium">
                        {b}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning modules */}
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

        {/* ── FLASHCARDS ─────────────────────────────────────────────────── */}
        <TabsContent value="flashcards">
          <Card>
            <CardHeader>
              <CardTitle>Financial Concepts Flashcards</CardTitle>
            </CardHeader>
            <CardContent>
              {flashcards ? (
                <Flashcards flashcards={flashcards} onComplete={handleFlashcardComplete} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading flashcards...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── QUIZZES ────────────────────────────────────────────────────── */}
        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <CardTitle>Financial Knowledge Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              {quizzes ? (
                <Quizzes quizzes={quizzes} onComplete={handleQuizComplete} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading quizzes...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PROGRESS ───────────────────────────────────────────────────── */}
        <TabsContent value="progress">
          <div className="grid lg:grid-cols-2 gap-5">
            <GamificationCard />
            <Card>
              <CardHeader>
                <CardTitle>Learning Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progressLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-blue-50">
                        <div className="text-2xl font-bold text-blue-600">
                          {learningStats?.flashcardsCompleted ?? 0}
                        </div>
                        <div className="text-sm text-blue-600">Flashcards</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-50">
                        <div className="text-2xl font-bold text-green-600">
                          {learningStats?.quizzesCompleted ?? 0}
                        </div>
                        <div className="text-sm text-green-600">Quizzes</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>This Week</span>
                        <span className="font-semibold">
                          {weeklyXP > 0 ? `+${weeklyXP} XP` : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>This Month</span>
                        <span className="font-semibold">
                          {monthlyXP > 0 ? `+${monthlyXP} XP` : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Learning XP</span>
                        <span className="font-semibold">
                          {learningStats?.totalLearningXP ?? 0} XP
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}

export default function LearningPage() {
  return <LearningContent />
}
