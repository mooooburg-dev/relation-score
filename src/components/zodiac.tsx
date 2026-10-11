import Link from "next/link";
import {
  ZODIAC_IDS,
  zodiacInfo,
  zodiacName,
  zodiacPairPath,
  zodiacScoreEmoji,
  zodiacTypePath,
  type Zodiac,
} from "@/lib/zodiac";
import { getZodiacRanking } from "@/lib/zodiac-content";
import { zodiacGiftsFor } from "@/lib/zodiac-gifts";
import { SymbolGiftCard } from "@/components/symbol-gift";

/** 12별자리 링크 그리드 */
export function ZodiacGrid({ current }: { current?: Zodiac }) {
  return (
    <ul className="grid grid-cols-3 gap-2">
      {ZODIAC_IDS.map((z) => (
        <li key={z}>
          <Link
            href={zodiacTypePath(z)}
            className={`flex flex-col items-center rounded-xl border-2 py-1.5 text-sm font-bold transition ${
              z === current
                ? "border-primary bg-primary/10 text-primary"
                : "border-foreground/10 bg-background hover:border-primary/50"
            }`}
          >
            <span aria-hidden>{zodiacInfo(z).symbol}</span>
            <span>{zodiacName(z)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 상대 별자리 순위 */
export function ZodiacRankingList({
  me,
  exclude,
  limit,
}: {
  me: Zodiac;
  exclude?: Zodiac;
  limit?: number;
}) {
  const items = getZodiacRanking(me)
    .filter((r) => r.other !== exclude)
    .slice(0, limit ?? 12);
  return (
    <ol className="flex flex-col gap-1.5">
      {items.map((r, i) => (
        <li key={r.other}>
          <Link
            href={zodiacPairPath(me, r.other)}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-background"
          >
            {!limit && (
              <span className="w-5 shrink-0 text-right text-xs font-bold text-foreground/40">
                {i + 1}
              </span>
            )}
            <span className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-bold">
              <span aria-hidden>{zodiacInfo(r.other).symbol}</span>
              {me === r.other ? `같은 ${zodiacName(r.other)}` : zodiacName(r.other)}
            </span>
            <span className="flex-1 truncate text-xs text-foreground/60">{r.pair.headline}</span>
            <span className="shrink-0 text-sm font-extrabold text-primary">
              {zodiacScoreEmoji(r.score)} {r.score}
            </span>
          </Link>
        </li>
      ))}
      {limit && (
        <li className="mt-1 text-right">
          <Link
            href={zodiacTypePath(me)}
            className="text-xs font-bold text-primary underline underline-offset-2"
          >
            {zodiacName(me)} 전체 궁합 순위 →
          </Link>
        </li>
      )}
    </ol>
  );
}

/** 별자리 선물 카드. 클릭은 f=zodiac, zs=<별자리> 로 기록된다 */
export function ZodiacGiftCard({ signs, lead }: { signs: Zodiac[]; lead?: string }) {
  return (
    <SymbolGiftCard
      lead={lead ?? "생일 선물로 별자리 아이템은 의미까지 챙길 수 있어"}
      sets={[...new Set(signs)].map((z) => ({
        key: z,
        emoji: zodiacInfo(z).symbol,
        name: zodiacName(z),
        items: zodiacGiftsFor(z),
        query: { zs: z, f: "zodiac" },
      }))}
    />
  );
}

export function ZodiacDisclaimer() {
  return (
    <p className="text-center text-[11px] leading-relaxed text-foreground/40">
      별자리 궁합 점수는 서양 점성술의 각도(트라인·섹스타일·스퀘어 등)와 지배성을 바탕으로
      계산한 참고용 콘텐츠야. 실제 관계는 두 사람이 만들어가기 나름이야.
    </p>
  );
}
