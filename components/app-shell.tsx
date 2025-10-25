"use client"

import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { AuthProvider } from "@/components/providers/auth-provider"
import { type ReactNode, useState } from "react"
import { cn } from "@/lib/utils"

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          <div className={cn("flex-1 min-h-screen", collapsed ? "ml-16" : "ml-64", "transition-[margin]")}>
            <Topbar />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </div>
    </AuthProvider>
  )
}
