// pages/documents.jsx (or app route equivalent)
"use client"
import { AppShell } from "@/components/app-shell";
import { DocUpload } from "@/components/doc-upload";
import { QueryProvider } from "@/components/providers/query-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { formatDistanceToNow } from "date-fns";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [deductions, setDeductions] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);

        // Listen to documents collection
        const docsRef = collection(db, "users", user.uid, "documents");
        const q = query(docsRef, orderBy("uploadedAt", "desc"));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setDocuments(docs);

          // Aggregate risks and deductions
          const allRisks: string[] = [];
          const allDeductions: string[] = [];

          docs.forEach((doc: any) => {
            const analysis = doc.analysis;
            if (analysis) {
              if (Array.isArray(analysis.risk_reasons)) {
                allRisks.push(...analysis.risk_reasons);
              }

              // Basic extraction for deductions if they appear in reasons or entities
              if (Array.isArray(analysis.risk_reasons)) {
                analysis.risk_reasons.forEach((reason: string) => {
                  if (reason.toLowerCase().includes("deduction") || reason.toLowerCase().includes("tax")) {
                    allDeductions.push(reason);
                  }
                });
              }
            }
          });

          setRisks([...new Set(allRisks)]);
          // setDeductions([...new Set(allDeductions)]); 
          // For now deductions logic is based on future backend features, 
          // keeping it empty or finding them if they exist.
        });
      } else {
        setUserId(null);
        setDocuments([]);
        setRisks([]);
        setDeductions([]);
      }
    });

    return () => {
      authUnsubscribe();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const formatWhen = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Recently";
    }
  };

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
                {documents.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No documents uploaded yet
                  </div>
                ) : (
                  documents.slice(0, 5).map((d) => (
                    <div key={d.id} className="rounded-md border p-3">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-muted-foreground text-xs">{formatWhen(d.uploadedAt)}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium mb-1 text-red-600">Detected Risks</div>
                  {risks.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic pl-5">No risks detected</div>
                  ) : (
                    <ul className="text-sm list-disc pl-5">
                      {risks.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="text-sm">
                  <div className="font-medium mb-1 text-green-600">Tax Deductions Found</div>
                  {deductions.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic pl-5">No deductions found</div>
                  ) : (
                    <ul className="text-sm list-disc pl-5">
                      {deductions.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </AppShell>
    </QueryProvider>
  );
}
