"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { daysLeft } from "@/lib/history";
import { GradeBadge, gradeMeta } from "@/components/ui/GradeBadge";
import { routeLabel } from "@/lib/review/routing";
import type { Grade, HistoryRow } from "@/lib/types";

const TYPE_TABS: { k: string; ko: string; en: string }[] = [
  { k: "all", ko: "전체", en: "ALL" },
  { k: "이미지", ko: "이미지·디자인", en: "IMAGE" },
  { k: "카피", ko: "카피·네이밍", en: "COPY" },
  { k: "텍스트", ko: "텍스트", en: "TEXT" },
];

type ConfirmKind = "trash" | "restore" | "purge" | "trashAll" | "purgeAll";

export function HistoryScreen() {
  const {
    role,
    hf,
    sortKey,
    setSortKey,
    openReview,
    historyRows,
    hydrateHistory,
    trashHistory,
    restoreHistory,
    purgeHistory,
    trashAllHistory,
    purgeAllTrash,
  } = useStore();
  const [typeTab, setTypeTab] = useState<string>("all");
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; row?: HistoryRow } | null>(null);
  const isAdmin = role === "admin";
  const inTrash = typeTab === "trash";

  useEffect(() => {
    hydrateHistory();
  }, [hydrateHistory]);

  const live = historyRows.filter(r => !r.deletedAt);
  const trash = historyRows.filter(r => Boolean(r.deletedAt));
  const source = inTrash ? trash : live;
  const filtered = source.filter(r => (inTrash || typeTab === "all" ? true : r.type === typeTab || (typeTab === "카피" && r.type === "네이밍")));
  const sorted = [...filtered].sort((a, b) => {
    if (inTrash) return (b.deletedAt || "").localeCompare(a.deletedAt || "");
    if (sortKey === "recent") return b.reviewedAt.localeCompare(a.reviewedAt);
    if (sortKey === "upcoming") return a.publishDate.localeCompare(b.publishDate);
    if (sortKey === "risk") return a.score - b.score;
    if (sortKey === "name") return a.campaign.localeCompare(b.campaign);
    return 0;
  });

  const total = live.length;
  const counts = live.reduce<Record<Grade, number>>(
    (acc, r) => ({ ...acc, [r.grade]: (acc[r.grade] || 0) + 1 }),
    { high: 0, med: 0, unverified: 0, low: 0 }
  );

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === "trash" && confirm.row) trashHistory(confirm.row.id);
    if (confirm.kind === "restore" && confirm.row) restoreHistory(confirm.row.id);
    if (confirm.kind === "purge" && confirm.row) purgeHistory(confirm.row.id);
    if (confirm.kind === "trashAll") trashAllHistory();
    if (confirm.kind === "purgeAll") purgeAllTrash();
    setConfirm(null);
  };

  return (
    <div className="cg-rise px-[34px] pt-[30px] pb-[48px]" style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div className="mb-[20px]">
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "var(--accent)" }}>WORKSPACE · HISTORY</div>
        <h1 className="mt-[8px]" style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.8px", lineHeight: 1 }}>
          검수 이력
        </h1>
      </div>

      <div className="grid gap-[12px]" style={{ gridTemplateColumns: "1fr 2fr" }}>
        <div className="rounded-[20px] p-[18px]" style={{ background: "#0a0a0a", color: "#fff" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.5px", color: "#aaa" }}>누적</div>
          <div className="mt-[6px] flex items-end gap-[8px]">
            <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 5 }}>건</div>
          </div>
          <div className="mt-[8px]" style={{ fontSize: 11, color: "#888" }}>
            휴지통 {trash.length}건 · 7일 후 영구삭제
          </div>
        </div>
        <div className="grid gap-[12px]" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          {(["high", "med", "unverified", "low"] as Grade[]).map(g => {
            const m = gradeMeta[g];
            const sub = g === "high" ? "배포 보류 권장" : g === "med" ? "수정 권장" : g === "unverified" ? "외부 검증 데이터 없음" : "특이사항 없음";
            return (
              <div key={g} className="rounded-[20px] border bg-white p-[16px]" style={{ borderColor: "#e5e5e5" }}>
                <div className="flex items-baseline justify-between">
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>
                    <span style={{ color: m.color }}>{m.shape}</span> {m.ko}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>{counts[g] || 0}</div>
                </div>
                <div className="mt-[8px]" style={{ fontSize: 10.5, color: "#999" }}>
                  {sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-[22px] flex gap-[0] overflow-hidden border-b" style={{ borderColor: "#e5e5e5" }}>
        {TYPE_TABS.map(t => {
          const count = t.k === "all" ? total : live.filter(r => r.type === t.k || (t.k === "카피" && r.type === "네이밍")).length;
          const active = typeTab === t.k;
          return (
            <div
              key={t.k}
              onClick={() => setTypeTab(t.k)}
              className="flex cursor-pointer items-center gap-[6px] whitespace-nowrap px-[16px] py-[11px]"
              style={{
                fontSize: 12.5,
                fontWeight: active ? 800 : 600,
                color: active ? "var(--ink)" : "#888",
                borderBottom: `2px solid ${active ? "var(--ink)" : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {t.ko}
              <span className="rounded-[6px] px-[6px] py-[1px]" style={{ fontSize: 10.5, fontWeight: 700, background: active ? "var(--ink)" : "#f0f0f0", color: active ? "#fff" : "#777" }}>
                {count}
              </span>
            </div>
          );
        })}
        <div
          onClick={() => setTypeTab("trash")}
          className="ml-auto flex cursor-pointer items-center gap-[6px] whitespace-nowrap px-[16px] py-[11px]"
          style={{
            fontSize: 12.5,
            fontWeight: inTrash ? 800 : 600,
            color: inTrash ? "#a63232" : "#888",
            borderBottom: `2px solid ${inTrash ? "#a63232" : "transparent"}`,
            marginBottom: -1,
          }}
        >
          휴지통
          <span className="rounded-[6px] px-[6px] py-[1px]" style={{ fontSize: 10.5, fontWeight: 700, background: inTrash ? "#a63232" : "#f0f0f0", color: inTrash ? "#fff" : "#777" }}>
            {trash.length}
          </span>
        </div>
      </div>

      <div className="mt-[16px] grid gap-[16px]" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
        <div className="rounded-[20px] border bg-white" style={{ borderColor: "#e5e5e5" }}>
          <div className="flex items-center justify-between border-b p-[14px]" style={{ borderColor: "#eee" }}>
            <div className="flex items-center gap-[6px]" style={{ fontSize: 11.5, color: "#888" }}>
              <span>{inTrash ? "삭제 후 7일간 보관" : "필터"}</span>
              {!inTrash && hf.period !== "all" && (
                <span className="rounded-[6px] px-[8px] py-[2px]" style={{ background: "#f3f3f3", fontWeight: 700, color: "#555" }}>
                  기간 · {hf.period}
                </span>
              )}
            </div>
            <div className="flex items-center gap-[8px]">
              {!inTrash && live.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirm({ kind: "trashAll" })}
                  className="rounded-[8px] border bg-white px-[10px] py-[6px]"
                  style={{ borderColor: "#e0e0e0", fontSize: 12, fontWeight: 700, color: "#a63232" }}
                >
                  모두 삭제
                </button>
              )}
              {inTrash && trash.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirm({ kind: "purgeAll" })}
                  className="rounded-[8px] border bg-white px-[10px] py-[6px]"
                  style={{ borderColor: "#e0e0e0", fontSize: 12, fontWeight: 700, color: "#a63232" }}
                >
                  모두 영구삭제
                </button>
              )}
              {!inTrash && (
                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value as never)}
                  className="rounded-[8px] border bg-white px-[10px] py-[6px]"
                  style={{ borderColor: "#e0e0e0", fontSize: 12, fontWeight: 600, color: "#333" }}
                >
                  <option value="recent">최신순</option>
                  <option value="upcoming">게시 임박순</option>
                  <option value="risk">사용 가능 낮은순</option>
                  <option value="name">캠페인명순</option>
                </select>
              )}
            </div>
          </div>

          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["TYPE", "캠페인/검수 대상", "게시 예정", "채널", ...(isAdmin ? ["제출자"] : []), "RISK", inTrash ? "남은 기간" : "검수 일시"].map(h => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-[14px] py-[10px] text-left"
                    style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", color: "#888" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <HistoryRowCmp
                  key={r.id}
                  row={r}
                  isAdmin={isAdmin}
                  inTrash={inTrash}
                  onOpen={() => {
                    if (!inTrash) openReview(r.id, "history");
                  }}
                  onTrash={() => setConfirm({ kind: "trash", row: r })}
                  onRestore={() => setConfirm({ kind: "restore", row: r })}
                  onPurge={() => setConfirm({ kind: "purge", row: r })}
                />
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-[14px] py-[22px] text-center" style={{ fontSize: 12.5, color: "#999" }}>
                    {inTrash ? "휴지통이 비어 있습니다" : "조건에 해당하는 검수 건이 없습니다"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-[12px]">
          <div className="rounded-[20px] border bg-white p-[16px]" style={{ borderColor: "#e5e5e5" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", color: "#777" }}>RISK BY TYPE</div>
            <div className="mt-[12px] flex flex-col gap-[8px]">
              {TYPE_TABS.filter(t => t.k !== "all").map(t => {
                const rows = live.filter(r => r.type === t.k || (t.k === "카피" && r.type === "네이밍"));
                const high = rows.filter(r => r.grade === "high").length;
                const med = rows.filter(r => r.grade === "med").length;
                const low = rows.filter(r => r.grade === "low").length;
                const typeTotal = rows.length || 1;
                return (
                  <div key={t.k}>
                    <div className="flex items-baseline justify-between">
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{t.ko}</span>
                      <span style={{ fontSize: 11, color: "#888" }}>{rows.length}건</span>
                    </div>
                    <div className="mt-[4px] flex overflow-hidden rounded-[6px]" style={{ height: 6, background: "#f3f3f3" }}>
                      <div style={{ width: `${(high / typeTotal) * 100}%`, background: "#a63232" }} />
                      <div style={{ width: `${(med / typeTotal) * 100}%`, background: "#b7862f" }} />
                      <div style={{ width: `${(low / typeTotal) * 100}%`, background: "#3f6b4a" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[20px] border bg-white p-[16px]" style={{ borderColor: "#e5e5e5" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", color: "#777" }}>INSIGHT</div>
            <p className="mt-[8px]" style={{ fontSize: 12.5, color: "#444", lineHeight: 1.6 }}>
              {inTrash
                ? "삭제한 이력은 7일간 휴지통에 보관됩니다. 기간 안에는 복구할 수 있고, 당장 영구삭제할 수도 있습니다. 7일이 지나면 자동으로 사라집니다."
                : "삭제한 이력은 휴지통에서 7일간 보관됩니다. 지금은 브라우저에만 저장되며, 이후 DB 연동 시 같은 정책을 그대로 가져갑니다."}
            </p>
          </div>
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-[22px]">
          <div className="w-full max-w-[420px] rounded-[20px] bg-white p-[22px] shadow-xl">
            <div style={{ fontSize: 14, fontWeight: 800 }}>{confirmTitle(confirm.kind, confirm.row)}</div>
            <p className="mt-[8px]" style={{ fontSize: 12.5, color: "#555", lineHeight: 1.6 }}>
              {confirmBody(confirm.kind)}
            </p>
            <div className="mt-[14px] flex justify-end gap-[8px]">
              <div
                onClick={() => setConfirm(null)}
                className="cursor-pointer rounded-[8px] border bg-white px-[14px] py-[7px]"
                style={{ borderColor: "#e0e0e0", fontSize: 12, fontWeight: 700, color: "#555" }}
              >
                취소
              </div>
              <div
                onClick={runConfirm}
                className="cursor-pointer rounded-[8px] px-[14px] py-[7px]"
                style={{
                  background: confirm.kind === "restore" ? "var(--ink)" : "#a63232",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {confirmAction(confirm.kind)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function confirmTitle(kind: ConfirmKind, row?: HistoryRow) {
  const name = row?.campaign ? `「${row.campaign}」` : "이 이력";
  if (kind === "trash") return `${name}을 삭제할까요?`;
  if (kind === "restore") return `${name}을 복구할까요?`;
  if (kind === "purge") return `${name}을 영구삭제할까요?`;
  if (kind === "trashAll") return "모든 검수 이력을 삭제할까요?";
  return "휴지통을 비울까요?";
}

function confirmBody(kind: ConfirmKind) {
  if (kind === "trash" || kind === "trashAll") return "휴지통으로 이동하며 7일간 보관됩니다. 그 안에 복구하거나 바로 영구삭제할 수 있습니다.";
  if (kind === "restore") return "검수 이력 목록으로 다시 돌아갑니다.";
  return "이 작업은 되돌릴 수 없습니다. 지금은 브라우저 저장소에서 바로 지워집니다.";
}

function confirmAction(kind: ConfirmKind) {
  if (kind === "trash" || kind === "trashAll") return "삭제";
  if (kind === "restore") return "복구";
  return "영구삭제";
}

function ActionBtn({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "muted" | "danger" | "ink";
  onClick: () => void;
}) {
  const style =
    tone === "danger"
      ? { borderColor: "#f0d0d0", background: "#fff7f7", color: "#a63232" }
      : tone === "ink"
        ? { borderColor: "#111", background: "#111", color: "#fff" }
        : { borderColor: "#e0e0e0", background: "#fff", color: "#555" };
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded-[7px] border px-[8px] py-[4px]"
      style={{ fontSize: 11, fontWeight: 700, ...style }}
    >
      {label}
    </button>
  );
}

function HistoryRowCmp({
  row,
  isAdmin,
  inTrash,
  onOpen,
  onTrash,
  onRestore,
  onPurge,
}: {
  row: HistoryRow;
  isAdmin: boolean;
  inTrash: boolean;
  onOpen: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onPurge: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr onClick={onOpen} className={`${inTrash ? "" : "cursor-pointer"} border-t hover:bg-[#fafafa]`} style={{ borderColor: "#f0f0f0" }}>
        <td className="whitespace-nowrap px-[14px] py-[12px]" style={{ fontSize: 11, fontWeight: 700, color: "#666" }}>
          {row.type}
        </td>
        <td className="px-[14px] py-[12px]">
          <div className="flex items-center justify-between gap-[10px]">
            <div className="flex items-center gap-[8px]">
              {row.totalVersions > 1 && (
                <span
                  onClick={e => {
                    e.stopPropagation();
                    setOpen(!open);
                  }}
                  className="cursor-pointer rounded-[6px] bg-[#f3f3f3] px-[6px] py-[1px]"
                  style={{ fontSize: 10, fontWeight: 700, color: "#666" }}
                >
                  {open ? "▾" : "▸"}
                </span>
              )}
              <span className="whitespace-nowrap" style={{ fontSize: 13, fontWeight: 600 }}>{row.campaign}</span>
              {row.totalVersions > 1 && (
                <span className="rounded-[6px] px-[6px] py-[1px]" style={{ background: "#f4f0e8", color: "#8a7340", fontSize: 10, fontWeight: 700 }}>
                  v{row.version} · 총 {row.totalVersions}회
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-[6px]">
              {inTrash ? (
                <>
                  <ActionBtn label="복구" tone="ink" onClick={onRestore} />
                  <ActionBtn label="영구삭제" tone="danger" onClick={onPurge} />
                </>
              ) : (
                <ActionBtn label="삭제" tone="muted" onClick={onTrash} />
              )}
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-[14px] py-[12px]" style={{ fontSize: 12, color: "#555" }}>
          {row.publishDate}
        </td>
        <td className="whitespace-nowrap px-[14px] py-[12px]" style={{ fontSize: 11.5, color: "#555" }}>
          {row.channels.join(", ")}
        </td>
        {isAdmin && (
          <td className="whitespace-nowrap px-[14px] py-[12px]" style={{ fontSize: 12 }}>
            {row.author}
          </td>
        )}
        <td className="whitespace-nowrap px-[14px] py-[12px]">
          <div className="flex items-center gap-[6px]">
            <GradeBadge grade={row.grade} />
            {row.reviewRoute && (
              <span className="rounded-[6px] px-[6px] py-[2px]" style={{ background: "#f4f4f4", color: "#555", fontSize: 10, fontWeight: 700 }}>
                {routeLabel(row.reviewRoute)}
              </span>
            )}
          </div>
        </td>
        <td className="whitespace-nowrap px-[14px] py-[12px]" style={{ fontSize: 11, color: inTrash ? "#a63232" : "#888", fontWeight: inTrash ? 700 : 400 }}>
          {inTrash && row.deletedAt ? `${daysLeft(row.deletedAt)}일 남음` : row.reviewedAt}
        </td>
      </tr>
      {open &&
        Array.from({ length: row.totalVersions - 1 }).map((_, i) => (
          <tr key={i} className="border-t" style={{ borderColor: "#f6f6f6", opacity: 0.55 }}>
            <td className="px-[14px] py-[10px]"></td>
            <td className="px-[14px] py-[10px]" style={{ fontSize: 12, color: "#777" }}>
              <span className="ml-[22px]">↳ v{row.totalVersions - 1 - i} · 이전 버전</span>
            </td>
            <td colSpan={6} className="px-[14px] py-[10px]" style={{ fontSize: 11.5, color: "#888" }}>
              이전 리포트 조회 (읽기 전용)
            </td>
          </tr>
        ))}
    </>
  );
}
