"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { getPushToken, isPushSupported } from "@/shares/lib/firebase-messaging";

import {
  PUSH_DEVICE_SYNC_STORAGE_KEY,
  PUSH_DEVICE_SYNC_TTL_MS,
} from "../../../constants/notification-polling";
import { notificationKeys } from "../../../constants/query-keys";
import { pushDeviceService } from "../../../services/push-device.service";

/** Băm nhanh không lưu raw FCM token vào localStorage (FNV-1a hex). */
function digestSyncPayload(raw: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function wasRecentlySynced(fingerprint: string): boolean {
  try {
    const raw = localStorage.getItem(PUSH_DEVICE_SYNC_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { fp?: unknown; syncedAt?: unknown };
    return (
      parsed.fp === fingerprint &&
      typeof parsed.syncedAt === "number" &&
      Date.now() - parsed.syncedAt < PUSH_DEVICE_SYNC_TTL_MS
    );
  } catch {
    return false;
  }
}

function rememberSynced(fingerprint: string): void {
  try {
    localStorage.setItem(
      PUSH_DEVICE_SYNC_STORAGE_KEY,
      JSON.stringify({ fp: fingerprint, syncedAt: Date.now() }),
    );
  } catch {
    // Bỏ qua nếu bộ nhớ trình duyệt bị khóa.
  }
}

/** Tên thiết bị gọn từ user agent (ví dụ "Chrome · Windows"). */
function deviceLabel(fallbackBrowser: string): string {
  const agent = navigator.userAgent;
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /Chrome\//.test(agent)
      ? "Chrome"
      : /Firefox\//.test(agent)
        ? "Firefox"
        : /Safari\//.test(agent)
          ? "Safari"
          : fallbackBrowser;
  const system = /Windows/.test(agent)
    ? "Windows"
    : /Android/.test(agent)
      ? "Android"
      : /iPhone|iPad/.test(agent)
        ? "iOS"
        : /Mac OS/.test(agent)
          ? "macOS"
          : /Linux/.test(agent)
            ? "Linux"
            : "";
  return system ? `${browser} · ${system}` : browser;
}

/**
 * Bật thông báo trình duyệt: chỉ hỏi quyền khi người dùng bấm (không tự hỏi lúc tải trang); đã cấp quyền thì
 * lấy lại token mỗi lần mở app và gửi lên BE (gia hạn `last_seen_at`).
 *
 * @param enabled - Có quyền đăng ký thiết bị.
 * @returns Trạng thái và hàm bật.
 */
export function usePushRegistration(enabled: boolean) {
  const t = useTranslations("system.notifications.push");
  const queryClient = useQueryClient();
  const supported = enabled && typeof window !== "undefined" && isPushSupported();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    supported ? Notification.permission : "unsupported",
  );
  const [busy, setBusy] = useState(false);
  const inFlightRef = useRef(false);

  const register = async ({ force = false }: { force?: boolean } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const token = await getPushToken();
      if (!token) return;
      const label = deviceLabel(t("browserFallback"));
      const fingerprint = digestSyncPayload(`${token}:${label}`);
      if (!force && wasRecentlySynced(fingerprint)) return;

      await pushDeviceService.register(token, label);
      rememberSynced(fingerprint);
      await queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
    } finally {
      inFlightRef.current = false;
    }
  };
  useEffect(() => {
    if (supported && Notification.permission === "granted") {
      void register({ force: false }).catch(() => undefined);
    }
    // Chỉ kiểm đồng bộ một lần khi mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);
  return {
    supported,
    permission,
    busy,
    enable: async () => {
      if (!supported) return;
      setBusy(true);
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === "granted") await register({ force: true });
      } finally {
        setBusy(false);
      }
    },
  };
}
