"use client";

import { useState } from "react";
import {
  birthdaySharePath,
  isValidBirthdate,
  type Birthdate,
} from "@/lib/birthday-match";
import { BirthdayResult } from "@/components/birthday-result";
import ShareButton from "@/components/share-button";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

interface Input {
  y: string;
  m: string;
  d: string;
}

function toDate(v: Input): Birthdate {
  return { y: Number(v.y), m: Number(v.m), d: Number(v.d) };
}

/**
 * 생일 궁합 계산기. 계산은 브라우저에서 — 생년월일은 서버로 가지 않는다.
 * maxYear 는 서버에서 받는다(브라우저 시계로 옵션을 만들면 hydration 이 어긋날 수 있다).
 */
export default function BirthdayMatchApp({ maxYear }: { maxYear: number }) {
  const [a, setA] = useState<Input>({ y: "", m: "", d: "" });
  const [b, setB] = useState<Input>({ y: "", m: "", d: "" });
  const [shown, setShown] = useState<[Birthdate, Birthdate] | null>(null);
  const [error, setError] = useState("");

  const years: number[] = [];
  for (let y = maxYear; y >= 1940; y--) years.push(y);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const da = toDate(a);
    const db = toDate(b);
    if (!isValidBirthdate(da, maxYear) || !isValidBirthdate(db, maxYear)) {
      setError("두 사람의 생년월일을 정확히 골라줘 (없는 날짜는 안 돼)");
      setShown(null);
      return;
    }
    setError("");
    setShown([da, db]);
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <DateInput label="나" value={a} onChange={setA} years={years} />
        <DateInput label="상대" value={b} onChange={setB} years={years} />
        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
        <button
          type="submit"
          className="rounded-2xl bg-primary py-3.5 text-base font-bold text-white shadow-md transition active:scale-[0.98]"
        >
          생일 궁합 보기 🎂
        </button>
      </form>

      {shown && (
        <div className="flex flex-col gap-3 rounded-3xl border-2 border-primary/20 bg-white p-4">
          <BirthdayResult a={shown[0]} b={shown[1]} />
          <ShareButton path={birthdaySharePath(shown[0], shown[1])} title="우리 생일 궁합" />
        </div>
      )}
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
  years,
}: {
  label: string;
  value: Input;
  onChange: (v: Input) => void;
  years: number[];
}) {
  const cls =
    "min-w-0 flex-1 rounded-xl border-2 border-foreground/10 bg-white px-2 py-2 text-sm font-semibold";
  return (
    <fieldset className="flex items-center gap-2 rounded-2xl border-2 border-foreground/10 bg-background p-3">
      <legend className="sr-only">{label} 생년월일</legend>
      <span className="w-8 shrink-0 text-sm font-extrabold">{label}</span>
      <select aria-label={`${label} 출생연도`} value={value.y} onChange={(e) => onChange({ ...value, y: e.target.value })} className={cls}>
        <option value="">년</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select aria-label={`${label} 생일 월`} value={value.m} onChange={(e) => onChange({ ...value, m: e.target.value })} className={cls}>
        <option value="">월</option>
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            {m}월
          </option>
        ))}
      </select>
      <select aria-label={`${label} 생일 일`} value={value.d} onChange={(e) => onChange({ ...value, d: e.target.value })} className={cls}>
        <option value="">일</option>
        {DAYS.map((d) => (
          <option key={d} value={d}>
            {d}일
          </option>
        ))}
      </select>
    </fieldset>
  );
}
