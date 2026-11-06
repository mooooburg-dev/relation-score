import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/seo";
import { GoldboxCta } from "@/components/gift";
import { FamilyCard } from "@/components/family";
import KakaoShareButton from "@/components/kakao-share";
import { dayCount, daysUntil, decodeAnniversaryShare, dLabel, upcoming } from "@/lib/anniversary";
import { kstToday, weekdayOf } from "@/lib/daily";
import { recordToolView } from "@/lib/tool-views";

type Params = { code: string };

// 날짜가 지나면 D-day 가 바뀌므로 매 요청 계산한다. 개인 결과라 noindex (사귄 날은 제목에 쓰지 않는다)
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const r = decodeAnniversaryShare((await params).code);
  const robots = { index: false, follow: true };
  if (!r) return { robots };
  const today = kstToday();
  const n = dayCount(r.start, today, r.includeStart);
  const next = upcoming(r.start, today, r.includeStart, 1)[0];
  const title = `우리 D+${n}${next ? ` · ${next.label}까지 ${dLabel(daysUntil(next.date, today))}` : ""}`;
  const description = "커플 기념일 계산기 — 우리 100일·1주년은 언제? 사귄 날만 넣고 바로 확인해보기";
  return { title, description, robots, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

export default async function AnniversarySharePage({ params }: { params: Promise<Params> }) {
  const { code } = await params;
  const r = decodeAnniversaryShare(code);
  if (!r) notFound();
  await recordToolView("anniversary");
  const today = kstToday();
  const n = dayCount(r.start, today, r.includeStart);
  const list = upcoming(r.start, today, r.includeStart, 4);

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <header className="text-center">
        <p className="text-sm font-bold text-foreground/50">커플 기념일</p>
        <h1 className="mt-1 text-5xl font-extrabold text-primary">D+{n}</h1>
        <p className="mt-1 text-sm font-bold">오늘은 사귄 지 {n}일째 💕</p>
      </header>
      <Card>
        <ul className="flex flex-col divide-y divide-foreground/5 text-sm">
          {list.map((m) => (
            <li key={m.key} className="flex items-center justify-between py-2">
              <span className="font-bold">{m.label}</span>
              <span className="text-foreground/60">
                {m.date.y}.{m.date.m}.{m.date.d}({weekdayOf(m.date)})
              </span>
              <span className="w-16 text-right font-extrabold text-primary">{dLabel(daysUntil(m.date, today))}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Link href="/anniversary" className="block rounded-2xl bg-primary py-4 text-center text-base font-bold text-white shadow-md">
        우리 기념일도 계산하기 💑
      </Link>
      <KakaoShareButton path={`/anniversary/r/${code}`} where="anniversary-share" label="카톡으로 보내기" />
      <GoldboxCta
        campaign="family_anniversary-share-cta"
        content="anniversary_share"
        vertical="anniversary"
        title="기념일 선물, 오늘 특가인지 보고 사자 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />
      <FamilyCard seed={code} campaign="anniversary-share" />
    </main>
  );
}
