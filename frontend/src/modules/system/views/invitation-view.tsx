"use client";

import { useTranslations } from "next-intl";

import type { AppPathname } from "@/i18n/routing";

import { AuthShell } from "../components/auth-shell";
import { InvitationForm } from "../components/invitation-form";

/**
 * Màn hình chấp nhận lời mời và kích hoạt tài khoản lần đầu.
 *
 * @param props - Trang chủ để quay về khi cần.
 * @returns Giao diện AuthShell kèm form kích hoạt.
 */
export function InvitationView({ homeHref }: { homeHref: AppPathname }) {
  const t = useTranslations("system.auth.invitation");

  return (
    <AuthShell homeHref={homeHref} title={t("pageTitle")} description={t("pageDescription")}>
      <InvitationForm />
    </AuthShell>
  );
}
