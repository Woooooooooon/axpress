"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { PaperWithDomain } from "@/app/axpress/api"
import { downloadPaperPDF } from "@/app/axpress/api"

type MissionStep = "summary" | "quiz" | "tts" | "history"

interface PaperContextType {
  selectedPaper: PaperWithDomain | null
  selectedPaperId: number | null
  selectPaper: (paper: PaperWithDomain) => void
  clearPaper: () => void
  completedSteps: Set<MissionStep>
  markStepComplete: (step: MissionStep) => void
  clearProgress: () => void
}

const PaperContext = createContext<PaperContextType | undefined>(undefined)

const STORAGE_KEY = "selected_paper"

export function PaperProvider({ children }: { children: ReactNode }) {
  const [selectedPaper, setSelectedPaper] = useState<PaperWithDomain | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<MissionStep>>(new Set())

  // localStorage에서 초기 데이터 로드 (hydration 후)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setSelectedPaper(JSON.parse(saved))
      } catch (error) {
        console.error("[PaperContext] localStorage 파싱 실패:", error)
      }
    }
  }, [])

  // selectedPaper 변경 시 localStorage에 저장
  useEffect(() => {
    if (selectedPaper) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPaper))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [selectedPaper])

  const selectPaper = (paper: PaperWithDomain) => {
    // 논문 선택 및 상태 업데이트
    setSelectedPaper(paper)
    // 새 논문 선택 시 진행 상황 초기화
    setCompletedSteps(new Set())

    // 논문 선택 시 백그라운드에서 S3 다운로드 API 호출
    downloadPaperPDF(paper.research_id).catch((error) => {
      console.error("[PaperContext] 논문 다운로드 백그라운드 요청 실패:", error)
    })
  }

  const clearPaper = () => {
    setSelectedPaper(null)
    setCompletedSteps(new Set())
  }

  const markStepComplete = (step: MissionStep) => {
    setCompletedSteps((prev) => new Set(prev).add(step))
  }

  const clearProgress = () => {
    setCompletedSteps(new Set())
  }

  return (
    <PaperContext.Provider
      value={{
        selectedPaper,
        selectedPaperId: selectedPaper?.research_id ?? null,
        selectPaper,
        clearPaper,
        completedSteps,
        markStepComplete,
        clearProgress,
      }}
    >
      {children}
    </PaperContext.Provider>
  )
}

export function usePaper() {
  const context = useContext(PaperContext)
  if (context === undefined) {
    throw new Error("usePaper must be used within a PaperProvider")
  }
  return context
}
