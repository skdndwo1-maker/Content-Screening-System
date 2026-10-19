"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { decisionLabel, routeLabel } from "@/lib/review/routing";
import type { AdminStatus } from "@/lib/types";

const FILTERS: { k: AdminStatus; label: string }[] = [
  { k: "pending", label: "결재 대기" },
  { k: "appeal", label: "이의 제기" },
  { k: "done", label: "처리 완료" },
];

export function AdminScreen() {
  const { adminFilter, openReview, historyRows, hydrateHistory } = useStore();
  useEffect(() => {
    hydrateHistory();
  }, [hydrateHistory]);
  const queued = historyRows.filter(r => !r.deletedAt && r.adminStatus);
  const filtered = queued.filter(r => r.adminStatus === adminFilter);

  return (
    <div className="cg-rise mx-auto px-[34px] pt-[30px] pb-[48px]" style={{ maxWidth: 1280 }}>
      <div className="mb-[20px]">
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "var(--accent)" }}>WORKSPACE · APPROVAL</div>
        <h1 className="mt-[8px]" style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.8px", lineHeight: 1 }}>
          결재대기
        </h1>
        <p className="mt-[8px]" style={{ fontSize: 13, color: "#666" }}>
          프로그램 통과, 이의 제기, 수동 검토 요청 건에 피드백·레퍼런스를 남기고 승인·반려·조건부 승인할 수 있습니다.
        </p>
      </div>

      <div className="mb-[16px] flex gap-[8px]">
        {FILTERS.map(f => {
          const active = adminFilter === f.k;
          const count = queued.filter(r => r.adminStatus === f.k).length;
          return (
            <div
              key={f.k}
              onClick={() => useStore.setState({ adminFilter: f.k })}
              className="cursor-pointer rounded-[20px] border px-[14px] py-[7px]"
              style={{
                fontSize: 12,
                fontWeight: 700,
                background: active ? "var(--ink)" : "#fff",
                color: active ? "#fff" : "#555",
                borderColor: active ? "var(--ink)" : "#e0e0e0",
              }}
            >
              {f.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>{count}</span>
            </div>
          );
        })}
      </div>

      <div className="rounded-[20px] border bg-white" style={{ borderColor: "#e5e5e5" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              {["제출자", "프로젝트", "점수", "라우팅", "처리 상태", "요청·증빙", ""].map(h => (
                <th key={h} className="whitespace-nowrap px-[14px] py-[10px] text-left" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", color: "#888" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} onClick={() => openReview(r.id, "admin")} className="cursor-pointer border-t hover:bg-[#fafafa]" style={{ borderColor: "#f0f0f0" }}>
                <td className="px-[14px] py-[12px]" style={{ fontSize: 12.5, fontWeight: 600 }}>{r.author}</td>
                <td className="px-[14px] py-[12px]" style={{ fontSize: 13 }}>{r.campaign}</td>
                <td className="px-[14px] py-[12px]">
                  <div className="flex items-center gap-[8px]">
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{r.score}</span>
                    <GradeBadge grade={r.grade} />
                  </div>
                </td>
                <td className="px-[14px] py-[12px]" style={{ fontSize: 11.5, color: "#555" }}>
                  {r.reviewRoute ? routeLabel(r.reviewRoute) : "—"}
                </td>
                <td className="px-[14px] py-[12px]" style={{ fontSize: 11.5 }}>
                  {r.adminStatus === "pending" && <span className="rounded-[6px] px-[8px] py-[2px]" style={{ background: "#fff8ee", color: "#8a5a20", fontWeight: 700 }}>결재 대기</span>}
                  {r.adminStatus === "appeal" && <span className="rounded-[6px] px-[8px] py-[2px]" style={{ background: "#fff3f3", color: "#a63232", fontWeight: 700 }}>이의 제기</span>}
                  {r.adminStatus === "done" && (
                    <span className="rounded-[6px] px-[8px] py-[2px]" style={{ background: "#eef7ef", color: "#3f6b4a", fontWeight: 700 }}>
                      {decisionLabel(r.decision)}
                    </span>
                  )}
                </td>
                <td className="px-[14px] py-[12px]" style={{ fontSize: 11.5, color: "#666", maxWidth: 220 }}>
                  {r.appealNote || r.adminFeedback || (r.appealFiles?.length ? r.appealFiles.map(f => f.name).join(", ") : "—")}
                </td>
                <td className="px-[14px] py-[12px]" style={{ fontSize: 11, color: "#888" }}>→ 상세</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-[14px] py-[22px] text-center" style={{ fontSize: 12.5, color: "#999" }}>
                  해당 상태의 결재 건이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
