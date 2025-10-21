"use client"

import { useRouter } from "next/navigation"
import { Calendar, User, Sparkles, ExternalLink } from "lucide-react"
import type { PaperWithDomain } from "@/app/axpress/api"
import { usePaper } from "@/contexts/PaperContext"

interface PaperListViewProps {
  papers: PaperWithDomain[]
  onPaperSelect: (paper: PaperWithDomain) => void
}

export function PaperListView({ papers, onPaperSelect }: PaperListViewProps) {
  const router = useRouter()
  const { selectedPaper } = usePaper()

  const handlePaperClick = (paper: PaperWithDomain) => {
    onPaperSelect(paper)
  }

  const handleStartLearning = (e: React.MouseEvent, paper: PaperWithDomain) => {
    e.stopPropagation()
    onPaperSelect(paper)
  }

  return (
    <div className="space-y-3">
      {papers.map((paper, index) => {
        const isSelected = selectedPaper?.title === paper.title

        return (
          <div
            key={index}
            onClick={() => handlePaperClick(paper)}
            className={`ax-card p-4 transition-all duration-300 cursor-pointer group relative ${
              isSelected
                ? "shadow-2xl border-l-8 border-[var(--ax-accent)] scale-[1.01]"
                : "hover:shadow-md"
            }`}
          >
            {isSelected && (
              <div className="absolute -top-2 -right-2 bg-[var(--ax-accent)] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
                <Sparkles className="w-3 h-3" />
                선택됨
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold mb-2 transition-colors line-clamp-1 ${
                    isSelected
                      ? "text-[var(--ax-accent)] font-bold"
                      : "text-[var(--ax-fg)] group-hover:text-[var(--ax-accent)]"
                  }`}
                >
                  {paper.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ax-fg)]/60 mb-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {paper.authors[0]}
                    {paper.authors.length > 1 && ` 외 ${paper.authors.length - 1}명`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {paper.publishedAt}
                  </span>
                  <span className="bg-[var(--ax-bg-soft)] px-2 py-0.5 rounded">
                    {paper.source}
                  </span>
                </div>
                <p className="text-sm text-[var(--ax-fg)]/70 line-clamp-2 mb-2">
                  {paper.abstract}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={(e) => handleStartLearning(e, paper)}
                  className={`text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                    isSelected
                      ? "text-[var(--ax-accent)] font-bold"
                      : "text-[var(--ax-accent)] hover:underline"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Sparkles className="w-3 h-3" />
                      학습 시작하기!
                    </>
                  ) : (
                    "학습 시작 →"
                  )}
                </button>
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-[var(--ax-fg)]/60 hover:text-[var(--ax-accent)] flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  원문
                </a>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
