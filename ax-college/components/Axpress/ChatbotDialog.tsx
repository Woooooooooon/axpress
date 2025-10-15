"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Trash2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useChatbot } from "@/contexts/ChatbotContext"

/**
 * Chatbot Dialog/Popup Component
 * 챗봇 대화 창
 */
export function ChatbotDialog() {
  const { isChatOpen, toggleChat, messages, sendMessage, clearChat } = useChatbot()
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 메시지가 추가되면 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Idle 타이머 리셋 함수
  const resetIdleTimer = () => {
    setIsIdle(false)
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true)
    }, 5000) // 5초 후 idle 상태
  }

  // 챗봇이 열릴 때와 메시지가 추가될 때 타이머 시작
  useEffect(() => {
    if (!isChatOpen) return

    resetIdleTimer()

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
    }
  }, [isChatOpen, messages])

  // hover 상태가 변경될 때 타이머 리셋
  useEffect(() => {
    if (isHovered) {
      // hover 중일 때는 idle 타이머 정지
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
      }
      setIsIdle(false)
    } else {
      // hover 해제 시 타이머 재시작
      resetIdleTimer()
    }
  }, [isHovered])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || isSending) return

    const question = inputValue.trim()
    setInputValue("")
    setIsSending(true)

    try {
      await sendMessage(question)
    } finally {
      setIsSending(false)
    }
  }

  const handleClearChat = () => {
    if (confirm("대화 내역을 모두 삭제하시겠습니까?")) {
      clearChat()
    }
  }

  if (!isChatOpen) {
    return null
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[30rem] max-w-[calc(100vw-3rem)] h-[50rem] max-h-[calc(100vh-10rem)] ax-card overflow-hidden flex flex-col shadow-sm transition-opacity duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-[var(--ax-border)]"
        style={{ backgroundColor: "var(--ax-accent)" }}
      >
        <h3 className="font-bold text-xl text-[var(--ax-fg)] ml-4">논문 챗봇</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-2.5 rounded-lg hover:bg-black/10 transition-colors"
            aria-label="대화 내역 삭제"
            title="대화 내역 삭제"
          >
            <Trash2 className="h-6 w-6 text-[var(--ax-fg)]" />
          </button>
          <button
            onClick={toggleChat}
            className="p-2.5 rounded-lg hover:bg-black/10 transition-colors"
            aria-label="닫기"
          >
            <X className="h-7 w-7 text-[var(--ax-fg)]" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-[var(--ax-fg)]/60 py-8">
            <p className="text-lg">논문 정보를 기반으로 학습된 챗봇입니다!</p>
            <p className="text-md mt-2">예: 이 논문의 Attention Mechanism은 무엇인가요?</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "text-[var(--ax-fg)]"
                      : "bg-[var(--ax-bg-soft)] text-[var(--ax-fg)]"
                  }`}
                  style={
                    message.role === "user"
                      ? { backgroundColor: "var(--ax-accent)" }
                      : undefined
                  }
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-[var(--ax-fg)] prose-p:text-[var(--ax-fg)] prose-strong:text-[var(--ax-fg)] prose-li:text-[var(--ax-fg)] prose-code:text-[var(--ax-fg)] prose-code:bg-black/10 prose-pre:bg-black/5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {/* 로딩 중일 때 ... 애니메이션 */}
            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-[var(--ax-bg-soft)] text-[var(--ax-fg)]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[var(--ax-fg)]/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-[var(--ax-fg)]/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-[var(--ax-fg)]/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--ax-border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
            }}
            onFocus={resetIdleTimer} // 포커스 시 타이머 리셋
            placeholder="질문을 입력하세요..."
            disabled={isSending}
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--ax-border)] bg-[var(--ax-surface)] text-[var(--ax-fg)] placeholder:text-[var(--ax-fg)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--ax-accent)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending}
            className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--ax-accent)",
              color: "var(--ax-fg)",
            }}
            aria-label="전송"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
