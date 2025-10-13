const BASE_URL = "http://127.0.0.1:8000"

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
  audio_file: string
  download_url: string
  stream_url: string
}

/**
 * TTS 생성 API (POST /tts/from-pdf-path)
 */
export async function generateTTS(research_id: number): Promise<TTSResponse> {
  try {
    console.log(`[TTS API] research_id ${research_id} TTS 생성 요청 시작`)

    const response = await fetch(`${BASE_URL}/tts/from-s3`, {
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
export function getTTSStreamURL(audioFile: string): string {
  return `${BASE_URL}/tts/${encodeURIComponent(audioFile)}/stream`
}

/**
 * TTS 오디오 다운로드
 */
export async function downloadTTSAudio(audioFile: string, title: string): Promise<void> {
  try {
    console.log(`[TTS Download] ${audioFile} 다운로드 시작`)

    const response = await fetch(`${BASE_URL}/tts/${encodeURIComponent(audioFile)}/download`, {
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
    a.download = `${title}_explainer.mp3`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    console.log(`[TTS Download] ${audioFile} 다운로드 완료`)
  } catch (error) {
    console.error(`[TTS Download Error] ${audioFile} 다운로드 실패:`, error)
    throw error
  }
}
