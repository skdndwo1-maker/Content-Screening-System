"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useStore } from "@/lib/store";
import type { Screen } from "@/lib/types";

type NavItem = { k: Screen; ko: string; en: string; icon: string; adminOnly?: boolean };

const NAV: NavItem[] = [
  { k: "upload", ko: "콘텐츠 검수", en: "SCREENING", icon: "✎" },
  { k: "history", ko: "검수 이력", en: "HISTORY", icon: "⟲" },
  { k: "admin", ko: "결재대기", en: "APPROVAL", icon: "◆", adminOnly: true },
];

export function Sidebar() {
  const { screen, role, setScreen, setRole, goHome, sourceFlags, hydrateSourceFlags, historyRows } = useStore();
  const waitCount = historyRows.filter(r => !r.deletedAt && (r.adminStatus === "pending" || r.adminStatus === "appeal")).length;
  useEffect(() => {
    hydrateSourceFlags();
  }, [hydrateSourceFlags]);
  const flowScreens: Screen[] = ["upload", "analysis", "report"];
  const activeNav: Screen = flowScreens.includes(screen) ? "upload" : screen;

  const userName = "주현";
  const userRoleLabel = role === "admin" ? "브랜드마케팅팀 · 관리자" : "브랜드마케팅팀";

  return (
    <aside className="flex h-screen w-[236px] flex-none flex-col text-white" style={{ background: "#0a0a0a" }}>
      <div className="border-b px-[22px] pt-[26px] pb-[22px]" style={{ borderColor: "#222" }}>
        <div
          onClick={goHome}
          className="flex cursor-pointer items-center gap-2 hover:opacity-80"
          style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px", lineHeight: 1 }}
          title="첫 화면으로"
        >
          <span className="inline-block" style={{ width: 7, height: 7, background: "var(--accent)", borderRadius: 2 }} />
          CSS Agent
        </div>
        <div className="mt-[6px] uppercase" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "1.6px", color: "#888" }}>
          CONTENT SCREENING SYSTEM
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-[2px] p-[12px] pt-[16px]">
        <div className="px-[12px] pt-[8px] pb-[6px]" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "#666" }}>
          WORKSPACE
        </div>
        {NAV.filter(n => !n.adminOnly || role === "admin").map(n => {
          const active = activeNav === n.k;
          return (
            <div
              key={n.k}
              onClick={() => (n.k === "upload" ? goHome() : setScreen(n.k))}
              className="group relative flex cursor-pointer items-center gap-[12px] rounded-[8px] px-[12px] py-[10px] hover:bg-[#1a1a1a]"
              style={{ background: active ? "#1a1a1a" : "transparent" }}
            >
              {active && (
                <span
                  className="absolute left-0 top-[12px] bottom-[12px] w-[3px] rounded-r"
                  style={{ background: "var(--accent)" }}
                />
              )}
              <span className="w-[20px] text-center" style={{ fontSize: 16 }}>
                {n.icon}
              </span>
              <div className="flex-1">
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>{n.ko}</div>
                <div className="flex items-center gap-[6px]">
                  <div
                    style={{
                      fontSize: 9.5,
                      letterSpacing: "1px",
                      fontWeight: 600,
                      color: active ? "var(--accent)" : "#666",
                    }}
                  >
                    {n.en}
                  </div>
                  {n.k === "admin" && waitCount > 0 && (
                    <span className="rounded-[8px] px-[6px] py-[1px]" style={{ background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 800 }}>
                      {waitCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="mt-auto border-t px-[12px] pt-[14px]" style={{ borderColor: "#222" }}>
          <div className="mb-[10px]" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: "#666" }}>
            DATA SOURCES
          </div>
          <div className="flex flex-col gap-[9px]">
            <SourceDot color="#F34182" ko="AI 추론" sub="Gemini" ai />
            <SourceDot color="var(--accent)" ko="웹 검색" sub={sourceFlags.websearch ? "Google Search" : "준비 중"} muted={!sourceFlags.websearch} />
            <SourceDot color="#666" ko="Grok" sub={sourceFlags.grok ? "X / SNS 실시간" : "준비 중"} muted={!sourceFlags.grok} />
            <SourceDot color="#666" ko="Naver" sub={sourceFlags.naver ? "국내 뉴스" : "준비 중"} muted={!sourceFlags.naver} />
          </div>
        </div>
      </nav>

      <div className="border-t px-[22px] py-[14px]" style={{ borderColor: "#222" }}>
        <div className="flex items-center gap-[10px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full" style={{ background: "#333", fontSize: 12, fontWeight: 700 }}>
            {userName[0]}
          </div>
          <div className="min-w-0 flex-1" style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{userName}</div>
            <div style={{ fontSize: 10, color: "#777" }}>{userRoleLabel}</div>
          </div>
        </div>
        <div className="mt-[10px] flex gap-[4px] rounded-[8px] p-[3px]" style={{ background: "#1a1a1a" }}>
          {(["user", "admin"] as const).map(r => (
            <div
              key={r}
              onClick={() => setRole(r)}
              className="flex-1 cursor-pointer rounded-[6px] py-[6px] text-center transition"
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                background: role === r ? "#fff" : "transparent",
                color: role === r ? "#111" : "#999",
              }}
            >
              {r === "user" ? "일반 사용자" : "관리자"}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SourceDot({ color, ko, sub, ai, muted }: { color: string; ko: string; sub: string; ai?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center gap-[8px]" style={{ fontSize: 11.5, color: muted ? "#777" : "#bbb" }} title={muted ? "현재 비활성화된 소스입니다" : undefined}>
      {ai ? (
        <span className="relative flex h-[14px] w-[14px] items-center justify-center overflow-hidden rounded-full" style={{ background: "#fff" }}>
          <Image src="/uplus-logo.jpeg" alt="U+" width={14} height={14} />
        </span>
      ) : (
        <span
          className="inline-block"
          style={{ width: 7, height: 7, borderRadius: "50%", background: muted ? "#555" : color, boxShadow: muted ? "none" : `0 0 8px ${color}` }}
        />
      )}
      {ko} <span style={{ color: "#666" }}>{sub}</span>
    </div>
  );
}
