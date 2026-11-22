"use client";

import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { Logo } from "@/shares/components/layout/logo";

import { MANAGE_APP_ROUTES } from "../../constants/routes";
import { HEADER_CLASS } from "../../constants/admin-shell";
import { HeaderActions } from "../shell/header-actions";

/** Khung màn chọn module: thanh trên (logo + nút), nội dung căn giữa, không sidebar. */
export function LauncherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-canvas relative flex min-h-svh flex-col">
      {/* Vùng ánh sáng dịu phía trên và lưới chấm trang trí tinh tế */}
      <div
        className="from-primary/[0.04] dark:from-primary/[0.08] pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b via-transparent to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-border)_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-25"
        aria-hidden
      />
      <header className={HEADER_CLASS}>
        <Link href={MANAGE_APP_ROUTES.admin} className="flex h-10 items-center" aria-label="ToanNX">
          <Logo />
        </Link>
        <div className="flex-1" />
        <HeaderActions withAccount />
      </header>
      <main
        className="relative z-10 flex flex-1 items-start justify-center px-4 py-8 sm:px-6 sm:py-12 lg:items-center"
        data-testid="admin-content"
      >
        {children}
      </main>
    </div>
  );
}
