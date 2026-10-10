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
import {
  TtiDisclaimer,
  TtiFactors,
  TtiGiftCard,
  TtiRankingList,
} from "@/components/tti";
import { SITE_URL } from "@/lib/site";
import { lastmodFor } from "@/lib/lastmod";
import {
  TTI_INDEX_PATH,
  TTI_RELATIONS,
  allTtiPairs,
  birthYears,
  isTti,
  orderPair,
  shortYear,
  ttiInfo,
  ttiName,
  ttiPairPath,
  ttiScoreEmoji,
  ttiScoreLabel,
  ttiTypePath,
  type Tti,
} from "@/lib/tti";
import {
  TTI_CONTENT_UPDATED,
  getTtiPair,
  getTtiType,
  ttiRelationScore,
} from "@/lib/tti-content";

// 역순·대문자 slug 는 런타임에 정규 경로로 permanentRedirect, 모르는 값은 404
export const dynamicParams = true;

export function generateStaticParams() {
  return allTtiPairs()
    .filter(([a, b]) => getTtiPair(a, b))
    .map(([animal, partner]) => ({ animal, partner }));
}

type Params = { animal: string; partner: string };

function parse(a: string, b: string): [Tti, Tti] | null {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return isTti(x) && isTti(y) ? [x, y] : null;
}

/** 본문·메타에 쓰는 대표 출생연도 (1970~2008, 최근 3개) */
function years(t: Tti): number[] {
  return birthYears(t, 1970, 2008)
    .map((y) => y.year)
    .slice(-3);
}
function yearsLabel(t: Tti): string {
  return years(t)
    .map((y) => String(y % 100).padStart(2, "0"))
    .join("·");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { animal, partner } = await params;
  const parsed = parse(animal, partner);
  const pair = parsed ? getTtiPair(parsed[0], parsed[1]) : null;
  if (!parsed || !pair) return {};

  const { a, b } = pair;
  const na = ttiName(a);
  const nb = ttiName(b);
  const same = a === b;
  const lover = ttiRelationScore(pair, "연인");
  const married = ttiRelationScore(pair, "부부");
  const basis = pair.factors[0]?.name ?? "";
  const title = same
    ? `${na} ${nb} 궁합 ${pair.score}점 - 같은 띠끼리 만나면 (연인 ${lover}점, 부부 ${married}점)`
    : `${na} ${nb} 궁합 ${pair.score}점 - 연인 ${lover}점, 결혼 ${married}점`;
  const description = `${na}(${yearsLabel(a)}년생)와 ${nb}(${yearsLabel(b)}년생)의 띠 궁합은 ${pair.score}점, ${ttiScoreLabel(pair.score)}이야. ${basis ? `${basis}. ` : ""}${pair.headline} 연인·부부·친구·직장동료·부모자식 관계별 궁합과 잘 맞는 점, 부딪히는 점까지.`;
  const path = ttiPairPath(a, b);

  return {
    title,
    description,
    keywords: [
      `${na} ${nb} 궁합`,
      ...(same ? [] : [`${nb} ${na} 궁합`]),
      `${na} ${nb} 결혼 궁합`,
      `${na} ${nb} 부부 궁합`,
      `${na} ${nb} 연애`,
      `${shortYear(years(a).at(-1)!)} ${shortYear(years(b).at(-1)!)} 궁합`,
      "띠 궁합",
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

export default async function TtiPairPage({ params }: { params: Promise<Params> }) {
  const { animal, partner } = await params;
  const parsed = parse(animal, partner);
  if (!parsed) notFound();
  const canonical = ttiPairPath(parsed[0], parsed[1]);
  if (`/tti/${animal}/${partner}` !== canonical) permanentRedirect(canonical);

  const [x, y] = orderPair(parsed[0], parsed[1]);
  const pair = getTtiPair(x, y);
  if (!pair) notFound();

  const { a, b } = pair;
  const A = ttiInfo(a);
  const B = ttiInfo(b);
  const na = ttiName(a);
  const nb = ttiName(b);
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
        datePublished: TTI_CONTENT_UPDATED.toISOString(),
        dateModified: lastmodFor(path).toISOString(),
        about: [
          { "@type": "Thing", name: na },
          { "@type": "Thing", name: nb },
        ],
      },
      breadcrumbLd([
        { name: "띠 궁합표", path: TTI_INDEX_PATH },
        { name: `${na} 궁합`, path: ttiTypePath(a) },
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
          { name: "띠 궁합표", path: TTI_INDEX_PATH },
          { name: `${na} 궁합`, path: ttiTypePath(a) },
          { name: `${na} × ${nb}` },
        ]}
      />

      <header className="text-center">
        <p className="text-4xl leading-none" aria-hidden>
          {A.emoji} {B.emoji}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
          {na} × {nb} 궁합
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {A.branch}({A.hanja}) × {B.branch}({B.hanja})
          </span>
        </h1>
        <p className="mt-2 text-base font-bold text-primary">{pair.headline}</p>
        <p className="mt-2 text-left text-sm leading-relaxed text-foreground/70">
          {same ? (
            <>
              {na}({yearsLabel(a)}년생)끼리 만나면 궁합 점수는 100점 만점에 {pair.score}점이야.
            </>
          ) : (
            <>
              {na}({yearsLabel(a)}년생)와 {nb}({yearsLabel(b)}년생)의 궁합 점수는 100점 만점에{" "}
              {pair.score}점. {nb} {na} 궁합으로 찾아와도 결과는 같아.
            </>
          )}{" "}
          연인 {ttiRelationScore(pair, "연인")}점, 부부 {ttiRelationScore(pair, "부부")}점,
          부모자식 {ttiRelationScore(pair, "부모자식")}점이야.
        </p>
      </header>

      <Card className="flex flex-col items-center gap-4">
        <BigScore
          score={pair.score}
          emoji={ttiScoreEmoji(pair.score)}
          caption={ttiScoreLabel(pair.score)}
        />
        <p className="text-center text-sm leading-relaxed text-foreground/80">{pair.summary}</p>
        <div className="flex w-full gap-2 text-center text-xs">
          <TtiMini t={a} />
          {!same && <TtiMini t={b} />}
        </div>
      </Card>

      <TtiFactors factors={pair.factors} score={pair.score} />

      <Card>
        <SectionTitle>관계별 궁합 점수</SectionTitle>
        <div className="flex flex-col gap-3">
          {pair.relations.map((r) => {
            const emoji = TTI_RELATIONS.find((x) => x.value === r.relation)?.emoji;
            return (
              <ScoreBar
                key={r.relation}
                label={r.relation === "부모자식" ? "부모·자식" : r.relation}
                score={r.score}
                emoji={emoji}
              />
            );
          })}
        </div>
      </Card>

      {/* 궁합을 확인한 직후가 선물·특가로 넘어가기 제일 좋은 지점 */}
      <TtiGiftCard ttis={[a, b]} />

      <GoldboxCta
        campaign="family_tti-pair-cta"
        content={`${a}-${b}`}
        vertical="tti"
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
        const emoji = TTI_RELATIONS.find((x) => x.value === r.relation)?.emoji;
        const label = r.relation === "부모자식" ? "부모와 자식" : r.relation;
        // 받침이 있으면 "으로"(연인으로), 없으면 "로"(친구로)
        const code = label.charCodeAt(label.length - 1) - 0xac00;
        const ro = code % 28 !== 0 && code % 28 !== 8 ? "으로" : "로";
        return (
          <Card key={r.relation}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight">
                {emoji} {label}
                {ro} 만나면
              </h2>
              <span className="text-sm font-extrabold text-primary">
                {ttiScoreEmoji(r.score)} {r.score}점
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{r.summary}</p>
            {r.tip && (
              <p className="mt-3 rounded-2xl bg-primary/5 px-3 py-2 text-sm leading-relaxed">
                <span className="font-bold text-primary">TIP </span>
                {r.tip}
              </p>
            )}
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
        <SectionTitle>{na}와 잘 맞는 다른 띠</SectionTitle>
        <TtiRankingList me={a} exclude={b} limit={5} />
      </Card>

      {!same && (
        <Card>
          <SectionTitle>{nb}와 잘 맞는 다른 띠</SectionTitle>
          <TtiRankingList me={b} exclude={a} limit={5} />
        </Card>
      )}

      <FamilyCard seed={`${a}-${b}`} campaign="tti-pair" />

      <TtiDisclaimer />
    </main>
  );
}

function TtiMini({ t }: { t: Tti }) {
  const content = getTtiType(t);
  const info = ttiInfo(t);
  return (
    <Link
      href={ttiTypePath(t)}
      className="flex flex-1 flex-col rounded-2xl border-2 border-foreground/10 bg-background px-3 py-2 transition hover:border-primary/50"
    >
      <span className="text-base font-extrabold">
        {info.emoji} {ttiName(t)}
      </span>
      <span className="text-foreground/60">{content?.nickname ?? `${ttiName(t)} 궁합 순위`}</span>
    </Link>
  );
}
