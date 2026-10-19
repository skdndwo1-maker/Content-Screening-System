import { criteriaLabel } from "@/lib/criteria";
import { getTaxonomyItem, mapUiChannels, maxChannelWeight, normalizeCriteriaCode } from "@/lib/taxonomy";
import { generateJsonWithFallback, embedTexts, reviewModel, shortError } from "@/lib/llm/gemini";
import { formatRagForPrompt, rankWithQueryEmbedding, searchKnowledge } from "@/lib/rag/search";
import { chunkCodes } from "@/lib/rag/parse";
import type { RagHit } from "@/lib/rag/types";
import { REVIEW_SCHEMA } from "./schema";
import { externalSourceFlags, resolveActiveItems } from "./activeItems";
import { loadSystemPrompt, loadUserPrompt } from "./prompts";
import type { Grade, HiddenSignal, RagCitation, ReportFinding, ReviewMeta, UploadTab } from "@/lib/types";
import type { ImagePart as LlmImage } from "@/lib/llm/gemini";
import { applyOpenSearch, extractByPositions, scanHidden } from "@/lib/hidden/engine";
import { formatRulesForPrompt, parseRulesPayload, parseTermsPayload } from "@/lib/hidden/load";
import type { HiddenCandidate, HiddenJudgment, OpenSearchProposal } from "@/lib/hidden/types";
import { usabilityScore } from "./usability";
import { overallFrom } from "./overall";

export type { LlmImage };

interface RawFinding {
  category: string;
  contentType: ReportFinding["contentType"];
  target: string;
  highlight?: string[];
  keywords: string[];
  grade: Grade;
  score: number;
  aiText: string;
  citedChunkIds?: string[];
  alternatives?: { label: string; text: string }[];
  wholeContext?: boolean;
}

export interface ReviewRequest {
  textValue: string;
  namingRows: string[];
  ctx: {
    name: string;
    date: string;
    channels: string[];
    targets: string[];
    type: string;
    intent: string;
  };
  enabledCriteria: Record<string, Record<string, boolean>>;
  uploadTab: UploadTab;
  images?: LlmImage[];
  termsJson?: string;
  rulesJson?: string;
}

const GRADE_RANK: Record<Grade, number> = { high: 3, med: 2, unverified: 1, low: 0 };

function clampGrade(grade: Grade, cap: Grade | null | undefined): Grade {
  if (!cap) return grade;
  return GRADE_RANK[grade] > GRADE_RANK[cap] ? cap : grade;
}

interface ReviewPayload {
  findings: RawFinding[];
  hiddenJudgments?: HiddenJudgment[];
  openSearch?: OpenSearchProposal[];
}

function parseReview(text: string): ReviewPayload {
  const trimmed = text.trim().replace(/^```json\s*|\s*```$/g, "");
  const parsed = JSON.parse(trimmed) as unknown;
  if (Array.isArray(parsed)) return { findings: parsed as RawFinding[] };
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as ReviewPayload).findings)) {
    return parsed as ReviewPayload;
  }
  throw new Error("모델 응답이 검수 JSON이 아닙니다.");
}

function parseFindings(text: string): RawFinding[] {
  return parseReview(text).findings;
}

function numberedSource(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line, i) => `${String(i + 1).padStart(2, " ")}│ ${line}`)
    .join("\n");
}

function contentTypeOf(tab: UploadTab): ReportFinding["contentType"] {
  if (tab === "naming") return "네이밍";
  if (tab === "image") return "이미지";
  return "텍스트";
}

function candidateToFinding(c: HiddenCandidate, tab: UploadTab, source: string, judge?: HiddenJudgment): ReportFinding {
  let grade: Grade = c.verdict;
  let risk = c.codeScore;
  if (judge?.unnatural) risk = Math.min(100, risk + 15);
  if (judge?.verdict) grade = judge.verdict;
  if (grade === "high" && risk < 70) risk = 70;
  if (grade === "med" && (risk < 35 || risk > 69)) risk = Math.min(69, Math.max(35, risk));
  const score = usabilityScore(grade, risk);
  const signal: HiddenSignal = {
    term: c.term,
    matchedIds: c.matchedIds,
    pathId: c.pathId,
    pathDesc: c.pathDesc,
    positions: c.positions,
    extracted: c.extracted,
    normalization: c.normalization,
    codeScore: c.codeScore,
    tier: c.tier,
  };
  return {
    id: `hidden-${c.term}-${c.pathId}`,
    category: "HATE",
    categoryKo: criteriaLabel("HATE"),
    contentType: contentTypeOf(tab),
    target: source,
    highlight: [c.extracted, c.term],
    keywords: ["은닉", c.term, c.pathId],
    grade,
    score,
    sources: ["ai"],
    aiText:
      judge?.reason ||
      `코드 엔진이 ${c.pathDesc} 경로에서 ‘${c.term}’을(를) 추출했습니다. 글자 조합은 코드가 수행했고, 아는 사람이 캡처하면 그렇게 읽힐 수 있습니다.`,
    alternatives: judge?.fix ? [{ label: "톤 유지", text: judge.fix }] : undefined,
    hiddenSignals: [signal],
    wholeContext: true,
  };
}

function buildContent(req: ReviewRequest): string {
  const samples: string[] = [];
  if (req.textValue.trim()) samples.push(`[텍스트 콘텐츠]\n${req.textValue.trim()}`);
  const names = req.namingRows.map(s => s.trim()).filter(Boolean);
  if (names.length) samples.push(`[네이밍/카피 후보]\n${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}`);
  if (req.uploadTab === "image") {
    samples.push(
      req.images?.length
        ? `[이미지] ${req.images.length}장 첨부됨. AI 생성 표기 여부를 이미지와 카피에서 확인.`
        : "[이미지] 첨부 없음 — 생성물 표시 누락 가능성을 기준으로 검토."
    );
  }
  if (samples.length === 0) samples.push("[입력 없음]");
  return samples.join("\n\n");
}

function citationsFor(ids: string[] | undefined, hits: RagHit[]): RagCitation[] {
  if (!ids?.length) return [];
  const byId = new Map(hits.map(h => [h.chunk.chunk_id, h.chunk]));
  return ids
    .map(id => byId.get(id))
    .filter(Boolean)
    .map(c => ({
      chunk_id: c!.chunk_id,
      source_type: c!.source_type,
      source_title: c!.source_title,
      source_ref: c!.source_ref,
      verified: true,
    }));
}

export async function runReview(req: ReviewRequest): Promise<{
  findings: ReportFinding[];
  model: string;
  meta: ReviewMeta;
}> {
  const tab = req.uploadTab || "text";
  const active = resolveActiveItems({
    tab,
    enabledCriteria: req.enabledCriteria,
    publishDate: req.ctx.date,
    channels: req.ctx.channels,
  });
  const codes = active.map(a => a.item.k);
  const mapped = mapUiChannels(req.ctx.channels);
  const queryText = [req.textValue, ...req.namingRows, req.ctx.intent, req.ctx.name].filter(Boolean).join("\n");
  const sourceText = [req.textValue, ...req.namingRows.map(s => s.trim()).filter(Boolean)].filter(Boolean).join("\n");
  const termsDoc = parseTermsPayload(req.termsJson);
  const rulesDoc = parseRulesPayload(req.rulesJson) as Record<string, unknown> & ReturnType<typeof parseRulesPayload>;
  const hidden = scanHidden({
    text: sourceText || "(없음)",
    terms: termsDoc,
    rules: rulesDoc,
    channels: req.ctx.channels,
  });
  const knownTerms = new Set(hidden.candidates.map(c => c.term));

  let hits = searchKnowledge({
    codes,
    tab,
    channels: mapped,
    publishDate: req.ctx.date,
    queryText,
    limit: 18,
  });

  try {
    if (hits.some(h => h.chunk.embedding?.length) && queryText.trim()) {
      const { vectors } = await embedTexts([queryText.slice(0, 8000)]);
      if (vectors[0]?.length) hits = rankWithQueryEmbedding(hits, vectors[0]).slice(0, 18);
    }
  } catch (e) {
    console.warn("[rag] embedding rank skipped:", shortError(e));
  }

  const criteriaBlock = active.length
    ? active
        .map(({ item }) => {
          const extra = item.desc ? ` — ${item.desc}` : "";
          return `- ${item.k} (${item.ko})${extra}`;
        })
        .join("\n")
    : "- (활성 기준 없음)";

  const user = loadUserPrompt({
    campaign: req.ctx.name || "(없음)",
    date: req.ctx.date || "(없음)",
    channels: req.ctx.channels.length ? req.ctx.channels.join(", ") : "(없음)",
    mappedChannels: mapped.length ? mapped.join(", ") : "(없음)",
    targets: req.ctx.targets.length ? req.ctx.targets.join(", ") : "(없음)",
    type: req.ctx.type || "(없음)",
    tab,
    intent: req.ctx.intent || "(없음)",
    criteria: criteriaBlock,
    rag: formatRagForPrompt(hits),
    content: buildContent(req),
    rules: formatRulesForPrompt(rulesDoc),
    hiddenCandidates: hidden.candidates.length
      ? JSON.stringify(
          hidden.candidates.map(c => ({
            term: c.term,
            matched_ids: c.matchedIds,
            path_id: c.pathId,
            path_desc: c.pathDesc,
            positions: c.positions,
            extracted: c.extracted,
            normalization: c.normalization,
            code_score: c.codeScore,
            verdict: c.verdict,
          })),
          null,
          2
        )
      : "(코드 엔진 후보 없음)",
    numberedSource: numberedSource(sourceText || "(없음)"),
  });

  const first = await generateJsonWithFallback({
    system: loadSystemPrompt(),
    user,
    schema: REVIEW_SCHEMA,
    images: tab === "image" ? req.images : undefined,
  });

  let payload: ReviewPayload = { findings: [] };
  try {
    payload = parseReview(first.text);
  } catch {
    const retry = await generateJsonWithFallback({
      system: loadSystemPrompt(),
      user: user + "\n\n이전 응답이 JSON 스키마에 맞지 않았습니다. {findings, hiddenJudgments, openSearch} 객체만 다시 반환하세요.",
      schema: REVIEW_SCHEMA,
      images: tab === "image" ? req.images : undefined,
      models: [first.model],
    });
    try {
      payload = parseReview(retry.text);
    } catch {
      payload = { findings: [] };
    }
  }
  let raw = payload.findings;

  const secondModel = reviewModel();
  if (secondModel && raw.some(r => r.grade === "high" || r.grade === "med" || r.grade === "unverified")) {
    try {
      const risky = raw.filter(r => r.grade !== "low");
      const second = await generateJsonWithFallback({
        system: loadSystemPrompt(),
        user:
          user +
          `\n\n### 1차 판정(주의·위험·미검증만 재검토)\n${JSON.stringify(risky)}\n더 보수적으로 재판정하세요.`,
        schema: REVIEW_SCHEMA,
        images: tab === "image" ? req.images : undefined,
        models: [secondModel],
      });
      const parsed = parseFindings(second.text);
      const byCat = new Map(parsed.map(p => [normalizeCriteriaCode(p.category), p]));
      raw = raw.map(r => {
        const n = normalizeCriteriaCode(r.category);
        if (r.grade === "low") return r;
        return byCat.get(n) ?? r;
      });
    } catch (e) {
      console.warn("[review] second pass skipped:", shortError(e));
    }
  }

  const hitIds = new Set(hits.map(h => h.chunk.chunk_id));
  const findings: ReportFinding[] = raw.map((r, i) => {
    const category = normalizeCriteriaCode(r.category);
    const tax = getTaxonomyItem(category);
    const weight = maxChannelWeight(tax, mapped);
    let grade = r.grade;
    grade = clampGrade(grade, tax?.severity_cap ?? null);
    const weighted = Math.round(r.score / Math.max(weight, 0.01));
    let score = usabilityScore(grade, weighted, true);

    const cited = (r.citedChunkIds ?? []).filter(id => hitIds.has(id));
    const autoIds = hits.filter(h => chunkCodes(h.chunk).includes(category)).map(h => h.chunk.chunk_id);
    const rag = citationsFor(cited.length ? cited : autoIds.slice(0, 2), hits);
    const ragRequired = Boolean(tax?.rag_required);
    if (ragRequired && rag.length === 0 && grade !== "low") {
      grade = "unverified";
      score = usabilityScore(grade, score, true);
    }

    return {
      id: `ai-${i + 1}`,
      category,
      categoryKo: criteriaLabel(category),
      contentType: r.contentType,
      target: r.target,
      highlight: r.highlight,
      keywords: r.keywords ?? [],
      grade,
      score,
      sources: ["ai"],
      aiText: r.aiText,
      alternatives: r.alternatives,
      wholeContext: r.wholeContext,
      rag,
      ragStatus: rag.length ? "ok" : ragRequired ? "unverified" : "ok",
    };
  });

  for (const proposal of payload.openSearch ?? []) {
    if (!applyOpenSearch(sourceText, proposal)) continue;
    const inner = scanHidden({ text: proposal.result, terms: termsDoc, rules: rulesDoc, channels: req.ctx.channels });
    for (const c of inner.candidates) {
      if (knownTerms.has(c.term)) continue;
      knownTerms.add(c.term);
      hidden.candidates.push({
        ...c,
        pathId: "OPEN_SEARCH",
        pathDesc: proposal.rule,
        positions: proposal.positions.map(([line, col]) => ({
          line,
          col,
          ch: extractByPositions(sourceText, [[line, col]]),
        })),
      });
    }
  }

  const judgments = (payload.hiddenJudgments ?? []).filter(j => knownTerms.has(j.term));
  const hiddenFindings = hidden.candidates.map(c => {
    const judge = judgments.find(j => j.term === c.term && (!j.path_id || j.path_id === c.pathId));
    const finding = candidateToFinding(c, tab, sourceText, judge);
    if (finding.alternatives?.length) {
      finding.alternatives = finding.alternatives.filter(alt => {
        const again = scanHidden({ text: alt.text, terms: termsDoc, rules: rulesDoc, channels: req.ctx.channels });
        return !again.candidates.some(x => x.verdict === "high" || x.verdict === "med");
      });
    }
    return finding;
  });

  const hiddenTerms = new Set(hiddenFindings.map(f => f.hiddenSignals?.[0]?.term));
  const merged = [
    ...hiddenFindings,
    ...findings.filter(f => !f.keywords.some(k => hiddenTerms.has(k))),
  ];

  const ext = externalSourceFlags();
  return {
    findings: merged,
    model: first.model,
    meta: {
      model: first.model,
      ragChunks: hits.length,
      grok: ext.grok,
      naver: ext.naver,
      overall: overallFrom(merged),
      sourceFlags: ext.flags,
      sourceStates: {
        websearch: ext.flags.websearch ? "pending" : "disabled",
        grok: ext.flags.grok ? "pending" : "disabled",
        naver: ext.flags.naver ? "pending" : "disabled",
      },
    },
  };
}
