import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/** 알림 끄기 — 구독 행을 지운다 */
export async function POST(req: NextRequest) {
  let endpoint: string | undefined;
  try {
    endpoint = (await req.json())?.endpoint;
  } catch {
    // 아래에서 처리
  }
  if (!endpoint || !endpoint.startsWith("https://") || endpoint.length > 1000) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return Response.json({ ok: true });
}
