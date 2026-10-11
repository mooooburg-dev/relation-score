/**
 * Google Fonts에서 사용 글자만 서브셋으로 받아 OG 이미지 한글 렌더링에 사용.
 * 실패 시 null 반환 → 호출부에서 기본 폰트로 폴백.
 *
 * 빌드 때 OG·차트 이미지 수백 장을 한꺼번에 프리렌더하면서 요청이 몰리면 Google Fonts 가
 * 간헐적으로 실패한다(2026-10-11 운영 빌드가 /mbti/[type]/chart.png 에서
 * "No fonts are loaded" 로 깨졌다 — 같은 커밋의 프리뷰 빌드는 통과). 그래서
 *  - 동시 요청 수를 제한하고
 *  - 실패하면 지수 백오프로 재시도하고
 *  - 같은 글자 집합은 프로세스 안에서 한 번만 받는다.
 */

const MAX_CONCURRENT = 4;
const RETRIES = 4;

let active = 0;
const waiters: (() => void)[] = [];

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((r) => waiters.push(r));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    waiters.shift()?.();
  }
}

async function fetchOk(url: string): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < RETRIES; i++) {
    try {
      const res = await withSlot(() => fetch(url));
      if (res.ok) return res;
      last = new Error(`${res.status} ${url}`);
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, 400 * 2 ** i));
  }
  throw last;
}

// /api/og 는 런타임에 임의 텍스트로 불리므로 상한을 둔다 (오래된 것부터 버림)
const CACHE_MAX = 300;
const cache = new Map<string, Promise<ArrayBuffer | null>>();

export function loadKoreanFont(text: string): Promise<ArrayBuffer | null> {
  // 서브셋은 글자 집합만 중요하다 — 정렬·중복 제거해 캐시 적중률을 높인다
  const chars = [...new Set(text)].sort().join("");
  const hit = cache.get(chars);
  if (hit) return hit;

  const p = load(chars).then((font) => {
    // 실패는 캐시에 남기지 않는다 — 다음 호출이 다시 시도하게
    if (!font) cache.delete(chars);
    return font;
  });
  cache.set(chars, p);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  return p;
}

async function load(chars: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@800&text=${encodeURIComponent(
      chars,
    )}`;
    const css = await (await fetchOk(url)).text();
    const src = css.match(
      /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/,
    );
    if (!src) return null;
    return await (await fetchOk(src[1])).arrayBuffer();
  } catch {
    return null;
  }
}
