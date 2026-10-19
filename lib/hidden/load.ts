import fs from "node:fs";
import path from "node:path";
import type { RulesDoc } from "./engine";
import type { TermsDoc } from "./dictionary";

const DIR = path.join(process.cwd(), "data", "lexicon");

let fileTerms: TermsDoc | null = null;
let fileRules: RulesDoc | null = null;

function readJson<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(DIR, name), "utf8")) as T;
}

export function loadFileTerms(): TermsDoc {
  fileTerms ??= readJson<TermsDoc>("contentguard_terms.json");
  return fileTerms;
}

export function loadFileRules(): RulesDoc {
  fileRules ??= readJson<RulesDoc>("contentguard_rules.json");
  return fileRules;
}

export function parseTermsPayload(raw?: string | null): TermsDoc {
  if (!raw?.trim()) return loadFileTerms();
  try {
    const doc = JSON.parse(raw) as TermsDoc;
    if (doc.hidden_scan || doc.terms_by_group) return doc;
  } catch {
    /* fall through */
  }
  return loadFileTerms();
}

export function parseRulesPayload(raw?: string | null): RulesDoc {
  if (!raw?.trim()) return loadFileRules();
  try {
    const doc = JSON.parse(raw) as RulesDoc;
    if (doc["02_hidden_text_detection"]) return doc;
  } catch {
    /* fall through */
  }
  return loadFileRules();
}

export function formatRulesForPrompt(rules: Record<string, unknown>): string {
  const keys = Object.keys(rules)
    .filter(k => /^\d{2}_/.test(k))
    .sort();
  const parts: string[] = [];
  for (const key of keys) {
    const val = rules[key];
    if (key === "06_pattern_rules" && val && typeof val === "object") {
      const obj = val as { meta_rule?: string; patterns?: { id?: string; pattern?: string; agent_instruction?: string }[] };
      parts.push(
        `### ${key}\n${obj.meta_rule ?? ""}\n${(obj.patterns ?? [])
          .slice(0, 24)
          .map(p => `- ${p.id}: ${p.pattern} — ${p.agent_instruction ?? ""}`)
          .join("\n")}`
      );
      continue;
    }
    if (key === "08_review_criteria" && val && typeof val === "object") {
      const common = (val as { common?: { core_stance?: string[]; pipeline?: { step?: string; desc?: string }[] } }).common;
      parts.push(
        `### ${key}\n${(common?.core_stance ?? []).join("\n")}\n${(common?.pipeline ?? [])
          .map(s => `- ${s.step}: ${s.desc}`)
          .join("\n")}`
      );
      continue;
    }
    if (key === "02_hidden_text_detection" && val && typeof val === "object") {
      const h = val as {
        purpose?: string;
        division_of_labor?: unknown;
        ai_judgment_prompt?: string[];
        ai_open_search?: unknown;
      };
      parts.push(
        `### ${key}\n${h.purpose ?? ""}\n분업: ${JSON.stringify(h.division_of_labor)}\n판단 지침:\n${(h.ai_judgment_prompt ?? []).map(s => `- ${s}`).join("\n")}\nopen_search: ${JSON.stringify(h.ai_open_search)}`
      );
      continue;
    }
    parts.push(`### ${key}\n${JSON.stringify(val, null, 2)}`);
  }
  return parts.join("\n\n");
}
