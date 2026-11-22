"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getPushToken, isPushSupported } from "@/shares/lib/firebase-messaging";

import { notificationKeys } from "../../constants/query-keys";
import { pushDeviceService } from "../../services/push-device.service";

/** Tên thiết bị gọn từ user agent (ví dụ "Chrome · Windows"). */
function deviceLabel(): string {
  const agent = navigator.userAgent;
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /Chrome\//.test(agent)
      ? "Chrome"
      : /Firefox\//.test(agent)
        ? "Firefox"
        : /Safari\//.test(agent)
          ? "Safari"
          : "Trình duyệt";
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
  const queryClient = useQueryClient();
  const supported = enabled && typeof window !== "undefined" && isPushSupported();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    supported ? Notification.permission : "unsupported",
  );
  const [busy, setBusy] = useState(false);
  const register = async () => {
    const token = await getPushToken();
    if (!token) return;
    await pushDeviceService.register(token, deviceLabel());
    await queryClient.invalidateQueries({ queryKey: notificationKeys.devices() });
  };
  useEffect(() => {
    if (supported && Notification.permission === "granted") void register().catch(() => undefined);
    // Chỉ chạy một lần khi mở app.
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
        if (result === "granted") await register();
      } finally {
        setBusy(false);
      }
    },
  };
}
