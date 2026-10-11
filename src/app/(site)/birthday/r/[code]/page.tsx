import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/seo";
import { GoldboxCta } from "@/components/gift";
import { FamilyCard } from "@/components/family";
import { BirthdayResult } from "@/components/birthday-result";
import { ZodiacGiftCard } from "@/components/zodiac";
import { birthdayLabel, birthdayMatch, decodeBirthdayShare } from "@/lib/birthday-match";
import { ttiName, YEAR_MAX } from "@/lib/tti";
import { zodiacName } from "@/lib/zodiac";
import { recordToolView } from "@/lib/tool-views";

type Params = { code: string };

// 개인 결과라 noindex. 생년월일은 제목·설명에 쓰지 않는다 (미리보기로 퍼지므로)
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const dates = decodeBirthdayShare((await params).code, YEAR_MAX);
  const robots = { index: false, follow: true };
  if (!dates) return { robots };
  const r = birthdayMatch(dates[0], dates[1]);
  const title = `생일 궁합 ${r.score}점 - ${ttiName(r.ttiA)}×${ttiName(r.ttiB)}, ${zodiacName(r.zodiacA)}×${zodiacName(r.zodiacB)}`;
  const description = `${birthdayLabel(r.score)}! 우리 생일 궁합은 몇 점? 생년월일 넣고 바로 확인해보기`;
  return {
    title,
    description,
    robots,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BirthdaySharePage({ params }: { params: Promise<Params> }) {
  const dates = decodeBirthdayShare((await params).code, YEAR_MAX);
  if (!dates) notFound();
  await recordToolView("birthday");
  const r = birthdayMatch(dates[0], dates[1]);

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <header className="text-center">
        <p className="text-sm font-bold text-foreground/50">생일 궁합 결과</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">우리 생일 궁합은?</h1>
      </header>
      <Card>
        <BirthdayResult a={dates[0]} b={dates[1]} />
      </Card>
      <Link
        href="/birthday"
        className="block rounded-2xl bg-primary py-4 text-center text-base font-bold text-white shadow-md transition active:scale-[0.98]"
      >
        나도 생일 궁합 보기 🎂
      </Link>
      <ZodiacGiftCard signs={[r.zodiacA, r.zodiacB]} />
      <GoldboxCta
        campaign="family_birthday-share-cta"
        content="birthday_share"
        vertical="birthday"
        title="생일 챙길 사람 있으면, 선물은 특가로 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />
      <Link
        href="/name"
        className="block rounded-2xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary"
      >
        💘 이름으로도 궁합 보기 →
      </Link>
      <FamilyCard seed={`${r.ttiA}${r.zodiacA}`} campaign="birthday-share" />
    </main>
  );
}
