import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  ArticleAd,
  BigScore,
  Breadcrumb,
  Card,
  FaqList,
  JsonLd,
  ScoreBar,
  SectionTitle,
  breadcrumbLd,
  faqLd,
} from "@/components/seo";
import { GoldboxCta } from "@/components/gift";
import { FamilyCard } from "@/components/family";
import { TtiFactors, TtiGiftCard } from "@/components/tti";
import { FortuneDisclaimer, FortuneGrid } from "@/components/fortune";
import { todayTtiPath } from "@/lib/daily";
import { SITE_URL } from "@/lib/site";
import { lastmodFor } from "@/lib/lastmod";
import {
  isTti,
  shortYear,
  ttiInfo,
  ttiName,
  ttiScoreEmoji,
  ttiTypePath,
  yearInfo,
  type Tti,
} from "@/lib/tti";
import {
  FORTUNE_YEARS,
  MONTHS,
  SAMJAE_NOTE,
  fortuneIndexPath,
  fortuneLabel,
  fortunePath,
  isFortuneYear,
  luckyColor,
  monthLabel,
  monthScore,
  samjae,
  yearLabel,
} from "@/lib/fortune";
import {
  FIELD_EMOJI,
  FORTUNE_PUBLISHED,
  getFortune,
  getFortuneTtis,
} from "@/lib/fortune-content";

// 대문자 띠 slug 는 정규 경로로 리다이렉트해야 해서 true. 없는 해·띠는 404
export const dynamicParams = true;

export function generateStaticParams() {
  return FORTUNE_YEARS.flatMap((y) =>
    getFortuneTtis(y).map((animal) => ({ year: String(y), animal })),
  );
}

type Params = { year: string; animal: string };

function parse(p: Params): { year: number; t: Tti } | null {
  const year = Number(p.year);
  const t = p.animal.toLowerCase();
  return isFortuneYear(year) && isTti(t) ? { year, t } : null;
}

/** 제목·설명에 쓰는 대표 출생연도 (최근 성인 2개: "84·96년생") */
function headlineYears(f: { births: { year: number }[] }, year: number): string {
  return f.births
    .map((b) => b.year)
    .filter((y) => year - y >= 20 && year - y <= 60)
    .slice(-2)
    .map((y) => String(y % 100).padStart(2, "0"))
    .join("·");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const parsed = parse(await params);
  const f = parsed ? getFortune(parsed.year, parsed.t) : null;
  if (!parsed || !f) return {};
  const { year, t } = parsed;
  const name = ttiName(t);
  const { ganji } = yearLabel(year);
  const sj = samjae(year, t);
  const ys = headlineYears(f, year);
  const title = `${year} ${name} 운세 - ${ganji} 총운 ${f.score}점, 월별 운세 (${ys}년생)`;
  const description = `${year}년 ${name} 신년운세는 ${f.score}점, ${fortuneLabel(f.score)}. ${f.headline} ${sj ? `${sj}에 해당해. ` : ""}연애·재물·일·인간관계 분야별 운과 1~12월 월별 흐름, 출생연도별 한마디까지 정리했어.`;
  const path = fortunePath(year, t);
  return {
    title,
    description,
    keywords: [
      `${year} ${name} 운세`,
      `${year}년 ${name} 운세`,
      `${name} ${year} 운세`,
      `${year} ${name} 신년운세`,
      `${ganji} ${name}`,
      `${year} ${name} 월별 운세`,
      ...(sj ? [`${name} 삼재`, `${year} ${name} 삼재`] : []),
      ...f.births.slice(-4).map((b) => `${shortYear(b.year)} ${name} ${year} 운세`),
    ],
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | 몇점이야?`,
      description,
      url: `${SITE_URL}${path}`,
      type: "article",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FortunePage({ params }: { params: Promise<Params> }) {
  const raw = await params;
  const parsed = parse(raw);
  if (!parsed) notFound();
  const { year, t } = parsed;
  if (raw.animal !== t) permanentRedirect(fortunePath(year, t));

  const f = getFortune(year, t);
  if (!f) notFound();

  const info = ttiInfo(t);
  const name = ttiName(t);
  const { ganji, color, tti: yearTti } = yearLabel(year);
  const sj = samjae(year, t);
  const lucky = luckyColor(t);
  const path = fortunePath(year, t);
  const indexPath = fortuneIndexPath(year);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${year} ${name} 운세`,
        alternativeHeadline: `${ganji} ${name} 신년운세`,
        description: f.headline,
        url: `${SITE_URL}${path}`,
        inLanguage: "ko-KR",
        author: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        publisher: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        mainEntityOfPage: `${SITE_URL}${path}`,
        datePublished: FORTUNE_PUBLISHED[year as keyof typeof FORTUNE_PUBLISHED].toISOString(),
        dateModified: lastmodFor(path).toISOString(),
        about: { "@type": "Thing", name },
      },
      breadcrumbLd([
        { name: `${year} 띠별 운세`, path: indexPath },
        { name: `${year} ${name} 운세`, path },
      ]),
      faqLd(f.faq),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb
        items={[{ name: `${year} 띠별 운세`, path: indexPath }, { name: `${name} 운세` }]}
      />

      <header className="text-center">
        <p className="text-5xl leading-none" aria-hidden>
          {info.emoji}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {year}년 {name} 운세
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {ganji} · {color}의 해
          </span>
        </h1>
        <p className="mt-2 text-base font-bold text-primary">{f.headline}</p>
        {sj && (
          <p className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {year}년 {sj}
          </p>
        )}
      </header>

      <Card className="flex flex-col items-center gap-4">
        <BigScore score={f.score} emoji={ttiScoreEmoji(f.score)} caption={fortuneLabel(f.score)} />
        <p className="text-sm leading-relaxed text-foreground/80">{f.summary}</p>
      </Card>

      <TtiFactors
        title={`${name}와 ${year}년(${ttiName(yearTti)}의 해)의 관계`}
        lead={`그 해의 띠와 내 띠가 어떤 관계인지로 총운 ${f.score}점을 계산했어.`}
        factors={f.factors}
        score={f.score}
      />

      <Card>
        <SectionTitle>분야별 운세</SectionTitle>
        <div className="flex flex-col gap-3">
          {f.fields.map((x) => (
            <ScoreBar key={x.field} label={x.field} score={x.score} emoji={FIELD_EMOJI[x.field]} />
          ))}
        </div>
      </Card>

      <TtiGiftCard
        ttis={[t]}
        entry="fortune"
        lead={`새해 선물로 ${name} 상징 아이템은 의미까지 챙길 수 있어`}
      />

      <GoldboxCta
        campaign="family_fortune-cta"
        content={`${year}-${t}`}
        vertical="fortune"
        title="새해 선물·설 선물, 오늘 특가인지 보고 사자 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <ArticleAd />

      {f.fields.map((x) => (
        <Card key={x.field}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight">
              {FIELD_EMOJI[x.field]} {x.field}운
            </h2>
            <span className="text-sm font-extrabold text-primary">
              {ttiScoreEmoji(x.score)} {x.score}점
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">{x.text}</p>
          <p className="mt-3 rounded-2xl bg-primary/5 px-3 py-2 text-sm leading-relaxed">
            <span className="font-bold text-primary">TIP </span>
            {x.tip}
          </p>
        </Card>
      ))}

      <Card>
        <SectionTitle>{year}년 {name} 월별 운세</SectionTitle>
        <p className="-mt-1 mb-3 text-xs leading-relaxed text-foreground/50">
          절기 기준 월이야. 1월은 입춘(양력 2월 초) 무렵부터 한 달, 12월은 다음 해 1월 무렵이야.
        </p>
        <ol className="flex flex-col gap-3">
          {MONTHS.map((m) => {
            const score = monthScore(t, m);
            const text = f.months.find((x) => x.month === m)?.text;
            return (
              <li key={m} className="flex gap-3">
                <span className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-background py-1.5">
                  <span className="text-sm font-extrabold">{m}월</span>
                  <span className="text-[11px] font-bold text-primary">
                    {ttiScoreEmoji(score)} {score}
                  </span>
                </span>
                <span className="flex flex-col">
                  <span className="text-[11px] text-foreground/40">{monthLabel(m)}</span>
                  <span className="text-sm leading-relaxed text-foreground/80">{text}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card>
        <SectionTitle>출생연도별 {year}년 운세</SectionTitle>
        <ul className="flex flex-col gap-3">
          {f.births.map((b) => {
            const yi = yearInfo(b.year);
            return (
              <li key={b.year}>
                <h3 className="text-sm font-extrabold">
                  {b.year}년생 {name}
                  <span className="ml-1 text-xs font-semibold text-foreground/45">
                    {yi.ganji} · {shortYear(b.year)}
                  </span>
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-foreground/75">{b.text}</p>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <SectionTitle>{year}년 {name} 행운 포인트</SectionTitle>
        <p className="text-sm leading-relaxed text-foreground/80">
          <span className="font-bold">행운의 색 · {lucky.color}</span>
          <span className="ml-1 text-xs text-foreground/50">
            ({info.element}의 기운을 살려주는 {lucky.element}의 색)
          </span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">{f.lucky}</p>
        {sj && (
          <p className="mt-3 rounded-2xl bg-background px-3 py-2 text-xs leading-relaxed text-foreground/60">
            <span className="font-bold">{sj}</span> · {SAMJAE_NOTE[sj]}
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle>{name}에게 한마디</SectionTitle>
        <p className="text-sm leading-relaxed text-foreground/80">{f.advice}</p>
      </Card>

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={f.faq} />
      </Card>

      <Link
        href={todayTtiPath(t)}
        className="block rounded-2xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary transition active:scale-[0.98]"
      >
        ☀️ {name} 오늘의 운세 보기 →
      </Link>

      <Link
        href={ttiTypePath(t)}
        className="block rounded-2xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary transition active:scale-[0.98]"
      >
        {info.emoji} {name}와 잘 맞는 띠는? 궁합 순위 보기 →
      </Link>

      <Card>
        <SectionTitle>다른 띠 {year}년 운세</SectionTitle>
        <FortuneGrid year={year} current={t} />
        <p className="mt-3 text-right">
          <Link href={indexPath} className="text-xs font-bold text-primary underline underline-offset-2">
            {year} 띠별 운세 순위 →
          </Link>
        </p>
      </Card>

      <FamilyCard seed={`${year}-${t}`} campaign="fortune" />

      <FortuneDisclaimer />
    </main>
  );
}
