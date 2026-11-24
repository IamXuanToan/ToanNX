---
trigger: glob
globs: backend/**/tests/**/*.py, backend/**/conftest.py, frontend/tests/**/*.ts, frontend/tests/**/*.tsx, frontend/src/**/*.test.ts, frontend/src/**/*.test.tsx, frontend/src/**/*.spec.ts, frontend/src/**/*.spec.tsx
description: Quy ước viết và chạy test backend (pytest) và frontend (Vitest, Playwright).
---

# Test

## Backend (pytest)

- Chạy trên **PostgreSQL local**, luôn `--reuse-db`:
  `uv run pytest --reuse-db app/<m>/tests/test_<x>.py`. `conftest.py` dừng nếu DB không phải local, và tắt
  R2/Cloudflare/Firebase/Upstash (Redis, QStash) dù `.env` có khóa thật.
- **Mỗi endpoint đúng một file** `test_<resource>_<action>_api.py`. Route mới: thêm vào
  `core/tests/test_endpoint_access.py` nếu công khai/chỉ cần đăng nhập; danh sách mới: thêm một dòng vào
  `core/tests/test_list_query_count.py`.
- Dữ liệu test thỏa mọi ràng buộc unique (mã riêng từng bản ghi, `dedup_key` khác nhau). Không sinh mã ngẫu nhiên
  ngắn dễ trùng (ví dụ mã tiền tệ 3 ký tự): dùng bộ đếm tuần tự.
- Dùng fixture/helper có sẵn: `superuser`, `staff_with`, `login`, `grant`, `fake_redis` (Redis giả, đếm lệnh),
  `sign` (chữ ký QStash), `django_assert_num_queries`, `django_capture_on_commit_callbacks`.
- Không gọi dịch vụ ngoài thật trong test; mock client (`FcmClient`, `TelegramClient`, `QstashClient`).

## Frontend

- Vitest: dùng skill `vitest` khi viết/sửa unit test FE (mock, fake timer, assertion), theo phiên bản trong
  `frontend/package.json`; chạy `pnpm test tests/unit/<file>.test.ts`. Test quy ước phải đạt khi đổi cấu trúc:
  `one-unit-per-file`, `module-structure`, `table-conventions`, `module-registry`, `theme-tokens`, `api-contract`.
- Playwright: dùng `playwright-best-practices` khi viết/sửa spec; dùng `playwright-cli` khi thao tác UI thật.
  Chạy `pnpm e2e tests/e2e/<luồng>.spec.ts`, DB riêng `toannx_e2e` (BE 8001, FE 3001). Đổi URL quản trị
  thì sửa URL trong spec cùng lần.
- UI/luồng đã đổi phải có test liên quan cho các case bị ảnh hưởng; dùng `playwright-cli` mở UI thật, chụp ảnh
  rồi xem lại, kiểm desktop/mobile, trạng thái, tương tác, console và network. Không mở được UI thì ghi rõ.
- Không chạy toàn bộ khi chưa được yêu cầu.
