import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  ArticleAd,
  Breadcrumb,
  Card,
  FaqList,
  JsonLd,
  SectionTitle,
  breadcrumbLd,
  faqLd,
} from "@/components/seo";
import { GoldboxCta } from "@/components/gift";
import { FamilyCard } from "@/components/family";
import {
  ZodiacDisclaimer,
  ZodiacGiftCard,
  ZodiacGrid,
  ZodiacRankingList,
} from "@/components/zodiac";
import ZodiacFinder from "@/components/zodiac-finder";
import { todayZodiacPath } from "@/lib/daily";
import { SITE_URL } from "@/lib/site";
import { lastmodFor } from "@/lib/lastmod";
import {
  ELEMENT_EMOJI,
  ZODIAC_IDS,
  ZODIAC_INDEX_PATH,
  isZodiac,
  zodiacDates,
  zodiacInfo,
  zodiacName,
  zodiacTypePath,
  type Zodiac,
} from "@/lib/zodiac";
import { ZODIAC_CONTENT_UPDATED, getZodiacRanking, getZodiacType } from "@/lib/zodiac-content";

// 대문자 slug 는 정규 경로로 리다이렉트, 모르는 값은 404
export const dynamicParams = true;

export function generateStaticParams() {
  return ZODIAC_IDS.filter((z) => getZodiacType(z)).map((sign) => ({ sign }));
}

type Params = { sign: string };

function parse(slug: string): Zodiac | null {
  const s = slug.toLowerCase();
  return isZodiac(s) ? s : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const z = parse((await params).sign);
  const content = z ? getZodiacType(z) : null;
  if (!z || !content) return {};

  const info = zodiacInfo(z);
  const name = zodiacName(z);
  const best = getZodiacRanking(z)
    .filter((r) => r.other !== z)
    .slice(0, 3)
    .map((r) => zodiacName(r.other));
  const title = `${name} 궁합 - 잘 맞는 별자리 순위와 ${name} 성격 (${zodiacDates(z)})`;
  const description = `${name}(${zodiacDates(z)})와 가장 잘 맞는 별자리는 ${best.join(", ")}. ${content.tagline}. 12별자리 궁합 점수 순위와 연애 스타일, ${info.element} 원소·지배성 ${info.ruler} 특징까지 정리했어.`;
  const path = zodiacTypePath(z);

  return {
    title,
    description,
    keywords: [
      `${name} 궁합`,
      `${name}와 잘 맞는 별자리`,
      `${name} 연애`,
      `${name} 성격`,
      `${name} 특징`,
      `${name} 날짜`,
      ...(info.alias ? [`${info.alias} 궁합`, `${info.alias} 성격`] : []),
      "별자리 궁합",
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

export default async function ZodiacTypePage({ params }: { params: Promise<Params> }) {
  const { sign } = await params;
  const z = parse(sign);
  if (!z) notFound();
  if (sign !== z) permanentRedirect(zodiacTypePath(z));

  const content = getZodiacType(z);
  if (!content) notFound();

  const info = zodiacInfo(z);
  const name = zodiacName(z);
  const path = zodiacTypePath(z);
  const ranking = getZodiacRanking(z).filter((r) => r.other !== z);
  const best = ranking.slice(0, 3);
  const worst = ranking.slice(-2).reverse();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${name} 궁합 - 잘 맞는 별자리 순위`,
        alternativeHeadline: `${name} 성격과 특징`,
        description: content.tagline,
        url: `${SITE_URL}${path}`,
        inLanguage: "ko-KR",
        author: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        publisher: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        mainEntityOfPage: `${SITE_URL}${path}`,
        datePublished: ZODIAC_CONTENT_UPDATED.toISOString(),
        dateModified: lastmodFor(path).toISOString(),
        about: { "@type": "Thing", name },
      },
      breadcrumbLd([
        { name: "별자리 궁합표", path: ZODIAC_INDEX_PATH },
        { name: `${name} 궁합`, path },
      ]),
      faqLd(content.faq),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "별자리 궁합표", path: ZODIAC_INDEX_PATH }, { name: `${name} 궁합` }]} />

      <header className="text-center">
        <p className="text-5xl leading-none" aria-hidden>
          {info.symbol}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {name} 궁합
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {zodiacDates(z)} · {content.nickname}
          </span>
        </h1>
        <p className="mt-2 text-base font-bold text-primary">{content.tagline}</p>
        <p className="mt-2 text-left text-sm leading-relaxed text-foreground/70">
          {name}
          {info.alias ? `(${info.alias})` : ""}와 가장 잘 맞는 별자리는{" "}
          {best.map((r, i) => (
            <span key={r.other}>
              {i > 0 && ", "}
              {zodiacName(r.other)}({r.score}점)
            </span>
          ))}
          이고, 긴장감이 큰 별자리는{" "}
          {worst.map((r, i) => (
            <span key={r.other}>
              {i > 0 && ", "}
              {zodiacName(r.other)}({r.score}점)
            </span>
          ))}
          이야.
        </p>
      </header>

      <Card>
        <SectionTitle>{name}와 잘 맞는 별자리 순위</SectionTitle>
        <ZodiacRankingList me={z} />
      </Card>

      <Link
        href={todayZodiacPath(z)}
        className="block rounded-2xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary transition active:scale-[0.98]"
      >
        ☀️ {name} 오늘의 운세 보기 →
      </Link>

      <ZodiacGiftCard signs={[z]} lead={content.giftAngle} />

      <GoldboxCta
        campaign="family_zodiac-type-cta"
        content={z}
        vertical="zodiac"
        title={`${name}에게 줄 생일 선물, 오늘 특가인지 보고 사자 🎁`}
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <ArticleAd />

      <Card>
        <SectionTitle>{name} 성격과 특징</SectionTitle>
        <ul className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
          <li className="rounded-xl bg-background py-2">
            <span className="block text-foreground/45">원소</span>
            <span className="font-bold">
              {ELEMENT_EMOJI[info.element]} {info.element}
            </span>
          </li>
          <li className="rounded-xl bg-background py-2">
            <span className="block text-foreground/45">성질</span>
            <span className="font-bold">{info.modality}</span>
          </li>
          <li className="rounded-xl bg-background py-2">
            <span className="block text-foreground/45">지배성</span>
            <span className="font-bold">{info.ruler}</span>
          </li>
        </ul>
        <p className="text-sm leading-relaxed text-foreground/80">{content.intro}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {content.keywords.map((k) => (
            <li key={k} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              #{k}
            </li>
          ))}
        </ul>
        <h3 className="mb-2 mt-5 text-base font-extrabold">연애할 때</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{content.loveStyle}</p>
        <h3 className="mb-2 mt-5 text-base font-extrabold">일·친구 관계에서</h3>
        <p className="text-sm leading-relaxed text-foreground/80">{content.workStyle}</p>
      </Card>

      <Card>
        <SectionTitle>상대 별자리와 궁합 보기</SectionTitle>
        <ZodiacFinder initial={z} />
      </Card>

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={content.faq} />
      </Card>

      <Card>
        <SectionTitle>다른 별자리 궁합</SectionTitle>
        <ZodiacGrid current={z} />
        <p className="mt-3 text-right">
          <Link href={ZODIAC_INDEX_PATH} className="text-xs font-bold text-primary underline underline-offset-2">
            별자리 궁합표 전체 보기 →
          </Link>
        </p>
      </Card>

      <FamilyCard seed={z} campaign="zodiac-type" />

      <ZodiacDisclaimer />
    </main>
  );
}
