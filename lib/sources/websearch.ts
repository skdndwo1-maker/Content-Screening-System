import { generateSearch } from "@/lib/llm/gemini";
import type { ReportFinding, WebSearchEvidence, WebSearchSentence } from "@/lib/types";
import { applyWebSearch } from "./apply";
import { cacheGet, cacheSet } from "./cache";
import { searchCallBudget, searchEnabled } from "./flags";
import { normalizeLinks } from "./links";
import { needsWebSearch, queriesForFinding, searchPrompt, verdictKo } from "./queries";
import type { ExternalSourceProvider, SourceResult, SourceRunCtx } from "./types";
import type { GenerateSearchResult } from "@/lib/llm/gemini";

function emptyEvidence(status: WebSearchEvidence["status"], queries: string[], error?: string): WebSearchEvidence {
  return { status, summary: [], links: [], queries, error };
}

function toSentences(res: GenerateSearchResult): { summary: WebSearchSentence[]; links: ReturnType<typeof normalizeLinks> } {
  const links = normalizeLinks(res.chunks);
  const indexMap = new Map<number, number>();
  res.chunks.forEach((c, i) => {
    const pos = links.findIndex(l => l.uri === c.uri);
    if (pos >= 0) indexMap.set(i, pos + 1);
  });

  const summary: WebSearchSentence[] = [];
  for (const s of res.supports) {
    const cites = [...new Set(s.chunkIndices.map(i => indexMap.get(i)).filter((n): n is number => Boolean(n)))];
    if (!cites.length) continue;
    if (/확인된 사례 없음/.test(s.text) && cites.length === 0) continue;
    summary.push({ text: s.text.replace(/\s+/g, " ").trim(), cites });
    if (summary.length >= 3) break;
  }
  return { summary, links };
}

async function runQuery(query: string, category: string, verdict: string): Promise<GenerateSearchResult> {
  const cached = cacheGet<GenerateSearchResult>(query);
  if (cached) return cached;
  const res = await generateSearch(searchPrompt(query, category, verdict));
  cacheSet(query, res);
  return res;
}

export const webSearchProvider: ExternalSourceProvider = {
  id: "websearch",
  enabled: searchEnabled,
  async run(ctx: SourceRunCtx): Promise<SourceResult> {
    const targets = ctx.findings.filter(needsWebSearch);
    if (!targets.length) {
      return {
        id: "websearch",
        status: "empty",
        findings: ctx.findings.map(f => ({ ...f, webSearch: emptyEvidence("empty", []) })),
        note: "안전 항목만 있어 웹 검색을 건너뜀",
      };
    }

    let calls = 0;
    const budget = searchCallBudget();
    const next: ReportFinding[] = [];
    let anyDone = false;
    let anyError = "";

    for (const finding of ctx.findings) {
      if (!needsWebSearch(finding)) {
        next.push({ ...finding, webSearch: emptyEvidence("empty", []) });
        continue;
      }
      const queries = queriesForFinding(finding, ctx.ctx.name || ctx.ctx.type || "");
      const runnable = queries.filter(() => {
        if (calls >= budget) return false;
        calls += 1;
        return true;
      });
      if (runnable.length < queries.length) {
        console.info("[gemini-search] budget skip", { skipped: queries.slice(runnable.length), budget });
      }

      const settled = await Promise.allSettled(runnable.map(q => runQuery(q, finding.categoryKo, verdictKo(finding.grade))));
      const mergedQueries: string[] = [...runnable];
      const rawChunks: { title?: string; uri?: string }[] = [];
      const supportTexts: GenerateSearchResult["supports"] = [];
      let entryPointHtml: string | undefined;
      for (const item of settled) {
        if (item.status === "fulfilled") {
          mergedQueries.push(...item.value.queries);
          rawChunks.push(...item.value.chunks);
          supportTexts.push(...item.value.supports);
          entryPointHtml = entryPointHtml || item.value.entryPointHtml;
        } else {
          anyError = item.reason instanceof Error ? item.reason.message : String(item.reason);
        }
      }

      const fakeRes: GenerateSearchResult = {
        text: "",
        model: "",
        queries: mergedQueries,
        chunks: rawChunks,
        supports: supportTexts,
        entryPointHtml,
        ms: 0,
      };
      const { summary, links } = toSentences(fakeRes);
      const status = summary.length || links.length ? "done" : anyError ? "error" : "empty";
      if (status === "done") anyDone = true;
      const evidence: WebSearchEvidence = {
        status,
        summary,
        links,
        queries: [...new Set(mergedQueries)].slice(0, 8),
        entryPointHtml,
        error: status === "error" ? anyError : undefined,
      };
      next.push(applyWebSearch(finding, evidence));
    }

    const overall = anyDone ? "done" : anyError ? "error" : "empty";
    return {
      id: "websearch",
      status: overall,
      findings: next,
      error: overall === "error" ? anyError : undefined,
    };
  },
};
