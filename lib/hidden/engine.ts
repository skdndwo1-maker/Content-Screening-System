import { choseongOf, hangulToQwerty, qwertyToHangul, restoreDigits, syllableCount, toJamo } from "./hangul";
import { buildIndex, hashPayload, type TermsDoc } from "./dictionary";
import { generatePaths, type PathSpec } from "./paths";
import type {
  AllowItem,
  CharCell,
  DictSeverity,
  HiddenCandidate,
  HiddenScanResult,
  HiddenVerdict,
  LayoutChar,
  ReadPath,
} from "./types";

export interface RulesDoc {
  "02_hidden_text_detection"?: {
    read_paths?: PathSpec[];
    scoring?: {
      base_by_severity?: Record<string, number>;
      add?: { if: string; score: number }[];
      subtract?: { if: string; score: number }[];
      thresholds?: { high?: number; caution?: number; drop_below?: number };
    };
  };
}

const DEFAULT_PATHS: PathSpec[] = [
  { id: "LINE_FIRST", desc: "각 줄의 첫 글자를 위에서 아래로" },
  { id: "LINE_LAST", desc: "각 줄의 마지막 글자를 위에서 아래로" },
  { id: "LINE_NTH", desc: "각 줄의 n번째 글자 (n=2,3)" },
  { id: "WORD_FIRST", desc: "어절(띄어쓰기 단위)마다 첫 글자" },
  { id: "WORD_LAST", desc: "어절마다 마지막 글자" },
  { id: "SENTENCE_FIRST", desc: "문장마다 첫 글자" },
  { id: "COLUMN", desc: "격자의 같은 열을 세로로" },
  { id: "DIAGONAL", desc: "격자의 대각선" },
  { id: "REVERSE", desc: "위 모든 경로와 원문의 역순" },
  { id: "SKIP_K", desc: "원문에서 k칸마다 한 글자" },
  { id: "EMPHASIS", desc: "강조된 글자만 순서대로" },
  { id: "STRIPPED", desc: "공백·특수문자·이모지를 제거한 원문" },
  { id: "NUMBERS", desc: "숫자만 이어 읽기" },
];

const BASE: Record<DictSeverity, number> = { CRITICAL: 50, HIGH: 40, CAUTION: 25, LOW: 10 };

function allowHit(term: string, source: string, allow: AllowItem[]): boolean {
  const hit = allow.find(a => a.blocks.some(b => b.replace(/^-/, "") === term));
  if (!hit) return false;
  if (term === "한남" && /한남\s*(동|대교|역)/.test(source)) return true;
  if ((term === "개" || term === "개-") && /개발|개선|개인|개방/.test(source)) return true;
  if (term === "충" && /충전|충분|충동|충실/.test(source)) return true;
  if (term === "김치녀" && /김치/.test(source) && !/김치녀/.test(source)) return true;
  if (hit.text && source.includes(hit.text.slice(0, 4))) return true;
  return false;
}

function qwertyNorm(cells: CharCell[]): { text: string; map: number[] } {
  const chars: string[] = [];
  const map: number[] = [];
  cells.forEach((c, i) => {
    for (const ch of hangulToQwerty(c.ch)) {
      chars.push(ch);
      map.push(i);
    }
  });
  return { text: chars.join(""), map };
}

function mapNorm(cells: CharCell[], kind: "orig" | "cho" | "jamo" | "digit" | "qwerty" | "fromQwerty"): { text: string; map: number[] } {
  const chars: string[] = [];
  const map: number[] = [];
  cells.forEach((c, i) => {
    if (kind === "orig") {
      chars.push(c.ch);
      map.push(i);
      return;
    }
    if (kind === "cho") {
      const cho = choseongOf(c.ch);
      if (cho) {
        chars.push(cho);
        map.push(i);
      }
      return;
    }
    if (kind === "jamo") {
      const j = toJamo(c.ch);
      for (const ch of Array.from(j)) {
        chars.push(ch);
        map.push(i);
      }
      return;
    }
    if (kind === "digit") {
      const r = restoreDigits(c.ch);
      chars.push(r);
      map.push(i);
      return;
    }
    if (kind === "qwerty") {
      // handled as whole-string elsewhere
      chars.push(c.ch);
      map.push(i);
    }
  });
  return { text: chars.join(""), map };
}

function verdictOf(score: number, high: number, caution: number): HiddenVerdict {
  if (score >= high) return "high";
  if (score >= caution) return "med";
  return "unverified";
}

export function scanHidden(opts: {
  text: string;
  terms: TermsDoc;
  rules?: RulesDoc;
  layout?: LayoutChar[];
  channels?: string[];
}): HiddenScanResult {
  const t0 = Date.now();
  const notes: string[] = [];
  const hidden = opts.rules?.["02_hidden_text_detection"];
  const specs = hidden?.read_paths?.length ? hidden.read_paths : DEFAULT_PATHS;
  const scoring = hidden?.scoring;
  const high = scoring?.thresholds?.high ?? 70;
  const caution = scoring?.thresholds?.caution ?? 40;
  const drop = scoring?.thresholds?.drop_below ?? 25;
  const sns = (opts.channels ?? []).some(c => /sns|인스타|페이스|x\b|twitter/i.test(c));

  const hash = hashPayload(JSON.stringify(opts.terms.hidden_scan ?? "") + JSON.stringify(opts.terms.terms_by_group ? "g" : ""));
  const index = buildIndex(opts.terms, hash);
  const paths = generatePaths(opts.text, specs, opts.layout);

  type Raw = {
    cand: Omit<HiddenCandidate, "codeScore" | "verdict"> & { codeScore?: number; verdict?: HiddenVerdict };
    pathLen: number;
  };
  const raws: Raw[] = [];

  for (const path of paths) {
    const norms: { name: string; text: string; map: number[] }[] = [
      { name: "원형 음절열", ...mapNorm(path.cells, "orig") },
      { name: "초성열", ...mapNorm(path.cells, "cho") },
      { name: "자모 분리열", ...mapNorm(path.cells, "jamo") },
      { name: "숫자 치환 복원", ...mapNorm(path.cells, "digit") },
      { name: "한영 자판 변환", ...qwertyNorm(path.cells) },
    ];
    if (/^[A-Za-z0-9]+$/.test(path.text)) {
      const restored = qwertyToHangul(path.text);
      norms.push({
        name: "한영 자판 복원",
        text: restored,
        map: path.cells.map((_, i) => i),
      });
    }

    for (const norm of norms) {
      if (!norm.text) continue;
      const hits = index.ac.find(norm.text);
      for (const hit of hits) {
        const span = norm.map.slice(hit.start, hit.end);
        const uniq = [...new Set(span)];
        const cells = uniq.map(i => path.cells[i]).filter(Boolean);
        if (!cells.length) continue;
        const extracted = cells.map(c => c.ch).join("");
        const keySlice = Array.from(norm.text).slice(hit.start, hit.end).join("");
        const entry =
          index.exact.get(extracted) ??
          (hit.entry.term === extracted || hit.entry.term === keySlice || choseongOf(hit.entry.term) === extracted
            ? hit.entry
            : undefined);
        if (!entry) continue;
        const termLen = syllableCount(entry.term);
        if (termLen <= 1) {
          notes.push(`1음절 참고 · ${entry.term} @ ${path.id}`);
          continue;
        }
        const fullPath = hit.start === 0 && hit.end === Array.from(norm.text).length;
        const emphasized = cells.length > 0 && cells.every(c => c.emphasis);
        const isEmphasisPath = path.id === "EMPHASIS" || path.id.startsWith("EMPHASIS");

        if (termLen === 2 && !fullPath && !emphasized && !isEmphasisPath) continue;

        raws.push({
          pathLen: path.cells.length,
          cand: {
            term: entry.term,
            matchedIds: entry.ids,
            pathId: path.id,
            pathDesc: path.desc,
            positions: cells.map(c => ({ line: c.line, col: c.col, ch: c.ch })),
            extracted,
            normalization: norm.name,
            tier: entry.tier,
            dictSeverity: entry.severity,
            fullPath,
            emphasized: emphasized || isEmphasisPath,
          },
        });
      }
    }
  }

  const termPaths = new Map<string, Set<string>>();
  for (const r of raws) {
    const set = termPaths.get(r.cand.term) ?? new Set();
    set.add(r.cand.pathId);
    termPaths.set(r.cand.term, set);
  }

  const candidates: HiddenCandidate[] = [];
  const seen = new Set<string>();
  for (const r of raws) {
    const c = r.cand;
    const sig = `${c.term}|${c.pathId}|${c.positions.map(p => `${p.line}:${p.col}`).join(",")}`;
    if (seen.has(sig)) continue;
    seen.add(sig);

    let score = BASE[c.dictSeverity];
    if (c.fullPath) score += 30;
    if (c.emphasized) score += 30;
    if ((termPaths.get(c.term)?.size ?? 0) > 1) score += 15;
    if (sns) score += 5;
    if (c.tier === "contextual" && !c.fullPath && !c.emphasized) score -= 30;
    if (allowHit(c.term, opts.text, index.allow)) score -= 30;
    if (!c.fullPath && r.pathLen >= 10) score -= 15;

    if (c.tier === "contextual" && !c.fullPath && !c.emphasized) continue;
    if (score < drop) continue;

    candidates.push({
      ...c,
      codeScore: score,
      verdict: verdictOf(score, high, caution),
    });
  }

  candidates.sort((a, b) => b.codeScore - a.codeScore);
  return { candidates, notes, elapsedMs: Date.now() - t0 };
}

export function extractByPositions(text: string, positions: [number, number][]): string {
  const grid = text.replace(/\r\n/g, "\n").split("\n");
  return positions
    .map(([line, col]) => {
      const row = grid[line - 1] ?? "";
      return Array.from(row)[col - 1] ?? "";
    })
    .join("");
}

export function applyOpenSearch(text: string, proposal: { rule: string; positions: [number, number][]; result: string }): string | null {
  if (!proposal.positions?.length || !proposal.result) return null;
  const got = extractByPositions(text, proposal.positions);
  return got === proposal.result ? got : null;
}
