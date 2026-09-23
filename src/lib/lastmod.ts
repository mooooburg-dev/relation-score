import lastmodJson from "@/data/lastmod.json";
import { CONTENT_UPDATED } from "./mbti";

/**
 * URL별 마지막 콘텐츠 변경일.
 * `npm run build && npm run lastmod` 이 렌더 결과를 해시해 갱신한다.
 * (본문이 실제로 달라진 URL 만 날짜가 올라간다 — scripts/update-lastmod.mjs 참고)
 */
const MAP = lastmodJson as Record<string, { hash: string; lastmod: string }>;

export function lastmodFor(path: string): Date {
  const entry = MAP[path];
  return entry ? new Date(entry.lastmod) : CONTENT_UPDATED;
}
