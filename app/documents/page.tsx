"use client"

import { AppShell } from "@/components/app-shell"
import { DocUpload } from "@/components/doc-upload"
import { QueryProvider } from "@/components/providers/query-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DocumentsPage() {
  const last = [
    { id: "d1", name: "Salary Slip - Aug.pdf", when: "2 days ago" },
    { id: "d2", name: "Credit Card Bill - Sep.pdf", when: "5 days ago" },
    { id: "d3", name: "Bank Statement - Q3.pdf", when: "1 week ago" },
  ]
  const risks = ["High utilization on Credit Card", "Salary variance detected", "Missing PAN on statement"]
  const deductions = ["HRA eligible", "80C: EPF detected", "80D: Health premium"]
  return (
    <QueryProvider>
      <AppShell>
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <DocUpload />
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Last Uploaded Docs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {last.map((d) => (
                  <div key={d.id} className="rounded-md border p-3">
                    <div className="font-medium">{d.name}</div>
                    <div className="text-muted-foreground text-xs">{d.when}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium mb-1">Detected Risks</div>
                  <ul className="text-sm list-disc pl-5">
                    {risks.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="text-sm">
                  <div className="font-medium mb-1">Tax Deductions Found</div>
                  <ul className="text-sm list-disc pl-5">
                    {deductions.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </QueryProvider>
  )
}
