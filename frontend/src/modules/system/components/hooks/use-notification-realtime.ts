"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { NOTIFICATION_CHANNEL_NAME } from "@/shares/lib/firebase-messaging";

import { notificationKeys } from "../../constants/query-keys";

/** Tin service worker gửi tới tab: `notification` = có thông báo mới. */
type WorkerMessage = { type?: string };

/**
 * Realtime chuông: service worker (FCM) luôn hiện thông báo của hệ điều hành (Windows: thông báo nổi góc
 * màn hình) và báo tab → tab chỉ làm mới chuông, không hiện toast (tránh báo hai lần). Đồng bộ đã đọc giữa
 * các tab qua BroadcastChannel.
 *
 * @param enabled - Có chuông.
 * @returns Hàm báo các tab khác làm mới.
 */
export function useNotificationRealtime(enabled: boolean) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    const refresh = () => void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    const channel =
      "BroadcastChannel" in window ? new BroadcastChannel(NOTIFICATION_CHANNEL_NAME) : null;
    channel?.addEventListener("message", refresh);
    const onMessage = (event: MessageEvent<WorkerMessage>) => {
      if (event.data?.type === "notification") refresh();
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => {
      channel?.close();
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [enabled, queryClient]);
  return {
    broadcast: () => {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel(NOTIFICATION_CHANNEL_NAME);
        channel.postMessage("read");
        channel.close();
      }
    },
  };
}
