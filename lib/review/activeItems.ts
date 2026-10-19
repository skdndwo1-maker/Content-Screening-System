import electionCalendar from "@/data/election-calendar.json";
import { defaultCriteriaGroups } from "@/lib/criteria";
import { itemAppliesToTab } from "@/lib/taxonomy";
import { grokConfigured, naverConfigured } from "@/lib/llm/gemini";
import { grokEnabled, naverEnabled, sourceFlags } from "@/lib/sources/flags";
import type { CriteriaItem, UploadTab } from "@/lib/types";

export interface ActiveItem {
  group: string;
  item: CriteriaItem;
}

function inElectionWindow(date: string): boolean {
  if (!date) return false;
  return electionCalendar.windows.some(w => date >= w.from && date <= w.to);
}

export function resolveActiveItems(input: {
  tab: UploadTab;
  enabledCriteria: Record<string, Record<string, boolean>>;
  publishDate?: string;
  channels: string[];
}): ActiveItem[] {
  const { tab, enabledCriteria, publishDate } = input;
  const out: ActiveItem[] = [];

  for (const g of defaultCriteriaGroups) {
    for (const item of g.items) {
      if (!itemAppliesToTab(item, tab)) continue;
      const on = enabledCriteria[g.g]?.[item.k];
      if (!on) continue;

      if (g.g === "timing_risk" && !publishDate) continue;
      if (item.k === "ELECTION_PERIOD" && !inElectionWindow(publishDate || "")) continue;

      out.push({ group: g.g, item });
    }
  }
  return out;
}

export function externalSourceFlags() {
  return {
    grok: grokEnabled() ? (grokConfigured() ? ("ok" as const) : ("unconfigured" as const)) : ("disabled" as const),
    naver: naverEnabled() ? (naverConfigured() ? ("ok" as const) : ("unconfigured" as const)) : ("disabled" as const),
    flags: sourceFlags(),
  };
}
