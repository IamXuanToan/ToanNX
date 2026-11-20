"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";

import { FormSection } from "@/shares/components/common/form-section";
import { isOnline } from "@/shares/lib/presence";

import type { User } from "../types/account.types";

/**
 * Card "Hoạt động" (chỉ ở trang chi tiết): đang trực tuyến hay không, hoạt động gần nhất, đăng nhập gần
 * nhất, ngày tham gia. Chỉ đọc.
 *
 * @param props - Người dùng.
 * @returns Card hoạt động.
 */
export function UserActivitySection({ user }: { user: User }) {
  const t = useTranslations("account.users");
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
    </FormSection>
  );
}
