"use client";

import { useState } from "react";

import { useRouter } from "@/i18n/navigation";

import { useHideNotification } from "../../../hooks/use-hide-notification";
import { useMarkAllNotificationsRead } from "../../../hooks/use-mark-all-notifications-read";
import { useMarkNotificationRead } from "../../../hooks/use-mark-notification-read";
import { useNotifications } from "../../../hooks/use-notifications";
import { usePermission } from "../../../hooks/use-permission";
import { useUnreadCount } from "../../../hooks/use-unread-count";
import { NOTIFICATION_PERMISSIONS } from "../../../permissions/notification-permission";
import { PUSH_DEVICE_PERMISSIONS } from "../../../permissions/push-device-permission";
import type { AppNotification, NotificationScope } from "../../../types/notification.types";
import { useNotificationRealtime } from "./use-notification-realtime";
import { usePushRegistration } from "../../push-device/hooks/use-push-registration";

/**
 * State chuông: mở/đóng, tab Cá nhân/Hệ thống, danh sách vô hạn, số chưa đọc (polling dự phòng), realtime
 * qua service worker, bật thông báo trình duyệt.
 *
 * @returns Dữ liệu và handler cho `NotificationBell`.
 */
export function useNotificationBell() {
  const router = useRouter();
  const canRead = usePermission(NOTIFICATION_PERMISSIONS.read);
  const canPush = usePermission(PUSH_DEVICE_PERMISSIONS.create);
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<NotificationScope>("PERSONAL");
  const push = usePushRegistration(canRead && canPush);
  const counts = useUnreadCount(canRead, push.permission === "granted");
  const list = useNotifications(scope, canRead && open);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const hide = useHideNotification();
  const realtime = useNotificationRealtime(canRead);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const total = (counts.data?.personal ?? 0) + (counts.data?.system ?? 0);
  return {
    canRead,
    open,
    setOpen,
    scope,
    setScope: (value: string) => setScope(value as NotificationScope),
    counts: counts.data ?? { personal: 0, system: 0 },
    total,
    list,
    items,
    push,
    openItem: async (item: AppNotification) => {
      if (!item.readAt) {
        await markRead.mutateAsync(item.id);
        realtime.broadcast();
      }
      setOpen(false);
      if (item.link) router.push(item.link as never);
    },
    markAllRead: async () => {
      await markAll.mutateAsync(scope);
      realtime.broadcast();
    },
    hide: (item: AppNotification) => hide.mutate(item.id),
  };
}
