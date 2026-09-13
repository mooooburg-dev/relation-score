import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 레거시 공유 링크 /?id=uuid → /r/uuid (쿼리 제거, 301)
export function proxy(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (id && UUID_RE.test(id)) {
    const url = new URL(`/r/${id}`, request.url);
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
