"use client"

import { AppShell } from "@/components/app-shell"
import { QueryProvider } from "@/components/providers/query-provider"
import { ChatbotPanel } from "@/components/chatbot-panel"

export default function AdvisorPage() {
  return (
    <QueryProvider>
      <AppShell>
        <ChatbotPanel />
      </AppShell>
    </QueryProvider>
  )
}
