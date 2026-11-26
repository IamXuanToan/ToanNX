---
name: create-plan
description: "Lập kế hoạch thiết kế và triển khai chi tiết (BE, FE, DB, phân quyền, bảo mật, free-tier, test, tài liệu) cho tính năng, module mới hoặc refactor lớn trong repo ToanNX và lưu vào docs/plans/<YYYY>/<MM>/<DD>/. Tự chọn khi người dùng yêu cầu lên plan, viết plan, lập kế hoạch hoặc thiết kế giải pháp trước khi code. Không dùng để viết code ứng dụng ngay (dùng start-task) hay kiểm toán plan đã có (dùng review-plan)."
---

# Lên plan thiết kế và triển khai chuẩn ToanNX

Skill này tự đủ để lập kế hoạch mới: `/create-plan` trong Claude Code hoặc `$create-plan` trong Codex, hoặc qua chat thường khi người dùng yêu cầu lên plan. Mọi kế hoạch được tạo/cập nhật mặc định lưu tại `docs/plans/<YYYY>/<MM>/<DD>/` (chia thư mục theo năm/tháng/ngày lập để dễ tra cứu theo ngày).

> **Nguyên tắc bắt buộc:**
> - **Không viết code ứng dụng hay chạy migration** khi người dùng chỉ yêu cầu lên plan.
> - **Không bịa đặt thông tin codebase**: mọi tên module, model, service, method, route, component, package hay biến env có sẵn đều phải kiểm chứng trong source trước khi đưa vào plan.
> - **`docs/rules/` thắng mọi giả định**: thiết kế phải tuân thủ tuyệt đối kiến trúc, phân quyền 3 tầng, bảo mật, ngân sách gói free và quy chuẩn UI/test của repo ngay từ trên giấy.

## 1. Nạp rule, tài liệu & khảo sát thực tế codebase

Trước khi phác thảo bất kỳ giải pháp nào, bắt buộc đọc theo thứ tự:

1. **Rule nền & cấu trúc hệ thống**:
   - `AGENTS.md`, `SYSTEM_CONTEXT.md`, `docs/README.md`, `docs/common-catalog.md`.
   - Đọc đầy đủ `docs/rules/common.md`, `docs/rules/backend.md`, `docs/rules/frontend.md`, `docs/rules/git.md`.
   - Đọc `.agents/rules/`: `00-core.md`, `01-workflow.md`, `90-done-checklist.md`, và chọn toàn bộ rule chuyên sâu liên quan (`10-backend.md`, `11-tests.md`, `20-frontend.md`, `21-frontend-ui.md`, `30-env-secrets.md`, `50-notifications.md`, `51-permissions.md`, `52-free-tier-infra.md`, `53-attachments.md`, `54-security-review.md`, `55-performance-review.md`).
2. **Tài liệu kiến trúc & tính năng liên quan**:
   - `docs/architecture/infrastructure.md` (ngân sách free tier), `authorization.md`, `authentication.md`, `i18n.md`, `testing.md`, `architecture.md`.
   - Các mô tả chức năng trong `docs/features/`: `permission-scope.md`, `permission-ui.md`, `table-actions.md`, `admin-navigation.md`, `attachment-visibility.md`, `web-push.md`.
   - `docs/modules/<m>/README.md` của module liên quan và các file đang có trong `docs/plans/` (duyệt cả thư mục con `<YYYY>/<MM>/<DD>/`) để tránh trùng lặp hoặc dùng nhầm thiết kế đã bị thay thế.
3. **Khảo sát codebase thực tế**:
   - Chạy `graphify query "<chủ đề>"` (nếu `graphify-out/graph.json` tồn tại), sau đó mở source thật kiểm:
     - Các module đang có ở `backend/app/` và `frontend/src/modules/` (xem định hướng Admin `/quan-tri` vs Client Portal `/ca-nhan` vs Public).
     - `docs/common-catalog.md` + file thực tế ở `backend/app/core/` và `frontend/src/shares/` để tái sử dụng trước, tránh thiết kế lại thứ đã có.
     - `backend/pyproject.toml`, `frontend/package.json`, `frontend/src/app/globals.css`, `backend/config/settings.py`, `backend/.env.example`, `frontend/.env.example`.
   - Nếu kế hoạch có phần giao diện/luồng người dùng, đọc `.agents/skills/ui-ux/SKILL.md` để thiết kế luồng, bố cục, wireframe và trạng thái dữ liệu nhất quán với `DESIGN.md` và shadcn/Tailwind v4.

## 2. Chốt phạm vi, quyết định và ngân sách hạ tầng

1. **Làm rõ điểm mơ hồ trước khi chốt cứng**:
   - Nếu yêu cầu có nhiều hướng thiết kế, dependency mới hoặc thay đổi lớn về dữ liệu/luồng, tạo mục **Quyết định cần chốt (`D1`, `D2`, ...)** gồm bảng so sánh phương án, ưu/nhược điểm, chi phí hạ tầng và phương án đề xuất kèm lý do (nếu thiếu thông tin nghiệp vụ không thể suy ra, hỏi người dùng ngắn gọn trước hoặc ghi rõ giả định cần duyệt trong plan).
   - Xác định rõ **Ngoài phạm vi (Non-goals)** để tránh phình scope khi triển khai.
2. **Kiểm soát Dependency mới**:
   - Theo `docs/rules/common.md` §2 & §5: tuyệt đối không tự mặc định thêm gói mới. Nếu cần thư viện ngoài `backend/pyproject.toml` hoặc `frontend/package.json`, phải tách riêng bảng **Dependency mới cần duyệt** (tên gói, lý do, giải pháp thay thế bằng gói sẵn có nếu có).
3. **Ước lượng ngân sách Free-tier (`docs/architecture/infrastructure.md`)**:
   - **Neon Free** (1 GB, 100 CU-giờ/tháng, tự ngủ sau 5 phút): đánh dấu rõ đường đọc công khai, cron, polling; thiết kế cờ Redis / cache để cron và lượt khách không đánh thức Neon khi chưa có việc.
   - **Vercel Hobby** (4 giờ Active CPU/tháng, serverless `@vercel/python` WSGI): không có worker chạy nền; tác vụ nặng/gửi ngoài phải đi qua outbox + QStash/cron; cảnh báo nếu có streaming dài trên WSGI.
   - **Upstash Redis** (500k lệnh/tháng): chỉ cache dữ liệu công khai, mọi khóa có TTL, không tiền tố `toannx`, luôn có nhánh dự phòng PostgreSQL khi Redis down.
   - **Cloudflare R2** (10 GB): tách rõ file `public` vs `private`.

## 3. Thiết kế kỹ thuật chi tiết đúng chuẩn ToanNX

Đối chiếu từng mục trong [bảng tự kiểm trước khi chốt plan](references/planning-checklist.md) khi thiết kế cả hai phía:

### 3.1 Backend (`url → view → service → repository → ORM`)
- **Module & `ModuleDescriptor`**: chọn đúng module hiện có hoặc khai quy cách module mới (`CoreModuleConfig`, `dependencies`, `member_permissions`, `notification_events`, `webhooks`, `callbacks`, `cleanup_tasks`).
- **Model & Migration**: một class một file (`models/<model>.py`, enum lồng trong model hoặc cùng file); kế thừa `(JournalTracker, CoreModel)` nếu cần lịch sử; **tránh `OneToOneField` trên model có `deleted_at`** (dùng `ForeignKey` + `UniqueConstraint(fields=[...], condition=Q(deleted_at__isnull=True))`); trường unique ngắn dùng `UniqueConstraint` có điều kiện; khai partial index (`condition=Q(deleted_at__isnull=True)`) cho `owner_field`; tiền tệ dùng `DecimalField`, thời gian UTC, đủ `verbose_name`, `help_text`, `db_comment`.
- **Service & Repository**: chỉ repository chạm ORM; mọi điểm vào (view, task, command, signal, webhook, middleware) chỉ gọi service đã khai trong `__init__`; method công khai của service không dùng `@staticmethod`/`@classmethod`. Service CRUD kế thừa `CoreCrudService` (`owner_field`, `manage_all_permission`, `owner_quota_setting`, `public_cache_namespace`).
- **View & Filter & OpenAPI**: chỉ dùng `CoreModelViewSet` hoặc `CoreApiView`; khai tường minh `action_permissions` (gồm `bulk_update`, `bulk_delete`, `history`, và `"create": DENY` cho ViewSet chỉ đọc có bulk POST), `action_rate_limits` (`settings.RATE_LIMITS`), `filterset_class` (`Core*InFilter` nhận nhiều giá trị), `search_fields`, `ordering_fields`, `serializers/validates/` & `serializers/responses/`, mã lỗi `<MODULE>_*` trong `constants/<m>_error_code.py`. Ghi nhớ bước `spectacular --validate --fail-on-warn` và `pnpm api:types`.
- **Phân quyền & `MEMBER`**: mỗi model một class `XxxPermission(PermissionCatalog)`; ghi rõ quyền nào vào `MEMBER` (tuyệt đối không đưa `manage_all`/`read_private` vào `MEMBER`); bản ghi người khác trả `404`; API không kiểm `is_staff`.
- **Thông báo, Bí mật & File**:
  - Thông báo chỉ phát qua `NotificationService.notify` (sự kiện khai trong `ModuleDescriptor`, `icon` + `details`, outbox + timeout ≤ 5s).
  - Bí mật nội bộ dẫn xuất `salted_hmac` từ `DJANGO_SECRET_KEY`; bí mật hệ thống vào `.env.example` + `deployment.md`; token bên thứ ba của từng người dùng lưu DB mã hóa bằng `SecretCipher` (API chỉ trả masked 4 ký tự cuối).
  - File chứng từ/hóa đơn/CSV/XLSX/XML bắt buộc `visibility="private"` (chỉ trả `/attachments/{id}/content`), ảnh khách xem bắt buộc `public`.

### 3.2 Frontend (`page → View → component/hook → module hook → service → apiClient`)
- **Client-only & Kiến trúc lớp**: mọi trang tải dữ liệu 100% ở Client qua React Query + `signal` (cấm SSR fetch ngầm); View chỉ dùng `usePermission`, `useTranslations`, `useEditMode`; phân chia `views/<model>/`, `components/<model>/`, `components/<model>/hooks/`, `services/<model>.service.ts`, `permissions/<model>-permission.ts`, mỗi đơn vị một file; không `views/hooks/`, không nhóm `shared`/`common` trong module.
- **Route & Navigation**: tách rõ URL Admin (`/quan-tri/<module-vi>/...` ↔ `/admin/<module-en>/...` qua `<M>_PATHNAMES`, đăng ký `ADMIN_MODULE_NAVIGATION`, chia `section` khi > 5 mục) vs URL Portal (`/ca-nhan/...`) vs URL công khai. Không nhầm lẫn hay rò menu nội bộ sang nơi không được phép.
- **UI chuẩn & Trạng thái**: tái sử dụng `DataTable` (`onView`/`onEdit`/`onDelete` + `can`, `onBulkDelete`, `bulkStatus` qua `useBulkActions`, `TableBulkBar` 1 dòng, `useTableState`), `FormPage` + `FormLayout` + `FormSection` + `FormActions` cho tạo/sửa/chi tiết (không dùng Dialog cho CRUD chính), `useEditMode` + `EditModeProvider` (chi tiết mặc định chỉ xem), `useTabState` đồng bộ `?tab=...`, `SelectField`, `FilterSelect`, `QueryErrorState`, `ConfirmDialog`, `AttachmentPicker`, `TiptapEditor`/`TiptapContent`.
- **Token màu, Primitive, Asset & i18n**: mọi màu ngữ nghĩa dùng token `--color-*` (nếu cần màu mới phải chỉ định rõ việc thêm `--color-<tên>` vào `:root`, `.dark`, `@theme inline` của `frontend/src/app/globals.css` — không dùng class màu Tailwind mặc định như `bg-amber-500`/`text-purple-600`); dùng primitive `@/shares/components/ui/*`, `<Image />`, `<Link />` từ `@/i18n/navigation`, SVG trong `public/`, i18n đủ `vi`/`en` + `messages.ts` + `global.d.ts` + `journal-field-prefixes.ts`. Không tiền tố `toannx` trong tên kỹ thuật.

### 3.3 Ranh giới an toàn, Xử lý biên & Kiểm thử
- Xác định trust boundary: IDOR/owner, webhook HMAC/replay, SSRF nếu backend gọi URL do người dùng nhập, rate limit, timeout dịch vụ ngoài, edge case ngày/giờ/tiền tệ/múi giờ UTC+7.
- Kế hoạch kiểm thử rõ từng file: BE mỗi endpoint đúng 1 file `test_<resource>_<action>_api.py` (phủ `full_data`, `min_data`, `validation_errors`, `401`, `403`, `owner_isolation`, envelope/status, list features) + `test_endpoint_access.py` + `test_list_query_count.py`; FE gồm Vitest + các unit test quy ước (`one-unit-per-file`, `module-structure`, `table-conventions`, `module-registry`, `theme-tokens`, `messages`, `api-contract`, `code-conventions`) + E2E spec + kiểm tra `playwright-cli` (desktop/mobile 375px, light/dark, keyboard, đa vai trò).

## 4. Định dạng, tự kiểm và lưu file tại `docs/plans/<YYYY>/<MM>/<DD>/`

1. Tổ chức nội dung theo [khung mẫu plan chuẩn](references/plan-template.md), viết tiếng Việt có dấu rõ ràng, ngắn gọn, có sơ đồ/bảng đối chiếu cụ thể.
2. Lưu plan tại `docs/plans/<YYYY>/<MM>/<DD>/<ten-kebab-case>-plan.md` theo ngày lập (ví dụ `docs/plans/2026/11/25/personal-assistant-plan.md`, hoặc tên file trong thư mục ngày tương ứng do người dùng chỉ định; tuyệt đối không lưu trực tiếp ở gốc `docs/plans/`). Đặt trạng thái đầu file rõ ràng (ví dụ: `Trạng thái: **Nháp — chờ review và chốt quyết định**`).
3. Tự rà lại toàn bộ plan vừa viết bằng [bảng tự kiểm trước khi chốt plan](references/planning-checklist.md) để đảm bảo không sót mục nào.
4. Báo cáo ngắn gọn đường dẫn file plan đã tạo/cập nhật, tóm tắt các quyết định cần người dùng chốt (`D1`, `D2`...), dependency mới (nếu có) và gợi ý chạy `review-plan` để phản biện chéo trước khi triển khai bằng `start-task`. Không tự stage/commit/push Git; nếu worktree có thay đổi chưa commit, cung cấp khối commit text chuẩn `docs/rules/git.md` khi kết thúc.
