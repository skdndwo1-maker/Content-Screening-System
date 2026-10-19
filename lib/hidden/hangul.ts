const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const Q_CHO = ["r", "R", "s", "e", "E", "f", "a", "q", "Q", "t", "T", "d", "w", "W", "c", "z", "x", "v", "g"];
const Q_JUNG = ["k", "o", "i", "O", "j", "p", "u", "P", "h", "hk", "ho", "hl", "y", "n", "nj", "np", "nl", "b", "m", "ml", "l"];
const Q_JONG = ["", "r", "R", "rt", "s", "sw", "sg", "e", "f", "fr", "fa", "fq", "ft", "fx", "fv", "fg", "a", "q", "qt", "t", "T", "d", "w", "c", "z", "x", "v", "g"];

const QWERTY_TO_JAMO: Record<string, string> = {
  q: "ㅂ",
  w: "ㅈ",
  e: "ㄷ",
  r: "ㄱ",
  t: "ㅅ",
  y: "ㅛ",
  u: "ㅕ",
  i: "ㅑ",
  o: "ㅐ",
  p: "ㅔ",
  a: "ㅁ",
  s: "ㄴ",
  d: "ㅇ",
  f: "ㄹ",
  g: "ㅎ",
  h: "ㅗ",
  j: "ㅓ",
  k: "ㅏ",
  l: "ㅣ",
  z: "ㅋ",
  x: "ㅌ",
  c: "ㅊ",
  v: "ㅍ",
  b: "ㅠ",
  n: "ㅜ",
  m: "ㅡ",
  Q: "ㅃ",
  W: "ㅉ",
  E: "ㄸ",
  R: "ㄲ",
  T: "ㅆ",
  O: "ㅒ",
  P: "ㅖ",
};

const JUNG_COMBINE: Record<string, string> = {
  ㅗㅏ: "ㅘ",
  ㅗㅐ: "ㅙ",
  ㅗㅣ: "ㅚ",
  ㅜㅓ: "ㅝ",
  ㅜㅔ: "ㅞ",
  ㅜㅣ: "ㅟ",
  ㅡㅣ: "ㅢ",
};

const JONG_COMBINE: Record<string, string> = {
  ㄱㅅ: "ㄳ",
  ㄴㅈ: "ㄵ",
  ㄴㅎ: "ㄶ",
  ㄹㄱ: "ㄺ",
  ㄹㅁ: "ㄻ",
  ㄹㅂ: "ㄼ",
  ㄹㅅ: "ㄽ",
  ㄹㅌ: "ㄾ",
  ㄹㅍ: "ㄿ",
  ㄹㅎ: "ㅀ",
  ㅂㅅ: "ㅄ",
};

const CHO_SET = new Set(CHO);
const JUNG_SET = new Set(JUNG);

export function isHangulSyllable(ch: string): boolean {
  const c = ch.codePointAt(0);
  return c !== undefined && c >= 0xac00 && c <= 0xd7a3;
}

export function decompose(ch: string): [string, string, string] | null {
  const c = ch.codePointAt(0);
  if (c === undefined || c < 0xac00 || c > 0xd7a3) return null;
  const n = c - 0xac00;
  const cho = Math.floor(n / 588);
  const jung = Math.floor((n % 588) / 28);
  const jong = n % 28;
  return [CHO[cho], JUNG[jung], JONG[jong]];
}

export function compose(cho: string, jung: string, jong = ""): string {
  const ci = CHO.indexOf(cho);
  const ji = JUNG.indexOf(jung);
  const gi = JONG.indexOf(jong);
  if (ci < 0 || ji < 0 || gi < 0) return cho + jung + jong;
  return String.fromCodePoint(0xac00 + ci * 588 + ji * 28 + gi);
}

export function choseongOf(text: string): string {
  return Array.from(text)
    .map(ch => {
      const d = decompose(ch);
      if (d) return d[0];
      if (CHO_SET.has(ch)) return ch;
      return "";
    })
    .join("");
}

export function toJamo(text: string): string {
  return Array.from(text)
    .map(ch => {
      const d = decompose(ch);
      if (!d) return ch;
      return d[0] + d[1] + d[2];
    })
    .join("");
}

export function hangulToQwerty(text: string): string {
  return Array.from(text)
    .map(ch => {
      const d = decompose(ch);
      if (!d) {
        const qi = CHO.indexOf(ch);
        if (qi >= 0) return Q_CHO[qi];
        const ji = JUNG.indexOf(ch);
        if (ji >= 0) return Q_JUNG[ji];
        return ch;
      }
      const [cho, jung, jong] = d;
      return Q_CHO[CHO.indexOf(cho)] + Q_JUNG[JUNG.indexOf(jung)] + Q_JONG[JONG.indexOf(jong)];
    })
    .join("");
}

function mapQwertyChar(ch: string): string {
  return QWERTY_TO_JAMO[ch] ?? ch;
}

export function qwertyToHangul(text: string): string {
  const jamo = Array.from(text).map(mapQwertyChar);
  const out: string[] = [];
  let i = 0;
  while (i < jamo.length) {
    const a = jamo[i];
    const b = jamo[i + 1];
    if (CHO_SET.has(a) && JUNG_SET.has(b)) {
      let jung = b;
      i += 2;
      const pair = jung + (jamo[i] ?? "");
      if (JUNG_COMBINE[pair]) {
        jung = JUNG_COMBINE[pair];
        i += 1;
      }
      let jong = "";
      const c = jamo[i];
      const d = jamo[i + 1];
      if (c && (CHO_SET.has(c) || JONG.includes(c))) {
        if (CHO_SET.has(c) && JUNG_SET.has(d)) {
          // c starts the next syllable
        } else {
          const jongPair = c + (d ?? "");
          if (d && !JUNG_SET.has(jamo[i + 2] ?? "") && JONG_COMBINE[jongPair]) {
            jong = JONG_COMBINE[jongPair];
            i += 2;
          } else if (JONG.includes(c)) {
            jong = c;
            i += 1;
          }
        }
      }
      out.push(compose(a, jung, jong));
    } else {
      out.push(a);
      i += 1;
    }
  }
  return out.join("");
}

export function restoreDigits(text: string): string {
  return text.replace(/1/g, "ㅣ").replace(/0/g, "ㅇ");
}

export function reverseText(text: string): string {
  return Array.from(text).reverse().join("");
}

export function syllableCount(text: string): number {
  return Array.from(text).filter(ch => isHangulSyllable(ch) || /[A-Za-z0-9ㄱ-ㅎㅏ-ㅣ]/.test(ch)).length;
}

const JUNG_NEAR: Record<string, string[]> = {
  ㅐ: ["ㅔ"],
  ㅔ: ["ㅐ"],
  ㅒ: ["ㅖ"],
  ㅖ: ["ㅒ"],
  ㅏ: ["ㅓ"],
  ㅓ: ["ㅏ"],
};

const CHO_NEAR: Record<string, string[]> = {
  ㄱ: ["ㄲ"],
  ㄲ: ["ㄱ"],
  ㄷ: ["ㄸ"],
  ㄸ: ["ㄷ"],
  ㅂ: ["ㅃ"],
  ㅃ: ["ㅂ"],
  ㅅ: ["ㅆ"],
  ㅆ: ["ㅅ"],
  ㅈ: ["ㅉ"],
  ㅉ: ["ㅈ"],
};

export function similarSyllableVariants(term: string, limit = 8): string[] {
  const chars = Array.from(term);
  const out = new Set<string>();
  for (let i = 0; i < chars.length && out.size < limit; i++) {
    const d = decompose(chars[i]);
    if (!d) continue;
    const [cho, jung, jong] = d;
    for (const j of JUNG_NEAR[jung] ?? []) {
      const next = chars.slice();
      next[i] = compose(cho, j, jong);
      out.add(next.join(""));
    }
    for (const c of CHO_NEAR[cho] ?? []) {
      const next = chars.slice();
      next[i] = compose(c, jung, jong);
      out.add(next.join(""));
    }
  }
  return [...out].slice(0, limit);
}
