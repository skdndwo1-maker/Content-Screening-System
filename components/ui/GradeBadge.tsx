"use client";

import type { Grade } from "@/lib/types";

const META: Record<Grade, { ko: string; en: string; shape: string; color: string }> = {
  high: { ko: "위험", en: "HIGH", shape: "▲", color: "#a63232" },
  med: { ko: "주의", en: "MED", shape: "△", color: "#b7862f" },
  unverified: { ko: "미검증", en: "UNVERIFIED", shape: "○", color: "#9ca3af" },
  low: { ko: "안전", en: "LOW", shape: "●", color: "#3f6b4a" },
};

export function GradeBadge({ grade, size = "sm" }: { grade: Grade; size?: "sm" | "md" }) {
  const m = META[grade];
  const padding = size === "sm" ? "3px 9px" : "5px 12px";
  const fs = size === "sm" ? 11 : 13;
  return (
    <span
      className="inline-flex items-center gap-[5px] rounded-[8px] font-bold"
      style={{ padding, fontSize: fs, border: `1px solid ${m.color}40`, color: m.color, background: `${m.color}10` }}
    >
      <span style={{ fontSize: fs + 1, lineHeight: 1 }}>{m.shape}</span> {m.ko} <span style={{ opacity: 0.55, fontSize: fs - 2 }}>{m.en}</span>
    </span>
  );
}

export const gradeMeta = META;
