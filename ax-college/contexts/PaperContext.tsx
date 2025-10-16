"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { PaperWithDomain } from "@/app/axpress/api"
import { downloadPaperPDF } from "@/app/axpress/api"

type MissionStep = "summary" | "quiz" | "tts" | "history"

interface PaperContextType {
  selectedPaper: PaperWithDomain | null
  selectedPaperId: number | null
  selectPaper: (paper: PaperWithDomain) => Promise<void>
  clearPaper: () => void
  completedSteps: Set<MissionStep>
  markStepComplete: (step: MissionStep) => void
  clearProgress: () => void
  isDownloading: boolean
  downloadError: string | null
}

const PaperContext = createContext<PaperContextType | undefined>(undefined)

const STORAGE_KEY = "selected_paper"
const DOWNLOAD_CACHE_KEY = "paper_downloaded_"

export function PaperProvider({ children }: { children: ReactNode }) {
  const [selectedPaper, setSelectedPaper] = useState<PaperWithDomain | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<MissionStep>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

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

  const selectPaper = async (paper: PaperWithDomain) => {
    console.log(`[PaperContext] 논문 선택: ${paper.title} (ID: ${paper.research_id})`)

    // 논문 선택 및 상태 업데이트
    setSelectedPaper(paper)
    // 새 논문 선택 시 진행 상황 초기화
    setCompletedSteps(new Set())
    setDownloadError(null)

    // 이미 다운로드된 논문인지 확인
    const cacheKey = `${DOWNLOAD_CACHE_KEY}${paper.research_id}`
    const isAlreadyDownloaded = localStorage.getItem(cacheKey)

    if (isAlreadyDownloaded) {
      console.log(`[PaperContext] research_id ${paper.research_id} 이미 다운로드됨, 다운로드 스킵`)
      return
    }

    // 논문 다운로드 (S3에 저장) - 최우선 순위
    setIsDownloading(true)
    try {
      console.log(`[PaperContext] research_id ${paper.research_id} 다운로드 시작 (최우선 순위)`)
      const result = await downloadPaperPDF(paper.research_id)
      console.log(`[PaperContext] research_id ${paper.research_id} 다운로드 완료:`, result.s3_key)

      // 다운로드 완료 캐시 저장
      localStorage.setItem(cacheKey, "true")
    } catch (error) {
      console.error("[PaperContext] 논문 다운로드 실패:", error)
      setDownloadError(error instanceof Error ? error.message : "논문 다운로드에 실패했습니다")
      throw error // 에러를 상위로 전파하여 UI에서 처리
    } finally {
      setIsDownloading(false)
    }
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
        isDownloading,
        downloadError,
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
