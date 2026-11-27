"use client";

import { CircleX, Info, TriangleAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { TimestampText } from "@/shares/components/common/timestamp-text";
import { Button } from "@/shares/components/ui/button";

import type { AppNotification } from "../../types/notification.types";

const ICONS = { INFO: Info, WARNING: TriangleAlert, ERROR: CircleX } as const;
// Mức "Thông tin" dùng màu nhấn chính (dự án không có token `--info`).
const COLORS = {
  INFO: "text-primary",
  WARNING: "text-warning",
  ERROR: "text-destructive",
} as const;

/**
 * Một dòng trong chuông: icon theo mức, tiêu đề (dịch theo `messageKey` nếu có), nội dung 2 dòng, thời gian
 * tương đối, chấm chưa đọc; nút ẩn.
 *
 * @param props - Thông báo, bấm mở, ẩn.
 * @returns Dòng thông báo.
 */
export function NotificationItem({
  item,
  onOpen,
  onHide,
}: {
  item: AppNotification;
  onOpen: () => void;
  onHide: () => void;
}) {
  const t = useTranslations("system.notifications.bell");
  const tAll = useTranslations();
  const Icon = ICONS[item.level];
  // Có bản dịch theo `messageKey` thì dùng, không thì dùng tiêu đề BE dựng sẵn.
  const title =
    item.messageKey && tAll.has(item.messageKey as never)
      ? tAll(item.messageKey as never, item.params as never)
      : item.title;
  return (
    <li className="group hover:bg-muted/60 relative flex gap-3 rounded-lg px-3 py-2">
      <Icon className={`mt-0.5 size-4 shrink-0 ${COLORS[item.level]}`} aria-hidden />
      <Button
        type="button"
        variant="ghost"
        onClick={onOpen}
        className="block h-auto min-w-0 flex-1 justify-start p-0 text-start font-normal whitespace-normal hover:bg-transparent"
      >
        <p className={item.readAt ? "text-sm" : "text-sm font-semibold"}>{title}</p>
        {item.body ? (
          <p className="text-muted-foreground line-clamp-2 text-xs">{item.body}</p>
        ) : null}
        <p className="text-muted-foreground mt-1 text-xs">
          <TimestampText value={item.createdAt} />
        </p>
      </Button>
      {item.readAt ? null : (
        <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" aria-label={t("unread")} />
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 opacity-0 group-hover:opacity-100"
        aria-label={t("hide")}
        onClick={onHide}
      >
        <X />
      </Button>
    </li>
  );
}
