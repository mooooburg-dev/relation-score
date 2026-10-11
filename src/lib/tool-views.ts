import { after } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { isBotUa } from "@/lib/bot";
import { isOperatorRequest } from "@/lib/admin/operator";

/**
 * 공유 결과 페이지(/name/r, /birthday/r)가 열린 횟수를 남긴다 (tool_views).
 * 응답 뒤(after)에 기록하고, 실패해도 페이지에는 영향이 없다.
 * 이름·생일·공유 코드는 저장하지 않는다.
 */
export async function recordToolView(tool: "name" | "birthday") {
  const h = await headers();
  const ua = h.get("user-agent");
  // isOperatorRequest 는 Request 의 Cookie 헤더만 본다
  const req = new Request("https://score.drawyourmind.com", {
    headers: { cookie: h.get("cookie") ?? "" },
  });
  const row = {
    tool,
    is_bot: !ua || isBotUa(ua),
    is_admin: isOperatorRequest(req),
  };
  after(async () => {
    try {
      await supabaseAdmin.from("tool_views").insert(row);
    } catch {
      // 기록 실패는 무시
    }
  });
}
