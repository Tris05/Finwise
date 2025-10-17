"use client"

import { Input } from "@/components/ui/input"
import { Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatINR } from "@/lib/utils"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to advisor page with search query
      router.push(`/advisor?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search investments, loans, or ask a question..." 
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="secondary" aria-label="Net Worth">
              {formatINR(12540)}
            </Badge>
            <Badge variant="outline" aria-label="Monthly Savings">
              +12.5%
            </Badge>
          </div>
          <Bell className="h-5 w-5" aria-hidden="true" />
          <Avatar>
            <AvatarFallback>FW</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
