"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createChatbot, sendChatMessage, refreshChatbotCache, type ChatMessage } from "@/app/axpress/api"
import { toast } from "@/hooks/use-toast"

interface ChatbotContextType {
  isCreating: boolean
  isReady: boolean
  isChatOpen: boolean
  messages: ChatMessage[]
  currentResearchId: number | null
  createChatbotForPaper: (research_id: number) => Promise<void>
  sendMessage: (question: string) => Promise<void>
  toggleChat: () => void
  clearChat: () => void
  resetChatbot: () => void
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined)

const STORAGE_KEY_PREFIX = "chatbot_history_"

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [isCreating, setIsCreating] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentResearchId, setCurrentResearchId] = useState<number | null>(null)

  // LocalStorage에서 대화 히스토리 로드
  useEffect(() => {
    if (currentResearchId === null) return

    const storageKey = `${STORAGE_KEY_PREFIX}${currentResearchId}`
    const savedHistory = localStorage.getItem(storageKey)

    if (savedHistory) {
      try {
        const parsedHistory: ChatMessage[] = JSON.parse(savedHistory)
        setMessages(parsedHistory)
      } catch (error) {
        console.error("[Chatbot] 대화 히스토리 로드 실패:", error)
      }
    } else {
      // 저장된 히스토리가 없으면 빈 배열로 초기화
      setMessages([])
    }
  }, [currentResearchId])

  // 대화 히스토리 LocalStorage에 저장
  useEffect(() => {
    if (currentResearchId === null) return

    const storageKey = `${STORAGE_KEY_PREFIX}${currentResearchId}`
    if (messages.length === 0) {
      // 메시지가 비어있으면 LocalStorage에서도 삭제
      localStorage.removeItem(storageKey)
    } else {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    }
  }, [messages, currentResearchId])

  const createChatbotForPaper = async (research_id: number) => {
    // 다른 논문으로 변경되는 경우 캐시 초기화
    if (currentResearchId !== null && currentResearchId !== research_id) {
      console.log(`[Chatbot] 논문 변경 감지: ${currentResearchId} -> ${research_id}`)

      // 이전 논문의 LocalStorage 캐시 삭제
      const oldStorageKey = `${STORAGE_KEY_PREFIX}${currentResearchId}`
      localStorage.removeItem(oldStorageKey)

      // 백엔드 캐시 초기화 API 호출
      try {
        await refreshChatbotCache(currentResearchId)
        console.log(`[Chatbot] research_id ${currentResearchId} 백엔드 캐시 초기화 완료`)
      } catch (error) {
        console.error(`[Chatbot] research_id ${currentResearchId} 캐시 초기화 실패:`, error)
      }

      // 상태 초기화
      setMessages([])
      setIsReady(false)
      setIsChatOpen(false)
    }

    // 이미 같은 논문의 챗봇이 생성되었다면 스킵
    if (currentResearchId === research_id && isReady) {
      console.log("[Chatbot] 이미 생성된 챗봇입니다.")
      return
    }

    // 이미 생성 중이면 중복 호출 방지
    if (isCreating) {
      console.log("[Chatbot] 이미 생성 중입니다.")
      return
    }

    try {
      setIsCreating(true)
      setIsReady(false)
      setCurrentResearchId(research_id)

      console.log(`[Chatbot] research_id ${research_id} 챗봇 생성 시작`)
      await createChatbot(research_id)

      setIsReady(true)
      console.log(`[Chatbot] research_id ${research_id} 챗봇 생성 완료`)

      // 챗봇 생성 완료 알림
      toast({
        title: "논문 기반 챗봇이 준비되었습니다!",
        description: "논문을 바탕으로 학습된 챗봇과 함께 더 깊은 학습을 해보세요",
        duration: 1000,
        className: "ax-toast",
      })
    } catch (error) {
      console.error("[Chatbot] 챗봇 생성 실패:", error)
      setIsReady(false)
      setCurrentResearchId(null)
      // 에러는 조용히 처리 (사용자에게는 챗봇이 안 보이는 것으로 처리)
    } finally {
      setIsCreating(false)
    }
  }

  const sendMessage = async (question: string) => {
    if (!currentResearchId) {
      console.error("[Chatbot] research_id가 설정되지 않았습니다.")
      return
    }

    if (!isReady) {
      console.error("[Chatbot] 챗봇이 준비되지 않았습니다.")
      return
    }

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      role: "user",
      content: question,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      // API 호출
      const response = await sendChatMessage(currentResearchId, question)

      // 챗봇 응답 추가
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.answer,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[Chatbot] 메시지 전송 실패:", error)

      // 에러 메시지 추가
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev)
  }

  const clearChat = () => {
    if (currentResearchId) {
      const storageKey = `${STORAGE_KEY_PREFIX}${currentResearchId}`
      localStorage.removeItem(storageKey)
    }
    setMessages([])
  }

  const resetChatbot = () => {
    setIsCreating(false)
    setIsReady(false)
    setIsChatOpen(false)
    setMessages([])
    setCurrentResearchId(null)
  }

  return (
    <ChatbotContext.Provider
      value={{
        isCreating,
        isReady,
        isChatOpen,
        messages,
        currentResearchId,
        createChatbotForPaper,
        sendMessage,
        toggleChat,
        clearChat,
        resetChatbot,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  )
}

export function useChatbot() {
  const context = useContext(ChatbotContext)
  if (context === undefined) {
    throw new Error("useChatbot must be used within a ChatbotProvider")
  }
  return context
}
