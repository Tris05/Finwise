"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

type RebalanceResponse = {
  proposedWeights: { asset: string; weight: number }[]
  riskCategory: "Low" | "Medium" | "High"
  confidenceScore: number
  shapText: string
  llmSummary: string
}

export function RebalanceModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast()
  const rebalance = useMutation({
    mutationFn: async (): Promise<RebalanceResponse> => {
      const res = await fetch("/api/portfolio/rebalance", { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="rounded-md -mx-4 -mt-4 px-4 py-3 bg-gradient-to-r from-[var(--color-primary)]/15 to-[var(--color-accent)]/15">
          <DialogTitle className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]">
            Rebalance Suggestions
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 mt-2">
          {rebalance.isIdle && (
            <div className="text-sm text-muted-foreground">Click "Fetch Suggestion" to load proposed allocation.</div>
          )}
          {rebalance.isPending && <div className="text-sm">Fetching suggestions...</div>}
          {rebalance.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border p-2 text-sm">
                  <div className="text-muted-foreground">Risk Category</div>
                  <div className="font-medium">{rebalance.data.riskCategory}</div>
                </div>
                <div className="rounded-md border p-2 text-sm">
                  <div className="text-muted-foreground">Confidence</div>
                  <div className="font-medium">{(rebalance.data.confidenceScore * 100).toFixed(1)}%</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Proposed Weights</h4>
                <ul className="text-sm grid grid-cols-2 gap-2">
                  {rebalance.data.proposedWeights.map((w) => (
                    <li key={w.asset} className="flex items-center justify-between rounded-md border px-2 py-1">
                      <span>{w.asset}</span>
                      <span>{(w.weight * 100).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Why this allocation? (SHAP)</h4>
                <p className="text-sm text-muted-foreground">{rebalance.data.shapText}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Summary</h4>
                <p className="text-sm">{rebalance.data.llmSummary}</p>
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!rebalance.data && <Button onClick={() => rebalance.mutate()}>Fetch Suggestion</Button>}
          {rebalance.data && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  toast({ title: "Rebalance rejected", description: "We will keep current allocation." })
                  onOpenChange(false)
                }}
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  toast({ title: "Rebalance accepted", description: "Portfolio updated in mock state." })
                  onOpenChange(false)
                }}
              >
                Accept
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
