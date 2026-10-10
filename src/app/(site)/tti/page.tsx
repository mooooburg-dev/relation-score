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
import { TtiDisclaimer, TtiGrid } from "@/components/tti";
import TtiFinder from "@/components/tti-finder";
import { SITE_URL, type Faq } from "@/lib/site";
import {
  TTI_IDS,
  TTI_INDEX_PATH,
  YEAR_MAX,
  scoreTti,
  ttiInfo,
  ttiName,
  ttiPairPath,
  ttiScoreEmoji,
  ttiTypePath,
  type Tti,
  type TtiRelationKind,
} from "@/lib/tti";
import { getAllTtiTypes, getTopTtiPairs, getTtiPair } from "@/lib/tti-content";

const TITLE = "띠 궁합표 - 12띠 궁합 점수, 잘 맞는 띠와 안 맞는 띠";
const DESCRIPTION =
  "쥐띠부터 돼지띠까지 12띠 78가지 조합의 궁합 점수를 한눈에. 육합·삼합·충·원진으로 계산한 근거와 연인·부부·친구·부모자식 관계별 궁합, 출생연도로 띠 찾기까지.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "띠 궁합",
    "띠 궁합표",
    "띠별 궁합",
    "12띠 궁합",
    "결혼 띠 궁합",
    "띠 궁합 원진",
    "띠 삼합",
    "띠 육합",
    "출생연도 띠",
  ],
  alternates: { canonical: TTI_INDEX_PATH },
  openGraph: {
    title: `${TITLE} | 몇점이야?`,
    description: DESCRIPTION,
    url: `${SITE_URL}${TTI_INDEX_PATH}`,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FAQ: Faq[] = [
  {
    q: "띠는 양력 기준이야, 음력 기준이야?",
    a: "띠는 해가 바뀌는 시점을 어디로 보느냐에 따라 달라. 명리(사주)에서는 입춘(양력 2월 4일 전후)을, 민속에서는 음력 설날을 기준으로 봐. 그래서 1~2월생은 전년도 띠일 수 있어.",
  },
  {
    q: "띠 궁합에서 가장 좋은 조합은?",
    a: "여섯 쌍뿐인 육합(쥐-소, 호랑이-돼지, 토끼-개, 용-닭, 뱀-원숭이, 말-양)과, 세 띠가 한 기운으로 뭉치는 삼합(원숭이·쥐·용, 돼지·토끼·양, 호랑이·말·개, 뱀·닭·소)을 좋은 궁합으로 봐.",
  },
  {
    q: "원진이 있으면 결혼하면 안 돼?",
    a: "그렇지 않아. 원진은 까닭 없이 서운함이 쌓이기 쉬운 관계라는 전통 해석일 뿐이야. 서운한 걸 그때그때 말로 풀고, 서로의 방식을 인정하면 충분히 좋은 관계가 될 수 있어.",
  },
  {
    q: "띠 궁합 점수는 어떻게 계산해?",
    a: "기본 70점에서 시작해 육합이면 92점, 삼합이면 88점, 같은 띠면 76점을 기준으로 잡아. 여기에 오행의 상생·상극을 더하고, 충·원진·형·해가 있으면 깎아서 40~96점으로 매겨.",
  },
];

const HOW: { kind: TtiRelationKind; title: string; desc: string }[] = [
  { kind: "yukhap", title: "육합(六合) · 92점 기준", desc: "서로 부족한 기운을 채워주는 여섯 쌍." },
  { kind: "samhap", title: "삼합(三合) · 88점 기준", desc: "세 띠가 한 기운으로 뭉치는 동료형 궁합." },
  { kind: "chung", title: "충(沖) · -18점", desc: "정반대 자리에서 정면으로 부딪히는 관계." },
  { kind: "wonjin", title: "원진(怨嗔) · -14점", desc: "까닭 없이 서운함이 쌓이기 쉬운 관계." },
  { kind: "hyeong", title: "형(刑) · -8점", desc: "서로를 바로잡으려다 상처를 주는 관계." },
  { kind: "hae", title: "해(害) · -6점", desc: "둘 사이의 합을 제3자가 방해하는 관계." },
];

/** 규칙 엔진에서 직접 뽑아 표와 설명이 어긋날 일이 없게 한다 */
function pairsOfKind(kind: TtiRelationKind): [Tti, Tti][] {
  const out: [Tti, Tti][] = [];
  for (let i = 0; i < TTI_IDS.length; i++)
    for (let j = i + 1; j < TTI_IDS.length; j++) {
      const s = scoreTti(TTI_IDS[i], TTI_IDS[j]);
      if (s.factors.some((f) => f.kind === kind)) out.push([TTI_IDS[i], TTI_IDS[j]]);
    }
  return out;
}

export default function TtiIndexPage() {
  const types = getAllTtiTypes();
  const top = getTopTtiPairs(8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: TITLE,
        description: DESCRIPTION,
        url: `${SITE_URL}${TTI_INDEX_PATH}`,
        inLanguage: "ko-KR",
        isPartOf: { "@type": "WebSite", name: "몇점이야?", url: SITE_URL },
      },
      breadcrumbLd([{ name: "띠 궁합표", path: TTI_INDEX_PATH }]),
      {
        "@type": "ItemList",
        name: "12띠 궁합",
        itemListElement: types.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${ttiName(t.id)} 궁합 - ${t.nickname}`,
          url: `${SITE_URL}${ttiTypePath(t.id)}`,
        })),
      },
      faqLd(FAQ),
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "띠 궁합표" }]} />

      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">띠 궁합표</h1>
        <p className="mt-2 text-base font-bold text-primary">12띠 78가지 조합, 몇 점일까?</p>
        <p className="mt-2 text-left text-sm leading-relaxed text-foreground/70">
          쥐띠부터 돼지띠까지 12띠의 궁합을 전통 지지 관계(육합·삼합·충·원진·형·해)와
          오행으로 계산했어. 출생연도만 고르면 내 띠와 상대 띠의 궁합을 바로 볼 수 있고,
          연인·부부·친구·직장동료·부모자식 관계별 점수도 따로 정리했어.
        </p>
      </header>

      <Card>
        <SectionTitle>출생연도로 띠 궁합 보기</SectionTitle>
        <TtiFinder maxYear={YEAR_MAX} />
      </Card>

      <Card>
        <SectionTitle>12띠별 궁합 순위</SectionTitle>
        <TtiGrid />
      </Card>

      <ArticleAd />

      <Card>
        <SectionTitle>띠 궁합표 한눈에 보기</SectionTitle>
        <p className="mb-3 text-xs text-foreground/50">
          칸을 누르면 두 띠의 궁합 상세로 이동해. 색이 진할수록 잘 맞아.
        </p>
        <ScoreMatrix />
      </Card>

      <Card>
        <SectionTitle>궁합 점수 높은 띠 조합</SectionTitle>
        <ul className="grid grid-cols-2 gap-2">
          {top.map((p) => (
            <li key={`${p.a}-${p.b}`}>
              <Link
                href={ttiPairPath(p.a, p.b)}
                className="flex items-center justify-between rounded-xl border-2 border-foreground/10 bg-background px-3 py-2 text-sm transition hover:border-primary/50"
              >
                <span className="font-bold">
                  {ttiInfo(p.a).ko}×{ttiInfo(p.b).ko}
                </span>
                <span className="font-extrabold text-primary">
                  {ttiScoreEmoji(p.score)} {p.score}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <GoldboxCta
        campaign="family_tti-index-cta"
        content="tti_index"
        vertical="tti"
        title="띠 궁합 봤으면, 선물은 특가로 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />

      <Card>
        <h2 id="how" className="mb-3 scroll-mt-4 text-lg font-extrabold tracking-tight">
          띠 궁합 점수 계산법
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-foreground/70">
          기본 70점에서 시작해 육합·삼합·같은 띠면 기준점을 올리고, 오행이 서로 살리면(상생)
          +4점, 같은 오행이면 +2점, 누르면(상극) -4점을 줘. 그다음 아래 관계가 있으면 깎아.
          같은 띠라도 용·말·닭·돼지는 스스로 부딪히는 자형(自刑)이라 -12점이야.
        </p>
        <dl className="flex flex-col gap-4">
          {HOW.map((h) => (
            <div key={h.kind}>
              <dt className="text-sm font-extrabold">{h.title}</dt>
              <dd className="mt-0.5 text-sm text-foreground/70">{h.desc}</dd>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {pairsOfKind(h.kind).map(([a, b]) => (
                  <Link
                    key={`${a}-${b}`}
                    href={ttiPairPath(a, b)}
                    className="rounded-full bg-background px-2.5 py-1 text-xs font-bold hover:text-primary"
                  >
                    {ttiInfo(a).ko}·{ttiInfo(b).ko}
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

      <Link
        href="/mbti"
        className="block rounded-2xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary transition active:scale-[0.98]"
      >
        MBTI 궁합표도 보기 →
      </Link>

      <TtiDisclaimer />
    </main>
  );
}

/** 12×12 궁합 점수표 (행·열 모두 지지 순서) */
function ScoreMatrix() {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full table-fixed border-separate border-spacing-0.5 text-center text-[11px]">
        <caption className="sr-only">12띠 궁합 점수표</caption>
        <thead>
          <tr>
            <th scope="col" className="w-7" />
            {TTI_IDS.map((t) => (
              <th key={t} scope="col" className="pb-1 font-normal" title={ttiName(t)}>
                <span aria-hidden>{ttiInfo(t).emoji}</span>
                <span className="sr-only">{ttiName(t)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TTI_IDS.map((a) => (
            <tr key={a}>
              <th scope="row" className="pr-0.5 font-normal" title={ttiName(a)}>
                <span aria-hidden>{ttiInfo(a).emoji}</span>
                <span className="sr-only">{ttiName(a)}</span>
              </th>
              {TTI_IDS.map((b) => {
                const pair = getTtiPair(a, b);
                const score = pair?.score ?? scoreTti(a, b).score;
                // 40~96 → 0.08~0.9 농도
                const alpha = 0.08 + ((score - 40) / 56) * 0.82;
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
                        href={ttiPairPath(a, b)}
                        aria-label={`${ttiName(a)} ${ttiName(b)} 궁합 ${score}점`}
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
