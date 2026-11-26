# Bảng tự kiểm trước khi chốt Plan (`docs/plans/<YYYY>/<MM>/<DD>/`)

Rà mọi mục liên quan trước khi bàn giao plan; nếu vi phạm, sửa ngay trong plan trước khi gửi người dùng.

## Thực tế & Phạm vi
- [ ] Đã kiểm tra module, service, model, route và package thật trong source (không bịa tên hàm/gói).
- [ ] Đã tra `docs/common-catalog.md` để tái sử dụng common BE/FE; common mới/mở rộng được liệt kê rõ.
- [ ] Mọi dependency mới (nếu có) đều tách bảng chờ người dùng duyệt, không tự mặc định cài.
- [ ] Các quyết định đánh đổi đều có phương án, ưu/nhược điểm và đề xuất rõ ràng (`D1`, `D2`...).

## Hạ tầng Free-tier & Hiệu năng
- [ ] Đã ước lượng tác động lên Neon Free (số lần đánh thức/tháng, tránh cron/khách chạm DB khi cache còn hiệu lực), Vercel Hobby (Active CPU, timeout, không daemon), Upstash Redis (chỉ cache public, có TTL và fallback DB), QStash và R2.
- [ ] Mọi lời gọi dịch vụ ngoài có timeout (≤ 5 giây); không gửi email/Telegram/FCM đồng bộ trong request.
- [ ] Truy vấn nóng có partial index (`condition=Q(deleted_at__isnull=True)`) và tránh N+1 ở repository.

## Backend & Phân quyền
- [ ] Tuân thủ `url → view → service → repository → ORM`, DI trong `__init__`, một class một file, không `@staticmethod`/`@classmethod` công khai trên service.
- [ ] Model dùng `(JournalTracker, CoreModel)` nếu cần lịch sử; không dùng `OneToOneField` hoặc `unique=True` ngắn trần nếu có soft delete (`deleted_at`); dùng `UniqueConstraint(condition=Q(deleted_at__isnull=True))`.
- [ ] Quyền chia theo từng model (`XxxPermission`), khai đúng `MEMBER` (không chứa `manage_all`/`read_private`); owner isolation trả `404`; API không kiểm `is_staff`.
- [ ] ViewSet khai đủ `action_permissions` (gồm `"create": DENY` cho ViewSet chỉ đọc mở bulk), `bulk_delete_enabled`, `bulk_update_serializer_class` cho cờ boolean, `Core*InFilter`, `action_rate_limits`.
- [ ] Thông báo chỉ qua `NotificationService.notify` (`ModuleDescriptor.notification_events`); webhook/callback khai trong `ModuleDescriptor` và không hardcode domain.

## Bảo mật, Bí mật & Tệp
- [ ] Bí mật nội bộ dẫn xuất `DJANGO_SECRET_KEY`; bí mật ngoài vào `.env.example` + `deployment.md`; token riêng của user mã hóa DB bằng `SecretCipher`.
- [ ] Chứng từ/hóa đơn/CSV/XLSX/XML bắt buộc `visibility="private"`; ảnh cho khách bắt buộc `public`; không trả storage URL thật của file riêng tư.
- [ ] Có phân tích trust boundary, chống IDOR, HMAC/replay, SSRF (nếu fetch URL người dùng nhập), rate limit và XSS.

## Frontend, UI/UX & i18n
- [ ] Tải dữ liệu 100% Client-side qua React Query + `signal`; không gọi API ngầm ở SSR.
- [ ] Cấu trúc file đúng `views/<model>/`, `components/<model>/`, `services/<model>.service.ts`, `permissions/<model>-permission.ts`, mỗi đơn vị một file; tách rõ Admin (`/quan-tri/...`) vs Portal (`/ca-nhan/...`).
- [ ] Đủ 3 tầng quyền (Menu, `ForbiddenView`, `useEditMode`); bảng dùng `DataTable` + `onView`/`onEdit`/`onDelete` + `can` + bulk + `useTableState`; form dùng `FormPage` trang riêng; tab dùng `useTabState`.
- [ ] Không dùng màu Tailwind cứng (màu mới phải khai token `--color-*` trong `globals.css`); dùng shadcn primitive, `<Image />`, `<Link />`, SVG trong `public/`, i18n đủ `vi`/`en`, không tiền tố `toannx` trong tên kỹ thuật.

## Test & Tài liệu
- [ ] File plan đặt đúng thư mục `docs/plans/<YYYY>/<MM>/<DD>/<ten>-plan.md` theo ngày lập (không nằm trực tiếp ở gốc `docs/plans/`).
- [ ] Test BE tách mỗi endpoint một file `test_<resource>_<action>_api.py` (không gộp CRUD, không tách file permission riêng) + `test_endpoint_access.py` + `test_list_query_count.py`.
- [ ] Test FE gồm Vitest + các test quy ước + E2E spec + kế hoạch kiểm tra giao diện thật `playwright-cli` (desktop/mobile 375px, light/dark, đa vai trò).
- [ ] Đã liệt kê đủ tài liệu cần cập nhật (`docs/modules/<m>/README.md`, `docs/features/`, `docs/common-catalog.md`, `.env.example`, `docs/guides/deployment.md`, `pnpm api:types`).
