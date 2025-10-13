"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePaper } from "@/contexts/PaperContext"
import { useAXToast } from "@/hooks/use-toast"

export function PaperProtectedRoute({ children }: { children: React.ReactNode }) {
  const { selectedPaper } = usePaper()
  const router = useRouter()
  const { showToast } = useAXToast()

  useEffect(() => {
    if (!selectedPaper) {
      showToast({
        title: "논문을 먼저 선택해주세요",
        description: "메인 페이지에서 논문을 선택한 후 이용하실 수 있습니다.",
        variant: "default",
      })
      router.push("/axpress")
    }
  }, [selectedPaper, router, showToast])

  if (!selectedPaper) {
    return null
  }

  return <>{children}</>
}
