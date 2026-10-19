"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { demoFindings } from "@/lib/demoData";
import { GradeBadge, gradeMeta } from "@/components/ui/GradeBadge";
import { APPEAL_SCORE, PASS_SCORE, decisionLabel, routeLabel, routeOf, routeRecommendation } from "@/lib/review/routing";
import { splitReasonItems } from "@/lib/review/reasons";
import { overallFrom } from "@/lib/review/overall";
import { exportReport } from "@/lib/exportReport";
import type { AppealFile, Grade, PickedFile, ReportFinding, ReviewRoute, WebSearchEvidence } from "@/lib/types";

export function ReportScreen() {
  const s = useStore();
  // Only use AI findings if we actually attempted a call AND got a non-null response.
  // Empty array ([]) from Gemini means "no risk signals" — still show AI, not demo.
  const hasAiResult = s.aiAttempted && !s.aiLoading && !s.aiError && s.aiFindings !== null;
  const findings = hasAiResult ? (s.aiFindings as typeof demoFindings) : demoFindings;
  const usingDemo = !hasAiResult;
  const isAdmin = s.role === "admin";
  const isRescan = s.chainVersion > 1 && !!s.prevSummary;
  const counts = countByGrade(findings);
  const total = findings.length;
  const minScore = findings.length ? Math.min(...findings.map(f => f.score)) : 100;
  const avgScore = findings.length ? Math.round(findings.reduce((a, b) => a + b.score, 0) / findings.length) : 100;
  const topGrade = topGradeOf(findings);
  const sourceFail = Object.values(s.sourceStates).some(v => v === "error" || v === "timeout");
  const overall = overallFrom(findings) || s.reviewMeta?.overall;
  const liveRoute: ReviewRoute = hasAiResult ? s.reviewRoute : routeOf(minScore);
  const webState = s.sourceStates.websearch;
  const externalsPending = (Object.keys(s.sourceStates) as (keyof typeof s.sourceStates)[]).some(
    id => s.sourceFlags[id] && s.sourceStates[id] === "pending"
  );

  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const runExport = async (kind: "pdf" | "png" | "jpeg") => {
    setExportOpen(false);
    s.setRiskFilter("all");
    s.openAllCards(findings.map(f => f.id), true);
    setExporting(true);
    const stamp = new Date().toISOString().slice(0, 10);
    const name = `${(s.ctxName || "검수결과").replace(/[\\/:*?"<>|]/g, "_")}_${stamp}`;
    try {
      await new Promise(r => setTimeout(r, 80));
      await exportReport(kind, name);
    } finally {
      setExporting(false);
    }
  };

  const filtered = s.riskFilter === "all" ? findings : findings.filter(f => f.grade === s.riskFilter);
  const processedCount = Object.keys(s.actions).length;

  return (
    <div id="cg-report" className="cg-rise mx-auto px-[34px] pt-[26px] pb-[48px]" style={{ maxWidth: 1120 }}>
      <div className="mb-[14px] flex items-center justify-between">
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "var(--accent)" }}>STEP 03 — REPORT</div>
          <h1 className="mt-[8px]" style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.8px", lineHeight: 1 }}>
            검수 결과 리포트
          </h1>
        </div>
        <div className="relative" data-export-hide>
          <div
            onClick={() => setExportOpen(!exportOpen)}
            className="flex cursor-pointer items-center gap-[8px] rounded-[8px] border bg-white px-[14px] py-[9px]"
            style={{ borderColor: "var(--ink)", fontSize: 12, fontWeight: 700, opacity: exporting ? 0.55 : 1, pointerEvents: exporting ? "none" : "auto" }}
          >
            {exporting ? "내보내는 중…" : "↓ Export"} <span style={{ fontSize: 10 }}>⌄</span>
          </div>
          {exportOpen && (
            <div
              className="absolute right-0 top-[46px] z-20 w-[160px] rounded-[12px] border bg-white p-[6px] shadow-lg"
              style={{ borderColor: "#e0e0e0" }}
            >
              {[
                { k: "pdf" as const, label: "PDF (전체)" },
                { k: "png" as const, label: "PNG (전체 ×2)" },
                { k: "jpeg" as const, label: "JPEG (전체)" },
              ].map(opt => (
                <div
                  key={opt.k}
                  onClick={() => runExport(opt.k)}
                  className="cursor-pointer rounded-[8px] px-[12px] py-[8px] hover:bg-[#fafafa]"
                  style={{ fontSize: 12.5, fontWeight: 600 }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AiStatusBanner />
      <AdminCaseBanner />

      {s.searchBump && (
        <div className="mb-[14px] rounded-[12px] px-[14px] py-[10px]" style={{ background: "#111", color: "#fff", fontSize: 12.5, fontWeight: 700 }}>
          {s.searchBump}
        </div>
      )}


      {isRescan && (
        <div
          className="mb-[14px] flex items-center gap-[10px] rounded-[12px] border px-[14px] py-[10px]"
          style={{ borderColor: "#eee", background: "#fafafa" }}
        >
          <span className="rounded-[6px] px-[8px] py-[2px]" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", background: "#f4f0e8", color: "#8a7340" }}>
            재검수 · v{s.chainVersion}
          </span>
          <span style={{ fontSize: 12.5, color: "#555" }}>
            {s.ctxName || "캠페인"} v{s.chainVersion} · 이전 {s.prevSummary?.version} {s.prevSummary?.grade} {s.prevSummary?.score}점 기준
          </span>
        </div>
      )}

      <RequestBrief />

      {/* OVERALL RISK */}
      <div className="rounded-[28px] border bg-white p-[26px]" style={{ borderColor: "#e5e5e5" }}>
        <div className="flex flex-wrap items-start justify-between gap-[16px]">
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "#999" }}>USABILITY · 사용 가능 점수</div>
            <div className="mt-[8px] flex items-end gap-[10px]">
              <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1, letterSpacing: "-2px" }}>{minScore}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#999", marginBottom: 10 }}>/ 100</div>
              <div className="mb-[10px]">
                <GradeBadge grade={topGrade} size="md" />
              </div>
            </div>
            <div className="mt-[6px]" style={{ fontSize: 12, color: "#888" }}>
              최저 사용 가능 점수 기준 · 평균 {avgScore}점 · 100=게시 가능, 0=사용 불가
            </div>
          </div>
          <div className="flex gap-[16px]">
            {(["high", "med", "unverified", "low"] as Grade[]).map(g => {
              const m = gradeMeta[g];
              return (
                <div key={g} className="text-center">
                  <div className="flex items-end justify-center gap-[6px]">
                    <span style={{ fontSize: 18, color: m.color }}>{m.shape}</span>
                    <span style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{counts[g] || 0}</span>
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#888", marginTop: 4, letterSpacing: "0.5px" }}>{m.ko}</div>
                </div>
              );
            })}
            <div className="border-l pl-[16px] text-center" style={{ borderColor: "#eee" }}>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#888", marginTop: 8, letterSpacing: "0.5px" }}>전체</div>
            </div>
          </div>
        </div>
      </div>

      {sourceFail && (
        <div className="mt-[14px] flex items-center justify-between rounded-[12px] border p-[12px]" style={{ borderColor: "#f1dcdc", background: "#fdf5f5" }}>
          <span style={{ fontSize: 12, color: "#a63232" }}>
            확인하지 못한 외부 소스: {(s.reviewMeta?.unverifiedSources || []).join(", ") || "외부 소스"}
          </span>
          <span
            onClick={() => {
              (Object.keys(s.sourceStates) as (keyof typeof s.sourceStates)[]).forEach(id => {
                if (s.sourceStates[id] === "error" || s.sourceStates[id] === "timeout") s.retryExternalSource(id);
              });
            }}
            className="cursor-pointer rounded-[8px] border bg-white px-[10px] py-[5px]"
            style={{ borderColor: "#a63232", color: "#a63232", fontSize: 11, fontWeight: 700 }}
          >
            실패한 소스만 재검증
          </span>
        </div>
      )}

      {/* OVERALL ASSESSMENT */}
      <div
        className="mt-[18px] rounded-[28px] border-[1.5px] bg-white p-[22px] shadow-sm"
        style={{ borderColor: "var(--ink)" }}
      >
        <div className="flex items-start justify-between gap-[14px]">
          <div className="flex-1">
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--accent)" }}>OVERALL ASSESSMENT · 종합 평가</div>
            <p className="mt-[10px]" style={{ fontSize: 15, color: "#222", lineHeight: 1.7 }}>
              {overall?.summary || (
                usingDemo ? (
                  <>카피 ‘<b>이거 모르면 한남충 인증</b>’이 성별 혐오 신호로 판정되었습니다. 데모 데이터입니다.</>
                ) : (
                  <>활성 택소노미와 규정 RAG를 반영한 검수 결과입니다. 종합 점수는 가장 낮은 사용 가능 점수입니다.</>
                )
              )}
            </p>
          </div>
          <span
            className="whitespace-nowrap rounded-[8px] px-[10px] py-[5px]"
            style={{ fontSize: 11.5, fontWeight: 800, background: routeTone(liveRoute).bg, color: routeTone(liveRoute).fg, border: "1px solid #eee" }}
          >
            {routeRecommendation(liveRoute)}
          </span>
        </div>

        <div className="mt-[16px] grid gap-[10px]" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          <SourcePill label="U+ AI 자체 추론" value={`${minScore}점`} sub={`위험 ${counts.high || 0} · 주의 ${counts.med || 0} · 미검증 ${counts.unverified || 0}`} accent="var(--accent)" />
          <SourcePill
            label="웹 검색 근거"
            value={webState === "done" ? "확인" : webState === "pending" ? "확인 중" : webState === "disabled" ? "꺼짐" : "없음"}
            sub={webState === "pending" ? "Google Search grounding" : webState === "done" ? "출처 있는 문장만 반영" : "등급은 유지"}
            accent="#111"
          />
          <SourcePill label="Grok·Naver" value="연동 예정" sub="현재 비활성화된 소스입니다" accent="#999" />
        </div>
        {typeof s.reviewMeta?.ragChunks === "number" && (
          <div className="mt-[10px]" style={{ fontSize: 12, color: "#666" }}>
            규정 RAG {s.reviewMeta.ragChunks}건 주입 · 모델 {s.reviewMeta.model || s.aiModel || "—"}
          </div>
        )}
        {s.reviewMeta?.unverifiedSources?.length ? (
          <div className="mt-[8px]" style={{ fontSize: 12, color: "#888" }}>
            확인하지 못한 외부 소스: {s.reviewMeta.unverifiedSources.join(", ")}
          </div>
        ) : null}

        <div className="mt-[16px] grid gap-[12px]" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="rounded-[12px] border p-[14px]" style={{ borderColor: "#eee" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#777", letterSpacing: "0.8px" }}>핵심 판단 근거</div>
            <ol className="mt-[8px] list-decimal space-y-[8px] pl-[22px]" style={{ fontSize: 12.5, color: "#333", lineHeight: 1.55 }}>
              {splitReasonItems(overall?.reasons?.length ? overall.reasons : ["개별 FINDINGS 카드를 확인하세요."]).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>
          <div className="rounded-[12px] border p-[14px]" style={{ borderColor: "#eee" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#777", letterSpacing: "0.8px" }}>권고 조치</div>
            <ul className="mt-[8px] space-y-[6px] pl-[18px] list-disc" style={{ fontSize: 12.5, color: "#333", lineHeight: 1.6 }}>
              {(overall?.actions?.length ? overall.actions : ["아래 FINDINGS에서 대안 문구를 검토하세요."]).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <RoutingPanel route={liveRoute} actions={overall?.actions || []} />
      <AdminCasePack />

      {/* FINDINGS */}
      <div className="mt-[22px]">
        <div className="mb-[14px] flex flex-wrap items-center gap-[12px]">
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px" }}>FINDINGS · 개별 판정</div>
          <span style={{ fontSize: 12, color: "#888" }}>{findings.length}건 중 {processedCount}건 처리됨</span>
          <div className="ml-auto flex gap-[6px]" data-export-hide>
            <div
              onClick={() => s.openAllCards(findings.map(f => f.id), true)}
              className="cursor-pointer rounded-[8px] border bg-white px-[10px] py-[5px]"
              style={{ borderColor: "#e0e0e0", fontSize: 11, fontWeight: 700, color: "#555" }}
            >
              모두 펼치기
            </div>
            <div
              onClick={() => s.openAllCards(findings.map(f => f.id), false)}
              className="cursor-pointer rounded-[8px] border bg-white px-[10px] py-[5px]"
              style={{ borderColor: "#e0e0e0", fontSize: 11, fontWeight: 700, color: "#555" }}
            >
              모두 접기
            </div>
          </div>
        </div>

        <div className="mb-[14px] flex flex-wrap gap-[6px]" data-export-hide>
          {(["all", "low", "unverified", "med", "high"] as const).map(k => {
            const active = s.riskFilter === k;
            const label =
              k === "all" ? "전체"
              : k === "high" ? "▲ 위험"
              : k === "med" ? "△ 주의"
              : k === "unverified" ? "○ 미검증"
              : "● 안전";
            return (
              <span
                key={k}
                onClick={() => s.setRiskFilter(k)}
                className="cursor-pointer rounded-[20px] border px-[12px] py-[5px]"
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: active ? "var(--ink)" : "#fff",
                  color: active ? "#fff" : "#555",
                  borderColor: active ? "var(--ink)" : "#e0e0e0",
                }}
              >
                {label}
              </span>
            );
          })}
        </div>

        <div className="flex flex-col gap-[12px]">
          {filtered.map(f => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      </div>

      {/* FINAL DECISION (admin only) */}
      {isAdmin && <AdminDecisionPanel externalsPending={externalsPending} />}

      {/* bottom CTAs */}
      <ReportFooter isFail={minScore < PASS_SCORE} hasResult={hasAiResult || s.viewingArchived} />
    </div>
  );
}

function AiStatusBanner() {
  const s = useStore();

  // Compose banner contents by state. Always visible on report so user can tell
  // whether AI was called, succeeded, errored, or wasn't attempted at all.
  let tone: "info" | "ok" | "warn" | "err" | "demo" = "demo";
  let message = "AI 호출 없음 — 업로드에서 '검수 시작'을 거치지 않아 데모 데이터로 표시 중입니다.";
  let showRetry = false;
  let showStart = true;

  if (s.aiLoading) {
    tone = "info";
    message = "Gemini 호출 중 — 완료되면 자동 반영됩니다.";
    showStart = false;
  } else if (s.aiError) {
    tone = "err";
    message = `Gemini 호출 실패 · 데모 데이터로 표시 중 (${s.aiError})`;
    showRetry = true;
    showStart = false;
  } else if (s.aiAttempted && s.aiFindings !== null) {
    const n = s.aiFindings.length;
    tone = "ok";
    message =
      n === 0
        ? `Gemini (${s.aiModel || "model"}) · RAG ${s.reviewMeta?.ragChunks ?? 0}건 — 리스크 신호 0건`
        : `Gemini (${s.aiModel || "model"}) · RAG ${s.reviewMeta?.ragChunks ?? 0}건 · Finding ${n}건`;
    showStart = false;
  }

  const palette = {
    info: { border: "#eee", bg: "#fafafa", text: "#555" },
    ok: { border: "#dceadd", bg: "#f3faf5", text: "#3f6b4a" },
    warn: { border: "#f1e4c6", bg: "#fdfaf3", text: "#8a7340" },
    err: { border: "#f1dcdc", bg: "#fdf5f5", text: "#a63232" },
    demo: { border: "#e5e5e5", bg: "#fafafa", text: "#555" },
  }[tone];

  return (
    <div
      className="mb-[14px] flex flex-wrap items-center justify-between gap-[10px] rounded-[12px] border px-[14px] py-[10px]"
      style={{ borderColor: palette.border, background: palette.bg }}
      data-export-hide
    >
      <span style={{ fontSize: 12, color: palette.text }}>{message}</span>
      <div className="flex gap-[6px]">
        {showStart && (
          <span
            onClick={() => s.setScreen("upload")}
            className="cursor-pointer rounded-[6px] border bg-white px-[10px] py-[4px]"
            style={{ borderColor: "var(--ink)", color: "var(--ink)", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}
          >
            업로드로 이동
          </span>
        )}
        {showRetry && (
          <span
            onClick={() => s.retryAI()}
            className="cursor-pointer rounded-[6px] border bg-white px-[10px] py-[4px]"
            style={{ borderColor: "#a63232", color: "#a63232", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}
          >
            재시도
          </span>
        )}
        {tone === "ok" && (
          <span className="rounded-[6px] px-[8px] py-[2px]" style={{ background: "#dceadd", color: "#3f6b4a", fontSize: 10.5, fontWeight: 700 }}>
            AI 응답
          </span>
        )}
      </div>
    </div>
  );
}

function LockedSource({ title, body }: { title: string; body: string }) {
  return (
    <div
      title="현재 비활성화된 소스입니다"
      className="rounded-[12px] border p-[14px]"
      style={{ borderColor: "#ececec", background: "#f6f6f6", color: "#8a8a8a" }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px" }}>🔒 {title}</div>
      <p className="mt-[8px]" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
        {body}
      </p>
    </div>
  );
}

function WebSearchBlock({
  evidence,
  pending,
  grade,
  onRetry,
}: {
  findingId: string;
  evidence?: WebSearchEvidence;
  pending: boolean;
  grade: Grade;
  onRetry: () => void;
}) {
  const status = pending ? "pending" : evidence?.status || "empty";
  return (
    <div className="rounded-[12px] border p-[14px]" style={{ borderColor: "#111", background: "#fff" }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", color: "#111" }}>웹 검색 근거 · Google Search</div>
      {status === "pending" && (
        <div className="mt-[8px]" style={{ fontSize: 12.5, color: "#777" }}>
          확인 중…
        </div>
      )}
      {status === "disabled" && (
        <div className="mt-[8px]" style={{ fontSize: 12.5, color: "#888" }}>
          연동 예정
        </div>
      )}
      {status === "empty" && (
        <div className="mt-[8px]" style={{ fontSize: 12.5, color: "#888", lineHeight: 1.6 }}>
          관련 사례를 찾지 못했습니다. 외부 근거가 없다는 것이 안전을 의미하지는 않습니다.
        </div>
      )}
      {(status === "timeout" || status === "error") && (
        <div className="mt-[8px] flex items-center justify-between gap-[10px]">
          <div style={{ fontSize: 12.5, color: "#a63232", lineHeight: 1.6 }}>
            {status === "timeout" ? "응답 지연으로 확인하지 못했습니다." : "외부 소스 오류로 확인하지 못했습니다."}
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-[8px] border bg-white px-[10px] py-[5px]"
            style={{ borderColor: "#e0e0e0", fontSize: 11, fontWeight: 700 }}
          >
            다시 시도
          </button>
        </div>
      )}
      {status === "done" && (
        <>
          <div className="mt-[8px] flex flex-col gap-[6px]">
            {evidence?.summary.map((s, i) => (
              <p key={i} style={{ fontSize: 12.5, color: "#333", lineHeight: 1.65 }}>
                {s.text}
                {s.cites.map(n => (
                  <sup key={n} style={{ fontSize: 10, fontWeight: 700, color: "#111", marginLeft: 2 }}>
                    [{n}]
                  </sup>
                ))}
              </p>
            ))}
          </div>
          {evidence?.links.length ? (
            <div className="mt-[12px]">
              <div style={{ fontSize: 11, fontWeight: 700, color: "#777" }}>관련 링크</div>
              <div className="mt-[6px] flex flex-col gap-[6px]">
                {evidence.links.map((l, i) => (
                  <a
                    key={l.uri}
                    href={l.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-baseline justify-between gap-[10px] rounded-[8px] border px-[10px] py-[7px]"
                    style={{ borderColor: "#eee", fontSize: 12.5, color: "#111" }}
                  >
                    <span>
                      {i + 1}. {l.title}
                    </span>
                    <span style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap" }}>
                      {l.domain} ↗
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          {evidence?.queries.length ? (
            <div className="mt-[10px]" style={{ fontSize: 11, color: "#999" }}>
              검색어: {evidence.queries.map(q => `“${q}”`).join(" · ")}
            </div>
          ) : null}
          {evidence?.entryPointHtml ? (
            <iframe
              title="Google 검색 제안"
              srcDoc={evidence.entryPointHtml}
              className="mt-[10px] w-full"
              style={{ height: 72, border: 0, overflow: "hidden" }}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function SourcePill({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-[12px] border p-[12px]" style={{ borderColor: "#eee" }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "1px", color: "#888" }}>{label}</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: accent }}>{value}</span>
      </div>
      <div className="mt-[4px]" style={{ fontSize: 11, color: "#999" }}>
        {sub}
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: ReportFinding }) {
  const s = useStore();
  const open = !!s.cardOpen[finding.id];
  const action = s.actions[finding.id];

  const hasAI = finding.sources.includes("ai");
  const web = finding.webSearch;
  const webPending = s.sourceStates.websearch === "pending";

  const highlightTarget = (text: string, words?: string[]): React.ReactNode => {
    if (!words || words.length === 0) return text;
    let parts: React.ReactNode[] = [text];
    words.forEach(w => {
      const next: React.ReactNode[] = [];
      parts.forEach(part => {
        if (typeof part !== "string") {
          next.push(part);
          return;
        }
        const chunks = part.split(w);
        chunks.forEach((chunk, i) => {
          next.push(chunk);
          if (i < chunks.length - 1) {
            next.push(
              <mark key={`${w}-${next.length}`} style={{ background: "#fdecec", color: "#a63232", padding: "0 2px", fontWeight: 700, borderRadius: 3 }}>
                {w}
              </mark>
            );
          }
        });
      });
      parts = next;
    });
    return <>{parts}</>;
  };

  return (
    <div className="cg-finding-card overflow-hidden rounded-[20px] border bg-white" style={{ borderColor: "#e5e5e5" }}>
      {/* SOURCE bar */}
      <div
        className="flex items-center gap-[8px] px-[16px] py-[8px]"
        style={{ background: "#f3f3f3", color: "#777", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.8px" }}
      >
        <span>SOURCE</span>
        {hasAI && <span className="rounded-[4px] px-[6px] py-[1px]" style={{ background: "var(--accent)", color: "#fff" }}>AI 추론</span>}
        {web?.status === "done" && <span className="rounded-[4px] px-[6px] py-[1px]" style={{ background: "#111", color: "#fff" }}>웹 검색</span>}
        <span style={{ color: "#999" }}>· Grok·Naver 연동 예정</span>
      </div>

      {/* collapsed header */}
      <div
        onClick={() => s.toggleCard(finding.id)}
        className="flex cursor-pointer items-center gap-[12px] px-[18px] py-[14px]"
      >
        <GradeBadge grade={finding.grade} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.5px" }}>{finding.contentType}</span>
        <div className="min-w-0 flex-1" style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: open ? "normal" : "nowrap" }}>
          “{highlightTarget(finding.target, finding.highlight)}”
          {finding.wholeContext && (
            <span className="ml-[8px]" style={{ fontSize: 10.5, color: "#999", fontWeight: 600 }}>문맥 전체</span>
          )}
        </div>
        {!open && finding.keywords.map(k => (
          <span key={k} className="rounded-[6px] px-[8px] py-[2px]" style={{ background: "#f3f3f3", fontSize: 10.5, fontWeight: 700, color: "#666" }}>
            {k}
          </span>
        ))}
        <span style={{ fontSize: 14, color: "#888" }}>{open ? "⌃" : "⌄"}</span>
      </div>

      {open && (
        <div className="border-t px-[18px] py-[16px]" style={{ borderColor: "#f0f0f0" }}>
          {finding.evidenceChips && (
            <div className="mb-[12px] flex gap-[6px]">
              {finding.evidenceChips.map(e => (
                <span key={e} className="rounded-[6px] px-[8px] py-[3px]" style={{ background: "#fff3f3", color: "#a63232", border: "1px solid #f1dcdc", fontSize: 10.5, fontWeight: 700 }}>
                  {e}
                </span>
              ))}
            </div>
          )}

          {finding.hiddenSignals && finding.hiddenSignals.length > 0 && (
            <div className="mb-[14px] rounded-[12px] border p-[14px]" style={{ borderColor: "#f1dcdc", background: "#fff8f8" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", color: "#a63232" }}>은닉 신호 · HIDDEN SCAN</div>
              {finding.hiddenSignals.map(sig => {
                const marks = new Set(sig.positions.map(p => `${p.line}:${p.col}`));
                const lines = finding.target.replace(/\r\n/g, "\n").split("\n");
                return (
                  <div key={`${sig.pathId}-${sig.term}`} className="mt-[10px]">
                    <div style={{ fontSize: 12.5, color: "#333", lineHeight: 1.55 }}>
                      {sig.pathDesc} → <b>{sig.extracted}</b>
                      <span style={{ color: "#888" }}> ({sig.term} · {sig.normalization} · 사용 가능 {finding.score}점)</span>
                    </div>
                    <div className="mt-[8px] rounded-[8px] border bg-white p-[10px]" style={{ borderColor: "#f1dcdc", fontFamily: "inherit", fontSize: 13, lineHeight: 1.7 }}>
                      {lines.map((line, i) => (
                        <div key={i}>
                          <span style={{ color: "#bbb", fontSize: 10.5, marginRight: 8 }}>{i + 1}</span>
                          {Array.from(line).map((ch, j) =>
                            marks.has(`${i + 1}:${j + 1}`) ? (
                              <mark key={j} style={{ background: "#fdecec", color: "#a63232", fontWeight: 800, padding: "0 1px", borderRadius: 2 }}>
                                {ch}
                              </mark>
                            ) : (
                              <span key={j}>{ch}</span>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-[12px]">
            {hasAI && (
              <div className="rounded-[12px] border p-[14px]" style={{ borderColor: "var(--accent)", background: "#fff" }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", color: "var(--accent)" }}>U+ AI 자체 추론</div>
                <p className="mt-[8px]" style={{ fontSize: 12.5, color: "#333", lineHeight: 1.65 }}>
                  {finding.aiText}
                </p>
                {typeof finding.score === "number" && (
                  <div className="mt-[10px]" style={{ fontSize: 11, color: "#888" }}>
                    사용 가능 <b style={{ color: "#333" }}>{finding.score}</b>점 · 100=게시 가능 · 사전 + 모델 교차
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-[12px]" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <LockedSource title="Grok · 연동 예정" body="X 실시간 여론 · 연동 예정" />
              <LockedSource title="Naver · 연동 예정" body="국내 뉴스 · 연동 예정 (API HUB 신청 중)" />
            </div>

            <WebSearchBlock findingId={finding.id} evidence={web} pending={webPending} grade={finding.grade} onRetry={() => s.retryExternalSource("websearch")} />
          </div>

          <div className="mt-[12px] rounded-[12px] border p-[12px]" style={{ borderColor: "#eee", background: "#fafafa" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", color: "#777" }}>규정 근거 · RAG</div>
            {finding.rag && finding.rag.length > 0 ? (
              <div className="mt-[8px] flex flex-col gap-[8px]">
                {finding.rag.map(c => (
                  <div key={c.chunk_id} className="rounded-[8px] border bg-white p-[8px]" style={{ borderColor: "#eee" }}>
                    <div className="flex items-center gap-[6px]">
                      <span className="rounded-[4px] px-[6px] py-[1px]" style={{ fontSize: 10, fontWeight: 800, background: "#111", color: "#fff" }}>
                        {String(c.source_type).toUpperCase()}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#222" }}>{c.source_title}</span>
                    </div>
                    <div className="mt-[4px]" style={{ fontSize: 11, color: "#777" }}>{c.source_ref}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-[8px]" style={{ fontSize: 12, color: "#888" }}>
                {finding.ragStatus === "unverified" ? "※ 유효한 규정 청크 없음 — 미검증" : "※ 이 항목에 인용된 규정 청크 없음"}
              </div>
            )}
          </div>

          {finding.grade === "unverified" && web?.status !== "done" && (
            <div className="mt-[12px] rounded-[8px] px-[10px] py-[7px]" style={{ background: "#fafafa", fontSize: 11, color: "#777" }}>
              ※ 외부 검증 데이터 없음 (AI 판단 단독)
            </div>
          )}

          {finding.adjustment && (
            <div className="mt-[14px] rounded-[12px] border p-[12px]" style={{ borderColor: "#eee", background: "#fafafa" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", color: "#777" }}>RISK ADJUSTMENT · 외부 데이터 반영</div>
              <div className="mt-[8px] flex items-center gap-[14px]">
                <div className="text-center">
                  <div style={{ fontSize: 10, color: "#999" }}>BEFORE (AI 단독)</div>
                  <div className="mt-[4px]">
                    <GradeBadge grade={finding.adjustment.before} />
                  </div>
                </div>
                <div style={{ fontSize: 18, color: "#999" }}>→</div>
                <div className="text-center">
                  <div style={{ fontSize: 10, color: "#999" }}>AFTER (외부 반영)</div>
                  <div className="mt-[4px]">
                    <GradeBadge grade={finding.adjustment.after} />
                  </div>
                </div>
                <div className="flex-1" style={{ fontSize: 12, color: "#555", lineHeight: 1.55 }}>
                  {finding.adjustment.reason}
                </div>
              </div>
            </div>
          )}

          {finding.alternatives && finding.alternatives.length > 0 && (
            <div className="mt-[14px]">
              <div className="mb-[8px]" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", color: "#777" }}>
                대안 제안 · ALTERNATIVES
              </div>
              <div className="flex flex-col gap-[8px]">
                {finding.alternatives.map((a, i) => (
                  <div key={i} className="flex items-center gap-[10px] rounded-[12px] border p-[12px]" style={{ borderColor: "#eee" }}>
                    <span className="rounded-[6px] px-[8px] py-[2px]" style={{ fontSize: 10.5, fontWeight: 700, background: "#f3f3f3", color: "#555" }}>
                      {a.label}
                    </span>
                    <div style={{ fontSize: 13, color: "#222", flex: 1 }}>{a.text}</div>
                    <span
                      onClick={() => navigator.clipboard?.writeText(a.text)}
                      className="cursor-pointer rounded-[6px] border bg-white px-[10px] py-[4px]"
                      style={{ borderColor: "#e0e0e0", fontSize: 11, fontWeight: 700, color: "#555" }}
                    >
                      복사
                    </span>
                  </div>
                ))}
              </div>
              {s.role === "user" && (
                <div className="mt-[6px]" style={{ fontSize: 11, color: "#999" }}>
                  제안된 대안입니다. 최종 적용 문구는 브랜드 검수 담당자가 확정합니다.
                </div>
              )}
            </div>
          )}

          <div className="mt-[14px] flex gap-[8px]" data-export-hide>
            {s.role === "admin" ? (
              <>
                <div className="cursor-pointer rounded-[8px] px-[14px] py-[7px]" style={{ background: "var(--ink)", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                  수정 반영
                </div>
                <div className="cursor-pointer rounded-[8px] border bg-white px-[14px] py-[7px]" style={{ borderColor: "#e0e0e0", fontSize: 12, fontWeight: 700, color: "#555" }}>
                  해당 없음 · 기각
                </div>
              </>
            ) : (
              <div
                onClick={() => {
                  if (s.reviewRoute !== "appeal_eligible") return;
                  document.getElementById("cg-next-step")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="rounded-[8px] border bg-white px-[14px] py-[7px]"
                style={{
                  borderColor: "#e0e0e0",
                  fontSize: 12,
                  fontWeight: 700,
                  color: s.reviewRoute === "appeal_eligible" ? "#555" : "#bbb",
                  cursor: s.reviewRoute === "appeal_eligible" ? "pointer" : "not-allowed",
                }}
              >
                {s.reviewRoute === "appeal_review" ? "이의 제기됨" : "이의 제기"}
              </div>
            )}
            {action && (
              <span className="ml-auto rounded-[8px] px-[10px] py-[5px]" style={{ background: "#eef7ef", color: "#3f6b4a", fontSize: 11, fontWeight: 700 }}>
                ✓ 처리됨
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function countByGrade(findings: ReportFinding[]) {
  return findings.reduce<Record<Grade, number>>(
    (acc, f) => ({ ...acc, [f.grade]: (acc[f.grade] || 0) + 1 }),
    { high: 0, med: 0, unverified: 0, low: 0 }
  );
}

function topGradeOf(findings: ReportFinding[]): Grade {
  const order: Grade[] = ["high", "med", "unverified", "low"];
  for (const g of order) {
    if (findings.some(f => f.grade === g)) return g;
  }
  return "low";
}

function routeTone(route: ReviewRoute) {
  if (route === "pass_manual") return { bg: "#f3faf5", fg: "#3f6b4a" };
  if (route === "appeal_review") return { bg: "#eef3fb", fg: "#2f4f8a" };
  if (route === "appeal_eligible") return { bg: "#fff8ee", fg: "#8a5a20" };
  return { bg: "#fdf2f2", fg: "#a63232" };
}

function AdminCaseBanner() {
  const s = useStore();
  if (!s.viewingArchived && !s.adminStatus) return null;
  const waiting = s.adminStatus === "pending" || s.adminStatus === "appeal";
  const title = s.decision
    ? `관리자 ${decisionLabel(s.decision)}`
    : s.adminStatus === "appeal" ? "이의 제기 · 수기검수 대기"
    : s.reviewRoute === "manual_request" ? "관리자 결재 대기"
    : s.adminStatus === "pending" ? "프로그램 통과 · 관리자 승인 대기"
    : s.viewingArchived ? "저장된 검수 건" : "";
  if (!title) return null;
  return (
    <div
      className="mb-[14px] flex flex-wrap items-center justify-between gap-[10px] rounded-[12px] border px-[14px] py-[10px]"
      style={{ borderColor: waiting ? "#efe3cf" : "#dce8df", background: waiting ? "#fffaf2" : "#f7fbf8" }}
    >
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: waiting ? "#8a5a20" : "#3f6b4a" }}>{title}</div>
        <div className="mt-[3px]" style={{ fontSize: 12, color: "#666" }}>
          {s.reviewAuthor} · {s.ctxName || "제목 없음"}
          {s.role === "admin"
            ? s.adminStatus === "appeal" ? " · 제출 증빙을 확인한 뒤 결재하세요" : " · 리포트를 확인한 뒤 승인·반려·조건부 승인하세요"
            : " · 저장된 검수 결과"}
        </div>
      </div>
      {s.openedFrom === "admin" && (
        <div
          onClick={() => s.setScreen("admin")}
          className="cursor-pointer rounded-[8px] border bg-white px-[10px] py-[6px]"
          style={{ borderColor: "#e0e0e0", fontSize: 11.5, fontWeight: 700 }}
        >
          결재대기로 돌아가기
        </div>
      )}
    </div>
  );
}

function tabLabel(tab: string) {
  if (tab === "image") return "이미지·디자인";
  if (tab === "naming") return "카피·네이밍";
  return "텍스트";
}

function RequestBrief() {
  const s = useStore();
  const [preview, setPreview] = useState<PickedFile | null>(null);
  const names = s.namingRows.map(v => v.trim()).filter(Boolean);
  const hasText = Boolean(s.textValue.trim());
  const images = s.files.filter(f => f.isImage && (f.dataUrl || f.url));
  const otherFiles = s.files.filter(f => !f.isImage || !(f.dataUrl || f.url));
  const empty = !names.length && !hasText && s.files.length === 0;

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  return (
    <div className="mb-[16px] rounded-[28px] border bg-white p-[22px]" style={{ borderColor: "#e5e5e5" }}>
      <div className="flex flex-wrap items-start justify-between gap-[10px]">
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--accent)" }}>REQUEST · 검수 요청</div>
          <div className="mt-[8px]" style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px" }}>
            {s.ctxName || "제목 없음"}
          </div>
        </div>
        <span className="rounded-[8px] px-[10px] py-[5px]" style={{ fontSize: 11.5, fontWeight: 800, background: "#111", color: "#fff" }}>
          {tabLabel(s.uploadTab)}
        </span>
      </div>
      <div className="mt-[10px] flex flex-wrap gap-x-[10px] gap-y-[4px]" style={{ fontSize: 12.5, color: "#555" }}>
        {s.ctxDate && <span>게시 예정 {s.ctxDate}</span>}
        {s.ctxChannels.length > 0 && <span>· {s.ctxChannels.join(", ")}</span>}
        {s.ctxTargets.length > 0 && <span>· 타겟 {s.ctxTargets.join(", ")}</span>}
        {s.ctxType && <span>· {s.ctxType}</span>}
        <span>· 제출자 {s.reviewAuthor || "주현"}</span>
      </div>
      {s.ctxIntent.trim() && (
        <p className="mt-[10px]" style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>
          {s.ctxIntent}
        </p>
      )}

      <div className="mt-[14px] rounded-[14px] border p-[14px]" style={{ borderColor: "#eee", background: "#fafafa" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#777", letterSpacing: "0.8px" }}>제출 원문</div>
        {s.uploadTab === "naming" && names.length > 0 && (
          <ol className="mt-[8px] list-decimal space-y-[6px] pl-[20px]" style={{ fontSize: 14, color: "#222", lineHeight: 1.55, fontWeight: 600 }}>
            {names.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ol>
        )}
        {s.uploadTab === "text" && hasText && (
          <pre className="mt-[8px] whitespace-pre-wrap" style={{ fontSize: 13.5, color: "#222", lineHeight: 1.65, fontFamily: "inherit" }}>
            {s.textValue}
          </pre>
        )}
        {(s.uploadTab === "image" || images.length > 0) && images.length > 0 && (
          <div className="mt-[10px] flex flex-wrap gap-[12px]">
            {images.map(f => (
              <div
                key={f.id}
                onClick={() => setPreview(f)}
                className="cursor-pointer overflow-hidden rounded-[16px] border bg-white"
                style={{ borderColor: "#e5e5e5", width: images.length === 1 ? "100%" : 420, maxWidth: "100%" }}
              >
                <div className="flex items-center justify-center" style={{ background: "#f3f3f3", minHeight: 280 }}>
                  <img
                    src={f.dataUrl || f.url}
                    alt={f.name}
                    style={{ display: "block", width: "100%", maxHeight: 420, objectFit: "contain" }}
                  />
                </div>
                <div className="flex items-center justify-between gap-[8px] px-[12px] py-[8px]">
                  <span style={{ fontSize: 12, color: "#555" }}>{f.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#888" }}>클릭하면 원본 보기</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {preview && (preview.dataUrl || preview.url) && (
          <ImagePreview file={preview} onClose={() => setPreview(null)} />
        )}
        {otherFiles.length > 0 && (
          <div className="mt-[8px] flex flex-wrap gap-[6px]">
            {otherFiles.map(f => (
              <span key={f.id} className="rounded-[8px] border bg-white px-[8px] py-[4px]" style={{ fontSize: 11.5, color: "#444" }}>
                {f.name} · {f.size}
              </span>
            ))}
          </div>
        )}
        {empty && (
          <div className="mt-[8px]" style={{ fontSize: 12.5, color: "#888" }}>
            저장된 원문이 없습니다. 캠페인명과 맥락만으로 복원된 이력입니다.
          </div>
        )}
      </div>
    </div>
  );
}

function AdminCasePack() {
  const s = useStore();
  if (!s.adminStatus && !s.appealNote && s.appealFiles.length === 0) return null;
  return (
    <div className="mt-[18px] rounded-[28px] border bg-white p-[22px]" style={{ borderColor: "#e5e5e5" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--accent)" }}>MANUAL REVIEW · 수기검수 패키지</div>
      <div className="mt-[8px]" style={{ fontSize: 16, fontWeight: 800 }}>관리자가 직접 검토할 자료</div>
      <div className="mt-[14px] rounded-[12px] border p-[14px]" style={{ borderColor: "#eee" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#777" }}>이의·증빙</div>
        <p className="mt-[8px]" style={{ fontSize: 12.5, color: "#333", lineHeight: 1.6 }}>
          {s.appealNote || (s.adminStatus === "pending" ? "이의 제기 없이 프로그램 통과 건입니다. 위 검수 요청 원문을 기준으로 승인하세요." : "제출된 사유가 없습니다.")}
        </p>
        {s.appealFiles.length > 0 && (
          <div className="mt-[10px] flex flex-wrap gap-[6px]">
            {s.appealFiles.map(f => (
              <AppealFileChip key={f.id} file={f} />
            ))}
          </div>
        )}
      </div>
      {(s.adminFeedback || s.adminFiles.length > 0 || s.decision) && (
        <div className="mt-[10px] rounded-[12px] border p-[14px]" style={{ borderColor: "#eee" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#777" }}>관리자 피드백</div>
          <p className="mt-[8px]" style={{ fontSize: 12.5, color: "#333", lineHeight: 1.6 }}>
            {s.decision ? `${decisionLabel(s.decision)}` : "작성 중"}
            {s.decisionNote ? ` · ${s.decisionNote}` : ""}
          </p>
          {s.adminFeedback && (
            <p className="mt-[6px]" style={{ fontSize: 12.5, color: "#333", lineHeight: 1.6 }}>{s.adminFeedback}</p>
          )}
          {s.adminFiles.length > 0 && (
            <div className="mt-[10px] flex flex-wrap gap-[6px]">
              {s.adminFiles.map(f => (
                <AppealFileChip key={f.id} file={f} />
              ))}
            </div>
          )}
        </div>
      )}
      {s.role === "admin" && (s.adminStatus === "pending" || s.adminStatus === "appeal") && (
        <div className="mt-[12px]" style={{ fontSize: 12.5, color: "#555" }}>
          아래 FINAL DECISION에서 피드백·레퍼런스를 남긴 뒤 승인·반려·조건부 승인할 수 있습니다.
        </div>
      )}
    </div>
  );
}

function ImagePreview({ file, onClose }: { file: PickedFile; onClose: () => void }) {
  const src = file.dataUrl || file.url || "";
  return (
    <div
      data-export-hide
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{ background: "rgba(10,10,10,0.88)", padding: 28 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative flex max-h-full max-w-full flex-col items-center"
      >
        <div className="mb-[10px] flex w-full items-center justify-between gap-[12px]" style={{ color: "#fff" }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{file.name}</span>
          <span
            onClick={onClose}
            className="cursor-pointer rounded-[8px] px-[10px] py-[6px]"
            style={{ background: "#fff", color: "#111", fontSize: 12, fontWeight: 700 }}
          >
            닫기
          </span>
        </div>
        <img
          src={src}
          alt={file.name}
          style={{ display: "block", maxWidth: "92vw", maxHeight: "82vh", objectFit: "contain", borderRadius: 8, background: "#fff" }}
        />
        <div className="mt-[8px]" style={{ fontSize: 11.5, color: "#bbb" }}>
          원본 비율 · 바깥을 클릭하거나 Esc로 닫기
        </div>
      </div>
    </div>
  );
}

function ReportFooter({ isFail, hasResult }: { isFail: boolean; hasResult: boolean }) {
  const s = useStore();
  const [reqMsg, setReqMsg] = useState("");
  const queued = s.adminStatus === "pending" || s.adminStatus === "appeal";
  const showRequest = s.role !== "admin" && isFail && hasResult && !!s.reviewId && !s.decision;

  return (
    <div className="mt-[22px] flex flex-wrap items-center justify-between gap-[10px]" data-export-hide>
      <div className="flex flex-wrap gap-[10px]">
        <div
          onClick={() => s.rescanFromReport()}
          className="cursor-pointer rounded-[12px] px-[18px] py-[12px]"
          style={{ background: "var(--ink)", color: "#fff", fontSize: 13, fontWeight: 700 }}
        >
          수정본으로 재검수
        </div>
        <div
          onClick={() => s.goHome()}
          className="cursor-pointer rounded-[12px] border bg-white px-[18px] py-[12px]"
          style={{ borderColor: "#e0e0e0", fontSize: 13, fontWeight: 700, color: "#555" }}
        >
          새 콘텐츠 검수
        </div>
      </div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-[10px]">
        {reqMsg && <span style={{ fontSize: 12, color: "#3f6b4a", fontWeight: 700 }}>{reqMsg}</span>}
        <div
          onClick={() => s.setScreen(s.openedFrom === "admin" ? "admin" : "history")}
          className="cursor-pointer rounded-[12px] border bg-white px-[18px] py-[12px]"
          style={{ borderColor: "#e0e0e0", fontSize: 13, fontWeight: 700, color: "#555" }}
        >
          {s.openedFrom === "admin" ? "결재대기로 돌아가기" : "이력으로 이동"}
        </div>
        {showRequest && (
          <div
            onClick={() => {
              if (queued) return;
              const ok = s.requestAdminReview();
              setReqMsg(ok ? "결재대기에 올렸습니다" : "요청에 실패했습니다");
            }}
            className="rounded-[12px] px-[18px] py-[12px]"
            style={{
              background: queued ? "#eee" : "var(--accent)",
              color: queued ? "#888" : "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: queued ? "default" : "pointer",
            }}
          >
            {queued ? "검토 요청됨" : "관리자 검토요청"}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminDecisionPanel({ externalsPending }: { externalsPending: boolean }) {
  const s = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).forEach(f => {
      const id = `rf-${Date.now()}-${f.name}`;
      s.addAdminFile({ id, name: f.name, size: formatSize(f.size) });
      const reader = new FileReader();
      reader.onload = () => s.patchAdminFile(id, { dataUrl: String(reader.result || "") });
      reader.readAsDataURL(f);
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="mt-[26px] rounded-[28px] border bg-white p-[22px]" style={{ borderColor: "#e5e5e5" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--accent)" }}>FINAL DECISION · 결재</div>
      <div className="mt-[6px]" style={{ fontSize: 13, color: "#666" }}>
        프로그램 결과와 관계없이 강제 승인·반려하거나, 보완 전제조건을 붙여 조건부 승인할 수 있습니다.
      </div>
      <textarea
        value={s.adminFeedback}
        onChange={e => s.setAdminFeedback(e.target.value)}
        placeholder="추가 피드백을 적어 주세요"
        className="mt-[12px] w-full resize-y rounded-[12px] border p-[12px] outline-none"
        style={{ borderColor: "#e5e5e5", background: "#fafafa", fontSize: 13, minHeight: 72, lineHeight: 1.55 }}
      />
      <input ref={fileRef} type="file" multiple className="hidden" onChange={e => pickFiles(e.target.files)} />
      <div className="mt-[10px] flex flex-wrap items-center gap-[8px]">
        <div
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-[8px] border bg-white px-[12px] py-[7px]"
          style={{ borderColor: "#e0e0e0", fontSize: 12, fontWeight: 700, color: "#555" }}
        >
          레퍼런스 자료 업로드
        </div>
        {s.adminFiles.map(f => (
          <span key={f.id} className="flex items-center gap-[6px] rounded-[8px] border bg-white px-[8px] py-[4px]" style={{ fontSize: 11.5, color: "#444" }}>
            <AppealFileChip file={f} />
            <span onClick={() => s.removeAdminFile(f.id)} className="cursor-pointer" style={{ color: "#999" }}>✕</span>
          </span>
        ))}
      </div>
      <textarea
        value={s.decisionNote}
        onChange={e => {
          setErr("");
          s.setDecisionNote(e.target.value);
        }}
        placeholder="결정 사유 또는 조건부 승인의 보완 전제조건"
        className="mt-[12px] w-full resize-y rounded-[12px] border p-[12px] outline-none"
        style={{ borderColor: "#e5e5e5", background: "#fafafa", fontSize: 13, minHeight: 68, lineHeight: 1.55 }}
      />
      <div className="mt-[12px] flex flex-wrap gap-[8px]">
        {([
          { k: "approve" as const, label: "승인" },
          { k: "reject" as const, label: "반려" },
          { k: "conditional" as const, label: "조건부 승인" },
        ]).map(d => {
          const active = s.decision === d.k;
          return (
            <div
              key={d.k}
              onClick={() => {
                if (externalsPending) return;
                const ok = s.resolveAdmin(d.k);
                setErr(ok ? "" : "조건부 승인은 보완 전제조건 또는 피드백을 적어 주세요.");
              }}
              className="rounded-[12px] border px-[18px] py-[10px]"
              style={{
                fontSize: 13,
                fontWeight: 700,
                background: active ? "var(--ink)" : "#fff",
                color: active ? "#fff" : "#555",
                borderColor: active ? "var(--ink)" : "#e0e0e0",
                opacity: externalsPending ? 0.45 : 1,
                pointerEvents: externalsPending ? "none" : "auto",
                cursor: externalsPending ? "not-allowed" : "pointer",
              }}
            >
              {d.label}
            </div>
          );
        })}
      </div>
      {externalsPending && (
        <div className="mt-[8px]" style={{ fontSize: 11.5, color: "#888" }}>
          외부 근거 확인 중 — 판정이 바뀌기 전에 결재할 수 없습니다.
        </div>
      )}
      {err && (
        <div className="mt-[8px]" style={{ fontSize: 12, color: "#a63232" }}>{err}</div>
      )}
      {s.decision && (
        <div className="mt-[10px] rounded-[10px] px-[12px] py-[8px]" style={{ background: "#f3faf5", color: "#3f6b4a", fontSize: 12.5, fontWeight: 700 }}>
          {decisionLabel(s.decision)}
          {s.decisionNote ? ` · ${s.decisionNote}` : ""}
          {s.adminFeedback ? ` · ${s.adminFeedback}` : ""}
          {" "}· 이력에 기록됨
        </div>
      )}
      <div className="mt-[8px]" style={{ fontSize: 11, color: "#999" }}>
        결재자 · 관리자 수기검수
      </div>
    </div>
  );
}

function AppealFileChip({ file }: { file: AppealFile }) {
  return (
    <span
      onClick={() => {
        if (file.dataUrl) window.open(file.dataUrl, "_blank", "noopener,noreferrer");
      }}
      className="rounded-[8px] border bg-white px-[8px] py-[4px]"
      style={{ fontSize: 11.5, color: "#444", cursor: file.dataUrl ? "pointer" : "default" }}
    >
      {file.name} · {file.size}
      {file.dataUrl ? " · 열기" : ""}
    </span>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RoutingPanel({ route, actions }: { route: ReviewRoute; actions: string[] }) {
  const s = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [appealErr, setAppealErr] = useState("");
  const tone = routeTone(route);
  const soft = actions.length ? actions.slice(0, 3) : ["표현을 한 번 더 다듬으면 관리자 승인 속도가 빨라질 수 있습니다."];

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).forEach(f => {
      const id = `af-${Date.now()}-${f.name}`;
      s.addAppealFile({ id, name: f.name, size: formatSize(f.size) });
      const reader = new FileReader();
      reader.onload = () => s.patchAppealFile(id, { dataUrl: String(reader.result || "") });
      reader.readAsDataURL(f);
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div id="cg-next-step" className="mt-[18px] rounded-[28px] border bg-white p-[22px]" style={{ borderColor: "#e5e5e5" }}>
      <div className="flex items-start justify-between gap-[12px]">
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "var(--accent)" }}>NEXT STEP · 다음 단계</div>
          <div className="mt-[8px]" style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.4px" }}>
            {routeLabel(route)}
          </div>
          <div className="mt-[6px]" style={{ fontSize: 12.5, color: "#666", lineHeight: 1.6 }}>
            {PASS_SCORE}점 이상은 프로그램 통과 후 관리자 승인 · {APPEAL_SCORE}–{PASS_SCORE - 1}점은 증빙을 올리면 수기검수 · {APPEAL_SCORE}점 미만은 수정 후 재검수
          </div>
        </div>
        <span className="whitespace-nowrap rounded-[8px] px-[10px] py-[5px]" style={{ fontSize: 11.5, fontWeight: 800, background: s.decision ? "#f3faf5" : tone.bg, color: s.decision ? "#3f6b4a" : tone.fg }}>
          {s.decision ? `관리자 ${decisionLabel(s.decision)}` : routeRecommendation(route)}
        </span>
      </div>

      {route === "pass_manual" && (
        <div className="mt-[14px] rounded-[14px] border p-[14px]" style={{ borderColor: "#dce8df", background: "#f7fbf8" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#3f6b4a" }}>프로그램 통과 · 관리자 승인 대기</div>
          <p className="mt-[6px]" style={{ fontSize: 12.5, color: "#555", lineHeight: 1.65 }}>
            배포 차단 사유는 아닙니다. 아래는 필수 수정이 아니라 추가 보완 권장입니다.
          </p>
          <ul className="mt-[8px] list-disc space-y-[4px] pl-[18px]" style={{ fontSize: 12.5, color: "#444" }}>
            {soft.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {route === "blocked" && (
        <div className="mt-[14px] rounded-[14px] border p-[14px]" style={{ borderColor: "#f1dcdc", background: "#fdf6f6" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#a63232" }}>{APPEAL_SCORE}점 미만 · 수정 후 재검수</div>
          <p className="mt-[6px]" style={{ fontSize: 12.5, color: "#555", lineHeight: 1.65 }}>
            이 점수대는 바로 수기검수로 넘길 수 없습니다. 대안 문구를 반영한 뒤 재검수하세요.
          </p>
        </div>
      )}

      {route === "appeal_review" && (
        <div className="mt-[14px] rounded-[14px] border p-[14px]" style={{ borderColor: "#d7e0f0", background: "#f6f8fc" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2f4f8a" }}>이의 제기됨 · 관리자 수기검수 대기</div>
          <p className="mt-[6px]" style={{ fontSize: 12.5, color: "#555", lineHeight: 1.65 }}>
            {s.appealNote || "제출한 증빙과 보완 자료를 관리자가 직접 검토합니다."}
          </p>
          {s.appealFiles.length > 0 && (
            <div className="mt-[8px] flex flex-wrap gap-[6px]">
              {s.appealFiles.map(f => (
                <AppealFileChip key={f.id} file={f} />
              ))}
            </div>
          )}
        </div>
      )}

      {route === "appeal_eligible" && (
        <div className="mt-[14px] rounded-[14px] border p-[14px]" style={{ borderColor: "#efe3cf", background: "#fffaf2" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#8a5a20" }}>프로그램 오류를 감안한 이의 제기</div>
          <p className="mt-[6px]" style={{ fontSize: 12.5, color: "#555", lineHeight: 1.65 }}>
            {APPEAL_SCORE}점 이상 {PASS_SCORE}점 미만입니다. 추가 증빙·보완 자료를 올리면 관리자 수기검수로 바로 넘길 수 있습니다.
          </p>
          <textarea
            value={s.appealNote}
            onChange={e => {
              setAppealErr("");
              s.setAppealNote(e.target.value);
            }}
            placeholder="이의 사유와 보완 내용을 적어 주세요"
            className="mt-[10px] w-full resize-y rounded-[12px] border bg-white p-[12px] outline-none"
            style={{ borderColor: "#e5e5e5", fontSize: 13, minHeight: 72, lineHeight: 1.55 }}
          />
          <input ref={fileRef} type="file" multiple className="hidden" onChange={e => pickFiles(e.target.files)} />
          <div className="mt-[10px] flex flex-wrap items-center gap-[8px]">
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-[8px] border bg-white px-[12px] py-[7px]"
              style={{ borderColor: "#e0e0e0", fontSize: 12, fontWeight: 700, color: "#555" }}
            >
              증빙·보완 자료 업로드
            </div>
            <div
              onClick={() => {
                const ok = s.submitAppeal();
                setAppealErr(ok ? "" : "이의 사유 또는 증빙 자료를 추가해 주세요.");
              }}
              className="cursor-pointer rounded-[8px] px-[14px] py-[7px]"
              style={{ background: "var(--ink)", color: "#fff", fontSize: 12, fontWeight: 700 }}
            >
              관리자 수기검수 요청
            </div>
          </div>
          {s.appealFiles.length > 0 && (
            <div className="mt-[10px] flex flex-wrap gap-[6px]">
              {s.appealFiles.map(f => (
                <span key={f.id} className="flex items-center gap-[6px] rounded-[8px] border bg-white px-[8px] py-[4px]" style={{ fontSize: 11.5, color: "#444" }}>
                  <AppealFileChip file={f} />
                  <span onClick={() => s.removeAppealFile(f.id)} className="cursor-pointer" style={{ color: "#999" }}>
                    ✕
                  </span>
                </span>
              ))}
            </div>
          )}
          {appealErr && (
            <div className="mt-[8px]" style={{ fontSize: 12, color: "#a63232" }}>
              {appealErr}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
