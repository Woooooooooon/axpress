"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Construction, ArrowLeft } from "lucide-react"

export default function PreparingPage() {
  const searchParams = useSearchParams()
  const title = searchParams.get("title") || "상세 내용 준비중입니다"
  const description = searchParams.get("description") || "곧 서비스될 예정입니다."

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="ax-card max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[var(--ax-accent)]/10 p-4">
            <Construction className="h-12 w-12 text-[var(--ax-accent)]" />
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-[var(--ax-fg)]">{title}</h1>
        <p className="mb-6 text-[var(--ax-fg)]/70">{description}</p>

        <Link
          href="/axpress"
          className="ax-button-primary ax-focus-ring inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          AXpress로 돌아가기
        </Link>
      </div>
    </div>
  )
}
