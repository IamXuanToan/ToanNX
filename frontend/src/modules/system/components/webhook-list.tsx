"use client";

import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { EmptyState } from "@/shares/components/common/empty-state";
import { FormSection } from "@/shares/components/common/form-section";
import { LoadingState } from "@/shares/components/common/loading-state";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Button } from "@/shares/components/ui/button";
import { useMessage } from "@/shares/hooks/use-message";
import type { MessageKey } from "@/shares/types/navigation.types";

import { useWebhooks } from "../hooks/use-webhooks";

/**
 * Webhook của hệ thống: tên, bên gọi, module, URL đầy đủ (sao chép), cách xác thực, mô tả, các bước cấu hình.
 * URL do BE dựng theo domain backend đang chạy nên đổi site vẫn đúng.
 *
 * @returns Danh sách webhook.
 */
export function WebhookList() {
  const t = useTranslations("system.webhooks");
  const message = useMessage();
  const query = useWebhooks();
  if (query.isPending) return <LoadingState rows={4} />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (!query.data.length) return <EmptyState title={t("empty")} />;
  return (
    <div className="space-y-6">
      {query.data.map((webhook) => (
        <FormSection key={webhook.code} title={`${webhook.name} · ${webhook.provider}`}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge tone="info">{webhook.method}</StatusBadge>
            <StatusBadge>{message(`${webhook.module}.module.name` as MessageKey)}</StatusBadge>
            <code className="bg-muted rounded px-2 py-1 break-all">{webhook.url}</code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(webhook.url);
                toast.success(t("copied"));
              }}
            >
              <Copy />
              {t("copy")}
            </Button>
          </div>
          <p className="text-sm">{webhook.description}</p>
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground font-medium">{t("auth")}: </span>
            {webhook.auth}
          </p>
          {webhook.setup.length ? (
            <div className="text-sm">
              <p className="font-medium">{t("setup")}</p>
              <ol className="list-decimal space-y-1 pl-5">
                {webhook.setup.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </FormSection>
      ))}
    </div>
  );
}
