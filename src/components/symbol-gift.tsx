import { GIFT_LINKS_READY, type GiftPick } from "@/lib/gifts";
import { AffiliateNotice } from "@/components/gift";

/**
 * 상징(띠·별자리) 선물 카드 — 버티컬 공용.
 *
 * - 딥링크 없는 항목은 숨기고, 하나도 없으면 카드 자체를 렌더하지 않는다
 *   (미등록 미디어 노출 방지 — docs/coupang-compliance.md §8)
 * - 수수료 고지(AffiliateNotice)는 제휴 링크보다 위에 둔다
 * - 버튼은 /go/gift/[id] 를 거쳐 클릭을 기록한다. query 에 버티컬별 구분값을 넣는다
 *   (띠: f=tti|fortune&z=<띠>, 별자리: f=zodiac&zs=<별자리>). subId 는 사이트 공통 scoregift.
 */
export interface SymbolGiftSet {
  key: string;
  emoji: string;
  /** "쥐띠", "양자리" */
  name: string;
  items: GiftPick[];
  query: Record<string, string>;
}

export function SymbolGiftCard({ sets, lead }: { sets: SymbolGiftSet[]; lead: string }) {
  if (!GIFT_LINKS_READY) return null;
  const visible = sets
    .map((s) => ({ ...s, items: s.items.filter((i) => i.url) }))
    .filter((s) => s.items.length);
  if (!visible.length) return null;

  return (
    <section className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none" aria-hidden>
          🎁
        </span>
        <div className="flex flex-col">
          <h2 className="text-base font-extrabold leading-snug">
            {visible.length > 1 ? "둘 중 누구에게 선물해?" : `${visible[0].name}에게 선물한다면`}
          </h2>
          <p className="text-xs leading-relaxed text-foreground/60">{lead}</p>
        </div>
      </div>
      <AffiliateNotice />
      <ul className="mt-3 flex flex-col gap-2">
        {visible.flatMap((s) =>
          s.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2.5">
              <span className="text-xl leading-none" aria-hidden>
                {s.emoji}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-bold">{item.label}</span>
                <span className="text-[11px] text-foreground/50">{item.priceLabel}</span>
              </span>
              <a
                href={`/go/gift/${item.id}?${new URLSearchParams({ s: "list", ...s.query }).toString()}`}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary"
              >
                보러가기
              </a>
            </li>
          )),
        )}
      </ul>
    </section>
  );
}
