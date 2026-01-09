"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { Loader2 } from "lucide-react"

export default function ConfigurationPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard/config/app")
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
