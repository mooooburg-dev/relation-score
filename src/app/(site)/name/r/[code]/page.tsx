import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/seo";
import { GoldboxCta } from "@/components/gift";
import { FamilyCard } from "@/components/family";
import { NameResult } from "@/components/name-result";
import { decodeNameShare, nameMatch } from "@/lib/name-match";
import { recordToolView } from "@/lib/tool-views";

type Params = { code: string };

// 개인 결과라 색인은 막고(noindex) 링크는 따라가게 한다 (/r/[id] 와 같은 정책).
// noindex 페이지에 다른 URL canonical 을 같이 걸면 신호가 엇갈려서 canonical 은 두지 않는다.
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const names = decodeNameShare((await params).code);
  const robots = { index: false, follow: true };
  if (!names) return { robots };
  const [a, b] = names;
  const score = nameMatch(a, b).score;
  const title = `${a} ♥ ${b} 이름 궁합 ${score}%`;
  const description = "우리 이름 궁합은 몇 %? 나도 이름 넣고 바로 확인해보기";
  return {
    title,
    description,
    robots,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function NameSharePage({ params }: { params: Promise<Params> }) {
  const names = decodeNameShare((await params).code);
  if (!names) notFound();
  await recordToolView("name");
  const [a, b] = names;

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 pb-12 pt-8">
      <header className="text-center">
        <p className="text-sm font-bold text-foreground/50">이름 궁합 결과</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
          {a} ♥ {b}
        </h1>
      </header>
      <Card>
        <NameResult me={a} other={b} />
      </Card>
      <Link
        href="/name"
        className="block rounded-2xl bg-primary py-4 text-center text-base font-bold text-white shadow-md transition active:scale-[0.98]"
      >
        나도 이름 궁합 보기 💘
      </Link>
      <GoldboxCta
        campaign="family_name-share-cta"
        content="name_share"
        vertical="name"
        title="궁합 좋게 나왔으면, 선물 하나 챙겨 🎁"
        description="골드박스 오늘의 특가와 역대 최저가 한눈에"
      />
      <Link
        href="/birthday"
        className="block rounded-2xl border-2 border-primary py-3.5 text-center text-sm font-bold text-primary"
      >
        🎂 생일로도 궁합 보기 →
      </Link>
      <FamilyCard seed={`${a}${b}`} campaign="name-share" />
    </main>
  );
}
