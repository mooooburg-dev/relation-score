import Link from "next/link";
import { verifyAdmin } from "@/lib/admin/auth";
import { getUserStats, type CountItem } from "@/lib/admin/data";
import { BarList, Empty, Panel, Stat } from "../ui";

/**
 * 사용자 프로필 화면.
 * 가입이 없어서 MBTI 분석에 입력한 본인 정보와 UA 로 본다. 띠·별자리·이름·생일 도구는
 * 입력이 서버에 남지 않아 여기 안 잡힌다 — 사이트 전체 방문자 기기·지역은 GA4 몫.
 */

type Search = Record<string, string | string[] | undefined>;

const PERIODS = [
  { value: "", label: "전체 기간" },
  { value: "7", label: "최근 7일" },
  { value: "30", label: "최근 30일" },
  { value: "90", label: "최근 90일" },
];

/** 막대 옆에 비율을 붙인다. 미입력은 비율 분모에서 뺀다(입력한 사람 중 몇 %인지) */
function withShare(items: CountItem[]) {
  const base = items.filter((i) => i.key !== "미입력").reduce((s, i) => s + i.count, 0);
  return items.map((i) => ({
    ...i,
    note: i.key === "미입력" ? "" : base ? `${Math.round((i.count / base) * 100)}%` : "-",
  }));
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  if (!(await verifyAdmin())) return null;

  const sp = await searchParams;
  const raw = Array.isArray(sp.days) ? sp.days[0] : sp.days;
  const period = PERIODS.find((p) => p.value === raw)?.value ?? "";
  const s = await getUserStats(period ? Number(period) : undefined);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold">사용자</h1>
        <div className="ml-auto flex gap-1">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={p.value ? `/admin/users?days=${p.value}` : "/admin/users"}
              className={`rounded-lg px-2.5 py-1 text-xs ${
                p.value === period ? "bg-primary text-white" : "text-foreground/60 hover:bg-black/5"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>
      <p className="-mt-2 text-xs text-foreground/50">
        MBTI 분석에 입력한 정보 기준(운영자·봇 제외). 사용자는 IP·기기 조합으로 추정하고, 본인 정보는 사람당 가장
        최근 입력 하나만 센다. 비율은 입력한 사람 중 비율.
        {s.truncated &&
          ` ⚠️ 전체 ${s.analysesTotal.toLocaleString()}건 중 최근 일부만 집계했어 (조회 상한).`}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="추정 사용자" value={s.users.toLocaleString()} sub={`분석 ${s.analyses.toLocaleString()}건`} />
        <Stat
          label="2회 이상 분석"
          value={s.repeatUsers.toLocaleString()}
          sub={s.users ? `${Math.round((s.repeatUsers / s.users) * 100)}%` : "-"}
        />
        <Stat label="나이 중앙값" value={s.medianAge ?? "-"} sub={`나이 입력 ${s.filled.age}%`} />
        <Stat label="성별 입력률" value={`${s.filled.gender}%`} sub={`혈액형 입력 ${s.filled.blood}%`} />
      </div>

      {s.users === 0 ? (
        <Empty>이 기간에 분석한 사용자가 없어</Empty>
      ) : (
        <>
          <h2 className="mt-2 text-lg font-bold">🙋 본인 정보</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="나이대" hint="사용자 기준">
              <BarList items={withShare(s.me.ageBands)} suffix="명" />
            </Panel>
            <Panel title="성별">
              <BarList items={withShare(s.me.gender)} suffix="명" />
            </Panel>
            <Panel title="혈액형">
              <BarList items={withShare(s.me.blood)} suffix="명" />
            </Panel>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="MBTI" hint="사용자 기준">
              <BarList items={withShare(s.me.mbti)} suffix="명" />
            </Panel>
            <Panel title="나이대별 많이 본 관계" hint="분석 건수 · 상위 3">
              {s.relationByAge.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-foreground/40">
                      <th className="pb-1 font-normal">나이대</th>
                      <th className="pb-1 text-right font-normal">사용자</th>
                      <th className="pb-1 pl-4 font-normal">관계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.relationByAge.map((r) => (
                      <tr key={r.band} className="border-t border-black/5">
                        <td className="py-1.5">{r.band}</td>
                        <td className="py-1.5 text-right tabular-nums">{r.users}</td>
                        <td className="py-1.5 pl-4 text-xs text-foreground/70">
                          {r.top.map((t) => `${t.relation} ${t.count}`).join(" · ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty>나이를 입력한 사용자가 없어</Empty>
              )}
            </Panel>
          </div>

          <h2 className="mt-2 text-lg font-bold">📱 기기</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="기기 종류" hint="사용자 기준">
              <BarList items={withShare(s.device.kind)} suffix="명" />
            </Panel>
            <Panel title="OS">
              <BarList items={withShare(s.device.os)} suffix="명" />
            </Panel>
            <Panel title="브라우저·인앱" hint="카톡·네이버앱 등은 인앱">
              <BarList items={withShare(s.device.browser)} suffix="명" />
            </Panel>
          </div>

          <h2 className="mt-2 text-lg font-bold">💞 궁합 상대 정보</h2>
          <p className="-mt-2 text-xs text-foreground/50">상대는 분석마다 다르므로 분석 건수 기준.</p>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="상대 나이대">
              <BarList items={withShare(s.other.ageBands)} />
            </Panel>
            <Panel title="상대 성별">
              <BarList items={withShare(s.other.gender)} />
            </Panel>
            <Panel title="상대 혈액형">
              <BarList items={withShare(s.other.blood)} />
            </Panel>
          </div>

          <Panel title="이용 시간대" hint="KST · 분석 건수">
            <BarList items={withShare(s.hours)} />
          </Panel>
        </>
      )}

      <p className="text-center text-[11px] text-foreground/35">
        사이트 전체 방문자의 기기·지역·유입은 GA4 에서 본다.
      </p>
    </div>
  );
}
