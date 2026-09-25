import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  AnalyzeCta,
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
import { FamilyCard } from "@/components/family";
import { GiftCtaPair } from "@/components/gift";
import {
  RELATIONS,
  SITE_URL,
  getAllPairs,
  getPair,
  getRanking,
  getType,
  ko,
  pairPath,
  pairSlug,
  parsePairSlug,
  scoreEmoji,
  scoreLabel,
  typePath,
  type Mbti,
} from "@/lib/mbti";

// 사전 생성되지 않은 slug(대문자, 역순)는 런타임에 permanentRedirect / notFound 처리
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllPairs().map((p) => ({ slug: pairSlug(p.a, p.b) }));
}

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parsePairSlug(slug);
  const pair = parsed ? getPair(parsed[0], parsed[1]) : null;
  if (!parsed || !pair) return {};

  const { a, b } = pair;
  const lover = pair.relations.find((r) => r.relation === "연인")?.score ?? pair.overall;
  const friend = pair.relations.find((r) => r.relation === "친구")?.score ?? pair.overall;
  const ka = ko(a);
  const kb = ko(b);
  const title =
    a === b
      ? `${a} ${b} 궁합 ${pair.overall}점 (${ka} ${kb}) - 같은 유형끼리 만나면`
      : `${a} ${b} 궁합 ${pair.overall}점 (${ka} ${kb}) - 연인 ${lover}점, 친구 ${friend}점`;
  const description = `${a}(${ka})와 ${b}(${kb})의 MBTI 궁합 점수는 ${pair.overall}점. ${pair.headline} 연인·친구·직장동료·가족·소개팅·썸 6가지 관계별 궁합과 잘 맞는 이유, 부딪히는 포인트, 실전 팁까지 정리했어.`;
  const path = pairPath(a, b);

  return {
    title,
    description,
    keywords: [
      `${a} ${b} 궁합`,
      `${b} ${a} 궁합`,
      `${ka} ${kb} 궁합`,
      `${kb} ${ka} 궁합`,
      `${a} ${b} 연애`,
      `${ka} ${kb} 연애`,
      `${a} ${b} 친구`,
      `${a} ${b} 커플`,
      `${a} ${b} 케미`,
      "MBTI 궁합",
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

export default async function PairPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const parsed = parsePairSlug(slug);
  if (!parsed) notFound();
  const canonical = pairSlug(parsed[0], parsed[1]);
  if (slug !== canonical) permanentRedirect(`/pair/${canonical}`);

  const pair = getPair(parsed[0], parsed[1]);
  if (!pair) notFound();
  const { a, b } = pair;
  const ta = getType(a);
  const tb = getType(b);
  const path = pairPath(a, b);
  const same = a === b;
  const scoreOf = (rel: string) =>
    pair.relations.find((r) => r.relation === rel)?.score ?? pair.overall;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${a} ${b} 궁합 ${pair.overall}점`,
        alternativeHeadline: `${ko(a)} ${ko(b)} 궁합`,
        description: pair.headline,
        url: `${SITE_URL}${path}`,
        inLanguage: "ko-KR",
        author: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        publisher: { "@type": "Organization", name: "몇점이야?", url: SITE_URL },
        mainEntityOfPage: `${SITE_URL}${path}`,
        about: [
          { "@type": "Thing", name: a },
          { "@type": "Thing", name: b },
        ],
      },
      breadcrumbLd([
        { name: "MBTI 궁합표", path: "/mbti" },
        { name: `${a} 궁합`, path: typePath(a) },
        { name: `${a} × ${b}`, path },
      ]),
      faqLd(pair.faq),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb
        items={[
          { name: "MBTI 궁합표", path: "/mbti" },
          { name: `${a} 궁합`, path: typePath(a) },
          { name: `${a} × ${b}` },
        ]}
      />

      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {a} × {b} 궁합
          <span className="mt-1 block text-base font-bold text-foreground/50">
            {ko(a)} × {ko(b)} 궁합
          </span>
        </h1>
        <p className="mt-2 text-base font-bold text-primary">{pair.headline}</p>
        <p className="mt-2 text-left text-sm leading-relaxed text-foreground/70">
          {same ? (
            <>
              {ko(a)}({a})끼리 만나면 궁합 점수는 100점 만점에 {pair.overall}점이야.
            </>
          ) : (
            <>
              {ko(a)}({a})와 {ko(b)}({b})의 궁합 점수는 100점 만점에{" "}
              {pair.overall}점. {ko(b)} {ko(a)} 궁합으로 찾아와도 결과는 같아.
            </>
          )}{" "}
          연인 {scoreOf("연인")}점, 친구 {scoreOf("친구")}점, 직장동료{" "}
          {scoreOf("직장동료")}점이야.
        </p>
      </header>

      <Card className="flex flex-col items-center gap-4">
        <BigScore score={pair.overall} />
        <p className="text-center text-sm leading-relaxed text-foreground/80">
          {pair.summary}
        </p>
        <div className="flex w-full gap-2 text-center text-xs">
          <TypeMini t={a} nickname={ta?.nickname} />
          {!same && <TypeMini t={b} nickname={tb?.nickname} />}
        </div>
      </Card>

      <Card>
        <SectionTitle>관계별 궁합 점수</SectionTitle>
        <div className="flex flex-col gap-3">
          {pair.relations.map((r) => {
            const emoji = RELATIONS.find((x) => x.value === r.relation)?.emoji;
            return <ScoreBar key={r.relation} label={r.relation} score={r.score} emoji={emoji} />;
          })}
        </div>
      </Card>

      {/* 궁합을 확인한 직후가 선물로 넘어가기 제일 좋은 지점 */}
      <GiftCtaPair a={a} b={b} />

      <AnalyzeCta a={a} b={b} />

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
        const emoji = RELATIONS.find((x) => x.value === r.relation)?.emoji;
        return (
          <Card key={r.relation}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight">
                {emoji} {r.relation}으로 만나면
              </h2>
              <span className="text-sm font-extrabold text-primary">
                {scoreEmoji(r.score)} {r.score}점 · {scoreLabel(r.score)}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{r.summary}</p>
            {r.tip && (
              <p className="mt-3 rounded-2xl bg-primary/5 px-3 py-2 text-sm leading-relaxed">
                <span className="font-bold text-primary">TIP </span>
                {r.tip}
              </p>
            )}
            <Link
              href={`/?mm=${a}&om=${b}&rel=${encodeURIComponent(r.relation)}`}
              className="mt-3 inline-block text-xs font-bold text-primary underline underline-offset-2"
            >
              {r.relation} 궁합 AI 정밀 분석 →
            </Link>
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

      <Card>
        <SectionTitle>{a}와 잘 맞는 다른 유형</SectionTitle>
        <RelatedList me={a} exclude={b} />
      </Card>

      {!same && (
        <Card>
          <SectionTitle>{b}와 잘 맞는 다른 유형</SectionTitle>
          <RelatedList me={b} exclude={a} />
        </Card>
      )}

      <FamilyCard seed={`${a}-${b}`} campaign="pair" />
    </main>
  );
}

function TypeMini({ t, nickname }: { t: Mbti; nickname?: string }) {
  return (
    <Link
      href={typePath(t)}
      className="flex flex-1 flex-col rounded-2xl border-2 border-foreground/10 bg-background px-3 py-2 transition hover:border-primary/50"
    >
      <span className="text-base font-extrabold">
        {t} <span className="text-xs font-semibold text-foreground/50">{ko(t)}</span>
      </span>
      <span className="text-foreground/60">{nickname ?? `${t} 궁합 순위`}</span>
    </Link>
  );
}

function RelatedList({ me, exclude }: { me: Mbti; exclude: Mbti }) {
  const items = getRanking(me)
    .filter((r) => r.other !== exclude)
    .slice(0, 5);
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((r) => (
        <li key={r.other}>
          <Link
            href={pairPath(me, r.other)}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-background"
          >
            <span className="flex w-24 shrink-0 flex-col leading-tight">
              <span className="text-sm font-bold">
                {me} × {r.other}
              </span>
              <span className="text-[10px] font-semibold text-foreground/50">
                {ko(me)} × {ko(r.other)}
              </span>
            </span>
            <span className="flex-1 truncate text-xs text-foreground/60">
              {r.pair.headline}
            </span>
            <span className="shrink-0 text-sm font-extrabold text-primary">
              {r.score}
            </span>
          </Link>
        </li>
      ))}
      <li className="mt-1 text-right">
        <Link
          href={typePath(me)}
          className="text-xs font-bold text-primary underline underline-offset-2"
        >
          {me} 전체 궁합 순위 →
        </Link>
      </li>
    </ul>
  );
}
