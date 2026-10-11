import { after, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { FAMILY_SITES, familyUtmUrl, type FamilySiteId } from "@/lib/family";
import { isOperatorRequest } from "@/lib/admin/operator";
import { isBotUa } from "@/lib/bot";

/**
 * 패밀리 사이트(골드박스투데이 등)로 나가는 클릭을 기록하고 302.
 *
 * 왜 끼우나: 버티컬(띠 궁합 등)을 늘리는 목적 중 하나가 골드박스투데이 전환이다.
 * UTM 만으로는 골드박스 쪽 GA 를 열어야 숫자가 보이고, 어느 페이지에서 넘어갔는지
 * 이 사이트 어드민에서 볼 수 없었다. 기록은 여기서, 귀속(UTM)은 그대로 붙여 보낸다.
 *
 * - 기록은 after() 로 응답 뒤에. 실패해도 이동은 반드시 된다.
 * - 쿠팡 링크가 아니라 우리 사이트로 가는 것이라 봇도 그대로 보낸다(무효 클릭 문제가 없다).
 *   대신 is_bot 으로 표시해 통계에서 뺀다.
 * - 오픈 리다이렉트 방지: 목적지는 FAMILY_SITES 의 고정 URL 뿐이다.
 */

const SITES = new Map(FAMILY_SITES.map((s) => [s.id, s]));
const VERTICALS = new Set(["mbti", "tti", "fortune", "zodiac", "name", "birthday", "gift", "result", "shared", "home", "footer"]);

/** 자유 입력값은 길이와 문자 집합으로 자른다 */
function clean(v: string | null, max = 60): string | null {
  if (!v) return null;
  const s = v.replace(/[^\p{L}\p{N}_\-.:]/gu, "").slice(0, max);
  return s || null;
}

/** 같은 도메인에서 온 클릭이면 그 경로만 남긴다 (쿼리 제외) */
function sourcePath(req: NextRequest): string | null {
  const ref = req.headers.get("referer");
  if (!ref) return null;
  try {
    const u = new URL(ref);
    return u.host === req.nextUrl.host ? u.pathname.slice(0, 120) : null;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ site: string }> },
) {
  const { site: siteId } = await params;
  const site = SITES.get(siteId as FamilySiteId);
  if (!site) return Response.redirect(new URL("/", req.url), 302);

  const q = req.nextUrl.searchParams;
  const campaign = clean(q.get("c"));
  const content = clean(q.get("ct"));
  const vertical = q.get("v");
  const userAgent = req.headers.get("user-agent");
  const isBot = !userAgent || isBotUa(userAgent);
  const isAdmin = isOperatorRequest(req);
  const path = sourcePath(req);

  after(async () => {
    try {
      await supabaseAdmin.from("outbound_clicks").insert({
        site: site.id,
        vertical: vertical && VERTICALS.has(vertical) ? vertical : null,
        campaign,
        content,
        source_path: path,
        is_admin: isAdmin,
        is_bot: isBot,
        user_agent: userAgent ? userAgent.slice(0, 200) : null,
      });
    } catch {
      // 기록 실패가 이동을 막지 않는다
    }
  });

  return Response.redirect(familyUtmUrl(site, campaign ?? "family", content ?? undefined), 302);
}
