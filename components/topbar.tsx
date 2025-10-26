"use client"

import { Input } from "@/components/ui/input"
import { Bell, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatINR } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserMenu } from "@/components/user-menu"
import { useAppState } from "@/lib/state-management"
import { useSmartNavigation } from "@/lib/smart-navigation"

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { state } = useAppState()
  const { navigate } = useSmartNavigation()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Smart search - determine if it's a question or search term
      const query = searchQuery.trim()
      
      if (query.includes('?') || query.toLowerCase().includes('what') || query.toLowerCase().includes('how') || query.toLowerCase().includes('why')) {
        // It's a question - go to advisor
        navigate(`/advisor?q=${encodeURIComponent(query)}`)
      } else {
        // It's a search term - go to investments search
        navigate(`/investments?tab=search&q=${encodeURIComponent(query)}`)
      }
      
      setSearchQuery("")
    }
  }

  // Calculate portfolio metrics for display
  const portfolioValue = state.investments.reduce((sum, inv) => sum + inv.currentValue, 0)
  const totalGain = state.investments.reduce((sum, inv) => sum + inv.totalGain, 0)
  const gainPercent = portfolioValue > 0 ? (totalGain / (portfolioValue - totalGain)) * 100 : 0

  return (
    <header className="sticky top-0 z-20 border-b bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search investments, ask questions, or find features..." 
            aria-label="Smart Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/50 backdrop-blur-sm border-white/20 focus:bg-white focus:border-primary/50"
          />
        </form>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="secondary" aria-label="Portfolio Value">
              {formatINR(portfolioValue || 1254000)}
            </Badge>
            <Badge 
              variant={gainPercent >= 0 ? "default" : "destructive"} 
              aria-label="Portfolio Change"
            >
              {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
            </Badge>
            <Badge variant="outline" aria-label="Learning Level">
              Level {state.learningProgress.level}
            </Badge>
          </div>
          <Bell className="h-5 w-5 cursor-pointer hover:text-primary transition-colors" aria-hidden="true" />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
