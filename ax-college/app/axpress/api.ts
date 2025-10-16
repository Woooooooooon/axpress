const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL


// 논문 도메인 타입 정의
export type PaperDomain = "금융" | "통신" | "제조" | "유통/물류" | "AI" | "클라우드"

// API 응답 구조에 맞춘 타입 정의
export interface ApiPaperResponse {
  title: string
  abstract: string
  id: number
  authors: string[]
  published_date: string
  updated_date: string
  categories: string[]
  pdf_url: string
  arxiv_url: string
  citation_count: number
  relevance_score: number
  created_at: string
  updated_at: string
}

export interface ResearchSearchResponse {
  data: ApiPaperResponse[]
}

// 화면에 표시할 Paper 타입
export interface PaperWithDomain {
  research_id: number // API의 id를 research_id로 매핑
  domain: PaperDomain
  title: string
  authors: string[]
  abstract: string
  source: string
  publishedAt: string
  url: string
  pdf_url?: string
  arxiv_url?: string
}

// API 응답을 화면용 Paper 타입으로 변환
function transformApiResponseToPaper(
  apiPaper: ApiPaperResponse,
  domain: PaperDomain
): PaperWithDomain {
  return {
    research_id: apiPaper.id,
    domain,
    title: apiPaper.title,
    authors: apiPaper.authors,
    abstract: apiPaper.abstract,
    source: apiPaper.categories.join(", ") || "arXiv",
    publishedAt: apiPaper.published_date,
    url: apiPaper.arxiv_url || apiPaper.pdf_url,
    pdf_url: apiPaper.pdf_url,
    arxiv_url: apiPaper.arxiv_url,
  }
}

/**
 * 특정 도메인의 논문을 검색합니다.
 */
export async function fetchPapersByDomain(domain: PaperDomain): Promise<PaperWithDomain[]> {
  console.log(`[API Call] ${domain} 도메인 논문 API 요청 시작`)

  try {
    const response = await fetch(`${BASE_URL}/research/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domain }),
    })

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status} ${response.statusText}`)
    }

    const data: ResearchSearchResponse = await response.json()

    // API 응답을 화면용 타입으로 변환
    const papers = data.data.map((apiPaper) => transformApiResponseToPaper(apiPaper, domain))

    console.log(`[API Success] ${domain} 도메인 논문 ${papers.length}개 로드 완료`)

    return papers
  } catch (error) {
    console.error(`[API Error] ${domain} 도메인 논문 로드 실패:`, error)
    throw error
  }
}

/**
 * research_id로 특정 논문 정보를 가져옵니다 (캐시 유실 시 복구용)
 */
export async function fetchPaperByResearchId(research_id: number): Promise<ApiPaperResponse> {
  console.log(`[API Call] research_id ${research_id} 논문 정보 요청`)

  try {
    const response = await fetch(`${BASE_URL}/research/${research_id}`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error(`논문 정보 조회 오류: ${response.status} ${response.statusText}`)
    }

    const data: ApiPaperResponse = await response.json()
    console.log(`[API Success] research_id ${research_id} 논문 정보 조회 완료`)

    return data
  } catch (error) {
    console.error(`[API Error] research_id ${research_id} 논문 정보 조회 실패:`, error)
    throw error
  }
}


interface ResearchDownloadResponse {
  message: string
  research_id: number
  s3_key: string
}

/**
 * PDF 다운로드 API 호출 (POST /research/download/{research_id})
 * S3에 저장하고 메타데이터 반환
 */
export async function downloadPaperPDF(research_id: number): Promise<ResearchDownloadResponse> {
  try {
    console.log(`[PDF Download] research_id ${research_id} 다운로드 시작`)

    const response = await fetch(`${BASE_URL}/research/download/${research_id}`, {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error(`다운로드 오류: ${response.status} ${response.statusText}`)
    }

    const data: ResearchDownloadResponse = await response.json()
    console.log(`[PDF Download] research_id ${research_id} 다운로드 완료`)
    console.log(`[PDF Download] S3 Key: ${data.s3_key}`)

    return data
  } catch (error) {
    console.error(`[PDF Download Error] research_id ${research_id} 다운로드 실패:`, error)
    throw error
  }
}

/**
 * S3에서 파일 다운로드 (GET /research/serve/{research_id})
 * 브라우저에서 파일 다운로드 처리
 */
export async function downloadPaperFile(research_id: number): Promise<void> {
  try {
    console.log(`[File Download] research_id ${research_id} 파일 다운로드 시작`)

    const response = await fetch(`${BASE_URL}/research/serve/${research_id}`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error(`파일 다운로드 오류: ${response.status} ${response.statusText}`)
    }

    // Content-Disposition 헤더에서 파일명 추출
    const contentDisposition = response.headers.get("Content-Disposition")
    let filename = `research_${research_id}.pdf`

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "")
      }
    }

    // Blob으로 받아서 다운로드 처리
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    console.log(`[File Download] ${filename} 다운로드 완료`)
  } catch (error) {
    console.error(`[File Download Error] research_id ${research_id} 다운로드 실패:`, error)
    throw error
  }
}

export interface SummaryResponse {
  title: string
  summary: string
  pdf_link: string
}

/**
 * AI 요약 가져오기 (POST /summary)
 */
export async function getSummary(research_id: number): Promise<SummaryResponse> {
  console.log(`[Summary API] 함수 호출 - research_id:`, research_id)
  console.log(`[Summary API] research_id 타입:`, typeof research_id)

  try {
    const requestBody = { research_id }
    console.log(`[Summary API] 요청 시작`)
    console.log(`[Summary API] URL:`, `${BASE_URL}/summary`)
    console.log(`[Summary API] Request Body (객체):`, requestBody)
    console.log(`[Summary API] Request Body (JSON):`, JSON.stringify(requestBody))

    const response = await fetch(`${BASE_URL}/summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log(`[Summary API] Response Status:`, response.status)
    console.log(`[Summary API] Response Status Text:`, response.statusText)
    console.log(`[Summary API] Response OK:`, response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Summary API] Error Response Body:`, errorText)
      throw new Error(`요약 생성 오류: ${response.status} ${response.statusText}`)
    }

    const data: SummaryResponse = await response.json()
    console.log(`[Summary API] Response Data:`, data)
    console.log(`[Summary API] research_id ${research_id} 요약 생성 완료`)

    return data
  } catch (error) {
    console.error(`[Summary API Error] research_id ${research_id} 요약 생성 실패:`, error)
    console.error(`[Summary API Error] Error Stack:`, error instanceof Error ? error.stack : 'No stack trace')
    throw error
  }
}

export interface QuizQuestion {
  question: string
  answer: "O" | "X"
  explanation: string
}

export interface QuizResponse {
  data: QuizQuestion[]
}

/**
 * O/X 퀴즈 가져오기 (POST /quiz)
 */
export async function getQuiz(research_id: number): Promise<QuizQuestion[]> {
  try {
    console.log(`[Quiz API] research_id ${research_id} 퀴즈 요청 시작`)

    const response = await fetch(`${BASE_URL}/quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        research_id,
      }),
    })

    if (!response.ok) {
      throw new Error(`퀴즈 생성 오류: ${response.status} ${response.statusText}`)
    }

    const data: QuizResponse = await response.json()
    console.log(`[Quiz API] research_id ${research_id} 퀴즈 ${data.data.length}개 생성 완료`)

    return data.data
  } catch (error) {
    console.error(`[Quiz API Error] research_id ${research_id} 퀴즈 생성 실패:`, error)
    throw error
  }
}

export interface TTSResponse {
  message: string
  pdf_path: string
  summary: string
  explainer: string
  tts_id: string
  research_id: number
  download_url: string
  stream_url: string
}

/**
 * TTS 생성 API (POST /tts/from-pdf-path)
 */
export async function generateTTS(research_id: number): Promise<TTSResponse> {
  try {
    console.log(`[TTS API] research_id ${research_id} TTS 생성 요청 시작`)

    const response = await fetch(`${BASE_URL}/tts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        research_id,
      }),
    })

    if (!response.ok) {
      throw new Error(`TTS 생성 오류: ${response.status} ${response.statusText}`)
    }

    const data: TTSResponse = await response.json()
    console.log(`[TTS API] research_id ${research_id} TTS 생성 완료`)

    return data
  } catch (error) {
    console.error(`[TTS API Error] research_id ${research_id} TTS 생성 실패:`, error)
    throw error
  }
}

/**
 * TTS 오디오 스트리밍 URL 가져오기
 */
export function getTTSStreamURL(research_id: number): string {
  return `${BASE_URL}/tts/stream/${research_id}`
}

/**
 * TTS 오디오 다운로드
 */
export async function downloadTTSAudio(research_id: number): Promise<void> {
  try {
    console.log(`[TTS Download] ${research_id} 다운로드 시작`)

    const response = await fetch(`${BASE_URL}/tts/stream/${research_id}`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error(`오디오 다운로드 오류: ${response.status} ${response.statusText}`)
    }

    // Blob으로 받아서 다운로드 처리
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${research_id}_explainer.mp3`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    console.log(`[TTS Download] ${research_id} 다운로드 완료`)
  } catch (error) {
    console.error(`[TTS Download Error] ${research_id} 다운로드 실패:`, error)
    throw error
  }
}

export interface ChatbotCreateResponse {
  message: string
  research_id: number
  chatbot_status: "created" | "ready"
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export interface ChatbotChatResponse {
  answer: string
  research_id: number
}

export interface ChatbotRefreshResponse {
  message: string
  research_id: number
  status: "refreshed"
}

/**
 * 챗봇 생성 API (POST /chatbot/{research_id})
 * 논문 기반 챗봇을 생성합니다
 */
export async function createChatbot(research_id: number): Promise<ChatbotCreateResponse> {
  try {
    console.log(`[Chatbot Create] research_id ${research_id} 챗봇 생성 시작`)

    const response = await fetch(`${BASE_URL}/chatbot/${research_id}`, {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error(`챗봇 생성 오류: ${response.status} ${response.statusText}`)
    }

    const data: ChatbotCreateResponse = await response.json()
    console.log(`[Chatbot Create] research_id ${research_id} 챗봇 생성 완료`)

    return data
  } catch (error) {
    console.error(`[Chatbot Create Error] research_id ${research_id} 챗봇 생성 실패:`, error)
    throw error
  }
}

/**
 * 챗봇 대화 API (POST /chatbot/chat/{research_id})
 * 챗봇에게 질문하고 답변을 받습니다
 */
export async function sendChatMessage(research_id: number, question: string): Promise<ChatbotChatResponse> {
  try {
    console.log(`[Chatbot Chat] research_id ${research_id} 질문 전송:`, question)

    const response = await fetch(`${BASE_URL}/chatbot/chat/${research_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    })

    if (!response.ok) {
      throw new Error(`챗봇 대화 오류: ${response.status} ${response.statusText}`)
    }

    const data: ChatbotChatResponse = await response.json()
    console.log(`[Chatbot Chat] research_id ${research_id} 답변 수신 완료`)

    return data
  } catch (error) {
    console.error(`[Chatbot Chat Error] research_id ${research_id} 대화 실패:`, error)
    throw error
  }
}

/**
 * 챗봇 캐시 초기화 API (POST /chatbot/refresh-cache/{research_id})
 * 새로운 논문 선택 시 이전 챗봇 캐시를 초기화합니다
 */
export async function refreshChatbotCache(research_id: number): Promise<ChatbotRefreshResponse> {
  try {
    console.log(`[Chatbot Refresh] research_id ${research_id} 캐시 초기화 시작`)

    const response = await fetch(`${BASE_URL}/chatbot/refresh-cache/${research_id}`, {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error(`챗봇 캐시 초기화 오류: ${response.status} ${response.statusText}`)
    }

    const data: ChatbotRefreshResponse = await response.json()
    console.log(`[Chatbot Refresh] research_id ${research_id} 캐시 초기화 완료`)

    return data
  } catch (error) {
    console.error(`[Chatbot Refresh Error] research_id ${research_id} 캐시 초기화 실패:`, error)
    throw error
  }
}

// ============== VIDEO API ==============

export type TTSMode = "standard" | "premium"

export interface VideoGenerateRequest {
  research_id: number
  tts_mode: TTSMode
}

export interface VideoGenerateResponse {
  message: string
  research_id: number
  video_status: "created" | "generating" | "ready"
  stream_url?: string
}

/**
 * 동영상 생성 API (POST /video)
 * @param research_id 논문 ID
 * @param tts_mode TTS 모드 (standard | premium)
 * @param force_regenerate 기존 동영상 재생성 여부
 */
export async function generateVideo(
  research_id: number,
  tts_mode: TTSMode = "standard",
  force_regenerate: boolean = false
): Promise<VideoGenerateResponse> {
  try {
    console.log(`[Video Generate] research_id ${research_id} 동영상 생성 시작 (force_regenerate: ${force_regenerate})`)

    const url = `${BASE_URL}/video${force_regenerate ? "?force_regenerate=true" : ""}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        research_id: 109, //시연 용으로 고정
        tts_mode,
      }),
    })

    if (!response.ok) {
      throw new Error(`동영상 생성 오류: ${response.status} ${response.statusText}`)
    }

    const data: VideoGenerateResponse = await response.json()
    console.log(`[Video Generate] research_id ${research_id} 동영상 생성 완료`)

    return data
  } catch (error) {
    console.error(`[Video Generate Error] research_id ${research_id} 동영상 생성 실패:`, error)
    throw error
  }
}

/**
 * 동영상 스트리밍 URL 가져오기 (첫 다운로드)
 * GET /video/stream/{research_id}
 */
export function getVideoStreamURL(research_id: number): string {
  return `${BASE_URL}/video/stream/109` //시연 용으로 고정
}

/**
 * 동영상 다운로드 URL 가져오기 (재다운로드)
 * GET /video/{research_id}
 */
export function getVideoDownloadURL(research_id: number): string {
  return `${BASE_URL}/video/109` //시연 용으로 고정
}

/**
 * 동영상 다운로드 (파일로 저장)
 * @param research_id 논문 ID
 * @param isFirstDownload 첫 다운로드 여부 (true: stream, false: download)
 */
export async function downloadVideo(research_id: number, isFirstDownload: boolean = false): Promise<void> {
  try {
    const url = isFirstDownload
      ? getVideoStreamURL(research_id)
      : getVideoDownloadURL(research_id)

    console.log(`[Video Download] research_id ${research_id} 다운로드 시작 (${isFirstDownload ? 'stream' : 'download'})`)

    const response = await fetch(url, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error(`동영상 다운로드 오류: ${response.status} ${response.statusText}`)
    }

    // Blob으로 받아서 다운로드 처리
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = downloadUrl
    a.download = `research_${research_id}_lecture.mp4`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(downloadUrl)
    document.body.removeChild(a)

    console.log(`[Video Download] research_id ${research_id} 다운로드 완료`)
  } catch (error) {
    console.error(`[Video Download Error] research_id ${research_id} 다운로드 실패:`, error)
    throw error
  }
}
