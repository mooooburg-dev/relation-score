import type { Metadata } from "next";
import Link from "next/link";
import {
  Breadcrumb,
  Card,
  JsonLd,
  SectionTitle,
  breadcrumbLd,
} from "@/components/seo";
import {
  SITE_URL,
  getAllTypes,
  getTopPairs,
  pairPath,
  scoreEmoji,
  typePath,
} from "@/lib/mbti";

const TITLE = "MBTI 궁합표 - 16가지 유형별 궁합 순위";
const DESCRIPTION =
  "16가지 MBTI 유형별 궁합 순위와 136가지 조합 궁합 점수를 한눈에. 연인·친구·직장동료·썸 관계별로 잘 맞는 MBTI와 안 맞는 MBTI를 확인해보세요.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/mbti" },
  openGraph: {
    title: `${TITLE} | 몇점이야?`,
    description: DESCRIPTION,
    url: `${SITE_URL}/mbti`,
    type: "website",
  },
};

export default function MbtiIndexPage() {
  const types = getAllTypes();
  const top = getTopPairs(10);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: TITLE,
        description: DESCRIPTION,
        url: `${SITE_URL}/mbti`,
        inLanguage: "ko-KR",
        isPartOf: { "@type": "WebSite", name: "몇점이야?", url: SITE_URL },
      },
      breadcrumbLd([{ name: "MBTI 궁합표", path: "/mbti" }]),
      {
        "@type": "ItemList",
        name: "MBTI 16유형",
        itemListElement: types.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${t.type} ${t.nickname}`,
          url: `${SITE_URL}${typePath(t.type)}`,
        })),
      },
    ],
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={[{ name: "MBTI 궁합표" }]} />

      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">
          MBTI 궁합표 🔮
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          16가지 유형을 골라 나와 잘 맞는 MBTI 순위를 확인해봐. 연인, 친구,
          직장동료, 썸까지 관계별로 점수가 달라.
        </p>
      </header>

      <Card>
        <SectionTitle>유형별 궁합 보기</SectionTitle>
        <ul className="grid grid-cols-2 gap-2">
          {types.map((t) => (
            <li key={t.type}>
              <Link
                href={typePath(t.type)}
                className="block rounded-2xl border-2 border-foreground/10 bg-background px-3 py-3 transition hover:border-primary/50"
              >
                <span className="block text-base font-extrabold text-primary">
                  {t.type}
                </span>
                <span className="block text-xs font-semibold text-foreground/70">
                  {t.nickname}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <SectionTitle>궁합 점수 높은 조합 TOP 10</SectionTitle>
        <ol className="flex flex-col gap-2">
          {top.map((p, i) => (
            <li key={`${p.a}-${p.b}`}>
              <Link
                href={pairPath(p.a, p.b)}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-background"
              >
                <span className="w-6 text-center text-sm font-bold text-foreground/40">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-bold">
                  {p.a} × {p.b}
                </span>
                <span className="text-sm font-extrabold text-primary">
                  {scoreEmoji(p.overall)} {p.overall}점
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <SectionTitle>MBTI 궁합, 어떻게 보면 좋을까</SectionTitle>
        <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/80">
          <p>
            MBTI 궁합은 두 사람의 에너지 방향(E/I), 정보를 받아들이는 방식(S/N),
            결정 기준(T/F), 생활 태도(J/P)가 어떻게 맞물리는지를 보는 거야. 같은
            축이 겹치면 편하고, 다르면 서로를 보완하거나 부딪혀.
          </p>
          <p>
            그래서 같은 조합이라도 연인일 때와 직장동료일 때 점수가 달라. 여기
            나온 점수는 일반적인 성향을 기준으로 한 참고용이고, 나이·혈액형까지
            넣으면 AI가 두 사람만의 결과를 따로 뽑아줘.
          </p>
        </div>
      </Card>
    </main>
  );
}
