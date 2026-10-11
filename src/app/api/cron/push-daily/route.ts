import type { NextRequest } from "next/server";
import { sendDailyPush } from "@/lib/push";

/**
 * 매일 아침 오늘의 운세 알림 (Vercel 크론, vercel.json — 23:00 UTC = 08:00 KST).
 * Vercel 은 CRON_SECRET 이 있으면 Authorization: Bearer <CRON_SECRET> 을 붙여 부른다.
 * 비밀값이 없거나 다르면 거부한다(fail closed) — 아무나 대량 발송을 못 하게.
 */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await sendDailyPush();
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
