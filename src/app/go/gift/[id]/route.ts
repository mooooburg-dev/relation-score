import { after, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import linksJson from "@/data/gift-links.json";
import { MBTI_LIST } from "@/lib/mbti";
import { isOperatorRequest } from "@/lib/admin/operator";

/**
 * 선물 링크 클릭 기록 후 쿠팡 파트너스 링크로 302.
 *
 * 왜 리다이렉트를 끼우나: 쿠팡 subId 는 채널 귀속 때문에 'scoregift' 단일로
 * 고정이라(쪼개지 않는다) 파트너스 리포트만으로는 어느 화면에서 눌렀는지 알 수 없다.
 * 화면 구분은 우리 쪽에서 남긴다.
 *
 * 기록은 after() 로 응답 뒤에 돌린다 — 사용자를 DB 쓰기만큼 기다리게 하지 않는다.
 * 기록에 실패해도 이동은 반드시 된다(매출 경로가 로깅보다 우선).
 */

const links = linksJson as Record<string, string>;

/** 자유 입력값을 그대로 넣지 않는다 — 길이·화이트리스트로 자른다 */
const SURFACES = new Set(["list", "relation"]);
const ENTRIES = new Set(["type", "pair", "result"]);
const RELATIONS = new Set([
  "연인", "썸", "친구", "직장동료", "가족", "소개팅",
]);
const TYPES = new Set<string>(MBTI_LIST);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const target = links[id];

  // 모르는 id 면 선물 목록으로 돌려보낸다 (404 로 끊지 않는다)
  if (!target) {
    return Response.redirect(new URL("/gift", req.url), 302);
  }

  const q = req.nextUrl.searchParams;
  const mbti = q.get("t")?.toUpperCase();
  const surface = q.get("s");
  const relation = q.get("r");
  const entry = q.get("f");
  const isAdmin = isOperatorRequest(req);

  after(async () => {
    try {
      await supabaseAdmin.from("gift_clicks").insert({
        gift_id: id,
        mbti: mbti && TYPES.has(mbti) ? mbti : null,
        surface: surface && SURFACES.has(surface) ? surface : "list",
        relation: relation && RELATIONS.has(relation) ? relation : null,
        entry: entry && ENTRIES.has(entry) ? entry : null,
        is_admin: isAdmin,
      });
    } catch {
      // 기록 실패가 이동을 막지 않는다
    }
  });

  return Response.redirect(target, 302);
}
