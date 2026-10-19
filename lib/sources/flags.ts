import type { ExternalSourceId, ExternalSourceState, SourceFlags } from "@/lib/types";

function envOn(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return raw === "true" || raw === "1";
}

export function grokEnabled(): boolean {
  return envOn("GROK_ENABLED", false);
}

export function naverEnabled(): boolean {
  return envOn("NAVER_ENABLED", false);
}

export function searchEnabled(): boolean {
  return envOn("GEMINI_SEARCH_ENABLED", true);
}

export function searchModel(): string {
  return (process.env.GEMINI_SEARCH_MODEL || "").trim();
}

export function searchMaxQueries(): number {
  const n = Number(process.env.GEMINI_SEARCH_MAX_QUERIES);
  return Number.isFinite(n) && n > 0 ? Math.min(8, Math.floor(n)) : 3;
}

export function searchMaxLinks(): number {
  const n = Number(process.env.GEMINI_SEARCH_MAX_LINKS);
  return Number.isFinite(n) && n > 0 ? Math.min(12, Math.floor(n)) : 5;
}

export function searchCallBudget(): number {
  return 10;
}

export function externalTimeoutMs(): number {
  const n = Number(process.env.EXTERNAL_SOURCE_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 1000 ? Math.floor(n) : 20000;
}

export function sourceFlags(): SourceFlags {
  return {
    grok: grokEnabled(),
    naver: naverEnabled(),
    websearch: searchEnabled(),
  };
}

export function initialSourceStates(flags: SourceFlags): Record<ExternalSourceId, ExternalSourceState> {
  return {
    websearch: flags.websearch ? "pending" : "disabled",
    grok: flags.grok ? "pending" : "disabled",
    naver: flags.naver ? "pending" : "disabled",
  };
}
