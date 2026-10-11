// 생일 궁합 결과 표시. 훅이 없어 계산기(클라이언트)와 공유 페이지(서버) 양쪽에서 쓴다.
// 본문 JSON 을 import 하지 않는다 — 점수는 규칙에서, 설명은 상세 페이지 링크로 넘긴다.
import Link from "next/link";
import {
  birthdayLabel,
  birthdayMatch,
  yearGapLabel,
  type Birthdate,
} from "@/lib/birthday-match";
import { ttiInfo, ttiName, ttiPairPath, ttiScoreLabel } from "@/lib/tti";
import { zodiacInfo, zodiacName, zodiacPairPath, zodiacScoreLabel } from "@/lib/zodiac";

const fmt = (b: Birthdate) => `${b.y}.${b.m}.${b.d}`;

export function BirthdayResult({ a, b }: { a: Birthdate; b: Birthdate }) {
  const r = birthdayMatch(a, b);
  const emoji = r.score >= 78 ? "🔥" : r.score >= 60 ? "💛" : "💧";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-xs font-bold text-foreground/50">
          {fmt(a)} × {fmt(b)} · {yearGapLabel(a, b)}
        </span>
        <span className="text-6xl font-extrabold leading-none text-primary">
          {r.score}
          <span className="ml-1 text-base text-foreground/50">/ 100</span>
        </span>
        <span className="text-sm font-bold">
          {emoji} {birthdayLabel(r.score)}
        </span>
      </div>

      <Link
        href={ttiPairPath(r.ttiA, r.ttiB)}
        className="flex items-center gap-3 rounded-2xl border-2 border-foreground/10 bg-background p-3 transition hover:border-primary/50"
      >
        <span className="text-2xl leading-none" aria-hidden>
          {ttiInfo(r.ttiA).emoji}
          {ttiInfo(r.ttiB).emoji}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs font-bold text-foreground/50">태어난 해 · 띠 궁합</span>
          <span className="text-sm font-extrabold">
            {ttiName(r.ttiA)} × {ttiName(r.ttiB)}
          </span>
          <span className="text-xs text-foreground/60">{ttiScoreLabel(r.ttiScore)}</span>
        </span>
        <span className="shrink-0 text-lg font-extrabold text-primary">{r.ttiScore}</span>
      </Link>

      <Link
        href={zodiacPairPath(r.zodiacA, r.zodiacB)}
        className="flex items-center gap-3 rounded-2xl border-2 border-foreground/10 bg-background p-3 transition hover:border-primary/50"
      >
        <span className="text-2xl leading-none" aria-hidden>
          {zodiacInfo(r.zodiacA).symbol}
          {zodiacInfo(r.zodiacB).symbol}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs font-bold text-foreground/50">태어난 날 · 별자리 궁합</span>
          <span className="text-sm font-extrabold">
            {zodiacName(r.zodiacA)} × {zodiacName(r.zodiacB)}
          </span>
          <span className="text-xs text-foreground/60">{zodiacScoreLabel(r.zodiacScore)}</span>
        </span>
        <span className="shrink-0 text-lg font-extrabold text-primary">{r.zodiacScore}</span>
      </Link>

      <ul className="flex flex-col gap-1 rounded-2xl bg-background p-3 text-xs leading-relaxed text-foreground/60">
        <li>
          🗓 태어난 요일: {r.weekdayA}요일 × {r.weekdayB}요일
          {r.weekdayA === r.weekdayB ? " — 같은 요일생이야!" : ""}
        </li>
        <li>✨ 종합 점수는 띠 궁합과 별자리 궁합의 평균이야. 카드를 누르면 자세한 풀이로 이동해.</li>
        {(r.ttiAmbiguous[0] || r.ttiAmbiguous[1]) && (
          <li>
            ⚠️ 1~2월생은 설날·입춘 전이면 전년도 띠야. 띠가 다르면{" "}
            <Link href="/tti" className="underline">
              띠 궁합표
            </Link>
            에서 다시 봐.
          </li>
        )}
      </ul>
    </div>
  );
}
