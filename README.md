# AX College – AXpress (논문 학습 고도화)

최신 논문을 요약 → 퀴즈 → 팟캐스트(TTS) 흐름으로 학습하고, 학습 이력을 관리할 수 있는 웹 서비스입니다.
도메인별 논문 검색부터 AI 기반 요약, O/X 퀴즈, TTS 팟캐스트까지 완전한 학습 파이프라인을 제공합니다.

> **참고**: 본 프로젝트는 프론트엔드와 백엔드가 분리되어 있습니다. 백엔드는 FastAPI 기반으로 별도로 운영됩니다.

---

## ✨ 핵심 기능

### 1. 도메인별 논문 탐색
- **6개 도메인** 지원: 금융, 통신, 제조, 유통/물류, AI, 클라우드
- **카드뷰/리스트뷰** 전환 가능한 유연한 UI
- **실시간 검색**: 백엔드 API를 통한 arXiv 논문 검색
- **캐싱 시스템**: 도메인별 논문 데이터를 클라이언트 메모리에 캐싱하여 빠른 재접근

### 2. 논문 학습 파이프라인

#### 📄 요약 학습 (`/axpress/summary`)
- Abstract 표시: 논문의 원본 초록 제공
- AI 요약: 백엔드 AI 모델이 생성한 한글 요약 (Markdown 포맷)
- 논문 정보: 저자, 출처, 게시일 등 메타데이터
- PDF 다운로드: 원문 PDF 파일 다운로드 기능

#### ❓ 퀴즈 (`/axpress/quiz`)
- O/X 퀴즈: 논문 내용 기반 참/거짓 문제
- 즉시 채점: 답변 선택 시 즉시 정답/오답 표시
- 해설 제공: 각 문제별 상세 해설
- 진행도 표시: 색상 인디케이터로 풀이 상태 시각화
- 통계: 정답률 집계 및 완료 메시지

#### 🎧 팟캐스트 (TTS) (`/axpress/tts`)
- TTS 오디오: 논문 요약을 음성으로 변환 (백엔드에서 생성)
- 재생 컨트롤: 재생/일시정지, 10초 건너뛰기, 진행도 조절
- 재생 속도: 0.75x ~ 2.0x 속도 조절
- 스크립트: 음성 텍스트 전문 제공 (Markdown)
- 다운로드: MP3 파일 다운로드 지원

#### 📊 학습 이력 (`/axpress/history`)
- 활동 타임라인: 요약 학습, 퀴즈 완료, 팟캐스트 청취 기록
- 통계 대시보드: 총 학습 시간, 완료 논문 수, 퀴즈 평균 점수, 연속 학습일
- MyHR 연동 준비: 향후 MyHR 교육이력 자동 동기화 예정

### 3. 사용자 경험 (UX)
- 미션 네비게이션: 학습 단계별 진행도 표시 (요약 → 퀴즈 → 팟캐스트 → 이력)
- 자동 진행: 각 단계 완료 시 다음 단계로 안내하는 플로팅 버튼
- 논문 보호 라우트: 논문 미선택 시 자동으로 탐색 페이지로 리다이렉트
- 선택 논문 배지: 현재 학습 중인 논문 정보 상단 고정 표시
- 반응형 디자인: 모바일, 태블릿, 데스크톱 최적화

---

## 🖥️ 실행 환경

### 요구 사항
- Node.js: 18 이상
- 패키지 매니저: npm 또는 pnpm

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd SK_AX_2025

# 2. 프론트엔드 의존성 설치
cd frontend/ax-college
npm install

# 3. 개발 서버 실행
npm run dev
```

기본 포트: `http://localhost:3000`

### 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물 실행
npm start
```

---

## 🧱 기술 스택

### 프레임워크 & 라이브러리
- Next.js 14 (React 18, App Router)
- TypeScript
- Tailwind CSS 4
- Framer Motion

### 상태 관리 & 데이터
- React Context API (PaperContext, AuthProvider)
- Axios (HTTP 클라이언트)
- 클라이언트 캐싱 (논문/요약/퀴즈/TTS)

### UI 컴포넌트
- Radix UI (Dialog, Dropdown, Tabs, Toast 등)
- Lucide React (아이콘)
- Sonner (토스트)
- React Markdown (Markdown 렌더링)

### 폼 & 검증
- React Hook Form
- Zod

---

## 🗂️ 폴더 구조

```
frontend/ax-college/
├─ app/                         # Next.js App Router
│  ├─ layout.tsx                # 루트 레이아웃
│  ├─ page.tsx                  # 홈 페이지
│  ├─ globals.css               # 전역 CSS
│  ├─ axpress/                  # AXpress 메인 기능
│  │  ├─ page.tsx               # 논문 탐색
│  │  ├─ api.ts                 # API 클라이언트
│  │  ├─ summary/page.tsx       # 논문 요약
│  │  ├─ quiz/page.tsx          # O/X 퀴즈
│  │  ├─ tts/page.tsx           # TTS 팟캐스트
│  │  └─ history/page.tsx       # 학습 이력
│  └─ ...                       # 기타 페이지
│
├─ components/
│  ├─ AXpress/                  # AXpress 전용 컴포넌트
│  │  ├─ MissionNav.tsx         # 미션 진행도 네비게이션
│  │  ├─ NextPageButton.tsx     # 다음 페이지 버튼
│  │  ├─ PaperCarousel.tsx      # 논문 카드 캐러셀
│  │  └─ ...
│  ├─ Auth/                     # 인증
│  ├─ Header/                   # 헤더
│  └─ ui/                       # 공용 UI
│
├─ contexts/
│  └─ PaperContext.tsx          # 논문 선택 & 진행 상태
│
├─ hooks/                       # React 훅
├─ services/                    # API 서비스
├─ types/                       # TypeScript 타입
└─ lib/                         # 유틸리티
```

---

## 🔌 백엔드 API 주요 엔드포인트

### 기본 URL
```
http://127.0.0.1:8000
```

### 1. 논문 검색
```http
POST /research_search
{
  "domain": "AI" | "금융" | "통신" | "제조" | "유통/물류" | "클라우드"
}
```

### 2. 논문 다운로드
```http
POST /research_download
{
  "pdf_url": "...",
  "arxiv_url": "...",
  "title": "..."
}
```

### 3. AI 요약 생성
```http
POST /summary
{
  "path": "/path/to/paper.pdf"
}
```

### 4. 퀴즈 생성
```http
POST /quiz
{
  "path": "/path/to/paper.pdf"
}
```

### 5. TTS 생성
```http
POST /tts/from-pdf-path
{
  "pdf_path": "/path/to/paper.pdf"
}
```

### 6. TTS 스트리밍
```http
GET /tts/{audio_file}/stream
```

---

## 🔁 데이터 흐름

### 전역 상태 (PaperContext)
- selectedPaper: 현재 선택된 논문
- completedSteps: 완료된 학습 단계
- selectPaper(): 논문 선택 (자동 다운로드)
- markStepComplete(): 단계 완료 표시

### 캐싱 전략
- 논문 검색: 도메인별 캐시
- 다운로드 경로: 제목 → 서버 경로 매핑
- 요약/퀴즈/TTS: 논문 제목 기준 캐시

### 학습 플로우
1. 논문 탐색 → 도메인 선택 → 논문 선택
2. 요약 학습 → AI 요약 로드 → 다음 단계
3. 퀴즈 → O/X 풀이 → 즉시 채점
4. 팟캐스트 → TTS 재생 → 완료
5. 학습 이력 → 통계 확인

---

## 🧩 주요 컴포넌트

### MissionNav
학습 파이프라인 진행도 표시 네비게이션

### NextPageButton
다음 단계로 안내하는 플로팅 버튼

### PaperProtectedRoute
논문 미선택 시 리다이렉트

### SelectedPaperBadge
현재 학습 중인 논문 표시

---

## 🗺️ 라우트 맵

```
/                      # 홈
├─ /axpress           # 논문 탐색
│  ├─ /summary        # 요약 학습
│  ├─ /quiz           # 퀴즈
│  ├─ /tts            # 팟캐스트
│  └─ /history        # 학습 이력
├─ /about             # 소개
├─ /curriculum        # 커리큘럼
├─ /enroll            # 수강 신청
└─ /my                # 마이페이지
```

---

## 🚀 배포

### Vercel (to BE)
1. GitHub 연결
2. 프로젝트 루트: `frontend/ax-college`
3. 환경 변수: `.env`
4. 자동 배포

---

## 🗺️ 로드맵

- [ ] MyHR 연동: 학습 이력 자동 동기화
- [ ] 추천 알고리즘: 관심사 기반 논문 추천
- [ ] 오프라인 지원: PWA + 오디오 캐싱
- [ ] 소셜 기능: 퀴즈 배틀, 학습 뱃지
- [ ] 다국어 지원: i18next
- [ ] 고급 통계: 학습 패턴 분석
- [ ] 노트 기능: 논문별 메모
- [ ] 북마크: 논문 즐겨찾기

---

## 👥 기여자

- 프론트엔드: Woon ([@Woooooooooon](https://github.com/Woooooooooon))
- 백엔드: 백엔드 레포지토리 참조

---

**Made with SKAX_team11_newbie for AX College**
