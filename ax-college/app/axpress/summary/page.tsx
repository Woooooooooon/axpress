"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Header } from "@/components/Header/Header"
import { SelectedPaperBadge } from "@/components/Axpress/SelectedPaperBadge"
import { PaperProtectedRoute } from "@/components/Axpress/PaperProtectedRoute"
import { NextPageButton } from "@/components/Axpress/NextPageButton"
import { MissionNav } from "@/components/Axpress/MissionNav"
import { LoadingState } from "@/components/ui/LoadingState"
import { ChatbotFAB } from "@/components/Axpress/ChatbotFAB"
import { ChatbotDialog } from "@/components/Axpress/ChatbotDialog"
import { usePaper } from "@/contexts/PaperContext"
import { useChatbot } from "@/contexts/ChatbotContext"
import { downloadPaperFile, getSummary, type SummaryResponse } from "@/app/axpress/api"

export default function SummaryPage() {
  const { selectedPaper, markStepComplete } = usePaper()
  const { createChatbotForPaper } = useChatbot()
  const [isDownloading, setIsDownloading] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // 페이지 방문 시 자동 완료 처리
  useEffect(() => {
    markStepComplete("summary")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 챗봇 생성 (다운로드 시작 시점에 함께 시작)
  useEffect(() => {
    if (!selectedPaper?.research_id) return

    // 챗봇 생성 시작 (백그라운드에서 실행)
    createChatbotForPaper(selectedPaper.research_id).catch((error) => {
      console.error("[Chatbot] 챗봇 생성 백그라운드 요청 실패:", error)
    })
  }, [selectedPaper?.research_id, createChatbotForPaper])

  // AI 요약 로드
  useEffect(() => {
    if (!selectedPaper?.research_id) return

    let cancelled = false

    const loadSummary = async () => {
      setIsLoadingSummary(true)
      setSummaryError(null)
      try {
        const data = await getSummary(selectedPaper.research_id)
        if (!cancelled) {
          setSummaryData(data)
        }
      } catch (error) {
        if (!cancelled) {
          console.error("AI 요약 로드 실패:", error)
          setSummaryError(error instanceof Error ? error.message : "AI 요약을 불러오는데 실패했습니다.")
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSummary(false)
        }
      }
    }

    loadSummary()

    return () => {
      cancelled = true
    }
  }, [selectedPaper?.research_id])

  const handleDownload = async () => {
    if (!selectedPaper?.research_id) {
      alert("논문 정보를 찾을 수 없습니다.")
      return
    }

    // 이미 다운로드 중이면 중복 실행 방지
    if (isDownloading) {
      console.log("[Download] 이미 다운로드 중입니다.")
      return
    }

    console.log("[Download] 다운로드 시작:", selectedPaper.research_id)
    setIsDownloading(true)
    try {
      await downloadPaperFile(selectedPaper.research_id)
      console.log("[Download] 다운로드 완료")
    } catch (error) {
      console.error("[Download] 다운로드 실패:", error)
      alert(error instanceof Error ? error.message : "논문 다운로드에 실패했습니다.")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <PaperProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[var(--ax-bg-soft)] to-white">
        <Header />
        <MissionNav />
        <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8">
          <SelectedPaperBadge />

          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--ax-fg)] mb-2">논문 요약</h1>
              <p className="text-[var(--ax-fg)]/70">선택한 논문의 핵심 내용을 확인하세요</p>
            </div>

            {/* Summary Content */}
            <div className="ax-card p-6 md:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--ax-fg)] mb-4">Abstract</h2>
                <p className="text-[var(--ax-fg)]/80 leading-relaxed whitespace-pre-line">
                  {selectedPaper?.abstract}
                </p>
              </div>

              <div className="border-t border-[var(--ax-border)] pt-6">
                <h2 className="text-xl font-semibold text-[var(--ax-fg)] mb-4">논문 정보</h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-[var(--ax-fg)]/60 mb-1">저자</dt>
                    <dd className="text-[var(--ax-fg)]">{selectedPaper?.authors.join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-[var(--ax-fg)]/60 mb-1">출처</dt>
                    <dd className="text-[var(--ax-fg)]">{selectedPaper?.source}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-[var(--ax-fg)]/60 mb-1">게시일</dt>
                    <dd className="text-[var(--ax-fg)]">{selectedPaper?.publishedAt}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-[var(--ax-fg)]/60 mb-1">원문 다운로드</dt>
                    <dd>
                      <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="text-[var(--ax-accent)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDownloading ? "다운로드 중..." : "PDF 다운로드 →"}
                      </button>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* AI Summary Section */}
              <div className="border-t border-[var(--ax-border)] pt-6">
                <h2 className="text-xl font-semibold text-[var(--ax-fg)] mb-4">AI 요약</h2>
                {isLoadingSummary ? (
                  <LoadingState message="AI가 논문을 분석하고 있습니다..." />
                ) : summaryError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600">{summaryError}</p>
                  </div>
                ) : summaryData ? (
                  <div className="bg-[var(--ax-bg-soft)] rounded-lg p-6">
                    <article className="prose prose-sm max-w-none prose-headings:text-[var(--ax-fg)] prose-p:text-[var(--ax-fg)]/80 prose-strong:text-[var(--ax-fg)] prose-li:text-[var(--ax-fg)]/80">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryData.summary}</ReactMarkdown>
                    </article>
                  </div>
                ) : (
                  <div className="bg-[var(--ax-bg-soft)] rounded-lg p-6 text-center">
                    <p className="text-[var(--ax-fg)]/60">AI 요약을 불러올 수 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* 다음 페이지로 이동 버튼 */}
        <NextPageButton
          nextPath="/axpress/quiz"
          buttonText="퀴즈 풀러가기"
          tooltipText="퀴즈로 이해도를 확인해보세요!"
        />

        {/* 챗봇 FAB 버튼 및 대화창 */}
        <ChatbotFAB />
        <ChatbotDialog />
      </div>
    </PaperProtectedRoute>
  )
}
