# Mẫu file `docs/reports/security-verification.md`

> File này dùng để lưu baseline kiểm thử bảo mật và bộ lệnh tái xác nhận tự động cho những lần chạy `/review-security` sau.

```markdown
# Xác nhận bảo mật hệ thống — ToanNX

- **Cập nhật gần nhất**: `<YYYY-MM-DD HH:mm>`
- **Phạm vi đã kiểm**: `<toàn hệ thống | các module ...>`
- **Môi trường kiểm nghiệm**: `<PostgreSQL local test / Playwright local ...>`

## 1. Bảng các case bảo mật & giả lập tấn công

| Mã | Nhóm | Đối tượng (Endpoint / File) | Vector tấn công giả lập | Test hồi quy khóa cứng | Trạng thái | Lần kiểm |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-001 | AuthN | `/api/v1/system/auth/refresh` | Replay refresh token đã xoay vòng | `app/system/tests/test_refresh_api.py` | PASS / OPEN | `<YYYY-MM-DD>` |
| SEC-002 | IDOR | `/api/v1/finance/incomes` | User B lọc `?owners=<UserA>` hoặc PATCH ID của User A | `app/finance/tests/test_income_api.py` | PASS / OPEN | `<YYYY-MM-DD>` |
| ... | ... | ... | ... | ... | ... | ... |

## 2. Lỗi đã phát hiện & đã xử lý trong kỳ

| Mã | Mức độ | Vị trí (`file:dòng`) | Nguyên nhân & PoC | Cách vá | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| SEC-xxx | High | ... | ... | ... | FIXED & VERIFIED |

## 3. Lệnh tái xác nhận tự động (dùng cho các lần `/review-security` sau)

> Chạy trên PostgreSQL local (tuyệt đối không trỏ Neon) để xác minh không tái phát bất kỳ case bảo mật nào ở trên.

```powershell
# Backend security regression tests
cd backend
uv run pytest --reuse-db `
  app/core/tests/test_endpoint_access.py `
  <liệt kê đúng các file test bảo mật đã xác minh>

# Frontend security checks (Open Redirect, Safe Links, Permission Gates, CSP/XSS helpers)
cd ../frontend
pnpm test <liệt kê đúng các unit/e2e test bảo mật đã xác minh>
```

## 4. Giới hạn chưa kiểm (nếu có)

- <Ghi rõ phần nào mới kiểm tĩnh hoặc chưa mở được server/trình duyệt thật để giả lập runtime>
```
