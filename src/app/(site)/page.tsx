import Link from "next/link";
import ScoreApp from "@/app/ScoreApp";
import { ArticleAd, TypeGrid } from "@/components/seo";
import { getTopPairs, pairPath, scoreEmoji } from "@/lib/mbti";

export default function Page() {
  const top = getTopPairs(6);
  return (
    <>
      <ScoreApp />
      {/* 검색 유입/크롤링용 콘텐츠 링크 (앱 아래) */}
      <section className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-5 pb-8">
        <ArticleAd />
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold">MBTI별 궁합 순위</h2>
            <Link href="/mbti" className="text-xs font-bold text-primary underline underline-offset-2">
              전체 궁합표 →
            </Link>
          </div>
          <TypeGrid />
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-extrabold">궁합 점수 높은 조합</h2>
          <ul className="grid grid-cols-2 gap-2">
            {top.map((p) => (
              <li key={`${p.a}-${p.b}`}>
                <Link
                  href={pairPath(p.a, p.b)}
                  className="flex items-center justify-between rounded-xl border-2 border-foreground/10 bg-background px-3 py-2 text-sm transition hover:border-primary/50"
                >
                  <span className="font-bold">
                    {p.a} × {p.b}
                  </span>
                  <span className="font-extrabold text-primary">
                    {scoreEmoji(p.overall)} {p.overall}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
