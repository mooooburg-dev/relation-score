"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BAND_LABEL,
  band,
  dailyEmoji,
  dateLabel,
  kstToday,
  todayTtiPath,
  todayZodiacPath,
  TODAY_PATH,
  ttiDaily,
  zodiacDaily,
} from "@/lib/daily";
import { TTI_LIST } from "@/lib/tti-rules";
import PushOptIn from "@/components/push-opt-in";
import { ZODIAC_LIST } from "@/lib/zodiac-rules";
import {
  VISITOR_EVENT,
  clearProfile,
  getProfile,
  getStreak,
  profileTti,
  profileZodiac,
  saveProfile,
  touchStreak,
  type Profile,
  type Streak,
} from "@/lib/visitor";

/**
 * "내 오늘의 운세" 카드 — 재방문의 핵심.
 *
 * 생일을 한 번 저장하면(이 브라우저에만) 다음부터 내 띠·별자리의 오늘 점수가 바로 뜬다.
 *  - variant="full": /today 상단. 들어올 때마다 출석을 찍는다
 *  - variant="compact": 홈·운세 상세 페이지. 저장한 사람에게만 한 줄로 보인다(출석은 찍지 않는다)
 *
 * localStorage 는 마운트 후에만 읽는다 — 서버 HTML 과 첫 렌더를 같게 해 hydration 을 지킨다.
 */
export default function MyToday({ variant = "full" }: { variant?: "full" | "compact" }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const sync = () => {
      const p = getProfile();
      setProfile(p);
      setStreak(p && variant === "full" ? touchStreak() : getStreak());
      setReady(true);
    };
    sync();
    window.addEventListener(VISITOR_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(VISITOR_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [variant]);

  if (!ready) return variant === "full" ? <div className="h-40" aria-hidden /> : null;

  if (!profile || editing) {
    if (variant === "compact") {
      return (
        <Link
          href={TODAY_PATH}
          className="block rounded-2xl bg-primary/10 px-4 py-3 text-center text-sm font-bold text-primary"
        >
          ☀️ 생일 저장하고 매일 내 오늘의 운세 받기 →
        </Link>
      );
    }
    return (
      <ProfileForm
        initial={profile}
        onSave={(p) => {
          saveProfile(p);
          setEditing(false);
        }}
        onCancel={profile ? () => setEditing(false) : undefined}
      />
    );
  }

  const today = kstToday();
  const tti = profileTti(profile);
  const zodiac = profileZodiac(profile);
  const t = ttiDaily(tti, today);
  const z = zodiacDaily(zodiac, today);
  const ttiInfo = TTI_LIST.find((x) => x.id === tti)!;
  const zInfo = ZODIAC_LIST.find((x) => x.id === zodiac)!;

  if (variant === "compact") {
    return (
      <Link
        href={TODAY_PATH}
        className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-primary/20"
      >
        <span className="text-xl" aria-hidden>
          ☀️
        </span>
        <span className="min-w-0 flex-1 text-sm">
          <span className="font-extrabold">오늘 내 운세</span>{" "}
          <span className="text-foreground/60">
            {ttiInfo.ko}띠 {t.score} · {zInfo.ko} {z.score}
          </span>
        </span>
        {streak && streak.count > 1 && (
          <span className="shrink-0 text-xs font-bold text-primary">🔥 {streak.count}일째</span>
        )}
        <span className="shrink-0 text-sm font-bold text-primary">→</span>
      </Link>
    );
  }

  return (
    <section className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold">내 오늘의 운세</h2>
        <span className="text-xs font-semibold text-foreground/50">{dateLabel(today)}</span>
      </div>
      {streak && (
        <p className="mt-1 text-xs font-bold text-primary">
          🔥 {streak.count}일 연속 확인 중
          {streak.best > streak.count && (
            <span className="font-semibold text-foreground/45"> · 최고 기록 {streak.best}일</span>
          )}
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href={todayTtiPath(tti)} className="rounded-2xl bg-white/80 p-3 text-center transition hover:bg-white">
          <span className="block text-xs font-bold text-foreground/50">
            {ttiInfo.emoji} {ttiInfo.ko}띠
          </span>
          <span className="block text-3xl font-extrabold text-primary">{t.score}</span>
          <span className="text-xs font-bold">
            {dailyEmoji(t.score)} {BAND_LABEL[band(t.score)]}
          </span>
        </Link>
        <Link href={todayZodiacPath(zodiac)} className="rounded-2xl bg-white/80 p-3 text-center transition hover:bg-white">
          <span className="block text-xs font-bold text-foreground/50">
            {zInfo.symbol} {zInfo.ko}
          </span>
          <span className="block text-3xl font-extrabold text-primary">{z.score}</span>
          <span className="text-xs font-bold">
            {dailyEmoji(z.score)} {BAND_LABEL[band(z.score)]}
          </span>
        </Link>
      </div>
      <PushOptIn tti={tti} zodiac={zodiac} />
      <p className="mt-3 text-center text-[11px] text-foreground/45">
        {profile.y}.{profile.m}.{profile.d}생 기준 ·{" "}
        <button type="button" onClick={() => setEditing(true)} className="underline">
          생일 바꾸기
        </button>{" "}
        ·{" "}
        <button type="button" onClick={() => clearProfile()} className="underline">
          지우기
        </button>
      </p>
    </section>
  );
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function ProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Profile | null;
  onSave: (p: Profile) => void;
  onCancel?: () => void;
}) {
  const [y, setY] = useState(initial ? String(initial.y) : "");
  const [m, setM] = useState(initial ? String(initial.m) : "");
  const [d, setD] = useState(initial ? String(initial.d) : "");
  const [early, setEarly] = useState(Boolean(initial?.early));
  const [error, setError] = useState("");
  const maxYear = kstToday().y;
  const years: number[] = [];
  for (let i = maxYear; i >= 1930; i--) years.push(i);
  const cls = "min-w-0 flex-1 rounded-xl border-2 border-foreground/10 bg-white px-2 py-2 text-sm font-semibold";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = { y: Number(y), m: Number(m), d: Number(d), early: Number(m) <= 2 && early };
    const valid = p.y && p.m && p.d && p.d <= new Date(Date.UTC(p.y, p.m, 0)).getUTCDate();
    if (!valid) {
      setError("생년월일을 정확히 골라줘");
      return;
    }
    onSave(p);
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-5 shadow-sm"
    >
      <div>
        <h2 className="text-base font-extrabold">생일 저장하고 매일 내 운세 보기 ☀️</h2>
        <p className="mt-1 text-xs leading-relaxed text-foreground/60">
          한 번만 넣어두면 다음부터 내 띠·별자리 오늘의 운세가 바로 떠. 생일은 이 기기 브라우저에만
          저장되고 서버로 보내지 않아.
        </p>
      </div>
      <div className="flex gap-2">
        <select aria-label="출생연도" value={y} onChange={(e) => setY(e.target.value)} className={cls}>
          <option value="">년</option>
          {years.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select aria-label="생일 월" value={m} onChange={(e) => setM(e.target.value)} className={cls}>
          <option value="">월</option>
          {MONTHS.map((v) => (
            <option key={v} value={v}>
              {v}월
            </option>
          ))}
        </select>
        <select aria-label="생일 일" value={d} onChange={(e) => setD(e.target.value)} className={cls}>
          <option value="">일</option>
          {DAYS.map((v) => (
            <option key={v} value={v}>
              {v}일
            </option>
          ))}
        </select>
      </div>
      {Number(m) >= 1 && Number(m) <= 2 && (
        <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground/60">
          <input type="checkbox" checked={early} onChange={(e) => setEarly(e.target.checked)} className="accent-primary" />
          설날(입춘) 전에 태어났어 — 전년도 띠로 볼게
        </label>
      )}
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-white">
          저장하고 오늘 운세 보기
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-2xl px-4 text-sm font-bold text-foreground/50">
            취소
          </button>
        )}
      </div>
    </form>
  );
}
