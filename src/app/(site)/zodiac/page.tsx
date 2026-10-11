import type { Metadata } from "next";
import Link from "next/link";
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
import { ZodiacDisclaimer, ZodiacGrid } from "@/components/zodiac";
import ZodiacFinder from "@/components/zodiac-finder";
import { SITE_URL, type Faq } from "@/lib/site";
import {
  ELEMENT_EMOJI,
  ZODIAC_IDS,
  ZODIAC_INDEX_PATH,
  ZODIAC_LIST,
  scoreZodiac,
  zodiacDates,
  zodiacInfo,
  zodiacName,
  zodiacPairPath,
  zodiacScoreEmoji,
  zodiacTypePath,
  type Zodiac,
  type ZodiacRelationKind,
} from "@/lib/zodiac";
import { getAllZodiacTypes, getTopZodiacPairs, getZodiacPair } from "@/lib/zodiac-content";
import { TTI_INDEX_PATH } from "@/lib/tti";

const TITLE = "별자리 궁합표 - 12별자리 궁합 점수, 잘 맞는 별자리와 안 맞는 별자리";
const DESCRIPTION =
  "양자리부터 물고기자리까지 12별자리 78가지 조합의 궁합 점수를 한눈에. 트라인·섹스타일·스퀘어 같은 점성술 각도로 계산한 근거와 연인·썸·부부·친구·직장동료 관계별 궁합, 생일로 별자리 찾기까지.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "별자리 궁합",
    "별자리 궁합표",
    "별자리별 궁합",
    "12별자리 궁합",
    "별자리 연애 궁합",
    "생일 별자리",
    "별자리 날짜",
    "궁수자리 궁합",
  ],
  alternates: { canonical: ZODIAC_INDEX_PATH },
  openGraph: {
    title: `${TITLE} | 몇점이야?`,
    description: DESCRIPTION,
    url: `${SITE_URL}${ZODIAC_INDEX_PATH}`,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FAQ: Faq[] = [
  {
    q: "별자리는 생일 기준으로 어떻게 정해져?",
    a: "태어난 날 태양이 황도 12궁 중 어디에 있었는지로 정해. 양자리(3/21~4/19)부터 물고기자리(2/19~3/20)까지인데, 경계일은 해마다 하루 정도 달라질 수 있어.",
  },
  {
    q: "가장 잘 맞는 별자리 조합은?",
    a: "같은 원소끼리 120° 떨어진 트라인(예: 양자리-사자자리-사수자리)이 가장 편안한 조합으로 꼽혀. 서로 북돋는 원소가 만나는 섹스타일(예: 불-공기, 흙-물)도 잘 맞는 편이야.",
  },
  {
    q: "사수자리와 궁수자리는 같은 별자리야?",
    a: "응, 같은 별자리야. 활을 든 반인반마를 뜻해서 사수자리, 궁수자리 두 이름을 모두 써.",
  },
  {
    q: "별자리 궁합 점수는 어떻게 계산해?",
    a: "두 별자리 사이의 각도로 기본 점수를 정해. 트라인 92, 섹스타일 84, 같은 별자리 78, 오포지션 70, 30° 62, 150° 56, 스퀘어 50점이고, 같은 지배성이면 +4, 금성·화성 짝이나 태양·달 짝이면 +3을 더해.",
  },
];

const HOW: { kind: ZodiacRelationKind; title: string }[] = [
  { kind: "trine", title: "트라인(120°) · 92점" },
  { kind: "sextile", title: "섹스타일(60°) · 84점" },
  { kind: "opposition", title: "오포지션(180°) · 70점" },
  { kind: "square", title: "스퀘어(90°) · 50점" },
  { kind: "coruler", title: "같은 지배성 · +4점" },
  { kind: "venusmars", title: "금성 × 화성 · +3점" },
];

function pairsOfKind(kind: ZodiacRelationKind): [Zodiac, Zodiac][] {
  const out: [Zodiac, Zodiac][] = [];
  for (let i = 0; i < ZODIAC_IDS.length; i++)
    for (let j = i + 1; j < ZODIAC_IDS.length; j++)
      if (scoreZodiac(ZODIAC_IDS[i], ZODIAC_IDS[j]).factors.some((f) => f.kind === kind))
        out.push([ZODIAC_IDS[i], ZODIAC_IDS[j]]);
  return out;
}

const ELEMENTS = ["불", "흙", "공기", "물"] as const;

export default function ZodiacIndexPage() {
  const types = getAllZodiacTypes();
  const top = getTopZodiacPairs(8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: TITLE,
        description: DESCRIPTION,
        url: `${SITE_URL}${ZODIAC_INDEX_PATH}`,
        inLanguage: "ko-KR",
        isPartOf: { "@type": "WebSite", name: "몇점이야?", url: SITE_URL },
      },
      breadcrumbLd([{ name: "별자리 궁합표", path: ZODIAC_INDEX_PATH }]),
      {
        "@type": "ItemList",
        name: "12별자리 궁합",
        itemListElement: types.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${zodiacName(t.id)} 궁합 - ${t.nickname}`,
          url: `${SITE_URL}${zodiacTypePath(t.id)}`,
        })),
      },
      faqLd(FAQ),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "별자리 궁합표" }]} />

      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">별자리 궁합표</h1>
        <p className="mt-2 text-base font-bold text-primary">12별자리 78가지 조합, 몇 점일까?</p>
        <p className="mt-2 text-left text-sm leading-relaxed text-foreground/70">
          양자리부터 물고기자리까지 12별자리의 궁합을 점성술의 각도(트라인·섹스타일·스퀘어·
          오포지션)와 지배성으로 계산했어. 생일만 고르면 두 사람의 별자리 궁합을 바로 볼 수
          있고, 연인·썸·부부·친구·직장동료 관계별 점수도 따로 정리했어.
        </p>
      </header>

      <Card>
        <SectionTitle>생일로 별자리 궁합 보기</SectionTitle>
        <ZodiacFinder />
      </Card>

      <Card>
        <SectionTitle>12별자리별 궁합 순위</SectionTitle>
        <ZodiacGrid />
      </Card>

      <ArticleAd />

      <Card>
        <SectionTitle>별자리 궁합표 한눈에 보기</SectionTitle>
        <p className="mb-3 text-xs text-foreground/50">
          칸을 누르면 두 별자리의 궁합 상세로 이동해. 색이 진할수록 잘 맞아.
        </p>
        <ScoreMatrix />
      </Card>

      <Card>
        <SectionTitle>궁합 점수 높은 별자리 조합</SectionTitle>
        <ul className="grid grid-cols-2 gap-2">
          {top.map((p) => (
            <li key={`${p.a}-${p.b}`}>
              <Link
                href={zodiacPairPath(p.a, p.b)}
                className="flex items-center justify-between rounded-xl border-2 border-foreground/10 bg-background px-3 py-2 text-sm transition hover:border-primary/50"
              >
                <span className="truncate font-bold">
                  {zodiacInfo(p.a).symbol}
                  {zodiacInfo(p.b).symbol} {zodiacName(p.a).replace("자리", "")}×
                  {zodiacName(p.b).replace("자리", "")}
                </span>
                <span className="shrink-0 font-extrabold text-primary">
                  {zodiacScoreEmoji(p.score)} {p.score}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <GoldboxCta
        campaign="family_zodiac-index-cta"
        content="zodiac_index"
        vertical="zodiac"
        title="별자리 궁합 봤으면, 생일 선물은 특가로 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <Card>
        <SectionTitle>원소별 별자리</SectionTitle>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {ELEMENTS.map((el) => (
            <div key={el} className="rounded-xl bg-background p-3">
              <dt className="font-extrabold">
                {ELEMENT_EMOJI[el]} {el}의 별자리
              </dt>
              <dd className="mt-1 flex flex-col gap-0.5">
                {ZODIAC_LIST.filter((z) => z.element === el).map((z) => (
                  <Link key={z.id} href={zodiacTypePath(z.id)} className="hover:text-primary">
                    {z.symbol} {z.ko}{" "}
                    <span className="text-[11px] text-foreground/45">{zodiacDates(z.id)}</span>
                  </Link>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <h2 id="how" className="mb-3 scroll-mt-4 text-lg font-extrabold tracking-tight">
          별자리 궁합 점수 계산법
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-foreground/70">
          황도 12궁은 30°씩 떨어져 있어서 두 별자리 사이의 칸 수가 곧 각도야. 각도마다 기본 점수를
          정하고(같은 별자리 78, 30° 62, 150° 56), 같은 지배성이면 +4, 금성·화성 짝이나 태양(사자
          자리)·달(게자리) 짝이면 +3을 더했어.
        </p>
        <dl className="flex flex-col gap-4">
          {HOW.map((h) => (
            <div key={h.kind}>
              <dt className="text-sm font-extrabold">{h.title}</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {pairsOfKind(h.kind).map(([a, b]) => (
                  <Link
                    key={`${a}-${b}`}
                    href={zodiacPairPath(a, b)}
                    className="rounded-full bg-background px-2.5 py-1 text-xs font-bold hover:text-primary"
                  >
                    {zodiacName(a).replace("자리", "")}·{zodiacName(b).replace("자리", "")}
                  </Link>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <SectionTitle>자주 묻는 질문</SectionTitle>
        <FaqList faq={FAQ} />
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/mbti"
          className="block rounded-2xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary"
        >
          MBTI 궁합표 →
        </Link>
        <Link
          href={TTI_INDEX_PATH}
          className="block rounded-2xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary"
        >
          띠 궁합표 →
        </Link>
      </div>

      <ZodiacDisclaimer />
    </main>
  );
}

/** 12×12 궁합 점수표 (황도 순서) */
function ScoreMatrix() {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full table-fixed border-separate border-spacing-0.5 text-center text-[11px]">
        <caption className="sr-only">12별자리 궁합 점수표</caption>
        <thead>
          <tr>
            <th scope="col" className="w-7" />
            {ZODIAC_IDS.map((z) => (
              <th key={z} scope="col" className="pb-1 font-normal" title={zodiacName(z)}>
                <span aria-hidden>{zodiacInfo(z).symbol}</span>
                <span className="sr-only">{zodiacName(z)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ZODIAC_IDS.map((a) => (
            <tr key={a}>
              <th scope="row" className="pr-0.5 font-normal" title={zodiacName(a)}>
                <span aria-hidden>{zodiacInfo(a).symbol}</span>
                <span className="sr-only">{zodiacName(a)}</span>
              </th>
              {ZODIAC_IDS.map((b) => {
                const pair = getZodiacPair(a, b);
                const score = pair?.score ?? scoreZodiac(a, b).score;
                // 50~96 → 0.08~0.9 농도
                const alpha = 0.08 + ((score - 50) / 46) * 0.82;
                const cell = (
                  <span
                    className={`block rounded py-1 font-bold ${alpha > 0.5 ? "text-white" : "text-foreground/70"}`}
                    style={{ backgroundColor: `rgba(127, 119, 221, ${alpha.toFixed(2)})` }}
                  >
                    {score}
                  </span>
                );
                return (
                  <td key={b} className="p-0">
                    {pair ? (
                      <Link
                        href={zodiacPairPath(a, b)}
                        aria-label={`${zodiacName(a)} ${zodiacName(b)} 궁합 ${score}점`}
                      >
                        {cell}
                      </Link>
                    ) : (
                      cell
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
