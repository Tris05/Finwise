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
        <div className="flex items-center gap-2">
          <input type="file" aria-label="Upload document" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button onClick={simulateUpload} disabled={!file || loading}>
            Upload & Analyze
          </Button>
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
                onClick={() => alert("Report generated (mock)")}
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
