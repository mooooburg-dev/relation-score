"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
      <h2 className="text-sm font-bold">어드민 화면을 그리다 실패했어</h2>
      <p className="mt-2 break-all text-xs text-foreground/50">
        {error.message}
        {error.digest && ` (${error.digest})`}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
      >
        다시 시도
      </button>
    </div>
  );
}
