# Bảng nghiệm thu task mới

Áp các hàng liên quan, đối chiếu source và tài liệu thực tế. Đánh dấu không áp dụng cho phần khác; bảng không cho phép chạy toàn bộ test suite.

| Phần | Trước khi viết | Trước khi bàn giao |
| --- | --- | --- |
| API/BE | Đọc base `app/core`, route/view/service/repository tương tự, serializer, quyền, owner và contract lỗi. | Test đúng file từng endpoint/action: full/min data, validation, 401/403, owner/404, status/envelope; query-count list; OpenAPI và API types nếu đổi. |
| Model/migration | Kiểm `CoreModel`, soft delete, `JournalTracker`, index/unique và dữ liệu cũ. | Migration, serializer, test và docs module khớp; không migrate production để nghiệm thu. |
| Module mới | Đọc module cùng loại, `ModuleDescriptor`, registry, `MEMBER`, event, webhook/callback. | Đăng ký BE/FE, URL vi/en, navigation, i18n, quyền, test convention/registry và `docs/modules/<m>/README.md`. |
| Quyền BE–FE | Đọc `docs/features/permission-scope.md` và `permission-ui.md`; liệt kê `READ/CREATE/UPDATE/DELETE`, `MEMBER`, owner, `manage_all`, `read_private`. | Mỗi quyền BE có file FE tương ứng; test 401/403/404 và owner; menu/View/action khóa/ẩn đúng ba tầng, màn chi tiết mặc định chỉ xem. |
| Bảng và form | Đọc `docs/features/table-actions.md`, common `DataTable`, `useBulkActions`, `FormPage`, `FormDialog`. | Xem/Sửa/Xóa + `can`, chọn nhiều/bulk delete/status khi áp dụng; form create/edit/view dùng chung, validation và feedback. |
| FE/Next | Đọc common `src/shares/`, view/hook/service tương tự, route, i18n và `docs/rules/frontend.md`. | Client-only React Query + `signal`, ba tầng quyền, vi/en, shadcn/Tailwind/Image/Link/SVG, test liên quan. |
| I18n và URL | Chốt namespace, key vi/en, pathname quản trị có tiền tố module và public route. | Chuỗi hiển thị/aria/tooltip/error có cả vi/en; định dạng số/ngày/tiền theo locale; route và test link khớp. |
| UI | Xác định trạng thái và hành động theo quyền trước khi dựng. | Xem desktop/mobile, keyboard/focus, loading/empty/error/forbidden/success, dialog, bảng/bulk, console/Network nếu có môi trường. |
| Bảo mật | Xác định trust boundary, quyền/owner, secret, dữ liệu riêng tư. | Kiểm nhánh từ chối, validation, rate limit, webhook/file visibility; không log hay trả bí mật. |
| File/ảnh/SVG | Xác định ảnh công khai hay chứng từ riêng tư, đường dẫn truy cập, tên và alt text. | Không lộ storage URL file riêng tư; ảnh dùng `next/image`, SVG trong `public/`, tên/alt sửa được khi áp dụng. |
| Notification/tích hợp ngoài | Đọc `ModuleDescriptor`, `NotificationService.notify`, outbox, guide dịch vụ ngoài. | Event có scope/audience/permission, OWNER có recipient, request không gọi SMTP/FCM/Telegram trực tiếp; timeout, webhook/callback được khai báo. |
| Hiệu năng | Xác định đường nóng, chi phí DB/Redis/R2 theo `docs/architecture/infrastructure.md`. | Kiểm N+1/query-count, request trùng, ảnh/bundle; đo thực nếu khẳng định tốc độ cải thiện. |
| Test và chất lượng | Chọn đúng endpoint test, Vitest hoặc E2E của luồng; kiểm test convention hiện có. | Format/lint/typecheck file sửa; test hành vi và nhánh lỗi; PostgreSQL local `--reuse-db`; không chạy full suite nếu chưa được yêu cầu. |
| Docs/config | Xác định tài liệu module/feature, env và common bị chạm. | Cập nhật docs, `.env.example`, catalog, API types cùng lần; nếu người dùng đặt rule mới chưa có trong `docs/rules/`, tự động cập nhật `docs/rules/`, `.agents/rules/`, `AGENTS.md`/`CLAUDE.md`/`prompt.md` và `sync-ai-rules.py --check`; ghi phần chưa xác minh. |
| Bàn giao | Không tự thao tác Git và không tự gợi ý commit khi chưa được yêu cầu. | Báo việc đã làm, tài liệu và giới hạn; chỉ xuất khối commit `text` (`commit-demo`) hoặc commit/push (`commit-push`) khi người dùng yêu cầu, tuyệt đối không thêm `Co-Authored-By:`. |
