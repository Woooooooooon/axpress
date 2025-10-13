export type NavChild = {
  label: string
  path: string
  description?: string
}

export type NavItem = {
  key: string
  label: string
  path: string
  protected?: boolean
  children?: NavChild[]
}

export const NAV_DATA: NavItem[] = [
  {
    key: "about",
    label: "College 소개",
    path: "/about",
    children: [{ label: "College 소개", path: "/about" }],
  },
  {
    key: "curriculum",
    label: "교육체계",
    path: "/curriculum",
    children: [
      { label: "학부별 교육체계", path: "/curriculum/department" },
      { label: "사업별 교육체계", path: "/curriculum/business" },
    ],
  },
  {
    key: "guide",
    label: "Learning Guide",
    path: "/guide",
    children: [
      { label: "Learning Guide", path: "/guide" },
      { label: "학사관리 Guide", path: "/guide/academic" },
    ],
  },
  {
    key: "enroll",
    label: "수강신청",
    path: "/enroll",
    children: [
      { label: "연간 학습 계획 수립", path: "/enroll/plan" },
      { label: "수강신청", path: "/enroll" },
      { label: "교육 프로그램", path: "/enroll/programs" },
      { label: "외부 미등록 과정", path: "/enroll/external-unlisted" },
      { label: "사내 자체 과정", path: "/enroll/internal" },
      { label: "월별 사내과정 일정", path: "/enroll/internal-monthly" },
    ],
  },
  {
    key: "my",
    label: "My Page",
    path: "/my",
    protected: true,
    children: [
      { label: "나의 학사 현황", path: "/my/overview" },
      { label: "Learning History", path: "/my/history" },
      { label: "Learning Account", path: "/my/account" },
      { label: "전문가 활동", path: "/my/expert" },
      { label: "외국어", path: "/my/language" },
      { label: "자격증", path: "/my/certificates" },
      { label: "육성리더 코칭", path: "/my/leader-coaching" },
    ],
  },
  {
    key: "axpress",
    label: "AXpress",
    path: "/axpress",
    children: [
      { label: "논문 요약", path: "/axpress/summary", description: "선택한 논문의 요약 확인" },
      { label: "퀴즈", path: "/axpress/quiz", description: "논문 이해도 퀴즈" },
      { label: "팟캐스트", path: "/axpress/tts", description: "논문 음성 듣기" },
      { label: "학습 이력", path: "/axpress/history", description: "학습 기록 관리" },
    ],
  },
]
