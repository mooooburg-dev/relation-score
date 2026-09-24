import type { Metadata } from "next";
import Link from "next/link";
import { isAdminConfigured, verifyAdmin } from "@/lib/admin/auth";
import { logoutAction } from "@/lib/admin/actions";
import LoginForm from "./login-form";
import AdminNav from "./nav";

export const metadata: Metadata = {
  title: "어드민",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 여기는 1차 방어선일 뿐이다. page가 layout과 병렬로 렌더될 수 있으므로
  // 실제 데이터 접근은 src/lib/admin/data.ts 안에서 다시 검사한다.
  if (!(await verifyAdmin())) {
    return <LoginForm configured={isAdminConfigured()} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-3">
          <Link href="/admin" className="text-sm font-bold">
            몇점이야?{" "}
            <span className="font-normal text-foreground/40">admin</span>
          </Link>
          <AdminNav />
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-foreground/50 hover:text-primary"
            >
              사이트 →
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg px-2 py-1 text-xs text-foreground/50 hover:bg-black/5"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6">
        {children}
      </main>
    </div>
  );
}
