"use client"

import Link from "next/link"
import {
  Home,
  Wallet,
  Bot,
  FileText,
  BadgeDollarSign,
  Landmark,
  GraduationCap,
  ShieldCheck,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/investments", label: "Investments", icon: Wallet },
  { href: "/credit-cards", label: "Credit Cards", icon: CreditCard },
  { href: "/advisor", label: "Advisor", icon: Bot },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/salary", label: "Salary", icon: BadgeDollarSign },
  { href: "/loan", label: "Loan", icon: Landmark },
  { href: "/learning", label: "Learning", icon: GraduationCap },
  { href: "/security", label: "Security", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  return (
    <aside
      className={cn("fixed left-0 top-0 h-screen border-r bg-card", collapsed ? "w-16" : "w-64", "transition-all")}
    >
      <div className="flex items-center justify-between p-4">
        <span className={cn("font-semibold", collapsed && "sr-only")}>FinWise</span>
        <Button size="icon" variant="ghost" aria-label="Toggle sidebar" onClick={onToggle}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="px-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 mb-1 text-sm hover:bg-gradient-to-r hover:from-[var(--color-accent)]/30 hover:to-transparent",
              pathname.startsWith(href) &&
              "bg-accent text-accent-foreground border-l-4 border-l-[var(--color-primary)]",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && "sr-only")}>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
