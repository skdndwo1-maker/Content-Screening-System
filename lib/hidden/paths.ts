import type { CharCell, LayoutChar, ReadPath } from "./types";

const PUNCT = /[\s\p{P}\p{S}\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;

export interface PathSpec {
  id: string;
  desc: string;
}

export function buildGrid(text: string, layout?: LayoutChar[]): CharCell[][] {
  if (layout?.length) {
    const rows = new Map<number, CharCell[]>();
    for (const c of layout) {
      const row = rows.get(c.line) ?? [];
      row.push({
        ch: c.ch,
        line: c.line,
        col: c.col,
        emphasis: Boolean(c.bold || c.underline || c.italic || (c.size && c.size >= 1.15) || (c.color && c.color !== "#000" && c.color !== "#111" && c.color !== "#111111")),
      });
      rows.set(c.line, row);
    }
    return [...rows.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, cells]) => cells.sort((a, b) => a.col - b.col));
  }

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  return lines.map((line, li) =>
    Array.from(line).map((ch, ci) => ({
      ch,
      line: li + 1,
      col: ci + 1,
    }))
  );
}

function pathOf(id: string, desc: string, cells: CharCell[]): ReadPath | null {
  const kept = cells.filter(c => c.ch !== "");
  if (!kept.length) return null;
  return { id, desc, cells: kept, text: kept.map(c => c.ch).join("") };
}

function firstNonSpace(row: CharCell[]): CharCell | undefined {
  return row.find(c => !/\s/.test(c.ch));
}

function lastNonSpace(row: CharCell[]): CharCell | undefined {
  for (let i = row.length - 1; i >= 0; i--) if (!/\s/.test(row[i].ch)) return row[i];
  return undefined;
}

function nthNonSpace(row: CharCell[], n: number): CharCell | undefined {
  let k = 0;
  for (const c of row) {
    if (/\s/.test(c.ch)) continue;
    k += 1;
    if (k === n) return c;
  }
  return undefined;
}

function wordsOf(grid: CharCell[][]): CharCell[][] {
  const words: CharCell[][] = [];
  for (const row of grid) {
    let cur: CharCell[] = [];
    const flush = () => {
      if (cur.length) words.push(cur);
      cur = [];
    };
    for (const c of row) {
      if (/\s/.test(c.ch)) flush();
      else cur.push(c);
    }
    flush();
  }
  return words;
}

function sentencesOf(grid: CharCell[][]): CharCell[][] {
  const flat = grid.flat();
  const out: CharCell[][] = [];
  let cur: CharCell[] = [];
  for (const c of flat) {
    cur.push(c);
    if (/[.!?。！？]/.test(c.ch)) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

function flattenLetters(grid: CharCell[][]): CharCell[] {
  return grid.flat().filter(c => !PUNCT.test(c.ch));
}

const GENERATORS: Record<string, (grid: CharCell[][], spec: PathSpec) => ReadPath[]> = {
  LINE_FIRST: (grid, spec) => {
    const cells = grid.map(firstNonSpace).filter((c): c is CharCell => Boolean(c));
    const p = pathOf(spec.id, spec.desc, cells);
    return p ? [p] : [];
  },
  LINE_LAST: (grid, spec) => {
    const cells = grid.map(lastNonSpace).filter((c): c is CharCell => Boolean(c));
    const p = pathOf(spec.id, spec.desc, cells);
    return p ? [p] : [];
  },
  LINE_NTH: (grid, spec) => {
    const out: ReadPath[] = [];
    for (const n of [2, 3]) {
      const cells = grid.map(row => nthNonSpace(row, n)).filter((c): c is CharCell => Boolean(c));
      const p = pathOf(`${spec.id}_${n}`, `${spec.desc} (n=${n})`, cells);
      if (p) out.push(p);
    }
    return out;
  },
  WORD_FIRST: (grid, spec) => {
    const cells = wordsOf(grid)
      .map(w => w[0])
      .filter(Boolean);
    const p = pathOf(spec.id, spec.desc, cells);
    return p ? [p] : [];
  },
  WORD_LAST: (grid, spec) => {
    const cells = wordsOf(grid)
      .map(w => w[w.length - 1])
      .filter(Boolean);
    const p = pathOf(spec.id, spec.desc, cells);
    return p ? [p] : [];
  },
  SENTENCE_FIRST: (grid, spec) => {
    const cells = sentencesOf(grid)
      .map(s => s.find(c => !/\s/.test(c.ch)))
      .filter((c): c is CharCell => Boolean(c));
    const p = pathOf(spec.id, spec.desc, cells);
    return p ? [p] : [];
  },
  COLUMN: (grid, spec) => {
    const width = Math.max(0, ...grid.map(r => r.length));
    const out: ReadPath[] = [];
    for (let col = 1; col <= width; col++) {
      const cells: CharCell[] = [];
      for (const row of grid) {
        const cell = row.find(c => c.col === col && !/\s/.test(c.ch));
        if (cell) cells.push(cell);
      }
      if (cells.length >= 2) {
        const p = pathOf(`${spec.id}_${col}`, `${spec.desc} (열 ${col})`, cells);
        if (p) out.push(p);
      }
    }
    return out;
  },
  DIAGONAL: (grid, spec) => {
    const out: ReadPath[] = [];
    const rows = grid.filter(r => r.some(c => !/\s/.test(c.ch)));
    const letters = rows.map(r => r.filter(c => !/\s/.test(c.ch)));
    const h = letters.length;
    if (h < 2) return out;

    const walk = (id: string, desc: string, startR: number, startC: number, dr: number, dc: number) => {
      const cells: CharCell[] = [];
      let r = startR;
      let c = startC;
      while (r >= 0 && r < h && c >= 0 && c < (letters[r]?.length ?? 0)) {
        cells.push(letters[r][c]);
        r += dr;
        c += dc;
      }
      if (cells.length >= 2) {
        const p = pathOf(id, desc, cells);
        if (p) out.push(p);
      }
    };

    for (let c = 0; c < (letters[0]?.length ?? 0); c++) {
      walk(`${spec.id}_dr_${c}`, `${spec.desc} 좌상→우하`, 0, c, 1, 1);
      walk(`${spec.id}_dl_${c}`, `${spec.desc} 우상→좌하`, 0, c, 1, -1);
    }
    for (let r = 1; r < h; r++) {
      walk(`${spec.id}_dr_r${r}`, `${spec.desc} 좌상→우하`, r, 0, 1, 1);
      const last = (letters[r]?.length ?? 1) - 1;
      walk(`${spec.id}_dl_r${r}`, `${spec.desc} 우상→좌하`, r, last, 1, -1);
    }
    return out;
  },
  SKIP_K: (grid, spec) => {
    const letters = flattenLetters(grid);
    const out: ReadPath[] = [];
    for (const k of [2, 3]) {
      for (let offset = 0; offset < k; offset++) {
        const cells = letters.filter((_, i) => (i - offset) % k === 0);
        const p = pathOf(`${spec.id}_${k}_${offset}`, `${spec.desc} (k=${k})`, cells);
        if (p && p.cells.length >= 2) out.push(p);
      }
    }
    return out;
  },
  EMPHASIS: (grid, spec) => {
    const cells = grid.flat().filter(c => c.emphasis);
    const p = pathOf(spec.id, spec.desc, cells);
    return p ? [p] : [];
  },
  STRIPPED: (grid, spec) => {
    const p = pathOf(spec.id, spec.desc, flattenLetters(grid));
    return p ? [p] : [];
  },
  NUMBERS: (grid, spec) => {
    const cells = grid.flat().filter(c => /\d/.test(c.ch));
    const p = pathOf(spec.id, spec.desc, cells);
    return p ? [p] : [];
  },
  REVERSE: () => [],
};

export function generatePaths(text: string, specs: PathSpec[], layout?: LayoutChar[]): ReadPath[] {
  const grid = buildGrid(text, layout);
  const nonEmpty = grid.filter(r => r.some(c => !/\s/.test(c.ch)));
  const paths: ReadPath[] = [];
  const reverse = specs.some(s => s.id === "REVERSE");

  for (const spec of specs) {
    if (spec.id === "REVERSE") continue;
    const gen = GENERATORS[spec.id];
    if (!gen) continue;
    paths.push(...gen(nonEmpty, spec));
  }

  const raw = pathOf("RAW", "원문 글자열", flattenLetters(nonEmpty));
  if (raw) paths.push(raw);

  if (reverse) {
    const extra: ReadPath[] = [];
    for (const p of paths) {
      const cells = [...p.cells].reverse();
      extra.push({
        id: `REVERSE_${p.id}`,
        desc: `역순 · ${p.desc}`,
        cells,
        text: cells.map(c => c.ch).join(""),
      });
    }
    paths.push(...extra);
  }

  return paths.filter(p => p.text.length > 0);
}
