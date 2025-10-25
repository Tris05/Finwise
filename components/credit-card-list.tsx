"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

type CreditCard = {
  id: string
  name: string
  bank: string
  annualFee: number
  rewards: string[]
  whyText: string // SHAP-like textual explanation
}

export function CreditCardList() {
  const { data } = useQuery({
    queryKey: ["credit-cards"],
    queryFn: async (): Promise<CreditCard[]> => {
      const res = await fetch("/api/credit/recommend")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
  })
  const [selected, setSelected] = useState<string[]>([])
  const [whyOpen, setWhyOpen] = useState<{ open: boolean; text?: string; title?: string }>({ open: false })

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-3)))

  const compare = data?.filter((d) => selected.includes(d.id)) || []

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((card) => (
          <Card key={card.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-pretty">{card.name}</CardTitle>
              <div className="text-sm text-muted-foreground">{card.bank}</div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <div className="text-sm">Annual Fee: ₹{card.annualFee}</div>
              <ul className="text-sm list-disc pl-5">
                {card.rewards.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`sel-${card.id}`}
                    checked={selected.includes(card.id)}
                    onCheckedChange={() => toggle(card.id)}
                  />
                  <label htmlFor={`sel-${card.id}`} className="text-sm">
                    Compare
                  </label>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWhyOpen({ open: true, text: card.whyText, title: card.name })}
                >
                  Why recommended?
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {compare.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compare</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {compare.map((c) => (
              <div key={c.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium">{c.name}</div>
                <div className="text-muted-foreground">{c.bank}</div>
                <div>Annual Fee: ₹{c.annualFee}</div>
                <div className="mt-2">
                  <div className="font-medium mb-1">Rewards</div>
                  <ul className="list-disc pl-5">
                    {c.rewards.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={whyOpen.open} onOpenChange={(v) => setWhyOpen({ open: v })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{whyOpen.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-pretty">{whyOpen.text}</p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
