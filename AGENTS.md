# AGENTS.md — ToanNX

Đọc theo thứ tự trước khi viết code:

1. [SYSTEM_CONTEXT.md](SYSTEM_CONTEXT.md) — bối cảnh và quyết định đã chốt.
2. [docs/rules/common.md](docs/rules/common.md) — rule chung (code sạch, bảo mật, API contract, test).
3. [docs/rules/backend.md](docs/rules/backend.md) — Django: `url → view → service → repository`, base trong `app/core`.
4. [docs/rules/frontend.md](docs/rules/frontend.md) — Next.js: `page → view → component+hook → hook → service`.
5. [docs/rules/git.md](docs/rules/git.md) — tên nhánh, commit và quy trình push.
6. [docs/common-catalog.md](docs/common-catalog.md) — danh mục common BE + FE đang có (tra trước khi viết).

Tài liệu chi tiết: [docs/architecture.md](docs/architecture.md), [docs/authentication.md](docs/authentication.md),
[docs/authorization.md](docs/authorization.md), [docs/i18n.md](docs/i18n.md), [docs/deployment.md](docs/deployment.md),
[docs/testing.md](docs/testing.md). Lý do của các chuẩn: [docs/plans/system-standardization-plan.md](docs/plans/system-standardization-plan.md).

Mẫu prompt giao việc cho agent: [prompt.md](prompt.md).

## Quy tắc cốt lõi

- **Đồng bộ `AGENTS.md` ↔ `CLAUDE.md`**: sửa file này thì sửa luôn phần tương ứng trong `CLAUDE.md` (và ngược
  lại) trong cùng lần đó; nội dung rule hai file phải khớp. Đổi rule trong `docs/rules/` có tóm tắt ở đây thì
  cập nhật cả hai.
- **Không tự thao tác git**: không tạo nhánh, commit, push, merge, xóa nhánh khi chưa được yêu cầu rõ; làm trên
  nhánh hiện tại, chỉ gợi ý câu commit khi được hỏi.
- **Một file một đơn vị**: mỗi class, component, hook một file (kể cả phần không export). Ngoại lệ: file APIView
  chứa `XxxView` + `XxxObjectView`; file model chứa model + enum của chính model đó; `shares/components/ui/*` của
  shadcn; export đặc biệt của Next trong `page.tsx`/`layout.tsx`. Class lồng trong class cha (`Meta`, enum trong
  model) được chấp nhận ở toàn hệ thống. Chi tiết: rule backend §2.2, rule frontend §2.1.
- **Đúng lớp ở mọi điểm vào**: view, task, command, signal, middleware, authentication, permission, recorder chỉ gọi
  service, không gọi repository/ORM. Service/repository được dùng phải khai trong `__init__` (`self.<tên>_service`),
  không gọi `XxxService().method()`/`XxxService.method()` trong method (rule backend §1, §4, §5.2).
- **Mở file nào, kiểm rule file đó**: thấy vi phạm trong file đang mở/sửa thì sửa luôn và ghi vào báo cáo; sửa lan
  sang nhiều file hoặc đổi contract API thì báo trước.
- **Dùng common có sẵn, giữ danh mục cập nhật**: tra [docs/common-catalog.md](docs/common-catalog.md) trước khi
  viết; đã có thì dùng, gần giống thì mở rộng, không viết bản thứ hai. Thêm/đổi tên/xóa/đổi công dụng common
  (`app/core/`, `src/shares/`, phần dùng chung của `system`/`manage-app`) thì sửa danh mục trong cùng lần
  (rule chung mục 3.3).
- **SVG để trong `public/`, gọi theo đường dẫn**: lưu `frontend/public/<nhóm>/<tên>.svg`, hiển thị bằng
  `<Image src={ICON_PATHS.google} />` (hằng ở `shares/lib/asset-paths.ts` hoặc `constants/asset-paths.ts` của module);
  không viết `<svg>`/`<path>` trong `.tsx`, không component bọc SVG nội tuyến, không data URI SVG (rule frontend §3.2).
- **Không tiền tố `toannx` trong tên kỹ thuật**: tên cookie, key localStorage/sessionStorage, tên biến/hằng giữ
  các key đó, header, query/cache key, biến môi trường không có `toannx_`/`toannx-`/`toannx:`/`TOANNX_`
  (`access_token`, `novel_reader_settings`, `READER_SETTINGS_KEY`). Tên dự án chỉ ở nội dung hiển thị, domain,
  tên DB, dữ liệu seed (rule chung mục 3).
- **Chỉ kiểm tra phần đã sửa**: format/lint/typecheck file đã sửa và test liên quan (BE đúng file
  `test_<resource>_<action>_api.py`, FE đúng file Vitest/spec E2E của luồng). Chạy toàn bộ (`scripts/check-all.*`,
  `pnpm e2e` đầy đủ) chỉ khi người dùng yêu cầu (rule chung mục 7).
- Làm đúng phạm vi, không thêm dependency khi chưa được đồng ý; docstring/comment tiếng Việt.
- **`graphify update .` chỉ chạy khi thay đổi lớn** (thêm/xóa/gộp module, đổi cấu trúc thư mục, di chuyển/đổi tên
  khoảng 10 file trở lên, refactor kiến trúc) **hoặc graph đã cũ** (`graphify-out/graph.json` quá 7 ngày, hay
  `graphify query` trả về file/symbol không còn). Sửa nhỏ thì không chạy.

## Thêm module mới (ví dụ `links`) — chỉ khai báo theo base

Backend:
1. `uv run python manage.py startapp links app/links`; `apps.py` kế thừa `CoreModuleConfig`
   (`default = True`, `name = "app.links"`, `label = "links"` = mã module).
2. `permissions/<model>_permission.py` (PermissionCatalog cho từng model riêng biệt, mỗi model 1 file, không gộp chung; mỗi quyền có name + description; mã dạng `<module>.<resource>.<action>`),
   `constants/<module>_error_code.py` (StrEnum mã lỗi riêng, thêm bản dịch FE — test bắt nếu thiếu), `module.py`
   (`ModuleDescriptor(..., permissions=(*ModelAPermission.all(), *ModelBPermission.all()), dependencies=..., cleanup_tasks=...)`).
   Module mới tự có vai trò `<MÃ_MODULE>_MANAGER`/`<MÃ_MODULE>_VIEWER` khi chạy `uv run python manage.py seed_roles`
   (không khai vai trò riêng trong code).
3. Model kế thừa `CoreModel`; muốn có lịch sử thay đổi thì thêm `JournalTracker` **trước** `CoreModel`
   (`class Link(JournalTracker, CoreModel)`, tùy chọn `journal_fields`/`journal_masked_fields`). Index owner có
   điều kiện `deleted_at IS NULL`. `makemigrations`.
4. Repository kế thừa `CoreRepository`, chỉ ghi đè `get_queryset` bằng `super().get_queryset()` +
   `select_related`/`prefetch_related` đủ cho serializer (base đã ẩn bản xóa mềm; không N+1). Xóa mặc định là xóa
   mềm; chỉ gọi `hard_delete` khi thực sự cần.
5. Service kế thừa `CoreCrudService`: khai `owner_field`, `manage_all_permission`, `owner_quota_setting` nếu là tài
   nguyên có owner; chỉ ghi đè `create`/`update`/`delete` khi có luật nghiệp vụ. Owner, 404 cho bản của người khác,
   bản đã xóa mềm, bulk trong transaction đều có sẵn.
6. ViewSet kế thừa `CoreModelViewSet`: serializer, `filterset_class` (bộ lọc `Core*InFilter` nhiều giá trị),
   `search_fields`, `ordering_fields`, `bulk_update_serializer_class`/`bulk_delete_enabled`, `history_enabled`,
   `action_permissions` (mọi action phải có rule — mặc định 403), `action_rate_limits` (khóa trong
   `settings.RATE_LIMITS`). API khác dùng `CoreApiView` + `@require_permission` (+ `@rate_limit`, `@validate_request`);
   công khai/chỉ đăng nhập thì ghi đè `permission_classes` theo bảng trong `core_api_view.py`. Không tạo lớp view nền.
7. `INSTALLED_APPS`, `config/urls.py`, `migrate` (quyền tự đồng bộ). Test trong `tests/`: **mỗi endpoint đúng 1 file test riêng biệt**
   (`test_<resource>_<action>_api.py`), tuyệt đối không gộp chung các action CRUD theo model, tuyệt đối không tách quyền ra file riêng;
   mỗi file test endpoint phải bao phủ đủ: `full_data`, `min_data`, `validation_errors`, quyền (`unauthenticated` 401, `forbidden` 403),
   `owner_isolation` (nếu có owner: 404 cho người khác, `manage_all` được phép), response envelope `{success, data, meta}` và status code chuẩn +
   một dòng trong `core/tests/test_list_query_count.py` cho endpoint danh sách (quên là test đỏ).
   Model khai trong `models/<model>.py`; enum của field lồng trong model (`class Status(models.TextChoices)`) hoặc
   khai cạnh model trong cùng file (ngoại lệ chỉ cho file model); enum dùng chung ở `constants/`. Mỗi serializer một file.
   Task, command, signal, middleware... chỉ gọi service (không repository/ORM); mọi service dùng trong view/service
   (kể cả `AuthCookieService`) khai trong `__init__`.
   Khóa `action_rate_limits` phải có trong `settings.RATE_LIMITS` (test quy ước kiểm). API công khai hoặc chỉ
   cần đăng nhập phải thêm tên view vào `core/tests/test_endpoint_access.py` (test gọi thật mọi route).
   `spectacular --validate --fail-on-warn` phải sạch.

Frontend:
1. `src/modules/links/{views,components,hooks,services,constants,schemas,types,messages}` + `navigation.ts`.
   `constants/api-endpoints.ts` chỉ khai path gốc của tài nguyên; `constants/query-keys.ts` dùng
   `createResourceKeys`; `constants/routes.ts` (`LINKS_ROUTES`, `LINKS_PATHNAMES`).
2. Service một file một model BE: `{ ...createCrudService<...>(LINKS_API_ENDPOINTS.links), /* method riêng */ }`.
   Hook: `useListQuery`, `useQuery`, `useResourceMutation` (toast + invalidate chuẩn) — không tự viết handler.
   Mỗi hook một file `hooks/use-<tên>.ts`; mỗi component một file, hook của component ở `components/hooks/`.
3. Bảng `DataTable` + `useTableState`; một form cho tạo/sửa/xem (`FormPage` + `FormLayout` + `FormSection` +
   `FormActions`); tạo/sửa nhanh tài nguyên liên quan bằng `FormDialog` chứa đúng form đó. Soạn thảo dùng
   `TiptapEditor` (JSON), hiển thị bằng `TiptapContent`. Chi tiết: rule frontend mục 3.1.
4. Ghép vào `src/i18n/routing.ts`, `src/i18n/messages.ts`, `src/global.d.ts`, `ADMIN_MODULE_NAVIGATION`
   (`navigation.ts` khai `module`, `nameKey`/`descriptionKey`, `labelKey` là khóa đầy đủ trong namespace của module).
   `tests/unit/module-registry.test.ts` đỏ nếu quên chỗ nào.
   Chạy `pnpm api:types` khi đổi serializer BE; kiểu viết tay thêm một dòng vào `tests/unit/api-contract.test.ts`
   (hoặc dùng thẳng `ApiModel<"…Response">`). Model có `JournalTracker` thì thêm tiền tố nhãn field vào
   `system/constants/journal-field-prefixes.ts`. Lỗi tải bản ghi dùng `QueryErrorState`.
5. Module cùng cấp không import nhau: page ghép qua slot (`extensions`, `history`, `editorPlugins`).
   Lịch sử thay đổi: page truyền `<RecordHistoryView path=".../{id}/history" fieldPrefix="links.fields" />`.
6. Quy chuẩn UI & Tối ưu:
   - Hiển thị ảnh bắt buộc dùng `<Image />` từ `next/image` (không dùng thẻ `<img>` trần).
   - Mọi UI primitive (`Button`, `Checkbox`, `Label`, `Input`, `Dialog`, `Card`...) bắt buộc dùng từ `@/shares/components/ui/` (nếu thiếu thì tải bằng `pnpm dlx shadcn@latest add <name>`, không tự chế; không bọc button/checkbox vào thẻ `<label>`).
   - Tên tệp đính kèm (`original_name` / `alt_text`) phải cho phép người dùng đổi tên và cấu hình alt text.
   - Thanh thao tác hàng loạt (`TableBulkBar` / bulk bar chọn nhiều): bắt buộc thiết kế trên 1 dòng duy nhất (`min-h-12 w-full flex items-center justify-between gap-3 rounded-xl border px-3.5 py-1.5`), tuyệt đối không dùng container flex-col hoặc bọc trong thẻ `Card` gây tách 2 tầng và căn giữa; bên trái là badge số lượng + vạch chia + nút Bỏ chọn, bên phải là cụm nút hành động.

Không cần sửa core hay IAM.
