import type { ReportFinding } from "@/lib/types";
import { searchMaxQueries } from "./flags";

const VISUAL = /손|손가락|제스처|상징|이모지|로고|배너|포즈/;

function unique(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const t = x.replace(/\s+/g, " ").trim();
    if (!t || t.length > 24 || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function seedTerms(f: ReportFinding): string[] {
  const hidden = (f.hiddenSignals ?? []).map(s => s.term || s.extracted);
  return unique([...(f.highlight ?? []), ...hidden, ...f.keywords.filter(k => k.length <= 16)]);
}

export function needsWebSearch(f: ReportFinding): boolean {
  return f.grade === "high" || f.grade === "med" || f.grade === "unverified";
}

export function queriesForFinding(f: ReportFinding, campaign: string): string[] {
  const max = searchMaxQueries();
  const terms = seedTerms(f);
  const out: string[] = [];
  const visual = (f.evidenceChips ?? []).find(c => VISUAL.test(c));
  if (visual) out.push("광고 손가락 모양 논란");

  for (const term of terms) {
    out.push(`"${term}" 광고 논란`);
    if (out.length >= max) break;
    out.push(`${term} 기업 사과`);
    if (out.length >= max) break;
  }

  const material = terms[0] || campaign.slice(0, 12);
  if (out.length < max && material) {
    const topic = f.categoryKo.includes("혐오") ? "혐오" : "논란";
    out.push(`${material} 광고 ${topic} 논란`);
  }

  return unique(out).slice(0, max);
}

export function searchPrompt(query: string, category: string, verdict: string): string {
  return `아래 표현이 대한민국에서 기업 광고·마케팅에 사용되어 논란, 비판, 사과, 광고 중단으로 이어진 사례가 있는지 웹에서 찾아라.
또한 이 표현이 현재 온라인에서 어떤 의미로 쓰이는지 확인하라.
- 확인된 사실만 쓰고, 찾지 못하면 "확인된 사례 없음"이라고 답하라.
- 언급량, 건수, 증감률 같은 수치는 쓰지 마라.
- 3문장 이내로 답하라.
표현: ${query}
맥락: ${category} 항목에서 ${verdict}로 판정됨`;
}

export function verdictKo(grade: ReportFinding["grade"]): string {
  if (grade === "high") return "위험";
  if (grade === "med") return "주의";
  if (grade === "unverified") return "미검증";
  return "안전";
}
