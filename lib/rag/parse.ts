import type { KnowledgeChunk } from "./types";
import type { TaxonomyChannel, UploadTab } from "@/lib/types";

function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseScalar(raw: string): string | string[] | null {
  const v = raw.trim();
  if (!v || v === "null" || v === "~") return null;
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map(s => stripQuotes(s.trim()))
      .filter(Boolean);
  }
  return stripQuotes(v);
}

function parseFrontmatter(block: string): Record<string, string | string[] | null> {
  const out: Record<string, string | string[] | null> = {};
  for (const line of block.split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    if (!key) continue;
    out[key] = parseScalar(line.slice(idx + 1));
  }
  return out;
}

function asList(v: string | string[] | null | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function asString(v: string | string[] | null | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? v.join(", ") : v;
}

export function parseKnowledgeMarkdown(raw: string, ingestedAt: string): KnowledgeChunk[] {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) return [];

  const parts = text.split(/\n---\n/g);
  const chunks: KnowledgeChunk[] = [];

  // Format: --- \n fm \n --- \n body  (optionally repeated)
  let i = 0;
  if (parts[0].trim() === "") i = 1;

  while (i < parts.length) {
    const fmRaw = parts[i] ?? "";
    const body = parts[i + 1] ?? "";
    const fm = parseFrontmatter(fmRaw);
    const id = asString(fm.chunk_id);
    if (id) {
      const sub = fm.sub_code;
      chunks.push({
        chunk_id: id,
        category_group: asString(fm.category_group),
        sub_code: Array.isArray(sub) ? sub : asString(sub),
        source_type: asString(fm.source_type) || "guideline",
        source_title: asString(fm.source_title),
        source_ref: asString(fm.source_ref),
        severity_default: asString(fm.severity_default) || "caution",
        applies_to: asList(fm.applies_to) as UploadTab[],
        channel: asList(fm.channel) as TaxonomyChannel[],
        effective_from: asString(fm.effective_from) || "2020-01-01",
        effective_to: asString(fm.effective_to) || null,
        ingested_at: ingestedAt,
        text: body.trim(),
      });
    }
    i += 2;
  }
  return chunks;
}

export function chunkCodes(chunk: KnowledgeChunk): string[] {
  return (Array.isArray(chunk.sub_code) ? chunk.sub_code : [chunk.sub_code]).filter(Boolean);
}

export function isChunkEffective(chunk: KnowledgeChunk, publishDate?: string): boolean {
  const day = publishDate || new Date().toISOString().slice(0, 10);
  if (chunk.effective_from && day < chunk.effective_from) return false;
  if (chunk.effective_to && day > chunk.effective_to) return false;
  return true;
}
