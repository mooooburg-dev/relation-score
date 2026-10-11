/**
 * 띠별 신년운세 규칙 엔진.
 *
 * 그 해의 띠(태세)와 내 띠의 지지 관계로 총운을 본다 — 띠 궁합(tti-rules.ts)과 같은 계산을
 * "나 × 그 해"에 적용하는 것이다. 2027 정미년이면 양(未)과의 관계: 말띠는 오미합(육합),
 * 소띠는 축미충, 쥐띠는 자미 원진…. 월운은 같은 방식으로 그 달의 지지(월건)와 본다.
 *
 * 점수를 규칙으로 고정하는 이유는 띠 궁합과 같다 — 재생성해도 흔들리지 않고 근거를 보여줄 수 있다.
 * 본문(fortune-content.ts)은 이 점수를 입력으로 받아 쓴다.
 *
 * 클라이언트에서도 import 할 수 있게 JSON 을 import 하지 않는다.
 */
import { scoreTti, ttiOf, type Tti, type TtiRelationKind } from "./tti-rules";
import { TTI_IDS, ttiInfo, ttiName, yearInfo } from "./tti";

/** 운세 페이지를 연 해. 본문 데이터가 있는 해만 정적 생성한다 (fortune-content.ts) */
export const FORTUNE_YEARS = [2027] as const;
export type FortuneYear = (typeof FORTUNE_YEARS)[number];
export const LATEST_FORTUNE_YEAR: FortuneYear = 2027;

export function isFortuneYear(v: number): v is FortuneYear {
  return (FORTUNE_YEARS as readonly number[]).includes(v);
}

export function fortuneIndexPath(year: number): string {
  return `/fortune/${year}`;
}
export function fortunePath(year: number, t: Tti): string {
  return `/fortune/${year}/${t}`;
}

/** "정미년 · 붉은 양의 해" */
export function yearLabel(year: number): { ganji: string; color: string; tti: Tti } {
  const y = yearInfo(year);
  return { ganji: y.ganji, color: y.color, tti: ttiOf(year) };
}

// ---- 총운 ----

/** 신년운세에서는 같은 관계라도 풀이가 다르다 ("궁합"이 아니라 "한 해의 흐름") */
const FORTUNE_DESC: Partial<Record<TtiRelationKind, string>> = {
  yukhap: "그 해의 기운과 짝을 이루는 육합(六合). 도와주는 사람과 기회가 자연스럽게 붙는 해야.",
  samhap: "그 해와 같은 삼합에 속해. 혼자보다 함께 움직일 때 일이 술술 풀리는 해야.",
  same: "자기 띠의 해(본명년). 존재감이 커지는 대신 책임도 함께 커지는 해야.",
  jahyeong: "띠의 해에 스스로 부딪히는 자형(自刑)이 겹쳐. 고집을 조금 내려놓으면 훨씬 편해.",
  chung: "그 해와 정면으로 마주 보는 충(沖). 변화와 이동이 많은 해라 속도 조절이 중요해.",
  wonjin: "그 해와 원진(怨嗔) 관계라 사소한 오해가 쌓이기 쉬워. 말 한마디를 아끼는 게 득이야.",
  hyeong: "그 해와 형(刑) 관계라 간섭과 잔소리가 늘기 쉬워. 규칙과 약속을 분명히 해 둬.",
  hae: "그 해와 해(害) 관계라 계획이 엇갈리기 쉬워. 중요한 일은 한 번 더 확인해.",
  saengsaeng: "그 해와 오행이 서로 살리는 상생 관계라 노력한 만큼 결과가 따라오는 편이야.",
  bihwa: "그 해와 오행이 같아 흐름을 타기 쉬워. 익숙한 분야에서 강점이 살아나.",
  sanggeuk: "그 해와 오행이 서로 누르는 상극 관계라 힘이 많이 드는 구간이 있어. 무리하지 마.",
  neutral: "그 해와 특별히 당기거나 밀어내는 관계가 없어. 내가 움직이는 만큼 흐름이 생겨.",
};

export interface FortuneScore {
  year: number;
  tti: Tti;
  score: number;
  factors: { kind: TtiRelationKind; name: string; delta: number; desc: string }[];
}

export function fortuneScore(year: number, t: Tti): FortuneScore {
  const s = scoreTti(t, ttiOf(year));
  return {
    year,
    tti: t,
    score: s.score,
    factors: s.factors.map((f) => ({ ...f, desc: FORTUNE_DESC[f.kind] ?? f.desc })),
  };
}

export function fortuneLabel(score: number): string {
  if (score >= 88) return "크게 열리는 해";
  if (score >= 80) return "순풍이 부는 해";
  if (score >= 70) return "무난하게 흐르는 해";
  if (score >= 60) return "다지고 가는 해";
  if (score >= 50) return "속도를 조절할 해";
  return "버티며 준비할 해";
}

/** 그 해 띠 순위 (높은 순) */
export function fortuneRanking(year: number): FortuneScore[] {
  return TTI_IDS.map((t) => fortuneScore(year, t)).sort(
    (a, b) => b.score - a.score || TTI_IDS.indexOf(a.tti) - TTI_IDS.indexOf(b.tti),
  );
}

// ---- 월운 ----
// 음력(절기) 1월은 인월(寅). 1월=인, 2월=묘 … 11월=자, 12월=축.

export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function monthTti(month: number): Tti {
  return TTI_IDS[(month + 1) % 12];
}

export function monthScore(t: Tti, month: number): number {
  return scoreTti(t, monthTti(month)).score;
}

/** 월 라벨: "1월(인월·호랑이)" */
export function monthLabel(month: number): string {
  const m = ttiInfo(monthTti(month));
  return `${month}월 (${m.branch}월)`;
}

// ---- 삼재 ----
// 삼합 그룹마다 삼재가 드는 세 해가 정해져 있다(민속). 신자진 → 인묘진년, 해묘미 → 사오미년,
// 인오술 → 신유술년, 사유축 → 해자축년. 셋 중 첫 해가 들삼재, 가운데가 눌삼재, 끝이 날삼재.

const SAMJAE: { group: Tti[]; years: Tti[] }[] = [
  { group: ["monkey", "rat", "dragon"], years: ["tiger", "rabbit", "dragon"] },
  { group: ["pig", "rabbit", "goat"], years: ["snake", "horse", "goat"] },
  { group: ["tiger", "horse", "dog"], years: ["monkey", "rooster", "dog"] },
  { group: ["snake", "rooster", "ox"], years: ["pig", "rat", "ox"] },
];
const SAMJAE_STAGE = ["들삼재", "눌삼재", "날삼재"] as const;
export type SamjaeStage = (typeof SAMJAE_STAGE)[number];

export function samjae(year: number, t: Tti): SamjaeStage | null {
  const y = ttiOf(year);
  const row = SAMJAE.find((r) => r.group.includes(t));
  const i = row ? row.years.indexOf(y) : -1;
  return i >= 0 ? SAMJAE_STAGE[i] : null;
}

export function samjaeTtis(year: number): { tti: Tti; stage: SamjaeStage }[] {
  return TTI_IDS.map((t) => ({ tti: t, stage: samjae(year, t) }))
    .filter((x): x is { tti: Tti; stage: SamjaeStage } => x.stage !== null);
}

export const SAMJAE_NOTE: Record<SamjaeStage, string> = {
  들삼재: "삼재가 들어오는 첫해. 새 일을 크게 벌이기보다 기반을 점검하는 해로 보는 편이야.",
  눌삼재: "삼재가 머무는 가운데 해. 무리한 확장보다 지키는 쪽이 낫다고 봐.",
  날삼재: "삼재가 나가는 마지막 해. 정리가 끝나 가는 해라 오히려 다음을 준비하기 좋아.",
};

// ---- 행운의 색 ----
// 내 띠의 오행을 살려주는(생해 주는) 오행의 색. 수←금, 목←수, 화←목, 토←화, 금←토.

const LUCKY: Record<string, { color: string; element: string }> = {
  수: { color: "흰색·은색", element: "금" },
  목: { color: "검정·네이비", element: "수" },
  화: { color: "초록", element: "목" },
  토: { color: "빨강·자주", element: "화" },
  금: { color: "노랑·베이지", element: "토" },
};

export function luckyColor(t: Tti): { color: string; element: string } {
  return LUCKY[ttiInfo(t).element];
}

// ---- 출생연도 ----

/** 운세 본문에 출생연도별 한마디를 붙이는 범위 */
export const FORTUNE_BIRTH_MIN = 1948;
export const FORTUNE_BIRTH_MAX = 2020;

export function fortuneBirthYears(t: Tti): number[] {
  const out: number[] = [];
  for (let y = FORTUNE_BIRTH_MIN; y <= FORTUNE_BIRTH_MAX; y++) if (ttiOf(y) === t) out.push(y);
  return out;
}

/** 그 해 기준 만 나이 (생일 지난 뒤) */
export function ageIn(year: number, birthYear: number): number {
  return year - birthYear;
}

export function fortuneTitleName(year: number, t: Tti): string {
  return `${year} ${ttiName(t)} 운세`;
}
