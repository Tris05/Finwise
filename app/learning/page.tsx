"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle, Trophy, BarChart3, TrendingUp, Landmark, CreditCard, ShieldAlert, Sparkles, BrainCircuit, ArrowRight, Home } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"

// Backend Base URL - Change this if backend port differs
const BACKEND_URL = "http://localhost:8000/api/gamification"

type UserStatus = {
  level: number
  xp: number
  badges: string[]
  topics: Record<string, string> // topic -> difficulty
}

type Question = {
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

const TOPICS = [
  { id: "Stocks", label: "Stocks", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "Mutual Funds", label: "Mutual Funds", icon: BarChart3, color: "text-green-500", bg: "bg-green-50" },
  { id: "Banking", label: "Banking & Fixed Income", icon: Landmark, color: "text-purple-500", bg: "bg-purple-50" },
  { id: "Credit", label: "Credit & Loans", icon: CreditCard, color: "text-orange-500", bg: "bg-orange-50" },
  { id: "Risk", label: "Risk & Returns", icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50" },
]

export default function GrowYourKnowledgePage() {
  // State
  const [stage, setStage] = useState<"TOPICS" | "LOADING" | "QUIZ" | "RESULTS">("TOPICS")
  const [activeTab, setActiveTab] = useState<"RESULTS" | "REVIEW">("RESULTS")
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)

  // Quiz State
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [userResponses, setUserResponses] = useState<{ question: string, options: string[], selected: string, correct: string }[]>([])
  const [score, setScore] = useState(0)
  const [quizError, setQuizError] = useState<string | null>(null)

  // Result State
  const [resultData, setResultData] = useState<any>(null)
  const [explanations, setExplanations] = useState<{ question: string, explanation: string }[]>([])
  const [explaining, setExplaining] = useState(false)
  const [adaptiveFeedback, setAdaptiveFeedback] = useState<string | null>(null)
  const [isContinuing, setIsContinuing] = useState(false)

  // Fetch User Status on Mount
  useEffect(() => {
    fetchUserStatus()
  }, [])

  const fetchUserStatus = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/user/status?userId=test_user_123`)
      if (res.ok) {
        const data = await res.json()
        setUserStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch user status", error)
    }
  }

  const startQuiz = async (topic: string) => {
    setSelectedTopic(topic)
    setStage("LOADING")
    setQuizError(null)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedOption(null)
    setUserResponses([])
    setExplanations([])

    try {
      const res = await fetch(`${BACKEND_URL}/questions?topic=${encodeURIComponent(topic)}&userId=test_user_123`)
      if (res.ok) {
        const data = await res.json()
        const fetchedQuestions = data.questions || []

        // Strict Constraint: No placeholder questions allowed
        const isPlaceholder = (q: any) =>
          q.question?.includes("Feedback") ||
          q.question?.includes("Fallback") ||
          q.correct_answer?.includes("Feature A")

        const validQuestions = fetchedQuestions.filter((q: any) => !isPlaceholder(q)).slice(0, 5)

        if (validQuestions.length > 0) {
          setQuestions(validQuestions)
          setStage("QUIZ")
        } else {
          setQuizError("No valid questions found for this topic. Please try again later.")
          setStage("TOPICS")
        }
      } else {
        setQuizError("Unable to fetch quiz questions. Please check your connection.")
        setStage("TOPICS")
      }
    } catch (error) {
      setQuizError("A network error occurred while preparing your quiz.")
      setStage("TOPICS")
    }
  }

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option)
  }

  const handleNextQuestion = () => {
    if (!selectedOption) return

    // Track answer
    const currentQ = questions[currentQuestionIndex]
    const updatedResponses = [...userResponses, {
      question: currentQ.question,
      options: currentQ.options,
      selected: selectedOption,
      correct: currentQ.correct_answer
    }]
    setUserResponses(updatedResponses)

    if (selectedOption === currentQ.correct_answer) {
      setScore(s => s + 1)
    }

    // Move to next or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1)
      setSelectedOption(null)
    } else {
      finishQuiz(updatedResponses)
    }
  }

  const finishQuiz = async (finalResponses: any[]) => {
    setStage("LOADING")
    const finalScore = finalResponses.filter(r => r.selected === r.correct).length

    try {
      // 1. Submit Stats
      const res = await fetch(`${BACKEND_URL}/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "test_user_123",
          topic: selectedTopic,
          attempted: questions.length,
          correct: finalScore
        })
      })

      if (res.ok) {
        const data = await res.json()
        setResultData(data)
        setStage("RESULTS")
        fetchUserStatus() // Refresh background stats

        // 2. Fetch AI Explanation (Async, non-blocking for result view)
        setExplaining(true)
        const explainRes = await fetch(`${BACKEND_URL}/quiz/explain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ results: finalResponses })
        })
        if (explainRes.ok) {
          const explainData = await explainRes.json()
          setExplanations(explainData.explanation || [])
        }
        setExplaining(false)
      } else {
        setQuizError("Failed to submit results. Please try again.")
        setStage("TOPICS")
      }
    } catch (error) {
      setQuizError("Network error during submission.")
      setStage("TOPICS")
    }
  }

  const handleContinueJourney = async () => {
    if (!selectedTopic) return
    setIsContinuing(true)
    setAdaptiveFeedback(null)

    try {
      const res = await fetch(`${BACKEND_URL}/quiz/continue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "test_user_123", topic: selectedTopic })
      })

      if (res.ok) {
        const data = await res.json()
        setAdaptiveFeedback(data.feedback)

        // Show feedback briefly before starting next quiz
        setTimeout(() => {
          setQuestions(data.questions)
          setCurrentQuestionIndex(0)
          setScore(0)
          setSelectedOption(null)
          setUserResponses([])
          setExplanations([])
          setStage("QUIZ")
          setIsContinuing(false)
          setAdaptiveFeedback(null)
        }, 2000)
      } else {
        setQuizError("Failed to fetch next level. Please try again.")
        setIsContinuing(false)
      }
    } catch (error) {
      setQuizError("Network error while continuing.")
      setIsContinuing(false)
    }
  }

  // --- UI COMPONENTS ---

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Grow Your Knowledge</h1>
        <p className="text-muted-foreground mt-1 text-lg">Master finance with AI-personalized modules</p>
      </div>

      {userStatus && (
        <Card className="w-full md:w-auto min-w-[240px] border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-extrabold text-xl text-primary">Level {userStatus.level}</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 px-3 py-1 text-sm font-bold">
                {userStatus.xp} XP
              </Badge>
            </div>
            <Progress value={(userStatus.xp % 500) / 5} className="h-2.5 bg-primary/10" />
            <div className="text-xs text-muted-foreground text-right font-medium">
              {500 - (userStatus.xp % 500)} XP to reach Level {userStatus.level + 1}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderTopics = () => (
    <>
      {quizError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <ShieldAlert className="w-6 h-6" />
          <p className="font-medium">{quizError}</p>
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {TOPICS.map((topic) => {
          const Icon = topic.icon
          const difficulty = userStatus?.topics?.[topic.id] || "easy"

          return (
            <Card
              key={topic.id}
              className="hover:shadow-2xl transition-all cursor-pointer border-l-[6px] group active:scale-95 duration-200 overflow-hidden"
              style={{ borderLeftColor: difficulty === 'hard' ? '#ef4444' : difficulty === 'medium' ? '#eab308' : '#22c55e' }}
              onClick={() => startQuiz(topic.id)}
            >
              <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex justify-between items-start">
                  <div className={`p-4 rounded-2xl ${topic.bg} group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 ${topic.color}`} />
                  </div>
                  <Badge variant="secondary" className={`
                    uppercase text-[11px] font-bold tracking-widest px-2.5 py-0.5
                    ${difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                      difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
                  `}>
                    {difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <CardTitle className="text-2xl mb-2 group-hover:text-primary transition-colors font-bold tracking-tight">{topic.label}</CardTitle>
                <CardDescription className="text-base text-muted-foreground/80 leading-snug">
                  Explore {topic.label.toLowerCase()} concepts with interactive {difficulty} level challenges.
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center p-12 h-[65vh] animate-in fade-in duration-500">
      <div className="relative mb-8">
        <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-primary animate-bounce" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">Preparing Knowledge Quest...</p>
      <p className="text-muted-foreground mt-3 text-lg animate-pulse">Syncing with AI Financial Engine</p>
    </div>
  )

  const renderQuiz = () => {
    if (questions.length === 0) return null

    const currentQ = questions[currentQuestionIndex]

    return (
      <div className="max-w-3xl mx-auto py-6 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center mb-8 bg-secondary/20 p-4 rounded-2xl">
          <Badge variant="outline" className="text-lg px-4 py-1.5 font-bold bg-white text-primary border-primary/30">
            {currentQuestionIndex + 1} / {questions.length}
          </Badge>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{selectedTopic}</span>
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 font-bold" onClick={() => setStage("TOPICS")}>
              Abandon
            </Button>
          </div>
        </div>

        <div className="space-y-1 mb-10 text-right">
          <Progress value={((currentQuestionIndex) / questions.length) * 100} className="h-3 rounded-full bg-secondary" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-tighter">Progress Meter</span>
        </div>

        <Card className="mb-10 overflow-hidden border-2 border-primary/5 shadow-xl">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-10 leading-tight text-center">
              {currentQ.question}
            </h2>

            <div className="grid gap-5">
              {currentQ.options.map((option, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  className={`
                    p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-5 group/opt
                    ${selectedOption === option
                      ? "border-primary bg-primary/5 shadow-inner scale-[1.02]"
                      : "border-secondary/30 bg-secondary/5 hover:bg-primary/5 hover:border-primary/20"
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-colors
                    ${selectedOption === option
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-muted-foreground/20 text-muted-foreground/40 group-hover/opt:border-primary/40 group-hover/opt:text-primary/60"}
                  `}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={`text-xl font-semibold transition-colors ${selectedOption === option ? "text-primary" : "text-muted-foreground group-hover/opt:text-foreground"}`}>
                    {option}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleNextQuestion}
            disabled={!selectedOption}
            className="w-full md:w-3/4 py-8 text-xl font-bold rounded-2xl shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
          >
            {currentQuestionIndex === questions.length - 1 ? "Complete Quiz & Get Insights" : "Next Challenge"}
          </Button>
        </div>
      </div>
    )
  }

  const renderResult = () => {
    if (!resultData) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto py-8"
      >
        {/* HERO SECTION */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-6 flex justify-center relative"
          >
            <div className="bg-gradient-to-tr from-yellow-400 to-amber-200 p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(234,179,8,0.3)] relative z-10">
              <Trophy className="w-16 h-16 text-yellow-900 drop-shadow-md" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute inset-0 bg-yellow-400/30 blur-3xl rounded-full scale-150"
            />
          </motion.div>

          <h2 className="text-5xl font-black mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Legendary Effort!
          </h2>
          <p className="text-xl text-muted-foreground font-medium">
            You just leveled up your financial IQ in <span className="text-primary font-bold">"{selectedTopic}"</span>
          </p>
        </div>

        {/* TABS FOR RESULTS / REVIEW */}
        <div className="flex bg-slate-200/50 p-1 rounded-2xl mb-8 max-w-sm mx-auto">
          <button
            onClick={() => setActiveTab("RESULTS")}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${activeTab === 'RESULTS' ? 'bg-white shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab("REVIEW")}
            className={`flex-1 py-3 px-6 rounded-xl font-bold transition-all ${activeTab === 'REVIEW' ? 'bg-white shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Review
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "RESULTS" ? (
            <motion.div
              key="results-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <motion.div whileHover={{ y: -5 }} className="group">
                  <Card className="h-full border-none shadow-xl bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-900/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">
                      <TrendingUp className="w-12 h-12 text-green-600" />
                    </div>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <span className="text-sm font-black text-green-700/60 uppercase tracking-widest mb-1">XP EARNED</span>
                      <span className="text-4xl font-black text-green-600">+{resultData.xpEarned}</span>
                      <div className="mt-2 w-full h-1 bg-green-200 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: 0.5, duration: 1 }} className="h-full bg-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="group">
                  <Card className="h-full border-none shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-900/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">
                      <BarChart3 className="w-12 h-12 text-blue-600" />
                    </div>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <span className="text-sm font-black text-blue-700/60 uppercase tracking-widest mb-1">ACCURACY</span>
                      <span className="text-4xl font-black text-blue-600">{Math.round(resultData.accuracy)}%</span>
                      <div className="mt-2 w-full h-1 bg-blue-200 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${resultData.accuracy}%` }} transition={{ delay: 0.7, duration: 1 }} className="h-full bg-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="group">
                  <Card className="h-full border-none shadow-xl bg-gradient-to-br from-purple-50 to-fuchsia-50/50 dark:from-purple-950/20 dark:to-fuchsia-900/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">
                      <Trophy className="w-12 h-12 text-purple-600" />
                    </div>
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <span className="text-sm font-black text-purple-700/60 uppercase tracking-widest mb-1">PERFECTS</span>
                      <span className="text-4xl font-black text-purple-600">{resultData.correct}/{resultData.attempted}</span>
                      <div className="mt-2 w-full h-1 bg-purple-200 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(resultData.correct / resultData.attempted) * 100}%` }} transition={{ delay: 0.9, duration: 1 }} className="h-full bg-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* LEVEL UPDATE */}
              {resultData.difficultyUpdate && resultData.difficultyUpdate !== "maintained" && (
                <div className="p-1 pb-2 bg-gradient-to-r from-orange-400 to-rose-400 rounded-[2.5rem] shadow-xl mb-10">
                  <div className="p-6 rounded-[2.2rem] bg-orange-50 dark:bg-orange-950/20 flex flex-col md:flex-row items-center gap-6">
                    <div className="bg-orange-500 text-white p-5 rounded-3xl shadow-lg shadow-orange-500/30 shrink-0">
                      <TrendingUp className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="font-black text-xs uppercase tracking-[0.2em] text-orange-600 mb-1">Adaptive System Notification</p>
                      <p className="text-2xl font-bold leading-tight">
                        Your mastery has <span className="text-orange-600 italic">{resultData.difficultyUpdate}</span>!
                        Next challenges will be on the <strong className="text-orange-700 dark:text-orange-400">{resultData.newDifficulty}</strong> track.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="review-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 mb-10"
            >
              {userResponses.map((res, i) => {
                const exp = explanations.find(e => e.question === res.question);
                return (
                  <Card key={i} className="overflow-hidden border-2 border-primary/5 shadow-lg">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex justify-between items-start mb-6">
                        <Badge className="font-bold">Question {i + 1}</Badge>
                        {res.selected === res.correct ? (
                          <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-sm">
                            <CheckCircle2 className="w-4 h-4" /> Correct
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full text-sm">
                            <XCircle className="w-4 h-4" /> Incorrect
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-bold mb-6">{res.question}</h3>

                      <div className="grid gap-3 mb-8">
                        {res.options?.map((opt, idx) => {
                          const isCorrect = opt === res.correct;
                          const isSelected = opt === res.selected;
                          const isWrongSelection = isSelected && !isCorrect;

                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${isCorrect ? 'border-green-500 bg-green-50/50' :
                                isWrongSelection ? 'border-red-500 bg-red-50/50' :
                                  'border-muted/20 bg-muted/5 opacity-70'
                                }`}
                            >
                              <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold shrink-0 ${isCorrect ? 'bg-green-500 text-white border-green-500' :
                                isWrongSelection ? 'bg-red-500 text-white border-red-500' :
                                  'text-muted-foreground border-muted-foreground/20'
                                }`}>
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span className={`font-semibold ${isCorrect ? 'text-green-700' : isWrongSelection ? 'text-red-700' : 'text-muted-foreground'}`}>
                                {opt}
                              </span>
                              {isCorrect && <CheckCircle2 className="w-5 h-5 ml-auto text-green-500" />}
                              {isWrongSelection && <XCircle className="w-5 h-5 ml-auto text-red-500" />}
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                        <div className="flex items-center gap-3 mb-4">
                          <BrainCircuit className="w-6 h-6 text-primary" />
                          <h4 className="font-bold text-primary">AI Explanation</h4>
                        </div>
                        {explaining ? (
                          <div className="space-y-2 animate-pulse">
                            <div className="h-4 bg-primary/10 rounded w-full" />
                            <div className="h-4 bg-primary/10 rounded w-5/6" />
                          </div>
                        ) : exp ? (
                          <p className="text-foreground/80 leading-relaxed font-medium">
                            {exp.explanation}
                          </p>
                        ) : (
                          <p className="text-muted-foreground italic">Explanation loading...</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACTIONS */}
        <div className="flex flex-col md:flex-row gap-5">
          <Button
            size="lg"
            onClick={handleContinueJourney}
            disabled={isContinuing}
            className="flex-[2] text-xl h-20 font-black rounded-3xl shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 group relative overflow-hidden bg-primary"
          >
            {isContinuing ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="animate-pulse">{adaptiveFeedback || "Synthesizing next level..."}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                Level Up & Continue
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStage("TOPICS")}
            className="flex-1 text-xl h-20 font-bold border-2 rounded-3xl hover:bg-secondary flex items-center gap-3"
          >
            <Home className="w-6 h-6" />
            All Topics
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <AppShell>
      <div className="p-6 md:p-12 max-w-7xl mx-auto min-h-screen bg-slate-50/30">
        {stage === "TOPICS" && (
          <div className="animate-in fade-in duration-700">
            {renderHeader()}
            {renderTopics()}
          </div>
        )}

        {stage === "LOADING" && renderLoading()}

        {stage === "QUIZ" && renderQuiz()}

        {stage === "RESULTS" && renderResult()}
      </div>
    </AppShell>
  )
}

