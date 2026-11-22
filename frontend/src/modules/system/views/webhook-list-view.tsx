"use client";

import { useTranslations } from "next-intl";

import { PageHeader } from "@/shares/components/common/page-header";
import { ForbiddenView } from "@/shares/components/errors/forbidden-view";

import { WebhookList } from "../components/webhook-list";
import { usePermission } from "../hooks/use-permission";
import { WEBHOOK_PERMISSIONS } from "../permissions/webhook-permission";

/** Trang Hệ thống → Webhook. */
export function WebhookListView() {
  const t = useTranslations("system.webhooks");
  if (!usePermission(WEBHOOK_PERMISSIONS.read)) return <ForbiddenView />;
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <WebhookList />
    </div>
  );
}
