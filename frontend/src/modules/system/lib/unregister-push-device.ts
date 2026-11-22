import { deletePushToken, getPushToken, isPushSupported } from "@/shares/lib/firebase-messaging";

import { pushDeviceService } from "../services/push-device.service";

/**
 * Gỡ trình duyệt này khỏi danh sách nhận push trước khi đăng xuất (thiết bị dùng chung không nhận thông báo
 * của người đã đăng xuất). Lỗi bỏ qua vì không được chặn đăng xuất.
 */
export async function unregisterPushDevice(): Promise<void> {
  if (!isPushSupported() || Notification.permission !== "granted") return;
  try {
    const token = await getPushToken();
    if (token) await pushDeviceService.unregister(token);
    await deletePushToken();
  } catch {
    // Mạng/Firebase lỗi khi đăng xuất: token cũ sẽ hết hạn và BE tự tắt thiết bị khi FCM báo lỗi.
  }
}
