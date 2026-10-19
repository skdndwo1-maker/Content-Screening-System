import type { Grade, ReportFinding, ReviewMeta } from "@/lib/types";
import { getTaxonomyItem, normalizeCriteriaCode } from "@/lib/taxonomy";
import { firstSentence, splitReasonItems } from "./reasons";
import { routeOf, routeRecommendation } from "./routing";

const GRADE_RANK: Record<Grade, number> = { high: 0, med: 1, unverified: 2, low: 3 };

const EXPRESSION_CODES = new Set([
  "HATE",
  "DISCRIMINATION",
  "COMMUNITY_SIGNAL",
  "STEREOTYPE",
  "SOCIAL_ISSUE",
  "DISABILITY_SLUR",
  "APPEARANCE_STATUS",
  "PROFANITY",
]);

function findingBlob(f: ReportFinding): string {
  return `${f.category} ${f.categoryKo} ${f.target} ${f.aiText} ${(f.keywords ?? []).join(" ")}`;
}

export function isExpressionFinding(f: ReportFinding): boolean {
  const code = normalizeCriteriaCode(f.category || "");
  if (EXPRESSION_CODES.has(code)) return true;
  if (getTaxonomyItem(code)?.g === "expression_risk") return true;
  return /혐오|성별|비하|차별|고정관념|커뮤니티.?신호|집게손|hate|gender|stereotype/i.test(findingBlob(f));
}

function expressionWeight(f: ReportFinding): number {
  if (isExpressionFinding(f)) return 3;
  if (/표현|expression/i.test(`${f.category} ${f.categoryKo}`)) return 2;
  return 0;
}

function compareFindings(a: ReportFinding, b: ReportFinding): number {
  const g = GRADE_RANK[a.grade] - GRADE_RANK[b.grade];
  if (g !== 0) return g;
  const w = expressionWeight(b) - expressionWeight(a);
  if (w !== 0) return w;
  return a.score - b.score;
}

function leadFinding(findings: ReportFinding[]): ReportFinding {
  return [...findings].sort(compareFindings)[0];
}

function gradeKo(grade: Grade): string {
  if (grade === "high") return "위험";
  if (grade === "med") return "주의";
  if (grade === "unverified") return "미검증";
  return "안전";
}

function mentionExpression(f: ReportFinding): string {
  const body = firstSentence(f.aiText) || f.target;
  const labeled = `${f.categoryKo}(${gradeKo(f.grade)})`;
  const biasHint = /성별|비하|혐오|차별|고정관념/.test(`${f.categoryKo} ${f.aiText} ${f.target}`)
    ? ""
    : " 성별 편향·비하로 해석될 여지가 있습니다.";
  return body ? `${labeled} — ${body}${biasHint}` : `${labeled} 요소가 있습니다.${biasHint}`;
}

export function overallFrom(findings: ReportFinding[]): ReviewMeta["overall"] {
  if (!findings.length) {
    return {
      summary: "활성 기준 대비 뚜렷한 리스크 신호가 없습니다.",
      recommendation: routeRecommendation(routeOf(100)),
      actions: [],
      reasons: ["개별 항목이 모두 안전 또는 해당 없음"],
    };
  }

  const ranked = [...findings].sort(compareFindings);
  const top = leadFinding(findings);
  const highs = ranked.filter(f => f.grade === "high");
  const meds = ranked.filter(f => f.grade === "med");
  const flagged = ranked.filter(f => f.grade === "high" || f.grade === "med" || f.grade === "unverified");
  const expressionFlagged = flagged.filter(isExpressionFinding);
  const recommendation = routeRecommendation(routeOf(Math.min(...findings.map(f => f.score))));

  const reasonOrdered = [...flagged].sort((a, b) => {
    const w = expressionWeight(b) - expressionWeight(a);
    if (w !== 0) return w;
    return GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.score - b.score;
  });
  const reasons = reasonOrdered.slice(0, 5).map(f => {
    const lead = firstSentence(f.aiText);
    return lead ? `${f.categoryKo} · 「${f.target}」 — ${lead}` : `${f.categoryKo} · 「${f.target}」`;
  });

  const actionSource = [
    ...highs,
    ...meds,
    ...expressionFlagged.filter(f => f.grade === "unverified"),
  ].filter((f, i, arr) => arr.findIndex(x => x.id === f.id) === i);
  const actions = actionSource.slice(0, 4).map(f =>
    f.alternatives?.[0]?.text ? `「${f.target}」 → ${f.alternatives[0].text}` : `${f.categoryKo} 문구·연출 보완`
  );

  const leadText = firstSentence(top.aiText);
  let summary = leadText
    ? `${top.categoryKo}(${gradeKo(top.grade)})이 핵심입니다. ${leadText}`
    : `「${top.target}」이(가) ${top.categoryKo}(${gradeKo(top.grade)})로 판정되었습니다.`;

  const extraExpr = expressionFlagged.filter(f => f.id !== top.id);
  if (!isExpressionFinding(top) && extraExpr.length) {
    summary += ` 또한 이미지·카피에 성별 편향·비하로 읽힐 수 있는 요소가 있습니다. ${extraExpr.map(mentionExpression).join(" ")}`;
  } else if (isExpressionFinding(top) && extraExpr.length) {
    summary += ` 추가로 ${extraExpr.map(mentionExpression).join(" ")}`;
  } else if (!isExpressionFinding(top) && !expressionFlagged.length) {
    const others = highs.filter(f => f.id !== top.id);
    if (others.length) {
      summary += ` 이와 별도로 ${others.map(f => f.categoryKo).join(", ")} 위험도 있습니다.`;
    } else if (!highs.length && meds.length) {
      summary += ` 배포 전 ${meds.map(f => f.categoryKo).join(", ")} 보완을 권합니다.`;
    }
  }

  if (isExpressionFinding(top) && highs.some(f => f.id !== top.id)) {
    const otherHighs = highs.filter(f => f.id !== top.id);
    summary += ` 이와 별도로 ${otherHighs.map(f => f.categoryKo).join(", ")} 위험도 있습니다.`;
  }

  return {
    summary,
    recommendation,
    actions,
    reasons: reasons.length ? reasons : splitReasonItems([top.aiText]),
  };
}
