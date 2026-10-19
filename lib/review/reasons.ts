export function firstSentence(text: string): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  const m = t.match(/^[\s\S]+?(?:다\.|요\.|음\.|습니다\.|니다\.|[.!?。])(?=\s|$)/);
  const cut = (m ? m[0] : t).trim();
  return cut.length > 140 ? `${cut.slice(0, 137)}…` : cut;
}

export function splitReasonItems(items: string[]): string[] {
  const out: string[] = [];
  for (const raw of items) {
    const t = (raw || "").trim();
    if (!t) continue;
    const lined = t
      .split(/\n+/)
      .map(s => s.replace(/^\s*(?:\d+[\.\)］]\s+|[-*•]\s+)/, "").trim())
      .filter(Boolean);
    if (lined.length > 1) {
      out.push(...lined);
      continue;
    }
    const numbered = t
      .split(/(?:^|\s)(?=\d+[\.\)]\s+\S)/)
      .map(s => s.replace(/^\d+[\.\)]\s+/, "").trim())
      .filter(Boolean);
    if (numbered.length > 1) {
      out.push(...numbered);
      continue;
    }
    out.push(t);
  }
  return out;
}
