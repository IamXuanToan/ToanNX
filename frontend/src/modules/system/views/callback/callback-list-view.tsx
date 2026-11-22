"use client";

import { useTranslations } from "next-intl";

import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { CallbackList } from "../../components/callback/callback-list";
import { usePermission } from "../../hooks/use-permission";
import { CALLBACK_PERMISSIONS } from "../../permissions/callback-permission";

/** Trang Hệ thống → Callback. */
export function CallbackListView() {
  const t = useTranslations("system.callbacks");
  if (!usePermission(CALLBACK_PERMISSIONS.read)) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <CallbackList />
    </div>
  );
}
