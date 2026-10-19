import type { DictEntry, PatternHit } from "./types";

interface Node {
  next: Map<string, number>;
  fail: number;
  out: { key: string; entry: DictEntry }[];
}

export class AhoCorasick {
  private nodes: Node[] = [{ next: new Map(), fail: 0, out: [] }];

  add(key: string, entry: DictEntry) {
    if (!key) return;
    let i = 0;
    for (const ch of Array.from(key)) {
      let n = this.nodes[i].next.get(ch);
      if (n === undefined) {
        n = this.nodes.length;
        this.nodes[i].next.set(ch, n);
        this.nodes.push({ next: new Map(), fail: 0, out: [] });
      }
      i = n;
    }
    this.nodes[i].out.push({ key, entry });
  }

  build() {
    const q: number[] = [];
    for (const [, n] of this.nodes[0].next) {
      this.nodes[n].fail = 0;
      q.push(n);
    }
    while (q.length) {
      const v = q.shift()!;
      for (const [ch, u] of this.nodes[v].next) {
        let f = this.nodes[v].fail;
        while (f && !this.nodes[f].next.has(ch)) f = this.nodes[f].fail;
        const fail = this.nodes[f].next.get(ch) ?? 0;
        this.nodes[u].fail = fail === u ? 0 : fail;
        this.nodes[u].out.push(...this.nodes[this.nodes[u].fail].out);
        q.push(u);
      }
    }
  }

  find(text: string): PatternHit[] {
    const hits: PatternHit[] = [];
    const chars = Array.from(text);
    let i = 0;
    for (let pos = 0; pos < chars.length; pos++) {
      const ch = chars[pos];
      while (i && !this.nodes[i].next.has(ch)) i = this.nodes[i].fail;
      i = this.nodes[i].next.get(ch) ?? 0;
      for (const o of this.nodes[i].out) {
        const start = pos - Array.from(o.key).length + 1;
        hits.push({ key: o.key, start, end: pos + 1, entry: o.entry });
      }
    }
    return hits;
  }
}
