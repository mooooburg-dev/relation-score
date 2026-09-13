import Link from "next/link";
import {
  MBTI_LIST,
  RELATIONS,
  SITE_URL,
  scoreEmoji,
  scoreLabel,
  typePath,
  type Faq,
  type Mbti,
} from "@/lib/mbti";
import AdUnit from "@/app/AdUnit";

const ADS_ON = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
const SLOT_ARTICLE = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE;

/** JSON-LD 스크립트 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

export function faqLd(faq: Faq[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** 상단 간단 네비 (홈 링크 + 브레드크럼) */
export function Breadcrumb({ items }: { items: { name: string; path?: string }[] }) {
  return (
    <nav aria-label="breadcrumb" className="mb-4 text-xs text-foreground/50">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:text-primary">
            몇점이야?
          </Link>
        </li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            <span aria-hidden>›</span>
            {it.path ? (
              <Link href={it.path} className="hover:text-primary">
                {it.name}
              </Link>
            ) : (
              <span className="text-foreground/80">{it.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl bg-white p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg font-extrabold tracking-tight">{children}</h2>;
}

/** 점수 막대 */
export function ScoreBar({
  label,
  score,
  emoji,
}: {
  label: string;
  score: number;
  emoji?: string;
}) {
  const safe = Math.min(Math.max(score, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-sm font-semibold">
        {emoji ? `${emoji} ` : ""}
        {label}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${safe}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-bold text-primary">
        {safe}
      </span>
    </div>
  );
}

/** 큰 점수 표시 */
export function BigScore({ score, caption }: { score: number; caption?: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-1">
        <span className="text-6xl font-extrabold leading-none text-primary">
          {score}
        </span>
        <span className="mb-1 text-sm font-semibold text-foreground/50">/ 100</span>
      </div>
      <span className="text-sm font-bold">
        {scoreEmoji(score)} {caption ?? scoreLabel(score)}
      </span>
    </div>
  );
}

export function FaqList({ faq }: { faq: Faq[] }) {
  return (
    <dl className="flex flex-col gap-4">
      {faq.map((f, i) => (
        <div key={i}>
          <dt className="font-bold">Q. {f.q}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-foreground/80">{f.a}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 16개 유형 링크 그리드 */
export function TypeGrid({ current, base = "" }: { current?: Mbti; base?: string }) {
  return (
    <ul className="grid grid-cols-4 gap-2">
      {MBTI_LIST.map((t) => (
        <li key={t}>
          <Link
            href={base ? `${base}${t.toLowerCase()}` : typePath(t)}
            className={`block rounded-xl border-2 py-2 text-center text-sm font-bold transition ${
              t === current
                ? "border-primary bg-primary/10 text-primary"
                : "border-foreground/10 bg-background hover:border-primary/50"
            }`}
          >
            {t}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 정밀 분석 CTA (기존 앱의 URL 프리필 기능 사용) */
export function AnalyzeCta({
  a,
  b,
  relation,
}: {
  a?: Mbti;
  b?: Mbti;
  relation?: string;
}) {
  const p = new URLSearchParams();
  if (a) p.set("mm", a);
  if (b) p.set("om", b);
  if (relation) p.set("rel", relation);
  const href = p.size ? `/?${p.toString()}` : "/";
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-primary py-4 text-center text-base font-bold text-white shadow-md transition active:scale-[0.98]"
    >
      나이·혈액형까지 넣고 AI 정밀 분석 받기 🔮
    </Link>
  );
}

export function RelationChips({
  active,
  hrefFor,
}: {
  active?: string;
  hrefFor: (rel: string) => string;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {RELATIONS.map((r) => (
        <li key={r.value}>
          <Link
            href={hrefFor(r.value)}
            className={`inline-block rounded-full border-2 px-3 py-1 text-xs font-bold ${
              active === r.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-foreground/10 bg-background"
            }`}
          >
            {r.emoji} {r.value}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 본문 중간 광고 (슬롯 미설정 시 렌더 안 함) */
export function ArticleAd() {
  if (!ADS_ON || !SLOT_ARTICLE) return null;
  return (
    <div className="my-2 flex flex-col items-center">
      <p className="text-[10px] leading-none text-foreground/30">광고</p>
      <AdUnit slot={SLOT_ARTICLE} className="w-full" />
    </div>
  );
}
