# Thông báo đẩy trên trình duyệt (Web Push)

## Chức năng

Thông báo kênh `PUSH` hiện như Facebook:

| Tình huống | Hiển thị |
| --- | --- |
| Đang nhìn trang (tab toannx.com được **focus**) | **Thông báo của hệ điều hành** (Windows: thông báo nổi góc phải dưới, lưu ở Action Center) + chuông làm mới; không có toast trong trang (tránh báo hai lần) |
| Trình duyệt mở nhưng nằm sau cửa sổ khác / thu nhỏ / đang ở tab khác | **Popup của hệ điều hành** nổi ngoài trình duyệt (góc màn hình) + chuông các tab làm mới |
| Đã đóng hết tab (trình duyệt còn chạy) | Popup của hệ điều hành |

Bấm popup → focus tab toannx.com đang mở và điều hướng tới link thông báo; không còn tab thì mở tab mới.

## Luồng

1. Người dùng bật ở Hồ sơ → Thông báo (`PushDeviceCard`): `Notification.requestPermission()` (bắt buộc từ thao
   tác bấm) → `getPushToken()` đăng ký `/notification-sw.js` và lấy token FCM → `POST` push device.
2. Có sự kiện → `NotificationService.notify` chỉ ghi outbox (bản gửi kênh PUSH, `PENDING`) trong transaction →
   sau commit đá `NotificationKickService` → QStash gọi `POST /system/notifications/dispatch` ở lượt function riêng
   (vài giây sau; không có QStash thì đợi cron) → `FcmClient.send` gửi **tin data-only** (`title`, `body`, `link`,
   `level`, `notification_id`) kèm `Urgency: high`. Request gốc (ví dụ đăng nhập) không chờ FCM.
   Làm mới access token Google và gửi đều có timeout 3 giây; lỗi mạng là lỗi tạm, thử lại theo lùi dần.
3. `public/notification-sw.js` nhận `push`:
   - gửi `postMessage({ type: "notification", data })` tới mọi tab để làm mới chuông;
   - **luôn** gọi `showNotification`, kể cả khi đang xem trang: tiêu đề `ToanNX · <tiêu đề>` (dòng trên cùng của
     popup Windows luôn là tên trình duyệt, web không đổi được), icon `/brand/notification-icon.png` (logo trên nền
     trắng bo góc, rõ trên nền tối lẫn sáng), nút **Xem chi tiết**, `tag` = id thông báo, `renotify`; mức
     `WARNING`/`ERROR` dùng `requireInteraction` (popup ở lại tới khi tắt).
   - Thiết bị trong nội dung là nhãn ngắn do BE dựng (`system/utils/user_agent.py`: "Chrome trên Windows",
     "Cốc Cốc trên Windows"), không phải cả chuỗi User-Agent.
4. `useNotificationRealtime` ở trang: chỉ làm mới chuông, không hiện toast.

Không dùng SDK Firebase trong service worker (không `importScripts` từ CDN, không nới CSP).

## Điều kiện để thấy popup

- **Windows**: Chrome/Edge dùng thông báo của Windows (mặc định từ Windows 10). Kiểm Settings → System →
  Notifications: bật thông báo cho Chrome/Edge, tắt "Do not disturb"/Focus Assist. Nếu thông báo hiện trong khung
  riêng của Chrome thay vì góc Windows: `chrome://flags/#enable-system-notifications` phải là Enabled/Default.
- Sửa `notification-sw.js` xong, trình duyệt vẫn chạy bản cũ tới khi service worker được thay: DevTools →
  Application → Service workers → **Update** (hoặc **Unregister** rồi tải lại trang, bật lại thông báo).

- HTTPS (hoặc `localhost`), đã cấu hình biến `NEXT_PUBLIC_FIREBASE_*` (xem [../guides/notification-setup.md](../guides/notification-setup.md)).
- Quyền thông báo của site là "Cho phép". Đã chặn (`denied`) thì phải mở lại trong cài đặt site của trình duyệt;
  thẻ trong Hồ sơ hiện trạng thái này.
- Hệ điều hành cho phép trình duyệt hiện thông báo: Windows tắt Focus Assist / "Do not disturb", bật thông báo cho
  Chrome/Edge trong Settings → Notifications; macOS tắt Focus.

## Quy định

- Thông báo chỉ phát qua `NotificationService.notify` (rule backend §9); FE không tự gọi `new Notification()`.
- Payload là data-only; thêm field mới thì sửa cả `FcmClient`, service worker và `WorkerMessage`.
- `usePushRegistration` khử trùng đăng ký thiết bị khi mount trong **24 giờ** qua `localStorage` (`system_push_device_sync`, lưu digest FNV-1a thay cho token thô) để tránh gọi lặp `POST /push-devices` khi tải lại trang; thao tác bấm bật thủ công (`enable()`) luôn đồng bộ ngay với backend.

## File chính

- `frontend/public/notification-sw.js`
- `frontend/src/shares/lib/firebase-messaging.ts`
- `frontend/src/modules/system/components/notification/hooks/use-notification-realtime.ts`, `use-push-registration.ts`
- `backend/app/system/services/fcm_client.py`, `push_device_service.py`
