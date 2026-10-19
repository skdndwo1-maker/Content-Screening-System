import taxonomyJson from "@/data/taxonomy.json";
import type {
  CriteriaGroup,
  CriteriaGroupCode,
  CriteriaItem,
  Grade,
  TaxonomyChannel,
  UploadTab,
} from "./types";

export const DEFAULT_CHANNEL_WEIGHTS: Record<TaxonomyChannel, number> = {
  TV: 1,
  SNS: 1,
  OOH: 1,
  APP_PUSH: 1,
  WEB: 1,
};

export interface TaxonomyItemDef {
  code: string;
  name_ko: string;
  name_en: string;
  description: string;
  applies_to: UploadTab[];
  default_on: boolean;
  severity_cap: Grade | null;
  rag_required: boolean;
  channel_weights?: Partial<Record<TaxonomyChannel, number>>;
}

export interface TaxonomyGroupDef {
  code: string;
  g: CriteriaGroupCode;
  name_ko: string;
  name_en: string;
  note: string;
  items: TaxonomyItemDef[];
}

const groups = taxonomyJson.groups as TaxonomyGroupDef[];

export const taxonomyGroups = groups;

const itemByCode = new Map(groups.flatMap(g => g.items.map(i => [i.code, { ...i, group: g.code, g: g.g }])));

export function getTaxonomyItem(code: string) {
  return itemByCode.get(normalizeCriteriaCode(code));
}

const LEGACY_CODES: Record<string, string> = {
  hate: "HATE",
  discrimination: "DISCRIMINATION",
  profanity: "PROFANITY",
  social_issue: "SOCIAL_ISSUE",
  community_signal: "COMMUNITY_SIGNAL",
  minor: "MINOR",
  stereotype: "STEREOTYPE",
  ad_law: "AD_LAW",
  privacy: "PRIVACY",
  defamation: "DEFAMATION",
  copyright: "COPYRIGHT",
  disclosure: "DISCLOSURE",
  ad_disclosure: "AD_DISCLOSURE",
  ai_disclosure: "AI_GENERATED_LABEL",
  dark_pattern: "DARK_PATTERN",
  memorial_conflict: "MEMORIAL_CONFLICT",
  timing_appropriateness: "TIMING_APPROPRIATENESS",
};

export function normalizeCriteriaCode(code: string): string {
  if (!code) return code;
  const trimmed = code.trim();
  return LEGACY_CODES[trimmed] || trimmed.toUpperCase().replace(/\s+/g, "_");
}

export function toCriteriaGroups(): CriteriaGroup[] {
  return groups.map(g => ({
    g: g.g,
    ko: g.name_ko,
    en: g.name_en,
    note: g.note,
    items: g.items.map(
      (i): CriteriaItem => ({
        k: i.code,
        ko: i.name_ko,
        en: i.name_en,
        desc: i.description,
        appliesTo: i.applies_to,
        defaultOn: i.default_on,
        severityCap: i.severity_cap,
        ragRequired: i.rag_required,
        channelWeights: i.channel_weights,
        groupCode: g.code,
      })
    ),
  }));
}

export const UI_CHANNEL_MAP: Record<string, TaxonomyChannel> = {
  인스타그램: "SNS",
  유튜브: "SNS",
  X: "SNS",
  페이스북: "SNS",
  Naver: "WEB",
  RCS: "APP_PUSH",
  MMS: "APP_PUSH",
  "자사 웹·앱": "WEB",
  "오프라인·옥외": "OOH",
  "TV·라디오": "TV",
  기타: "WEB",
};

export function mapUiChannels(channels: string[]): TaxonomyChannel[] {
  const mapped = channels.map(c => UI_CHANNEL_MAP[c] || "WEB");
  return Array.from(new Set(mapped));
}

export function maxChannelWeight(item: TaxonomyItemDef | undefined, channels: TaxonomyChannel[]): number {
  if (!item) return 1;
  const weights = { ...DEFAULT_CHANNEL_WEIGHTS, ...item.channel_weights };
  if (channels.length === 0) return 1;
  return Math.max(...channels.map(c => weights[c] ?? 1));
}

export function itemAppliesToTab(item: { appliesTo?: UploadTab[] }, tab: UploadTab): boolean {
  if (!item.appliesTo?.length) return true;
  return item.appliesTo.includes(tab);
}
