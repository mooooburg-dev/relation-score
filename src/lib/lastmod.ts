import lastmodJson from "@/data/lastmod.json";
import { CONTENT_UPDATED } from "./mbti";

/**
 * URL별 마지막 콘텐츠 변경일.
 * `npm run build && npm run lastmod` 이 렌더 결과를 해시해 갱신한다.
 * (본문이 실제로 달라진 URL 만 날짜가 올라간다 — scripts/update-lastmod.mjs 참고)
 */
const MAP = lastmodJson as Record<string, { hash: string; lastmod: string }>;

/**
 * 기록에 없는 URL이 쓰는 값. 기록 중 가장 최근 날짜를 쓴다.
 * 고정 상수를 쓰면, 아직 lastmod.json 에 반영되지 않은 새 페이지가
 * 주변 페이지보다 오래된 날짜로 나가는 역전이 생긴다.
 */
const FALLBACK = new Date(
  Math.max(
    CONTENT_UPDATED.getTime(),
    ...Object.values(MAP).map((v) => new Date(v.lastmod).getTime()),
  ),
);

export function lastmodFor(path: string): Date {
  const entry = MAP[path];
  return entry ? new Date(entry.lastmod) : FALLBACK;
}
