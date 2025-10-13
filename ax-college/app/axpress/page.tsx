"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/Header/Header"
import { usePaper } from "@/contexts/PaperContext"
import { PaperCarousel } from "@/components/Axpress/PaperCarousel"
import { PaperListView } from "@/components/Axpress/PaperListView"
import { SelectedPaperBadge } from "@/components/Axpress/SelectedPaperBadge"
import { LayoutGrid, List } from "lucide-react"
import { fetchPapersByDomain, type PaperWithDomain, type PaperDomain } from "./api"

const DOMAINS: PaperDomain[] = ["금융", "통신", "제조", "유통/물류", "AI", "클라우드"]

export default function AXpressPage() {
  const { selectedPaper, selectPaper } = usePaper()
  const [selectedDomain, setSelectedDomain] = useState<PaperDomain>("AI")
  const [viewMode, setViewMode] = useState<"carousel" | "list">("carousel")
  const [currentPapers, setCurrentPapers] = useState<PaperWithDomain[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 도메인이 변경될 때마다 논문 데이터 로드
  useEffect(() => {
    const loadPapers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const papers = await fetchPapersByDomain(selectedDomain)
        setCurrentPapers(papers)
      } catch (err) {
        console.error("논문 로드 실패:", err)
        setError("논문을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.")
        setCurrentPapers([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPapers()
  }, [selectedDomain])

  const handlePaperSelect = (paper: PaperWithDomain) => {
    selectPaper(paper)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--ax-bg-soft)] to-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pt-12 pb-4 md:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--ax-fg)] mb-4">
            AXpress 논문 탐색
          </h1>
          {selectedPaper ? (
            <SelectedPaperBadge />
          ) : (
            <p className="text-lg text-[var(--ax-fg)]/70 mb-4 animate-pulse">
              도메인별 최신 논문을 탐색하고 학습하세요
            </p>
          )}
        </div>

        {/* View Toggle Button */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setViewMode("carousel")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "carousel"
                  ? "bg-[var(--ax-accent)] text-white"
                  : "text-[var(--ax-fg)] hover:bg-gray-50"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-medium">카드 뷰</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "list"
                  ? "bg-[var(--ax-accent)] text-white"
                  : "text-[var(--ax-fg)] hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">리스트 뷰</span>
            </button>
          </div>
        </div>

        {/* Domain Tabs */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {DOMAINS.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedDomain === domain
                    ? "bg-[var(--ax-accent)] text-white shadow-md"
                    : "bg-white text-[var(--ax-fg)] hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="mb-12">
          {isLoading ? (
            <div className="max-w-5xl mx-auto text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ax-accent)]"></div>
              <p className="mt-4 text-[var(--ax-fg)]/70">논문을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="max-w-5xl mx-auto text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => setSelectedDomain(selectedDomain)}
                className="px-4 py-2 bg-[var(--ax-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                다시 시도
              </button>
            </div>
          ) : viewMode === "carousel" ? (
            <div className="max-w-5xl mx-auto">
              <PaperCarousel papers={currentPapers} onPaperSelect={handlePaperSelect} />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              <PaperListView papers={currentPapers} onPaperSelect={handlePaperSelect} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
