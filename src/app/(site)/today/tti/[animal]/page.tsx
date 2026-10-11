import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleAd, Breadcrumb, Card, JsonLd, SectionTitle, breadcrumbLd } from "@/components/seo";
import { GoldboxCta } from "@/components/gift";
import { DailyView } from "@/components/daily-view";
import MyToday from "@/components/my-today";
import { SITE_URL } from "@/lib/site";
import { TTI_IDS, isTti, ttiInfo, ttiName, ttiTypePath, type Tti } from "@/lib/tti";
import {
  TODAY_PATH,
  addDays,
  dateLabel,
  dayPillar,
  kstToday,
  todayTtiPath,
  ttiDaily,
} from "@/lib/daily";
import { dailyText } from "@/lib/daily-content";
import { LATEST_FORTUNE_YEAR, fortunePath } from "@/lib/fortune";

// 날짜가 바뀌면 내용이 바뀐다 — 10분마다 다시 만든다(ISR). 자정 직후 최대 10분은 전날 내용일 수 있다
export const revalidate = 600;
export const dynamicParams = false;

export function generateStaticParams() {
  return TTI_IDS.map((animal) => ({ animal }));
}

type Params = { animal: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { animal } = await params;
  if (!isTti(animal)) return {};
  const today = kstToday();
  const s = ttiDaily(animal, today);
  const name = ttiName(animal);
  const title = `${name} 오늘의 운세 - ${dateLabel(today)} ${dayPillar(today).ganji} ${s.score}점`;
  const description = `${name} 오늘의 운세 ${s.score}점. ${dailyText(`tti:${animal}`, s).total} 연애·재물·일·인간관계 분야별 운세와 행운의 색·숫자까지 매일 업데이트.`;
  const path = todayTtiPath(animal);
  return {
    title,
    description,
    keywords: [`${name} 오늘의 운세`, `${name} 오늘 운세`, `오늘의 ${name} 운세`, `${name} 일일 운세`, "띠별 오늘의 운세"],
    alternates: { canonical: path },
    openGraph: { title: `${title} | 몇점이야?`, description, url: `${SITE_URL}${path}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TtiTodayPage({ params }: { params: Promise<Params> }) {
  const { animal } = await params;
  if (!isTti(animal)) notFound();
  const t: Tti = animal;
  const today = kstToday();
  const s = ttiDaily(t, today);
  const text = dailyText(`tti:${t}`, s);
  const p = dayPillar(today);
  const name = ttiName(t);
  const path = todayTtiPath(t);

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
      <Breadcrumb items={[{ name: "오늘의 운세", path: TODAY_PATH }, { name: `${name}` }]} />
      <MyToday variant="compact" />

      <header className="text-center">
        <p className="text-5xl leading-none" aria-hidden>
          {ttiInfo(t).emoji}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {name} 오늘의 운세
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {dateLabel(today)} · {p.ganji}
          </span>
        </h1>
      </header>

      <DailyView
        score={s}
        text={text}
        tomorrow={ttiDaily(t, addDays(today, 1)).score}
        basisTitle={`${name}와 오늘(${p.ganji})의 관계`}
        basisNote="오늘 일진의 지지와 내 띠의 관계(띠 궁합 규칙)에, 일간의 오행이 내 띠를 살리는지 누르는지를 더했어."
      />

      <ArticleAd />

      <GoldboxCta
        campaign="family_today-cta"
        content={`tti-${t}`}
        vertical="today"
        title="오늘 운 좋은 날이면, 특가도 챙겨 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <Card>
        <SectionTitle>다른 띠 오늘의 운세</SectionTitle>
        <ul className="grid grid-cols-4 gap-2">
          {TTI_IDS.map((o) => (
            <li key={o}>
              <Link
                href={todayTtiPath(o)}
                className={`flex flex-col items-center rounded-xl border-2 py-1.5 text-xs font-bold ${
                  o === t ? "border-primary bg-primary/10 text-primary" : "border-foreground/10 bg-background"
                }`}
              >
                <span aria-hidden>{ttiInfo(o).emoji}</span>
                {ttiName(o)}
                <span className="text-primary">{ttiDaily(o, today).score}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-2 gap-2 text-sm font-bold">
        <Link href={ttiTypePath(t)} className="rounded-2xl border-2 border-primary py-3 text-center text-primary">
          {name} 궁합 →
        </Link>
        <Link href={fortunePath(LATEST_FORTUNE_YEAR, t)} className="rounded-2xl border-2 border-primary py-3 text-center text-primary">
          {LATEST_FORTUNE_YEAR} {name} 운세 →
        </Link>
      </div>

      <p className="text-center text-[11px] leading-relaxed text-foreground/40">
        오늘의 운세는 일진과 띠의 관계로 계산한 참고용 콘텐츠야. 매일 자정(한국 시간)에 바뀌어.
      </p>
    </main>
  );
}
