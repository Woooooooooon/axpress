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
const VIDEO_CACHE_PREFIX = "video_generated_"
const DOWNLOAD_CACHE_PREFIX = "paper_downloaded_"

export default function AXpressPage() {
  const { selectedPaper, selectPaper, isDownloading, downloadError } = usePaper()
  const [selectedDomain, setSelectedDomain] = useState<PaperDomain>("AI")
  const [viewMode, setViewMode] = useState<"carousel" | "list">("carousel")
  const [currentPapers, setCurrentPapers] = useState<PaperWithDomain[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 메인 페이지 마운트 시 캐시 초기화
  useEffect(() => {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      // 동영상 캐시와 다운로드 캐시 모두 삭제
      if (key && (key.startsWith(VIDEO_CACHE_PREFIX) || key.startsWith(DOWNLOAD_CACHE_PREFIX))) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log(`[Cache Clear] ${key} 삭제됨`)
    })

    if (keysToRemove.length > 0) {
      console.log(`[Cache Clear] 캐시 ${keysToRemove.length}개 초기화 완료`)
    }
  }, [])

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

  const handlePaperSelect = async (paper: PaperWithDomain) => {
    try {
      await selectPaper(paper)
    } catch (error) {
      console.error("[Main Page] 논문 선택 실패:", error)
      // 에러는 PaperContext에서 관리되므로 여기서는 로그만
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--ax-bg-soft)] to-white">
      <Header />

      {/* 다운로드 중 오버레이 */}
      {isDownloading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ax-accent)]"></div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-[var(--ax-fg)] mb-2">
                  논문 다운로드 중...
                </h3>
                <p className="text-[var(--ax-fg)]/70 text-sm">
                  S3에 논문을 저장하고 있습니다. 잠시만 기다려주세요.
                </p>
                <p className="text-[var(--ax-fg)]/50 text-xs mt-2">
                  다운로드가 완료되어야 다른 기능을 사용할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 다운로드 에러 모달 */}
      {downloadError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-[var(--ax-fg)] mb-2">
                  다운로드 실패
                </h3>
                <p className="text-[var(--ax-fg)]/70 text-sm mb-4">
                  {downloadError}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[var(--ax-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  페이지 새로고침
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 pt-12 pb-4 md:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--ax-fg)] mb-5">
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
