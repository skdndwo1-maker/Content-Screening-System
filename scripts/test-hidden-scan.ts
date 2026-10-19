import { scanHidden } from "../lib/hidden/engine";
import { loadFileRules, loadFileTerms } from "../lib/hidden/load";
import { hangulToQwerty, qwertyToHangul } from "../lib/hidden/hangul";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const terms = loadFileTerms();
const rules = loadFileRules();

function scan(text: string, layout?: Parameters<typeof scanHidden>[0]["layout"]) {
  return scanHidden({ text, terms, rules, layout, channels: ["SNS"] });
}

const poem = ["한번도 경험해보지 못한", "남들에게 양보하기 싫은", "충분히 가성비인 지금"].join("\n");
const t0 = Date.now();
const first = scan(poem);
const elapsed = Date.now() - t0;
assert(elapsed < 100, `path+match should be <100ms, got ${elapsed}ms`);
assert(
  first.candidates.some(c => c.term === "한남충" && c.verdict === "high" && c.pathId.includes("LINE_FIRST")),
  `LINE_FIRST 한남충 위험 필요: ${JSON.stringify(first.candidates.slice(0, 5), null, 2)}`
);

const reversed = ["충분히 가성비인 지금", "남들에게 양보하기 싫은", "한번도 경험해보지 못한"].join("\n");
const rev = scan(reversed);
assert(
  rev.candidates.some(c => c.term === "한남충" && c.verdict === "high"),
  `역순 3줄도 한남충 위험: ${rev.candidates.map(c => c.pathId + ":" + c.term).join(", ")}`
);

const last = ["이건 또한", "그리고 남", "마음 충"].join("\n");
const lastHit = scan(last);
assert(
  lastHit.candidates.some(c => c.term === "한남충" && c.pathId.includes("LINE_LAST")),
  `LINE_LAST 한남충 필요: ${lastHit.candidates.map(c => c.pathId + ":" + c.term).join(", ")}`
);

const emphasisText = "한번도 경험해보지 못한 남들에게 양보하기 싫은 충분히 가성비인 지금";
const emphasisIdx = new Set<number>();
for (const needle of ["한", "남", "충"]) {
  const i = [...emphasisText].findIndex((ch, idx) => ch === needle && !emphasisIdx.has(idx));
  if (i >= 0) emphasisIdx.add(i);
}
const layout = Array.from(emphasisText).map((ch, i) => ({
  ch,
  line: 1,
  col: i + 1,
  bold: emphasisIdx.has(i),
}));
const emp = scan(emphasisText, layout);
assert(
  emp.candidates.some(c => c.term === "한남충" && (c.pathId === "EMPHASIS" || c.emphasized)),
  `EMPHASIS 한남충 필요: ${emp.candidates.map(c => c.pathId + ":" + c.term).join(", ")}`
);

const cho = scan("ㅎㄴㅊ");
assert(
  cho.candidates.some(c => c.term === "한남충"),
  `초성 ㅎㄴㅊ → 한남충: ${cho.candidates.map(c => c.term).join(", ")}`
);

const spaced = scan("한 남 충");
assert(
  spaced.candidates.some(c => c.term === "한남충"),
  `띄어쓰기 한 남 충 → 한남충: ${spaced.candidates.map(c => c.pathId + ":" + c.term).join(", ")}`
);

assert(qwertyToHangul("gksskacnd") === "한남충", `qwerty restore: ${qwertyToHangul("gksskacnd")}`);
assert(hangulToQwerty("한남충") === "gksskacnd", `qwerty encode: ${hangulToQwerty("한남충")}`);

const safe = [
  "한남동 맛집",
  "개발자 모집",
  "충전 무료",
  "김치찌개 맛집",
  "충분히 좋은 요금제",
  "충전이 빠른 배터리",
  "개선된 서비스",
  "개인정보 보호",
  "한남대교 야경",
  "한남역 출구",
  "개발 문화 안내",
  "개방형 네트워크",
  "충실한 이용 안내",
  "그래도 괜찮아요",
  "이라도 충분하다",
  "서울 한강 야경",
  "데이터 충전 혜택",
  "개통 당일 수령",
  "우리 동네 맛집",
  "가족 결합 할인",
  "학생 요금제 안내",
  "5G 빠른 속도",
];
let fp = 0;
const fps: string[] = [];
for (const s of safe) {
  const r = scan(s);
  const bad = r.candidates.filter(c => c.verdict === "high" || c.verdict === "med");
  if (bad.length) {
    fp += 1;
    fps.push(`${s} → ${bad.map(c => c.term + "/" + c.pathId).join(", ")}`);
  }
}
assert(fp <= 1, `정상 문구 오탐 ${fp}건 (0~1만 허용)\n${fps.join("\n")}`);

const rado = scan("이라도 충분하다");
assert(
  !rado.candidates.some(c => c.term === "라도"),
  `2음절 부분일치 라도가 후보에 오르면 안 됨: ${rado.candidates.map(c => c.term + "/" + c.pathId + "/" + c.fullPath).join(", ")}`
);

console.log(
  JSON.stringify(
    {
      ok: true,
      elapsedMs: first.elapsedMs,
      firstHits: first.candidates.filter(c => c.term === "한남충").map(c => c.pathId),
      falsePositives: fp,
    },
    null,
    2
  )
);
