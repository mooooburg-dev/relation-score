/**
 * 별자리 궁합 점수 규칙 — 앱과 본문 작성 스크립트가 함께 쓰는 단일 출처.
 *
 * 서양 점성술의 각도(aspect)로 본다. 황도 12궁은 30°씩 떨어져 있어 두 별자리 사이의
 * 칸 수(0~6)가 곧 각도다.
 *   0칸 컨정션(같은 별자리) 78 · 1칸 세미섹스타일(30°) 62 · 2칸 섹스타일(60°) 84
 *   3칸 스퀘어(90°) 50 · 4칸 트라인(120°, 같은 원소) 92 · 5칸 퀸컹스(150°) 56
 *   6칸 오포지션(180°, 정반대) 70
 * 가산점: 같은 지배성 +4, 금성·화성 지배 별자리 짝 +3, 해(사자)·달(게) +3. 96 으로 자른다.
 *
 * tti-rules.ts 와 같은 이유로 다른 모듈을 import 하지 않고, 타입만 지우면 도는 문법만 쓴다.
 */

export type Zodiac =
  | "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo"
  | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export type ZodiacElement = "불" | "흙" | "공기" | "물";
export type Modality = "활동" | "고정" | "변통";

export interface ZodiacInfo {
  id: Zodiac;
  index: number;
  /** "양자리" */
  ko: string;
  /** 다른 이름 (사수자리 = 궁수자리) */
  alias?: string;
  symbol: string;
  element: ZodiacElement;
  modality: Modality;
  /** 지배성 */
  ruler: string;
  /** 생일 범위 [시작월, 시작일, 끝월, 끝일] — 해마다 하루 정도 달라질 수 있다 */
  dates: [number, number, number, number];
}

const ROWS: [Zodiac, string, string, ZodiacElement, Modality, string, [number, number, number, number], string?][] = [
  ["aries", "양자리", "♈", "불", "활동", "화성", [3, 21, 4, 19]],
  ["taurus", "황소자리", "♉", "흙", "고정", "금성", [4, 20, 5, 20]],
  ["gemini", "쌍둥이자리", "♊", "공기", "변통", "수성", [5, 21, 6, 21]],
  ["cancer", "게자리", "♋", "물", "활동", "달", [6, 22, 7, 22]],
  ["leo", "사자자리", "♌", "불", "고정", "태양", [7, 23, 8, 22]],
  ["virgo", "처녀자리", "♍", "흙", "변통", "수성", [8, 23, 9, 23]],
  ["libra", "천칭자리", "♎", "공기", "활동", "금성", [9, 24, 10, 22]],
  ["scorpio", "전갈자리", "♏", "물", "고정", "화성", [10, 23, 11, 22]],
  ["sagittarius", "사수자리", "♐", "불", "변통", "목성", [11, 23, 12, 24], "궁수자리"],
  ["capricorn", "염소자리", "♑", "흙", "활동", "토성", [12, 25, 1, 19]],
  ["aquarius", "물병자리", "♒", "공기", "고정", "토성", [1, 20, 2, 18]],
  ["pisces", "물고기자리", "♓", "물", "변통", "목성", [2, 19, 3, 20]],
];

export const ZODIAC_LIST: ZodiacInfo[] = ROWS.map(
  ([id, ko, symbol, element, modality, ruler, dates, alias], index) => ({
    id,
    index,
    ko,
    alias,
    symbol,
    element,
    modality,
    ruler,
    dates,
  }),
);

/** 생일(월·일) → 별자리 */
export function zodiacOf(month: number, day: number): Zodiac {
  for (const z of ZODIAC_LIST) {
    const [sm, sd, em, ed] = z.dates;
    const afterStart = month > sm || (month === sm && day >= sd);
    const beforeEnd = month < em || (month === em && day <= ed);
    // 염소자리처럼 해를 넘기는 범위는 둘 중 하나만 맞아도 된다
    if (sm <= em ? afterStart && beforeEnd : afterStart || beforeEnd) return z.id;
  }
  return "capricorn";
}

export type ZodiacRelationKind =
  | "conjunction" | "semisextile" | "sextile" | "square" | "trine" | "quincunx" | "opposition"
  | "coruler" | "venusmars" | "sunmoon";

export interface ZodiacFactor {
  kind: ZodiacRelationKind;
  name: string;
  delta: number;
  desc: string;
}

export interface ZodiacScore {
  score: number;
  factors: ZodiacFactor[];
  primary: ZodiacRelationKind;
}

const BASE = 70;
const ASPECT: { kind: ZodiacRelationKind; name: string; score: number; desc: string }[] = [
  {
    kind: "conjunction",
    name: "컨정션 (같은 별자리)",
    score: 78,
    desc: "같은 별자리라 말하지 않아도 통하는 부분이 많아. 대신 단점도 똑같이 닮았어.",
  },
  {
    kind: "semisextile",
    name: "세미섹스타일 (30°)",
    score: 62,
    desc: "황도에서 바로 옆자리. 원소가 달라 생활 감각이 어긋나지만, 서로에게 없는 걸 배우는 사이야.",
  },
  {
    kind: "sextile",
    name: "섹스타일 (60°)",
    score: 84,
    desc: "서로를 북돋는 원소끼리 만난 60°. 대화가 잘 통하고 함께 있으면 기회가 잘 생기는 조합이야.",
  },
  {
    kind: "square",
    name: "스퀘어 (90°)",
    score: 50,
    desc: "추진 방식이 직각으로 부딪히는 90°. 긴장이 크지만 그만큼 서로를 성장시키기도 해.",
  },
  {
    kind: "trine",
    name: "트라인 (120°)",
    score: 92,
    desc: "같은 원소끼리 만나는 120°. 리듬과 가치관이 자연스럽게 맞아 편안하게 흘러가는 조합이야.",
  },
  {
    kind: "quincunx",
    name: "퀸컹스 (150°)",
    score: 56,
    desc: "원소도 성향도 겹치는 게 없는 150°. 서로를 이해하려면 꾸준한 조율이 필요해.",
  },
  {
    kind: "opposition",
    name: "오포지션 (180°)",
    score: 70,
    desc: "황도의 정반대 자리. 내게 없는 걸 가진 상대라 강하게 끌리지만, 균형을 잡는 게 숙제야.",
  },
];

const VENUS_MARS = new Set(["taurus-aries", "taurus-scorpio", "libra-aries", "libra-scorpio"]);

export function scoreZodiac(a: Zodiac, b: Zodiac): ZodiacScore {
  const A = ZODIAC_LIST.find((z) => z.id === a)!;
  const B = ZODIAC_LIST.find((z) => z.id === b)!;
  const d = Math.abs(A.index - B.index);
  const steps = Math.min(d, 12 - d);
  const aspect = ASPECT[steps];
  const factors: ZodiacFactor[] = [
    { kind: aspect.kind, name: aspect.name, delta: aspect.score - BASE, desc: aspect.desc },
  ];

  if (a !== b && A.ruler === B.ruler) {
    factors.push({
      kind: "coruler",
      name: `같은 지배성 (${A.ruler})`,
      delta: 4,
      desc: `둘 다 ${A.ruler}의 영향을 받아. 표현 방식은 달라도 움직이는 동기가 닮았어.`,
    });
  }
  if (VENUS_MARS.has(`${a}-${b}`) || VENUS_MARS.has(`${b}-${a}`)) {
    factors.push({
      kind: "venusmars",
      name: "금성 × 화성",
      delta: 3,
      desc: "사랑의 금성과 열정의 화성이 만나는 짝. 이성적인 끌림이 유난히 강한 편이야.",
    });
  }
  if ((a === "leo" && b === "cancer") || (a === "cancer" && b === "leo")) {
    factors.push({
      kind: "sunmoon",
      name: "태양 × 달",
      delta: 3,
      desc: "태양(사자자리)과 달(게자리)이 만나는 짝. 서로의 빈 곳을 비춰주는 관계야.",
    });
  }

  const score = Math.min(96, factors.reduce((s, f) => s + f.delta, BASE));
  return { score, factors, primary: aspect.kind };
}
