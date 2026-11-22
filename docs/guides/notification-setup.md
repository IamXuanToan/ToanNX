# Hướng dẫn cài đặt thông báo

Cập nhật 22/11/2026. Thiết kế: [plans/notification-system-plan.md](../plans/notification-system-plan.md).

## 1. Thông báo hoạt động thế nào

- **Chuông** trên thanh quản trị có 2 tab: **Cá nhân** (tiền vào qua SePay, đăng nhập, thiết bị mới, đổi mật
  khẩu, dung lượng sắp đầy) và **Hệ thống** (thông báo admin gửi, lỗi gửi thông báo). Mức: Thông tin / Cảnh báo / Lỗi.
- **Kênh**: Trong app (luôn có), Trình duyệt (popup qua Firebase Cloud Messaging), Email, Telegram (bot của từng
  người). Mỗi người chọn kênh theo sự kiện ở **Hồ sơ → Thông báo** (tab chỉ hiện khi có quyền).
- **Gửi ngầm (outbox)**: request nghiệp vụ (đăng nhập, tiền vào...) chỉ lưu thông báo + bản gửi trong
  transaction, **không bao giờ gọi FCM/SMTP/Telegram** (trước đây gửi ngay trong request làm đăng nhập mất ~23
  giây). Sau commit, hệ thống "đá" **Upstash QStash** gọi lại `POST /api/v1/system/notifications/dispatch` ở một
  lượt function riêng, nên push/email/Telegram tới sau vài giây. Lần thử lại (1, 5, 15, 60, 240 phút, tối đa 5
  lần) được hẹn trễ qua QStash. **cron-job.org mỗi 10 phút** là lưới an toàn: mốc "có việc" nằm trong Redis,
  chưa tới thì endpoint trả về ngay mà không chạm DB (Neon được ngủ). Xem lịch sử ở **Hệ thống → Nhật ký
  thông báo**.
- Không có QStash: thông báo chỉ được gửi khi cron chạy (≤ chu kỳ cron). Không có Redis: cron luôn kiểm DB.
- Không có WebSocket (Vercel serverless): realtime nhờ FCM, không có FCM thì chuông tự hỏi lại mỗi 60 giây.

## 2. Firebase (popup trình duyệt) — tùy chọn

Bỏ qua bước này thì kênh "Trình duyệt" tắt, mọi thứ khác vẫn chạy.

1. console.firebase.google.com → tạo project (không cần Analytics).
2. Project settings → General → **Add app → Web**. Chép `apiKey`, `projectId`, `messagingSenderId`, `appId` vào
   biến FE `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` (công khai).
3. Project settings → Cloud Messaging → Web Push certificates → **Generate key pair** → public key vào
   `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
4. Project settings → Service accounts → **Generate new private key** (file JSON, là **bí mật**). Mã hóa base64
   một dòng rồi đặt vào biến backend `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64`; `FIREBASE_PROJECT_ID` = project id.
   - PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("key.json"))`
   - Bash: `base64 -w0 key.json`
   Xóa file JSON khỏi máy sau khi đặt biến; không commit, không dán vào chat.
5. Deploy lại FE và BE. Mở Hồ sơ → Thông báo → **Bật trên trình duyệt này**, cho phép thông báo.

## 3. Upstash QStash + Redis (gửi ngầm, miễn phí)

1. Vercel → project **backend** → Storage → **Upstash for Redis** → Create (gói Free, **cùng region** với Neon và
   function, ví dụ Singapore). Integration tạo `REDIS_URL` (và các biến `KV_*` không dùng).
2. Vercel → project backend → Storage → **Upstash QStash** → kết nối. Integration tạo `QSTASH_URL`, `QSTASH_TOKEN`,
   `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`. **Không** tạo schedule trên QStash (backend tự đăng tin).
3. Deploy lại backend. Kiểm: đăng nhập → Hệ thống → Nhật ký thông báo có bản `SENT` sau vài giây.

Hạn mức free và ngân sách: [infrastructure.md](../architecture/infrastructure.md) §2–3.

## 4. Cron lưới an toàn (cron-job.org, miễn phí)

Vercel Cron gói miễn phí chỉ chạy 1 lần/ngày (dọn dẹp, có gửi nốt thông báo), nên dùng thêm cron-job.org:

1. Tạo tài khoản ở cron-job.org → **Create cronjob**.
2. URL `https://api.toannx.com/api/v1/system/notifications/dispatch`, method **POST**, **mỗi 10 phút**.
   Đừng đặt dày hơn khi không có Redis: mỗi lượt kiểm DB đánh thức Neon thêm 5 phút (100 CU-giờ/tháng sẽ hết).
   Không dùng QStash thì đặt 1–2 phút (vẫn chỉ hợp lệ khi đã có Redis).
3. Advanced → Headers: `Authorization: Bearer <CRON_SECRET>` (cùng giá trị biến `CRON_SECRET` của backend).
4. Lưu, bấm **Test run**: kết quả 200. `CRON_SECRET` trống hoặc sai → 404.

## 5. Telegram (mỗi người một bot)

Không còn biến `TELEGRAM_BOT_TOKEN`. Ở **Hồ sơ → Thông báo** (cần quyền dùng bot Telegram):

1. Chat với @BotFather → `/newbot` → chép token → dán → **Lưu và kiểm tra** (token lưu DB đã mã hóa).
2. **Chat riêng với bot** hoặc **Thêm nhóm** → mở Telegram bằng nút trên màn → quay lại bấm **Kiểm tra**.
3. **Gửi thử** để xác nhận. Bot đang đặt webhook ở nơi khác thì phải gỡ webhook đó trước.

Token không giải mã được (thường do đổi `DJANGO_SECRET_KEY`) hoặc Telegram báo token sai: bot **tự tắt** (một
cảnh báo "gửi thất bại"), các thông báo sau không thử Telegram nữa. Dán lại token ở Hồ sơ để bật lại.

## 6. Module khác phát thông báo

Khai sự kiện trong `ModuleDescriptor.notification_events` (`scope`, `audience`, `permission`, `default_level`,
`default_channels`) rồi gọi `NotificationService.notify(...)` qua service — xem rule backend mục 9 và
[common-catalog.md](../common-catalog.md).
