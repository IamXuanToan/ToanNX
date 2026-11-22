/*
 * Service worker thông báo (FCM web push, tin data-only): mỗi tin luôn hiện thông báo của hệ điều hành
 * (Windows: thông báo nổi góc màn hình, lưu trong Action Center), kể cả khi đang mở trang; các tab đang mở
 * chỉ nhận tin để làm mới chuông. Bấm thông báo → điều hướng tab đang mở tới link (không có thì mở tab mới).
 * Không dùng SDK Firebase trong SW (không importScripts từ CDN, không phải nới CSP).
 * Chi tiết: docs/features/web-push.md.
 */

const DEFAULT_TITLE = "ToanNX";
const ICON_PATH = "/brand/logo-mark.png";
const BADGE_PATH = "/icon.png";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function readPayload(event) {
  if (!event.data) return null;

  try {
    const payload = event.data.json();
    const data = payload?.data ?? payload;

    if (!data || typeof data !== "object" || typeof data.notification_id !== "string") {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function resolveLink(link) {
  try {
    const url = new URL(link || "/", self.location.origin);

    if (url.origin !== self.location.origin) {
      return self.location.origin + "/";
    }

    if (!["http:", "https:"].includes(url.protocol)) {
      return self.location.origin + "/";
    }

    return url.href;
  } catch {
    return self.location.origin + "/";
  }
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      const data = readPayload(event);

      if (!data) return;

      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Chuông của mọi tab đang mở tự làm mới; tab không tự hiện toast (tránh báo hai lần).
      for (const client of windows) {
        client.postMessage({ type: "notification", data });
      }

      // Luôn hiện thông báo của hệ điều hành (Windows: thông báo nổi góc màn hình + Action Center),
      // kể cả khi đang xem trang.
      await self.registration.showNotification(data.title || DEFAULT_TITLE, {
        body: data.body || "",
        icon: ICON_PATH,
        badge: BADGE_PATH,
        tag: data.notification_id,
        renotify: true,
        timestamp: Date.now(),
        data: {
          link: resolveLink(data.link),
          notificationId: data.notification_id,
        },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const payload = event.notification.data || {};
      const target = resolveLink(payload.link);

      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const existing = windows.find(
        (client) => new URL(client.url).origin === self.location.origin,
      );

      if (existing) {
        try {
          const navigated = await existing.navigate(target);
          await (navigated || existing).focus();
          return;
        } catch {
          // Thử mở tab mới nếu không thể điều hướng.
        }
      }

      await self.clients.openWindow(target);
    })(),
  );
});
