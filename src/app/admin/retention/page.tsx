import Link from "next/link";
import { verifyAdmin } from "@/lib/admin/auth";
import { getOutboundStats, getPushStats } from "@/lib/admin/data";
import { isTti, ttiName } from "@/lib/tti";
import { BarList, Empty, Panel, Stat } from "../ui";

/**
 * 재방문(리텐션) 화면.
 * 서버에 남는 건 웹 푸시 구독·발송 기록뿐이다. 생일 저장·출석·최근 본 궁합은 브라우저에만 있어서
 * GA4 커스텀 이벤트(daily_checkin·profile_save·history_open·push_subscribe)로 본다.
 */
export default async function AdminRetentionPage() {
  if (!(await verifyAdmin())) return null;
  const [push, todayOut, eventOut] = await Promise.all([
    getPushStats((t) => (isTti(t) ? ttiName(t) : t)),
    getOutboundStats({ vertical: "today" }),
    getOutboundStats({ vertical: "event" }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">재방문</h1>

      <h2 className="mt-2 text-lg font-bold">🔔 오늘의 운세 알림</h2>
      <p className="-mt-2 text-xs text-foreground/50">
        매일 23:00 UTC(08:00 KST) Vercel 크론이 보낸다. 운영자 구독은 제외. 알림을 눌러 들어온 방문은 GA 에서
        utm_source=push 로 본다.
      </p>
      {push.error ? (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          기록 테이블을 읽지 못했어 (20261012-push.sql). {push.error}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="구독자" value={push.subscribers.toLocaleString()} />
            <Stat label="최근 7일 신규" value={push.newLast7.toLocaleString()} />
            <Stat
              label="마지막 발송"
              value={push.log[0] ? `${push.log[0].sent}/${push.log[0].total}` : "-"}
              sub={push.log[0]?.run_date ?? "아직 없음"}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="구독자 띠">
              {push.byTti.length ? <BarList items={push.byTti} suffix="명" /> : <Empty>아직 구독자가 없어</Empty>}
            </Panel>
            <Panel title="발송 기록" hint="최근 14회">
              {push.log.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-foreground/40">
                      <th className="pb-1 font-normal">날짜</th>
                      <th className="pb-1 text-right font-normal">성공/대상</th>
                      <th className="pb-1 text-right font-normal">실패</th>
                      <th className="pb-1 text-right font-normal">만료 정리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {push.log.map((l) => (
                      <tr key={l.run_date + l.total} className="border-t border-black/5">
                        <td className="py-1.5">{l.run_date}</td>
                        <td className="py-1.5 text-right tabular-nums">
                          {l.sent}/{l.total}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">{l.failed}</td>
                        <td className="py-1.5 text-right tabular-nums">{l.removed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty>아직 발송 기록이 없어</Empty>
              )}
            </Panel>
          </div>
        </>
      )}

      <h2 className="mt-2 text-lg font-bold">☀️ 오늘의 운세 → 골드박스 전환</h2>
      <Panel title="클릭 자리" hint={todayOut.error ? "" : `누적 ${todayOut.total} · 7일 ${todayOut.last7}`}>
        {todayOut.error ? (
          <p className="text-sm text-foreground/60">{todayOut.error}</p>
        ) : todayOut.byCampaign.length ? (
          <BarList items={todayOut.byCampaign} />
        ) : (
          <Empty>아직 클릭이 없어</Empty>
        )}
      </Panel>

      <h2 className="mt-2 text-lg font-bold">🎉 시즌 이벤트 → 골드박스 전환</h2>
      <Panel title="이벤트별" hint={eventOut.error ? "" : `누적 ${eventOut.total} · 7일 ${eventOut.last7}`}>
        {eventOut.error ? (
          <p className="text-sm text-foreground/60">{eventOut.error}</p>
        ) : eventOut.byPage.length ? (
          <BarList items={eventOut.byPage} />
        ) : (
          <Empty>아직 클릭이 없어</Empty>
        )}
      </Panel>

      <Panel title="GA4 에서 볼 것" hint="브라우저에만 저장되는 지표">
        <ul className="flex flex-col gap-1.5 text-sm text-foreground/70">
          <li>
            <b>daily_checkin</b> — 오늘의 운세 확인. 매개변수 streak(연속 일수), returning(1 = 재방문자)
          </li>
          <li>
            <b>profile_save</b> — 생일 저장 · <b>history_open</b> — 최근 본 궁합 다시 열기
          </li>
          <li>
            <b>push_subscribe</b> / <b>push_unsubscribe</b> — 알림 켜기·끄기 · <b>pwa_install_prompt</b> — 홈 화면 추가
          </li>
          <li>
            <b>event_banner_click</b> — 시즌 이벤트 배너(매개변수 event)
          </li>
          <li>
            utm_source=<b>push</b> — 알림으로 들어온 방문 · utm_source=<b>pwa</b> — 홈 화면 앱으로 들어온 방문
          </li>
        </ul>
      </Panel>

      <p className="text-center text-[11px] text-foreground/35">
        <Link href="/today" className="hover:text-primary">
          /today 열기
        </Link>
      </p>
    </div>
  );
}
