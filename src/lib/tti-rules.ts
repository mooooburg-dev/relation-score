/**
 * 띠 궁합 점수 규칙 — 앱(src/lib/tti.ts)과 본문 생성 스크립트(scripts/generate-tti.mjs)가
 * 함께 쓰는 단일 출처.
 *
 * 스크립트가 `node --experimental-strip-types` 로 이 파일을 직접 import 하므로
 * 타입 표기만 지워서 돌아가는 문법만 쓴다 (enum·namespace·파라미터 프로퍼티 금지)
 * 그리고 다른 모듈을 import 하지 않는다.
 *
 * 점수 = 기본점(육합 92 / 삼합 88 / 같은 띠 76 / 그 외 70)
 *      + 오행 관계(상생 +4, 같은 오행 +2, 상극 -4)
 *      - 충 18 / 원진 14 / 형 8 / 해 6 / 자형 12
 * 결과는 40~96 으로 자른다.
 */

export type Tti =
  | "rat" | "ox" | "tiger" | "rabbit" | "dragon" | "snake"
  | "horse" | "goat" | "monkey" | "rooster" | "dog" | "pig";

export type Element = "목" | "화" | "토" | "금" | "수";

export interface TtiInfo {
  id: Tti;
  /** 지지 순서 0~11 (자=0) */
  index: number;
  /** "쥐" */
  ko: string;
  /** 지지 한글 "자" */
  branch: string;
  /** 지지 한자 "子" */
  hanja: string;
  /** 갑자년 색 표현에 쓰는 동물명 ("쥐") */
  animal: string;
  emoji: string;
  element: Element;
  yinYang: "양" | "음";
}

const ROWS: [Tti, string, string, string, string, Element][] = [
  ["rat", "쥐", "자", "子", "🐭", "수"],
  ["ox", "소", "축", "丑", "🐮", "토"],
  ["tiger", "호랑이", "인", "寅", "🐯", "목"],
  ["rabbit", "토끼", "묘", "卯", "🐰", "목"],
  ["dragon", "용", "진", "辰", "🐲", "토"],
  ["snake", "뱀", "사", "巳", "🐍", "화"],
  ["horse", "말", "오", "午", "🐴", "화"],
  ["goat", "양", "미", "未", "🐑", "토"],
  ["monkey", "원숭이", "신", "申", "🐵", "금"],
  ["rooster", "닭", "유", "酉", "🐔", "금"],
  ["dog", "개", "술", "戌", "🐶", "토"],
  ["pig", "돼지", "해", "亥", "🐷", "수"],
];

export const TTI_LIST: TtiInfo[] = ROWS.map(([id, ko, branch, hanja, emoji, element], index) => ({
  id,
  index,
  ko,
  branch,
  hanja,
  animal: ko,
  emoji,
  element,
  yinYang: index % 2 === 0 ? "양" : "음",
}));

/** 출생연도 → 띠 (양력 연도 기준. 1~2월생은 설·입춘 이전이면 전년도 띠다) */
export function ttiOf(year: number): Tti {
  return TTI_LIST[(((year - 4) % 12) + 12) % 12].id;
}

// ---- 관계표 (지지 index 쌍) ----

const key = (i: number, j: number) => (i < j ? `${i}-${j}` : `${j}-${i}`);

/** 육합: 짝 → 합화 오행 */
const YUKHAP: [number, number, string][] = [
  [0, 1, "토"], [2, 11, "목"], [3, 10, "화"], [4, 9, "금"], [5, 8, "수"], [6, 7, "화"],
];
/** 삼합: 세 지지 → 이름 */
const SAMHAP: [number[], string][] = [
  [[8, 0, 4], "신자진 삼합 수국(水局)"],
  [[11, 3, 7], "해묘미 삼합 목국(木局)"],
  [[2, 6, 10], "인오술 삼합 화국(火局)"],
  [[5, 9, 1], "사유축 삼합 금국(金局)"],
];
const WONJIN = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];
const HYEONG = [
  [2, 5], [5, 8], [2, 8], // 인사신 삼형
  [1, 10], [10, 7], [1, 7], // 축술미 삼형
  [0, 3], // 자묘 상형
];
const HAE = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];
/** 같은 띠끼리 스스로 형이 되는 자형(自刑): 진·오·유·해 */
const JAHYEONG = new Set([4, 6, 9, 11]);

const setOf = (pairs: number[][]) => new Set(pairs.map(([i, j]) => key(i, j)));
const YUKHAP_MAP = new Map(YUKHAP.map(([i, j, el]) => [key(i, j), el]));
const SAMHAP_MAP = new Map<string, string>();
for (const [g, name] of SAMHAP)
  for (let x = 0; x < 3; x++)
    for (let y = x + 1; y < 3; y++) SAMHAP_MAP.set(key(g[x], g[y]), name);
const WONJIN_SET = setOf(WONJIN);
const HYEONG_SET = setOf(HYEONG);
const HAE_SET = setOf(HAE);

// ---- 오행 ----

/** 받침 유무로 조사 고르기 ("목이", "화가") */
function josa(word: string, withBatchim: string, without: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return word + (code >= 0 && code % 28 !== 0 ? withBatchim : without);
}

const GENERATES: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const CONTROLS: Record<Element, Element> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

export type TtiRelationKind =
  | "yukhap" | "samhap" | "same" | "chung" | "wonjin" | "hyeong" | "hae" | "jahyeong"
  | "saengsaeng" | "bihwa" | "sanggeuk" | "neutral";

export interface TtiFactor {
  kind: TtiRelationKind;
  /** "자축합(子丑合)" 처럼 화면에 그대로 쓰는 이름 */
  name: string;
  /** 점수에 준 영향 (+/-) */
  delta: number;
  /** 한 줄 풀이 */
  desc: string;
}

export interface TtiScore {
  score: number;
  /** 화면·생성 프롬프트에 쓰는 근거. 영향이 큰 순 */
  factors: TtiFactor[];
  /** 대표 관계 (가장 영향이 큰 요소) */
  primary: TtiRelationKind;
}

const W = {
  yukhap: 92,
  samhap: 88,
  same: 76,
  base: 70,
  saengsaeng: 4,
  bihwa: 2,
  sanggeuk: -4,
  chung: -18,
  wonjin: -14,
  hyeong: -8,
  hae: -6,
  jahyeong: -12,
};
const MIN = 40;
const MAX = 96;

export function scoreTti(a: Tti, b: Tti): TtiScore {
  const A = TTI_LIST.find((t) => t.id === a)!;
  const B = TTI_LIST.find((t) => t.id === b)!;
  const k = key(A.index, B.index);
  const pair = `${A.branch}${B.branch}`;
  const pairHanja = `${A.hanja}${B.hanja}`;
  const factors: TtiFactor[] = [];

  let base = W.base;
  const yukhap = YUKHAP_MAP.get(k);
  const samhap = SAMHAP_MAP.get(k);

  if (A.index === B.index) {
    base = W.same;
    factors.push({
      kind: "same",
      name: `같은 띠 (${A.branch}${A.branch})`,
      delta: W.same - W.base,
      desc: "기질과 생활 리듬이 닮아서 설명하지 않아도 통하는 부분이 많아.",
    });
    if (JAHYEONG.has(A.index)) {
      factors.push({
        kind: "jahyeong",
        name: `자형(自刑) ${A.branch}${A.branch}형`,
        delta: W.jahyeong,
        desc: "닮은 고집끼리 부딪히면 서로를 거울처럼 찌르는 자형(自刑)으로 봐.",
      });
    }
  } else if (yukhap) {
    base = W.yukhap;
    factors.push({
      kind: "yukhap",
      name: `${pair}합(${pairHanja}合)`,
      delta: W.yukhap - W.base,
      desc: `여섯 쌍뿐인 육합(六合). 둘이 만나 ${yukhap}의 기운으로 묶이는, 서로 부족한 걸 채우는 짝이야.`,
    });
  } else if (samhap) {
    base = W.samhap;
    factors.push({
      kind: "samhap",
      name: samhap,
      delta: W.samhap - W.base,
      desc: `세 띠가 한 기운으로 뭉치는 ${samhap.split(" ")[0]} 삼합에 함께 속해. 목표가 같을 때 손발이 척척 맞는 궁합이야.`,
    });
  }

  // 오행: 같은 띠는 비화가 자명하므로 생략
  if (A.index !== B.index) {
    const ea = A.element;
    const eb = B.element;
    if (ea === eb) {
      factors.push({
        kind: "bihwa",
        name: `오행 비화 (${ea}·${eb})`,
        delta: W.bihwa,
        desc: `둘 다 ${ea}의 기운이라 성향의 결이 비슷해.`,
      });
    } else if (GENERATES[ea] === eb || GENERATES[eb] === ea) {
      const [from, to] = GENERATES[ea] === eb ? [ea, eb] : [eb, ea];
      factors.push({
        kind: "saengsaeng",
        name: `오행 상생 (${from}→${to})`,
        delta: W.saengsaeng,
        desc: `${josa(from, "이", "가")} ${josa(to, "을", "를")} 살리는 상생 관계라 한쪽이 다른 쪽을 자연스럽게 밀어줘.`,
      });
    } else if (CONTROLS[ea] === eb || CONTROLS[eb] === ea) {
      const [from, to] = CONTROLS[ea] === eb ? [ea, eb] : [eb, ea];
      factors.push({
        kind: "sanggeuk",
        name: `오행 상극 (${from}→${to})`,
        delta: W.sanggeuk,
        desc: `${josa(from, "이", "가")} ${josa(to, "을", "를")} 누르는 상극 관계라 주도권 문제가 생기기 쉬워.`,
      });
    }
  }

  if (A.index !== B.index && (A.index + 6) % 12 === B.index) {
    factors.push({
      kind: "chung",
      name: `${pair}충(${pairHanja}沖)`,
      delta: W.chung,
      desc: "정반대 자리에서 마주 보는 충(沖). 끌림도 강하지만 정면으로 부딪히기 쉬워.",
    });
  }
  if (WONJIN_SET.has(k)) {
    factors.push({
      kind: "wonjin",
      name: `${pair} 원진(怨嗔)`,
      delta: W.wonjin,
      desc: "까닭 없이 서운함이 쌓이는 원진(怨嗔). 큰 싸움보다 작은 오해가 문제야.",
    });
  }
  if (A.index !== B.index && HYEONG_SET.has(k)) {
    factors.push({
      kind: "hyeong",
      name: `${pair}형(${pairHanja}刑)`,
      delta: W.hyeong,
      desc: "서로를 바로잡으려 들다 상처를 주는 형(刑). 잔소리와 간섭을 조심해야 해.",
    });
  }
  if (HAE_SET.has(k)) {
    factors.push({
      kind: "hae",
      name: `${pair}해(${pairHanja}害)`,
      delta: W.hae,
      desc: "합을 방해하는 해(害). 둘 사이에 제3자가 끼면 틀어지기 쉬워.",
    });
  }

  if (factors.length === 0) {
    factors.push({
      kind: "neutral",
      name: "특별한 합·충 없음",
      delta: 0,
      desc: "띠끼리 특별히 당기거나 밀어내는 관계가 없어. 궁합은 둘이 만들어가기 나름이야.",
    });
  }

  const adjust = factors
    .filter((f) => !["yukhap", "samhap", "same"].includes(f.kind))
    .reduce((s, f) => s + f.delta, 0);
  const score = Math.max(MIN, Math.min(MAX, base + adjust));

  factors.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  return { score, factors, primary: factors[0].kind };
}
