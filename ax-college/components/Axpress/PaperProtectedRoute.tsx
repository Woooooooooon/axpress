"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { usePaper } from "@/contexts/PaperContext"
import { toast } from "@/hooks/use-toast"

export function PaperProtectedRoute({ children }: { children: React.ReactNode }) {
  const { selectedPaper } = usePaper()
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    // 논문이 없고 아직 리다이렉트하지 않았을 때만 실행
    if (!selectedPaper && !hasRedirected.current) {
      hasRedirected.current = true
      toast({
        title: "논문을 선택하여 학습을 시작해 주세요",
        className: "ax-toast",
      })
      router.push("/axpress")
    }

    // 논문이 선택되면 플래그 리셋 (다른 페이지 갔다가 다시 올 때를 위해)
    if (selectedPaper) {
      hasRedirected.current = false
    }
  }, [selectedPaper, router])

  if (!selectedPaper) {
    return null
  }

  return <>{children}</>
}
