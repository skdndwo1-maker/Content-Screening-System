import { GoogleGenAI, ThinkingLevel, type GenerateContentResponse } from "@google/genai";

export function geminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "your_api_key_here") return null;
  return key;
}

export function grokConfigured(): boolean {
  return Boolean(process.env.GROK_API_KEY || process.env.XAI_API_KEY);
}

export function naverConfigured(): boolean {
  return Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);
}

export function thinkingLevel(): ThinkingLevel {
  const raw = (process.env.GEMINI_THINKING_LEVEL || "medium").toLowerCase();
  if (raw === "low") return ThinkingLevel.LOW;
  if (raw === "high") return ThinkingLevel.HIGH;
  return ThinkingLevel.MEDIUM;
}

export function primaryModel(): string {
  return process.env.GEMINI_MODEL || "gemini-3.8-flash";
}

export function fallbackModels(): string[] {
  const csv = process.env.GEMINI_MODEL_FALLBACKS || "";
  return csv
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

export function embeddingModel(): string {
  return process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
}

export function reviewModel(): string | null {
  const m = process.env.GEMINI_REVIEW_MODEL;
  return m && m.trim() ? m.trim() : null;
}

export function searchModelName(): string {
  const m = process.env.GEMINI_SEARCH_MODEL;
  return m && m.trim() ? m.trim() : primaryModel();
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function errCode(e: unknown): number | null {
  const msg = e instanceof Error ? e.message : String(e);
  const m = msg.match(/"code"\s*:\s*(\d+)/);
  if (m) return Number(m[1]);
  if (/high demand|unavailable|overloaded|resource.?exhausted|try again/i.test(msg)) return 503;
  if (/\b429\b/.test(msg)) return 429;
  return null;
}

export function shortError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  try {
    const parsed = JSON.parse(msg);
    const inner = parsed?.error?.message ?? parsed?.message;
    if (inner) return typeof inner === "string" ? inner : JSON.stringify(inner);
  } catch {}
  return msg.length > 400 ? msg.slice(0, 400) + "…" : msg;
}

export interface ImagePart {
  mimeType: string;
  data: string;
}

export interface GenerateJsonInput {
  model: string;
  system: string;
  user: string;
  schema: unknown;
  images?: ImagePart[];
  temperature?: number;
}

export interface GenerateJsonResult {
  text: string;
  model: string;
  usage?: { input?: number; output?: number; total?: number };
  ms: number;
}

function client(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

async function callOnce(ai: GoogleGenAI, input: GenerateJsonInput, withThinking: boolean) {
  const contents =
    input.images?.length
      ? [
          {
            role: "user" as const,
            parts: [
              { text: input.user },
              ...input.images.map(img => ({
                inlineData: { mimeType: img.mimeType, data: img.data },
              })),
            ],
          },
        ]
      : input.user;

  return ai.models.generateContent({
    model: input.model,
    contents,
    config: {
      systemInstruction: input.system,
      responseMimeType: "application/json",
      responseSchema: input.schema as never,
      temperature: input.temperature ?? 0.2,
      ...(withThinking ? { thinkingConfig: { thinkingLevel: thinkingLevel() } } : {}),
    },
  });
}

function usageOf(res: GenerateContentResponse) {
  const u = res.usageMetadata;
  if (!u) return undefined;
  return {
    input: u.promptTokenCount,
    output: u.candidatesTokenCount,
    total: u.totalTokenCount,
  };
}

export async function generateJson(input: GenerateJsonInput): Promise<GenerateJsonResult> {
  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY 가 .env 에 설정되지 않았습니다.");
  const ai = client(apiKey);
  const started = Date.now();
  let lastErr: unknown;
  for (let i = 0; i < 5; i++) {
    try {
      const res = await callOnce(ai, input, i === 0);
      const text = res.text ?? "";
      const ms = Date.now() - started;
      const usage = usageOf(res);
      console.info("[gemini]", {
        model: input.model,
        ms,
        tokens: usage,
      });
      return { text, model: input.model, usage, ms };
    } catch (e) {
      lastErr = e;
      const code = errCode(e);
      const msg = shortError(e);
      const thinkingUnsupported = /thinking/i.test(msg);
      if (thinkingUnsupported && i === 0) continue;
      if ((code === 503 || code === 429) && i < 4) {
        await sleep(Math.min(12000, 2000 * 2 ** i));
        continue;
      }
      break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(shortError(lastErr));
}

export async function generateJsonWithFallback(
  input: Omit<GenerateJsonInput, "model"> & { models?: string[] }
): Promise<GenerateJsonResult> {
  const models = input.models?.length ? input.models : [primaryModel(), ...fallbackModels()].filter((v, i, a) => a.indexOf(v) === i);
  const attempts: { model: string; error: string }[] = [];
  for (const model of models) {
    try {
      return await generateJson({ ...input, model });
    } catch (e) {
      const code = errCode(e);
      attempts.push({ model, error: shortError(e) });
      if (code === 404 || code === 429 || code === 503) continue;
      if (models.indexOf(model) === models.length - 1) break;
    }
  }
  throw new Error(`모든 모델이 실패했습니다. 시도: ${attempts.map(a => `${a.model}(${a.error.slice(0, 80)})`).join(" / ")}`);
}

export interface GroundingChunk {
  title?: string;
  uri?: string;
}

export interface GroundingSupport {
  text: string;
  chunkIndices: number[];
}

export interface GenerateSearchResult {
  text: string;
  model: string;
  queries: string[];
  chunks: GroundingChunk[];
  supports: GroundingSupport[];
  entryPointHtml?: string;
  usage?: { input?: number; output?: number; total?: number };
  ms: number;
}

export async function generateSearch(prompt: string, model?: string): Promise<GenerateSearchResult> {
  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY 가 .env 에 설정되지 않았습니다.");
  const used = model || searchModelName();
  const ai = client(apiKey);
  const started = Date.now();
  let lastErr: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await ai.models.generateContent({
        model: used,
        contents: prompt,
        config: {
          temperature: 0.2,
          tools: [{ googleSearch: {} }],
        },
      });
      const cand = res.candidates?.[0];
      const meta = cand?.groundingMetadata;
      const chunks = (meta?.groundingChunks ?? [])
        .map(c => ({ title: c.web?.title, uri: c.web?.uri }))
        .filter(c => c.uri);
      const supports = (meta?.groundingSupports ?? [])
        .filter(s => (s.groundingChunkIndices?.length ?? 0) > 0)
        .map(s => ({
          text: (s.segment?.text || "").trim(),
          chunkIndices: s.groundingChunkIndices ?? [],
        }))
        .filter(s => s.text);
      const ms = Date.now() - started;
      const usage = usageOf(res);
      console.info("[gemini-search]", {
        model: used,
        ms,
        tokens: usage,
        queries: meta?.webSearchQueries,
        links: chunks.length,
      });
      return {
        text: res.text ?? "",
        model: used,
        queries: meta?.webSearchQueries ?? [],
        chunks,
        supports,
        entryPointHtml: meta?.searchEntryPoint?.renderedContent,
        usage,
        ms,
      };
    } catch (e) {
      lastErr = e;
      const code = errCode(e);
      if ((code === 503 || code === 429) && i < 2) {
        await sleep(Math.min(8000, 1500 * 2 ** i));
        continue;
      }
      if (code && code >= 400 && code < 500 && code !== 429) break;
      break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(shortError(lastErr));
}

export async function embedTexts(texts: string[]): Promise<{ vectors: number[][]; model: string }> {
  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY 가 .env 에 설정되지 않았습니다.");
  const ai = client(apiKey);
  const model = embeddingModel();
  const res = await ai.models.embedContent({
    model,
    contents: texts,
  });
  const vectors = (res.embeddings ?? []).map(e => e.values ?? []);
  return { vectors, model };
}
