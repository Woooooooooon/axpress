"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { PaperWithDomain, SummaryResponse, QuizQuestion, TTSResponse, VideoGenerateResponse } from "@/app/axpress/api"
import { downloadPaperPDF, getSummary, getQuiz, generateVideo, generateTTS } from "@/app/axpress/api"

type MissionStep = "summary" | "quiz" | "tts" | "history"

interface ApiLoadingState {
  isLoading: boolean
  error: string | null
}

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

  // API 데이터 상태
  summaryData: SummaryResponse | null
  summaryState: ApiLoadingState
  quizData: QuizQuestion[] | null
  quizState: ApiLoadingState
  videoData: VideoGenerateResponse | null
  videoState: ApiLoadingState
  ttsData: TTSResponse | null
  ttsState: ApiLoadingState
}

const PaperContext = createContext<PaperContextType | undefined>(undefined)

const STORAGE_KEY = "selected_paper"
const DOWNLOAD_CACHE_KEY = "paper_downloaded_"

export function PaperProvider({ children }: { children: ReactNode }) {
  const [selectedPaper, setSelectedPaper] = useState<PaperWithDomain | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<MissionStep>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  // API 데이터 상태
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null)
  const [summaryState, setSummaryState] = useState<ApiLoadingState>({ isLoading: false, error: null })
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null)
  const [quizState, setQuizState] = useState<ApiLoadingState>({ isLoading: false, error: null })
  const [videoData, setVideoData] = useState<VideoGenerateResponse | null>(null)
  const [videoState, setVideoState] = useState<ApiLoadingState>({ isLoading: false, error: null })
  const [ttsData, setTTSData] = useState<TTSResponse | null>(null)
  const [ttsState, setTTSState] = useState<ApiLoadingState>({ isLoading: false, error: null })

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
    // 새 논문 선택 시 진행 상황 및 API 데이터 초기화
    setCompletedSteps(new Set())
    setDownloadError(null)
    setSummaryData(null)
    setQuizData(null)
    setVideoData(null)
    setTTSData(null)
    setSummaryState({ isLoading: false, error: null })
    setQuizState({ isLoading: false, error: null })
    setVideoState({ isLoading: false, error: null })
    setTTSState({ isLoading: false, error: null })

    // 이미 다운로드된 논문인지 확인
    const cacheKey = `${DOWNLOAD_CACHE_KEY}${paper.research_id}`
    const isAlreadyDownloaded = localStorage.getItem(cacheKey)

    // 논문 다운로드 (S3에 저장)
    setIsDownloading(true)
    try {
      if (!isAlreadyDownloaded) {
        console.log(`[PaperContext] research_id ${paper.research_id} 다운로드 시작`)
        const result = await downloadPaperPDF(paper.research_id)
        console.log(`[PaperContext] research_id ${paper.research_id} 다운로드 완료:`, result.s3_key)
        localStorage.setItem(cacheKey, "true")
      } else {
        console.log(`[PaperContext] research_id ${paper.research_id} 이미 다운로드됨`)
      }
    } catch (error) {
      console.error("[PaperContext] 논문 다운로드 실패:", error)
      setDownloadError(error instanceof Error ? error.message : "논문 다운로드에 실패했습니다")
      throw error
    } finally {
      setIsDownloading(false)
    }

    // 모든 API를 병렬로 호출 (다운로드와 독립적으로 실행)
    console.log(`[PaperContext] 모든 API 병렬 호출 시작`)

    // Summary API
    setSummaryState({ isLoading: true, error: null })
    getSummary(paper.research_id)
      .then((data) => {
        console.log(`[PaperContext] Summary API 완료`)
        setSummaryData(data)
        setSummaryState({ isLoading: false, error: null })
      })
      .catch((error) => {
        console.error("[PaperContext] Summary API 실패:", error)
        setSummaryState({ isLoading: false, error: error instanceof Error ? error.message : "요약 생성 실패" })
      })

    // Quiz API
    setQuizState({ isLoading: true, error: null })
    getQuiz(paper.research_id)
      .then((data) => {
        console.log(`[PaperContext] Quiz API 완료`)
        setQuizData(data)
        setQuizState({ isLoading: false, error: null })
      })
      .catch((error) => {
        console.error("[PaperContext] Quiz API 실패:", error)
        setQuizState({ isLoading: false, error: error instanceof Error ? error.message : "퀴즈 생성 실패" })
      })

    // Video API
    setVideoState({ isLoading: true, error: null })
    generateVideo(paper.research_id, "standard")
      .then((data) => {
        console.log(`[PaperContext] Video API 완료`)
        setVideoData(data)
        setVideoState({ isLoading: false, error: null })
      })
      .catch((error) => {
        console.error("[PaperContext] Video API 실패:", error)
        setVideoState({ isLoading: false, error: error instanceof Error ? error.message : "동영상 생성 실패" })
      })

    // TTS API
    setTTSState({ isLoading: true, error: null })
    generateTTS(paper.research_id)
      .then((data) => {
        console.log(`[PaperContext] TTS API 완료`)
        setTTSData(data)
        setTTSState({ isLoading: false, error: null })
      })
      .catch((error) => {
        console.error("[PaperContext] TTS API 실패:", error)
        setTTSState({ isLoading: false, error: error instanceof Error ? error.message : "TTS 생성 실패" })
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
        isDownloading,
        downloadError,
        summaryData,
        summaryState,
        quizData,
        quizState,
        videoData,
        videoState,
        ttsData,
        ttsState,
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
