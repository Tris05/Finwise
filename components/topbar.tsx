"use client"

import { Input } from "@/components/ui/input"
import { Bell, Search, TrendingUp, TrendingDown, Moon, Sun } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatINR } from "@/lib/utils"
import { useState } from "react"
import { UserMenu } from "@/components/user-menu"
import { useSmartNavigation } from "@/lib/smart-navigation"
import { useInvestments } from "@/hooks/useInvestments"
import { useGameProgress } from "@/hooks/useGameProgress"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const { navigate } = useSmartNavigation()
  const { theme, mounted, toggleTheme } = useTheme()

  // Live portfolio data from Firestore + market prices
  const {
    totalValue,
    dayChangePercent,
    loading: investmentsLoading,
  } = useInvestments()

  // Live learning level from Firestore (same source as learning page)
  const { level, loading: gameLoading } = useGameProgress()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const query = searchQuery.trim()
      if (
        query.includes("?") ||
        query.toLowerCase().includes("what") ||
        query.toLowerCase().includes("how") ||
        query.toLowerCase().includes("why")
      ) {
        navigate(`/advisor?q=${encodeURIComponent(query)}`)
      } else {
        navigate(`/investments?tab=search&q=${encodeURIComponent(query)}`)
      }
      setSearchQuery("")
    }
  }

  const isPortfolioUp = dayChangePercent >= 0

  return (
    <header className="sticky top-0 z-20 border-b bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Smart Search */}
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
            {/* Portfolio Value */}
            {investmentsLoading ? (
              <Skeleton className="h-5 w-24 rounded-full" />
            ) : (
              <Badge variant="secondary" aria-label="Portfolio Value">
                {totalValue > 0 ? formatINR(totalValue) : "—"}
              </Badge>
            )}

            {/* Day Change */}
            {investmentsLoading ? (
              <Skeleton className="h-5 w-16 rounded-full" />
            ) : totalValue > 0 ? (
              <Badge
                variant={isPortfolioUp ? "default" : "destructive"}
                aria-label="Today's Change"
                className="flex items-center gap-1"
              >
                {isPortfolioUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPortfolioUp ? "+" : ""}
                {dayChangePercent.toFixed(2)}% today
              </Badge>
            ) : null}

            {/* Learning Level */}
            {gameLoading ? (
              <Skeleton className="h-5 w-16 rounded-full" />
            ) : (
              <Badge variant="outline" aria-label="Learning Level">
                Lv {level}
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {mounted && theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Bell className="h-5 w-5 cursor-pointer hover:text-primary transition-colors" aria-hidden="true" />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
