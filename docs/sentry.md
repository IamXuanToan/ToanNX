# Giám sát lỗi với Sentry (Error Tracking & Performance)

Hệ thống TOANNX tích hợp Sentry để theo dõi lỗi chưa xử lý (unhandled exceptions, lỗi HTTP 500) và hiệu năng ứng dụng ở cả Backend và Frontend theo mô hình tập trung.

---

## 1. Cơ chế hoạt động trong TOANNX

### Tập trung tại Backend
- **Chỉ nạp khi cần**: Backend khởi tạo Sentry trong [backend/app/core/logging/sentry.py](file:///d:/project/toannx/backend/app/core/logging/sentry.py) qua `init_sentry()`. Nếu biến `SENTRY_DSN` để trống, thư viện `sentry-sdk` hoàn toàn **không được import hay kích hoạt**, giúp local development và test suite chạy nhanh, không tốn tài nguyên mạng.
- **Đối chiếu qua `request_id`**: Hàm hook `before_send` (`_attach_request_id`) tự động trích xuất `request_id` từ ContextVar của request và gắn vào thẻ (tag) `request_id` của event trên Sentry. Khi API trả về lỗi 500 kèm mã `{ "error": { "request_id": "..." } }`, lập trình viên có thể tìm kiếm trực tiếp trên Sentry bằng mã này.
- **Bảo mật dữ liệu (Zero PII)**: Cấu hình `send_default_pii=False` đảm bảo không gửi cookie phiên, header nhạy cảm, mật khẩu hoặc dữ liệu cá nhân của người dùng lên máy chủ Sentry.
- **Tự động gắn Git Commit (Release)**: Tự động đọc biến `VERCEL_GIT_COMMIT_SHA` khi triển khai trên Vercel để liên kết chính xác lỗi với commit git tương ứng.

### Lỗi từ Frontend (Trình duyệt)
- Frontend **không cần cài SDK Sentry nặng nề** ở client. Khi xảy ra lỗi chưa bắt được (qua Error Boundary hoặc unhandled error), frontend tự động gửi payload báo cáo lỗi về endpoint backend:
  $$\text{POST } /api/v1/health/client-errors$$
- Backend ghi nhận log mức `ERROR` kèm thông tin trình duyệt, URL và stack trace, từ đó Sentry tự động thu thập và cảnh báo.

---

## 2. Chi tiết các biến môi trường

Khai báo trong file [backend/.env](file:///d:/project/toannx/backend/.env) (cho môi trường chạy thử) hoặc trên **Vercel Settings -> Environment Variables** (cho production):

```env
# Báo lỗi lên Sentry (để trống = tắt).
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0
```

| Biến | Kiểu | Mặc định | Ý nghĩa & Hướng dẫn cấu hình |
| --- | --- | --- | --- |
| `SENTRY_DSN` | `string` | `""` (trống) | **Data Source Name**: Địa chỉ định danh project của bạn trên Sentry.<br>• Định dạng: `https://<key>@<host>/<project_id>`<br>• Để trống khi chạy dev local hoặc test để tắt Sentry.<br>• Điền DSN thật khi triển khai staging hoặc production. |
| `SENTRY_ENVIRONMENT` | `string` | `"production"` | **Môi trường hoạt động**: Dùng để phân loại nguồn phát sinh lỗi trên giao diện Sentry dashboard.<br>• Giá trị khuyên dùng: `production`, `staging`, `preview` hoặc `development`. |
| `SENTRY_TRACES_SAMPLE_RATE` | `float` | `0.0` | **Tỉ lệ lấy mẫu hiệu năng (Performance Tracing)**:<br>• `0` (hoặc `0.0`): Tắt tracing hiệu năng, chỉ bắt lỗi (tiết kiệm hạn ngạch gói miễn phí).<br>• `0.1` (10%): Thu thập ngẫu nhiên 10% các transaction để theo dõi thời gian phản hồi API và câu lệnh SQL chậm mà không làm cạn quota.<br>• `1.0` (100%): Thu thập toàn bộ request (chỉ khuyến nghị bật ngắn hạn khi cần đo lường hoặc debug). |

---

## 3. Hướng dẫn thiết lập Sentry từng bước

### Bước 1: Tạo Project trên Sentry
1. Đăng ký/Đăng nhập tại [sentry.io](https://sentry.io).
2. Tạo một Project mới:
   - **Platform**: Chọn **Django** (Python).
   - **Set default alert options**: Chọn cảnh báo khi có lỗi mới (Alert me on every new issue).
   - Đặt tên Project (ví dụ: `toannx-backend`).

### Bước 2: Lấy chuỗi DSN
1. Vào **Settings** (biểu tượng bánh răng) -> **Projects** -> chọn project vừa tạo.
2. Tại menu bên trái, chọn **Client Keys (DSN)**.
3. Sao chép giá trị tại mục **DSN** (dạng `https://xxxxxxxx@xxxx.ingest.sentry.io/xxxxxxx`).

### Bước 3: Cấu hình vào hệ thống
- **Khi chạy Production trên Vercel**:
  1. Vào Dashboard Vercel của dự án `toannx-backend`.
  2. Chọn tab **Settings** -> **Environment Variables**.
  3. Thêm các biến:
     - `SENTRY_DSN`: dán chuỗi DSN vừa copy.
     - `SENTRY_ENVIRONMENT`: `production`.
     - `SENTRY_TRACES_SAMPLE_RATE`: `0` (hoặc `0.1` nếu muốn theo dõi APM).
  4. Redeploy lại dự án để biến môi trường có hiệu lực.

- **Khi kiểm tra tại Local**:
  1. Dán DSN vào [backend/.env](file:///d:/project/toannx/backend/.env).
  2. Đặt `SENTRY_ENVIRONMENT=development`.

---

## 4. Cách kiểm tra kết nối Sentry hoạt động

Bạn có thể chạy thử lệnh sau tại thư mục `backend/` để kiểm tra việc gửi lỗi lên Sentry:

```bash
cd backend
uv run python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import sentry_sdk
print('Sentry initialized:', sentry_sdk.Hub.current.client is not None)
try:
    1 / 0
except ZeroDivisionError as e:
    sentry_sdk.capture_exception(e)
    print('Đã gửi exception mẫu lên Sentry thành công!')
"
```

Sau khi chạy xong, hãy kiểm tra tab **Issues** trên Sentry Dashboard; bạn sẽ thấy lỗi `ZeroDivisionError: division by zero` xuất hiện ngay lập tức.

---

## 5. Quy trình điều tra lỗi khi gặp sự cố

Khi người dùng báo cáo gặp lỗi màn hình 500:
1. Yêu cầu mã **Request ID** hiển thị trên thông báo lỗi (ví dụ: `4729f290-c712-4eec-94f3-cab51b05e9ad`).
2. Mở Sentry Dashboard -> ô tìm kiếm nhập:
   ```text
   tags[request_id]:4729f290-c712-4eec-94f3-cab51b05e9ad
   ```
3. Sentry sẽ hiển thị chính xác:
   - Dòng code gây ra exception và toàn bộ Stack trace.
   - Phiên bản git commit đang chạy (`release`).
   - Môi trường (`environment`).
   - Thời điểm chính xác xảy ra lỗi.
