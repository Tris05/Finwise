import type React from "react"
import type { Metadata } from "next"
import { Poppins, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/providers/auth-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
})
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FinWise — AI Financial Coaching",
  description: "Modern, India-focused financial coaching experience",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const noFlashThemeScript = `
    (function() {
      try {
        var saved = localStorage.getItem('finwise-theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = (saved === 'light' || saved === 'dark') ? saved : (prefersDark ? 'dark' : 'light');
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      } catch (e) {}
    })();
  `

  return (
    <html lang="en" suppressHydrationWarning className={`${poppins.variable} ${inter.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className={`font-sans ${inter.variable}`}>
        <Suspense fallback={null}>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster />
              <Analytics />
            </AuthProvider>
          </QueryProvider>
        </Suspense>
      </body>
    </html>
  )
}
