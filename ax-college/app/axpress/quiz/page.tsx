"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/Header/Header"
import { SelectedPaperBadge } from "@/components/Axpress/SelectedPaperBadge"
import { PaperProtectedRoute } from "@/components/Axpress/PaperProtectedRoute"
import { NextPageButton } from "@/components/Axpress/NextPageButton"
import { MissionNav } from "@/components/Axpress/MissionNav"
import { ChatbotFAB } from "@/components/Axpress/ChatbotFAB"
import { ChatbotDialog } from "@/components/Axpress/ChatbotDialog"
import { usePaper } from "@/contexts/PaperContext"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getQuiz, type QuizQuestion } from "../api"
import { LoadingState } from "@/components/ui/LoadingState"

export default function QuizPage() {
  const { selectedPaper, markStepComplete } = usePaper()
  const [quizData, setQuizData] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, "O" | "X">>({})
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({})

  // API 중복 호출 방지를 위한 ref
  const hasLoadedQuiz = useRef(false)
  const currentResearchId = useRef<number | null>(null)

  // 퀴즈 데이터 로드
  useEffect(() => {
    if (!selectedPaper?.research_id) return

    // 이미 같은 논문의 퀴즈를 로드했으면 스킵
    if (hasLoadedQuiz.current && currentResearchId.current === selectedPaper.research_id) {
      console.log(`[Quiz] research_id ${selectedPaper.research_id} 이미 로드됨, API 호출 스킵`)
      return
    }

    // 다른 논문으로 변경된 경우 초기화
    if (currentResearchId.current !== selectedPaper.research_id) {
      hasLoadedQuiz.current = false
      currentResearchId.current = selectedPaper.research_id
    }

    const loadQuiz = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log(`[Quiz API] research_id ${selectedPaper.research_id} 퀴즈 생성 시작`)
        const data = await getQuiz(selectedPaper.research_id)
        console.log(`[Quiz API] research_id ${selectedPaper.research_id} 퀴즈 생성 완료: ${data.length}개`)

        setQuizData(data)
        hasLoadedQuiz.current = true
      } catch (err) {
        console.error("퀴즈 로드 실패:", err)
        setError(err instanceof Error ? err.message : "퀴즈를 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [selectedPaper?.research_id])

  // 페이지 방문 시 자동 완료 처리
  useEffect(() => {
    markStepComplete("quiz")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAnswer = (index: number, answer: "O" | "X") => {
    if (showExplanations[index]) return // 이미 답변한 문제는 변경 불가

    setUserAnswers((prev) => ({ ...prev, [index]: answer }))
    setShowExplanations((prev) => ({ ...prev, [index]: true }))
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < quizData.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const allAnswered = quizData.length > 0 && Object.keys(userAnswers).length === quizData.length

  const currentQuiz = quizData[currentIndex]
  const isCorrect =
    currentQuiz && showExplanations[currentIndex]
      ? userAnswers[currentIndex] === currentQuiz.answer
      : null

  if (loading) {
    return (
      <PaperProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-[var(--ax-bg-soft)] to-white">
          <Header />
          <MissionNav />
          <main className="ax-scaled-content mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8 scale-[0.75] origin-top">
            <SelectedPaperBadge />
            <LoadingState message="퀴즈를 불러오는 중..." />
          </main>
        </div>
      </PaperProtectedRoute>
    )
  }

  if (error) {
    return (
      <PaperProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-[var(--ax-bg-soft)] to-white">
          <Header />
          <MissionNav />
          <main className="ax-scaled-content mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8 scale-[0.75] origin-top">
            <SelectedPaperBadge />
            <div className="ax-card p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="ax-button-primary">
                다시 시도
              </button>
            </div>
          </main>
        </div>
      </PaperProtectedRoute>
    )
  }

  if (!currentQuiz) {
    return (
      <PaperProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-[var(--ax-bg-soft)] to-white">
          <Header />
          <MissionNav />
          <main className="ax-scaled-content mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8 scale-[0.75] origin-top">
            <SelectedPaperBadge />
            <div className="ax-card p-8 text-center">
              <p className="text-[var(--ax-fg)]/70">퀴즈 데이터가 없습니다.</p>
            </div>
          </main>
        </div>
      </PaperProtectedRoute>
    )
  }

  return (
    <PaperProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[var(--ax-bg-soft)] to-white">
        <Header />
        <MissionNav />
        <main className="ax-scaled-content mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8 scale-[0.75] origin-top">
          <SelectedPaperBadge />

          <div className="space-y-6">
            {/* 타이틀 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--ax-fg)] mb-2">O/X 퀴즈</h1>
              <p className="text-[var(--ax-fg)]/70">논문 내용을 얼마나 이해했는지 확인해보세요</p>
            </div>

            {/* 인디케이터 */}
            <div className="flex justify-center items-center gap-2 mb-4">
              {quizData.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "w-8 bg-[var(--ax-accent)]"
                      : showExplanations[idx]
                        ? userAnswers[idx] === quizData[idx].answer
                          ? "w-2 bg-green-500"
                          : "w-2 bg-red-500"
                        : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* 퀴즈 카드 */}
            <div className="relative">
              {/* 카드 스택 효과 (뒤에 살짝 보이는 카드들) */}
              {currentIndex < quizData.length - 1 && (
                <div className="absolute inset-0 ax-card opacity-20 translate-y-2 translate-x-2" />
              )}
              {currentIndex > 0 && (
                <div className="absolute inset-0 ax-card opacity-20 -translate-y-2 -translate-x-2" />
              )}

              {/* 메인 카드 */}
              <div className="ax-card p-12 relative z-10 min-h-[500px] flex flex-col">
                {/* 문제 번호 */}
                <div className="text-center mb-8">
                  <span className="text-2xl font-bold text-[var(--ax-accent)]">
                    Q{currentIndex + 1}
                  </span>
                  <span className="text-lg text-[var(--ax-fg)]/50 ml-2">
                    / {quizData.length}
                  </span>
                </div>

                {/* 문제 */}
                <div className="flex-1 flex items-center justify-center mb-8">
                  <p className="text-2xl text-[var(--ax-fg)] text-center leading-relaxed px-4">
                    {currentQuiz.question}
                  </p>
                </div>

                {/* O/X 버튼 */}
                {!showExplanations[currentIndex] ? (
                  <div className="flex justify-center gap-8 mb-8">
                    <button
                      onClick={() => handleAnswer(currentIndex, "O")}
                      className="w-32 h-32 rounded-full border-4 border-[var(--ax-accent)] hover:bg-[var(--ax-accent)] hover:text-white transition-all text-4xl font-bold text-[var(--ax-accent)] hover:scale-110 active:scale-95"
                    >
                      O
                    </button>
                    <button
                      onClick={() => handleAnswer(currentIndex, "X")}
                      className="w-32 h-32 rounded-full border-4 border-[var(--ax-accent)] hover:bg-[var(--ax-accent)] hover:text-white transition-all text-4xl font-bold text-[var(--ax-accent)] hover:scale-110 active:scale-95"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 mb-8">
                    {/* 선택한 답변 표시 */}
                    <div className="text-center">
                      <p className="text-lg text-[var(--ax-fg)]/70 mb-2">당신의 답변</p>
                      <div
                        className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-3xl font-bold ${
                          isCorrect
                            ? "bg-green-100 text-green-600 border-4 border-green-500"
                            : "bg-red-100 text-red-600 border-4 border-red-500"
                        }`}
                      >
                        {userAnswers[currentIndex]}
                      </div>
                    </div>

                    {/* 정답 */}
                    <div className="text-center">
                      <p className="text-lg text-[var(--ax-fg)]/70 mb-2">정답</p>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 border-4 border-green-500 text-2xl font-bold">
                        {currentQuiz.answer}
                      </div>
                    </div>

                    {/* 해설 */}
                    <div
                      className={`p-6 rounded-lg border-2 ${
                        isCorrect
                          ? "bg-green-50 border-green-500"
                          : "bg-red-50 border-red-500"
                      }`}
                    >
                      <p className="text-lg font-semibold mb-2">
                        <span
                          className={
                            isCorrect ? "text-green-700" : "text-red-700"
                          }
                        >
                          {isCorrect ? "✓ 정답입니다!" : "✗ 틀렸습니다!"}
                        </span>
                      </p>
                      <p
                        className={`leading-relaxed ${
                          isCorrect ? "text-green-900" : "text-red-900"
                        }`}
                      >
                        {currentQuiz.explanation}
                      </p>
                    </div>
                  </div>
                )}

                {/* 네비게이션 버튼 */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="ax-button-primary px-6 py-3 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    이전
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-[var(--ax-fg)]/60">
                      {Object.keys(userAnswers).length} / {quizData.length} 완료
                    </p>
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={currentIndex === quizData.length - 1}
                    className="ax-button-primary px-6 py-3 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    다음
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 완료 메시지 */}
            {allAnswered && (
              <div className="ax-card p-6 text-center bg-gradient-to-r from-[var(--ax-accent)]/10 to-[var(--ax-accent)]/5">
                <p className="text-xl font-semibold text-[var(--ax-fg)] mb-2">
                  모든 퀴즈를 완료했습니다! 🎉
                </p>
                <p className="text-[var(--ax-fg)]/70">
                  정답:{" "}
                  {
                    Object.entries(userAnswers).filter(
                      ([idx, answer]) => answer === quizData[Number(idx)].answer
                    ).length
                  }{" "}
                  / {quizData.length}
                </p>
              </div>
            )}
          </div>
        </main>

        {/* 다음 페이지로 이동 버튼 - 모든 퀴즈 완료 시 표시 */}
        <NextPageButton
          nextPath="/axpress/tts"
          buttonText="팟캐스트 들으러가기"
          tooltipText="팟캐스트로 다시 들어보세요!"
          trigger="custom"
          show={allAnswered}
        />

        {/* 챗봇 FAB 버튼 및 대화창 */}
        <ChatbotFAB />
        <ChatbotDialog />
      </div>
    </PaperProtectedRoute>
  )
}
