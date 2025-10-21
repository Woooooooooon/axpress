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
import { Play, Pause, SkipBack, SkipForward, Download } from "lucide-react"
import { getTTSStreamURL, downloadTTSAudio } from "../api"

export default function TTSPage() {
  const { selectedPaper, markStepComplete, ttsData, ttsState } = usePaper()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [isSeeking, setIsSeeking] = useState(false)
  const wasPlayingRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)

  // 오디오가 끝까지 재생되었는지 확인
  const isAudioCompleted = duration > 0 && currentTime >= duration - 1

  // 트랜스크립트를 문장으로 분리하고 타이밍 계산
  const getTranscriptLines = () => {
    if (!ttsData?.explainer) return []

    // 마크다운 제거하고 문장 단위로 분리
    const text = ttsData.explainer
      .replace(/[#*`]/g, '') // 마크다운 제거
      .replace(/\n+/g, ' ') // 줄바꿈 제거
      .trim()

    // 문장 단위로 분리 (., !, ? 기준)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

    // 전체 텍스트 길이 대비 각 문장의 시작 시간 계산
    let totalLength = 0
    const lines = sentences.map((sentence, index) => {
      const startTime = duration > 0 ? (totalLength / text.length) * duration : 0
      totalLength += sentence.length
      const endTime = duration > 0 ? (totalLength / text.length) * duration : 0

      return {
        text: sentence.trim(),
        startTime,
        endTime,
        index
      }
    })

    return lines
  }

  const transcriptLines = getTranscriptLines()

  // 현재 재생 중인 라인 찾기
  const currentLineIndex = transcriptLines.findIndex(
    line => currentTime >= line.startTime && currentTime < line.endTime
  )
  const activeLineIndex = currentLineIndex >= 0 ? currentLineIndex : transcriptLines.length - 1

  // 페이지 방문 시 자동 완료 처리
  useEffect(() => {
    markStepComplete("tts")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 현재 재생 중인 라인으로 스크롤 (seeking 중이 아닐 때만)
  useEffect(() => {
    if (!isSeeking && transcriptRef.current && activeLineIndex >= 0) {
      const activeElement = transcriptRef.current.querySelector(`[data-line-index="${activeLineIndex}"]`)
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [activeLineIndex, isSeeking])

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

  // 프로그레스 바 드래그 시작
  const handleSeekStart = () => {
    const audio = audioRef.current
    if (!audio) return

    // 현재 재생 상태 저장
    wasPlayingRef.current = isPlaying

    // 재생 중이면 일시정지
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    }

    setIsSeeking(true)
  }

  // 프로그레스 바 값 변경 (드래그 중)
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)

    // seeking 중에는 currentTime만 업데이트 (UI 미리보기용)
    setCurrentTime(newTime)
  }

  // 프로그레스 바 드래그 종료
  const handleSeekEnd = () => {
    const audio = audioRef.current
    if (!audio) return

    // 실제 오디오 위치를 currentTime으로 변경
    audio.currentTime = currentTime

    setIsSeeking(false)

    // 드래그 전에 재생 중이었으면 다시 재생
    if (wasPlayingRef.current) {
      audio.play()
      setIsPlaying(true)
      wasPlayingRef.current = false
    }
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
      await downloadTTSAudio(ttsData.research_id)
    } catch (err) {
      console.error("[TTS Download] 다운로드 실패:", err)
      alert("오디오 다운로드에 실패했습니다.")
    }
  }

  const handleLineClick = (startTime: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = startTime
    setCurrentTime(startTime)
    if (!isPlaying) {
      audio.play()
      setIsPlaying(true)
    }
  }

  return (
    <PaperProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[var(--ax-bg-soft)] to-white">
        <Header />
        <MissionNav />
        <main className="ax-scaled-content mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8 scale-[0.75] origin-top">
          <SelectedPaperBadge />

          <div className="space-y-6">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-[var(--ax-fg)] mb-2">논문 팟캐스트</h1>
              <p className="text-[var(--ax-fg)]/70">논문 내용을 음성으로 들어보세요</p>
            </div>

            {/* 로딩 상태 */}
            {ttsState.isLoading && <LoadingState message="TTS를 생성하고 있습니다. 잠시만 기다려주세요..." />}

            {/* 에러 상태 */}
            {ttsState.error && (
              <div className="ax-card p-6 bg-red-50 border border-red-200">
                <p className="text-red-600 text-center">{ttsState.error}</p>
              </div>
            )}

            {/* Audio Player */}
            {ttsData && !ttsState.isLoading && (
              <>
                {/* 숨겨진 오디오 엘리먼트 */}
                <audio ref={audioRef} src={getTTSStreamURL(ttsData.research_id)} preload="metadata" />

                <div className="ax-card p-8 md:p-6">
                  <div className="space-y-8">
                        {/* Scrolling Transcript Section */}
                        
                          <div
                            ref={transcriptRef}
                            className="bg-[var(--ax-bg-soft)] rounded-lg p-6 max-h-96 overflow-y-auto"
                          >
                            <div className="space-y-3">
                              {transcriptLines.map((line, index) => {
                                const isActive = index === activeLineIndex
                                return (
                                  <p
                                    key={index}
                                    data-line-index={index}
                                    onClick={() => handleLineClick(line.startTime)}
                                    className={`transition-all duration-300 cursor-pointer hover:text-[var(--ax-accent)] ${
                                      isActive
                                        ? "text-2xl font-semibold text-[var(--ax-accent)] leading-relaxed"
                                        : "text-sm text-[var(--ax-fg)]/60 leading-normal"
                                    }`}
                                  >
                                    {line.text}
                                  </p>
                                )
                              })}
                            </div>
                          </div>
                        
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeekChange}
                        onMouseDown={handleSeekStart}
                        onMouseUp={handleSeekEnd}
                        onTouchStart={handleSeekStart}
                        onTouchEnd={handleSeekEnd}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--ax-accent)] hover:h-3 transition-all"
                        style={{
                          background: `linear-gradient(to right, var(--ax-accent) 0%, var(--ax-accent) ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
                        }}
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


                      </>
                    )}
                  </div>
                </main>
        {/* 다음 페이지로 이동 버튼 - 오디오 재생 완료 시 표시 */}
        <NextPageButton
          nextPath="/axpress/video"
          buttonText="동영상 강의 보러가기"
          tooltipText="AI로 맞춤 제작된 동영상 강의를 확인해보세요!"
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
