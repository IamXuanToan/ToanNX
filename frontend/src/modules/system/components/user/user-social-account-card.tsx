"use client";

import Image from "next/image";
import { Calendar, Hash, Mail, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Badge } from "@/shares/components/ui/badge";

import type { UserConnectedSocial } from "../../types/user.types";

export interface UserSocialAccountCardProps {
  name: string;
  iconSrc: string;
  isDarkInvert?: boolean;
  account?: UserConnectedSocial;
}

/**
 * Thẻ hiển thị chi tiết một tài khoản mạng xã hội (Google, GitHub) của người dùng:
 * Biểu tượng, tên nền tảng, trạng thái liên kết, tên hiển thị, email, UID và ngày liên kết.
 *
 * @param props - Thông số thẻ mạng xã hội.
 * @returns Thẻ mạng xã hội.
 */
export function UserSocialAccountCard({
  name,
  iconSrc,
  isDarkInvert,
  account,
}: UserSocialAccountCardProps) {
  const t = useTranslations("system.account.users");

  return (
    <div className="border-border/60 bg-muted/20 space-y-3 rounded-xl border p-3.5 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-background flex size-7 items-center justify-center rounded-lg border shadow-xs">
            <Image
              src={iconSrc}
              alt={name}
              width={16}
              height={16}
              className={isDarkInvert ? "dark:invert" : undefined}
            />
          </div>
          <span className="text-foreground text-sm font-semibold">{name}</span>
        </div>

        {account ? (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
          >
            {t("fields.linked")}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-[11px] font-normal">
            {t("fields.notLinked")}
          </Badge>
        )}
      </div>

      {account ? (
        <div className="space-y-2 pt-1 text-xs">
          {account.displayName ? (
            <div className="text-foreground flex items-center gap-2 font-medium">
              <UserIcon className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{account.displayName}</span>
            </div>
          ) : null}

          {account.email ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Mail className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{account.email}</span>
            </div>
          ) : null}

          {account.uid ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Hash className="size-3.5 shrink-0" aria-hidden />
              <span className="text-muted-foreground/80 truncate font-mono text-[11px]">
                UID: {account.uid}
              </span>
            </div>
          ) : null}

          {account.createdAt ? (
            <div className="text-muted-foreground flex items-center gap-2 pt-0.5">
              <Calendar className="size-3.5 shrink-0" aria-hidden />
              <span className="text-[11px]">
                <TimestampText value={account.createdAt} />
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs leading-relaxed">{t("fields.notLinked")}</p>
      )}
    </div>
  );
}
