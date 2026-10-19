export type HiddenTier = "strict" | "contextual";
export type DictSeverity = "LOW" | "CAUTION" | "HIGH" | "CRITICAL";
export type HiddenVerdict = "high" | "med" | "unverified" | "low";

export interface CharCell {
  ch: string;
  line: number;
  col: number;
  emphasis?: boolean;
}

export interface ReadPath {
  id: string;
  desc: string;
  cells: CharCell[];
  text: string;
}

export interface LayoutChar {
  ch: string;
  line: number;
  col: number;
  color?: string;
  bold?: boolean;
  size?: number;
  underline?: boolean;
  italic?: boolean;
}

export interface DictEntry {
  term: string;
  ids: string[];
  severity: DictSeverity;
  tier: HiddenTier;
}

export interface PatternHit {
  key: string;
  start: number;
  end: number;
  entry: DictEntry;
}

export interface HiddenCandidate {
  term: string;
  matchedIds: string[];
  pathId: string;
  pathDesc: string;
  positions: { line: number; col: number; ch: string }[];
  extracted: string;
  normalization: string;
  codeScore: number;
  verdict: HiddenVerdict;
  tier: HiddenTier;
  dictSeverity: DictSeverity;
  fullPath: boolean;
  emphasized: boolean;
}

export interface AllowItem {
  text: string;
  blocks: string[];
  note?: string;
}

export interface HiddenScanResult {
  candidates: HiddenCandidate[];
  notes: string[];
  elapsedMs: number;
}

export interface HiddenJudgment {
  term: string;
  path_id: string;
  verdict: HiddenVerdict;
  intent_likelihood: number;
  unnatural?: boolean;
  reason: string;
  fix?: string;
}

export interface OpenSearchProposal {
  rule: string;
  positions: [number, number][];
  result: string;
}
