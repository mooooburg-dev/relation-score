"use client";

import Link from "next/link";
import { useState } from "react";
import { ttiInfo, ttiName, ttiOf, yearInfo, YEAR_MIN, type Tti } from "@/lib/tti";

/**
 * 출생연도 → 내 띠 신년운세로 이동.
 * 1~2월생은 설날·입춘 전이면 전년도 띠라 체크박스로 고르게 한다 (tti-finder.tsx 와 같은 규칙).
 * maxYear 는 서버에서 받는다 — 브라우저 시계로 옵션을 만들면 hydration 이 깨질 수 있다.
 */
export default function FortuneFinder({
  year,
  maxYear,
}: {
  year: number;
  maxYear: number;
}) {
  const [birth, setBirth] = useState("");
  const [early, setEarly] = useState(false);

  const years: number[] = [];
  for (let y = maxYear; y >= YEAR_MIN; y--) years.push(y);

  const b = Number(birth);
  const t: Tti | null = birth ? ttiOf(early ? b - 1 : b) : null;
  const info = t ? yearInfo(early ? b - 1 : b) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-2xl border-2 border-foreground/10 bg-background p-3">
        <label htmlFor="fortune-birth" className="sr-only">
          출생연도
        </label>
        <select
          id="fortune-birth"
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border-2 border-foreground/10 bg-white px-2 py-2 text-sm font-semibold"
        >
          <option value="">출생연도</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년생
            </option>
          ))}
        </select>
        <label className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-foreground/60">
          <input
            type="checkbox"
            checked={early}
            onChange={(e) => setEarly(e.target.checked)}
            className="accent-primary"
          />
          설·입춘 전
        </label>
      </div>
      {t && info ? (
        <Link
          href={`/fortune/${year}/${t}`}
          className="block rounded-2xl bg-primary py-4 text-center text-base font-bold text-white shadow-md transition active:scale-[0.98]"
        >
          {ttiInfo(t).emoji} {year}년 {ttiName(t)} 운세 보기 →
          <span className="mt-0.5 block text-xs font-semibold text-white/75">
            {info.ganji} · {info.color}
          </span>
        </Link>
      ) : (
        <p className="rounded-2xl bg-background py-3.5 text-center text-sm font-semibold text-foreground/40">
          출생연도를 골라줘
        </p>
      )}
      <p className="text-[11px] leading-relaxed text-foreground/45">
        1~2월생은 설날(민속)이나 입춘(명리) 전에 태어났다면 전년도 띠야.
      </p>
    </div>
  );
}
