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

import { useCallbacks } from "../../hooks/use-callbacks";

/**
 * URL callback (OAuth Google, GitHub...) để khai ở bên thứ ba: URL đầy đủ theo origin FE đang dùng (sao chép),
 * đã cấu hình client id chưa, mô tả, các bước khai.
 *
 * @returns Danh sách callback.
 */
export function CallbackList() {
  const t = useTranslations("system.callbacks");
  const message = useMessage();
  const query = useCallbacks();
  if (query.isPending) return <LoadingState rows={4} />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;
  if (!query.data.length) return <EmptyState title={t("empty")} />;
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">{t("originHint")}</p>
      {query.data.map((callback) => (
        <FormSection key={callback.code} title={`${callback.name} · ${callback.provider}`}>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge tone={callback.configured ? "success" : "warning"}>
              {callback.configured ? t("configured") : t("notConfigured")}
            </StatusBadge>
            <StatusBadge>{message(`${callback.module}.module.name` as MessageKey)}</StatusBadge>
            <code className="bg-muted rounded px-2 py-1 break-all">{callback.url}</code>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(callback.url);
                toast.success(t("copied"));
              }}
            >
              <Copy />
              {t("copy")}
            </Button>
          </div>
          <p className="text-sm">{callback.description}</p>
          {callback.setup.length ? (
            <div className="text-sm">
              <p className="font-medium">{t("setup")}</p>
              <ol className="list-decimal space-y-1 pl-5">
                {callback.setup.map((step) => (
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
