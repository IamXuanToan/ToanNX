"use client";

import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";

import { FormSection } from "@/shares/components/common/form-section";
import { Badge } from "@/shares/components/ui/badge";
import { isOnline } from "@/shares/lib/presence";

import type { User } from "../types/account.types";

/**
 * Card "Hoạt động" (chỉ ở trang chi tiết): trạng thái trực tuyến, hoạt động gần nhất, đăng nhập gần
 * nhất, ngày tham gia, kèm thông tin xác minh email. Chỉ đọc.
 *
 * @param props - Người dùng.
 * @returns Card hoạt động và xác thực.
 */
export function UserActivitySection({ user }: { user: User }) {
  const t = useTranslations("system.account.users");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const online = isOnline(user.lastSeenAt, now);
  const rows = [
    { label: t("columns.lastSeen"), at: user.lastSeenAt },
    { label: t("columns.lastLogin"), at: user.lastLogin },
    { label: t("fields.dateJoined"), at: user.dateJoined },
  ];

  return (
    <FormSection title={t("sections.activity")}>
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">{t("presence.label")}</dt>
          <dd className="flex items-center gap-2 font-medium">
            <span
              aria-hidden
              className={
                online
                  ? "bg-success size-2 rounded-full"
                  : "bg-muted-foreground/40 size-2 rounded-full"
              }
            />
            {online ? t("presence.online") : t("presence.offline")}
          </dd>
        </div>
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right font-medium">
              {row.at ? (
                <>
                  {format.relativeTime(new Date(row.at), now)}
                  <span className="text-muted-foreground block text-xs font-normal">
                    {format.dateTime(new Date(row.at), { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </>
              ) : (
                "—"
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-border/40 mt-4 border-t pt-3">
        <p className="text-muted-foreground mb-2.5 text-xs font-semibold">
          {t("sections.verification")}
        </p>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Mail className="size-3.5" />
              <span>{t("fields.emailVerified")}</span>
            </span>
            {user.isVerified ? (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[11px] text-emerald-700 dark:text-emerald-400"
              >
                <CheckCircle2 className="size-3" />
                <span>{t("fields.emailVerifiedTrue")}</span>
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[11px] text-amber-700 dark:text-amber-400"
              >
                <AlertCircle className="size-3" />
                <span>{t("fields.emailVerifiedFalse")}</span>
              </Badge>
            )}
          </div>
        </div>
      </div>
    </FormSection>
  );
}
