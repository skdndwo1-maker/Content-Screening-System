import { clampUsability } from "@/lib/review/usability";
import type { Grade, ReportFinding, WebSearchEvidence } from "@/lib/types";
import { looksControversial } from "./links";

export function applyWebSearch(finding: ReportFinding, evidence: WebSearchEvidence): ReportFinding {
  const next: ReportFinding = {
    ...finding,
    webSearch: evidence,
    sources: finding.sources.includes("websearch") ? finding.sources : [...finding.sources, "websearch"],
  };

  if (evidence.status !== "done") return next;

  const texts = evidence.summary.map(s => s.text);
  if (!evidence.links.length || !looksControversial(texts)) return next;

  const before = finding.grade;
  const score = clampUsability(finding.grade, finding.score - 10);
  const after: Grade = finding.grade;
  return {
    ...next,
    score,
    adjustment: {
      before,
      after,
      reason: `웹 검색 근거로 상향: 기업 논란·사과·광고 중단 사례가 출처와 함께 확인됨`,
    },
  };
}

export function mergeSourceNote(existing: string[] | undefined, note: string | undefined): string[] | undefined {
  if (!note) return existing;
  const next = [...(existing ?? [])];
  if (!next.includes(note)) next.push(note);
  return next;
}
