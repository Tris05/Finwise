"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, RotateCcw, Trophy, Star } from "lucide-react"

type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correct: number
  explanation: string
}

type Quiz = {
  id: string
  title: string
  description: string
  difficulty: string
  questions: QuizQuestion[]
  xp: number
}

interface QuizzesProps {
  quizzes: Quiz[]
  onComplete: (xp: number) => void
}

export function Quizzes({ quizzes, onComplete }: QuizzesProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [isCompleted, setIsCompleted] = useState(false)

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setAnswers([])
    setIsCompleted(false)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !selectedQuiz) return

    const isCorrect = selectedAnswer === selectedQuiz.questions[currentQuestion].correct
    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)

    if (isCorrect) {
      setScore(score + 1)
    }

    setShowResult(true)
  }

  const handleNextQuestion = () => {
    if (!selectedQuiz) return

    if (currentQuestion < selectedQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setIsCompleted(true)
      onComplete(selectedQuiz.xp)
    }
  }

  const resetQuiz = () => {
    setSelectedQuiz(null)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setAnswers([])
    setIsCompleted(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800"
      case "Medium": return "bg-yellow-100 text-yellow-800"
      case "Hard": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (!selectedQuiz) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Quizzes</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <Badge className={getDifficultyColor(quiz.difficulty)}>
                    {quiz.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{quiz.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {quiz.questions.length} questions
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{quiz.xp} XP</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-3" 
                  onClick={() => startQuiz(quiz)}
                >
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (isCompleted) {
    const percentage = Math.round((score / selectedQuiz.questions.length) * 100)
    const isPassed = percentage >= 60

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Quiz Complete!</h3>
          <Button variant="outline" onClick={resetQuiz}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Try Again
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {isPassed ? (
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              )}
            </motion.div>
            
            <h2 className={`text-2xl font-bold mb-2 ${getScoreColor(score, selectedQuiz.questions.length)}`}>
              {score} / {selectedQuiz.questions.length}
            </h2>
            <p className="text-lg mb-4">
              {percentage}% - {isPassed ? "Well done!" : "Keep practicing!"}
            </p>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You earned <span className="font-semibold text-yellow-600">{selectedQuiz.xp} XP</span>
              </p>
              {isPassed && (
                <p className="text-sm text-green-600 font-medium">
                  🎉 Quiz completed successfully!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = selectedQuiz.questions[currentQuestion]
  const progress = ((currentQuestion + (showResult ? 1 : 0)) / selectedQuiz.questions.length) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{selectedQuiz.title}</h3>
        <Badge className={getDifficultyColor(selectedQuiz.difficulty)}>
          {selectedQuiz.difficulty}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestion + 1} of {selectedQuiz.questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            {question.options.map((option, index) => {
              let buttonClass = "w-full text-left p-3 rounded-lg border transition-colors"
              
              if (showResult) {
                if (index === question.correct) {
                  buttonClass += " bg-green-50 border-green-200 text-green-800"
                } else if (index === selectedAnswer && index !== question.correct) {
                  buttonClass += " bg-red-50 border-red-200 text-red-800"
                } else {
                  buttonClass += " bg-gray-50 border-gray-200 text-gray-600"
                }
              } else if (selectedAnswer === index) {
                buttonClass += " bg-blue-50 border-blue-200 text-blue-800"
              } else {
                buttonClass += " hover:bg-gray-50"
              }

              return (
                <button
                  key={index}
                  className={buttonClass}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span>{option}</span>
                    {showResult && index === question.correct && (
                      <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                    )}
                    {showResult && index === selectedAnswer && index !== question.correct && (
                      <XCircle className="h-5 w-5 text-red-600 ml-auto" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <h4 className="font-semibold text-blue-800 mb-2">Explanation:</h4>
              <p className="text-sm text-blue-700">{question.explanation}</p>
            </motion.div>
          )}

          <div className="flex justify-end">
            {!showResult ? (
              <Button 
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
              >
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                {currentQuestion < selectedQuiz.questions.length - 1 ? "Next Question" : "Finish Quiz"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
