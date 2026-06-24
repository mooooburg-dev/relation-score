import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 Supabase 클라이언트 (service_role 키 사용).
 * RLS를 우회하므로 절대 클라이언트 번들에 노출하면 안 됨 → 서버 라우트에서만 import.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

export const SCORE_TABLE = "score_analyses";

// 저장되는 입력값
export interface AnalysisInputs {
  myMbti: string;
  myGender?: string;
  myAge?: string;
  myBlood?: string;
  otherMbti: string;
  otherGender?: string;
  otherAge?: string;
  otherBlood?: string;
  relation: string;
}

// AI 분석 결과
export interface AnalysisResult {
  score: number;
  tag: string;
  summary: string;
  mbti_score: number;
  comm_score: number;
  emotion_score: number;
  longterm_score: number;
}
