"use client"

import { useEffect } from "react"
import { Header } from "@/components/Header/Header"
import { SelectedPaperBadge } from "@/components/Axpress/SelectedPaperBadge"
import { PaperProtectedRoute } from "@/components/Axpress/PaperProtectedRoute"
import { Calendar, Clock, CheckCircle2, BookOpen, Headphones, Award } from "lucide-react"
import { MissionNav } from "@/components/Axpress/MissionNav"
import { usePaper } from "@/contexts/PaperContext"


// Mock learning history data
const MOCK_HISTORY = [
  {
    id: "1",
    activity: "논문 요약 학습",
    date: "2025-09-28",
    duration: "15분",
    status: "completed",
    icon: BookOpen,
  },
  {
    id: "2",
    activity: "퀴즈 완료",
    date: "2025-09-28",
    duration: "10분",
    status: "completed",
    score: "8/10",
    icon: Award,
  },
  {
    id: "3",
    activity: "팟캐스트 청취",
    date: "2025-09-27",
    duration: "25분",
    status: "in_progress",
    icon: Headphones,
  },
]

const STATS = [
  { label: "총 학습 시간", value: "2시간 30분", color: "bg-blue-500" },
  { label: "완료한 논문", value: "12편", color: "bg-green-500" },
  { label: "퀴즈 평균 점수", value: "85%", color: "bg-purple-500" },
  { label: "연속 학습일", value: "7일", color: "bg-orange-500" },
]

export default function HistoryPage() {
  const { markStepComplete } = usePaper()

  // 페이지 방문 시 자동 완료 처리
  useEffect(() => {
    markStepComplete("history")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PaperProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[var(--ax-bg-soft)] to-white">
        <Header />
        <MissionNav />
        <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8">
          <SelectedPaperBadge />

          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--ax-fg)] mb-2">학습 이력</h1>
              <p className="text-[var(--ax-fg)]/70">나의 논문 학습 기록을 확인하세요</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="ax-card p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                    <span className="text-sm text-[var(--ax-fg)]/60">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--ax-fg)]">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Learning History Timeline */}
            <div className="ax-card p-6">
              <h2 className="text-xl font-semibold text-[var(--ax-fg)] mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                최근 활동
              </h2>

              <div className="space-y-4">
                {MOCK_HISTORY.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 rounded-lg hover:bg-[var(--ax-bg-soft)] transition-colors"
                    >
                      <div
                        className={`p-3 rounded-full ${
                          item.status === "completed" ? "bg-green-100" : "bg-blue-100"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            item.status === "completed" ? "text-green-600" : "text-blue-600"
                          }`}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-[var(--ax-fg)]">{item.activity}</h3>
                          {item.status === "completed" && (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[var(--ax-fg)]/60">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {item.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {item.duration}
                          </span>
                          {item.score && (
                            <span className="flex items-center gap-1 text-[var(--ax-accent)] font-medium">
                              <Award className="w-4 h-4" />
                              {item.score}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* MyHR Integration Notice */}
            <div className="ax-card p-6 bg-gradient-to-r from-[var(--ax-accent)]/5 to-purple-500/5 border-2 border-[var(--ax-accent)]/20">
              <h3 className="font-semibold text-[var(--ax-fg)] mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--ax-accent)]" />
                MyHR 자동 연동
              </h3>
              <p className="text-sm text-[var(--ax-fg)]/70">
                학습 이력이 자동으로 MyHR 교육이력에 기록됩니다. 백엔드 연동 후 실시간 동기화가 지원됩니다.
              </p>
            </div>
          </div>
        </main>
      </div>
    </PaperProtectedRoute>
  )
}
