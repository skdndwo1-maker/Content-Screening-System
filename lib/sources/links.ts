import type { WebSearchLink } from "@/lib/types";
import { searchMaxLinks } from "./flags";

const NEWS = [
  "chosun",
  "joongang",
  "donga",
  "hani",
  "khan",
  "hankyung",
  "mk.co",
  "yonhap",
  "yna.co",
  "newsis",
  "news1",
  "hankookilbo",
  "segye",
  "munhwa",
  "seoul.co",
  "kmib",
  "mt.co",
  "edaily",
  "nocut",
  "ohmynews",
  "pressian",
  "jtbc",
  "sbs.co",
  "kbs.co",
  "mbc.co",
  "ytn",
  "bbc",
  "reuters",
  "nytimes",
  "wsj",
  "cnn",
];

export function domainOf(uri: string, title?: string): string {
  try {
    const host = new URL(uri).hostname.replace(/^www\./, "");
    if (host.includes("vertexaisearch") || host.includes("google.com")) {
      const t = (title || "").replace(/^www\./, "");
      return t.includes(".") ? t : host;
    }
    return host;
  } catch {
    return title || uri;
  }
}

function newsRank(domain: string): number {
  const i = NEWS.findIndex(n => domain.includes(n));
  return i === -1 ? 100 : i;
}

export function normalizeLinks(raw: { title?: string; uri?: string }[]): WebSearchLink[] {
  const seenUri = new Set<string>();
  const domainCount = new Map<string, number>();
  const links: WebSearchLink[] = [];
  for (const item of raw) {
    if (!item.uri) continue;
    if (seenUri.has(item.uri)) continue;
    seenUri.add(item.uri);
    const domain = domainOf(item.uri, item.title);
    const used = domainCount.get(domain) || 0;
    if (used >= 2) continue;
    domainCount.set(domain, used + 1);
    links.push({
      title: item.title || domain,
      uri: item.uri,
      domain,
    });
  }
  links.sort((a, b) => newsRank(a.domain) - newsRank(b.domain));
  return links.slice(0, searchMaxLinks());
}

export function looksControversial(sentences: string[]): boolean {
  return sentences.some(s => {
    if (/없(?:습니다|음)|찾지 못했|확인되지 않/.test(s) && /사례|보도/.test(s)) return false;
    return /(사과|광고 중단|보이콧|시정|제재|철회)/.test(s) && /(기업|광고|브랜드|마케팅|캠페인)/.test(s);
  });
}
