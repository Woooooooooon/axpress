"use client"

import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/Header/Header"
import { SelectedPaperBadge } from "@/components/Axpress/SelectedPaperBadge"
import { PaperProtectedRoute } from "@/components/Axpress/PaperProtectedRoute"
import { NextPageButton } from "@/components/Axpress/NextPageButton"
import { MissionNav } from "@/components/Axpress/MissionNav"
import { LoadingState } from "@/components/ui/LoadingState"
import { ChatbotFAB } from "@/components/Axpress/ChatbotFAB"
import { ChatbotDialog } from "@/components/Axpress/ChatbotDialog"
import { usePaper } from "@/contexts/PaperContext"
import { Play, Pause, SkipBack, SkipForward, Volume2, Download } from "lucide-react"
import { generateTTS, getTTSStreamURL, downloadTTSAudio } from "../api"
import type { TTSResponse } from "../api"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function TTSPage() {
  const { selectedPaper, markStepComplete } = usePaper()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [ttsData, setTtsData] = useState<TTSResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // 오디오가 끝까지 재생되었는지 확인
  const isAudioCompleted = duration > 0 && currentTime >= duration - 1

  // 페이지 방문 시 자동 완료 처리
  useEffect(() => {
    markStepComplete("tts")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // TTS 데이터 로드
  useEffect(() => {
    const loadTTS = async () => {
      if (!selectedPaper?.research_id) return

      setIsLoading(true)
      setError(null)
      try {
        console.log("[TTS Page] TTS 생성 API 호출")
        const data = await generateTTS(selectedPaper.research_id)
        setTtsData(data)
      } catch (err) {
        console.error("[TTS Page] TTS 로드 실패:", err)
        setError(err instanceof Error ? err.message : "TTS 생성에 실패했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    loadTTS()
  }, [selectedPaper?.research_id])

  // 오디오 메타데이터 로드 시 duration 설정
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !ttsData) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(audio.duration)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [ttsData])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSkip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, duration))
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = Number.parseInt(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleSpeedChange = (speed: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.playbackRate = speed
    setPlaybackSpeed(speed)
  }

  const handleDownload = async () => {
    if (!ttsData || !selectedPaper) return

    try {
      await downloadTTSAudio(ttsData.audio_file, selectedPaper.title)
    } catch (err) {
      console.error("[TTS Download] 다운로드 실패:", err)
      alert("오디오 다운로드에 실패했습니다.")
    }
  }

  return (
    <PaperProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[var(--ax-bg-soft)] to-white">
        <Header />
        <MissionNav />
        <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8">
          <SelectedPaperBadge />

          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--ax-fg)] mb-2">논문 팟캐스트</h1>
              <p className="text-[var(--ax-fg)]/70">논문 내용을 음성으로 들어보세요</p>
            </div>

            {/* 로딩 상태 */}
            {isLoading && <LoadingState message="TTS를 생성하고 있습니다. 잠시만 기다려주세요..." />}

            {/* 에러 상태 */}
            {error && (
              <div className="ax-card p-6 bg-red-50 border border-red-200">
                <p className="text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* Audio Player */}
            {ttsData && !isLoading && (
              <>
                {/* 숨겨진 오디오 엘리먼트 */}
                <audio ref={audioRef} src={getTTSStreamURL(ttsData.audio_file)} preload="metadata" />

                <div className="ax-card p-8 md:p-12">
                  <div className="space-y-8">
                    {/* Podcast Cover */}
                    <div className="flex justify-center">
                      <div className="w-64 h-64 bg-gradient-to-br from-[var(--ax-accent)] to-purple-600 rounded-2xl shadow-lg flex items-center justify-center">
                        <Volume2 className="w-24 h-24 text-white" />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleProgressChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--ax-accent)]"
                      />
                      <div className="flex justify-between text-sm text-[var(--ax-fg)]/60">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center justify-center gap-6">
                      <button
                        onClick={() => handleSkip(-10)}
                        className="p-3 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="10초 뒤로"
                      >
                        <SkipBack className="w-6 h-6 text-[var(--ax-fg)]" />
                      </button>

                      <button
                        onClick={handlePlayPause}
                        className="p-6 rounded-full bg-[var(--ax-accent)] hover:bg-[var(--ax-accent)]/90 transition-colors shadow-lg"
                        aria-label={isPlaying ? "일시정지" : "재생"}
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </button>

                      <button
                        onClick={() => handleSkip(10)}
                        className="p-3 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="10초 앞으로"
                      >
                        <SkipForward className="w-6 h-6 text-[var(--ax-fg)]" />
                      </button>
                    </div>

                    {/* Playback Speed & Download */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                      <div className="flex gap-2">
                        {[0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              playbackSpeed === speed
                                ? "bg-[var(--ax-accent)] text-white"
                                : "hover:bg-gray-100 text-[var(--ax-fg)]"
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        다운로드
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transcript Section */}
                <div className="ax-card p-6">
                  <h2 className="text-xl font-semibold text-[var(--ax-fg)] mb-4">스크립트</h2>
                  <div className="bg-[var(--ax-bg-soft)] rounded-lg p-6 max-h-96 overflow-y-auto prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{ttsData.explainer}</ReactMarkdown>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        {/* 다음 페이지로 이동 버튼 - 오디오 재생 완료 시 표시 */}
        <NextPageButton
          nextPath="/axpress/history"
          buttonText="학습 기록 보러가기"
          tooltipText="학습 기록을 확인해보세요!"
          trigger="custom"
          show={isAudioCompleted}
        />

        {/* 챗봇 FAB 버튼 및 대화창 */}
        <ChatbotFAB />
        <ChatbotDialog />
      </div>
    </PaperProtectedRoute>
  )
}
