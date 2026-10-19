import { AhoCorasick } from "./automaton";
import { choseongOf, hangulToQwerty, reverseText, similarSyllableVariants, toJamo } from "./hangul";
import type { AllowItem, DictEntry, DictSeverity, HiddenTier } from "./types";

export interface TermsDoc {
  hidden_scan?: {
    strict?: { term: string; ids?: string[]; severity?: string }[];
    contextual?: { term: string; ids?: string[]; severity?: string }[];
  };
  terms_by_group?: Record<
    string,
    {
      terms?: {
        id?: string;
        signal?: string;
        severity?: string;
        match_keys?: Partial<Record<"ko" | "choseong" | "latin" | "numeric", string[]>>;
      }[];
    }
  >;
  allow_list?: AllowItem[];
}

function asSeverity(v: string | undefined): DictSeverity {
  if (v === "CRITICAL" || v === "HIGH" || v === "CAUTION" || v === "LOW") return v;
  return "HIGH";
}

export function collectEntries(doc: TermsDoc): { entries: DictEntry[]; allow: AllowItem[] } {
  const entries: DictEntry[] = [];
  const seen = new Set<string>();

  const push = (term: string, ids: string[], severity: DictSeverity, tier: HiddenTier) => {
    const t = term.trim();
    if (!t) return;
    const sig = `${tier}:${t}`;
    if (seen.has(sig)) return;
    seen.add(sig);
    entries.push({ term: t, ids, severity, tier });
  };

  for (const row of doc.hidden_scan?.strict ?? []) {
    push(row.term, row.ids ?? [], asSeverity(row.severity), "strict");
  }
  for (const row of doc.hidden_scan?.contextual ?? []) {
    push(row.term, row.ids ?? [], asSeverity(row.severity), "contextual");
  }

  for (const group of Object.values(doc.terms_by_group ?? {})) {
    for (const term of group.terms ?? []) {
      const ids = term.id ? [term.id] : [];
      const severity = asSeverity(term.severity);
      if (term.signal) push(term.signal, ids, severity, "strict");
      for (const key of term.match_keys?.ko ?? []) push(key, ids, severity, "strict");
    }
  }

  return { entries, allow: doc.allow_list ?? [] };
}

export function expandKeys(entry: DictEntry): string[] {
  const keys = new Set<string>();
  const base = entry.term;
  keys.add(base);
  keys.add(reverseText(base));
  const cho = choseongOf(base);
  if (cho) keys.add(cho);
  const jamo = toJamo(base);
  if (jamo && jamo !== base) keys.add(jamo);
  const q = hangulToQwerty(base);
  if (q && q !== base) keys.add(q);
  for (const v of similarSyllableVariants(base)) keys.add(v);
  return [...keys];
}

export function extraMatchKeys(doc: TermsDoc): { key: string; entry: DictEntry }[] {
  const extra: { key: string; entry: DictEntry }[] = [];
  for (const group of Object.values(doc.terms_by_group ?? {})) {
    for (const term of group.terms ?? []) {
      const entry: DictEntry = {
        term: term.signal || term.id || "",
        ids: term.id ? [term.id] : [],
        severity: asSeverity(term.severity),
        tier: "strict",
      };
      if (!entry.term) continue;
      for (const k of [...(term.match_keys?.ko ?? []), ...(term.match_keys?.choseong ?? []), ...(term.match_keys?.latin ?? []), ...(term.match_keys?.numeric ?? [])]) {
        extra.push({ key: k, entry: { ...entry, term: term.signal || k } });
      }
    }
  }
  return extra;
}

export interface HiddenIndex {
  ac: AhoCorasick;
  allow: AllowItem[];
  exact: Map<string, DictEntry>;
  hash: string;
}

const cache = new Map<string, HiddenIndex>();

export function hashPayload(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function buildIndex(doc: TermsDoc, hash = ""): HiddenIndex {
  const hit = hash && cache.get(hash);
  if (hit) return hit;

  const { entries, allow } = collectEntries(doc);
  const ac = new AhoCorasick();
  const added = new Set<string>();
  const put = (key: string, entry: DictEntry) => {
    const sig = `${key}::${entry.term}::${entry.tier}`;
    if (!key || added.has(sig)) return;
    added.add(sig);
    ac.add(key, entry);
  };

  for (const entry of entries) {
    for (const key of expandKeys(entry)) put(key, entry);
  }
  for (const { key, entry } of extraMatchKeys(doc)) put(key, entry);

  ac.build();
  const exact = new Map<string, DictEntry>();
  for (const entry of entries) exact.set(entry.term, entry);
  const index = { ac, allow, exact, hash };
  if (hash) cache.set(hash, index);
  return index;
}
