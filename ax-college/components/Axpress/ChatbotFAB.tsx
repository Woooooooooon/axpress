"use client"

import { MessageCircle } from "lucide-react"
import { useChatbot } from "@/contexts/ChatbotContext"

/**
 * Floating Action Button for Chatbot
 * 우측 하단에 고정된 챗봇 FAB 버튼
 */
export function ChatbotFAB() {
  const { isReady, isChatOpen, toggleChat } = useChatbot()

  // 챗봇이 준비되지 않았거나 이미 열려있으면 렌더링하지 않음
  if (!isReady || isChatOpen) {
    return null
  }

  return (
    <button
      onClick={toggleChat}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 ax-focus-ring"
      style={{
        backgroundColor: "var(--ax-accent)",
        color: "var(--ax-fg)",
      }}
      aria-label="챗봇 열기"
    >
      <MessageCircle className="h-6 w-6 mx-auto" />
    </button>
  )
}
