# Mẫu tạo test Backend & Frontend chuẩn ToanNX

## 1. Backend API Test (`test_<resource>_<action>_api.py`)

Mỗi endpoint/action là **một file riêng**. Cấu trúc test chuẩn cho một endpoint CRUD/action:

```python
"""Kiểm thử endpoint <mô tả ngắn>."""

import pytest
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db

URL = "/api/v1/<module>/<resources>"


class Test<Resource><Action>Api:
    """Kiểm thử đầy đủ dữ liệu, phân quyền, owner isolation và envelope."""

    def test_unauthenticated_returns_401(self, client) -> None:
        response = client.get(URL)
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "AUTH_NOT_AUTHENTICATED"

    def test_forbidden_without_permission_returns_403(self, csrf_client, login) -> None:
        user = UserFactory(is_staff=True)
        login(csrf_client, user)
        response = csrf_client.post(URL, data={...}, format="json")
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "PERMISSION_DENIED"

    def test_full_data_and_envelope(self, csrf_client, login) -> None: ...
    def test_min_data_defaults(self, csrf_client, login) -> None: ...
    def test_validation_errors(self, csrf_client, login) -> None: ...
    def test_owner_isolation_and_manage_all(self, csrf_client, login) -> None: ...
```

Nhớ bổ sung khi áp dụng:
- Route mới công khai / chỉ cần đăng nhập → `backend/app/core/tests/test_endpoint_access.py`.
- Endpoint list mới → 1 dòng `CASES` trong `backend/app/core/tests/test_list_query_count.py`.
- Chạy xác nhận:
  ```powershell
  uv run ruff format --check <files> && uv run ruff check <files> && uv run mypy <source_files>
  uv run pytest --reuse-db <test_files> app/core/tests/test_endpoint_access.py app/core/tests/test_list_query_count.py
  ```

## 2. Frontend Unit Test (`Vitest`)

- Dùng `NextIntlClientProvider` nạp JSON thật từ `src/messages/vi.json` và `src/modules/<m>/messages/vi.json` để bắt lỗi thiếu khóa dịch ngay trong test.
- Mock `usePermission` hoặc service hook ở ranh giới module hook; assert **trạng thái hiển thị & hành vi người dùng** (nút bị `disabled` kèm tooltip khi thiếu quyền, `ForbiddenView` khi không có `read`, gọi callback đúng tham số, cập nhật URL filter).
- Kiểm tra thêm khi đổi cấu trúc/quy ước:
  ```powershell
  pnpm --dir frontend test tests/unit/one-unit-per-file.test.ts tests/unit/module-structure.test.ts tests/unit/table-conventions.test.ts tests/unit/messages.test.ts
  ```

## 3. Playwright E2E + Screenshot Visual Audit

Mẫu kiểm màn hình chuẩn trong spec hoặc script Playwright:
- Đính listener kiểm lỗi runtime ngay sau khi tạo `page`:
  ```ts
  const runtimeErrors: string[] = [];
  const serverErrors: string[] = [];
  page.on("pageerror", (err) => runtimeErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") runtimeErrors.push(msg.text());
  });
  page.on("response", (res) => {
    if (res.status() >= 500) serverErrors.push(`${res.status()} ${res.url()}`);
  });
  ```
- Kiểm tràn ngang ở cả 3 mốc `375`, `768`, `1280`:
  ```ts
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  ```
- Lưu screenshot vào thư mục tạm/artifact (ví dụ `.tmp/playwright-audit/<screen>-<viewport>.png` — **không commit vào repo**) rồi đọc từng ảnh bằng `read_file` để kiểm lỗi bố cục trước khi xóa ảnh tạm.
