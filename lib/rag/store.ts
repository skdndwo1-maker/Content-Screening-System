import fs from "node:fs";
import path from "node:path";
import { parseKnowledgeMarkdown } from "./parse";
import type { KnowledgeChunk } from "./types";

const INDEX_REL = ["data", "rag", "index.json"];
const KNOWLEDGE_REL = ["knowledge"];

export function knowledgeDir(): string {
  return path.join(process.cwd(), ...KNOWLEDGE_REL);
}

export function indexPath(): string {
  return path.join(process.cwd(), ...INDEX_REL);
}

export interface RagIndexFile {
  embedding_model: string | null;
  ingested_at: string;
  chunks: KnowledgeChunk[];
}

function readMarkdownSources(): KnowledgeChunk[] {
  const dir = knowledgeDir();
  if (!fs.existsSync(dir)) return [];
  const ingestedAt = new Date().toISOString().slice(0, 10);
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));
  return files.flatMap(f => {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    return parseKnowledgeMarkdown(raw, ingestedAt);
  });
}

function readIndex(): RagIndexFile | null {
  const p = indexPath();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as RagIndexFile;
  } catch {
    return null;
  }
}

/** Prefer embedded index; always fall back to live markdown so review never misses new sources. */
export function loadChunks(): { chunks: KnowledgeChunk[]; embeddingModel: string | null } {
  const live = readMarkdownSources();
  const idx = readIndex();
  if (!idx?.chunks?.length) return { chunks: live, embeddingModel: null };

  const byId = new Map(idx.chunks.map(c => [c.chunk_id, c]));
  const merged = live.map(c => {
    const prev = byId.get(c.chunk_id);
    if (prev?.embedding?.length) {
      return { ...c, embedding: prev.embedding, embedding_model: prev.embedding_model };
    }
    return c;
  });
  return { chunks: merged, embeddingModel: idx.embedding_model };
}

export function writeIndex(file: RagIndexFile) {
  const p = indexPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(file, null, 2), "utf8");
}
