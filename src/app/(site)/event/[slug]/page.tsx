import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleAd, Breadcrumb, Card, FaqList, JsonLd, SectionTitle, breadcrumbLd, faqLd } from "@/components/seo";
import { GoldboxCta } from "@/components/gift";
import { SymbolGiftCard } from "@/components/symbol-gift";
import EventMyLuck from "@/components/event-my-luck";
import { SITE_URL } from "@/lib/site";
import { catalogPick, type GiftPick } from "@/lib/gifts";
import { EVENTS, daysUntil, ddayLabel, eventPath, getEvent, nextOccurrence } from "@/lib/events";
import { BAND_LABEL, band, dailyEmoji, dayPillar, moonSign, todayTtiPath, todayZodiacPath, ttiDaily, weekdayOf, zodiacDaily } from "@/lib/daily";
import { TTI_IDS, ttiInfo, ttiName } from "@/lib/tti";
import { ZODIAC_IDS, zodiacInfo, zodiacName } from "@/lib/zodiac";

// D-day 가 매일 줄어든다 — 1시간마다 다시 만든다(ISR)
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return EVENTS.map((e) => ({ slug: e.slug }));
}

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const ev = getEvent((await params).slug);
  if (!ev) return {};
  const date = nextOccurrence(ev);
  const top = TTI_IDS.map((t) => ({ t, v: ttiDaily(t, date).fields["연애"] }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .map((x) => ttiName(x.t));
  const title = `${date.y} ${ev.name} - 연애운 좋은 띠·별자리 순위와 선물 추천 (${ddayLabel(daysUntil(ev))})`;
  const description = `${date.y}년 ${ev.name}(${date.m}월 ${date.d}일) 연애운이 가장 좋은 띠는 ${top.join("·")}. 그날의 일진과 달의 위치로 계산한 띠·별자리별 연애운 순위, 내 연애운, 선물 추천까지.`;
  const path = eventPath(ev.slug);
  return {
    title,
    description,
    keywords: [...ev.keywords, `${date.y} ${ev.name}`],
    alternates: { canonical: path },
    openGraph: { title: `${title} | 몇점이야?`, description, url: `${SITE_URL}${path}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EventPage({ params }: { params: Promise<Params> }) {
  const ev = getEvent((await params).slug);
  if (!ev) notFound();
  const date = nextOccurrence(ev);
  const dd = daysUntil(ev);
  const p = dayPillar(date);
  const moon = zodiacName(moonSign(date));
  const path = eventPath(ev.slug);

  const ttiRank = TTI_IDS.map((t) => ({ t, v: ttiDaily(t, date).fields["연애"] })).sort((a, b) => b.v - a.v);
  const zodiacRank = ZODIAC_IDS.map((z) => ({ z, v: zodiacDaily(z, date).fields["연애"] })).sort((a, b) => b.v - a.v);
  const gifts = ev.giftIds
    .map((id) => catalogPick(id, ""))
    .filter((g): g is GiftPick => g !== null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${date.y} ${ev.name} 연애운 순위`,
        description: ev.intro,
        url: `${SITE_URL}${path}`,
        inLanguage: "ko-KR",
        dateModified: new Date().toISOString(),
        author: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        publisher: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
      },
      breadcrumbLd([{ name: `${ev.name}`, path }]),
      faqLd(ev.faq),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: ev.name }]} />

      <header className="text-center">
        <p className="text-5xl leading-none" aria-hidden>
          {ev.emoji}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {date.y} {ev.name}
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {date.m}월 {date.d}일({weekdayOf(date)}) · {p.ganji} · 달은 {moon}에
          </span>
        </h1>
        <p className="mt-3 inline-block rounded-full bg-primary px-4 py-1 text-sm font-extrabold text-white">
          {ddayLabel(dd)}
        </p>
        <p className="mt-3 text-left text-sm leading-relaxed text-foreground/70">{ev.intro}</p>
      </header>

      <EventMyLuck date={date} name={ev.name} />

      <Card>
        <SectionTitle>{ev.rankTitle} 띠 순위</SectionTitle>
        <RankList
          items={ttiRank.map(({ t, v }) => ({ key: t, icon: ttiInfo(t).emoji, name: ttiName(t), v, href: todayTtiPath(t) }))}
        />
      </Card>

      <ArticleAd />

      <Card>
        <SectionTitle>{ev.rankTitle} 별자리 순위</SectionTitle>
        <RankList
          items={zodiacRank.map(({ z, v }) => ({ key: z, icon: zodiacInfo(z).symbol, name: zodiacName(z), v, href: todayZodiacPath(z) }))}
        />
        <p className="mt-3 text-xs leading-relaxed text-foreground/45">
          그날의 연애운 점수야. 이름을 누르면 오늘의 운세로 가고, {ev.name} 당일엔 거기서 같은 점수를 볼 수 있어.
        </p>
      </Card>

      <SymbolGiftCard
        lead={ev.giftLead}
        sets={[{ key: ev.slug, emoji: ev.emoji, name: `${ev.name} 선물`, items: gifts, query: { f: "event", ev: ev.slug } }]}
      />

      <GoldboxCta
        campaign="family_event-cta"
        content={ev.slug}
        vertical="event"
        title={`${ev.name} 선물, 오늘 특가인지 보고 사자 🎁`}
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <Card>
        <SectionTitle>둘이 함께 보면 더 재밌어</SectionTitle>
        <div className="grid grid-cols-2 gap-2 text-sm font-bold">
          <Link href="/name" className="rounded-xl bg-background py-3 text-center hover:text-primary">💘 이름 궁합</Link>
          <Link href="/birthday" className="rounded-xl bg-background py-3 text-center hover:text-primary">🎂 생일 궁합</Link>
          <Link href="/" className="rounded-xl bg-background py-3 text-center hover:text-primary">🔮 MBTI 궁합</Link>
          <Link href="/today" className="rounded-xl bg-background py-3 text-center hover:text-primary">☀️ 오늘의 운세</Link>
        </div>
      </Card>

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={ev.faq} />
      </Card>

      <Card>
        <SectionTitle>다른 기념일</SectionTitle>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {EVENTS.filter((e) => e.slug !== ev.slug).map((e) => (
            <li key={e.slug}>
              <Link href={eventPath(e.slug)} className="flex items-center gap-2 rounded-xl bg-background px-3 py-2 font-bold hover:text-primary">
                <span aria-hidden>{e.emoji}</span>
                {e.name}
                <span className="ml-auto text-xs text-foreground/45">{ddayLabel(daysUntil(e))}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-center text-[11px] leading-relaxed text-foreground/40">
        연애운은 그날의 일진·달의 위치로 계산한 참고용 콘텐츠야. 마음을 전하는 데 가장 중요한 건 진심이야.
      </p>
    </main>
  );
}

function RankList({ items }: { items: { key: string; icon: string; name: string; v: number; href: string }[] }) {
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
            <span className="flex-1 text-xs text-foreground/55">{BAND_LABEL[band(it.v)]}</span>
            <span className="shrink-0 text-sm font-extrabold text-primary">
              {dailyEmoji(it.v)} {it.v}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
