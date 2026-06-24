import { supabaseAdmin, SCORE_TABLE } from "@/lib/supabase";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !UUID_RE.test(id)) {
    return Response.json({ error: "잘못된 결과 ID" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from(SCORE_TABLE)
    .select("inputs, result, relation, view_count")
    .eq("id", id)
    .single();

  if (error || !data) {
    return Response.json({ error: "결과를 찾을 수 없어" }, { status: 404 });
  }

  // 조회수 증가 (실패해도 무시)
  try {
    await supabaseAdmin
      .from(SCORE_TABLE)
      .update({ view_count: ((data.view_count as number) ?? 0) + 1 })
      .eq("id", id);
  } catch {
    // ignore
  }

  // 민감정보(ip, user_agent)는 반환하지 않음
  return Response.json({
    inputs: data.inputs,
    result: data.result,
    relation: data.relation,
  });
}
