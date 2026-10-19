import type { Grade } from "@/lib/types";

/** 엔진·구 리스크 점수(높을수록 위험) → 사용 가능 점수(높을수록 게시 가능) */
export function usabilityFromRisk(risk: number): number {
  return Math.max(0, Math.min(100, 100 - Math.round(risk)));
}

export function clampUsability(grade: Grade, score: number): number {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (grade === "high") return 0;
  if (grade === "med") return Math.min(59, Math.max(30, s));
  if (grade === "unverified") return Math.min(75, Math.max(35, s));
  return Math.max(80, s);
}

export function incomingToUsability(grade: Grade, score: number): number {
  if (grade === "high" && score >= 70) return usabilityFromRisk(score);
  if (grade === "low" && score <= 25) return usabilityFromRisk(score);
  if (grade === "med" && score > 59) return usabilityFromRisk(score);
  return score;
}

export function usabilityScore(grade: Grade, riskOrUsability: number, alreadyUsability = false): number {
  const raw = alreadyUsability ? incomingToUsability(grade, riskOrUsability) : usabilityFromRisk(riskOrUsability);
  return clampUsability(grade, raw);
}
