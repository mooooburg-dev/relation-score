"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdUnit from "./AdUnit";

// AdSense 설정 (환경변수 미설정 시 광고 영역 자체를 렌더하지 않음)
const ADS_ON = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
const SLOT_BANNER = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER;
const SLOT_LOADING = process.env.NEXT_PUBLIC_ADSENSE_SLOT_LOADING;
const SHOW_BANNER = ADS_ON && Boolean(SLOT_BANNER);
const SHOW_LOADING_AD = ADS_ON && Boolean(SLOT_LOADING);

// ---- 선택지 상수 ----
const MBTI_LIST = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
];
const GENDERS = ["여자", "남자"];
const BLOODS = ["A형", "B형", "O형", "AB형"];
const RELATIONS = [
  { value: "연인", label: "연인", emoji: "💕" },
  { value: "친구", label: "친구", emoji: "🤝" },
  { value: "직장동료", label: "직장동료", emoji: "💼" },
  { value: "가족", label: "가족", emoji: "👨‍👩‍👧" },
  { value: "소개팅", label: "소개팅", emoji: "☕" },
  { value: "썸", label: "썸", emoji: "🔥" },
];

interface Person {
  mbti: string;
  gender: string;
  age: string;
  blood: string;
}

interface Result {
  score: number;
  tag: string;
  summary: string;
  mbti_score: number;
  comm_score: number;
  emotion_score: number;
  longterm_score: number;
}

const EMPTY_PERSON: Person = {
  mbti: "",
  gender: "",
  age: "",
  blood: "",
};

// ---- 내 정보 로컬 캐싱 ----
const ME_STORAGE_KEY = "relation-score:me";

function loadMe(): Person | null {
  try {
    const raw = localStorage.getItem(ME_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data === "object" && typeof data.mbti === "string") {
      return {
        mbti: data.mbti || "",
        gender: data.gender || "",
        age: data.age || "",
        blood: data.blood || "",
      };
    }
  } catch {
    // localStorage 접근 불가/파싱 실패 시 무시
  }
  return null;
}

function saveMe(p: Person) {
  try {
    localStorage.setItem(ME_STORAGE_KEY, JSON.stringify(p));
  } catch {
    // 저장 실패는 조용히 무시
  }
}

function clearMe() {
  try {
    localStorage.removeItem(ME_STORAGE_KEY);
  } catch {
    // 무시
  }
}

function HomeContent() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [me, setMe] = useState<Person>({ ...EMPTY_PERSON });
  const [other, setOther] = useState<Person>({ ...EMPTY_PERSON });
  const [relation, setRelation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  // 내 정보 수정 시 상태 + 캐시 동시 반영
  const updateMe = useCallback((p: Person) => {
    setMe(p);
    saveMe(p);
  }, []);

  // 내 정보만 초기화
  const resetMe = useCallback(() => {
    clearMe();
    setMe({ ...EMPTY_PERSON });
    showToast("내 정보 초기화했어 🧹");
  }, [showToast]);

  const analyze = useCallback(async (m: Person, o: Person, rel: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    setStep(3);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          myMbti: m.mbti,
          myGender: m.gender,
          myAge: m.age,
          myBlood: m.blood,
          otherMbti: o.mbti,
          otherGender: o.gender,
          otherAge: o.age,
          otherBlood: o.blood,
          relation: rel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분석 실패");
      setResult(data as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  // URL 파라미터로 들어오면 자동 분석
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const mm = searchParams.get("mm");
    const om = searchParams.get("om");
    const rel = searchParams.get("rel");
    if (mm && om && rel) {
      const m: Person = {
        mbti: mm,
        gender: searchParams.get("mg") || "",
        age: searchParams.get("ma") || "",
        blood: searchParams.get("mb") || "",
      };
      const o: Person = {
        mbti: om,
        gender: searchParams.get("og") || "",
        age: searchParams.get("oa") || "",
        blood: searchParams.get("ob") || "",
      };
      setMe(m);
      setOther(o);
      setRelation(rel);
      analyze(m, o, rel);
      return;
    }
    // 공유 링크가 아니면 캐시된 내 정보 복원
    const saved = loadMe();
    if (saved) setMe(saved);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 스텝1 고정 배너가 푸터를 가리지 않도록 body 하단 여백 확보
  useEffect(() => {
    const show = step === 1 && SHOW_BANNER;
    document.body.style.paddingBottom = show ? "84px" : "";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [step]);

  const buildShareUrl = () => {
    const p = new URLSearchParams({
      mm: me.mbti,
      mg: me.gender,
      ma: me.age,
      mb: me.blood,
      om: other.mbti,
      og: other.gender,
      oa: other.age,
      ob: other.blood,
      rel: relation,
    });
    // 빈 값 제거
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `${window.location.origin}${window.location.pathname}?${p.toString()}`;
  };

  const handleShare = async () => {
    const url = buildShareUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title: "몇점이야?",
          text: "우리 궁합 점수 보러와",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast("링크 복사 완료! 친구한테 보내봐 📋");
    } catch {
      showToast("복사 실패ㅠ 직접 주소창을 확인해줘");
    }
  };

  const reset = () => {
    setStep(1);
    // 내 정보는 캐시에서 복원, 상대방·관계만 초기화
    setMe(loadMe() ?? { ...EMPTY_PERSON });
    setOther({ ...EMPTY_PERSON });
    setRelation("");
    setResult(null);
    setError("");
    window.history.replaceState(null, "", window.location.pathname);
  };

  return (
    <main
      className={`mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-5 pt-8 ${
        step === 1 && SHOW_BANNER ? "pb-24" : "pb-12"
      }`}
    >
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">
          몇점이야? 🔮
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          MBTI로 보는 우리 사이 궁합 점수
        </p>
      </header>

      {step === 1 && (
        <StepInput
          me={me}
          other={other}
          setMe={updateMe}
          setOther={setOther}
          onResetMe={resetMe}
          relation={relation}
          setRelation={setRelation}
          onSubmit={() => analyze(me, other, relation)}
        />
      )}

      {step === 3 && (
        <StepResult
          loading={loading}
          result={result}
          error={error}
          relation={relation}
          onShare={handleShare}
          onReset={reset}
          onRetry={() => analyze(me, other, relation)}
        />
      )}

      {step === 1 && SHOW_BANNER && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-[480px] flex-col items-center border-t border-foreground/10 bg-white/95 px-3 pb-2 pt-1 backdrop-blur">
          <p className="text-center text-[10px] leading-none text-foreground/30">
            광고
          </p>
          <AdUnit slot={SLOT_BANNER} fixedWidth={320} fixedHeight={50} />
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-24 mx-auto w-fit rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}

// ---- STEP 1: 정보 입력 + 관계 선택 ----
function StepInput({
  me,
  other,
  setMe,
  setOther,
  onResetMe,
  relation,
  setRelation,
  onSubmit,
}: {
  me: Person;
  other: Person;
  setMe: (p: Person) => void;
  setOther: (p: Person) => void;
  onResetMe: () => void;
  relation: string;
  setRelation: (v: string) => void;
  onSubmit: () => void;
}) {
  const meFilled = me.mbti || me.gender || me.age || me.blood;
  const canSubmit = me.mbti && other.mbti && relation;
  const hint = !me.mbti || !other.mbti ? "MBTI를 골라줘" : "관계를 골라줘";
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <PersonCard
          title="나 🙋"
          person={me}
          onChange={setMe}
          onReset={meFilled ? onResetMe : undefined}
        />
        <PersonCard title="상대방 👀" person={other} onChange={setOther} />
      </div>

      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-bold">둘은 어떤 사이야?</h2>
        <div className="grid grid-cols-3 gap-2">
          {RELATIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRelation(r.value)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 transition active:scale-[0.97] ${
                relation === r.value
                  ? "border-primary bg-primary/10"
                  : "border-foreground/10 bg-background"
              }`}
            >
              <span className="text-2xl">{r.emoji}</span>
              <span className="text-xs font-semibold leading-tight">
                {r.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <button
        disabled={!canSubmit}
        onClick={onSubmit}
        className="rounded-2xl bg-primary py-4 text-base font-bold text-white shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {canSubmit ? "결과 보기 🔮" : hint}
      </button>
    </div>
  );
}

function PersonCard({
  title,
  person,
  onChange,
  onReset,
}: {
  title: string;
  person: Person;
  onChange: (p: Person) => void;
  onReset?: () => void;
}) {
  const set = (key: keyof Person, value: string) =>
    onChange({ ...person, [key]: value });

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-1">
        <h2 className="text-base font-bold">{title}</h2>
        {onReset && (
          <button
            onClick={onReset}
            className="text-xs font-semibold text-foreground/40 underline-offset-2 hover:text-primary hover:underline"
          >
            초기화
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <Field label="MBTI" required>
          <Select
            value={person.mbti}
            onChange={(v) => set("mbti", v)}
            placeholder="선택"
            options={MBTI_LIST}
          />
        </Field>
        <Field label="성별">
          <Select
            value={person.gender}
            onChange={(v) => set("gender", v)}
            placeholder="선택"
            options={GENDERS}
          />
        </Field>
        <Field label="나이">
          <input
            type="number"
            inputMode="numeric"
            value={person.age}
            onChange={(e) => set("age", e.target.value)}
            placeholder="나이"
            className="w-full rounded-xl border border-foreground/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="혈액형">
          <Select
            value={person.blood}
            onChange={(v) => set("blood", v)}
            placeholder="선택"
            options={BLOODS}
          />
        </Field>
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-foreground/60">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full appearance-none rounded-xl border border-foreground/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary ${
        value ? "text-foreground" : "text-foreground/40"
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o} className="text-foreground">
          {o}
        </option>
      ))}
    </select>
  );
}

// ---- STEP 2: 결과 ----
function StepResult({
  loading,
  result,
  error,
  relation,
  onShare,
  onReset,
  onRetry,
}: {
  loading: boolean;
  result: Result | null;
  error: string;
  relation: string;
  onShare: () => void;
  onReset: () => void;
  onRetry: () => void;
}) {
  if (loading) return <ResultSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">😵</p>
        <p className="text-sm text-foreground/70">{error}</p>
        <div className="flex w-full gap-3">
          <button
            onClick={onReset}
            className="flex-1 rounded-2xl border-2 border-foreground/10 py-3 text-sm font-bold text-foreground/70"
          >
            처음으로
          </button>
          <button
            onClick={onRetry}
            className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-white"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {relation} 궁합
        </span>
        <ScoreRing score={result.score} />
        <h2 className="text-center text-xl font-extrabold leading-snug">
          {result.tag}
        </h2>
        <p className="text-center text-sm leading-relaxed text-foreground/70">
          {result.summary}
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <ScoreBar label="MBTI 궁합" value={result.mbti_score} delay={150} />
        <ScoreBar label="소통 스타일" value={result.comm_score} delay={300} />
        <ScoreBar label="감성 케미" value={result.emotion_score} delay={450} />
        <ScoreBar label="장기 관계" value={result.longterm_score} delay={600} />
      </section>

      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="rounded-2xl border-2 border-foreground/10 px-6 py-4 text-base font-bold text-foreground/70 transition active:scale-[0.98]"
        >
          다시하기
        </button>
        <button
          onClick={onShare}
          className="flex-1 rounded-2xl bg-primary py-4 text-base font-bold text-white shadow-md transition active:scale-[0.98]"
        >
          결과 공유하기 🔗
        </button>
      </div>
    </div>
  );
}

// 0 → target 카운트업 (easeOutCubic), 선택적 지연
function useCountUp(target: number, duration = 1100, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(target * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return value;
}

function ScoreRing({ score }: { score: number }) {
  const r = 78;
  const circ = 2 * Math.PI * r;
  const safe = Math.min(Math.max(score, 0), 100);
  const animated = useCountUp(safe, 1200);
  const offset = circ * (1 - animated / 100);
  return (
    <div className="relative h-48 w-48">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-primary/15"
        />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="text-primary"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold text-primary">
          {Math.round(animated)}
        </span>
        <span className="text-xs font-semibold text-foreground/50">/ 100</span>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: number;
  delay?: number;
}) {
  const v = Math.min(Math.max(value, 0), 100);
  const animated = useCountUp(v, 1000, delay);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground/70">{label}</span>
        <span className="font-bold text-primary">{Math.round(animated)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${animated}%` }}
        />
      </div>
    </div>
  );
}

// ---- 로딩 (분석중) ----
function ResultSkeleton() {
  const pulse = { animation: "skeleton-pulse 1.4s ease-in-out infinite" };
  const r = 78;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <div className="h-6 w-20 rounded-full bg-primary/15" style={pulse} />
        {/* 회전하는 분석 링 */}
        <div className="relative h-48 w-48">
          <svg
            className="h-full w-full animate-spin"
            style={{ animationDuration: "1.2s" }}
            viewBox="0 0 180 180"
          >
            <circle
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              className="text-primary/10"
            />
            <circle
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${circ * 0.28} ${circ}`}
              className="text-primary/60"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            🔮
          </div>
        </div>
        <div className="h-6 w-48 rounded-lg bg-primary/15" style={pulse} />
        <div className="h-4 w-full rounded bg-primary/10" style={pulse} />
        <div className="h-4 w-3/4 rounded bg-primary/10" style={pulse} />
      </section>
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-4 w-24 rounded bg-primary/15" style={pulse} />
            <div
              className="h-2.5 w-full rounded-full bg-primary/10"
              style={pulse}
            />
          </div>
        ))}
      </section>
      {SHOW_LOADING_AD && (
        <section className="flex flex-col items-center rounded-3xl bg-white p-4 shadow-sm">
          <p className="mb-1 text-center text-[10px] leading-none text-foreground/30">
            광고
          </p>
          <AdUnit slot={SLOT_LOADING} fixedWidth={300} fixedHeight={250} />
        </section>
      )}
      <div className="flex items-center justify-center gap-2 text-sm text-foreground/50">
        <span>AI가 둘 사이를 캐는 중</span>
        <span className="inline-flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60"
              style={{
                animation: "skeleton-pulse 1s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </span>
        <span>🕵️</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
