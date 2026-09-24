import giftsJson from "@/data/gifts.json";
import linksJson from "@/data/gift-links.json";
import { MBTI_KO, type Mbti, type Relation } from "@/lib/mbti";
import { GIFT_PREVIEW } from "@/lib/gift-ready";

/**
 * 선물 추천 데이터.
 *
 * 구조가 2층인 이유:
 *  - catalog  : 선물 1종 = 쿠팡 딥링크 1개. 딥링크 생성 대상은 여기뿐이라
 *               API 호출량이 (타입 × 관계)가 아니라 카탈로그 크기로 고정된다.
 *  - types    : 타입별로 catalog 항목을 고르고 "왜 이 사람한테 맞는지"만 덧붙인다.
 *  - relations: 관계별 금지 태그 / 가격대 / 노출 개수. 조합은 런타임 필터로 만든다.
 */

export type GiftTag =
  | "practical" | "home" | "food" | "tech"
  | "hobby" | "scent" | "personal" | "wearable";

export type PriceBand = "low" | "mid" | "high";

interface CatalogItem {
  label: string;
  query: string;
  tags: GiftTag[];
  band: PriceBand;
}

interface RelationRule {
  deny: GiftTag[];
  bands: PriceBand[];
  take: number;
  /** 관계마다 조사·표현이 달라 템플릿 한 줄로 못 만든다 ("썸 타는 …", "소개팅에서 만난 …") */
  heading: string;
  lead: string;
}

const catalog = giftsJson.catalog as Record<string, CatalogItem>;
const relationRules = giftsJson.relations as Record<string, RelationRule>;
const typePicks = giftsJson.types as Record<string, { angle: string; picks: string[][] }>;

/** 승인 후 scripts/gen-coupang-links.mjs 가 채우는 { catalogId: 파트너스 단축링크 } */
const links = linksJson as Record<string, string>;

/**
 * 표기는 "예산"이다 — 실제 판매가가 아니다.
 * 상품명 옆에 "1~2만원대"라고만 쓰면 그 상품의 가격으로 읽힐 수 있고,
 * 링크는 검색 결과라 가격이 제각각이다. 약관 제8조 2항(사실과 다르거나
 * 오인 가능성 있는 내용 게시)에 걸리지 않도록 예산 가이드임을 문구로 못박는다.
 */
export const PRICE_LABEL: Record<PriceBand, string> = {
  low: "예산 1~2만원",
  mid: "예산 3~5만원",
  high: "예산 5만원+",
};

export interface GiftPick {
  id: string;
  label: string;
  why: string;
  band: PriceBand;
  priceLabel: string;
  /** 파트너스 딥링크. 아직 생성 전이면 null → UI에서 노출하지 않는다. */
  url: string | null;
}

export interface GiftSet {
  angle: string;
  heading: string;
  lead: string;
  items: GiftPick[];
}

export { GIFT_LINKS_READY, GIFT_PREVIEW } from "@/lib/gift-ready";

/** 승인 전 미리보기용 일반 쿠팡 검색 URL (파트너스 링크 아님) */
export function previewUrl(id: string): string | null {
  const item = catalog[id];
  if (!item) return null;
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(item.query)}`;
}

/** 딥링크 우선, 없으면 미리보기 모드에서만 일반 검색 URL */
function linkFor(id: string): string | null {
  return links[id] ?? (GIFT_PREVIEW ? previewUrl(id) : null);
}

/**
 * 상대방 MBTI × 관계에 맞는 선물 목록.
 *
 *  1) 관계 금지 태그 제외 — 절대 규칙. 직장동료에게 향수를 추천하는 사고를 막는다.
 *  2) 관계 가격대를 앞으로 정렬 — 개수가 모자라면 다른 가격대로 채운다.
 */
export function giftsFor(other: Mbti, relation: Relation | string): GiftSet | null {
  const t = typePicks[other];
  const rule = relationRules[relation] ?? relationRules["친구"];
  if (!t || !rule) return null;

  const denied = new Set(rule.deny);
  const allowed = t.picks
    .map(([id, why]) => ({ id, why, item: catalog[id] }))
    .filter((p) => p.item && !p.item.tags.some((tag) => denied.has(tag)));

  // 가격대는 하드 필터가 아니라 정렬 우선순위다. 하드 필터로 쓰면
  // 카탈로그가 저가에 몰린 타입에서 칸이 비어버린다(가족 관계가 특히 그랬음).
  const bands = new Set(rule.bands);
  const ranked = [
    ...allowed.filter((p) => bands.has(p.item.band)),
    ...allowed.filter((p) => !bands.has(p.item.band)),
  ];

  const items = ranked.slice(0, rule.take).map<GiftPick>((p) => ({
    id: p.id,
    label: p.item.label,
    why: p.why,
    band: p.item.band,
    priceLabel: PRICE_LABEL[p.item.band],
    url: linkFor(p.id),
  }));

  if (!items.length) return null;

  const fill = (tpl: string) =>
    tpl.replaceAll("{t}", other).replaceAll("{ko}", MBTI_KO[other] ?? other);

  return {
    angle: t.angle,
    heading: fill(rule.heading),
    lead: fill(rule.lead),
    items,
  };
}

/** 딥링크 생성 스크립트가 읽는 전체 목록 */
export function catalogEntries(): { id: string; query: string }[] {
  return Object.entries(catalog).map(([id, v]) => ({ id, query: v.query }));
}

/**
 * 관계 필터 없이 그 타입의 선물 전체.
 * 상세 페이지 본문(이유 포함)은 여기서 한 번만 렌더하고,
 * 관계별 섹션은 링크만 다시 건다 — 같은 설명이 중복 노출되지 않게.
 */
export function allGiftsFor(other: Mbti): GiftSet | null {
  const t = typePicks[other];
  if (!t) return null;

  const items = t.picks
    .map(([id, why]) => ({ id, why, item: catalog[id] }))
    .filter((p) => p.item)
    .map<GiftPick>((p) => ({
      id: p.id,
      label: p.item.label,
      why: p.why,
      band: p.item.band,
      priceLabel: PRICE_LABEL[p.item.band],
      url: linkFor(p.id),
    }));

  return items.length
    ? { angle: t.angle, heading: `${other}가 좋아하는 선물`, lead: t.angle, items }
    : null;
}
