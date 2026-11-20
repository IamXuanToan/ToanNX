"use client";

import { useFormatter, useTranslations } from "next-intl";

import type { AuthUser } from "@/modules/system/types/auth.types";

/**
 * Thanh trạng thái hệ thống ở chân màn chọn module: hiển thị trạng thái vận hành và thời điểm đăng nhập gần nhất.
 *
 * @param props - Thông tin tài khoản người dùng đang đăng nhập.
 * @returns Khối trạng thái hệ thống gọn gàng.
 */
export function LauncherFooter({ user }: { user?: AuthUser }) {
  const t = useTranslations("manageApp");
  const format = useFormatter();

  const formattedLastLogin = user?.lastLogin
    ? format.dateTime(new Date(user.lastLogin), {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <footer className="text-muted-foreground flex flex-col items-center justify-between gap-3 px-2 pt-2 text-xs sm:flex-row">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2 shrink-0">
          <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
          <span className="bg-success relative inline-flex size-2 rounded-full" />
        </span>
        <span className="text-foreground/80 font-medium">{t("systemOnline")}</span>
      </div>

      {formattedLastLogin ? (
        <p className="text-muted-foreground text-xs">
          {t("lastLogin", { time: formattedLastLogin })}
        </p>
      ) : null}
    </footer>
  );
}
