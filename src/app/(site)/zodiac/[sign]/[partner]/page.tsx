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
import { TtiFactors } from "@/components/tti";
import { ZodiacDisclaimer, ZodiacGiftCard, ZodiacRankingList } from "@/components/zodiac";
import { SITE_URL } from "@/lib/site";
import { lastmodFor } from "@/lib/lastmod";
import {
  ZODIAC_INDEX_PATH,
  ZODIAC_RELATIONS,
  allZodiacPairs,
  isZodiac,
  orderZodiac,
  zodiacDates,
  zodiacInfo,
  zodiacName,
  zodiacPairPath,
  zodiacScoreEmoji,
  zodiacScoreLabel,
  zodiacTypePath,
  type Zodiac,
} from "@/lib/zodiac";
import {
  ZODIAC_CONTENT_UPDATED,
  getZodiacPair,
  getZodiacType,
  zodiacRelationScore,
} from "@/lib/zodiac-content";

// 역순·대문자 slug 는 정규 경로로 permanentRedirect, 모르는 값은 404
export const dynamicParams = true;

export function generateStaticParams() {
  return allZodiacPairs()
    .filter(([a, b]) => getZodiacPair(a, b))
    .map(([sign, partner]) => ({ sign, partner }));
}

type Params = { sign: string; partner: string };

function parse(a: string, b: string): [Zodiac, Zodiac] | null {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return isZodiac(x) && isZodiac(y) ? [x, y] : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { sign, partner } = await params;
  const parsed = parse(sign, partner);
  const pair = parsed ? getZodiacPair(parsed[0], parsed[1]) : null;
  if (!parsed || !pair) return {};

  const { a, b } = pair;
  const na = zodiacName(a);
  const nb = zodiacName(b);
  const same = a === b;
  const lover = zodiacRelationScore(pair, "연인");
  const some = zodiacRelationScore(pair, "썸");
  const title = same
    ? `${na} ${nb} 궁합 ${pair.score}점 - 같은 별자리끼리 만나면 (연인 ${lover}점)`
    : `${na} ${nb} 궁합 ${pair.score}점 - 연인 ${lover}점, 썸 ${some}점`;
  const description = `${na}(${zodiacDates(a)})와 ${nb}(${zodiacDates(b)})의 별자리 궁합은 ${pair.score}점, ${zodiacScoreLabel(pair.score)}이야. ${pair.factors[0].name}. ${pair.headline} 연인·썸·부부·친구·직장동료 관계별 궁합과 잘 맞는 점, 부딪히는 점까지.`;
  const path = zodiacPairPath(a, b);
  const alias = (z: Zodiac) => zodiacInfo(z).alias;

  return {
    title,
    description,
    keywords: [
      `${na} ${nb} 궁합`,
      ...(same ? [] : [`${nb} ${na} 궁합`]),
      `${na} ${nb} 연애`,
      `${na} ${nb} 커플`,
      ...(alias(a) || alias(b)
        ? [`${alias(a) ?? na} ${alias(b) ?? nb} 궁합`]
        : []),
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

export default async function ZodiacPairPage({ params }: { params: Promise<Params> }) {
  const { sign, partner } = await params;
  const parsed = parse(sign, partner);
  if (!parsed) notFound();
  const canonical = zodiacPairPath(parsed[0], parsed[1]);
  if (`/zodiac/${sign}/${partner}` !== canonical) permanentRedirect(canonical);

  const [x, y] = orderZodiac(parsed[0], parsed[1]);
  const pair = getZodiacPair(x, y);
  if (!pair) notFound();

  const { a, b } = pair;
  const A = zodiacInfo(a);
  const B = zodiacInfo(b);
  const na = zodiacName(a);
  const nb = zodiacName(b);
  const same = a === b;
  const path = canonical;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${na} ${nb} 궁합 ${pair.score}점`,
        alternativeHeadline: same ? `${na}끼리 궁합` : `${nb} ${na} 궁합`,
        description: pair.headline,
        url: `${SITE_URL}${path}`,
        inLanguage: "ko-KR",
        author: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        publisher: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        mainEntityOfPage: `${SITE_URL}${path}`,
        datePublished: ZODIAC_CONTENT_UPDATED.toISOString(),
        dateModified: lastmodFor(path).toISOString(),
        about: [
          { "@type": "Thing", name: na },
          { "@type": "Thing", name: nb },
        ],
      },
      breadcrumbLd([
        { name: "별자리 궁합표", path: ZODIAC_INDEX_PATH },
        { name: `${na} 궁합`, path: zodiacTypePath(a) },
        { name: `${na} × ${nb}`, path },
      ]),
      faqLd(pair.faq),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb
        items={[
          { name: "별자리 궁합표", path: ZODIAC_INDEX_PATH },
          { name: `${na} 궁합`, path: zodiacTypePath(a) },
          { name: `${na} × ${nb}` },
        ]}
      />

      <header className="text-center">
        <p className="text-4xl leading-none" aria-hidden>
          {A.symbol} {B.symbol}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {na} × {nb} 궁합
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {A.element} × {B.element} · {pair.factors[0].name}
          </span>
        </h1>
        <p className="mt-2 text-base font-bold text-primary">{pair.headline}</p>
        <p className="mt-2 text-left text-sm leading-relaxed text-foreground/70">
          {same ? (
            <>
              {na}({zodiacDates(a)})끼리 만나면 궁합 점수는 100점 만점에 {pair.score}점이야.
            </>
          ) : (
            <>
              {na}({zodiacDates(a)})와 {nb}({zodiacDates(b)})의 궁합 점수는 100점 만점에{" "}
              {pair.score}점. {nb} {na} 궁합으로 찾아와도 결과는 같아.
            </>
          )}{" "}
          연인 {zodiacRelationScore(pair, "연인")}점, 썸 {zodiacRelationScore(pair, "썸")}점, 친구{" "}
          {zodiacRelationScore(pair, "친구")}점이야.
        </p>
      </header>

      <Card className="flex flex-col items-center gap-4">
        <BigScore
          score={pair.score}
          emoji={zodiacScoreEmoji(pair.score)}
          caption={zodiacScoreLabel(pair.score)}
        />
        <p className="text-center text-sm leading-relaxed text-foreground/80">{pair.summary}</p>
        <div className="flex w-full gap-2 text-center text-xs">
          <ZodiacMini z={a} />
          {!same && <ZodiacMini z={b} />}
        </div>
      </Card>

      <TtiFactors
        factors={pair.factors}
        score={pair.score}
        footnote={
          <>
            기본 70점에서 두 별자리의 각도에 따라 점수를 정하고, 지배성 관계가 있으면 더했어.{" "}
            <Link href={`${ZODIAC_INDEX_PATH}#how`} className="underline">
              계산 방법 보기
            </Link>
          </>
        }
      />

      <Card>
        <SectionTitle>관계별 궁합 점수</SectionTitle>
        <div className="flex flex-col gap-3">
          {pair.relations.map((r) => (
            <ScoreBar
              key={r.relation}
              label={r.relation}
              score={r.score}
              emoji={ZODIAC_RELATIONS.find((x) => x.value === r.relation)?.emoji}
            />
          ))}
        </div>
      </Card>

      <ZodiacGiftCard signs={[a, b]} />

      <GoldboxCta
        campaign="family_zodiac-pair-cta"
        content={`${a}-${b}`}
        vertical="zodiac"
        title="궁합은 확인했고, 이제 선물 살 차례 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <ArticleAd />

      <Card>
        <SectionTitle>잘 맞는 포인트</SectionTitle>
        <ul className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/80">
          {pair.strengths.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0 text-primary">✓</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
        <h3 className="mb-2 mt-5 text-base font-extrabold">부딪히는 포인트</h3>
        <ul className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/80">
          {pair.conflicts.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0 text-foreground/40">✕</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Card>

      {pair.relations.map((r) => {
        const emoji = ZODIAC_RELATIONS.find((x) => x.value === r.relation)?.emoji;
        // 받침이 있으면 "으로"(연인으로), 없으면 "로"(친구로)
        const code = r.relation.charCodeAt(r.relation.length - 1) - 0xac00;
        const ro = code % 28 !== 0 && code % 28 !== 8 ? "으로" : "로";
        return (
          <Card key={r.relation}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight">
                {emoji} {r.relation}
                {ro} 만나면
              </h2>
              <span className="text-sm font-extrabold text-primary">
                {zodiacScoreEmoji(r.score)} {r.score}점
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{r.summary}</p>
            <p className="mt-3 rounded-2xl bg-primary/5 px-3 py-2 text-sm leading-relaxed">
              <span className="font-bold text-primary">TIP </span>
              {r.tip}
            </p>
          </Card>
        );
      })}

      <Card>
        <SectionTitle>두 사람에게 한마디</SectionTitle>
        <p className="text-sm leading-relaxed text-foreground/80">{pair.advice}</p>
      </Card>

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={pair.faq} />
      </Card>

      <Link
        href="/"
        className="block rounded-2xl bg-primary py-4 text-center text-base font-bold text-white shadow-md transition active:scale-[0.98]"
      >
        MBTI까지 넣으면 몇 점? AI 궁합 분석 🔮
      </Link>

      <Card>
        <SectionTitle>{na}와 잘 맞는 다른 별자리</SectionTitle>
        <ZodiacRankingList me={a} exclude={b} limit={5} />
      </Card>

      {!same && (
        <Card>
          <SectionTitle>{nb}와 잘 맞는 다른 별자리</SectionTitle>
          <ZodiacRankingList me={b} exclude={a} limit={5} />
        </Card>
      )}

      <FamilyCard seed={`${a}-${b}`} campaign="zodiac-pair" />

      <ZodiacDisclaimer />
    </main>
  );
}

function ZodiacMini({ z }: { z: Zodiac }) {
  const content = getZodiacType(z);
  const info = zodiacInfo(z);
  return (
    <Link
      href={zodiacTypePath(z)}
      className="flex flex-1 flex-col rounded-2xl border-2 border-foreground/10 bg-background px-3 py-2 transition hover:border-primary/50"
    >
      <span className="text-base font-extrabold">
        {info.symbol} {zodiacName(z)}
      </span>
      <span className="text-foreground/60">{content?.nickname ?? `${zodiacName(z)} 궁합 순위`}</span>
    </Link>
  );
}
