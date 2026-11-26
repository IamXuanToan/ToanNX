---
name: review-plan
description: "Thẩm định và review kỹ lưỡng các file plan trong docs/plans/ (cấu trúc <YYYY>/<MM>/<DD>/) của repo ToanNX bằng cách đọc đầy đủ docs/rules/, .agents/rules/, SYSTEM_CONTEXT.md, docs/common-catalog.md, tài liệu kiến trúc/tính năng và đối chiếu source code thực tế để phát hiện sai rule, hổng kiến trúc, rủi ro bảo mật/quyền/free-tier, thiếu edge case và mâu thuẫn nội tại."
---

# Review và thẩm định Plan chuẩn ToanNX

Skill này tự đủ để thẩm định plan: `/review-plan` trong Claude Code hoặc `$review-plan` trong Codex, hoặc qua chat thường khi người dùng yêu cầu review plan trong `docs/plans/` (tổ chức theo `<YYYY>/<MM>/<DD>/`).

> **Nguyên tắc sắt khi review:**
> - **Đọc toàn văn trước khi nhận xét**: tuyệt đối không review theo trí nhớ hay lướt tiêu đề. Phải đọc hết plan, đọc lại đúng các file rule/tài liệu liên quan và đối chiếu thẳng vào source code thật.
> - **Mọi phát hiện phải có bằng chứng 2 chiều**: chỉ rõ `Vị trí trong plan (mục/dòng)` ↔ `Rule / Tài liệu / File source thật (đường dẫn:dòng)`, nêu rõ tác động khi triển khai và phương án sửa cụ thể đúng chuẩn ToanNX.
> - **Khách quan, thẳng thắn, không bỏ qua lỗi nhỏ làm gãy CI**: nếu plan có lỗi sai rule, giả định sai về codebase hay nguy cơ vượt hạn mức gói free, phải chỉ rõ mức độ (`Blocker` / `Major` / `Minor`), không nói chung chung.

## 1. Xác định mục tiêu và nạp toàn bộ quy chuẩn + source thực tế

Nếu người dùng không chỉ định file cụ thể, tìm file plan đang mở hoặc mới thêm/sửa trong `docs/plans/<YYYY>/<MM>/<DD>/` (qua ngữ cảnh hội thoại và `git status`); nếu vẫn chưa rõ file nào trong nhiều file, hỏi ngắn gọn trước khi review sâu.

Thực hiện đọc đầy đủ theo thứ tự:

1. **File plan mục tiêu**: đọc từ đầu đến cuối file trong `docs/plans/<YYYY>/<MM>/<DD>/`. Nếu plan nhắc tới hoặc nối tiếp plan khác trong `docs/plans/` (như `2026/11/21/finance-refactor-plan.md`, `2026/11/22/notification-system-plan.md`, `2026/11/15/system-standardization-plan.md`), đọc luôn phần liên quan để phát hiện tham chiếu lỗi thời hoặc xung đột.
2. **Toàn bộ bộ rule chuẩn của repo**:
   - `AGENTS.md`, `SYSTEM_CONTEXT.md`, `docs/README.md`, `docs/common-catalog.md`.
   - `docs/rules/common.md`, `docs/rules/backend.md`, `docs/rules/frontend.md`, `docs/rules/git.md`.
   - Các rule AI trong `.agents/rules/`: `00-core.md`, `01-workflow.md`, `10-backend.md`, `11-tests.md`, `20-frontend.md`, `21-frontend-ui.md`, `30-env-secrets.md`, `40-docs-and-rules.md`, `50-notifications.md`, `51-permissions.md`, `52-free-tier-infra.md`, `53-attachments.md`, `54-security-review.md`, `55-performance-review.md`, `90-done-checklist.md`.
3. **Tài liệu kiến trúc & mô tả chức năng liên quan**:
   - `docs/architecture/infrastructure.md`, `authorization.md`, `authentication.md`, `i18n.md`, `testing.md`, `architecture.md`.
   - Các file `docs/features/*.md`: `permission-scope.md`, `permission-ui.md`, `table-actions.md`, `admin-navigation.md`, `attachment-visibility.md`, `web-push.md`.
   - `docs/modules/<m>/README.md` của mọi module bị ảnh hưởng hoặc được plan gọi tới.
4. **Đối chiếu trực tiếp codebase thực tế (Fact-check)**:
   - Chạy `graphify query` (nếu `graphify-out/graph.json` tồn tại) và mở source thật để kiểm chứng mọi tên mà plan nhắc tới:
     - Module ở `backend/app/` và `frontend/src/modules/` (ví dụ kiểm cấu trúc thực tế của `portal`, `system`, `finance`, `utilities`, `novel`, `manage-app`).
     - Các service/method/model/field được plan giả định đã có sẵn (tránh tình trạng plan gọi tên class/method không tồn tại hoặc đã bỏ ở refactor trước).
     - `backend/pyproject.toml`, `frontend/package.json` (kiểm gói nào thật sự có sẵn, phiên bản nào, gói nào là dependency mới cần duyệt).
     - `frontend/src/app/globals.css` (kiểm token `--color-*` thực tế), `backend/config/settings.py`, `backend/.env.example`, `frontend/.env.example`.

## 2. Thẩm định kỹ theo 12 trục kiểm toán

Đọc và rà soát từng hạng mục liên quan trong [ma trận kiểm toán plan 12 trục](references/review-plan-matrix.md). Đánh dấu nội bộ *Không áp dụng* cho mục ngoài phạm vi thay vì ép thành lỗi:

1. **Khớp thực tế Codebase, Plan cũ & Dependency (`Fact-check`)**: kiểm tra tên model/service/method/route/package/env có thật hay bị bịa/lệch bản cũ; phát hiện dependency mới chưa đưa vào danh sách xin duyệt.
2. **Tái sử dụng Common & Kiểm soát Phạm vi**: đối chiếu `docs/common-catalog.md` để bắt lỗi tự chế lại component/hook/service nền (`AttachmentService`, `SecretCipher`, `NotificationService`, `DataTable`, `FormPage`, `FilterSelect`, `SelectField`, `useTableState`, `useTabState`, `useBulkActions`...).
3. **Kiến trúc & Quy chuẩn Backend**: lớp `url → view → service → repository → ORM`, DI trong `__init__`, 1 class/file, `CoreModelViewSet`/`CoreApiView`/`CoreCrudService`/`CoreRepository`, `ModuleDescriptor`, soft-delete với `OneToOneField`/`unique=True` ngắn, partial index, `DecimalField`, UTC, `bulk_delete_enabled`/`bulk_update_serializer_class`, `Core*InFilter`, `action_rate_limits`.
4. **Kiến trúc, Cấu trúc File & Quy chuẩn Frontend**: 100% Client-side React Query + `signal` (cấm SSR fetch ngầm), View mỏng, phân nhóm theo model, 1 đơn vị/file, không `views/hooks/` hay `shared`, `DataTable` + `useTableState`, `FormPage` trang riêng vs dialog, `useTabState`, token màu `--color-*` trong `globals.css` (bắt buộc không hardcode class màu Tailwind như `bg-amber-500`/`text-purple-600`), shadcn primitive, `<Image />`, `<Link />` từ `@/i18n/navigation`, SVG trong `public/`, URL quản trị vs Portal.
5. **Phân quyền Ba tầng, `MEMBER` & Cô lập Chủ sở hữu**: `XxxPermission` riêng từng model, `MEMBER` không chứa `manage_all`/`read_private`, kiểm tra rủi ro admin có `manage_all` đọc dữ liệu cá nhân nhạy cảm (nếu plan tuyên bố "100% riêng tư"), `404` owner isolation, API không check `is_staff`, Menu → `ForbiddenView` → `useEditMode` & `can` trong bảng, tránh bắn 403 ngầm từ option hooks.
6. **Bảo mật, Bí mật, Tệp & Ranh giới Tin cậy**: phân loại secret (`salted_hmac` vs env ngoài vs `SecretCipher`), file `private` vs `public` (`visibility="private" lockVisibility`, không lộ storage URL thật), chống SSRF (nếu có uptime monitor / fetch URL người dùng nhập), xác thực webhook/Telegram/cron (`CRON_SECRET`, `X-Telegram-Bot-Api-Secret-Token`, HMAC ±300s), rate limit, chống XSS/prompt injection/rò dữ liệu nhóm chat.
7. **Hạ tầng Free-tier & Hiệu năng**: tính toán thực tế CU-giờ Neon (cron định kỳ 15 phút hay polling có làm Neon không ngủ được không?), Vercel Active CPU và giới hạn SSE streaming trên `@vercel/python` WSGI, Upstash Redis (500k lệnh/tháng, fallback khi Redis down, không cache admin/session), QStash, R2, N+1 query.
8. **Thông báo & Dịch vụ Ngoài**: bắt buộc qua `NotificationService.notify` + `ModuleDescriptor.notification_events` (không tự gửi Telegram/email trực tiếp ngoài kiến trúc outbox, trừ lý do có duyệt), `dedup_key`, `icon`/`details`, timeout ≤ 5s.
9. **Đa ngôn ngữ (i18n), URL & Hợp đồng API**: namespace `messages.ts` + `global.d.ts`, `vi`/`en`, mã lỗi `<MODULE>_*` + dịch vi/en, `journal-field-prefixes.ts`, helper định dạng số/tiền, `spectacular --validate --fail-on-warn`, `pnpm api:types`, không tiền tố `toannx`.
10. **Tính đầy đủ của Kế hoạch Kiểm thử**: mỗi endpoint BE đúng 1 file `test_<resource>_<action>_api.py` (không gộp CRUD, không tách permission riêng) + `test_endpoint_access.py` + `test_list_query_count.py`; FE Vitest + các unit test quy ước + E2E + kiểm UI thật `playwright-cli`.
11. **Lỗ hổng Logic Nghiệp vụ, Edge Case & Mâu thuẫn Nội tại**: soi chéo ER diagram ↔ mô tả field ↔ API ↔ FE route ↔ Test matrix; rà edge case múi giờ UTC vs UTC+7, ngày lặp cuối tháng, đa tiền tệ, đồng thời/race condition, cắt ngữ cảnh/token AI, quy trình chuyển trạng thái.
12. **Lộ trình Triển khai & Tài liệu đi kèm**: thứ tự phase không phụ thuộc ngược, bước migration (`sqlmigrate`), `seed_roles`, `.env.example`, `docs/guides/deployment.md`, `docs/modules/<m>/README.md`, `docs/features/*.md`, `docs/common-catalog.md`, `docs/README.md`.

## 3. Xuất báo cáo thẩm định & tùy chọn sửa plan

Trình bày báo cáo hoàn toàn bằng **tiếng Việt có dấu** (giữ nguyên tên file, mã, API và lệnh) theo cấu trúc:

1. **Kết luận tổng quan**: `ĐẠT (Sẵn sàng triển khai)` / `CẦN BỔ SUNG` / `KHÔNG ĐẠT (Có Blocker cần sửa trước khi code)`, kèm bảng đếm `🔴 Blocker` / `🟠 Major` / `🟡 Minor`.
2. **Điểm làm tốt & Đối chiếu Fact-check**: nêu ngắn gọn phần plan đã bám chuẩn và bảng các thực thể trong plan đã đối chiếu khớp/lệch với source thật.
3. **Danh sách phát hiện chi tiết (sắp theo mức độ: `🔴 Blocker` → `🟠 Major` → `🟡 Minor`)**:
   - Mỗi phát hiện bắt buộc ghi đủ 4 phần:
     - **Vị trí trong plan**: `<tên file plan>:<dòng / mục>`
     - **Đối chiếu chuẩn**: `<rule / doc / source file:dòng>`
     - **Vấn đề & tác động**: giải thích rõ bản chất lỗi, test/cổng CI nào sẽ fail hoặc rủi ro sản xuất nào sẽ xảy ra.
     - **Đề xuất sửa cụ thể**: hướng chỉnh thẳng vào nội dung plan.
4. **Quyết định / Câu hỏi còn mở cần người dùng chốt** (nếu có).
5. **Bước tiếp theo**:
   - Nếu người dùng chỉ yêu cầu review: hỏi rõ có muốn AI cập nhật thẳng các điểm sửa này vào `docs/plans/<YYYY>/<MM>/<DD>/<ten>.md` hay chốt lại các phương án mở trước.
   - Nếu người dùng đã yêu cầu review **và sửa luôn plan**: cập nhật trực tiếp file plan, rà soát lại một lượt bằng chính 12 trục trên để xác nhận sạch `Blocker`, không tự thao tác Git, đọc `git status`/`git diff` (chỉ đọc) và trả khối commit text `docs(...): ...` chuẩn `docs/rules/git.md`.
