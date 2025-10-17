"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"

type Msg = { id: string; role: "user" | "assistant"; content: string }

export function ChatbotPanel() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "m1",
      role: "assistant",
      content: "Hi! I am your AI financial coach. Ask me about budgeting, investments, or taxes.",
    },
  ])
  const [input, setInput] = useState("")
  const endRef = useRef<HTMLDivElement | null>(null)
  const qc = useQueryClient()
  const searchParams = useSearchParams()

  const chat = useMutation({
    mutationFn: async (prompt: string): Promise<{ reply: string }> => {
      const res = await fetch("/api/advisor/chat", { method: "POST", body: JSON.stringify({ prompt }) })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: async () => {
      await fetch("/api/game/progress", { method: "POST", body: JSON.stringify({ action: "lesson_saved", xp: 10 }) })
      qc.invalidateQueries({ queryKey: ["game-progress"] })
    },
  })

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, chat.isPending])

  // Handle search query from URL
  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      setInput(query)
      // Auto-send the search query
      setTimeout(() => {
        sendQuery(query)
      }, 100)
    }
  }, [searchParams])

  const sendQuery = async (query: string) => {
    if (!query.trim()) return
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: query.trim() }
    setMessages((m) => [...m, userMsg])
    const { reply } = await chat.mutateAsync(userMsg.content)
    let acc = ""
    for (const ch of reply) {
      acc += ch
      await new Promise((r) => setTimeout(r, 5))
      setMessages((m) => {
        const base = m.filter((x) => x.id !== "typing")
        return [...base, { id: "typing", role: "assistant", content: acc }]
      })
    }
    setMessages((m) => m.map((x) => (x.id === "typing" ? { ...x, id: crypto.randomUUID() } : x)))
  }

  async function send() {
    if (!input.trim()) return
    setInput("")
    await sendQuery(input.trim())
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]">
          AI Advisor
        </CardTitle>
        <div className="text-xs rounded-md border px-2 py-1">
          Lesson Progress: <span style={{ color: "var(--chart-2)" }}>120 XP</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3 h-80 overflow-auto bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(0,150,136,0.04)_100%)]">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              className={`mb-2 max-w-[85%] ${m.role === "user" ? "ml-auto" : ""}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-[10px] text-muted-foreground mb-0.5">{m.role === "user" ? "You" : "Advisor"}</div>
              <div
                className={`text-sm rounded-lg px-3 py-2 ${
                  m.role === "user"
                    ? "bg-[var(--color-card)] border"
                    : "bg-gradient-to-r from-[var(--chart-1)]/15 to-[var(--chart-2)]/15 border"
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
          {chat.isPending && <div className="text-xs text-muted-foreground">Advisor is typing...</div>}
          <div ref={endRef} />
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Ask about investments, salary, or loans..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            aria-label="Chat prompt"
          />
          <Button onClick={send}>Send</Button>
        </div>
      </CardContent>
    </Card>
  )
}
