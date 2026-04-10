import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import initialData from "@/data/security/logs.json"

// Note: In a real app, you'd get the user ID from the session/auth header
// For this implementation, we'll assume a mock user session for the API
const MOCK_USER_ID = "mock-user-123"

export async function GET() {
  try {
    const logsRef = collection(db, "users", MOCK_USER_ID, "security_logs")
    const q = query(logsRef, orderBy("timestamp", "desc"))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      // Seed initial data if none exists
      for (const log of initialData) {
        await addDoc(logsRef, {
          ...log,
          timestamp: new Date().toISOString(),
          acknowledged: false
        })
      }
      return NextResponse.json(initialData)
    }

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { id, action } = await req.json()
    if (action === "ack") {
      const logRef = doc(db, "users", MOCK_USER_ID, "security_logs", id)
      await updateDoc(logRef, {
        acknowledged: true
      })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error updating log:", error)
    return NextResponse.json({ error: "Failed to update log" }, { status: 500 })
  }
}
