"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/admin", label: "대시보드", exact: true },
  { href: "/admin/analyses", label: "분석 목록", exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {MENU.map((m) => {
        const active = m.exact ? pathname === m.href : pathname.startsWith(m.href);
        return (
          <Link
            key={m.href}
            href={m.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-primary text-white"
                : "text-foreground/60 hover:bg-black/5"
            }`}
          >
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}
