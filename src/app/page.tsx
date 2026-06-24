import type { Metadata } from "next";
import {
  supabaseAdmin,
  SCORE_TABLE,
  type AnalysisInputs,
  type AnalysisResult,
} from "@/lib/supabase";
import ScoreApp from "./ScoreApp";

// 공유 링크(?id=)로 진입 시 저장된 결과로 OG/제목/설명을 동적 생성
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await searchParams;
    if (!id) return {};

    const { data } = await supabaseAdmin
      .from(SCORE_TABLE)
      .select("inputs, result, relation")
      .eq("id", id)
      .single();
    if (!data) return {};

    const inputs = data.inputs as AnalysisInputs;
    const result = data.result as AnalysisResult;
    const rel = (data.relation as string) || inputs.relation || "";
    const emoji = result.score >= 80 ? "🔥" : result.score >= 50 ? "💜" : "💧";

    const title = `${result.score}점! ${inputs.myMbti} × ${inputs.otherMbti} ${emoji}`;
    const description = result.tag || `${rel} 궁합 결과 확인하기`;
    const ogUrl =
      `/api/og?score=${result.score}` +
      `&mm=${encodeURIComponent(inputs.myMbti)}` +
      `&om=${encodeURIComponent(inputs.otherMbti)}` +
      `&rel=${encodeURIComponent(rel)}` +
      `&tag=${encodeURIComponent(result.tag ?? "")}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: ogUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogUrl],
      },
    };
  } catch {
    return {};
  }
}

export default function Page() {
  return <ScoreApp />;
}
