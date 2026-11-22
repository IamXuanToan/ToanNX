"use client";

import { Bell, BellRing, CheckCheck, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shares/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shares/components/ui/popover";
import { Skeleton } from "@/shares/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/shares/components/ui/tabs";

import { useNotificationBell } from "./hooks/use-notification-bell";
import { NotificationItem } from "./notification-item";

const BADGE_MAX = 99;

/**
 * Chuông thông báo ở header admin: badge tổng chưa đọc, popover 2 tab Cá nhân / Hệ thống, danh sách vô hạn,
 * "Đánh dấu đã đọc tất cả", nút bật thông báo trình duyệt, lối tắt tới cài đặt thông báo trong Hồ sơ.
 *
 * @param props - Mở Hồ sơ → tab Thông báo.
 * @returns Chuông (null khi không có quyền).
 */
export function NotificationBell({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const t = useTranslations("system.notifications.bell");
  const state = useNotificationBell();
  if (!state.canRead) return null;
  const badge = state.total > BADGE_MAX ? `${BADGE_MAX}+` : String(state.total);
  return (
    <Popover open={state.open} onOpenChange={state.setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t("title")}
        >
          <Bell />
          {state.total ? (
            <span className="bg-destructive text-destructive-foreground ring-background absolute -end-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold tabular-nums ring-2">
              {badge}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <p className="text-sm font-semibold">{t("title")}</p>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void state.markAllRead()}
            >
              <CheckCheck />
              {t("markAll")}
            </Button>
            {onOpenSettings ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("settings")}
                onClick={() => {
                  state.setOpen(false);
                  onOpenSettings();
                }}
              >
                <Settings />
              </Button>
            ) : null}
          </div>
        </div>
        {state.push.supported && state.push.permission === "default" ? (
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2 text-xs">
            <span>{t("pushPrompt")}</span>
            <Button
              type="button"
              size="sm"
              onClick={() => void state.push.enable()}
              disabled={state.push.busy}
            >
              <BellRing />
              {t("pushEnable")}
            </Button>
          </div>
        ) : null}
        <Tabs value={state.scope} onValueChange={state.setScope} className="px-3 pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="PERSONAL">
              {t("personal")}
              {state.counts.personal ? ` (${state.counts.personal})` : ""}
            </TabsTrigger>
            <TabsTrigger value="SYSTEM">
              {t("system")}
              {state.counts.system ? ` (${state.counts.system})` : ""}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {state.list.isPending ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : state.items.length ? (
            <ul className="space-y-1">
              {state.items.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onOpen={() => void state.openItem(item)}
                  onHide={() => state.hide(item)}
                />
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground px-3 py-8 text-center text-sm">{t("empty")}</p>
          )}
          {state.list.hasNextPage ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => void state.list.fetchNextPage()}
              disabled={state.list.isFetchingNextPage}
            >
              {t("more")}
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
