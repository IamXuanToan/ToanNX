# Xác thực

Không có đăng ký (`/register`, `/signup` trả 404). Đăng nhập bằng email + mật khẩu (Argon2id).

## API (`/api/v1/auth`)

| Method | Path | Xác thực | CSRF | Mô tả |
| --- | --- | --- | --- | --- |
| GET | `/csrf` | — | — | Đặt cookie `csrftoken`, trả token |
| POST | `/login` | — | ✔ | Đăng nhập, đặt cookie phiên, trả `{user, permissions, modules}` |
| POST | `/refresh` | refresh cookie | ✔ | Xoay vòng refresh token; lỗi → 401 + xóa cookie |
| POST | `/logout` | refresh cookie | ✔ | Thu hồi phiên hiện tại (hoạt động cả khi access hết hạn) |
| POST | `/logout-all` | access | ✔ (nếu dùng cookie) | Thu hồi mọi phiên |
| GET | `/me` | access | — | Người dùng, vai trò, quyền hiệu lực |
| GET | `/sessions` | access | — | Phiên còn hiệu lực (`is_current`) |
| DELETE | `/sessions/{id}` | access | ✔ | Thu hồi một phiên của chính mình |
| GET | `/admin-sessions` | staff + `authentication.session.read` | — | Phiên của mọi người dùng, phân trang; tìm email/tên/thiết bị/IP; lọc `user` (UUID), `status` (`ACTIVE/REVOKED/EXPIRED`) |
| DELETE | `/admin-sessions/{id}` | staff + `authentication.session.revoke` | ✔ | Thu hồi phiên, giữ lịch sử; chỉ superuser được tác động phiên superuser |

API quản trị không trả token/hash. Thu hồi có khóa dòng và có hiệu lực ngay với access/refresh token.
`POST /admin-sessions/bulk-delete` nhận `ids` (1–100), yêu cầu staff và quyền
`authentication.session.delete`: thu hồi hiệu lực rồi xóa mềm (`deleted_at`), ẩn khỏi mọi danh sách.
Giữ nguyên bản ghi và token hash để bảo toàn lịch sử; chỉ superuser được xóa phiên của superuser.
Toàn bộ lô nằm trong một transaction; xóa chính phiên đang dùng sẽ xóa cookie.
Phiên đã thu hồi/hết hạn không bị xóa; gọi thu hồi lại không đổi lịch sử. Khi thu hồi chính phiên đang dùng,
backend xóa cookie. Giao diện đánh dấu phiên hiện tại và chỉ cho thu hồi các phiên đang hoạt động khác.

## Token

| | Access token | Refresh token |
| --- | --- | --- |
| Dạng | JWT HS256 (`sub`, `sid`, `jti`, `typ=access`, `iss`, `aud`, `exp`) | 48 byte ngẫu nhiên (`secrets.token_urlsafe`) |
| Lưu server | Không | `auth_refresh_token.token_hash` = HMAC-SHA256(SECRET_KEY, token) |
| Thời hạn | `AUTH_ACCESS_TOKEN_LIFETIME_SECONDS` (mặc định 600) | Bằng thời hạn phiên `AUTH_REFRESH_TOKEN_LIFETIME_SECONDS` (mặc định 7 ngày, tuyệt đối) |
| Cookie | `access_token`, HttpOnly, SameSite=Lax, Path=`/api` | `refresh_token`, HttpOnly, SameSite=Strict, Path=`/api/v1/auth` |

Access JWT ký HS256 bằng chính `SECRET_KEY` (biến `DJANGO_SECRET_KEY`, secret chung của hệ thống);
không có secret JWT riêng. Đổi `DJANGO_SECRET_KEY` sẽ vô hiệu mọi access/refresh token đang có.

Cookie thứ ba `session_hint=1` (HttpOnly, Path=`/`) chỉ để `proxy.ts` kiểm tra lạc quan; không chứa bí mật.
Tất cả cookie host-only (không đặt `Domain`), `Secure` khi `DJANGO_DEBUG=False`.

Access token gắn `sid`. Mỗi request, `CookieJwtAuthentication` kiểm tra phiên còn hiệu lực và tài khoản active
(một truy vấn có `select_related`), nên logout-all, khóa tài khoản, đổi mật khẩu có hiệu lực ngay.

## Xoay vòng refresh (atomic)

1. Kiểm tra rate limit (`refresh:<ip>`, 30/phút) và token có mặt.
2. Tìm bản ghi theo hash.
3. `SELECT ... FOR UPDATE` trên phiên (token family) → tuần tự hóa refresh đồng thời.
4. Phiên bị thu hồi → `AUTH_REFRESH_REVOKED`.
5. Token đã xoay vòng:
   - trong `AUTH_REFRESH_REUSE_GRACE_SECONDS` (10s) **và** token kế tiếp vẫn là token hiện hành → 409 `AUTH_REFRESH_CONFLICT`
     (nhiều tab refresh cùng lúc; client coi là thành công vì cookie đã được tab kia cập nhật);
   - ngược lại → **reuse**: thu hồi cả phiên (`reuse_detected`), 401 `AUTH_REFRESH_REUSED`.
6. Hết hạn → thu hồi, 401 `AUTH_REFRESH_EXPIRED`. Tài khoản bị khóa → thu hồi, 401 `AUTH_USER_INACTIVE`.
7. Đánh dấu token cũ `rotated_at`, tạo token mới, `replaced_by`, cập nhật `last_used_at`.

Thu hồi do reuse/hết hạn được **commit trước** khi raise lỗi.

## CSRF

Cookie tự động gửi kèm nên mọi request đổi trạng thái dùng cookie phải qua CSRF của Django:
double-submit (`csrftoken` cookie đọc được bằng JS + header `X-CSRFToken`) và kiểm tra Origin theo
`CSRF_TRUSTED_ORIGINS`. Không coi SameSite là đủ. Áp dụng cho login (chống login CSRF), refresh, logout và
mọi API ghi khi xác thực bằng cookie. Request dùng `Authorization: Bearer` không cần CSRF.
Sau đăng nhập CSRF token được xoay vòng (`rotate_token`).

## Rate limit

Bảng `auth_rate_limit_bucket` (khóa băm SHA-256, cửa sổ cố định, `INSERT ... ON CONFLICT ... RETURNING`).
- Đăng nhập: `login:<email>:<ip>` tối đa `AUTH_LOGIN_RATE_LIMIT` (10) / 15 phút, reset khi đăng nhập thành công → 429 + `Retry-After`.
- Refresh: 30/phút/IP.

IP lấy phần tử **cuối** của `X-Forwarded-For` (do proxy gần nhất thêm) hoặc `REMOTE_ADDR`.

## Silent refresh phía client

`apiClient`: 401 với mã `AUTH_TOKEN_EXPIRED|AUTH_TOKEN_INVALID|AUTH_NOT_AUTHENTICATED|AUTH_SESSION_INVALID`
(không phải endpoint auth) → một promise refresh dùng chung cho mọi request (single-flight) → thử lại request
gốc **một lần**. Thử lại POST/PATCH là an toàn vì 401 xác thực xảy ra trước khi view chạy nghiệp vụ.
Refresh thất bại → Zustand `sessionExpired` → khung admin xóa cache React Query, toast, chuyển tới đăng nhập kèm `next`.
Không có spinner toàn màn hình; không thông báo khi refresh thành công; không lặp refresh.

## Logout

Backend thu hồi phiên + xóa 3 cookie; frontend `queryClient.clear()` và chuyển tới trang đăng nhập.
Đổi mật khẩu hoặc khóa tài khoản (qua IAM) phát signal `user_credentials_changed` → thu hồi mọi phiên.
