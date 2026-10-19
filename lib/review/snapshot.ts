import type {
  AdminStatus,
  ExternalSourceState,
  HistoryRow,
  ReportFinding,
  ReviewRoute,
  ReviewSnapshot,
  UploadTab,
} from "@/lib/types";
import { routeOf } from "./routing";

type SnapSource = {
  uploadTab: UploadTab;
  textValue: string;
  namingRows: string[];
  files: ReviewSnapshot["files"];
  ctxName: string;
  ctxDate: string;
  ctxChannels: string[];
  ctxTargets: string[];
  ctxType: string;
  ctxIntent: string;
  aiFindings: ReportFinding[] | null;
  reviewMeta: ReviewSnapshot["reviewMeta"];
  sourceStates: ReviewSnapshot["sourceStates"];
  sourceFlags?: ReviewSnapshot["sourceFlags"];
  aiModel: string | null;
  reviewRoute: ReviewRoute;
  adminStatus: AdminStatus | null;
  appealNote: string;
  appealFiles: ReviewSnapshot["appealFiles"];
  appealSubmitted: boolean;
  adminRequested: boolean;
  adminFeedback: string;
  adminFiles: ReviewSnapshot["adminFiles"];
  decision: ReviewSnapshot["decision"];
  decisionNote: string;
  chainVersion: number;
  reviewAuthor?: string;
};

export function freezeSources(states: ReviewSnapshot["sourceStates"]): ReviewSnapshot["sourceStates"] {
  const next = { ...states };
  (Object.keys(next) as (keyof typeof next)[]).forEach(id => {
    if (next[id] === "pending") next[id] = "empty";
  });
  return next;
}

export function buildSnapshot(st: SnapSource): ReviewSnapshot {
  return {
    uploadTab: st.uploadTab,
    textValue: st.textValue,
    namingRows: st.namingRows,
    files: st.files.map(f => ({ ...f })),
    ctxName: st.ctxName,
    ctxDate: st.ctxDate,
    ctxChannels: [...st.ctxChannels],
    ctxTargets: [...st.ctxTargets],
    ctxType: st.ctxType,
    ctxIntent: st.ctxIntent,
    findings: st.aiFindings ? st.aiFindings.map(f => ({ ...f })) : [],
    reviewMeta: st.reviewMeta,
    sourceStates: freezeSources(st.sourceStates),
    sourceFlags: st.sourceFlags,
    aiModel: st.aiModel,
    reviewRoute: st.reviewRoute,
    adminStatus: st.adminStatus,
    appealNote: st.appealNote,
    appealFiles: st.appealFiles.map(f => ({ ...f })),
    appealSubmitted: st.appealSubmitted,
    adminRequested: st.adminRequested,
    adminFeedback: st.adminFeedback,
    adminFiles: st.adminFiles.map(f => ({ ...f })),
    decision: st.decision,
    decisionNote: st.decisionNote,
    chainVersion: st.chainVersion,
    author: st.reviewAuthor || "주현",
  };
}

export function tabOfType(type: HistoryRow["type"]): UploadTab {
  if (type === "이미지") return "image";
  if (type === "네이밍" || type === "카피") return "naming";
  return "text";
}

export function snapshotFromRow(row: HistoryRow): ReviewSnapshot {
  if (row.snapshot) {
    return {
      ...row.snapshot,
      sourceStates: freezeSources(row.snapshot.sourceStates),
      adminRequested: row.snapshot.adminRequested ?? Boolean(row.adminRequested),
      adminFeedback: row.snapshot.adminFeedback || row.adminFeedback || "",
      adminFiles: row.snapshot.adminFiles || row.adminFiles || [],
    };
  }
  const route: ReviewRoute = row.reviewRoute || routeOf(row.score);
  const findings: ReportFinding[] = [
    {
      id: `${row.id}-summary`,
      category: "ARCHIVED",
      categoryKo: "저장된 요약",
      contentType: row.type === "영상" ? "텍스트" : row.type,
      target: row.campaign,
      keywords: [],
      grade: row.grade,
      score: row.score,
      sources: ["ai"],
      aiText:
        row.appealNote ||
        "이 건은 상세 리포트 스냅샷이 없어 요약만 복원했습니다. 관리자 승인·보류·반려는 가능합니다.",
    },
  ];
  return {
    uploadTab: tabOfType(row.type),
    textValue: "",
    namingRows: [row.campaign],
    files: [],
    ctxName: row.campaign,
    ctxDate: row.publishDate,
    ctxChannels: row.channels,
    ctxTargets: [],
    ctxType: "",
    ctxIntent: "",
    findings,
    reviewMeta: {
      model: null,
      ragChunks: 0,
      grok: "disabled",
      naver: "disabled",
      overall: {
        summary: `${row.campaign} · 사용 가능 ${row.score}점`,
        recommendation: "",
        actions: [],
        reasons: row.appealNote ? [row.appealNote] : ["이력 요약만 저장되어 있습니다."],
      },
    },
    sourceStates: row.sourceStates || { websearch: "empty", grok: "disabled", naver: "disabled" },
    aiModel: null,
    reviewRoute: route,
    adminStatus: row.adminStatus ?? null,
    appealNote: row.appealNote || "",
    appealFiles: row.appealFiles || [],
    appealSubmitted: route === "appeal_review" || row.adminStatus === "appeal",
    adminRequested: Boolean(row.adminRequested) || route === "manual_request",
    adminFeedback: row.adminFeedback || "",
    adminFiles: row.adminFiles || [],
    decision: row.decision ?? null,
    decisionNote: row.decisionNote || "",
    chainVersion: row.version || 1,
    author: row.author,
  };
}

export function stripHeavy(rows: HistoryRow[]): HistoryRow[] {
  return rows.map(r => ({
    ...r,
    appealFiles: r.appealFiles?.map(f => ({ id: f.id, name: f.name, size: f.size })),
    adminFiles: r.adminFiles?.map(f => ({ id: f.id, name: f.name, size: f.size })),
    snapshot: r.snapshot
      ? {
          ...r.snapshot,
          files: r.snapshot.files.map(f => ({ ...f, dataUrl: undefined, url: undefined })),
          appealFiles: r.snapshot.appealFiles.map(f => ({ id: f.id, name: f.name, size: f.size })),
          adminFiles: (r.snapshot.adminFiles || []).map(f => ({ id: f.id, name: f.name, size: f.size })),
        }
      : undefined,
  }));
}
