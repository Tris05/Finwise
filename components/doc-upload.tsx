// // "use client"

// // import { useState } from "react"
// // import { Button } from "@/components/ui/button"
// // import { Progress } from "@/components/ui/progress"
// // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

// // type ParsedField = { key: string; value: string; risk?: "low" | "medium" | "high" }
// // type UploadResult = { fields: ParsedField[]; riskScore: number; summary: string }

// // export function DocUpload() {
// //   const [file, setFile] = useState<File | null>(null)
// //   const [progress, setProgress] = useState(0)
// //   const [result, setResult] = useState<UploadResult | null>(null)
// //   const [loading, setLoading] = useState(false)

// //   async function simulateUpload() {
// //     if (!file) return
// //     setLoading(true)
// //     setResult(null)
// //     setProgress(0)
// //     for (let i = 0; i <= 100; i += 10) {
// //       await new Promise((r) => setTimeout(r, 100))
// //       setProgress(i)
// //     }
// //     const res = await fetch("/api/docs/upload", { method: "POST" })
// //     const data = await res.json()
// //     setResult(data)
// //     setLoading(false)
// //   }

// //   return (
// //     <div className="space-y-4">
// //       <div className="rounded-md border p-3 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10">
// //         <div className="flex flex-col gap-3">
// //           <div className="flex items-center gap-2">
// //             <label className="flex-1 cursor-pointer">
// //               <input 
// //                 type="file" 
// //                 className="hidden" 
// //                 aria-label="Upload document" 
// //                 onChange={(e) => setFile(e.target.files?.[0] || null)} 
// //                 accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
// //               />
// //               <div className="flex items-center justify-center w-full h-12 px-4 py-2 border-2 border-dashed border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)]/5 transition-colors">
// //                 <div className="flex items-center gap-2 text-[var(--color-primary)]">
// //                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
// //                   </svg>
// //                   <span className="font-medium">
// //                     {file ? file.name : "Choose file to upload"}
// //                   </span>
// //                 </div>
// //               </div>
// //             </label>
// //             <Button 
// //               onClick={simulateUpload} 
// //               disabled={!file || loading}
// //               className="h-12 px-6 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-medium"
// //             >
// //               {loading ? "Analyzing..." : "Analyze"}
// //             </Button>
// //           </div>
// //         </div>
// //         <div className="text-xs text-muted-foreground mt-1">
// //           Supported: salary slips, credit card bills, bank statements
// //         </div>
// //       </div>
// //       {loading && (
// //         <div>
// //           <Progress value={progress} />
// //           <div className="text-xs mt-1 text-muted-foreground">OCR Progress: {progress}%</div>
// //         </div>
// //       )}
// //       {result && (
// //         <div className="grid md:grid-cols-3 gap-4">
// //           <Card className="md:col-span-2">
// //             <CardHeader className="pb-2">
// //               <CardTitle>Extracted Fields</CardTitle>
// //             </CardHeader>
// //             <CardContent>
// //               <div className="grid grid-cols-2 gap-1.5 text-sm">
// //                 {result.fields.map((f) => {
// //                   const color =
// //                     f.risk === "high"
// //                       ? { bg: "var(--alert-danger-bg)", fg: "var(--alert-danger-fg)" }
// //                       : f.risk === "medium"
// //                         ? { bg: "var(--alert-warning-bg)", fg: "var(--alert-warning-fg)" }
// //                         : { bg: "transparent", fg: "inherit" }
// //                   return (
// //                     <div
// //                       key={f.key}
// //                       className="flex items-center justify-between rounded-md border px-2 py-1"
// //                       style={{ background: color.bg, color: color.fg }}
// //                     >
// //                       <span>{f.key}</span>
// //                       <span>{f.value}</span>
// //                     </div>
// //                   )
// //                 })}
// //               </div>
// //             </CardContent>
// //           </Card>
// //           <Card>
// //             <CardHeader className="pb-2">
// //               <CardTitle>Risk Summary</CardTitle>
// //             </CardHeader>
// //             <CardContent className="space-y-2">
// //               <div className="text-sm">Risk Score: {Math.round(result.riskScore * 100)} / 100</div>
// //               <p className="text-sm">{result.summary}</p>
// //               <Button
// //                 className="mt-1 bg-transparent"
// //                 variant="outline"
// //                 onClick={() => {
// //                   // Generate a simple text report
// //                   const reportContent = `Financial Document Analysis Report
// // Generated: ${new Date().toLocaleString()}

// // Risk Score: ${Math.round(result.riskScore * 100)}/100

// // Extracted Information:
// // ${result.fields.map(f => `• ${f.key}: ${f.value}`).join('\n')}

// // Summary:
// // ${result.summary}

// // ---
// // Generated by Finwise AI Financial Advisor`

// //                   // Create and download the file
// //                   const blob = new Blob([reportContent], { type: 'text/plain' })
// //                   const url = URL.createObjectURL(blob)
// //                   const a = document.createElement('a')
// //                   a.href = url
// //                   a.download = `financial-analysis-report-${new Date().toISOString().split('T')[0]}.txt`
// //                   document.body.appendChild(a)
// //                   a.click()
// //                   document.body.removeChild(a)
// //                   URL.revokeObjectURL(url)
// //                 }}
// //               >
// //                 Download Report
// //               </Button>
// //             </CardContent>
// //           </Card>
// //         </div>
// //       )}
// //     </div>
// //   )
// // }
// "use client";

// import { useState, useRef } from "react";
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// type ParsedField = { key: string; value: string; risk?: "low" | "medium" | "high" };
// type UploadResult = {
//   risk_score: number;
//   risk_reasons?: string[];
//   regex_fields?: Record<string, string>;
//   page_images?: { page: number; image: string }[];
//   entities_model?: { page: number; bbox: number[]; risky?: boolean }[];
// };

// export function DocUpload() {
//   const [file, setFile] = useState<File | null>(null);
//   const [progress, setProgress] = useState(0);
//   const [result, setResult] = useState<UploadResult | null>(null);
//   const [loading, setLoading] = useState(false);
//   const fileRef = useRef<HTMLInputElement | null>(null);

//   const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

//   async function handleUpload() {
//     if (!file) return alert("Please choose a file first.");
//     setLoading(true);
//     setProgress(0);
//     setResult(null);

//     // Simulate progress bar
//     for (let i = 0; i <= 100; i += 10) {
//       await new Promise((r) => setTimeout(r, 80));
//       setProgress(i);
//     }

//     const fd = new FormData();
//     fd.append("file", file);

//     try {
//       const resp = await fetch(`${API_BASE}/analyze`, {
//         method: "POST",
//         body: fd,
//       });

//       if (!resp.ok) {
//         const txt = await resp.text();
//         throw new Error(txt || resp.statusText);
//       }

//       const data = await resp.json();
//       setResult(data);
//     } catch (err: any) {
//       console.error("Error uploading:", err);
//       alert("Upload failed: " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   function getRiskColor(risk: number) {
//     const rsk = Math.max(0, Math.min(100, risk || 0));
//     let r, g;
//     if (rsk < 50) {
//       r = Math.round((rsk / 50) * 255);
//       g = 255;
//     } else {
//       r = 255;
//       g = Math.round(255 - ((rsk - 50) / 50) * 255);
//     }
//     return `rgb(${r},${g},0)`;
//   }

//   return (
//     <div className="space-y-4">
//       <div className="rounded-md border p-3 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10">
//         <div className="flex flex-col gap-3">
//           <div className="flex items-center gap-2">
//             <label className="flex-1 cursor-pointer">
//               <input
//                 ref={fileRef}
//                 type="file"
//                 className="hidden"
//                 aria-label="Upload document"
//                 onChange={(e) => setFile(e.target.files?.[0] || null)}
//                 accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
//               />
//               <div className="flex items-center justify-center w-full h-12 px-4 py-2 border-2 border-dashed border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)]/5 transition-colors">
//                 <div className="flex items-center gap-2 text-[var(--color-primary)]">
//                   <svg
//                     className="w-5 h-5"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
//                     />
//                   </svg>
//                   <span className="font-medium">
//                     {file ? file.name : "Choose file to upload"}
//                   </span>
//                 </div>
//               </div>
//             </label>
//             <Button
//               onClick={handleUpload}
//               disabled={!file || loading}
//               className="h-12 px-6 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-medium"
//             >
//               {loading ? "Analyzing..." : "Analyze"}
//             </Button>
//           </div>
//         </div>
//         <div className="text-xs text-muted-foreground mt-1">
//           Supported: salary slips, credit card bills, bank statements
//         </div>
//       </div>

//       {loading && (
//         <div>
//           <Progress value={progress} />
//           <div className="text-xs mt-1 text-muted-foreground">
//             Upload Progress: {progress}%
//           </div>
//         </div>
//       )}

//       {result && (
//         <div className="grid md:grid-cols-3 gap-4">
//           {/* RISK SUMMARY */}
//           <Card>
//             <CardHeader className="pb-2">
//               <CardTitle>Risk Summary</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-2">
//               <div
//                 className="text-sm font-semibold text-white px-3 py-1 rounded"
//                 style={{ background: getRiskColor(result.risk_score) }}
//               >
//                 Risk Score: {result.risk_score}
//               </div>
//               <ul className="list-disc pl-5 text-sm">
//                 {(result.risk_reasons || []).map((r, i) => (
//                   <li key={i}>{r}</li>
//                 ))}
//               </ul>
//             </CardContent>
//           </Card>

//           {/* EXTRACTED FIELDS */}
//           <Card className="md:col-span-2">
//             <CardHeader className="pb-2">
//               <CardTitle>Extracted Fields</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <pre className="bg-gray-50 rounded p-2 text-sm overflow-auto">
//                 {JSON.stringify(result.regex_fields || {}, null, 2)}
//               </pre>
//             </CardContent>
//           </Card>
//         </div>
//       )}
//     </div>
//   );
// }
"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

type Entity = { page: number; bbox: number[]; risky?: boolean };
type PageImage = { page: number; image: string };
type UploadResult = {
  risk_score: number;
  risk_reasons?: string[];
  page_images?: PageImage[];
  entities_model?: Entity[];
};

export function DocUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  async function handleUpload() {
    if (!file) return alert("Please choose a file first.");
    setLoading(true);
    setResult(null);
    setProgress(0);

    // Simulate progress bar
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 80));
      setProgress(i);
    }

    const fd = new FormData();
    fd.append("file", file);

    try {
      const resp = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: fd,
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setResult(data);

      // Save to Firestore
      if (userId) {
        try {
          await addDoc(collection(db, "users", userId, "documents"), {
            name: file.name,
            type: file.type,
            analysis: data,
            uploadedAt: serverTimestamp()
          });
          console.log("Document analysis saved to Firestore");
        } catch (fsErr) {
          console.error("Error saving to Firestore:", fsErr);
        }
      }
    } catch (err: any) {
      console.error("Error uploading:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function getRiskColor(risk: number) {
    const rsk = Math.max(0, Math.min(100, risk || 0));
    let r, g;
    if (rsk < 50) {
      r = Math.round((rsk / 50) * 255);
      g = 255;
    } else {
      r = 255;
      g = Math.round(255 - ((rsk - 50) / 50) * 255);
    }
    return `rgb(${r},${g},0)`;
  }

  return (
    <div className="space-y-4">
      {/* Upload UI */}
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
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="font-medium">
                    {file ? file.name : "Choose file to upload"}
                  </span>
                </div>
              </div>
            </label>
            <Button
              onClick={handleUpload}
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

      {/* Progress Bar */}
      {loading && (
        <div>
          <Progress value={progress} />
          <div className="text-xs mt-1 text-muted-foreground">
            Upload Progress: {progress}%
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Risk Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Risk Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div
                className="text-sm font-semibold text-white px-3 py-1 rounded"
                style={{ background: getRiskColor(result.risk_score) }}
              >
                Risk Score: {result.risk_score}
              </div>
              <ul className="list-disc pl-5 text-sm">
                {(result.risk_reasons || []).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Document Pages with Overlays */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Analyzed Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(result.page_images || []).map((page) => (
                <PageWithOverlay
                  key={page.page}
                  page={page}
                  entities={result.entities_model || []}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// --- Helper Component for Overlay Visualization ---
function PageWithOverlay({
  page,
  entities,
}: {
  page: { page: number; image: string };
  entities: Entity[];
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const pageEntities = entities.filter((e) => e.page === page.page);

    function resizeCanvas() {
      if (!img || !canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.style.width = img.clientWidth + "px";
      canvas.style.height = img.clientHeight + "px";
      drawBoxes(canvas, pageEntities);
    }

    if (img.complete) resizeCanvas();
    img.addEventListener("load", resizeCanvas);
    window.addEventListener("resize", resizeCanvas);
    return () => {
      img.removeEventListener("load", resizeCanvas);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [page, entities]);

  return (
    <div className="relative border rounded-lg overflow-hidden shadow">
      <img
        ref={imgRef}
        src={`data:image/png;base64,${page.image}`}
        alt={`Page ${page.page}`}
        className="w-full h-auto block"
      />
      <canvas ref={canvasRef} className="absolute left-0 top-0 pointer-events-none" />
      <div className="text-xs text-center text-muted-foreground py-1">
        Page {page.page}
      </div>
    </div>
  );
}

function drawBoxes(canvas: HTMLCanvasElement, ents: Entity[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ents.forEach((e) => {
    const [x1, y1, x2, y2] = e.bbox;
    const w = x2 - x1;
    const h = y2 - y1;
    ctx.strokeStyle = e.risky ? "rgba(255,0,0,0.9)" : "rgba(0,200,0,0.7)";
    ctx.fillStyle = e.risky ? "rgba(255,0,0,0.15)" : "rgba(0,200,0,0.10)";
    ctx.lineWidth = 3;
    ctx.strokeRect(x1, y1, w, h);
    ctx.fillRect(x1, y1, w, h);
  });
}
