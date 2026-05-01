"use client"

import { useEffect, useState } from "react"

type ThemeMode = "light" | "dark"

const STORAGE_KEY = "finwise-theme"

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("dark", theme === "dark")
}

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    const initialTheme: ThemeMode = stored === "dark" || stored === "light" ? stored : getSystemTheme()
    setTheme(initialTheme)
    applyTheme(initialTheme)
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  return { theme, mounted, toggleTheme }
}
