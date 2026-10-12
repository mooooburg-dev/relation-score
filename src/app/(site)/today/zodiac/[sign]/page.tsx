import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleAd, Breadcrumb, Card, JsonLd, SectionTitle, breadcrumbLd } from "@/components/seo";
import { GoldboxCta } from "@/components/gift";
import { DailyView } from "@/components/daily-view";
import { WeekFlow } from "@/components/week-flow";
import MyToday from "@/components/my-today";
import { SITE_URL } from "@/lib/site";
import { ZODIAC_IDS, isZodiac, zodiacInfo, zodiacName, zodiacTypePath, type Zodiac } from "@/lib/zodiac";
import {
  TODAY_PATH,
  addDays,
  bestDaysOfMonth,
  dateLabel,
  kstToday,
  moonSign,
  todayZodiacPath,
  weekScores,
  zodiacDaily,
} from "@/lib/daily";
import { dailyText } from "@/lib/daily-content";

// 날짜가 바뀌면 내용이 바뀐다 — 10분마다 다시 만든다(ISR)
export const revalidate = 600;
export const dynamicParams = false;

export function generateStaticParams() {
  return ZODIAC_IDS.map((sign) => ({ sign }));
}

type Params = { sign: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { sign } = await params;
  if (!isZodiac(sign)) return {};
  const today = kstToday();
  const s = zodiacDaily(sign, today);
  const name = zodiacName(sign);
  const title = `${name} 오늘의 운세 - ${dateLabel(today)} ${s.score}점`;
  const description = `${name} 오늘의 별자리 운세 ${s.score}점. ${dailyText(`zodiac:${sign}`, s).total} 오늘 달의 위치로 본 연애·재물·일·인간관계 운세를 매일 업데이트.`;
  const path = todayZodiacPath(sign);
  const alias = zodiacInfo(sign).alias;
  return {
    title,
    description,
    keywords: [
      `${name} 오늘의 운세`,
      `${name} 오늘 운세`,
      `오늘의 ${name} 운세`,
      ...(alias ? [`${alias} 오늘의 운세`] : []),
      "별자리 오늘의 운세",
    ],
    alternates: { canonical: path },
    openGraph: { title: `${title} | 몇점이야?`, description, url: `${SITE_URL}${path}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ZodiacTodayPage({ params }: { params: Promise<Params> }) {
  const { sign } = await params;
  if (!isZodiac(sign)) notFound();
  const z: Zodiac = sign;
  const today = kstToday();
  const s = zodiacDaily(z, today);
  const text = dailyText(`zodiac:${z}`, s);
  const moon = zodiacName(moonSign(today));
  const name = zodiacName(z);
  const path = todayZodiacPath(z);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${name} 오늘의 운세 (${dateLabel(today)})`,
        description: text.total,
        url: `${SITE_URL}${path}`,
        inLanguage: "ko-KR",
        dateModified: new Date().toISOString(),
        author: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        publisher: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
      },
      breadcrumbLd([
        { name: "오늘의 운세", path: TODAY_PATH },
        { name: `${name} 오늘의 운세`, path },
      ]),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "오늘의 운세", path: TODAY_PATH }, { name }]} />
      <MyToday variant="compact" />

      <header className="text-center">
        <p className="text-5xl leading-none" aria-hidden>
          {zodiacInfo(z).symbol}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {name} 오늘의 운세
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {dateLabel(today)} · 달은 {moon}에
          </span>
        </h1>
      </header>

      <DailyView
        score={s}
        text={text}
        tomorrow={zodiacDaily(z, addDays(today, 1)).score}
        basisTitle={`${name}와 오늘 달(${moon})의 관계`}
        basisNote="달은 약 2.5일마다 별자리를 옮겨. 오늘 달이 있는 별자리와 내 별자리의 각도(별자리 궁합 규칙)로 계산했어."
      />

      <WeekFlow
        week={weekScores((d) => zodiacDaily(z, d).score, today)}
        monthBest={bestDaysOfMonth((d) => zodiacDaily(z, d).score, today)}
        today={today}
      />

      <ArticleAd />

      <GoldboxCta
        campaign="family_today-cta"
        content={`zodiac-${z}`}
        vertical="today"
        title="오늘 운 좋은 날이면, 특가도 챙겨 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <Card>
        <SectionTitle>다른 별자리 오늘의 운세</SectionTitle>
        <ul className="grid grid-cols-3 gap-2">
          {ZODIAC_IDS.map((o) => (
            <li key={o}>
              <Link
                href={todayZodiacPath(o)}
                className={`flex flex-col items-center rounded-xl border-2 py-1.5 text-xs font-bold ${
                  o === z ? "border-primary bg-primary/10 text-primary" : "border-foreground/10 bg-background"
                }`}
              >
                <span aria-hidden>{zodiacInfo(o).symbol}</span>
                {zodiacName(o)}
                <span className="text-primary">{zodiacDaily(o, today).score}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Link href={zodiacTypePath(z)} className="rounded-2xl border-2 border-primary py-3 text-center text-sm font-bold text-primary">
        {name} 궁합 순위 보기 →
      </Link>

      <p className="text-center text-[11px] leading-relaxed text-foreground/40">
        오늘의 별자리 운세는 달의 위치와 별자리의 각도로 계산한 참고용 콘텐츠야. 매일 자정(한국 시간)에 바뀌어.
      </p>
    </main>
  );
}
