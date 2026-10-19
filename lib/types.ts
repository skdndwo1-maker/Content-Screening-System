export type Screen = "upload" | "analysis" | "report" | "history" | "admin";
export type Role = "user" | "admin";
export type UploadTab = "naming" | "text" | "image";
export type Grade = "high" | "med" | "unverified" | "low";
export type PipeStage = "pending" | "active" | "done" | "fail" | "empty";
export type SourceKey = "grok" | "naver" | "wiki" | "websearch";
export type SourceStatus = "ok" | "empty" | "fail";
export type ExternalSourceId = "websearch" | "grok" | "naver";
export type ExternalSourceState = "pending" | "done" | "empty" | "timeout" | "error" | "disabled";
export type CriteriaGroupCode =
  | "expression_risk"
  | "compliance_risk"
  | "telecom_risk"
  | "ai_digital_risk"
  | "accessibility"
  | "timing_risk";
export type LexCategory = "terms" | "rules" | "sources";
export type ReviewRoute = "pass_manual" | "appeal_eligible" | "appeal_review" | "manual_request" | "blocked";
export type AdminStatus = "pending" | "appeal" | "done";
export type ReviewDecision = "approve" | "hold" | "reject" | "conditional";

export interface AppealFile {
  id: string;
  name: string;
  size: string;
  dataUrl?: string;
}

export interface ReviewSnapshot {
  uploadTab: UploadTab;
  textValue: string;
  namingRows: string[];
  files: PickedFile[];
  ctxName: string;
  ctxDate: string;
  ctxChannels: string[];
  ctxTargets: string[];
  ctxType: string;
  ctxIntent: string;
  findings: ReportFinding[];
  reviewMeta: ReviewMeta | null;
  sourceStates: Record<ExternalSourceId, ExternalSourceState>;
  sourceFlags?: SourceFlags;
  aiModel: string | null;
  reviewRoute: ReviewRoute;
  adminStatus: AdminStatus | null;
  appealNote: string;
  appealFiles: AppealFile[];
  appealSubmitted: boolean;
  adminRequested: boolean;
  adminFeedback: string;
  adminFiles: AppealFile[];
  decision: ReviewDecision | null;
  decisionNote: string;
  chainVersion: number;
  author: string;
}
export type TaxonomyChannel = "TV" | "SNS" | "OOH" | "APP_PUSH" | "WEB";
export type SourceType = "law" | "guideline" | "case" | "internal" | "feedback";

export interface CriteriaItem {
  k: string;
  ko: string;
  en: string;
  desc?: string;
  json?: string;
  appliesTo?: UploadTab[];
  defaultOn?: boolean;
  severityCap?: Grade | null;
  ragRequired?: boolean;
  channelWeights?: Partial<Record<TaxonomyChannel, number>>;
  groupCode?: string;
}
export interface CriteriaGroup {
  g: CriteriaGroupCode;
  ko: string;
  en: string;
  note?: string;
  items: CriteriaItem[];
}

export interface PickedFile {
  id: string;
  name: string;
  size: string;
  isImage: boolean;
  ext: string;
  url?: string;
  dataUrl?: string;
}

export interface LexVersion {
  tag: string;
  message: string;
  author: string;
  at: string;
  payload?: string;
}

export interface HistoryFilter {
  types: string[] | null;
  campaigns: string[] | null;
  risks: Grade[] | null;
  channels: string[] | null;
  authors: string[] | null;
  period: "all" | "7d" | "30d" | "3m" | "custom";
}

export interface RagCitation {
  chunk_id: string;
  source_type: SourceType | string;
  source_title: string;
  source_ref: string;
  verified: boolean;
}

export interface ReportFinding {
  id: string;
  category: string;
  categoryKo: string;
  contentType: "카피" | "텍스트" | "이미지" | "영상" | "네이밍";
  target: string;
  highlight?: string[];
  keywords: string[];
  grade: Grade;
  score: number;
  sources: ("ai" | "grok" | "naver" | "websearch")[];
  aiText: string;
  grok?: {
    posts: { snippet: string; date: string; mentions: number }[];
    trendPct: number;
    series?: number[];
  };
  naver?: {
    articles: { title: string; press: string; date: string; url: string }[];
  };
  webSearch?: WebSearchEvidence;
  rag?: RagCitation[];
  ragStatus?: "ok" | "unverified";
  adjustment?: { before: Grade; after: Grade; reason: string };
  alternatives?: { label: string; text: string }[];
  wholeContext?: boolean;
  evidenceChips?: string[];
  hiddenSignals?: HiddenSignal[];
}

export interface WebSearchLink {
  title: string;
  uri: string;
  domain: string;
}

export interface WebSearchSentence {
  text: string;
  cites: number[];
}

export interface WebSearchEvidence {
  status: ExternalSourceState;
  summary: WebSearchSentence[];
  links: WebSearchLink[];
  queries: string[];
  entryPointHtml?: string;
  error?: string;
}

export interface SourceFlags {
  grok: boolean;
  naver: boolean;
  websearch: boolean;
}

export interface HiddenSignal {
  term: string;
  matchedIds: string[];
  pathId: string;
  pathDesc: string;
  positions: { line: number; col: number; ch: string }[];
  extracted: string;
  normalization: string;
  codeScore: number;
  tier: "strict" | "contextual";
}

export interface ReviewOverall {
  summary: string;
  recommendation: string;
  actions: string[];
  reasons: string[];
}

export interface ReviewMeta {
  model: string | null;
  ragChunks: number;
  grok: "disabled" | "unconfigured" | "ok" | "fail";
  naver: "disabled" | "unconfigured" | "ok" | "fail";
  overall: ReviewOverall | null;
  sourceStates?: Record<ExternalSourceId, ExternalSourceState>;
  sourceFlags?: SourceFlags;
  unverifiedSources?: string[];
}

export interface HistoryRow {
  id: string;
  type: "카피" | "텍스트" | "이미지" | "영상" | "네이밍";
  campaign: string;
  publishDate: string;
  channels: string[];
  author: string;
  grade: Grade;
  score: number;
  reviewedAt: string;
  version: number;
  totalVersions: number;
  deletedAt?: string;
  sourceStates?: Record<ExternalSourceId, ExternalSourceState>;
  reviewRoute?: ReviewRoute;
  adminStatus?: AdminStatus;
  appealNote?: string;
  appealFiles?: AppealFile[];
  adminRequested?: boolean;
  adminFeedback?: string;
  adminFiles?: AppealFile[];
  decision?: ReviewDecision;
  decisionNote?: string;
  snapshot?: ReviewSnapshot;
}
