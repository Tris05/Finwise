"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { RotateCcw, CheckCircle, XCircle, ArrowLeft, ArrowRight } from "lucide-react"

type Flashcard = {
  id: string
  category: string
  question: string
  answer: string
  difficulty: string
  xp: number
}

interface FlashcardsProps {
  flashcards: Flashcard[]
  onComplete: (xp: number) => void
}

export function Flashcards({ flashcards, onComplete }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(0)

  const currentCard = flashcards[currentIndex]
  const isLast = currentIndex === flashcards.length - 1
  const isFirst = currentIndex === 0

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleCorrect = () => {
    if (!completed.has(currentCard.id)) {
      setCompleted(new Set([...completed, currentCard.id]))
      setScore(score + 1)
      onComplete(currentCard.xp)
    }
    handleNext()
  }

  const handleIncorrect = () => {
    handleNext()
  }

  const reset = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setCompleted(new Set())
    setScore(0)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800"
      case "Medium": return "bg-yellow-100 text-yellow-800"
      case "Hard": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No flashcards available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Flashcards</h3>
          <Badge variant="outline">
            {currentIndex + 1} / {flashcards.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getDifficultyColor(currentCard.difficulty)}>
            {currentCard.difficulty}
          </Badge>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-64 cursor-pointer" onClick={handleFlip}>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  {currentCard.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6 }}
                    className="transform-gpu"
                  >
                    {!isFlipped ? (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Question</h3>
                        <p className="text-lg">{currentCard.question}</p>
                        <p className="text-sm text-muted-foreground mt-4">
                          Click to reveal answer
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Answer</h3>
                        <p className="text-lg">{currentCard.answer}</p>
                        <p className="text-sm text-muted-foreground mt-4">
                          Click to flip back
                        </p>
                      </div>
                    )}
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {isFlipped && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={handleIncorrect}
            className="text-red-600 hover:text-red-700"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Got it wrong
          </Button>
          <Button
            onClick={handleCorrect}
            className="text-green-600 hover:text-green-700"
            disabled={completed.has(currentCard.id)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {completed.has(currentCard.id) ? "Already completed" : "Got it right!"}
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirst}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Score: {score} / {completed.size}
          </p>
          <p className="text-xs text-muted-foreground">
            Completed: {completed.size} / {flashcards.length}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={isLast}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
