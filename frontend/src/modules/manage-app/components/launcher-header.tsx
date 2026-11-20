"use client";

import { useTranslations } from "next-intl";

import type { AuthUser } from "@/modules/auth/types/auth.types";

/**
 * Phần đầu màn chọn module: hiển thị huy hiệu trạng thái vận hành, lời chào cá nhân hóa và định danh tài khoản.
 *
 * @param props - Tên hiển thị và đối tượng tài khoản người dùng đang đăng nhập.
 * @returns Khối tiêu đề đầu trang cân đối, tinh gọn.
 */
export function LauncherHeader({ displayName, user }: { displayName: string; user?: AuthUser }) {
  const t = useTranslations("manageApp");

  return (
    <div className="flex flex-col items-center space-y-3 text-center">
      {/* Huy hiệu trạng thái vận hành hệ thống cùng phân cấp quyền */}
      <div className="border-border/70 bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-medium shadow-2xs">
        <span className="relative flex size-2 shrink-0">
          <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
          <span className="bg-success relative inline-flex size-2 rounded-full" />
        </span>
        <span className="text-foreground/80 font-medium">{t("statusReady")}</span>
        <span className="text-border" aria-hidden>
          |
        </span>
        <span className="text-primary font-semibold">
          {user?.isSuperuser ? t("superuserBadge") : t("staffBadge")}
        </span>
      </div>

      {/* Lời chào chính và email tài khoản */}
      <div className="space-y-1">
        <h1
          id="launcher-title"
          className="text-foreground text-2xl font-bold tracking-tight text-balance sm:text-3xl"
        >
          {t("welcome", { name: displayName })}
        </h1>
        {user?.email && user.email !== displayName ? (
          <p className="text-muted-foreground font-mono text-xs">{user.email}</p>
        ) : null}
      </div>
    </div>
  );
}
