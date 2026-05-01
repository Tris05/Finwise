import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import initialData from "@/data/security/logs.json"

export async function GET(req: Request) {
  try {
    // For now, we'll use a simple approach - in production you'd verify the session properly
    const userId = req.headers.get('x-user-id') || 'current-user'
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const logsRef = collection(db, "users", userId, "security_logs")
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
    const userId = req.headers.get('x-user-id') || 'current-user'
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, action, type } = await req.json()
    
    if (action === "ack") {
      const logRef = doc(db, "users", userId, "security_logs", id)
      await updateDoc(logRef, {
        acknowledged: true
      })
    } else if (action === "log" && type === "login") {
      // Log current login
      const logsRef = collection(db, "users", userId, "security_logs")
      const userAgent = req.headers.get('user-agent') || 'Unknown Browser'
      const timestamp = new Date().toISOString()
      
      // Detect device info from user agent
      let device = 'Unknown Device'
      let location = 'Unknown Location'
      
      if (userAgent.includes('Chrome')) {
        device = userAgent.includes('Windows') ? 'Chrome on Windows' : 
                userAgent.includes('Mac') ? 'Chrome on Mac' : 
                userAgent.includes('Linux') ? 'Chrome on Linux' : 'Chrome'
      } else if (userAgent.includes('Safari')) {
        device = userAgent.includes('iPhone') ? 'Safari on iPhone' : 
                userAgent.includes('iPad') ? 'Safari on iPad' : 'Safari on Mac'
      } else if (userAgent.includes('Firefox')) {
        device = 'Firefox'
      } else if (userAgent.includes('Edge')) {
        device = 'Edge on Windows'
      }
      
      // Default location (in real app, you'd use IP geolocation)
      location = 'Mumbai, IN'
      
      await addDoc(logsRef, {
        timestamp,
        location,
        device,
        severity: 'info',
        acknowledged: false,
        action: 'login'
      })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error updating log:", error)
    return NextResponse.json({ error: "Failed to update log" }, { status: 500 })
  }
}
