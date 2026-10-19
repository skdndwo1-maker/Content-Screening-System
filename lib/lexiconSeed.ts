import type { LexCategory } from "./types";
import termsDoc from "@/data/lexicon/contentguard_terms.json";
import rulesDoc from "@/data/lexicon/contentguard_rules.json";

export const LEXICON_SEED: Record<LexCategory, object> = {
  terms: termsDoc,
  rules: rulesDoc,
  sources: {
    naver_window_years: 10,
    grok_surge_threshold_pct: 200,
    models: { primary: ["claude-opus-4-7", "gemini-2.5-pro"], fallback: ["gpt-4.1"] },
    prefer_higher_risk: true,
    update_policy: "weekly",
  },
};

export function seedPayload(tab: LexCategory): string {
  return JSON.stringify(LEXICON_SEED[tab], null, 2);
}

export function nextLexTag(tags: string[]): string {
  const nums = tags.map(t => {
    const m = t.trim().match(/^v(\d+)$/i);
    return m ? Number(m[1]) : 0;
  });
  return `v${Math.max(0, ...nums) + 1}`;
}

export function normalizeLexTag(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^\d+$/.test(t)) return `v${t}`;
  return t;
}

export function formatLexStamp(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
