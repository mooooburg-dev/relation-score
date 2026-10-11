import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isTti } from "@/lib/tti";
import { isZodiac } from "@/lib/zodiac";
import { isBotUa } from "@/lib/bot";
import { isOperatorRequest } from "@/lib/admin/operator";
import { isPushEndpoint } from "@/lib/push";

/**
 * 웹 푸시 구독 저장(upsert). 같은 기기가 다시 구독하거나 생일을 바꾸면 띠·별자리만 갱신된다.
 * 저장: 엔드포인트·키·띠·별자리. 생일·IP·UA 는 저장하지 않는다.
 */
export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent");
  if (!ua || isBotUa(ua)) return Response.json({ error: "forbidden" }, { status: 403 });

  let body: {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    tti?: string;
    zodiac?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad json" }, { status: 400 });
  }

  const sub = body.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (
    !endpoint ||
    endpoint.length > 1000 ||
    !isPushEndpoint(endpoint) ||
    !p256dh ||
    p256dh.length > 200 ||
    !auth ||
    auth.length > 100
  ) {
    return Response.json({ error: "invalid subscription" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      endpoint,
      p256dh,
      auth,
      tti: body.tti && isTti(body.tti) ? body.tti : null,
      zodiac: body.zodiac && isZodiac(body.zodiac) ? body.zodiac : null,
      is_admin: isOperatorRequest(req),
      updated_at: new Date().toISOString(),
      fail_count: 0,
    },
    { onConflict: "endpoint" },
  );
  if (error) return Response.json({ error: "save failed" }, { status: 500 });
  return Response.json({ ok: true });
}
