import { env } from "@/shares/config/env";

/** Đường dẫn service worker tự viết (xử lý `push`, không cần SDK Firebase trong SW). */
export const NOTIFICATION_SW_PATH = "/notification-sw.js";
/** Kênh đồng bộ đã đọc giữa các tab. */
export const NOTIFICATION_CHANNEL_NAME = "notifications";

/** @returns Đã cấu hình Firebase và trình duyệt hỗ trợ Notification + Service Worker + Push. */
export function isPushSupported(): boolean {
  return (
    Boolean(env.firebaseProjectId && env.firebaseVapidKey && env.firebaseApiKey) &&
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Đăng ký service worker rồi lấy token FCM (tải lười SDK Firebase chỉ khi cần).
 *
 * @returns Token FCM, hoặc null khi không hỗ trợ / chưa cấp quyền.
 */
export async function getPushToken(): Promise<string | null> {
  if (!isPushSupported() || Notification.permission !== "granted") return null;
  const [{ initializeApp, getApps }, { getMessaging, getToken }] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ]);
  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: env.firebaseApiKey,
      projectId: env.firebaseProjectId,
      messagingSenderId: env.firebaseMessagingSenderId,
      appId: env.firebaseAppId,
    });
  const registration = await navigator.serviceWorker.register(NOTIFICATION_SW_PATH);
  return getToken(getMessaging(app), {
    vapidKey: env.firebaseVapidKey,
    serviceWorkerRegistration: registration,
  });
}

/** Xóa token FCM của trình duyệt này (đăng xuất). */
export async function deletePushToken(): Promise<void> {
  if (!isPushSupported()) return;
  const [{ getApps }, { getMessaging, deleteToken }] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ]);
  const app = getApps()[0];
  if (app) await deleteToken(getMessaging(app));
}
