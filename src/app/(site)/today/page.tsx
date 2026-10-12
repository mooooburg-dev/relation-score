import type { Metadata } from "next";
import Link from "next/link";
import { ArticleAd, Breadcrumb, Card, FaqList, JsonLd, SectionTitle, breadcrumbLd, faqLd } from "@/components/seo";
import { GoldboxCta } from "@/components/gift";
import MyToday from "@/components/my-today";
import RecentHistory from "@/components/recent-history";
import EventBanner from "@/components/event-banner";
import { SITE_URL, type Faq } from "@/lib/site";
import { TTI_IDS, ttiInfo, ttiName } from "@/lib/tti";
import { ZODIAC_IDS, zodiacInfo, zodiacName } from "@/lib/zodiac";
import {
  BAND_LABEL,
  TODAY_PATH,
  band,
  dailyEmoji,
  dateLabel,
  dayPillar,
  kstToday,
  moonSign,
  todayTtiPath,
  todayZodiacPath,
  ttiDaily,
  zodiacDaily,
} from "@/lib/daily";

// 매일 바뀌는 순위 — 10분마다 다시 만든다(ISR)
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const today = kstToday();
  const title = `오늘의 운세 - ${dateLabel(today)} 띠별·별자리별 운세 순위`;
  const description = `${dateLabel(today)} ${dayPillar(today).ganji} 오늘의 운세. 12띠와 12별자리 오늘의 운세 점수 순위, 연애·재물·일·인간관계 분야별 운세를 매일 업데이트해. 생일을 저장하면 내 운세가 바로 떠.`;
  return {
    title,
    description,
    keywords: ["오늘의 운세", "오늘의 띠별 운세", "오늘의 별자리 운세", "오늘 운세", "일일 운세", "무료 운세"],
    alternates: { canonical: TODAY_PATH },
    openGraph: { title: `${title} | 몇점이야?`, description, url: `${SITE_URL}${TODAY_PATH}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const FAQ: Faq[] = [
  {
    q: "오늘의 운세는 어떻게 계산해?",
    a: "띠는 오늘 일진(60갑자)의 지지와 내 띠의 관계, 그리고 일간 오행이 내 띠를 살리는지 누르는지로 봐. 별자리는 오늘 달이 지나는 별자리와 내 별자리의 각도로 봐.",
  },
  {
    q: "운세는 언제 바뀌어?",
    a: "매일 자정(한국 시간)에 바뀌어. 같은 날 다시 열면 같은 운세가 나와.",
  },
  {
    q: "생일을 저장하면 어디에 남아?",
    a: "이 기기 브라우저에만 저장돼. 서버로 보내지 않고, 화면의 '지우기'를 누르면 바로 사라져.",
  },
];

export default function TodayPage() {
  const today = kstToday();
  const p = dayPillar(today);
  const moon = moonSign(today);
  const tti = TTI_IDS.map((t) => ({ t, s: ttiDaily(t, today).score })).sort((a, b) => b.s - a.s);
  const zod = ZODIAC_IDS.map((z) => ({ z, s: zodiacDaily(z, today).score })).sort((a, b) => b.s - a.s);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "오늘의 운세",
        url: `${SITE_URL}${TODAY_PATH}`,
        inLanguage: "ko-KR",
        dateModified: new Date().toISOString(),
        isPartOf: { "@type": "WebSite", name: "몇점이야?", url: SITE_URL },
      },
      breadcrumbLd([{ name: "오늘의 운세", path: TODAY_PATH }]),
      faqLd(FAQ),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "오늘의 운세" }]} />

      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">오늘의 운세 ☀️</h1>
        <p className="mt-2 text-sm font-bold text-foreground/50">
          {dateLabel(today)} · {p.ganji} · 달은 {zodiacName(moon)}에
        </p>
      </header>

      <EventBanner />
      <MyToday variant="full" />

      <Card>
        <SectionTitle>오늘의 띠별 운세 순위</SectionTitle>
        <RankList
          items={tti.map(({ t, s }) => ({
            key: t,
            href: todayTtiPath(t),
            icon: ttiInfo(t).emoji,
            name: ttiName(t),
            score: s,
          }))}
        />
      </Card>

      <ArticleAd />

      <Card>
        <SectionTitle>오늘의 별자리 운세 순위</SectionTitle>
        <RankList
          items={zod.map(({ z, s }) => ({
            key: z,
            href: todayZodiacPath(z),
            icon: zodiacInfo(z).symbol,
            name: zodiacName(z),
            score: s,
          }))}
        />
      </Card>

      <RecentHistory />

      <GoldboxCta
        campaign="family_today-index-cta"
        content="today_index"
        vertical="today"
        title="오늘 운 좋은 날이면, 특가도 챙겨 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={FAQ} />
      </Card>

      <div className="grid grid-cols-2 gap-2 text-sm font-bold">
        <Link href="/name" className="rounded-xl bg-white py-3 text-center shadow-sm">💘 이름 궁합</Link>
        <Link href="/birthday" className="rounded-xl bg-white py-3 text-center shadow-sm">🎂 생일 궁합</Link>
        <Link href="/tti" className="rounded-xl bg-white py-3 text-center shadow-sm">🐭 띠 궁합</Link>
        <Link href="/zodiac" className="rounded-xl bg-white py-3 text-center shadow-sm">♈ 별자리 궁합</Link>
      </div>
    </main>
  );
}

function RankList({
  items,
}: {
  items: { key: string; href: string; icon: string; name: string; score: number }[];
}) {
  return (
    <ol className="flex flex-col gap-1">
      {items.map((it, i) => (
        <li key={it.key}>
          <Link href={it.href} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-background">
            <span className="w-5 shrink-0 text-right text-xs font-bold text-foreground/40">{i + 1}</span>
            <span className="flex w-28 shrink-0 items-center gap-1.5 text-sm font-bold">
              <span aria-hidden>{it.icon}</span>
              {it.name}
            </span>
            <span className="flex-1 text-xs text-foreground/55">{BAND_LABEL[band(it.score)]}</span>
            <span className="shrink-0 text-sm font-extrabold text-primary">
              {dailyEmoji(it.score)} {it.score}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
