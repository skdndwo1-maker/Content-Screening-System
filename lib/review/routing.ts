import type { ReviewDecision, ReviewRoute } from "@/lib/types";

export const PASS_SCORE = 80;
export const APPEAL_SCORE = 60;

export function routeOf(score: number): ReviewRoute {
  if (score >= PASS_SCORE) return "pass_manual";
  if (score >= APPEAL_SCORE) return "appeal_eligible";
  return "blocked";
}

export function routeLabel(route: ReviewRoute): string {
  if (route === "pass_manual") return "프로그램 통과 · 관리자 승인";
  if (route === "appeal_review") return "이의 제기 · 수기검수";
  if (route === "appeal_eligible") return "이의 제기 가능";
  if (route === "manual_request") return "관리자 검토 요청";
  return "수정 후 재검수";
}

export function routeRecommendation(route: ReviewRoute): string {
  if (route === "pass_manual") return "프로그램 통과 · 관리자 승인 대기";
  if (route === "appeal_review") return "이의 제기됨 · 관리자 수기검수";
  if (route === "appeal_eligible") return "이의 제기 후 수기검수 가능";
  if (route === "manual_request") return "관리자 결재 대기";
  return "수정 후 재검수";
}

export function decisionLabel(d: ReviewDecision | null | undefined): string {
  if (d === "approve") return "승인";
  if (d === "conditional") return "조건부 승인";
  if (d === "reject") return "반려";
  if (d === "hold") return "보류";
  return "완료";
}
