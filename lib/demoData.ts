import type { ReportFinding, HistoryRow, LexVersion } from "./types";
import { seedPayload } from "./lexiconSeed";

export const demoFindings: ReportFinding[] = [
  {
    id: "f1",
    category: "HATE",
    categoryKo: "혐오 표현",
    contentType: "카피",
    target: "이거 모르면 한남충 인증",
    highlight: ["한남충"],
    keywords: ["한남충", "성별 혐오"],
    grade: "high",
    score: 0,
    sources: ["ai"],
    aiText:
      "'한남충'은 남성을 벌레에 비유해 비하하는 성별 혐오 표현입니다. 캠페인 카피에 포함될 경우 브랜드가 특정 성별을 조롱하는 메시지로 해석될 수 있고, 네거티브 바이럴 리스크가 매우 큽니다.",
    alternatives: [
      { label: "톤 유지", text: "이거 모르면 트렌드 뒤처진 거!" },
      { label: "안전 우선", text: "지금 이 혜택, 놓치면 아쉬워요" },
      { label: "간결", text: "요고 꼭 챙기세요" },
    ],
  },
  {
    id: "f2",
    category: "SOCIAL_ISSUE",
    categoryKo: "사회 이슈",
    contentType: "카피",
    target: "요고 못참지",
    keywords: ["밈 톤", "커뮤니티 유래"],
    grade: "med",
    score: 46,
    sources: ["ai"],
    aiText:
      "‘요고 못참지’는 특정 커뮤니티에서 파생된 어투로, 광고 톤으로 사용 시 세대·성향에 따라 거부감이 발생할 수 있습니다. 혐오 표현은 아니지만 과도한 밈 톤은 공식 브랜드 메시지에서 완화를 권장합니다.",
    alternatives: [
      { label: "톤 유지", text: "요고, 놓치면 아쉬워요" },
      { label: "안전 우선", text: "이번 혜택, 꼭 챙기세요" },
    ],
  },
  {
    id: "f3",
    category: "AD_DISCLOSURE",
    categoryKo: "광고 표기",
    contentType: "이미지",
    target: "키비주얼 하단 영역",
    wholeContext: true,
    evidenceChips: ["손동작 제스처", "요금 표기 누락"],
    keywords: ["광고 표기 누락"],
    grade: "unverified",
    score: 52,
    sources: ["ai"],
    aiText:
      "이미지 하단에 ‘광고’ 또는 ‘AD’ 표기가 보이지 않습니다. 유료 광고일 경우 표시광고법에 따라 명시가 필요합니다. 외부 검증 데이터가 없어 미검증으로 분류합니다.",
    alternatives: [
      { label: "안전 우선", text: "하단에 ‘광고’ 표기 추가" },
    ],
  },
  {
    id: "f4",
    category: "TIMING_APPROPRIATENESS",
    categoryKo: "게시 적절성",
    contentType: "텍스트",
    target: "여름 성수기 가족 데이터 혜택을 지금 바로 챙기세요",
    keywords: ["시의성"],
    grade: "low",
    score: 88,
    sources: ["ai"],
    aiText: "게시 예정일 기준 성수기 캠페인 톤이 적합합니다.",
  },
  {
    id: "f5",
    category: "DISCLOSURE",
    contentType: "텍스트",
    categoryKo: "고지 의무",
    target: "데이터 걱정 없는 하루",
    keywords: ["무제한 오인"],
    grade: "med",
    score: 54,
    sources: ["ai"],
    aiText:
      "‘걱정 없는’ 표현은 사용량·요금 제한을 오인시킬 수 있습니다. ‘일정 데이터 제공’ 등 구체 범위를 함께 고지하는 편이 안전합니다.",
    alternatives: [
      { label: "안전 우선", text: "데이터 25GB까지 걱정 없이" },
    ],
  },
];

export const demoHistory: HistoryRow[] = [
  { id: "r1", type: "카피", campaign: "가정의달 캠페인 진행을 위한 홍보", publishDate: "2026-05-04", channels: ["인스타그램", "유튜브"], author: "주현", grade: "high", score: 0, reviewedAt: "2026-08-06 17:24", version: 3, totalVersions: 3, reviewRoute: "blocked" },
  { id: "r2", type: "이미지", campaign: "청춘요고 티저", publishDate: "2026-07-21", channels: ["X", "자사 웹·앱"], author: "민수", grade: "med", score: 38, reviewedAt: "2026-08-01 11:40", version: 1, totalVersions: 1, reviewRoute: "blocked" },
  { id: "r4", type: "네이밍", campaign: "우리 동네 데이터 요금제", publishDate: "2026-06-18", channels: ["Naver", "자사 웹·앱"], author: "지은", grade: "low", score: 88, reviewedAt: "2026-07-19 09:14", version: 1, totalVersions: 1, reviewRoute: "pass_manual", adminStatus: "pending" },
  { id: "r5", type: "텍스트", campaign: "청년 요금제 리뉴얼", publishDate: "2026-05-30", channels: ["인스타그램"], author: "민수", grade: "high", score: 0, reviewedAt: "2026-07-10 18:51", version: 1, totalVersions: 1, reviewRoute: "blocked" },
  { id: "r6", type: "카피", campaign: "데이터 어린이날 이벤트", publishDate: "2026-05-05", channels: ["RCS", "MMS"], author: "주현", grade: "low", score: 92, reviewedAt: "2026-06-24 10:03", version: 1, totalVersions: 1, reviewRoute: "pass_manual", adminStatus: "done" },
  { id: "r7", type: "카피", campaign: "멤버십 혜택 안내", publishDate: "2026-08-12", channels: ["인스타그램", "자사 웹·앱"], author: "주현", grade: "med", score: 72, reviewedAt: "2026-08-12 14:20", version: 1, totalVersions: 1, reviewRoute: "appeal_review", adminStatus: "appeal", appealNote: "브랜드 고유 슬로건이며 내부 가이드 허용 표현입니다.", appealFiles: [{ id: "af1", name: "브랜드가이드_허용표현.pdf", size: "1.2 MB" }] },
];

export const demoVersions: Record<"terms" | "rules" | "sources", LexVersion[]> = {
  terms: [
    { tag: "v14", message: "성별 혐오 표현 12건 추가 (-충 계열 파생어 포함)", author: "주현", at: "2026.08.06 17:24", payload: seedPayload("terms") },
    { tag: "v13", message: "세대 조롱 맥락 단어 정리, 예외 허용어 3건 해제", author: "민수", at: "2026.07.28 11:02", payload: seedPayload("terms") },
    { tag: "v12", message: "2026 상반기 신조어 반영 · 41건 일괄 등록", author: "주현", at: "2026.07.14 09:40", payload: seedPayload("terms") },
    { tag: "v11", message: "초기 사전 이관", author: "시스템", at: "2026.06.30 18:00", payload: seedPayload("terms") },
  ],
  rules: [
    { tag: "v3", message: "은닉 탐지 경로 보강", author: "주현", at: "2026.08.01 10:12", payload: seedPayload("rules") },
    { tag: "v2", message: "판정 규칙 정리", author: "민수", at: "2026.07.10 15:20", payload: seedPayload("rules") },
  ],
  sources: [
    { tag: "v2", message: "외부 소스 플래그 정리", author: "주현", at: "2026.07.02 16:48", payload: seedPayload("sources") },
    { tag: "v1", message: "초기 소스 설정", author: "시스템", at: "2026.06.30 18:00", payload: seedPayload("sources") },
  ],
};
