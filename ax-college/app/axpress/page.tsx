"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/Header/Header"
import { usePaper } from "@/contexts/PaperContext"
import { PaperCarousel } from "@/components/Axpress/PaperCarousel"
import { PaperListView } from "@/components/Axpress/PaperListView"
import { SelectedPaperBadge } from "@/components/Axpress/SelectedPaperBadge"
import { LayoutGrid, List, Search, Upload, Redo2 } from "lucide-react"
import {
  fetchPapersByDomain,
  fetchPapersByKeyword,
  extractKeywordsFromPDF,
  extractKeywordsFromText,
  type PaperWithDomain,
  type PaperDomain
} from "./api"

const DOMAINS: PaperDomain[] = ["금융", "통신", "제조", "유통/물류", "AI", "클라우드"]
const VIDEO_CACHE_PREFIX = "video_generated_"
const DOWNLOAD_CACHE_PREFIX = "paper_downloaded_"
const KEYWORD_SEARCH_CACHE_KEY = "keyword_search_data"

export default function AXpressPage() {
  const { selectedPaper, selectPaper, isDownloading, downloadError } = usePaper()
  const [selectedDomain, setSelectedDomain] = useState<PaperDomain>("AI")
  const [viewMode, setViewMode] = useState<"carousel" | "list">("carousel")
  const [currentPapers, setCurrentPapers] = useState<PaperWithDomain[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 키워드 검색 관련 상태
  const [searchMode, setSearchMode] = useState<"domain" | "keyword">("domain")
  const [searchText, setSearchText] = useState("")
  const [extractedKeywords, setExtractedKeywords] = useState<Record<string, string>>({})
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 메인 페이지 마운트 시 캐시 초기화 및 키워드 검색 복원
  useEffect(() => {
    // 키워드 검색 데이터 복원
    const savedKeywordData = localStorage.getItem(KEYWORD_SEARCH_CACHE_KEY)
    if (savedKeywordData) {
      try {
        const { keywords, selectedKeyword: savedSelectedKeyword, fileName } = JSON.parse(savedKeywordData)
        setExtractedKeywords(keywords)
        setSelectedKeyword(savedSelectedKeyword)
        setSearchMode("keyword")
        if (fileName) {
          setUploadedFileName(fileName)
        }
        console.log(`[Keyword Cache] 키워드 검색 데이터 복원 완료`)
      } catch (error) {
        console.error("[Keyword Cache] 키워드 검색 데이터 파싱 실패:", error)
        localStorage.removeItem(KEYWORD_SEARCH_CACHE_KEY)
      }
    }

    // 동영상 캐시와 다운로드 캐시만 삭제 (키워드 검색 캐시는 유지)
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      // 동영상 캐시와 다운로드 캐시만 삭제 (키워드 검색 캐시는 제외)
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

  // 도메인 또는 키워드가 변경될 때마다 논문 데이터 로드
  useEffect(() => {
    const loadPapers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (searchMode === "domain") {
          const papers = await fetchPapersByDomain(selectedDomain)
          setCurrentPapers(papers)
        } else if (searchMode === "keyword" && selectedKeyword) {
          const papers = await fetchPapersByKeyword(selectedKeyword)
          setCurrentPapers(papers)
        }
      } catch (err) {
        console.error("논문 로드 실패:", err)
        setError("논문을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.")
        setCurrentPapers([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPapers()
  }, [selectedDomain, searchMode, selectedKeyword])

  // 텍스트 검색 핸들러
  const handleTextSearch = async () => {
    if (!searchText.trim()) return

    setIsExtracting(true)
    setError(null)

    try {
      const result = await extractKeywordsFromText(searchText)
      setExtractedKeywords(result.keywords)
      setSearchMode("keyword")

      // 첫 번째 키워드를 자동 선택
      const firstKeyword = Object.values(result.keywords)[0]
      if (firstKeyword) {
        setSelectedKeyword(firstKeyword)

        // 키워드 검색 데이터를 localStorage에 저장
        localStorage.setItem(KEYWORD_SEARCH_CACHE_KEY, JSON.stringify({
          keywords: result.keywords,
          selectedKeyword: firstKeyword,
          fileName: null
        }))
        console.log(`[Keyword Cache] 텍스트 검색 결과 저장 완료`)
      }
    } catch (err) {
      console.error("키워드 추출 실패:", err)
      setError("키워드 추출에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setIsExtracting(false)
    }
  }

  // PDF 업로드 핸들러
  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      setError("PDF 파일만 업로드 가능합니다.")
      return
    }

    setIsExtracting(true)
    setError(null)
    setUploadedFileName(file.name)

    try {
      const result = await extractKeywordsFromPDF(file)
      setExtractedKeywords(result.keywords)
      setSearchMode("keyword")

      // 첫 번째 키워드를 자동 선택
      const firstKeyword = Object.values(result.keywords)[0]
      if (firstKeyword) {
        setSelectedKeyword(firstKeyword)

        // 키워드 검색 데이터를 localStorage에 저장 (파일명 포함)
        localStorage.setItem(KEYWORD_SEARCH_CACHE_KEY, JSON.stringify({
          keywords: result.keywords,
          selectedKeyword: firstKeyword,
          fileName: file.name
        }))
        console.log(`[Keyword Cache] PDF 검색 결과 저장 완료`)
      }
    } catch (err) {
      console.error("키워드 추출 실패:", err)
      setError("키워드 추출에 실패했습니다. 다시 시도해주세요.")
      setUploadedFileName(null)
    } finally {
      setIsExtracting(false)
      // 파일 input 초기화 (하지만 파일명은 유지)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // 키워드 선택 핸들러
  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeyword(keyword)
    setSearchMode("keyword")

    // 선택된 키워드 업데이트하여 localStorage에 저장
    const savedData = localStorage.getItem(KEYWORD_SEARCH_CACHE_KEY)
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        localStorage.setItem(KEYWORD_SEARCH_CACHE_KEY, JSON.stringify({
          ...data,
          selectedKeyword: keyword
        }))
        console.log(`[Keyword Cache] 선택된 키워드 업데이트: ${keyword}`)
      } catch (error) {
        console.error("[Keyword Cache] 키워드 업데이트 실패:", error)
      }
    }
  }

  // 도메인 모드로 돌아가기
  const handleBackToDomain = () => {
    setSearchMode("domain")
    setExtractedKeywords({})
    setSelectedKeyword(null)
    setSearchText("")
    setUploadedFileName(null)

    // 키워드 검색 캐시 삭제
    localStorage.removeItem(KEYWORD_SEARCH_CACHE_KEY)
    console.log(`[Keyword Cache] 키워드 검색 캐시 삭제됨`)
  }

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
              {searchMode === "keyword" && selectedKeyword
                ? `"${selectedKeyword}" 관련 논문을 탐색 중입니다`
                : "도메인별 최신 논문을 탐색하고 학습하세요"}
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

        {/* Domain Tabs 또는 Keyword Search */}
        <div className="mb-8">
          {searchMode === "domain" ? (
            // 도메인 탭
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
          ) : (
            // 키워드 검색 모드
            <div>
              {/* 추출된 키워드 제목과 뒤로가기 버튼 */}
              {Object.keys(extractedKeywords).length > 0 && (
                <div className="relative mb-4">
                  <h2 className="text-xl font-bold text-[var(--ax-fg)] text-center">추출된 키워드</h2>
                  <button
                    onClick={handleBackToDomain}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--ax-fg)]/60 hover:text-[var(--ax-fg)] flex items-center gap-1 transition-colors"
                  >
                    <Redo2 className="w-4 h-4" />
                    기본 도메인으로 돌아가기
                  </button>
                </div>
              )}

              {/* 업로드된 파일명 표시 */}
              {uploadedFileName && (
                <div className="flex items-center justify-center gap-2 text-sm text-[var(--ax-fg)]/70 mb-3">
                  <Upload className="w-4 h-4" />
                  <span>업로드된 파일: {uploadedFileName}</span>
                </div>
              )}

              {/* 키워드 탭 - 도메인 탭과 동일한 스타일 */}
              {Object.keys(extractedKeywords).length > 0 && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {Object.entries(extractedKeywords).map(([korean, english]) => (
                    <button
                      key={english}
                      onClick={() => handleKeywordSelect(english)}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                        selectedKeyword === english
                          ? "bg-[var(--ax-accent)] text-white shadow-md"
                          : "bg-white text-[var(--ax-fg)] hover:bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div>{korean}</div>
                      <div className="text-xs opacity-70">{english}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 검색 및 PDF 업로드 섹션 - 항상 표시 */}
          <div className="max-w-3xl mx-auto mt-6">
            <div className="flex gap-2">
              {/* 텍스트 검색 */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="검색어를 입력하세요 (예: AI adoption, productivity)"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSearch()}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ax-accent)] focus:border-transparent"
                  disabled={isExtracting}
                />
                <button
                  onClick={handleTextSearch}
                  disabled={!searchText.trim() || isExtracting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--ax-accent)] hover:bg-[var(--ax-accent)]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>

              {/* PDF 업로드 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting}
                className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" />
                <span className="font-medium">PDF 업로드</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePDFUpload}
                className="hidden"
              />
            </div>

            {/* 키워드 추출 중 표시 */}
            {isExtracting && (
              <div className="flex items-center justify-center gap-2 text-[var(--ax-accent)] mt-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--ax-accent)]"></div>
                <span>키워드 추출 중...</span>
              </div>
            )}
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
