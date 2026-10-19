"use client";

import { useStore } from "@/lib/store";
import type { Screen } from "@/lib/types";

const STEPS: { k: Screen; ko: string; en: string; num: string }[] = [
  { k: "upload", ko: "콘텐츠 업로드", en: "UPLOAD", num: "01" },
  { k: "analysis", ko: "교차 검증", en: "ANALYSIS", num: "02" },
  { k: "report", ko: "결과 리포트", en: "REPORT", num: "03" },
];

export function WizardBar() {
  const { screen, ctxName } = useStore();
  const flow: Screen[] = ["upload", "analysis", "report"];
  if (!flow.includes(screen)) return null;
  const idx = flow.indexOf(screen);

  return (
    <div
      className="cg-wizard sticky top-0 z-20 flex h-[60px] items-center justify-between border-b bg-white px-[34px]"
      style={{ borderColor: "#e5e5e5" }}
    >
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const done = i < idx;
          const current = i === idx;
          const num = done ? "✓" : s.num;
          const numStyle = {
            width: 26,
            height: 26,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center" as const,
            justifyContent: "center" as const,
            fontSize: 11.5,
            fontWeight: 800,
            background: current ? "var(--accent)" : done ? "var(--ink)" : "#f0f0f0",
            color: current ? "#fff" : done ? "#fff" : "#999",
          };
          const txtColor = current ? "var(--accent)" : done ? "var(--ink)" : "#999";
          return (
            <div key={s.k} className="flex items-center gap-[10px]">
              <div style={numStyle}>{num}</div>
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: txtColor }}>{s.ko}</div>
                <div style={{ fontSize: 9, letterSpacing: "1px", color: "#aaa", fontWeight: 600 }}>{s.en}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-[14px]" style={{ width: 44, height: 1, background: done ? "var(--ink)" : "#e0e0e0" }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: "#888" }}>
        프로젝트 <b style={{ color: "var(--ink)", marginLeft: 4 }}>{ctxName || "제목 없음"}</b>
      </div>
    </div>
  );
}
