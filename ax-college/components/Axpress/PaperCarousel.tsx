"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, FileText, Calendar, User, ExternalLink, Sparkles } from "lucide-react"
import type { PaperWithDomain } from "@/app/axpress/api"
import { usePaper } from "@/contexts/PaperContext"

interface PaperCarouselProps {
  papers: PaperWithDomain[]
  onPaperSelect: (paper: PaperWithDomain) => void
}

export function PaperCarousel({ papers, onPaperSelect }: PaperCarouselProps) {
  const router = useRouter()
  const { selectedPaper } = usePaper()
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (selectedPaper) {
      const index = papers.findIndex(p => p.research_id === selectedPaper.research_id)
      return index !== -1 ? index : 0
    }
    return 0
  })
  const [isLeftHovered, setIsLeftHovered] = useState(false)
  const [isRightHovered, setIsRightHovered] = useState(false)

  // 빈 배열 처리
  if (!papers || papers.length === 0) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <p className="text-[var(--ax-fg)]/50 text-lg">논문 데이터를 불러오는 중입니다...</p>
      </div>
    )
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + papers.length) % papers.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % papers.length)
  }

  const handlePaperClick = (paper: PaperWithDomain) => {
    onPaperSelect(paper)
  }

  const currentPaper = papers[currentIndex]
  const prevPaper = papers[(currentIndex - 1 + papers.length) % papers.length]
  const nextPaper = papers[(currentIndex + 1) % papers.length]

  const PaperCard = ({ paper, variant = "main", onClick }: { paper: PaperWithDomain; variant?: "prev" | "main" | "next"; onClick?: () => void }) => {
    const isSelected = selectedPaper?.research_id === paper.research_id
    const isPreview = variant !== "main"

    return (
      <div
        className={`ax-card p-6 transition-all duration-300 min-h-[420px] flex flex-col relative ${
          variant === "main"
            ? isSelected
              ? "shadow-2xl border-l-8 border-[var(--ax-accent)] cursor-pointer scale-[1.02]"
              : "shadow-xl cursor-pointer hover:shadow-2xl"
            : "opacity-30 cursor-pointer hover:opacity-50"
        }`}
        onClick={onClick}
      >
        {isSelected && variant === "main" && (
          <div className="absolute -top-3 -right-3 bg-[var(--ax-accent)] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
            <Sparkles className="w-3 h-3" />
            선택됨
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-[var(--ax-accent)]/10 to-purple-500/10">
            <FileText className="w-6 h-6 text-[var(--ax-accent)]" />
          </div>
          <span className="text-xs text-[var(--ax-fg)]/60 bg-[var(--ax-bg-soft)] px-3 py-1 rounded-full">
            {paper.source}
          </span>
        </div>

        <h3 className={`text-lg font-semibold text-[var(--ax-fg)] mb-3 transition-colors line-clamp-2 ${
          isPreview ? "text-sm" : ""
        }`}>
          {paper.title}
        </h3>

        <p className={`text-sm text-[var(--ax-fg)]/70 mb-4 flex-1 ${
          isPreview ? "line-clamp-2 text-xs" : "line-clamp-4"
        }`}>
          {paper.abstract}
        </p>

        <div className={`space-y-2 text-sm text-[var(--ax-fg)]/60 mb-4 ${isPreview ? "text-xs" : ""}`}>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">{paper.authors.join(", ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{paper.publishedAt}</span>
          </div>
        </div>

        {variant === "main" && (
          <div className="flex items-center justify-between pt-4 border-t border-[var(--ax-border)]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePaperClick(paper)
              }}
              className={`text-sm font-medium transition-all flex items-center gap-2 ${
                isSelected
                  ? "text-[var(--ax-accent)] font-bold"
                  : "text-[var(--ax-accent)] hover:underline"
              }`}
            >
              {isSelected ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  여기를 클릭해 학습 시작하세요!
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
              className="text-sm text-[var(--ax-fg)]/60 hover:text-[var(--ax-accent)] flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              원문
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-18 gap-4 items-center">
        {/* Left Preview + Navigation */}
        {papers.length > 1 && (
          <div
            className="col-span-4 relative cursor-pointer"
            onMouseEnter={() => setIsLeftHovered(true)}
            onMouseLeave={() => setIsLeftHovered(false)}
            onClick={handlePrev}
          >
            <PaperCard paper={prevPaper} variant="prev" />
            <div
              className={`absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg transition-opacity duration-300 pointer-events-none ${
                isLeftHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="p-4 bg-white rounded-full shadow-xl">
                <ChevronLeft className="w-8 h-8 text-[var(--ax-accent)]" />
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className={papers.length > 1 ? "col-span-10" : "col-span-18"}>
          <PaperCard paper={currentPaper} variant="main" onClick={() => handlePaperClick(currentPaper)} />
        </div>

        {/* Right Preview + Navigation */}
        {papers.length > 1 && (
          <div
            className="col-span-4 relative cursor-pointer"
            onMouseEnter={() => setIsRightHovered(true)}
            onMouseLeave={() => setIsRightHovered(false)}
            onClick={handleNext}
          >
            <PaperCard paper={nextPaper} variant="next" />
            <div
              className={`absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg transition-opacity duration-300 pointer-events-none ${
                isRightHovered ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="p-4 bg-white rounded-full shadow-xl">
                <ChevronRight className="w-8 h-8 text-[var(--ax-accent)]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Dots */}
      {papers.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {papers.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-[var(--ax-accent)] w-8"
                  : "bg-gray-300 hover:bg-gray-400 w-2"
              }`}
              aria-label={`${index + 1}번째 논문으로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
