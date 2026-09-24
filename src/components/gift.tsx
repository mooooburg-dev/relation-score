import type { GiftPick } from "@/lib/gifts";

/**
 * 쿠팡 파트너스 수수료 고지.
 *
 * 노출 의무가 있어서 뺄 수 없다. 대신 제휴 링크가 처음 나오기 "전"에
 * 한 번만, 본문 흐름을 끊지 않는 크기로 둔다.
 */
export function AffiliateNotice() {
  return (
    <p className="mt-3 text-[10px] leading-relaxed text-foreground/35">
      표시된 금액은 선물 예산 가이드고, 실제 판매가는 링크에서 확인해. 이 페이지의
      상품 링크는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를
      제공받아.
    </p>
  );
}

/** 쿠팡 검색 결과로 보내는 제휴 버튼. 링크가 아직 없으면 렌더하지 않는다. */
export function GiftButton({
  item,
  compact = false,
}: {
  item: GiftPick;
  compact?: boolean;
}) {
  if (!item.url) return null;

  // rel="sponsored nofollow" — 제휴 링크임을 검색엔진에 명시
  const rel = "sponsored nofollow noopener noreferrer";

  if (compact) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel={rel}
        className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary"
      >
        보러가기
      </a>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel={rel}
      className="mt-2.5 block rounded-xl bg-primary py-2.5 text-center text-sm font-bold text-white transition active:scale-[0.98]"
    >
      {item.label} 보러가기 →
    </a>
  );
}
