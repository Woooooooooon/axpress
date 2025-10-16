"use client"

import { useEffect, useState, useRef } from "react"
import { Header } from "@/components/Header/Header"
import { SelectedPaperBadge } from "@/components/Axpress/SelectedPaperBadge"
import { PaperProtectedRoute } from "@/components/Axpress/PaperProtectedRoute"
import { MissionNav } from "@/components/Axpress/MissionNav"
import { ChatbotFAB } from "@/components/Axpress/ChatbotFAB"
import { ChatbotDialog } from "@/components/Axpress/ChatbotDialog"
import { usePaper } from "@/contexts/PaperContext"
import {
  generateVideo,
  getVideoStreamURL,
  getVideoDownloadURL,
  downloadVideo,
  type TTSMode,
} from "@/app/axpress/api"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  RefreshCw,
  Sparkles,
  Loader2,
  Video as VideoIcon,
  AlertCircle,
} from "lucide-react"

type VideoStatus = "idle" | "generating" | "ready" | "error"

export default function VideoPage() {
  const { selectedPaperId, markStepComplete } = usePaper()

  const [videoStatus, setVideoStatus] = useState<VideoStatus>("idle")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [ttsMode, setTtsMode] = useState<TTSMode>("standard")
  const [hasGenerated, setHasGenerated] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  // 페이지 방문 시 자동 완료 처리
  useEffect(() => {
    markStepComplete("history")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 동영상 생성 함수
  const handleGenerateVideo = async (forceRegenerate: boolean = false) => {
    if (!selectedPaperId) {
      setError("논문을 먼저 선택해주세요")
      return
    }

    setIsGenerating(true)
    setError(null)
    setVideoStatus("generating")

    try {
      const response = await generateVideo(selectedPaperId, ttsMode, forceRegenerate)

      if (response.video_status === "ready" || response.stream_url) {
        // 동영상이 준비되면 스트리밍 URL 설정
        const streamUrl = hasGenerated
          ? getVideoDownloadURL(selectedPaperId)
          : getVideoStreamURL(selectedPaperId)

        setVideoUrl(streamUrl)
        setVideoStatus("ready")
        setHasGenerated(true)
      } else {
        setVideoStatus("generating")
        // 실제로는 폴링이나 웹소켓으로 상태를 확인해야 합니다
        setTimeout(() => {
          const streamUrl = hasGenerated
            ? getVideoDownloadURL(selectedPaperId)
            : getVideoStreamURL(selectedPaperId)
          setVideoUrl(streamUrl)
          setVideoStatus("ready")
          setHasGenerated(true)
        }, 3000)
      }
    } catch (err) {
      console.error("동영상 생성 실패:", err)
      setError(err instanceof Error ? err.message : "동영상 생성에 실패했습니다")
      setVideoStatus("error")
    } finally {
      setIsGenerating(false)
    }
  }

  // 재생/일시정지
  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  // 음소거
  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // 볼륨 조절
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      if (newVolume === 0) {
        setIsMuted(true)
      } else if (isMuted) {
        setIsMuted(false)
      }
    }
  }

  // 진행바 조절
  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  // 전체화면
  const toggleFullscreen = () => {
    if (!videoRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.current.requestFullscreen()
    }
  }

  // 다운로드
  const handleDownload = async () => {
    if (!selectedPaperId) return
    try {
      await downloadVideo(selectedPaperId, !hasGenerated)
    } catch (err) {
      console.error("다운로드 실패:", err)
      setError("다운로드에 실패했습니다")
    }
  }

  // 시간 포맷팅
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <PaperProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[var(--ax-bg-soft)] to-white">
        <Header />
        <MissionNav />
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8">
          <SelectedPaperBadge />

          <div className="space-y-6">
            {/* 타이틀 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--ax-fg)] mb-2 flex items-center justify-center gap-2">
                <VideoIcon className="w-8 h-8" />
                동영상 강의
              </h1>
              <p className="text-[var(--ax-fg)]/70">AI가 생성한 논문 설명 동영상을 시청하세요</p>
            </div>

            {/* 동영상 플레이어 */}
            <div className="ax-card overflow-hidden">
              <div className="relative bg-black aspect-video">
                {videoStatus === "idle" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
                    <div className="text-center">
                      <VideoIcon className="w-20 h-20 text-white/30 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">동영상을 생성해주세요</h3>
                      <p className="text-white/70 mb-6">AI가 논문을 분석하여 동영상 강의를 만들어드립니다</p>
                    </div>

                    {/* TTS 모드 선택 */}
                    <div className="flex gap-4 mb-4">
                      <button
                        onClick={() => setTtsMode("standard")}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${
                          ttsMode === "standard"
                            ? "bg-[var(--ax-accent)] text-white"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        표준 음질
                      </button>
                      <button
                        onClick={() => setTtsMode("premium")}
                        className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          ttsMode === "premium"
                            ? "bg-[var(--ax-accent)] text-white"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        프리미엄 음질
                      </button>
                    </div>

                    <button
                      onClick={() => handleGenerateVideo(false)}
                      disabled={isGenerating}
                      className="ax-btn-primary px-8 py-4 text-lg flex items-center gap-2 color-[var(--ax-fg)]"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          동영상 생성하기
                        </>
                      )}
                    </button>
                  </div>
                )}

                {videoStatus === "generating" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-16 h-16 text-white animate-spin" />
                    <p className="text-xl text-white font-medium">동영상을 생성하고 있습니다...</p>
                    <p className="text-white/70">잠시만 기다려주세요</p>
                  </div>
                )}

                {videoStatus === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                    <AlertCircle className="w-16 h-16 text-red-400" />
                    <p className="text-xl text-white font-medium">오류가 발생했습니다</p>
                    <p className="text-white/70 text-center">{error}</p>
                    <button
                      onClick={() => handleGenerateVideo(false)}
                      className="ax-btn-primary mt-4"
                    >
                      다시 시도
                    </button>
                  </div>
                )}

                {videoStatus === "ready" && videoUrl && (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />

                    {/* 비디오 컨트롤 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      {/* 진행바 */}
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 mb-3 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                      />

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {/* 재생/일시정지 */}
                          <button
                            onClick={togglePlay}
                            className="text-white hover:text-[var(--ax-accent)] transition-colors"
                          >
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                          </button>

                          {/* 볼륨 */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={toggleMute}
                              className="text-white hover:text-[var(--ax-accent)] transition-colors"
                            >
                              {isMuted || volume === 0 ? (
                                <VolumeX className="w-5 h-5" />
                              ) : (
                                <Volume2 className="w-5 h-5" />
                              )}
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume}
                              onChange={handleVolumeChange}
                              className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>

                          {/* 시간 */}
                          <span className="text-white text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* 다운로드 */}
                          <button
                            onClick={handleDownload}
                            className="text-white hover:text-[var(--ax-accent)] transition-colors"
                            title="다운로드"
                          >
                            <Download className="w-5 h-5" />
                          </button>

                          {/* 전체화면 */}
                          <button
                            onClick={toggleFullscreen}
                            className="text-white hover:text-[var(--ax-accent)] transition-colors"
                            title="전체화면"
                          >
                            <Maximize className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 재생성 버튼 (동영상이 있을 때만 표시) */}
            {videoStatus === "ready" && (
              <div className="ax-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--ax-fg)] mb-1">동영상 재생성</h3>
                    <p className="text-sm text-[var(--ax-fg)]/70">
                      새로운 음질 모드로 동영상을 다시 생성할 수 있습니다
                    </p>
                  </div>
                  <button
                    onClick={() => handleGenerateVideo(true)}
                    disabled={isGenerating}
                    className="ax-btn-secondary flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        동영상 재생성
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 안내 메시지 */}
            <div className="ax-card p-6 bg-gradient-to-r from-[var(--ax-accent)]/5 to-blue-500/5 border-2 border-[var(--ax-accent)]/20">
              <h3 className="font-semibold text-[var(--ax-fg)] mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--ax-accent)]" />
                AI 동영상 강의 안내
              </h3>
              <ul className="text-sm text-[var(--ax-fg)]/70 space-y-1">
                <li>• 선택한 논문을 바탕으로 AI가 자동으로 동영상 강의를 생성합니다</li>
                <li>• 표준 음질과 프리미엄 음질 중 선택할 수 있습니다</li>
                <li>• 생성된 동영상은 언제든지 다시 재생하거나 다운로드할 수 있습니다</li>
                <li>• 동영상 재생성 시 기존 동영상이 새로운 버전으로 교체됩니다</li>
              </ul>
            </div>
          </div>
        </main>

        {/* 챗봇 FAB 버튼 및 대화창 */}
        <ChatbotFAB />
        <ChatbotDialog />
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--ax-accent);
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--ax-accent);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </PaperProtectedRoute>
  )
}
