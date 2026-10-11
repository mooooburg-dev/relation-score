import Link from "next/link";
import {
  TTI_IDS,
  TTI_INDEX_PATH,
  ttiInfo,
  ttiName,
  ttiPairPath,
  ttiScoreEmoji,
  ttiTypePath,
  type Tti,
} from "@/lib/tti";
import { getTtiRanking } from "@/lib/tti-content";
import { ttiGiftsFor } from "@/lib/tti-gifts";
import { SymbolGiftCard } from "@/components/symbol-gift";
import { Card, SectionTitle } from "@/components/seo";

/** 12띠 링크 그리드 */
export function TtiGrid({ current }: { current?: Tti }) {
  return (
    <ul className="grid grid-cols-4 gap-2">
      {TTI_IDS.map((t) => {
        const info = ttiInfo(t);
        return (
          <li key={t}>
            <Link
              href={ttiTypePath(t)}
              className={`flex flex-col items-center rounded-xl border-2 py-1.5 text-sm font-bold transition ${
                t === current
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-foreground/10 bg-background hover:border-primary/50"
              }`}
            >
              <span aria-hidden>{info.emoji}</span>
              <span>{ttiName(t)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** "왜 이 점수인지" — 규칙 근거 카드 */
export function TtiFactors({
  factors,
  score,
  title,
  lead,
  footnote,
}: {
  /** 띠·별자리 공용 — kind 는 key 로만 쓴다 */
  factors: { kind: string; name: string; delta: number; desc: string }[];
  score: number;
  title?: string;
  /** 카드 위쪽 설명 (신년운세: "그 해의 띠와 내 띠의 관계로 봐") */
  lead?: string;
  /** 카드 아래 계산 방법 안내 (기본: 띠 궁합) */
  footnote?: React.ReactNode;
}) {
  return (
    <Card>
      <SectionTitle>{title ?? `왜 ${score}점일까?`}</SectionTitle>
      {lead && <p className="-mt-1 mb-3 text-xs leading-relaxed text-foreground/50">{lead}</p>}
      <ul className="flex flex-col gap-3">
        {factors.map((f) => (
          <li key={f.kind + f.name} className="flex gap-3">
            <span
              className={`mt-0.5 w-10 shrink-0 rounded-lg py-0.5 text-center text-xs font-extrabold ${
                f.delta > 0
                  ? "bg-primary/10 text-primary"
                  : f.delta < 0
                    ? "bg-foreground/5 text-foreground/50"
                    : "bg-foreground/5 text-foreground/40"
              }`}
            >
              {f.delta > 0 ? `+${f.delta}` : f.delta < 0 ? f.delta : "±0"}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-bold">{f.name}</span>
              <span className="text-sm leading-relaxed text-foreground/70">{f.desc}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-foreground/40">
        {footnote ?? (
          <>
            기본 70점에서 육합·삼합이면 크게 오르고, 충·원진·형·해가 있으면 깎이는 방식으로
            계산했어. <Link href={`${TTI_INDEX_PATH}#how`} className="underline">계산 방법 보기</Link>
          </>
        )}
      </p>
    </Card>
  );
}

/** 상대 띠 순위 목록 */
export function TtiRankingList({
  me,
  exclude,
  limit,
}: {
  me: Tti;
  exclude?: Tti;
  limit?: number;
}) {
  const items = getTtiRanking(me)
    .filter((r) => r.other !== exclude)
    .slice(0, limit ?? 12);
  return (
    <ol className="flex flex-col gap-1.5">
      {items.map((r, i) => {
        const o = ttiInfo(r.other);
        return (
          <li key={r.other}>
            <Link
              href={ttiPairPath(me, r.other)}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-background"
            >
              {!limit && (
                <span className="w-5 shrink-0 text-right text-xs font-bold text-foreground/40">
                  {i + 1}
                </span>
              )}
              <span className="flex w-24 shrink-0 items-center gap-1.5 text-sm font-bold">
                <span aria-hidden>{o.emoji}</span>
                {me === r.other ? `같은 ${ttiName(r.other)}` : ttiName(r.other)}
              </span>
              <span className="flex-1 truncate text-xs text-foreground/60">
                {r.pair.headline}
              </span>
              <span className="shrink-0 text-sm font-extrabold text-primary">
                {ttiScoreEmoji(r.score)} {r.score}
              </span>
            </Link>
          </li>
        );
      })}
      {limit && (
        <li className="mt-1 text-right">
          <Link
            href={ttiTypePath(me)}
            className="text-xs font-bold text-primary underline underline-offset-2"
          >
            {ttiName(me)} 전체 궁합 순위 →
          </Link>
        </li>
      )}
    </ol>
  );
}

/** 띠 선물 카드. 클릭은 entry(띠 궁합/신년운세)와 띠로 구분해 기록한다 */
export function TtiGiftCard({
  ttis,
  lead,
  entry = "tti",
}: {
  ttis: Tti[];
  lead?: string;
  /** 클릭 기록(gift_clicks.entry)용 출처 — 띠 궁합 / 신년운세 */
  entry?: "tti" | "fortune";
}) {
  return (
    <SymbolGiftCard
      lead={lead ?? "돌·생일·환갑처럼 띠가 의미 있는 날에 특히 반응이 좋아"}
      sets={[...new Set(ttis)].map((t) => ({
        key: t,
        emoji: ttiInfo(t).emoji,
        name: ttiName(t),
        items: ttiGiftsFor(t),
        query: { z: t, f: entry },
      }))}
    />
  );
}

/** 페이지 하단 고지. 전통 해석을 재미로 본다는 점을 분명히 한다 */
export function TtiDisclaimer() {
  return (
    <p className="text-center text-[11px] leading-relaxed text-foreground/40">
      띠 궁합 점수는 전통 명리의 지지 관계(합·충·원진·형·해)와 오행을 바탕으로 계산한
      참고용 콘텐츠야. 실제 관계는 두 사람이 만들어가기 나름이야.
    </p>
  );
}
