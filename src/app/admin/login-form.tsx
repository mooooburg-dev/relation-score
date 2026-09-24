"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/admin/actions";

const initial: LoginState = {};

export default function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-[320px] rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-lg font-bold">몇점이야? 어드민</h1>
        <p className="mt-1 text-xs text-foreground/50">
          {configured
            ? "관리자 비밀번호를 입력해줘."
            : "서버에 ADMIN_PASSWORD가 설정되지 않았어."}
        </p>
        <form action={action} className="mt-5 flex flex-col gap-3">
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            disabled={!configured}
            placeholder="••••••••"
            className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
          />
          {state.error && (
            <p className="text-xs font-medium text-red-500">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending || !configured}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "확인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
