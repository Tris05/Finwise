// pages/documents.jsx (or app route equivalent)
"use client"
import { AppShell } from "@/components/app-shell";
import { DocUpload } from "@/components/doc-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { formatDistanceToNow } from "date-fns";
import { Shield, FileText, AlertTriangle, Lightbulb, CheckCircle2, Award } from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [deductions, setDeductions] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [latestResult, setLatestResult] = useState<any>(null);

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
    <AppShell>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DocUpload onResult={(res) => setLatestResult(res)} />
        </div>

        <div className="space-y-4">
          {/* Last Uploaded Documents List */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground">Last Uploaded Docs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {documents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No documents uploaded yet
                </div>
              ) : (
                documents.slice(0, 5).map((d) => (
                  <div
                    key={d.id}
                    className="rounded-md border p-3 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all hover:scale-[1.01] active:scale-95 duration-200"
                    onClick={() => {
                      setLatestResult({
                        risk_score: d.analysis?.risk_score ?? 0,
                        risk_reasons: d.analysis?.risk_reasons ?? [],
                        jargon_summary: d.analysis?.jargon_summary ?? null,
                        name: d.name
                      });
                    }}
                  >
                    <div className="font-medium flex items-center justify-between gap-2">
                      <span className="truncate">{d.name}</span>
                      {d.analysis?.jargon_summary && (
                        <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" title="Privacy Guard Secured" />
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">{formatWhen(d.uploadedAt)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* AI Analysis and Jargon Summary Card */}
          <Card className="border-t-4 border-t-primary hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between">
                <span>Analysis Summary</span>
                {latestResult?.name && (
                  <span className="text-xs font-normal text-muted-foreground truncate max-w-[150px]" title={latestResult.name}>
                    {latestResult.name}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!latestResult ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <FileText className="w-10 h-10 text-muted-foreground/30" />
                  <span>Upload or select a document to view AI jargon-free summary & analysis</span>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Risk Score block */}
                  <div className="text-sm p-3 bg-muted/40 rounded-lg border flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Document Risk Score:</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-xs text-white ${latestResult.risk_score >= 70 ? 'bg-red-500' : latestResult.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}>
                        {latestResult.risk_score}/100
                      </span>
                    </div>
                    {latestResult.risk_reasons && latestResult.risk_reasons.length > 0 && (
                      <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1 mt-1">
                        {latestResult.risk_reasons.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Privacy shield protection badge */}
                  <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-lg text-xs leading-normal">
                    <Shield className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-800">Privacy Shield Enabled: </span>
                      Personal identifiers (names, emails, phones, accounts, PAN, Aadhaar) were redacted locally prior to API analysis.
                    </div>
                  </div>

                  {/* Jargon Translation contents */}
                  {latestResult.jargon_summary ? (
                    <div className="space-y-4 pt-2">
                      {/* Simplified summary */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                          <FileText className="w-4 h-4" />
                          <span>SIMPLIFIED TRANSLATION</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed bg-muted/20 p-2.5 rounded border">
                          {latestResult.jargon_summary.simple_summary}
                        </p>
                      </div>

                      {/* Importance */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                          <Award className="w-4 h-4" />
                          <span>WHY IT MATTERS</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed bg-blue-500/5 p-2.5 rounded border border-blue-500/10">
                          {latestResult.jargon_summary.importance}
                        </p>
                      </div>

                      {/* Risky clauses */}
                      {latestResult.jargon_summary.risky_clauses && latestResult.jargon_summary.risky_clauses.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span>RISKY TERMS TO WATCH</span>
                          </div>
                          <div className="bg-amber-500/5 p-2.5 rounded border border-amber-500/10 space-y-1.5">
                            {latestResult.jargon_summary.risky_clauses.map((clause: string, i: number) => (
                              <div key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                                <span className="text-amber-500 font-bold mt-0.5">•</span>
                                <span>{clause}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Alternatives / Actions */}
                      {latestResult.jargon_summary.alternatives && latestResult.jargon_summary.alternatives.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <Lightbulb className="w-4 h-4" />
                            <span>RECOMMENDED ALTERNATIVES</span>
                          </div>
                          <div className="bg-emerald-500/5 p-2.5 rounded border border-emerald-500/10 space-y-1.5">
                            {latestResult.jargon_summary.alternatives.map((alt: string, i: number) => (
                              <div key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span>{alt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 border rounded-lg">
                      No advanced AI jargon summary is available for this document. Try re-uploading.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
