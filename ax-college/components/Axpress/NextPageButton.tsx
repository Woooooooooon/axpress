"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, X, ChevronRight } from "lucide-react"

interface NextPageButtonProps {
  /** 이동할 다음 페이지 경로 (예: "/axpress/quiz") */
  nextPath: string
  /** 버튼에 표시될 텍스트 (예: "퀴즈 풀러가기") */
  buttonText: string
  /** 말풍선에 표시될 권유 메시지 (예: "퀴즈로 이해도를 확인해보세요!") */
  tooltipText: string
  /**
   * 버튼 표시 트리거 방식
   * - "scroll": 스크롤이 페이지 끝에 도달했을 때 (기본값)
   * - "custom": 부모 컴포넌트에서 show prop으로 직접 제어
   */
  trigger?: "scroll" | "custom"
  /** trigger가 "custom"일 때, 버튼 표시 여부를 제어 */
  show?: boolean
}

export function NextPageButton({
  nextPath,
  buttonText,
  tooltipText,
  trigger = "scroll",
  show = false
}: NextPageButtonProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isClosed, setIsClosed] = useState(false) // 사용자가 X 버튼으로 닫았는지 여부

  // trigger가 "custom"일 때는 show prop으로 제어
  useEffect(() => {
    if (trigger === "custom") {
      if (show && !isVisible) {
        setIsVisible(true)
        // 버튼이 완전히 나타난 후 말풍선 표시 (0.5초 딜레이)
        setTimeout(() => setShowTooltip(true), 500)
      }
    }
  }, [trigger, show, isVisible])

  // trigger가 "scroll"일 때는 스크롤 감지
  useEffect(() => {
    if (trigger !== "scroll") return

    // 스크롤 감지 기준: 페이지 끝에서 100px 이내
    // 이 값을 조정하려면 아래 SCROLL_THRESHOLD 값을 변경하세요
    const SCROLL_THRESHOLD = 100 // px

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight
      const scrollTop = document.documentElement.scrollTop
      const clientHeight = document.documentElement.clientHeight

      // 페이지 끝에서 SCROLL_THRESHOLD px 이내에 도달했는지 확인
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD

      if (isNearBottom && !isVisible) {
        setIsVisible(true)
        // 버튼이 완전히 나타난 후 말풍선 표시 (0.5초 딜레이)
        setTimeout(() => setShowTooltip(true), 500)
      }
    }

    window.addEventListener("scroll", handleScroll)
    // 초기 확인 (이미 스크롤이 끝에 있을 경우)
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [trigger, isVisible])

  const handleClick = () => {
    router.push(nextPath)
  }

  const handleClose = () => {
    setIsClosed(true)
    setShowTooltip(false)
  }

  if (!isVisible) return null

  return (
    <>
      {/* 메인 버튼 (중앙) - 닫히지 않았을 때만 표시 */}
      {!isClosed && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500"
          style={{
            animation: isClosed ? "slideOutToRight 0.5s ease-out forwards" : undefined,
          }}
        >
      {/* 말풍선 (버튼 위에 표시) */}
      <div
        className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-500 ${
          showTooltip ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{
          animation: showTooltip ? "morphIn 0.5s ease-out" : undefined,
        }}
      >
        <div className="bg-white px-5 py-3 rounded-2xl shadow-xl border-2 border-[var(--ax-accent)] relative">
          <p className="text-sm font-medium text-[var(--ax-fg)]">{tooltipText}</p>
          {/* 말풍선 꼬리 */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px]">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-[var(--ax-accent)]"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-[2px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white"></div>
          </div>
        </div>
      </div>

      {/* 버튼 (왼쪽에서 슬라이드 인) */}
      <div className="relative">
        <button
          onClick={handleClick}
          className="ax-button-primary px-6 py-3 flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform"
          style={{
            animation: "slideInFromLeft 0.5s ease-out",
          }}
        >
          <span className="font-semibold">{buttonText}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* X 닫기 버튼 (우측 상단) */}
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-400/70 hover:bg-gray-500/70 flex items-center justify-center transition-colors shadow-md"
          aria-label="닫기"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* CSS 애니메이션 정의 */}
      <style jsx>{`
        @keyframes slideInFromLeft {
          from {
            transform: translateX(-200px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutToRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(200px);
            opacity: 0;
          }
        }

        @keyframes morphIn {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slideInFromRight {
          from {
            transform: translateX(100px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
        </div>
      )}

      {/* 오른쪽 작은 탭 - 닫혔을 때만 표시 */}
      {isClosed && (
        <button
          onClick={handleClick}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-[var(--ax-accent)] text-white py-6 px-3 rounded-l-lg shadow-lg hover:px-4 transition-all duration-300 z-50 flex items-center gap-2"
          style={{
            animation: "slideInFromRight 0.5s ease-out",
          }}
          aria-label={buttonText}
        >
          <span className="text-sm font-semibold writing-mode-vertical">다음</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </>
  )
}
