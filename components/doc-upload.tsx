"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

type ParsedField = { key: string; value: string; risk?: "low" | "medium" | "high" }
type UploadResult = { fields: ParsedField[]; riskScore: number; summary: string }

export function DocUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function simulateUpload() {
    if (!file) return
    setLoading(true)
    setResult(null)
    setProgress(0)
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 100))
      setProgress(i)
    }
    const res = await fetch("/api/docs/upload", { method: "POST" })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-3 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <label className="flex-1 cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                aria-label="Upload document" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <div className="flex items-center justify-center w-full h-12 px-4 py-2 border-2 border-dashed border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)]/5 transition-colors">
                <div className="flex items-center gap-2 text-[var(--color-primary)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="font-medium">
                    {file ? file.name : "Choose file to upload"}
                  </span>
                </div>
              </div>
            </label>
            <Button 
              onClick={simulateUpload} 
              disabled={!file || loading}
              className="h-12 px-6 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-medium"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Supported: salary slips, credit card bills, bank statements
        </div>
      </div>
      {loading && (
        <div>
          <Progress value={progress} />
          <div className="text-xs mt-1 text-muted-foreground">OCR Progress: {progress}%</div>
        </div>
      )}
      {result && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Extracted Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-1.5 text-sm">
                {result.fields.map((f) => {
                  const color =
                    f.risk === "high"
                      ? { bg: "var(--alert-danger-bg)", fg: "var(--alert-danger-fg)" }
                      : f.risk === "medium"
                        ? { bg: "var(--alert-warning-bg)", fg: "var(--alert-warning-fg)" }
                        : { bg: "transparent", fg: "inherit" }
                  return (
                    <div
                      key={f.key}
                      className="flex items-center justify-between rounded-md border px-2 py-1"
                      style={{ background: color.bg, color: color.fg }}
                    >
                      <span>{f.key}</span>
                      <span>{f.value}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Risk Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">Risk Score: {Math.round(result.riskScore * 100)} / 100</div>
              <p className="text-sm">{result.summary}</p>
              <Button
                className="mt-1 bg-transparent"
                variant="outline"
                onClick={() => {
                  // Generate a simple text report
                  const reportContent = `Financial Document Analysis Report
Generated: ${new Date().toLocaleString()}

Risk Score: ${Math.round(result.riskScore * 100)}/100

Extracted Information:
${result.fields.map(f => `• ${f.key}: ${f.value}`).join('\n')}

Summary:
${result.summary}

---
Generated by Finwise AI Financial Advisor`
                  
                  // Create and download the file
                  const blob = new Blob([reportContent], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `financial-analysis-report-${new Date().toISOString().split('T')[0]}.txt`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
              >
                Download Report
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
