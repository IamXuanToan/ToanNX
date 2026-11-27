"use client";

import { Copy, KeyRound, Plug, RefreshCcw, Trash2 } from "lucide-react";
import { useFormatter, useLocale, useNow, useTranslations } from "next-intl";

import { FormSection } from "@/shares/components/common/form-section";
import { PasswordInput } from "@/shares/components/common/password-input";
import { StatusBadge } from "@/shares/components/common/status-badge";
import { SwitchField } from "@/shares/components/common/switch-field";
import { ErrorState } from "@/shares/components/errors/error-state";
import { Button } from "@/shares/components/ui/button";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { formatDateTimeWithRelative } from "@/shares/lib/date-time-format";

import { useSepayConnection } from "./hooks/use-sepay-connection";

const SETUP_STEPS = ["1", "2", "3", "4"] as const;

/**
 * Kết nối SePay của chính mình: token API (chỉ ghi), URL webhook riêng + secret (sao chép, tạo mới), các
 * bước cấu hình ở my.sepay.vn, bật/tắt, xóa.
 *
 * @returns Section kết nối.
 */
export function SepayConnection() {
  const t = useTranslations("finance.sepay");
  const format = useFormatter();
  const locale = useLocale();
  const now = useNow({ updateInterval: 60_000 });
  const state = useSepayConnection();
  if (state.status.isPending) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (state.status.isError) return <ErrorState onRetry={() => state.status.refetch()} />;
  const status = state.status.data;
  return (
    <div className="space-y-6">
      <FormSection
        title={t("token.title")}
        headerAction={
          <StatusBadge tone={status.connected ? "success" : "warning"}>
            {status.connected ? t("connected", { last4: status.tokenLast4 }) : t("notConnected")}
          </StatusBadge>
        }
      >
        <p className="text-muted-foreground text-sm">
          {t("token.hint", { env: status.environment })}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <PasswordInput
            value={state.token}
            onChange={(event) => state.setToken(event.target.value)}
            autoComplete="off"
            placeholder={t("token.placeholder")}
          />
          <Button
            type="button"
            onClick={() => void state.saveToken()}
            disabled={!state.token.trim() || state.isSaving}
          >
            <KeyRound />
            {t("token.save")}
          </Button>
          {status.connected ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void state.test()}
              disabled={state.isTesting}
            >
              <Plug />
              {t("token.test")}
            </Button>
          ) : null}
        </div>
        {status.lastError ? (
          <p className="text-destructive text-sm">{t("lastError", { code: status.lastError })}</p>
        ) : null}
      </FormSection>
      {status.webhookUrl ? (
        <FormSection title={t("webhook.title")}>
          {[
            { label: t("webhook.url"), value: status.webhookUrl },
            { label: t("webhook.secret"), value: status.webhookSecret },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <p className="text-sm font-medium">{item.label}</p>
              <div className="flex items-center gap-2">
                <code className="bg-muted min-w-0 flex-1 truncate rounded px-2 py-2 text-sm">
                  {item.value}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={t("copy")}
                  onClick={() => state.copy(item.value)}
                >
                  <Copy />
                </Button>
              </div>
            </div>
          ))}
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {SETUP_STEPS.map((step) => (
              <li key={step}>{t(`webhook.steps.${step}`)}</li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SwitchField
              label={t("active")}
              checked={status.isActive}
              onCheckedChange={state.setActive}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={state.rotate}>
                <RefreshCcw />
                {t("webhook.rotate")}
              </Button>
              <Button type="button" variant="outline" onClick={state.remove}>
                <Trash2 />
                {t("remove")}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-xs tabular-nums">
            {t("lastWebhook", {
              at: status.lastWebhookAt
                ? formatDateTimeWithRelative(status.lastWebhookAt, {
                    now,
                    locale,
                    relativeFormatter: (date, baseNow) => format.relativeTime(date, baseNow),
                  })
                : "—",
            })}
          </p>
        </FormSection>
      ) : null}
    </div>
  );
}
