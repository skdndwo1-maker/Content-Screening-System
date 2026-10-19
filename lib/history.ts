import { demoHistory } from "./demoData";
import { stripHeavy } from "./review/snapshot";
import type { HistoryRow } from "./types";

export const HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = "cg-history-v1";

export function isTrashed(row: HistoryRow, now = Date.now()): boolean {
  return Boolean(row.deletedAt) && now - Date.parse(row.deletedAt!) < HISTORY_TTL_MS;
}

export function purgeExpired(rows: HistoryRow[], now = Date.now()): HistoryRow[] {
  return rows.filter(r => !r.deletedAt || now - Date.parse(r.deletedAt) < HISTORY_TTL_MS);
}

export function daysLeft(deletedAt: string, now = Date.now()): number {
  const left = Date.parse(deletedAt) + HISTORY_TTL_MS - now;
  return Math.max(0, Math.ceil(left / (24 * 60 * 60 * 1000)));
}

export function loadHistory(): HistoryRow[] {
  if (typeof window === "undefined") return demoHistory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoHistory));
      return demoHistory;
    }
    const parsed = JSON.parse(raw) as HistoryRow[];
    const next = purgeExpired(Array.isArray(parsed) ? parsed : demoHistory);
    if (next.length !== parsed.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return demoHistory;
  }
}

export function saveHistory(rows: HistoryRow[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripHeavy(rows)));
    } catch {
      // quota still exceeded — keep RAM copy only
    }
  }
}
