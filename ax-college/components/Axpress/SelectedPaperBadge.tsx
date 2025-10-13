"use client"

import { usePaper } from "@/contexts/PaperContext"
import { FileText } from "lucide-react"

export function SelectedPaperBadge() {
  const { selectedPaper } = usePaper()

  if (!selectedPaper) {
    return null
  }

  return (
    <div className="mb-6 flex items-center justify-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--ax-accent)]/10 to-purple-500/10 px-6 py-3 shadow-sm border border-[var(--ax-accent)]/20">
        <FileText className="h-5 w-5 text-[var(--ax-accent)]" />
        <span className="text-sm font-medium text-[var(--ax-fg)]">
          선택된 논문: <span className="font-semibold text-[var(--ax-accent)]">{selectedPaper.title}</span>
        </span>
      </div>
    </div>
  )
}
