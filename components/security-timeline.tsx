"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Log = {
  id: string
  timestamp: string
  location: string
  device: string
  severity: "info" | "warning" | "critical"
  acknowledged: boolean
}

export function SecurityTimeline() {
  const { data, refetch } = useQuery({
    queryKey: ["security-logs"],
    queryFn: async (): Promise<Log[]> => {
      const res = await fetch("/api/security/logs")
      return res.json()
    },
  })

  async function act(id: string, action: "ack" | "report") {
    await fetch("/api/security/logs", { method: "POST", body: JSON.stringify({ id, action }) })
    refetch()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.isArray(data) && data.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="text-sm">
              <div>
                {new Date(l.timestamp).toLocaleString()} • {l.location} • {l.device}
              </div>
              <div
                className={
                  l.severity === "critical"
                    ? "text-red-600"
                    : l.severity === "warning"
                      ? "text-yellow-600"
                      : "text-muted-foreground"
                }
              >
                {l.severity.toUpperCase()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => act(l.id, "ack")} disabled={l.acknowledged}>
                Acknowledge
              </Button>
              <Button variant="secondary" size="sm" onClick={() => act(l.id, "report")}>
                Report
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
