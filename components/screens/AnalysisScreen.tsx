"use client";

import { useStore } from "@/lib/store";
import type { PipeStage } from "@/lib/types";

type Stage = {
  title: string;
  en: string;
  sources: string;
  description: string;
};

const STAGES: Stage[] = [
  { title: "규정 RAG + Gemini 판정", en: "AI · COMPLIANCE RAG", sources: "GEMINI · TAXONOMY · RAG", description: "활성 택소노미 기준으로 지식베이스를 검색한 뒤 구조화 판정" },
  { title: "실시간 여론 검증", en: "GROK · X", sources: "GROK · X", description: "X 실시간 여론 · 연동 예정" },
  { title: "국내 뉴스 사례 매칭", en: "NAVER NEWS", sources: "NAVER NEWS", description: "국내 뉴스 · 연동 예정 (API HUB 신청 중)" },
  { title: "사용 가능 여부 판단", en: "CROSS-CHECK", sources: "최저 사용 가능 점수", description: "개별 항목 중 가장 낮은 사용 가능 점수로 종합" },
];

export function AnalysisScreen() {
  const { pipeStatus, liveTexts, pipelineDone, gotoReport, sourceFlags } = useStore();

  return (
    <div className="cg-rise mx-auto px-[34px] pt-[30px] pb-[48px]" style={{ maxWidth: 920 }}>
      <div className="mb-[24px]">
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "var(--accent)" }}>STEP 02 — ANALYSIS</div>
        <h1 className="mt-[8px]" style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.8px", lineHeight: 1 }}>
          교차 검증 진행 중
        </h1>
        <p className="mt-[10px]" style={{ fontSize: 14, color: "#666", maxWidth: 560 }}>
          검수 기준과 컴플라이언스 RAG를 Gemini에 주입해 판정합니다. 연동되지 않은 외부 소스는 건너뜁니다.
        </p>
      </div>

      <div className="flex flex-col gap-[14px]">
        {STAGES.map((s, i) => (
          <StageCard
            key={i}
            stage={s}
            index={i}
            status={i === 1 && !sourceFlags.grok ? "empty" : i === 2 && !sourceFlags.naver ? "empty" : pipeStatus[i]}
            liveText={liveTexts[i]}
            locked={(i === 1 && !sourceFlags.grok) || (i === 2 && !sourceFlags.naver)}
          />
        ))}
      </div>

      {pipelineDone && (
        <div className="mt-[28px] flex flex-col items-center gap-[12px]">
          <div
            onClick={gotoReport}
            className="cg-neon-hover flex cursor-pointer items-center gap-[12px] rounded-[20px] px-[34px] py-[16px]"
            style={{ background: "#000", color: "#fff", fontWeight: 800, fontSize: 15.5 }}
          >
            검증 완료 · 리포트 보기 <span>→</span>
          </div>
          <div style={{ fontSize: 11, color: "#999" }}>종합 판정 결과를 확인하세요.</div>
        </div>
      )}
    </div>
  );
}

function StageCard({
  stage,
  index,
  status,
  liveText,
  locked,
}: {
  stage: Stage;
  index: number;
  status: PipeStage;
  liveText: string;
  locked?: boolean;
}) {
  const isActive = status === "active";
  const isDone = status === "done";
  const isPending = status === "pending";
  const isFail = status === "fail";
  const isEmpty = status === "empty";

  const borderColor = isActive ? "var(--ink)" : isDone ? "#dcdcdc" : isFail ? "#a63232" : "#eee";
  const bg = "#fff";

  return (
    <div
      className="relative overflow-hidden rounded-[20px] border bg-white"
      style={{ borderColor, background: bg, opacity: isPending || isEmpty ? 0.55 : 1 }}
    >
      <div className="flex items-center gap-[16px] p-[18px]">
        <div
          className={`flex h-[42px] w-[42px] items-center justify-center rounded-full ${isActive ? "cg-pulse" : ""}`}
          style={{
            fontSize: 15,
            fontWeight: 800,
            background: isDone ? "#eef7ef" : isActive ? "var(--ink)" : isFail ? "#fdf2f2" : "#f5f5f5",
            color: isDone ? "#3f6b4a" : isActive ? "#fff" : isFail ? "#a63232" : "#999",
          }}
        >
          {isDone ? "✓" : isFail ? "!" : `0${index + 1}`}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-[8px]">
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{stage.title}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "#aaa" }}>{stage.en}</div>
            {isDone && (
              <span className="ml-auto rounded-[6px] px-[8px] py-[2px]" style={{ fontSize: 10.5, fontWeight: 700, background: "#eef7ef", color: "#3f6b4a" }}>
                완료
              </span>
            )}
            {isActive && (
              <span className="ml-auto rounded-[6px] px-[8px] py-[2px]" style={{ fontSize: 10.5, fontWeight: 700, background: "var(--ink)", color: "#fff" }}>
                진행 중
              </span>
            )}
            {isFail && (
              <span className="ml-auto rounded-[6px] px-[8px] py-[2px]" style={{ fontSize: 10.5, fontWeight: 700, background: "#fdf2f2", color: "#a63232" }}>
                실패
              </span>
            )}
            {isPending && (
              <span className="ml-auto rounded-[6px] px-[8px] py-[2px]" style={{ fontSize: 10.5, fontWeight: 700, background: "#f3f3f3", color: "#aaa" }}>
                대기 중…
              </span>
            )}
            {isEmpty && (
              <span className="ml-auto rounded-[6px] px-[8px] py-[2px]" style={{ fontSize: 10.5, fontWeight: 700, background: "#f3f3f3", color: "#888" }}>
                {locked ? "🔒 연동 예정" : "미연동"}
              </span>
            )}
          </div>
          <div className="mt-[4px]" style={{ fontSize: 11.5, color: "#888" }}>
            {stage.sources}
          </div>
          <div
            className="mt-[10px] rounded-[12px] px-[12px] py-[9px]"
            style={{ background: "#fafafa", fontSize: 12, color: "#444", lineHeight: 1.5, minHeight: 36 }}
          >
            {liveText || stage.description}
          </div>
          {locked && (
            <div className="mt-[8px]" style={{ fontSize: 11.5, color: "#999" }} title="현재 비활성화된 소스입니다">
              현재 비활성화된 소스입니다
            </div>
          )}
        </div>
      </div>
      {isActive && (
        <div className="relative h-[3px] w-full" style={{ background: "#eee" }}>
          <div className="cg-bar absolute inset-0" style={{ background: "var(--accent)" }} />
        </div>
      )}
    </div>
  );
}
