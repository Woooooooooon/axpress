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
} from "@/app/axpress/api"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  RefreshCw,
  Loader2,
  Video as VideoIcon,
  AlertCircle,
} from "lucide-react"

type VideoStatus = "generating" | "ready" | "error"

const VIDEO_CACHE_KEY = "video_generated_"

export default function VideoPage() {
  const { selectedPaperId, markStepComplete } = usePaper()

  const [videoStatus, setVideoStatus] = useState<VideoStatus>("generating")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const hasAttemptedGeneration = useRef(false)

  // 캐시 키 생성
  const getCacheKey = (paperId: number) => `${VIDEO_CACHE_KEY}${paperId}`

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
      await generateVideo(selectedPaperId, "standard", forceRegenerate)

      const cacheKey = getCacheKey(selectedPaperId)
      const isFirstGeneration = !localStorage.getItem(cacheKey)

      // 동영상 URL 설정 (생성 완료 즉시)
      const streamUrl = isFirstGeneration
        ? getVideoStreamURL(selectedPaperId)
        : getVideoDownloadURL(selectedPaperId)

      console.log(`[Video] 동영상 URL 설정: ${streamUrl}`)
      setVideoUrl(streamUrl)

      // 캐시에 저장
      localStorage.setItem(cacheKey, "true")

      // 비디오가 로드될 때까지 generating 상태 유지
      // video 엘리먼트의 onLoadedMetadata에서 ready로 변경됨
    } catch (err) {
      console.error("동영상 생성 실패:", err)
      setError(err instanceof Error ? err.message : "동영상 생성에 실패했습니다")
      setVideoStatus("error")
    } finally {
      setIsGenerating(false)
    }
  }

  // 페이지 방문 시 자동 완료 처리 및 자동 생성
  useEffect(() => {
    markStepComplete("history")

    if (!selectedPaperId || hasAttemptedGeneration.current) return

    // 이미 생성된 적이 있는지 확인
    const cacheKey = getCacheKey(selectedPaperId)
    const hasGeneratedBefore = localStorage.getItem(cacheKey)

    if (hasGeneratedBefore) {
      // 이미 생성된 적이 있으면 다운로드 URL로 바로 로드
      console.log(`[Video Cache] research_id ${selectedPaperId} 캐시 발견, 동영상 로드`)
      const downloadUrl = getVideoDownloadURL(selectedPaperId)
      setVideoUrl(downloadUrl)
      setVideoStatus("ready")
    } else {
      // 첫 방문이면 자동 생성
      console.log(`[Video Cache] research_id ${selectedPaperId} 첫 방문, 동영상 생성 시작`)
      handleGenerateVideo(false)
    }

    hasAttemptedGeneration.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPaperId])

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
    // 비디오 메타데이터 로드 완료 시 ready 상태로 전환
    setVideoStatus("ready")
    console.log(`[Video] 메타데이터 로드 완료, 재생 준비됨`)
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
      const cacheKey = getCacheKey(selectedPaperId)
      const isFirstDownload = !localStorage.getItem(cacheKey)
      await downloadVideo(selectedPaperId, isFirstDownload)
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
              <h1 className="text-3xl font-bold text-[var(--ax-fg)] mb-0.5 flex items-center justify-center gap-2">
                <VideoIcon className="w-8 h-8" />
                동영상 강의
              </h1>
              <p className="text-[var(--ax-fg)]/70 text-sm">AI가 생성한 논문 설명 동영상을 시청하세요</p>
            </div>

            {/* 동영상 플레이어 */}
            <div className="ax-card overflow-hidden">
              <div className="relative bg-black aspect-video">
                {/* 비디오 엘리먼트 (항상 렌더링, generating 시에는 숨김) */}
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className={`w-full h-full ${videoStatus === "generating" ? "invisible" : ""}`}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                )}

                {/* 로딩 오버레이 */}
                {videoStatus === "generating" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black">
                    <Loader2 className="w-16 h-16 text-white animate-spin" />
                    <p className="text-xl text-white font-medium">동영상을 불러오는 중...</p>
                    <p className="text-white/70">잠시만 기다려주세요</p>
                  </div>
                )}

                {/* 에러 오버레이 */}
                {videoStatus === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-black">
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

                {/* 비디오 컨트롤 (ready 상태일 때만 표시) */}
                {videoStatus === "ready" && (
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
                      동영상을 새로 생성하려면 재생성 버튼을 클릭하세요
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
                <VideoIcon className="w-5 h-5 text-[var(--ax-accent)]" />
                AI 동영상 강의 안내
              </h3>
              <ul className="text-sm text-[var(--ax-fg)]/70 space-y-1">
                <li>• 선택한 논문을 바탕으로 AI가 자동으로 동영상 강의를 생성합니다</li>
                <li>• 첫 방문 시 자동으로 동영상이 생성되며, 이후에는 저장된 동영상을 불러옵니다</li>
                <li>• 생성된 동영상은 언제든지 다시 재생하거나 다운로드할 수 있습니다</li>
                <li>• 동영상 재생성 버튼으로 새로운 버전을 생성할 수 있습니다</li>
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
