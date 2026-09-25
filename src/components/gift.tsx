import Link from "next/link";
import { FAMILY_SITES, familyHref } from "@/lib/family";
import {
  giftPath,
  giftRelationAnchor,
  ko,
  type Mbti,
} from "@/lib/mbti";
import {
  GIFT_LINKS_READY,
  allGiftsFor,
  giftsFor,
  type GiftPick,
} from "@/lib/gifts";

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

/**
 * 선물 게이트 CTA (서버 컴포넌트).
 *
 * SEO 유입은 /mbti/[type] · /pair/[slug] 로 떨어지는데 거기엔 선물 진입점이 없었다.
 * 결과 화면까지 가야 보이니 대부분이 게이트를 만나지도 못했다 — 그래서 유입 페이지에 직접 건다.
 *
 * 실제 선물 이름을 칩으로 보여주는 게 핵심이다. "선물 보러가기"라는 빈 약속보다
 * "무드등 · 향초 선물세트"가 눈에 박히고, 이미 고른 느낌이라 클릭 부담이 없다.
 */
export function GiftCta({
  type,
  relation,
  className = "",
}: {
  type: Mbti;
  relation?: string;
  className?: string;
}) {
  if (!GIFT_LINKS_READY) return null;
  const set = relation ? giftsFor(type, relation) : allGiftsFor(type);
  if (!set) return null;

  const href = relation
    ? `${giftPath(type)}#${giftRelationAnchor(relation)}`
    : giftPath(type);

  return (
    <Link
      href={href}
      className={`group block rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-5 shadow-sm transition active:scale-[0.99] ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none" aria-hidden>
          🎁
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-base font-extrabold leading-snug">
            {type}에게 선물한다면?
          </span>
          <span className="text-xs leading-relaxed text-foreground/60">
            {ko(type)} 성격에 맞춰 고른 {set.items.length}가지
            {relation ? ` · ${relation} 사이 기준` : ""}
          </span>
        </div>
        <span className="text-lg font-bold text-primary" aria-hidden>
          →
        </span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {set.items.slice(0, 3).map((i) => (
          <li
            key={i.id}
            className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold text-foreground/70"
          >
            {i.label}
          </li>
        ))}
        <li className="px-1 py-1 text-[11px] font-bold text-primary group-hover:underline">
          전부 보기 →
        </li>
      </ul>
    </Link>
  );
}

/**
 * 선물 페이지 전용 골드박스 링크.
 *
 * "뭘 줄지" 정한 직후가 "얼마에 살지"로 넘어가기 제일 좋은 지점이라,
 * 페이지 맨 아래 패밀리 카드보다 여기가 맞다. 사이트를 goldbox 로 고정한다
 * (관계별로 돌리는 pickFamily 와 달리, 이 맥락에선 특가 사이트가 항상 정답).
 */
export function GoldboxCta({ className = "" }: { className?: string }) {
  const site = FAMILY_SITES.find((s) => s.id === "goldbox");
  if (!site) return null;

  return (
    <a
      href={familyHref(site, "family_gift", "gift_detail")}
      target="_blank"
      rel="noopener"
      className={`group flex items-center gap-3 rounded-3xl border-2 border-dashed border-primary/25 bg-primary/5 p-4 transition hover:border-primary/60 active:scale-[0.99] ${className}`}
    >
      <span className="text-3xl leading-none" aria-hidden>
        {site.emoji}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-foreground/40">
          만든 사람의 다른 서비스 · {site.name}
        </span>
        <span className="text-sm font-extrabold leading-snug">
          살 거 정했으면, 오늘 특가인지는 보고 사자 🎁
        </span>
        <span className="text-xs leading-relaxed text-foreground/60">
          골드박스 오늘의 특가와 역대 최저가를 한눈에
        </span>
        <span className="mt-0.5 text-xs font-bold text-primary group-hover:underline">
          오늘의 특가 보기 →
        </span>
      </span>
    </a>
  );
}

/**
 * 궁합 페이지용 선물 게이트 — 두 유형을 한 카드에 담는다.
 *
 * GiftCta 를 두 번 쌓으면 같은 모양의 그라데이션 카드가 연달아 나와 중복으로 읽힌다.
 * 어느 쪽에 선물할지는 우리가 알 수 없으니(둘 중 하나가 본인) 양쪽 다 열어두되,
 * 카드는 하나로 묶어 시각적 무게를 한 번만 준다.
 */
export function GiftCtaPair({ a, b }: { a: Mbti; b: Mbti }) {
  if (!GIFT_LINKS_READY) return null;
  if (a === b) return <GiftCta type={a} />;

  const sets = [a, b]
    .map((t) => ({ type: t, set: allGiftsFor(t) }))
    .filter((x) => x.set);
  if (!sets.length) return null;

  return (
    <section className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none" aria-hidden>
          🎁
        </span>
        <div className="flex flex-col">
          <h2 className="text-base font-extrabold leading-snug">
            둘 중 누구에게 선물해?
          </h2>
          <p className="text-xs leading-relaxed text-foreground/60">
            성격에 맞춰 골랐고, 관계별로 선 넘지 않는 것만 남겼어
          </p>
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {sets.map(({ type, set }) => (
          <li key={type}>
            <Link
              href={giftPath(type)}
              className="group flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2.5 transition hover:bg-white"
            >
              <span className="flex w-16 shrink-0 flex-col leading-tight">
                <span className="text-sm font-extrabold">{type}</span>
                <span className="text-[10px] font-semibold text-foreground/50">
                  {ko(type)}
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-foreground/60">
                {set!.items.slice(0, 3).map((i) => i.label).join(" · ")}
              </span>
              <span className="shrink-0 text-sm font-bold text-primary group-hover:underline">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
