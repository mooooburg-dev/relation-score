import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase";
import { kstToday, todayTtiPath, todayZodiacPath, ttiDaily, ymdKey, zodiacDaily, BAND_LABEL, band, dailyEmoji } from "@/lib/daily";
import { dailyText } from "@/lib/daily-content";
import { isTti, ttiInfo, ttiName } from "@/lib/tti";
import { isZodiac, zodiacName } from "@/lib/zodiac";

/**
 * 웹 푸시 발송 (서버 전용).
 * VAPID 키가 없으면(로컬·프리뷰) 발송하지 않고 이유를 돌려준다.
 */

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@drawyourmind.com";

export const PUSH_READY = Boolean(PUBLIC && PRIVATE);

/**
 * 브라우저 푸시 서비스 호스트만 받는다. 엔드포인트는 사용자가 보내는 값이라 검사 없이 받으면
 * 크론이 매일 임의의 주소로 POST 하게 된다(SSRF). 크롬·엣지(FCM)·파이어폭스·사파리·윈도우.
 */
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^web\.push\.apple\.com$/,
  /\.push\.apple\.com$/,
  /\.notify\.windows\.com$/,
];

export function isPushEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && PUSH_HOSTS.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}
if (PUSH_READY) webpush.setVapidDetails(SUBJECT, PUBLIC!, PRIVATE!);

interface SubRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  tti: string | null;
  zodiac: string | null;
  fail_count: number;
}

/** 오늘 이 구독자에게 보낼 알림 내용. 띠가 있으면 띠 운세로, 별자리만 있으면 별자리 운세로 */
export function dailyPayload(tti: string | null, zodiac: string | null) {
  const today = kstToday();
  const utm = "utm_source=push&utm_medium=web-push&utm_campaign=daily";
  if (tti && isTti(tti)) {
    const s = ttiDaily(tti, today);
    const zz = zodiac && isZodiac(zodiac) ? zodiac : null;
    const z = zz ? zodiacDaily(zz, today) : null;
    return {
      title: `${ttiInfo(tti).emoji} ${ttiName(tti)} 오늘 ${s.score}점 · ${BAND_LABEL[band(s.score)]} ${dailyEmoji(s.score)}`,
      body: `${dailyText(`tti:${tti}`, s).total}${zz && z ? ` (${zodiacName(zz)} ${z.score}점)` : ""}`,
      url: `${todayTtiPath(tti)}?${utm}`,
      tag: `daily-${ymdKey(today)}`,
    };
  }
  if (zodiac && isZodiac(zodiac)) {
    const z = zodiacDaily(zodiac, today);
    return {
      title: `${zodiacName(zodiac)} 오늘 ${z.score}점 · ${BAND_LABEL[band(z.score)]} ${dailyEmoji(z.score)}`,
      body: dailyText(`zodiac:${zodiac}`, z).total,
      url: `${todayZodiacPath(zodiac)}?${utm}`,
      tag: `daily-${ymdKey(today)}`,
    };
  }
  return {
    title: "☀️ 오늘의 운세가 도착했어",
    body: "12띠·12별자리 오늘의 운세 순위 확인하기",
    url: `/today?${utm}`,
    tag: `daily-${ymdKey(today)}`,
  };
}

async function sendOne(row: SubRow, payload: object): Promise<"sent" | "gone" | "failed"> {
  // 허용 목록 밖이면 보내지 않고 정리한다 (구독 API 에서 막지만 한 번 더)
  if (!isPushEndpoint(row.endpoint)) return "gone";
  try {
    await webpush.sendNotification(
      { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
      JSON.stringify(payload),
      // 아침 알림이라 6시간 안에 못 받으면 버린다 (오후에 "오늘 아침 운세"가 오면 어색하다)
      { TTL: 6 * 3600, urgency: "normal" },
    );
    return "sent";
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    return code === 404 || code === 410 ? "gone" : "failed";
  }
}

/** 전체 구독자에게 오늘의 운세 알림을 보낸다 (크론). 동시 20개씩 */
export async function sendDailyPush(): Promise<{ total: number; sent: number; failed: number; removed: number; note?: string }> {
  if (!PUSH_READY) return { total: 0, sent: 0, failed: 0, removed: 0, note: "VAPID 키 없음" };

  const rows: SubRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, tti, zodiac, fail_count")
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(`구독 조회 실패: ${error.message}`);
    rows.push(...((data ?? []) as SubRow[]));
    if (!data || data.length < 1000) break;
  }

  let sent = 0;
  let failed = 0;
  const gone: number[] = [];
  const failedIds: SubRow[] = [];
  const sentIds: number[] = [];

  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20);
    const results = await Promise.all(batch.map((r) => sendOne(r, dailyPayload(r.tti, r.zodiac))));
    results.forEach((res, j) => {
      if (res === "sent") {
        sent++;
        sentIds.push(batch[j].id);
      } else if (res === "gone") gone.push(batch[j].id);
      else {
        failed++;
        failedIds.push(batch[j]);
      }
    });
  }

  const now = new Date().toISOString();
  if (sentIds.length)
    await supabaseAdmin.from("push_subscriptions").update({ last_sent_at: now, fail_count: 0 }).in("id", sentIds);
  if (gone.length) await supabaseAdmin.from("push_subscriptions").delete().in("id", gone);
  // 일시 오류는 세어 두고, 7번 연속 실패하면 정리한다
  for (const r of failedIds) {
    if (r.fail_count + 1 >= 7) await supabaseAdmin.from("push_subscriptions").delete().eq("id", r.id);
    else await supabaseAdmin.from("push_subscriptions").update({ fail_count: r.fail_count + 1 }).eq("id", r.id);
  }

  const summary = { total: rows.length, sent, failed, removed: gone.length };
  await supabaseAdmin.from("push_log").insert({ run_date: ymdKey(kstToday()), ...summary });
  return summary;
}
