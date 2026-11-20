# Rule chung (backend + frontend)

Áp dụng cho mọi người và AI agent. Rule riêng: [backend.md](backend.md), [frontend.md](frontend.md).

## 1. Thứ tự ưu tiên

Correctness > Security > Maintainability > Performance > Developer Experience > Visual polish.

## 2. Phạm vi và cách làm

- Làm đúng phạm vi được yêu cầu; không thêm tính năng, module giả hay API trả dữ liệu mock.
- Không over-engineering: không tạo abstraction/thư mục chỉ để đủ tên; không để thư mục rỗng.
- Scaffold bằng CLI chính thức: `uv init`, `uv add`, `django-admin startproject`, `manage.py startapp`,
  `create-next-app`, `pnpm add`, `shadcn add`. Không viết tay lockfile hay khai báo dependency giả.
- Không sửa source tham khảo (PMS, Medoly); không copy credentials hay cấu hình production.

## 3. Code sạch

- **Mỗi class một file**, tên file snake_case (BE) / kebab-case (FE) trùng tên class/component.
- Hàm làm một việc; tên nói rõ ý định (`get_manageable_user`, `useLoginForm`), không viết tắt khó hiểu.
- Viết code có xuống dòng ngay từ đầu, không sinh code nén để chờ formatter sửa: mỗi statement một dòng;
  khối `if`/`try`/`catch`, callback nhiều bước và JSX nhiều prop phải tách dòng, thụt lề rõ ràng.
  Chạy formatter trước khi bàn giao và kiểm tra format trong gate của repo.
- Tách khối logic bằng một dòng trống; nghiệp vụ nhiều bước dùng comment bước:

  ```text
  # ============================================================
  # BƯỚC 1: Kiểm tra dữ liệu đầu vào
  # ============================================================
  ```

  Chỉ dùng cho nghiệp vụ thực sự nhiều bước, không chèn vào hàm ngắn.
- Không magic number/string: đặt hằng số có tên (constants, settings, enum).
- **Không gắn tên dự án vào key kỹ thuật** (cả BE và FE): cookie, localStorage/sessionStorage, header,
  query/cache key, claim JWT, tên event, biến môi trường. Dùng tên mô tả đúng việc: `access_token`,
  `refresh_token`, `session_hint`, `csrftoken`, không `toannx_access`, `toannx-auth`. Tên dự án chỉ xuất
  hiện ở nội dung hiển thị (logo, tiêu đề, footer), domain và tên DB.
- Không nuốt lỗi (`except Exception: pass`, `catch {}` rỗng); lỗi phải có mã ổn định hoặc được log.
- Không `console.log`/`print` trong code chạy thật; không `any`/`type: ignore`/`noqa` không lý do
  (nếu bắt buộc phải ghi lý do ngay trên dòng đó).

## 4. Tài liệu trong code

- Mọi class/hàm public có docstring (Python, Google-style) / JSDoc (TypeScript) **tiếng Việt có dấu**.
- Comment giải thích **vì sao**, không lặp lại code làm gì.
- Hằng số quyền phải có `name` + `description` để đọc là hiểu quyền dùng làm gì.

## 5. Bảo mật

- Không hardcode secrets, URL môi trường; mọi cấu hình qua biến môi trường.
- Backend là nơi kiểm soát quyền cuối cùng; FE chỉ ẩn/hiện.
- Không trả stack trace, mật khẩu, token, hash ra client.
- Không tin dữ liệu client: validate mọi input; kiểu file xác định bằng chữ ký file, không bằng header.

## 6. API contract

- Path: `/api/v1/<module>/<resource>[/<id>]`, không có `/` cuối, danh từ số nhiều.
- Response thành công `{success, data, meta}`; lỗi `{success: false, error: {code, message, details, request_id}}`.
- `error.code` là hợp đồng ổn định giữa BE và FE: không đổi giá trị đã phát hành; FE dịch theo code.
- Mã lỗi nghiệp vụ mang tiền tố của **module sở hữu nghiệp vụ** (`ACCOUNT_*`, `IAM_*`, `MODULE_*`, `AUTH_*`);
  mã chung không tiền tố module (`VALIDATION_ERROR`, `NOT_FOUND`...). Thêm mã phải thêm message vi + en.
- JSON BE dùng snake_case; FE dùng camelCase (apiClient tự chuyển).
- API danh sách: `?search=` (tìm kiếm), `?ordering=field` / `-field` (sắp xếp), lọc theo field
  (`?is_active=true`), `?page=&page_size=` (≤ 100). Trang vượt quá trả 404; giá trị lọc sai trả 400.
- Mọi field input/output có mô tả (`help_text`) để OpenAPI là tài liệu contract đầy đủ.
- Danh sách tài nguyên mặc định mới nhất trước (`-created_at`); client vẫn được chọn thứ tự khác.
  Danh sách block nội dung giữ thứ tự `position` do người dùng sắp đặt.

## 7. Kiểm thử và hoàn thành

- Không báo PASS khi chưa chạy thật. Trước khi báo xong: `scripts/check-all.ps1` (hoặc `.sh`) và `pnpm e2e`.
- Sửa bug: thêm test tái hiện trước/cùng lúc với bản sửa.
- Test nằm cạnh code: `app/<m>/tests/`, `app/core/tests/` (BE); `frontend/tests/` (FE).
- **Quy chuẩn API test backend**: Mỗi endpoint đúng 1 file test riêng biệt (`test_<resource>_<action>_api.py`).
  Không gộp chung các action CRUD vào một file model; không tách file test quyền riêng biệt.
  Mỗi file test endpoint phải bao phủ toàn diện: full data, min data, validation errors, mã HTTP status, envelope response,
  chưa đăng nhập (401), thiếu quyền (403), cô lập owner (404/403 cho người khác, manage_all thành công).

## 8. Git

- Theo [quy tắc nhánh và commit](git.md). Commit nhỏ theo một thay đổi logic; không commit `.env`,
  `media/`, build output hoặc dữ liệu công cụ cục bộ.
