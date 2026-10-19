"use client";

import { create } from "zustand";
import { defaultCriteriaGroups } from "./criteria";
import { demoHistory, demoVersions } from "./demoData";
import { formatLexStamp, normalizeLexTag } from "./lexiconSeed";
import { loadHistory, saveHistory } from "./history";
import type {
  Screen,
  Role,
  UploadTab,
  PipeStage,
  SourceStatus,
  CriteriaGroup,
  PickedFile,
  LexCategory,
  HistoryFilter,
  ReportFinding,
  ReviewMeta,
  LexVersion,
  HistoryRow,
  ExternalSourceId,
  ExternalSourceState,
  SourceFlags,
  ReviewRoute,
  AdminStatus,
  AppealFile,
  ReviewDecision,
} from "./types";
import { routeOf } from "./review/routing";
import { buildSnapshot, freezeSources, snapshotFromRow } from "./review/snapshot";

interface State {
  screen: Screen;
  uploadTab: UploadTab;
  role: Role;

  criteria: Record<string, Record<string, boolean>>;
  critDefs: CriteriaGroup[];
  critOpen: Record<string, boolean>;
  critJsonOpen: Record<string, boolean>;
  critJsonDraft: Record<string, string>;

  files: PickedFile[];
  textValue: string;
  namingRows: string[];
  importing: boolean;
  importingLabel: string;
  importNote: string;
  importOcr: boolean;

  ctxName: string;
  ctxDate: string;
  ctxChannels: string[];
  ctxTargets: string[];
  ctxType: string;
  ctxIntent: string;
  ctxAuto: Record<string, boolean>;
  ctxDetailOpen: boolean;
  briefLoading: boolean;
  briefName: string;
  channelMenuOpen: boolean;
  channelList: string[];

  chainVersion: number;
  rescanMode: boolean;
  prevText: string;
  prevSummary: { version: string; grade: string; score: number; danger: number; caution: number } | null;

  pipeStatus: PipeStage[];
  liveTexts: string[];
  grokCount: number;
  naverCount: number;
  pipelineDone: boolean;
  sourceStatus: Record<"grok" | "naver" | "wiki", SourceStatus>;
  sourceFlags: SourceFlags;
  sourceStates: Record<ExternalSourceId, ExternalSourceState>;
  searchBump: string | null;
  reviewId: string | null;

  aiFindings: ReportFinding[] | null;
  aiError: string | null;
  aiLoading: boolean;
  aiModel: string | null;
  aiAttempted: boolean;
  reviewMeta: ReviewMeta | null;

  cardOpen: Record<string, boolean>;
  riskFilter: "all" | "high" | "med" | "unverified" | "low";
  fixChoice: Record<string, number>;
  actions: Record<string, { kind: "accept" | "reject" | "appeal"; reasonType?: string; reasonText?: string }>;
  rejectOpen: Record<string, boolean>;
  decision: ReviewDecision | null;
  decisionNote: string;
  reviewRoute: ReviewRoute;
  adminStatus: AdminStatus | null;
  appealNote: string;
  appealFiles: AppealFile[];
  appealSubmitted: boolean;
  adminRequested: boolean;
  adminFeedback: string;
  adminFiles: AppealFile[];
  viewingArchived: boolean;
  openedFrom: Screen | null;
  reviewAuthor: string;

  historyRows: HistoryRow[];
  histFilter: "all" | "copy" | "text" | "image";
  hf: HistoryFilter;
  dateRange: { from: string; to: string } | null;
  sortKey: "recent" | "upcoming" | "risk" | "name";
  chainOpen: Record<string, boolean>;
  adminFilter: "all" | "pending" | "appeal" | "done";

  lexiconOpen: boolean;
  lexTab: LexCategory;
  versions: Record<LexCategory, LexVersion[]>;
  selected: Record<LexCategory, string>;

  // actions
  setScreen: (s: Screen) => void;
  setRole: (r: Role) => void;
  setUploadTab: (t: UploadTab) => void;
  goHome: () => void;

  toggleCriterion: (g: string, k: string) => void;
  toggleGroupOpen: (g: string) => void;
  toggleGroupAll: (g: string) => void;

  setCtx: (patch: Partial<Pick<State, "ctxName" | "ctxDate" | "ctxType" | "ctxIntent" | "ctxDetailOpen">>) => void;
  toggleCtxChannel: (c: string) => void;
  toggleCtxTarget: (t: string) => void;
  setChannelMenu: (open: boolean) => void;

  setTextValue: (v: string) => void;
  updateNaming: (i: number, v: string) => void;
  addNaming: () => void;
  removeNaming: (i: number) => void;

  addFile: (f: PickedFile) => void;
  removeFile: (id: string) => void;

  startAnalysis: () => void;
  resetAnalysis: () => void;
  retryAI: () => void;
  retryExternalSource: (id: ExternalSourceId) => void;
  hydrateSourceFlags: () => void;
  gotoReport: () => void;

  toggleCard: (id: string) => void;
  setRiskFilter: (f: State["riskFilter"]) => void;
  openAllCards: (ids: string[], open: boolean) => void;
  setFixChoice: (id: string, i: number) => void;
  setDecision: (d: State["decision"]) => void;
  setDecisionNote: (s: string) => void;
  setAppealNote: (s: string) => void;
  addAppealFile: (f: AppealFile) => void;
  removeAppealFile: (id: string) => void;
  patchAppealFile: (id: string, patch: Partial<AppealFile>) => void;
  submitAppeal: () => boolean;
  requestAdminReview: () => boolean;
  setAdminFeedback: (s: string) => void;
  addAdminFile: (f: AppealFile) => void;
  removeAdminFile: (id: string) => void;
  patchAdminFile: (id: string, patch: Partial<AppealFile>) => void;
  resolveAdmin: (d: ReviewDecision) => boolean;
  openReview: (id: string, from?: Screen) => boolean;

  hydrateHistory: () => void;
  trashHistory: (id: string) => boolean;
  restoreHistory: (id: string) => boolean;
  purgeHistory: (id: string) => boolean;
  trashAllHistory: () => number;
  purgeAllTrash: () => number;
  setHistFilter: (f: State["histFilter"]) => void;
  setHf: <K extends keyof HistoryFilter>(key: K, v: HistoryFilter[K]) => void;
  clearHf: () => void;
  setSortKey: (k: State["sortKey"]) => void;
  toggleChainOpen: (id: string) => void;

  openLexicon: () => void;
  closeLexicon: () => void;
  setLexTab: (t: LexCategory) => void;
  deleteLexVersion: (tab: LexCategory, tag: string) => boolean;
  overwriteLexVersion: (tab: LexCategory, message: string, payload: string) => boolean;
  saveLexVersion: (tab: LexCategory, tag: string, message: string, payload: string) => string | null;
  applyLexVersion: (tab: LexCategory, tag: string) => boolean;

  rescanFromReport: () => void;
}

type Setter = (patch: Partial<State> | ((s: State) => Partial<State>)) => void;
type Getter = () => State;

let timers: ReturnType<typeof setTimeout>[] = [];
let intervals: ReturnType<typeof setInterval>[] = [];
const clearTimers = () => {
  timers.forEach(clearTimeout);
  intervals.forEach(clearInterval);
  timers = [];
  intervals = [];
};

const initialCriteria: State["criteria"] = Object.fromEntries(
  defaultCriteriaGroups.map(g => [
    g.g,
    Object.fromEntries(g.items.map(i => [i.k, Boolean(i.defaultOn)])),
  ])
);

function reviewBody(st: State) {
  const images = st.files
    .filter(f => f.isImage && f.dataUrl)
    .slice(0, 2)
    .flatMap(f => {
      const m = f.dataUrl!.match(/^data:([^;]+);base64,(.+)$/);
      return m ? [{ mimeType: m[1], data: m[2] }] : [];
    });
  return {
    textValue: st.textValue,
    namingRows: st.namingRows,
    ctx: {
      name: st.ctxName,
      date: st.ctxDate,
      channels: st.ctxChannels,
      targets: st.ctxTargets,
      type: st.ctxType,
      intent: st.ctxIntent,
    },
    enabledCriteria: st.criteria,
    uploadTab: st.uploadTab,
    images,
    termsJson: st.versions.terms.find(v => v.tag === st.selected.terms)?.payload,
    rulesJson: st.versions.rules.find(v => v.tag === st.selected.rules)?.payload,
  };
}

function sourceCtx(st: State) {
  return { name: st.ctxName, type: st.ctxType, date: st.ctxDate, channels: st.ctxChannels };
}

function applySourceResult(
  set: Setter,
  get: Getter,
  result: {
    id: ExternalSourceId;
    status: ExternalSourceState;
    findings?: ReportFinding[];
    note?: string;
  }
) {
  let bumped = false;
  set(st => {
    const sourceStates = { ...st.sourceStates, [result.id]: result.status };
    const findings = result.findings ?? st.aiFindings;
    const unverified = [...(st.reviewMeta?.unverifiedSources ?? [])];
    if (result.note && (result.status === "timeout" || result.status === "error") && !unverified.includes(result.note)) {
      unverified.push(result.note);
    }
    bumped = Boolean(result.findings?.some(f => f.adjustment?.reason?.includes("웹 검색 근거로 상향")));
    return {
      sourceStates,
      aiFindings: findings,
      reviewMeta: st.reviewMeta
        ? { ...st.reviewMeta, sourceStates, unverifiedSources: unverified.length ? unverified : st.reviewMeta.unverifiedSources }
        : st.reviewMeta,
      searchBump: bumped ? "웹 검색 근거로 상향됨" : st.searchBump,
    };
  });
  applyScoreRoute(set, get);
  syncHistoryFromReview(set, get);
  if (bumped) {
    timers.push(setTimeout(() => set({ searchBump: null }), 4200));
  }
}

function fetchExternalSource(id: ExternalSourceId, set: Setter, get: Getter) {
  set(st => ({ sourceStates: { ...st.sourceStates, [id]: st.sourceFlags[id] ? "pending" : "disabled" } }));
  const st = get();
  if (!st.sourceFlags[id]) {
    applySourceResult(set, get, { id, status: "disabled" });
    return;
  }
  fetch("/api/review/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: id, findings: st.aiFindings || [], ctx: sourceCtx(st) }),
  })
    .then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
      applySourceResult(set, get, data);
    })
    .catch(err => {
      applySourceResult(set, get, {
        id,
        status: "error",
        note: id === "websearch" ? "웹 검색(오류)" : id === "grok" ? "Grok(오류)" : "Naver(오류)",
      });
      console.info("[external-source]", id, err);
    });
}

function startExternalSources(set: Setter, get: Getter) {
  (["websearch", "grok", "naver"] as ExternalSourceId[]).forEach(id => fetchExternalSource(id, set, get));
}

function topOf(findings: ReportFinding[]): { grade: ReportFinding["grade"]; score: number } {
  if (!findings.length) return { grade: "low", score: 100 };
  return findings.reduce((a, b) => (a.score <= b.score ? a : b), findings[0]);
}

function syncHistoryFromReview(set: Setter, get: Getter) {
  const st = get();
  if (!st.reviewId || !st.aiFindings) return;
  const top = topOf(st.aiFindings);
  const type = st.uploadTab === "image" ? "이미지" : st.uploadTab === "naming" ? "네이밍" : "텍스트";
  const prev = st.historyRows.find(r => r.id === st.reviewId);
  const row: HistoryRow = {
    id: st.reviewId,
    type,
    campaign: st.ctxName || prev?.campaign || "제목 없음",
    publishDate: st.ctxDate || prev?.publishDate || "",
    channels: st.ctxChannels.length ? st.ctxChannels : prev?.channels || [],
    author: st.reviewAuthor || prev?.author || "주현",
    grade: top.grade,
    score: top.score,
    reviewedAt: st.viewingArchived && prev?.reviewedAt ? prev.reviewedAt : new Date().toISOString().slice(0, 16).replace("T", " "),
    version: Math.max(1, st.chainVersion),
    totalVersions: Math.max(prev?.totalVersions || 1, st.chainVersion),
    deletedAt: prev?.deletedAt,
    sourceStates: st.sourceStates,
    reviewRoute: st.reviewRoute,
    adminStatus: st.adminStatus ?? undefined,
    appealNote: st.appealNote || undefined,
    appealFiles: st.appealFiles.length ? st.appealFiles : undefined,
    adminRequested: st.adminRequested || undefined,
    adminFeedback: st.adminFeedback || undefined,
    adminFiles: st.adminFiles.length ? st.adminFiles : undefined,
    decision: st.decision ?? undefined,
    decisionNote: st.decisionNote || undefined,
    snapshot: buildSnapshot(st),
  };
  const next = [row, ...st.historyRows.filter(r => r.id !== st.reviewId)];
  saveHistory(next);
  set({ historyRows: next });
}

function applyScoreRoute(set: Setter, get: Getter) {
  const st = get();
  const score = st.aiFindings ? topOf(st.aiFindings).score : 100;
  const band = routeOf(score);
  const route: ReviewRoute = st.appealSubmitted
    ? "appeal_review"
    : st.adminRequested
      ? band === "pass_manual" ? "pass_manual" : "manual_request"
      : band;
  let adminStatus: AdminStatus | null = null;
  if (st.decision) adminStatus = "done";
  else if (st.appealSubmitted) adminStatus = "appeal";
  else if (st.adminRequested || band === "pass_manual") adminStatus = "pending";
  set({ reviewRoute: route, adminStatus });
}

export const useStore = create<State>((set: Setter, get: Getter) => ({
  screen: "upload",
  uploadTab: "image",
  role: "user",

  criteria: initialCriteria,
  critDefs: defaultCriteriaGroups,
  critOpen: {},
  critJsonOpen: {},
  critJsonDraft: {},

  files: [],
  textValue: "",
  namingRows: [""],
  importing: false,
  importingLabel: "",
  importNote: "",
  importOcr: false,

  ctxName: "",
  ctxDate: "",
  ctxChannels: [],
  ctxTargets: [],
  ctxType: "",
  ctxIntent: "",
  ctxAuto: {},
  ctxDetailOpen: false,
  briefLoading: false,
  briefName: "",
  channelMenuOpen: false,
  channelList: ["인스타그램", "유튜브", "X", "페이스북", "Naver", "RCS", "MMS", "자사 웹·앱", "오프라인·옥외", "TV·라디오", "기타"],

  chainVersion: 1,
  rescanMode: false,
  prevText: "",
  prevSummary: null,

  pipeStatus: ["pending", "pending", "pending", "pending"],
  liveTexts: ["", "", "", ""],
  grokCount: 0,
  naverCount: 0,
  pipelineDone: false,
  sourceStatus: { grok: "empty", naver: "empty", wiki: "empty" },
  sourceFlags: { grok: false, naver: false, websearch: true },
  sourceStates: { websearch: "disabled", grok: "disabled", naver: "disabled" },
  searchBump: null,
  reviewId: null,
  reviewRoute: "blocked",
  adminStatus: null,
  appealNote: "",
  appealFiles: [],
  appealSubmitted: false,
  adminRequested: false,
  adminFeedback: "",
  adminFiles: [],
  viewingArchived: false,
  openedFrom: null,
  reviewAuthor: "주현",

  aiFindings: null,
  aiError: null,
  aiLoading: false,
  aiModel: null,
  aiAttempted: false,
  reviewMeta: null,

  cardOpen: { f1: true },
  riskFilter: "all",
  fixChoice: {},
  actions: {},
  rejectOpen: {},
  decision: null,
  decisionNote: "",

  historyRows: demoHistory,
  histFilter: "all",
  hf: { types: null, campaigns: null, risks: null, channels: null, authors: null, period: "all" },
  dateRange: null,
  sortKey: "recent",
  chainOpen: {},
  adminFilter: "pending",

  lexiconOpen: false,
  lexTab: "terms",
  versions: demoVersions,
  selected: { terms: "v14", rules: "v3", sources: "v2" },

  setScreen: s => {
    if (s === "history" || s === "admin") {
      set({ screen: s, historyRows: loadHistory() });
      return;
    }
    set({ screen: s });
  },
  setRole: r =>
    set(st => ({
      role: r,
      screen: st.screen === "admin" && r === "user" ? "upload" : st.screen,
    })),
  setUploadTab: t => set({ uploadTab: t }),
  goHome: () => {
    clearTimers();
    set({ screen: "upload", viewingArchived: false, openedFrom: null });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  },

  toggleCriterion: (g, k) =>
    set(st => ({
      criteria: { ...st.criteria, [g]: { ...st.criteria[g], [k]: !st.criteria[g]?.[k] } },
    })),
  toggleGroupOpen: g => set(st => ({ critOpen: { ...st.critOpen, [g]: !st.critOpen[g] } })),
  toggleGroupAll: g =>
    set(st => {
      const items = st.criteria[g] || {};
      const allOn = Object.values(items).every(Boolean);
      const next = Object.fromEntries(Object.keys(items).map(k => [k, !allOn]));
      return { criteria: { ...st.criteria, [g]: next } };
    }),

  setCtx: patch => set(patch as Partial<State>),
  toggleCtxChannel: c =>
    set(st => ({
      ctxChannels: st.ctxChannels.includes(c) ? st.ctxChannels.filter(x => x !== c) : [...st.ctxChannels, c],
    })),
  toggleCtxTarget: t =>
    set(st => ({
      ctxTargets: st.ctxTargets.includes(t) ? st.ctxTargets.filter(x => x !== t) : [...st.ctxTargets, t],
    })),
  setChannelMenu: open => set({ channelMenuOpen: open }),

  setTextValue: v => set({ textValue: v }),
  updateNaming: (i, v) =>
    set(st => ({ namingRows: st.namingRows.map((r, idx) => (idx === i ? v : r)) })),
  addNaming: () => set(st => ({ namingRows: [...st.namingRows, ""] })),
  removeNaming: i =>
    set(st => ({ namingRows: st.namingRows.length <= 1 ? st.namingRows : st.namingRows.filter((_, idx) => idx !== i) })),

  addFile: f => set(st => ({ files: [...st.files, f] })),
  removeFile: id => set(st => ({ files: st.files.filter(f => f.id !== id) })),

  startAnalysis: () => {
    clearTimers();
    const st = get();
    set({
      screen: "analysis",
      pipeStatus: ["active", "pending", "pending", "pending"],
      liveTexts: ["규정 RAG 검색 + Gemini 컴플라이언스 판정 중…", "Grok · 연동 예정", "Naver · 연동 예정 (API HUB 신청 중)", ""],
      grokCount: 0,
      naverCount: 0,
      pipelineDone: false,
      sourceStatus: { grok: "empty", naver: "empty", wiki: "empty" },
      sourceStates: {
        websearch: get().sourceFlags.websearch ? "pending" : "disabled",
        grok: get().sourceFlags.grok ? "pending" : "disabled",
        naver: get().sourceFlags.naver ? "pending" : "disabled",
      },
      searchBump: null,
      reviewId: `rev-${Date.now()}`,
      reviewRoute: "blocked",
      adminStatus: null,
      appealNote: "",
      appealFiles: [],
      appealSubmitted: false,
      adminRequested: false,
      adminFeedback: "",
      adminFiles: [],
      viewingArchived: false,
      openedFrom: null,
      reviewAuthor: "주현",
      decision: null,
      decisionNote: "",
      aiFindings: null,
      aiError: null,
      aiLoading: true,
      aiModel: null,
      aiAttempted: true,
      reviewMeta: null,
    });

    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewBody(st)),
    })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        const flags: SourceFlags = data.meta?.sourceFlags || get().sourceFlags;
        const states = data.meta?.sourceStates || {
          websearch: flags.websearch ? "pending" : "disabled",
          grok: flags.grok ? "pending" : "disabled",
          naver: flags.naver ? "pending" : "disabled",
        };
        const ragN = data.meta?.ragChunks ?? 0;
        const n = Array.isArray(data.findings) ? data.findings.length : 0;
        set({
          aiFindings: data.findings,
          aiModel: data.model || null,
          aiLoading: false,
          reviewMeta: data.meta || null,
          grokCount: 0,
          naverCount: 0,
          sourceFlags: flags,
          sourceStates: states,
          sourceStatus: { grok: "empty", naver: "empty", wiki: "empty" },
          pipeStatus: ["done", "empty", "empty", "done"] as PipeStage[],
          liveTexts: [
            `RAG ${ragN}건 주입 · Gemini (${data.model || "model"}) · Finding ${n}건`,
            "Grok · 연동 예정",
            "Naver · 연동 예정 (API HUB 신청 중)",
            "종합 점수 = 최저 사용 가능 점수 (게시 가능 여부)",
          ],
          pipelineDone: true,
          screen: "report",
          decision: null,
          searchBump: null,
        });
        applyScoreRoute(set, get);
        syncHistoryFromReview(set, get);
        startExternalSources(set, get);
      })
      .catch(err => {
        set({
          aiError: err instanceof Error ? err.message : String(err),
          aiLoading: false,
          pipeStatus: ["fail", "empty", "empty", "fail"] as PipeStage[],
          liveTexts: [
            `Gemini 호출 실패 · 데모 데이터로 폴백 (${err instanceof Error ? err.message : "오류"})`,
            "Grok · 연동 예정",
            "Naver · 연동 예정",
            "실패 — 리포트는 데모 데이터",
          ],
          pipelineDone: true,
        });
      });
  },

  resetAnalysis: () => {
    clearTimers();
    set({
      pipeStatus: ["pending", "pending", "pending", "pending"],
      liveTexts: ["", "", "", ""],
      grokCount: 0,
      naverCount: 0,
      pipelineDone: false,
    });
  },

  retryAI: () => {
    const st = get();
    if (st.aiLoading) return;
    set({ aiFindings: null, aiError: null, aiLoading: true, aiModel: null, aiAttempted: true, reviewMeta: null, searchBump: null });

    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewBody(st)),
    })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
        const flags: SourceFlags = data.meta?.sourceFlags || get().sourceFlags;
        set({
          aiFindings: data.findings,
          aiModel: data.model || null,
          aiLoading: false,
          reviewMeta: data.meta || null,
          sourceFlags: flags,
          sourceStates: data.meta?.sourceStates || get().sourceStates,
        });
        applyScoreRoute(set, get);
        syncHistoryFromReview(set, get);
        startExternalSources(set, get);
      })
      .catch(err => {
        set({ aiError: err instanceof Error ? err.message : String(err), aiLoading: false });
      });
  },
  retryExternalSource: id => fetchExternalSource(id, set, get),
  hydrateSourceFlags: () => {
    fetch("/api/review/flags")
      .then(r => r.json())
      .then((flags: SourceFlags) => {
        if (!flags) return;
        set(st => ({
          sourceFlags: flags,
          sourceStates: {
            websearch: flags.websearch ? st.sourceStates.websearch : "disabled",
            grok: flags.grok ? st.sourceStates.grok : "disabled",
            naver: flags.naver ? st.sourceStates.naver : "disabled",
          },
        }));
      })
      .catch(() => undefined);
  },

  gotoReport: () => set({ screen: "report" }),

  toggleCard: id => set(st => ({ cardOpen: { ...st.cardOpen, [id]: !st.cardOpen[id] } })),
  setRiskFilter: f => set({ riskFilter: f }),
  openAllCards: (ids, open) => set({ cardOpen: Object.fromEntries(ids.map(id => [id, open])) }),
  setFixChoice: (id, i) => set(st => ({ fixChoice: { ...st.fixChoice, [id]: i } })),
  setDecision: d => {
    set({ decision: d, adminStatus: d ? "done" : get().adminStatus });
    applyScoreRoute(set, get);
    syncHistoryFromReview(set, get);
  },
  setAppealNote: s => set({ appealNote: s }),
  addAppealFile: f => set(st => ({ appealFiles: [...st.appealFiles, f] })),
  removeAppealFile: id => set(st => ({ appealFiles: st.appealFiles.filter(x => x.id !== id) })),
  patchAppealFile: (id, patch) =>
    set(st => ({ appealFiles: st.appealFiles.map(f => (f.id === id ? { ...f, ...patch } : f)) })),
  submitAppeal: () => {
    const st = get();
    if (st.reviewRoute !== "appeal_eligible") return false;
    if (!st.appealNote.trim() && st.appealFiles.length === 0) return false;
    set({ appealSubmitted: true, reviewRoute: "appeal_review", adminStatus: "appeal" });
    syncHistoryFromReview(set, get);
    return true;
  },
  requestAdminReview: () => {
    const st = get();
    if (!st.reviewId || !st.aiFindings) return false;
    if (st.decision) return false;
    if (st.adminStatus === "pending" || st.adminStatus === "appeal") return true;
    set({ adminRequested: true });
    applyScoreRoute(set, get);
    syncHistoryFromReview(set, get);
    return true;
  },
  setAdminFeedback: s => set({ adminFeedback: s }),
  addAdminFile: f => set(st => ({ adminFiles: [...st.adminFiles, f] })),
  removeAdminFile: id => set(st => ({ adminFiles: st.adminFiles.filter(x => x.id !== id) })),
  patchAdminFile: (id, patch) =>
    set(st => ({ adminFiles: st.adminFiles.map(f => (f.id === id ? { ...f, ...patch } : f)) })),
  resolveAdmin: d => {
    const st = get();
    if (d === "conditional" && !st.decisionNote.trim() && !st.adminFeedback.trim()) return false;
    set({ decision: d, adminStatus: "done" });
    applyScoreRoute(set, get);
    syncHistoryFromReview(set, get);
    return true;
  },
  openReview: (id, from) => {
    const row = get().historyRows.find(r => r.id === id);
    if (!row) return false;
    const snap = snapshotFromRow(row);
    set({
      reviewId: row.id,
      viewingArchived: true,
      openedFrom: from || "history",
      uploadTab: snap.uploadTab,
      textValue: snap.textValue,
      namingRows: snap.namingRows.length ? snap.namingRows : [""],
      files: snap.files,
      ctxName: snap.ctxName,
      ctxDate: snap.ctxDate,
      ctxChannels: snap.ctxChannels,
      ctxTargets: snap.ctxTargets,
      ctxType: snap.ctxType,
      ctxIntent: snap.ctxIntent,
      aiFindings: snap.findings,
      reviewMeta: snap.reviewMeta,
      sourceStates: freezeSources(snap.sourceStates),
      sourceFlags: snap.sourceFlags || get().sourceFlags,
      aiModel: snap.aiModel,
      aiAttempted: true,
      aiLoading: false,
      aiError: null,
      reviewRoute: snap.reviewRoute,
      adminStatus: snap.adminStatus,
      appealNote: snap.appealNote,
      appealFiles: snap.appealFiles,
      appealSubmitted: snap.appealSubmitted,
      adminRequested: snap.adminRequested,
      adminFeedback: snap.adminFeedback,
      adminFiles: snap.adminFiles,
      decision: snap.decision,
      decisionNote: snap.decisionNote,
      chainVersion: snap.chainVersion,
      reviewAuthor: snap.author,
      pipelineDone: true,
      searchBump: null,
      screen: "report",
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
    return true;
  },
  setDecisionNote: s => set({ decisionNote: s }),

  hydrateHistory: () => {
    set({ historyRows: loadHistory() });
  },
  trashHistory: id => {
    const st = get();
    if (!st.historyRows.some(r => r.id === id && !r.deletedAt)) return false;
    const next = st.historyRows.map(r => (r.id === id ? { ...r, deletedAt: new Date().toISOString() } : r));
    saveHistory(next);
    set({ historyRows: next });
    return true;
  },
  restoreHistory: id => {
    const st = get();
    if (!st.historyRows.some(r => r.id === id && r.deletedAt)) return false;
    const next = st.historyRows.map(r => (r.id === id ? { ...r, deletedAt: undefined } : r));
    saveHistory(next);
    set({ historyRows: next });
    return true;
  },
  purgeHistory: id => {
    const st = get();
    if (!st.historyRows.some(r => r.id === id && r.deletedAt)) return false;
    const next = st.historyRows.filter(r => r.id !== id);
    saveHistory(next);
    set({ historyRows: next });
    return true;
  },
  trashAllHistory: () => {
    const now = new Date().toISOString();
    const st = get();
    let n = 0;
    const next = st.historyRows.map(r => {
      if (r.deletedAt) return r;
      n += 1;
      return { ...r, deletedAt: now };
    });
    if (n === 0) return 0;
    saveHistory(next);
    set({ historyRows: next });
    return n;
  },
  purgeAllTrash: () => {
    const st = get();
    const next = st.historyRows.filter(r => !r.deletedAt);
    const n = st.historyRows.length - next.length;
    if (n === 0) return 0;
    saveHistory(next);
    set({ historyRows: next });
    return n;
  },
  setHistFilter: f => set({ histFilter: f }),
  setHf: (key, v) => set(st => ({ hf: { ...st.hf, [key]: v } })),
  clearHf: () =>
    set({
      hf: { types: null, campaigns: null, risks: null, channels: null, authors: null, period: "all" },
      dateRange: null,
    }),
  setSortKey: k => set({ sortKey: k }),
  toggleChainOpen: id => set(st => ({ chainOpen: { ...st.chainOpen, [id]: !st.chainOpen[id] } })),

  openLexicon: () => set({ lexiconOpen: true }),
  closeLexicon: () => set({ lexiconOpen: false }),
  setLexTab: t => set({ lexTab: t }),
  deleteLexVersion: (tab, tag) => {
    const st = get();
    const list = st.versions[tab];
    if (list.length <= 1) return false;
    if (st.selected[tab] === tag) return false;
    const next = list.filter(v => v.tag !== tag);
    if (next.length === list.length) return false;
    set({ versions: { ...st.versions, [tab]: next } });
    return true;
  },
  overwriteLexVersion: (tab, message, payload) => {
    const st = get();
    const tag = st.selected[tab];
    const list = st.versions[tab];
    if (!list.some(v => v.tag === tag)) return false;
    const next = list.map(v =>
      v.tag === tag
        ? { ...v, message: message.trim(), payload, author: "관리자", at: formatLexStamp() }
        : v
    );
    set({ versions: { ...st.versions, [tab]: next } });
    return true;
  },
  saveLexVersion: (tab, tag, message, payload) => {
    const st = get();
    const normalized = normalizeLexTag(tag);
    if (!normalized) return null;
    if (st.versions[tab].some(v => v.tag === normalized)) return null;
    const entry: LexVersion = {
      tag: normalized,
      message: message.trim(),
      author: "관리자",
      at: formatLexStamp(),
      payload,
    };
    set({
      versions: { ...st.versions, [tab]: [entry, ...st.versions[tab]] },
      selected: { ...st.selected, [tab]: normalized },
    });
    return normalized;
  },
  applyLexVersion: (tab, tag) => {
    const st = get();
    if (!st.versions[tab].some(v => v.tag === tag)) return false;
    set({ selected: { ...st.selected, [tab]: tag } });
    return true;
  },

  rescanFromReport: () => {
    const st = get();
    set({
      screen: "upload",
      rescanMode: true,
      chainVersion: st.chainVersion + 1,
      prevText: "이거 모르면 한남충 인증",
      prevSummary: { version: `v${st.chainVersion}`, grade: "위험", score: 0, danger: 1, caution: 0 },
      textValue: "",
      uploadTab: "text",
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  },
}));
