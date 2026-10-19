import { chunkCodes, isChunkEffective } from "./parse";
import { loadChunks } from "./store";
import type { KnowledgeChunk, RagHit, RagQuery } from "./types";

function cosine(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d ? dot / d : 0;
}

function keywordScore(chunk: KnowledgeChunk, query: string): number {
  if (!query.trim()) return 0.2;
  const hay = `${chunk.source_title} ${chunk.text} ${chunkCodes(chunk).join(" ")}`.toLowerCase();
  const tokens = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(t => t.length >= 2);
  if (!tokens.length) return 0.2;
  const hits = tokens.filter(t => hay.includes(t)).length;
  return 0.15 + Math.min(0.85, hits / Math.min(8, tokens.length));
}

export function filterEffectiveChunks(
  chunks: KnowledgeChunk[],
  opts: { tab: RagQuery["tab"]; channels: RagQuery["channels"]; publishDate?: string; codes: string[] }
): KnowledgeChunk[] {
  const codeSet = new Set(opts.codes);
  return chunks.filter(c => {
    if (!isChunkEffective(c, opts.publishDate)) return false;
    const codes = chunkCodes(c);
    if (!codes.some(code => codeSet.has(code))) return false;
    if (c.applies_to?.length) {
      const ok = c.applies_to.includes(opts.tab);
      if (!ok) return false;
    }
    if (c.channel?.length && opts.channels.length && !c.channel.some(ch => opts.channels.includes(ch))) {
      return false;
    }
    return true;
  });
}

export function searchKnowledge(query: RagQuery): RagHit[] {
  const { chunks } = loadChunks();
  const filtered = filterEffectiveChunks(chunks, query);
  const ranked: RagHit[] = filtered.map(chunk => ({
    chunk,
    score: chunk.embedding?.length ? 0 : keywordScore(chunk, query.queryText),
  }));

  ranked.sort((a, b) => b.score - a.score);

  const perCode = new Map<string, number>();
  const picked: RagHit[] = [];
  const limit = query.limit ?? 18;

  for (const hit of ranked) {
    const codes = chunkCodes(hit.chunk).filter(c => query.codes.includes(c));
    const over = codes.every(code => (perCode.get(code) ?? 0) >= 2);
    if (over) continue;
    picked.push(hit);
    for (const code of codes) perCode.set(code, (perCode.get(code) ?? 0) + 1);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function rankWithQueryEmbedding(hits: RagHit[], queryEmbedding: number[]): RagHit[] {
  return hits
    .map(h => ({
      ...h,
      score: h.chunk.embedding?.length ? cosine(h.chunk.embedding, queryEmbedding) : h.score,
    }))
    .sort((a, b) => b.score - a.score);
}

export function formatRagForPrompt(hits: RagHit[]): string {
  if (!hits.length) return "(해당 활성 항목에 대해 유효한 규정 청크가 없습니다. 판정은 하되 근거 없음 = 미검증 표시.)";
  return hits
    .map((h, i) => {
      const c = h.chunk;
      const codes = chunkCodes(c).join(", ");
      return `[#${i + 1} chunk_id=${c.chunk_id} | ${c.source_type} | ${codes}]
제목: ${c.source_title}
출처: ${c.source_ref}
내용: ${c.text}`;
    })
    .join("\n\n");
}
