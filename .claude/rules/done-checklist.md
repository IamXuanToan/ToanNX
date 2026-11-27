<!-- Sinh tự động từ .agents/rules/90-done-checklist.md bằng scripts/sync-ai-rules.py. Không sửa tay. -->

# Bảng kiểm trước khi báo xong

Tự chạy trước **mọi báo cáo hoàn thành**, không đợi người dùng gọi lệnh. Áp dụng cho **từng file đã mở hoặc sửa**
trong lần làm việc; mục không liên quan thì bỏ qua. Vi phạm thì sửa luôn; không sửa được thì ghi vào báo cáo
kèm lý do. Bản đầy đủ: `prompt.md` mục 5.

## Backend

- [ ] Một class cấp module mỗi file (trừ APIView cặp, model + enum); serializer/dataclass/exception không lẫn file.
- [ ] Điểm vào chỉ gọi service; service không `Model.objects`; module không import repository module khác.
- [ ] Service/repository khai trong `__init__`; không `XxxService().x()` trong method; method công khai không static.
- [ ] View có `@require_permission`/`permission_classes` đúng bảng; `@rate_limit` và `action_rate_limits` dùng `StrEnum` (`*RateLimitKey` tách hằng `ModuleCode`/nhóm/`RateLimitAction`, không chuỗi thô); input `@validate_request`, output serializer response.
- [ ] `destroy` → `bulk_delete_enabled`; cờ boolean → bulk-update; ViewSet chỉ đọc mở `post` → `"create": DENY`.
- [ ] Thông báo chỉ qua `notify`, có `icon`/`details` hợp lý; không gọi dịch vụ ngoài trong request; có timeout; hệ thống chỉ dùng 1 bot Telegram qua ENV (`TELEGRAM_BOT_TOKEN`/`TELEGRAM_BOT_USERNAME`), AI hỗ trợ fallback model.
- [ ] Webhook/callback khai trong `ModuleDescriptor`; không hardcode domain.
- [ ] Bí mật đúng chỗ (dẫn xuất `DJANGO_SECRET_KEY` / env riêng / `SecretCipher`); `.env.example` cập nhật.
- [ ] Đổi thứ vào OpenAPI (kể cả docstring view/method) → đã chạy `pnpm api:types`.
- [ ] Test đúng file, DB local `--reuse-db`; endpoint mới có test riêng và có trong `test_endpoint_access` nếu cần.
- [ ] Nếu sửa luồng nhạy cảm, đã kiểm đầu vào, quyền/owner và nhánh từ chối bằng test liên quan.
- [ ] Nếu sửa đường nóng, đã đo/query-count liên quan, kiểm cache/Redis khi có đổi và có bằng chứng trước/sau.
- [ ] Endpoint mới: một file test cho mỗi action, bao phủ dữ liệu đủ/tối thiểu/sai, 401/403, owner, envelope/status; danh sách có query-count.

## Frontend

- [ ] Một component/hook/class mỗi file; không hook trong `.tsx`; context tách ba file.
- [ ] File nằm đúng `components/<model>/` (+ `hooks/`) và `views/<model>/`; không `views/hooks/`, không `shared`.
- [ ] View chỉ `usePermission`/`useTranslations`/`useEditMode`; component không gọi service/`apiClient` trực tiếp.
- [ ] Primitive shadcn, `AppTooltip`/shadcn `Tooltip` (không dùng thuộc tính HTML `title=` thô trên thẻ DOM hay `Button`/`Badge`/`Link`/`Image`), control `h-10`, `SelectField`/`FilterSelect`/`DataTable`/`FormPage`, chuỗi qua i18n.
- [ ] Trang tải dữ liệu ở Client qua React Query → service → `apiClient`; `page.tsx` không gọi API ngầm ở server.
- [ ] Link dùng `<Link />` từ `@/i18n/navigation` (không `next/link` trong module), ảnh dùng `<Image />`; không
      `<a>`/`<img>` trần; không hardcode locale/timezone/tiền tệ/toast, `queryKey` chuỗi thô, mã lỗi auth hay chuỗi quyền ngoài `constants/`/`permissions/` (`createResourcePermissions` + `PERMISSION_ACTION`, `code-conventions.test.ts`).
- [ ] Người tạo/chủ sở hữu/người dùng dùng `formatUserDisplayName` / `formatOwnerDisplayName` (`fullname (username)` hoặc `username`); mốc thời gian dùng `<TimestampText />` / `formatDateTimeWithRelative` (`dd/MM/yyyy HH:mm:ss (thời gian đếm)`), cột chỉ có ngày dùng `formatExplicitDate` (`dd/MM/yyyy`).
- [ ] Model có `JournalTracker` trên trang `[id]` (Admin & Portal) đều có tab `?tab=history` qua `RecordDetailTabs` + `RecordHistoryView` / `ActivityTimeline` (kèm dịch field/enum), và `<FormPage backHref=...>` + `<FormBackButton />` để giữ nút `Quay lại` khi đổi tab.
- [ ] Request React Query truyền `signal` xuống `apiClient`; loading/error/empty/forbidden có trạng thái đúng.
- [ ] Bảng đủ `onView`/`onEdit`/`onDelete` + `can`; có Xóa → bulk delete; cờ boolean → `bulkStatus`.
- [ ] Màu có token `--color-*`; dialog `p-0` → footer `mx-0 mb-0`; SVG trong `public/`.
- [ ] Form và bảng kiểm bàn phím, nhãn trường, tooltip nút bị khóa, desktop/mobile và i18n.
- [ ] Không `any`, `console.log`, `process.env` ngoài `shares/config`; không tiền tố `toannx` trong key.

## Tài liệu và kiểm tra

- [ ] `docs/modules/<m>/README.md`, `docs/features/*.md`, `docs/common-catalog.md` khớp code.
- [ ] Đã cập nhật `docs/reports/code-audit-tracker.md` qua `scripts/audit_tracker.py` (`mark-changed` khi sửa/thêm file hoặc `mark-checked` khi xong audit).
- [ ] Đổi `docs/rules/` → đã sửa rule AI trong `.agents/rules/` và chạy `python scripts/sync-ai-rules.py`.
- [ ] `CLAUDE.md` ↔ `AGENTS.md` khớp; `prompt.md` cập nhật nếu đổi quy trình/bảng kiểm; nếu người dùng có rule/quy chuẩn mới chưa có trong tài liệu, đã tự động cập nhật vào `docs/rules/` + `.agents/rules/` + `AGENTS.md`/`CLAUDE.md`/`prompt.md` và chạy `sync-ai-rules.py --check`.
- [ ] Đã chạy lint/type/test của phần sửa; ghi rõ phần chưa kiểm (đặc biệt giao diện thật).
- [ ] Việc UI/luồng đã đổi có test liên quan, Playwright mở UI thật, ảnh chụp đã được xem, đã kiểm responsive,
      trạng thái, tương tác, console và network; nếu không thể chạy thì ghi rõ lý do.
- [ ] Skill được chọn đúng việc: bảo mật khi được yêu cầu; `vitest` cho unit FE; `playwright-best-practices` cho
      spec E2E; `django-perf-review` cho rà Django; `web-perf` cho đo trang thật; không dùng skill để ghi đè rule repo.
- [ ] Workflow chính đúng mục đích: `start-task` cho việc mới, `fix` cho lỗi, `review-code` chỉ khi được yêu cầu
      rà cuối; mỗi skill đã đọc source và `docs/` liên quan, review cuối đã tự sửa lỗi xác nhận được và kiểm lại.
      Nếu sửa skill workflow, `python scripts/check-workflow-skills.py` đã đạt.
- [ ] Trước việc đã đọc rule `always_on`, chọn rule `model_decision` theo nghĩa yêu cầu, nạp rule `glob` khi file khớp;
      skill cần dùng đã có ở cả `.agents/skills/` và `.claude/skills/` hoặc đã cài vào project.
- [ ] Không tự thao tác Git và không tự gợi ý nội dung commit khi chưa được yêu cầu; nếu có soạn/tạo commit
      (`commit-demo` / `commit-push`), nội dung đúng `docs/rules/git.md` và tuyệt đối không có `Co-Authored-By:` hay
      nguồn AI bên ngoài.
