import type { Metadata } from "next";
import Link from "next/link";
import {
  supabaseAdmin,
  SCORE_TABLE,
  type AnalysisInputs,
  type AnalysisResult,
} from "@/lib/supabase";
import { normalizeMbti, pairPath, typePath } from "@/lib/mbti";
import ScoreApp from "@/app/ScoreApp";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = { id: string };

async function loadShared(id: string) {
  if (!UUID_RE.test(id)) return null;
  try {
    const { data } = await supabaseAdmin
      .from(SCORE_TABLE)
      .select("inputs, result, relation")
      .eq("id", id)
      .single();
    if (!data) return null;
    return {
      inputs: data.inputs as AnalysisInputs,
      result: data.result as AnalysisResult,
      relation: (data.relation as string) || (data.inputs as AnalysisInputs).relation || "",
    };
  } catch {
    return null;
  }
}

// 공유 결과 페이지: 개인 결과라 색인은 막고(noindex), 링크는 따라가게(follow)
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const shared = await loadShared(id);
  const robots = { index: false, follow: true };
  if (!shared) return { robots, alternates: { canonical: "/" } };

  const { inputs, result, relation } = shared;
  const emoji = result.score >= 80 ? "🔥" : result.score >= 50 ? "💜" : "💧";
  const title = `${result.score}점! ${inputs.myMbti} × ${inputs.otherMbti} ${emoji}`;
  const description = result.tag || `${relation} 궁합 결과 확인하기`;
  const ogUrl =
    `/api/og?score=${result.score}` +
    `&mm=${encodeURIComponent(inputs.myMbti)}` +
    `&om=${encodeURIComponent(inputs.otherMbti)}` +
    `&rel=${encodeURIComponent(relation)}` +
    `&tag=${encodeURIComponent(result.tag ?? "")}`;

  return {
    title,
    description,
    robots,
    alternates: { canonical: `/r/${id}` },
    openGraph: {
      title,
      description,
      url: `/r/${id}`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function SharedResultPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const shared = await loadShared(id);
  const a = normalizeMbti(shared?.inputs.myMbti);
  const b = normalizeMbti(shared?.inputs.otherMbti);

  return (
    <>
      <ScoreApp initialId={id} />
      {a && b && (
        <section className="mx-auto w-full max-w-[480px] px-5 pb-6">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-extrabold">이 조합 더 알아보기</h2>
            <ul className="flex flex-col gap-1.5 text-sm">
              <li>
                <Link href={pairPath(a, b)} className="font-bold text-primary underline underline-offset-2">
                  {a} × {b} 궁합 상세 분석 →
                </Link>
              </li>
              <li>
                <Link href={typePath(a)} className="text-foreground/70 underline underline-offset-2">
                  {a} 궁합 순위
                </Link>
                {a !== b && (
                  <>
                    <span className="text-foreground/30"> · </span>
                    <Link href={typePath(b)} className="text-foreground/70 underline underline-offset-2">
                      {b} 궁합 순위
                    </Link>
                  </>
                )}
              </li>
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
