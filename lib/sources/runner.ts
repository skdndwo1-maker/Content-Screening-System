import type { ExternalSourceId, ExternalSourceState } from "@/lib/types";
import { externalTimeoutMs } from "./flags";
import { grokProvider } from "./grok";
import { naverProvider } from "./naver";
import type { ExternalSourceProvider, SourceResult, SourceRunCtx } from "./types";
import { webSearchProvider } from "./websearch";

export const providers: Record<ExternalSourceId, ExternalSourceProvider> = {
  websearch: webSearchProvider,
  grok: grokProvider,
  naver: naverProvider,
};

function labelOf(id: ExternalSourceId): string {
  if (id === "websearch") return "웹 검색";
  if (id === "grok") return "Grok";
  return "Naver";
}

function statusNote(id: ExternalSourceId, status: ExternalSourceState): string | undefined {
  if (status === "timeout") return `${labelOf(id)}(시간 초과)`;
  if (status === "error") return `${labelOf(id)}(오류)`;
  return undefined;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      const err = new Error("timeout");
      (err as Error & { code: string }).code = "timeout";
      reject(err);
    }, ms);
    p.then(
      v => {
        clearTimeout(t);
        resolve(v);
      },
      e => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export async function runSource(id: ExternalSourceId, ctx: SourceRunCtx): Promise<SourceResult> {
  const provider = providers[id];
  if (!provider.enabled()) {
    return { id, status: "disabled" };
  }
  try {
    const result = await withTimeout(provider.run(ctx, new AbortController().signal), externalTimeoutMs());
    return {
      ...result,
      note: result.note || statusNote(id, result.status),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const timeout = msg === "timeout" || (e as { code?: string })?.code === "timeout";
    return {
      id,
      status: timeout ? "timeout" : "error",
      error: timeout ? "응답 지연으로 확인하지 못했습니다." : msg,
      note: statusNote(id, timeout ? "timeout" : "error"),
    };
  }
}
