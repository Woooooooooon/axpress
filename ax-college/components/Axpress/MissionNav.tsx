"use client"

import { usePathname, useRouter } from "next/navigation"
import { FileText, Brain, Headphones, History, Sparkles, CheckCircle2, Circle } from "lucide-react"
import { usePaper } from "@/contexts/PaperContext"

interface MissionStep {
  id: string
  title: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const MISSION_STEPS: MissionStep[] = [
  {
    id: "summary",
    title: "논문 요약",
    path: "/axpress/summary",
    icon: FileText,
    description: "논문 핵심 내용 확인",
  },
  {
    id: "quiz",
    title: "퀴즈",
    path: "/axpress/quiz",
    icon: Brain,
    description: "이해도 테스트",
  },
  {
    id: "tts",
    title: "팟캐스트",
    path: "/axpress/tts",
    icon: Headphones,
    description: "음성으로 다시 듣기",
  },
  {
    id: "history",
    title: "학습 이력",
    path: "/axpress/history",
    icon: History,
    description: "학습 기록 확인",
  },
]

export function MissionNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { completedSteps } = usePaper()

  // 현재 단계 인덱스 찾기
  const currentStepIndex = MISSION_STEPS.findIndex((step) => pathname.startsWith(step.path))

  // 단계 상태 결정 (완료/현재/미완료)
  const getStepStatus = (index: number) => {
    const step = MISSION_STEPS[index]
    // 현재 페이지인 경우
    if (index === currentStepIndex) return "current"
    // 완료 상태인 경우
    if (completedSteps.has(step.id as any)) return "completed"
    // 미완료
    return "upcoming"
  }

  const handleStepClick = (path: string) => {
    router.push(path)
  }

  const handleNewPaper = () => {
    router.push("/axpress")
  }

  return (
    <div className="fixed top-40 left-4 z-40">
      {/* 미션 카드 */}
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl border-2 border-[var(--ax-accent)]/20 p-4 w-64">
        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
          
          <h3 className="font-bold text-[var(--ax-fg)]">학습 미션</h3>
        </div>

        {/* 미션 단계들 - 모든 단계 클릭 가능 */}
        <div className="space-y-2 mb-4">
          {MISSION_STEPS.map((step, index) => {
            const status = getStepStatus(index)
            const Icon = step.icon

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.path)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  status === "current"
                    ? "bg-[var(--ax-accent)] text-white shadow-md"
                    : status === "completed"
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-gray-50/50 hover:bg-gray-100/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 상태 아이콘 */}
                  <div className="flex-shrink-0">
                    {status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : status === "current" ? (
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-[var(--ax-accent)] animate-pulse"></div>
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* 단계 아이콘 */}
                  <Icon
                    className={`w-5 h-5 ${
                      status === "current"
                        ? "text-white"
                        : status === "completed"
                          ? "text-green-600"
                          : "text-gray-400"
                    }`}
                  />

                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        status === "current"
                          ? "text-white"
                          : status === "completed"
                            ? "text-green-700"
                            : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p
                      className={`text-xs ${
                        status === "current"
                          ? "text-white/80"
                          : status === "completed"
                            ? "text-green-600/70"
                            : "text-gray-400"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* 새로운 논문 학습하기 버튼 */}
        <button
          onClick={handleNewPaper}
          className="w-full bg-white border-2 border-[var(--ax-accent)] text-[var(--ax-accent)] hover:bg-[var(--ax-accent)] hover:text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          새로운 논문 학습하기
        </button>
      </div>
    </div>
  )
}
