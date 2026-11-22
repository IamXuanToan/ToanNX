# Hạ tầng và giới hạn gói miễn phí

Toàn bộ hệ thống chạy trên gói **free** của từng dịch vụ. Tài liệu này mô tả hệ thống ghép các dịch vụ ra sao,
giới hạn của từng gói, và **ngân sách** mỗi phần được phép tiêu. Mọi thay đổi có gọi thêm DB, Redis, R2 hoặc
function đều phải đối chiếu với các con số ở đây.

Giới hạn tra cứu ngày **2026-11-22** (nguồn ở cuối file). Nhà cung cấp có thể đổi gói, nên kiểm lại trang giá
khi có số liệu lạ.

## 1. Bức tranh tổng

```
Trình duyệt ──HTTPS──► toannx.com (Vercel, project FE: Next.js 16)
                          │  SSR; trang công khai: /s/{slug}, trang tùy chỉnh (proxy → page-view)
                          │  rewrite /api/v1/* (cùng origin, cookie host-only)
                          ▼
                       api.toannx.com (Vercel, project BE: Django WSGI, @vercel/python)
                          │
          ┌───────────────┼──────────────────┬───────────────────┬──────────────┐
          ▼               ▼                  ▼                   ▼              ▼
     Neon Postgres   Upstash Redis      Cloudflare R2        Firebase FCM     SMTP
     (dữ liệu, outbox (cache, rate limit, (2 bucket: public    (Web Push,       (email
      thông báo)      cờ outbox)*        + private)           gói Spark)       thông báo)

Gửi thông báo: QStash gọi lại endpoint dispatch ngay sau commit · cron-job.org mỗi 10 phút (lưới an toàn)
Dọn dẹp: Vercel Cron 1 lần/ngày
* Không có REDIS_URL: không cache công khai, rate limit ở PostgreSQL, cron luôn kiểm DB.
```

- **Người dùng:** một quản trị viên duy nhất (chủ site). Khách vào chỉ dùng **link rút gọn** (`/s/{slug}`)
  và **trang tùy chỉnh** (trang công khai). Lưu lượng nhỏ, nhưng **mỗi lượt khách nếu chạm DB sẽ đánh thức
  Neon**. Đây là điểm quyết định ngân sách compute (mục 3.2).
- **Không có tiến trình chạy liên tục.** Vercel chỉ chạy function theo request, nên việc nền dựa vào hàng đợi
  outbox trong PostgreSQL cộng một bộ hẹn giờ gọi vào.
- **Một region cho tất cả.** Function Vercel (FE và BE), Neon và Upstash phải cùng một vùng. Khách và chủ site ở
  Việt Nam thì vùng gần nhất là Singapore: Vercel `sin1`, Neon `aws-ap-southeast-1`, Upstash `ap-southeast-1`.
  Lệch vùng thì mỗi query mất thêm khoảng 200ms; login khoảng 30 query sẽ chậm thêm vài giây.

## 2. Giới hạn từng dịch vụ (gói free)

| Dịch vụ | Giới hạn chính | Vượt thì sao |
| --- | --- | --- |
| **Vercel Hobby** (FE + BE) | 1.000.000 lượt gọi function/tháng; **4 giờ Active CPU/tháng**; 360 GB-giờ bộ nhớ; tối đa 300 giây/lần gọi (Fluid compute); cron **tối đa 1 lần/ngày**; chỉ dùng cá nhân, phi thương mại | Tính năng bị khóa tới 30 ngày |
| **Neon Free** | **1 GB** dữ liệu/project; **100 CU-giờ/tháng** (0,25 CU chạy được khoảng 400 giờ); tự ngủ sau **5 phút** không có truy vấn (không tắt được); 5 GB truyền ra/tháng | Ghi vượt 1 GB bị lỗi; hết CU-giờ thì compute dừng tới kỳ sau |
| **Upstash Redis Free** | **500.000 lệnh/tháng** (khoảng 16.000/ngày); 256 MB; 1 database; 10 GB băng thông/tháng | Lệnh bị từ chối. Code phải tự chuyển sang dự phòng (mục 4) |
| **Upstash QStash Free** (tùy chọn) | 1.000 tin/ngày (lần thử lại cũng tính); hẹn trễ tối đa 7 ngày | Tin bị từ chối |
| **Cloudflare R2** | **10 GB** lưu trữ; 1.000.000 thao tác loại A/tháng (ghi, liệt kê); 10.000.000 thao tác loại B/tháng (đọc); tải ra miễn phí | Bắt đầu tính tiền theo mức dùng |
| **Firebase Spark** | Chỉ dùng **FCM** (Web Push): miễn phí. **Không** dùng Cloud Functions vì cần gói Blaze | — |
| **cron-job.org** | Miễn phí, chạy được mỗi phút | — |
| **SMTP** | Theo nhà cung cấp đang cấu hình (ví dụ Gmail khoảng 500 thư/ngày) | Thư bị từ chối, outbox thử lại |

## 3. Ngân sách của hệ thống này

Giả định: chủ site dùng trang quản trị khoảng 2–3 giờ/ngày; khách khoảng 500 lượt/ngày vào link hoặc trang công
khai; vài chục thông báo mỗi ngày. Các con số dưới là **ước lượng để thiết kế**. Số thật phải đọc ở dashboard
Usage của từng dịch vụ (checklist mục 6).

### 3.1 Vercel

| Nguồn | Lượt gọi/tháng | Ghi chú |
| --- | --- | --- |
| Trang quản trị (SSR FE + API BE) | ~60.000 | 2.000 request/ngày |
| Khách (trang FE + API BE) | ~30.000 | 500 lượt × 2 function |
| Bộ hẹn giờ gửi thông báo | ~4.300–43.000 | Mỗi 10 phút, hoặc mỗi phút |
| **Tổng** | **~100.000–135.000** | Hạn mức 1.000.000, còn dư nhiều |

**Active CPU 4 giờ/tháng (khoảng 480 giây/ngày) mới là giới hạn sát nhất.** Mỗi lần Django khởi động nguội tốn
khoảng 1–2 giây CPU; Argon2 khi login khoảng 0,1 giây; một request thường 30–100ms. Vì vậy:
- không gọi function theo kiểu thăm dò dày đặc nếu không cần (bộ hẹn giờ phải trả về ngay khi không có việc);
- không làm việc nặng trong request (gửi thông báo, xử lý ảnh lớn).

### 3.2 Neon: giữ compute được ngủ

Neon chỉ tốn CU-giờ khi đang thức. **Mỗi truy vấn đánh thức nó thêm ít nhất 5 phút.**

| Nguồn đánh thức | Ước lượng CU-giờ/tháng (0,25 CU) |
| --- | --- |
| Chủ site dùng trang quản trị ~3,5 giờ/ngày | ~26 |
| Khách vào link/trang **có** cache Redis (chỉ cache miss mới chạm DB) | ~5–15 |
| Khách vào link/trang **không có** cache (mỗi lượt đều query và ghi bucket rate limit) | có thể **>100**, hết hạn mức |
| Bộ hẹn giờ thông báo **chạm DB mỗi lần** (mỗi 1–5 phút) | **~180**, Neon không bao giờ ngủ |
| Bộ hẹn giờ chỉ chạm DB khi cờ Redis báo có việc | ~1–3 |

Hai quy tắc rút ra:
1. **Lượt khách không được chạm DB khi cache còn hiệu lực**, kể cả việc ghi bộ đếm rate limit.
2. **Bộ hẹn giờ không được query DB khi không có việc.** Kiểm cờ trong Redis trước.

Cố định compute ở **0,25 CU** (không cho tự tăng) để ngân sách đoán trước được.

Dung lượng 1 GB: các bảng lớn dần là thông báo (giữ 90/180 ngày), outbox (30 ngày), nhật ký thay đổi
(journal), phiên đăng nhập. File không nằm trong DB mà ở R2. Cron dọn dẹp hằng ngày đo `pg_database_size` và
cảnh báo (chuông + email) khi dùng từ 80% của `DATABASE_MAX_BYTES`.

### 3.3 Upstash Redis: 500.000 lệnh/tháng

| Việc | Lệnh mỗi lần | Lượng/tháng |
| --- | --- | --- |
| Rate limit (`INCR`, chỉ `EXPIRE` ở lần đầu của cửa sổ) | ~1 | Ghi của quản trị ~6.000 + lượt khách ~15.000 |
| Cache link/trang công khai (`GET` version + `GET` dữ liệu; miss thì thêm `SET`) | 2–3 | ~30.000–45.000 |
| Cờ "có thông báo chờ" (`SET` khi tạo, `GET` mỗi lần bộ hẹn giờ chạy) | 1 | 4.300 (mỗi 10 phút) – 43.200 (mỗi phút) |
| Làm mới cache khi quản trị viên sửa link/trang/QR (`INCR` + `EXPIRE`) | 2 | vài trăm |
| **Tổng** | | **~55.000–110.000**, khoảng 11–22% hạn mức |

Quy tắc:
- **Redis không phải nguồn dữ liệu gốc.** Dữ liệu thật, outbox thông báo và phiên đăng nhập nằm ở PostgreSQL.
  Redis mất hết thì hệ thống vẫn đúng, chỉ chậm hơn.
- **Không cache cho request của quản trị viên.** Chỉ có một người dùng, cache không có lợi mà tốn lệnh.
- **Không dùng Redis cho Django session hay kiểm tra phiên.** Mỗi request vẫn kiểm phiên ở DB như rule xác
  thực quy định.
- Khóa Redis không có tiền tố tên dự án (rule common §3). Mỗi khóa có TTL.

### 3.4 Cloudflare R2: 10 GB

- Đã có cảnh báo dung lượng ở 90%, cộng cả hai bucket (`STORAGE_WARNING_PERCENT`, `AttachmentService`).
- Ảnh công khai phục vụ qua tên miền riêng `media.toannx.com`. Cloudflare cache phía trước nên lượt xem lặp lại
  không tốn thao tác loại B. File public mang `Cache-Control: public, max-age=31536000, immutable` (khóa file là
  UUID mới mỗi lần tải lên/thay nội dung, `R2Storage`); file riêng tư mang `private, no-store`.
- File riêng tư đi qua `/attachments/{id}/content` của backend: mỗi lần xem tốn 1 function + 1 thao tác loại B.
  Chấp nhận được vì chỉ chủ site xem.
- Ảnh tải lên giữ nguyên độ phân giải gốc (image editor), nên cần để ý kích thước file khi dùng nhiều.

## 4. Khi một dịch vụ hết hạn mức hoặc lỗi

| Dịch vụ lỗi | Hệ thống làm gì |
| --- | --- |
| Redis | Cache bỏ qua; rate limit chuyển sang bảng bucket PostgreSQL; bộ hẹn giờ coi như "có việc" và query DB. Chỉ log cảnh báo, không trả 500 |
| QStash | Thông báo vẫn nằm trong outbox, bộ hẹn giờ gửi bù |
| FCM, SMTP, Telegram | Bản gửi ở outbox chuyển `PENDING` và lùi dần 1/5/15/60/240 phút, tối đa 5 lần |
| Neon hết CU-giờ | Toàn site lỗi DB. Phải tránh bằng ngân sách ở mục 3.2 |
| R2 | Tải file lên lỗi, trả mã lỗi ổn định; ảnh đã cache ở Cloudflare vẫn xem được |

## 5. Biến môi trường liên quan

| Biến | Project | Ghi chú |
| --- | --- | --- |
| `DATABASE_URL` | BE | Host Neon **pooled** (`-pooler`), `sslmode=require` |
| `DB_CONN_MAX_AGE` | BE | `0` (serverless + pooler) |
| `REDIS_URL` | BE | Upstash TCP `rediss://...`, do integration Upstash của Vercel tạo; trống thì dùng dự phòng |
| `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` | BE | Upstash QStash; trống token thì chỉ cron gửi thông báo |
| `DB_CONNECT_TIMEOUT` | BE | `10` giây chờ Neon thức |
| `CRON_SECRET` | BE | Bộ hẹn giờ gửi `Authorization: Bearer <CRON_SECRET>` |
| `FIREBASE_*`, `NEXT_PUBLIC_FIREBASE_*` | BE / FE | FCM |
| `CLOUDFLARE_*` | BE | R2 và tên miền media |

Danh sách đầy đủ và cách điền: [`backend/.env.example`](../../backend/.env.example),
[`frontend/.env.example`](../../frontend/.env.example), [deployment.md](../guides/deployment.md).

## 6. Checklist theo dõi hằng tuần

- [ ] Vercel → Usage: Active CPU, số lượt gọi function, Image Optimization (cả hai project).
- [ ] Neon → Usage: CU-giờ tháng này, dung lượng DB.
- [ ] Upstash → Redis: số lệnh tháng này, dung lượng; QStash: số tin/ngày.
- [ ] Cloudflare → R2: dung lượng, thao tác loại A/B.
- [ ] Hệ thống → Webhook / Callback và outbox thông báo: có bản `FAILED` nào không.

## Nguồn (tra ngày 2026-11-22)

- Vercel Hobby: <https://vercel.com/docs/plans/hobby>, background work: <https://vercel.com/docs/background-workers>
- Neon Free: <https://neon.com/faqs/free-plan-limits-and-quotas>
- Upstash Redis: <https://upstash.com/pricing> (số liệu đối chiếu thêm ở <https://layerbase.com/blog/upstash-vs-redis-cloud>)
- Upstash QStash: <https://upstash.com/qstash>, <https://upstash.com/blog/qstash-qa>
- Cloudflare R2: <https://developers.cloudflare.com/r2/pricing/>
