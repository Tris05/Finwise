"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

export function AuthTest() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user)
      setUser(user)
      setLoading(false)
      
      if (user) {
        console.log("User is signed in, redirecting to dashboard...")
        router.push("/dashboard")
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return <div>Checking authentication...</div>
  }

  return (
    <div>
      {user ? (
        <div>
          <p>Signed in as: {user.displayName || user.email}</p>
          <button onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div>Not signed in</div>
      )}
    </div>
  )
}
