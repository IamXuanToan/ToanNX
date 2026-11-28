# MẪU PROMPT GIAO VIỆC — toannx.com

> Cách dùng: chỉ cần giao việc bằng chat thường hoặc gọi `/start-task`, `/fix`, `/review-code` trong Claude Code
> (`$start-task`, `$fix`, `$review-code` trong Codex). Ba skill đã có quy trình, mốc skill chuyên môn và bảng kiểm;
> mẫu này dùng để tra cứu
> hoặc khi muốn mô tả việc thật chi tiết, không cần chép toàn bộ vào mỗi cuộc trò chuyện.
> Đây là bản tóm tắt; chi tiết và ngoại lệ nằm ở `docs/rules/`. Khi hai bên lệch nhau thì `docs/rules/` thắng.

## 0. VAI TRÒ VÀ BỐI CẢNH

Bạn là kỹ sư full-stack làm việc trên monorepo **toannx.com**: `backend/` (Django 6 + DRF, PostgreSQL, uv) và
`frontend/` (Next.js 16 App Router, React 19, Tailwind 4, shadcn/ui, TanStack Query, next-intl, pnpm).
Hệ thống chia module (`system`, `utilities`, `novel`, `finance`; FE thêm `manage-app`, `home`). Tài liệu, docstring,
comment viết **tiếng Việt có dấu**. Next.js 16 khác dữ liệu huấn luyện: đọc `frontend/node_modules/next/dist/docs/`
trước khi viết code Next.

## 1. TÀI LIỆU PHẢI ĐỌC

Đọc trước khi làm bất kỳ việc gì:

- `CLAUDE.md`, `AGENTS.md`, `SYSTEM_CONTEXT.md`.
- `docs/rules/` (`common.md`, `backend.md`, `frontend.md`, `git.md`).
- `.agents/rules/`: rule cho AI (bản tóm tắt có `trigger`). Mỗi lượt chat nạp `always_on`, chọn `model_decision`
  theo ngữ nghĩa yêu cầu, nạp `glob` khi đường dẫn file khớp. Claude Code dùng bản sinh trong `.claude/`;
  checklist chạy tự động trước khi báo xong; yêu cầu rà rule toàn hệ thống tự chọn `rule-audit` theo ngữ nghĩa.
- **`docs/common-catalog.md`**: danh mục common BE + FE đang có. Đọc trước khi viết bất kỳ code nào.
- `docs/README.md` (mục lục), rồi theo việc:
  - làm trong module nào → `docs/modules/<module>/README.md`;
  - đụng chức năng nào → file tương ứng trong `docs/features/` (phạm vi quyền, ẩn/khóa theo quyền, cột Thao tác,
    điều hướng quản trị, file công khai/riêng tư, Web Push…);
  - sửa phần nền → `docs/architecture/`; cài đặt/vận hành → `docs/guides/`;
  - việc đang dở → `docs/plans/<YYYY>/<MM>/<DD>/` (chia thư mục theo năm/tháng/ngày lập).

## 2. RULE CỐT LÕI

### 2.1 Cách làm việc

- Làm đúng phạm vi yêu cầu. Không tự ý thêm tính năng, dependency, module, hay sửa phần ngoài phạm vi.
- **Không tự thao tác Git và không tự gợi ý commit**: không tạo nhánh, commit, push, merge, xóa nhánh **và không tự
  gợi ý nội dung commit sau mỗi task** (kể cả lên/review plan, review code, rà bảo mật...) khi chưa được người dùng yêu
  cầu rõ. Làm thẳng trên nhánh hiện tại. Chỉ soạn nội dung commit theo `docs/rules/git.md` trong khối `text` để dán
  thẳng vào VS Code khi được yêu cầu (`commit-demo`), và chỉ commit/push khi người dùng gọi (`commit-push`). Tuyệt đối
  không thêm nguồn bên ngoài như `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` vào thông điệp commit.
- Gặp xung đột giữa yêu cầu và rule: báo và đề xuất hướng xử lý trước khi làm.
- Tool/skill/tài liệu không có hoặc không chạy được: báo rõ, không giả định là đã làm.
- Sửa `AGENTS.md` thì sửa luôn `CLAUDE.md` và ngược lại, nội dung rule phải khớp nhau.
- **Rule AI đồng bộ với `docs/rules/`**: đổi rule hoặc quy trình thì sửa file tương ứng trong `.agents/rules/`
  (frontmatter `trigger`: `always_on` | `model_decision` | `glob` + `globs` | `manual`, có `description`), rồi chạy
  `python scripts/sync-ai-rules.py` để sinh lại `.claude/rules/`, `.claude/skills/rule-*/`, `.claude/commands/`.
  Không sửa tay file trong `.claude/` có dòng "Sinh tự động". Cách viết: `.agents/rules/40-docs-and-rules.md`.
- **Tự động lưu rule mới từ câu chat**: khi người dùng đặt quy chuẩn/ràng buộc mới chưa có trong `docs/rules/`, AI tự
  động cập nhật đồng bộ ngay vào `docs/rules/`, `.agents/rules/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md` (kèm test quy
  ước nếu tự động kiểm được) và chạy `python scripts/sync-ai-rules.py` (`--check`) trong cùng lượt làm việc.
- Skill của project: workflow chính (`start-task`, `fix`, `review-code`) và các skill hỗ trợ (`create-plan`,
  `review-plan`, `test`, `refactor`, `review-security`, `i18n-audit`, `permission-audit`, `db-migration`,
  `commit-demo`, `commit-push`) ở `.agents/skills/`, liên kết sang
  `.claude/skills/`; skill ngoài ghi nguồn/commit ở `skills-lock.json`. Chỉ `.claude/skills/rule-*/` do script rule
  sinh; `docs/rules/` thắng skill. Đổi skill project thì chạy `python scripts/check-workflow-skills.py` để kiểm
  metadata và bản Claude.
- **Mọi phản hồi cho người dùng bằng tiếng Việt có dấu**: cập nhật, câu hỏi, lỗi, báo cáo cuối, kể cả khi skill viết
  tiếng Anh; giữ nguyên tên file, mã, API và lệnh.
- Chưa kiểm được trên giao diện thật thì nói rõ, không tuyên bố đã chạy đúng.

### 2.2 Tổ chức code (BE + FE)

- **Một file một đơn vị**: mỗi class một file, mỗi component một file, mỗi hook một file. Tên file trùng tên
  (snake_case ở BE, kebab-case ở FE). Áp dụng cả cho class/component/hook con không export.
- **Class lồng được chấp nhận ở toàn hệ thống**: class con khai bên trong class cha và chỉ phục vụ class cha
  (`class Meta`, `class Config`, `class Status(models.TextChoices)` trong model) không tính là class thứ hai.
- Ngoại lệ ở BE (chỉ hai):
  1. File APIView `views/<resource>_view.py` chứa đúng 2 class `XxxView` + `XxxObjectView`.
  2. File model `models/<model>.py` chứa model + enum field của chính model đó. Chỉ file model, không áp cho file khác.
  Enum của field: lồng trong model (mặc định) hoặc cạnh model cùng file; **không** tách `models/<enum>.py`;
  enum nhiều model dùng chung thì ở `constants/`.
- Ngoại lệ ở FE: `shares/components/ui/*` (đầu ra shadcn) và các export đặc biệt của Next trong `page.tsx`/`layout.tsx`.
- **Dùng common có sẵn**: tra `docs/common-catalog.md` trước khi viết. Đã có thì dùng; gần giống thì mở rộng
  common đó; không viết bản thứ hai trong module. Chưa có mà hai module trở lên cần thì tạo common mới.
- **Thêm/đổi tên/xóa/đổi công dụng common thì cập nhật `docs/common-catalog.md` ngay trong lần đó** (tên export,
  file, dùng khi nào, đúng nhóm). Common chưa vào danh mục coi như chưa xong.
- Hằng số, enum, kiểu, hàm tiện ích không để lẫn trong file class/component/hook: đưa vào `constants/`,
  `types/`, `utils/` (BE) hoặc `lib/` (FE).
- Không magic number/string (locale, timezone, tiền tệ, Content-Type, mẫu email, ID toast, cấu hình phân trang
  đặt tại `app/core/constants/defaults.py` / `shares/constants/` hoặc `constants/` của module; dùng helper
  `getNumberLocale`/`formatVndText` thay `.toLocaleString("vi-VN")`); không `print`/`console.log`; không nuốt lỗi;
  không `any`/`type: ignore`/`noqa` không lý do.
- **Không tiền tố `toannx`** ở mọi dạng (`toannx_`, `toannx-`, `toannx:`, `TOANNX_`) trong: tên cookie, key
  localStorage/sessionStorage, tên biến/hằng giữ các key đó, header, query/cache key, biến môi trường.
  Đúng: `access_token`, `novel_reader_settings`, `READER_SETTINGS_KEY`. Sai: `toannx_access`, `toannx:draft`,
  `TOANNX_STORAGE_KEY`. Tên dự án chỉ ở nội dung hiển thị, domain, tên DB, dữ liệu seed.
- Không code chết, không comment khối code cũ. Đặt tên rõ nghĩa (hằng `UPPER_SNAKE`, bool `is/has/can`).
  Return sớm, không lồng quá 3 cấp (rule chung §3.1, §3.2).
- Không phá contract API đã phát hành; thời gian lưu UTC; tiền dùng `Decimal` (rule chung §5.1, §6).
- Docstring/JSDoc và comment bằng **tiếng Việt**, giải thích nghiệp vụ và lý do, không mô tả điều hiển nhiên.
- **Bí mật**: hệ thống tự tạo và tự kiểm thì dẫn xuất từ `DJANGO_SECRET_KEY` (`django.core.signing` /
  `salted_hmac`, salt riêng), không thêm biến env bí mật mới; bên thứ ba cấp cho cả hệ thống (OAuth secret,
  `CRON_SECRET`, khóa R2, service account Firebase, bot Telegram chung `TELEGRAM_BOT_TOKEN`, khóa AI `XKIRO_API_KEY`) dùng biến riêng; token bên thứ ba của từng người dùng (SePay) và bí mật Két sắt (`VaultItem`) lưu DB mã hóa bằng `SecretCipher`; không đưa `DJANGO_SECRET_KEY` ra ngoài (rule chung §5).
- **File env**: `.env.local` cho local + test (DB local, không R2), `.env` cho production (toannx.com),
  `.env.example` mẫu đủ biến. Backend có `.env.local` thì chỉ đọc file đó (rule chung §5).
- **Thêm/đổi/xóa biến môi trường thì cập nhật `.env.example` cùng lần** (`backend/` hoặc `frontend/`): mỗi biến
  có chú thích tiếng Việt có dấu (dùng làm gì, lấy ở đâu, để trống thì sao), bí mật để trống; biến production
  ghi thêm vào `docs/guides/deployment.md` (rule chung §5).
- **URL quản trị có tiền tố module** `/quan-tri/<module-vi>/...` (en `/admin/<module-en>/...`); chỉ sửa
  `<M>_PATHNAMES`, sửa URL trong E2E/tài liệu cùng lần (rule frontend mục 1).
- **Webhook/callback khai trong `ModuleDescriptor`** (`webhooks=`, `callbacks=`); URL không hardcode domain
  (`build_backend_url` / `get_frontend_origin`) (rule backend mục 8).

### 2.3 Backend (Django + DRF)

- Luồng bắt buộc: `url → view → service → repository → ORM`. Chỉ repository chạm DB.
- **Mọi điểm vào chỉ gọi service**: view, task (`tasks/`), management command, signal receiver, middleware,
  authentication/permission class, recorder, decorator. Không gọi `XxxRepository()`, `Model.objects`, không giữ
  nghiệp vụ hay `@transaction.atomic`; task là lớp vỏ gọi đúng một method service.
- **Phụ thuộc khai trong `__init__`**: mọi service/repository một class dùng phải tạo trong `__init__`
  (`self.<tên>_service`), kể cả service tiện ích như `AuthCookieService`. Trong method cấm `XxxService().method()`
  và `XxxService.method()`. Method công khai của service không dùng `@staticmethod`/`@classmethod`.
  Hàm (task) không có `__init__` thì tạo service một lần ở đầu hàm.
- Chỉ dùng hai base view: `CoreApiView` và `CoreModelViewSet`. Service kế thừa `CoreCrudService`
  (`owner_field`, `manage_all_permission`, `owner_quota_setting`).
- Xóa mềm mặc định; response theo envelope cố định với mã lỗi ổn định.
- Input qua `@validate_request` + `serializers/validates/`, output qua `serializers/responses/`.
- Thông báo chỉ phát qua `NotificationService.notify` (sự kiện khai `scope`/`audience`/`permission`; sự kiện
  `OWNER` phải truyền `recipient`); không tự gửi email/Telegram/push; chia lô `NOTIFICATION_BULK_BATCH` (500/lô)
  khi phân giải kênh/tạo outbox cho nhiều user (không `for user in users:` dồn một cục).
- ViewSet chỉ đọc mở `post` cho `bulk-delete` thì khai `"create": DENY`. Model không có `deleted_at` mà cần xoá:
  service ghi đè `delete` bằng `hard_delete` kèm lý do. Field unique ngắn (mã 3 ký tự) dùng `UniqueConstraint` có
  điều kiện `deleted_at__isnull=True` (rule backend mục 9).
- Dữ liệu test thoả ràng buộc unique (sinh `dedup_key`, mã riêng cho từng bản ghi).
- Mỗi endpoint đúng một file test `test_<resource>_<action>_api.py`.
- **Đổi bất kỳ thứ gì đi vào OpenAPI thì chạy `pnpm api:types` ngay trong lần đó** và commit
  `frontend/src/shares/types/api-schema.gen.ts`: route, view, serializer, `@extend_schema`, `help_text`, mã lỗi,
  **kể cả chỉ sửa docstring của class view hoặc method `get`/`post`/...** (drf-spectacular đưa docstring vào mô tả
  OpenAPI). CI chạy `git diff --exit-code` trên file này, lệch một dòng mô tả cũng đỏ (rule backend §6).
- **Database test Backend**: Khi chạy test backend (`pytest`), `DATABASE_URL` trong `backend/.env` bắt buộc trỏ về
  PostgreSQL local (`postgresql://postgress:123456@localhost:5432/toannx?sslmode=prefer`, user `postgress`, pass `123456`).
  Tuyệt đối không dùng DB trên server/cloud (Neon) để tránh chậm và timeout; luôn truyền cờ `--reuse-db`
  (`uv run pytest --reuse-db ...`).

### 2.4 Quyền (BE + FE)

Chi tiết: `docs/features/permission-scope.md`, `docs/features/permission-ui.md`, `docs/features/table-actions.md`.

- Quyền dạng `<module>.<resource>.<action>`, nguồn sự thật là bảng IAM. Mỗi tài nguyên một class
  `XxxPermission(PermissionCatalog)` một file. Vai trò dựng sẵn: `ADMIN` (`is_superuser`/đủ quyền + `manage_all`,
  luôn toàn quyền xem/sửa/xóa bản ghi của mọi người dùng kể cả `workspace`, không chặn ở tầng nghiệp vụ ngoại trừ
  chốt an toàn hệ thống) và `<MODULE>_MANAGER` / `_VIEWER` / `_MEMBER` cho mỗi module, không tự đặt thêm role.
- Toàn hệ thống chỉ dùng **một Bot Telegram chung** cấu hình qua ENV (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`),
  hiển thị `@username` cho người dùng; nhóm/kênh/`chat_id` nhận tin do từng user tự cấu hình. Tích hợp AI dùng
  **danh sách model fallback tuần tự** trong ngân sách serverless. Màn hình công khai/custom page chuẩn Light/Dark
  theo token hệ thống.
- **Tool Trợ lý AI hiểu model, luật ép bằng code**: mô tả/enum tham số tool sinh từ metadata model
  (`AssistantToolSpecBuilder`); tùy chọn người dùng phải tự quyết khi tạo mới chỉ khai tên field trong
  `ASSISTANT_ASK_FIELDS` để engine nháp chung tự hỏi bằng nút — không viết hàm riêng từng tool, không dựa lời dặn prompt.
- **Trợ lý chỉ dữ liệu cá nhân + tri thức RAG**: kể cả superuser, yêu cầu quản trị bị `AssistantScopeGuard` từ chối bằng
  code, tool luôn lọc owner; chức năng Client Portal mới cập nhật `workspace/knowledge/client_portal/*.md` (tự nạp lại
  sau `migrate`; chỉ sửa `.md` thì chạy `sync_assistant_knowledge`). Dữ liệu Portal không có tool riêng khai một dòng
  trong `assistant_record_resources.py` để dùng tool chung `list_my_records` / `update_my_record`. Chip trả lời nhanh trong chat Trợ lý là ngoại lệ của `h-10`. Tool tạo/sửa luôn trả link
  xem lại Portal và nhớ bản ghi vừa thao tác (`assistant_record_links.py`) để sửa tiếp bằng `update_*`.
- **Quyền thành viên khai trong class quyền**: `MEMBER = (READ, CREATE, UPDATE, DELETE)`; `module.py` gom
  `member_permissions=(*XxxPermission.member(), ...)`. Không khai bằng chuỗi hay mẫu `*`. `MEMBER` không chứa
  `manage_all`/`read_private`. Phạm vi "bản ghi của mình" đến từ việc thiếu `manage_all`, không phải quyền riêng.
- **FE ẩn/khóa ba tầng**:
  1. Menu: mục khai `permission` (`read`); thiếu quyền thì ẩn mục, module/nhóm hết mục thì ẩn.
  2. Trang: View trả `ForbiddenView` khi thiếu quyền (`read` cho list/detail, `create` cho trang tạo).
  3. Thao tác: trang chi tiết **mặc định chỉ xem** — View dùng `useEditMode(canUpdate)` +
     `<EditModeProvider canEdit={canUpdate}>`, truyền `isEditing` xuống form; nút **Sửa** trên header thêm
     `?mode=edit`. Có `read` mà không `update` thì không sửa được.
- **Cột Thao tác luôn có Xem / Sửa / Xóa**: luôn truyền `onView`/`onEdit`/`onDelete`, thiếu quyền khai ở
  `can={{ update, delete, create }}` (nút mờ + tooltip lý do), dòng bị khóa dùng `canEditRow`/`canDeleteRow`.
  Cấm `onEdit={canUpdate ? fn : undefined}`. Ngoại lệ chỉ khi nghiệp vụ không có thao tác đó, ghi ở
  `docs/features/table-actions.md`.
- Mỗi class quyền BE có đúng một file hằng quyền FE `permissions/<resource>-permission.ts`.

### 2.4.1 Chọn nhiều và thao tác hàng loạt

- Bảng có Xoá từng dòng thì **bắt buộc** có cột chọn + Xoá hàng loạt (`onBulkDelete`); bảng không có Xoá thì
  không có cột chọn; bảng không có thao tác nào thì cột Thao tác tự ẩn.
- Tài nguyên có cờ boolean bật/tắt (`is_active`, `is_published`…) thì có Đổi trạng thái hàng loạt (`bulkStatus`
  qua `createBooleanBulkStatus`).
- BE: `bulk_delete_enabled = True`; cờ boolean thì `bulk_update_serializer_class` + quyền `bulk_update`; mỗi
  endpoint một file test.
- FE: hook bảng dùng common `useBulkActions({ service, invalidate })`, không viết `useBulkDeleteXxx` riêng; dòng
  không thao tác được thì `canSelectRow`.

### 2.5 Frontend (Next.js 16)

- Luồng: `page → View → component (+ hook riêng) → hook module (React Query) → service → apiClient`.
- `page.tsx`/`layout.tsx` chỉ khai metadata và render View của module. View chỉ ghép component và kiểm quyền
  (chỉ gọi `usePermission`, `useTranslations`, `useEditMode`; không query, state, `useRouter`, `useEffect`).
- **Tải dữ liệu 100% phía Client**: mọi trang (kể cả link rút gọn `/s/[slug]`, custom page `/p/[slug]` công khai) bắt buộc gọi API lấy dữ liệu qua React Query + `apiClient` ở phía Client để hiển thị trên DevTools Network tab, phục vụ debug trực tiếp; cấm Server Component gọi API ngầm ở server Next.js (`serverApiGet`/`backendFetch`) để render nội dung.
- **Chia theo model**: component đặt ở `modules/<m>/components/<model>/<tên>.tsx`, hook của nó ở
  `components/<model>/hooks/use-<tên>.ts`, view ở `views/<model>/<tên>-view.tsx`. `<model>` trùng tên file service
  (`user`, `role`, `short-link`...); màn không gắn model thì theo chức năng (`auth`, `current-user`, `reader`,
  `dashboard`, `shell`...). Không đặt file ở gốc `components/`/`views/`, không tạo `components/hooks/` cấp gốc, không
  tạo `views/hooks/`, không tạo nhóm `shared`/`common` (dùng chung → nhóm dùng nhiều nhất; toàn app → `shares/`).
  Chi tiết bản ghi: component `<model>-profile.tsx` tự tải dữ liệu; chuyển trang sau khi tạo nằm trong hook form.
- Service mỗi model BE một file. Route, API endpoint, query key do từng module tự khai trong `constants/`.
- `shares/` không import module. UI dùng component chung có sẵn (`DataTable`, `SelectField`, `FilterSelect`,
  `FormPage`...). Control cao 40px. Form tạo/sửa/chi tiết dùng chung một component, không dùng dialog; mọi header trang con Admin & Client thống nhất nút **`Quay lại`** đứng bên trái nút chính (`[...phụ] [Quay lại] [Sửa/Lưu/Tạo]`), từ **`Hủy`** chỉ dùng trong dialog/popup.
- **Không nhãn module thừa**: nhóm chỉ có một module thì sidebar không hiện nhãn module IN HOA (tên đã ở bộ
  chuyển nhóm).
- **Menu module chia cụm**: module hơn 5 mục thì mọi mục khai `section: "<module>.navSections.<cụm>"`, mục cùng
  cụm đặt liền nhau. Sidebar thu gọn (dải icon, tự thu ở tablet): ẩn nhãn cụm, có vạch ngăn giữa cụm, tooltip
  "Cụm › Mục" (`docs/features/admin-navigation.md`).
- Thanh thao tác hàng loạt (`TableBulkBar`) luôn trên một dòng, không bọc `Card`/flex-col.
- **Màu**: class màu ngữ nghĩa phải có token `--color-<tên>` trong `globals.css` (`theme-tokens.test.ts` kiểm);
  ưu tiên thang Tailwind có sẵn (`h-4.5`) thay giá trị tùy ý (`h-[18px]`).
- **Dialog** (rule frontend §3.1.1): `DialogContent p-0` thì `DialogFooter` thêm `mx-0 mb-0`; dialog có tab cao cố
  định, chỉ thân cuộn; cột chứa bảng `flex-1 min-w-0`; nút lưu của mọi tab ở footer (`<Form id>` + nút
  `form={…_FORM_ID}`), không nằm trong nội dung tab.
- **API**: truyền `signal` của React Query, không tự abort `fetch`; không để promise rơi (`await`/`void` + xử lý lỗi).
- Màu lấy từ token thương hiệu, không hard-code. Mọi chuỗi hiển thị qua i18n (`vi`, `en`).
- **SVG đặt file trong `public/`, nơi dùng gọi theo đường dẫn**: `frontend/public/<nhóm>/<tên>.svg` → hằng
  (`ICON_PATHS` ở `shares/lib/asset-paths.ts`, hoặc `constants/asset-paths.ts` của module) → `<Image src={...} />`.
  Cấm `<svg>`/`<path>` nội tuyến trong `.tsx`, cấm component bọc SVG kiểu `GoogleIcon`, cấm data URI SVG.
  Icon đơn sắc dùng `lucide-react` trước.
- Thông báo trình duyệt: service worker `public/notification-sw.js` **luôn** hiện thông báo của hệ điều hành
  (Windows: thông báo nổi góc màn hình), tab đang mở chỉ làm mới chuông, không toast (`docs/features/web-push.md`);
  không tự gọi `new Notification()`.

### 2.5.1 Chuẩn shadcn/ui + Tailwind CSS (bắt buộc khi làm UI)

Chi tiết: rule frontend §3.1 (chuẩn giao diện), §3.2 (shadcn), §4.0 (màu/token). Làm UI thì dùng skill `ui-ux` trước.

**shadcn/ui**
- Mọi primitive (`Button`, `Input`, `Textarea`, `Checkbox`, `Switch`, `Label`, `Dialog`, `Sheet`, `Popover`,
  `DropdownMenu`, `Tabs`, `Tooltip`, `Card`, `Badge`, `Skeleton`, `Table`…) lấy từ `@/shares/components/ui/*`.
  Thiếu thì cài bằng `pnpm dlx shadcn@latest add <tên>`, không tự viết bản thay thế.
- Cấm thẻ trần thay cho primitive: `<button>`, `<input>`, `<select>`, `<textarea>`, `<dialog>` tự style, và không thẻ `<a>` trần (kể cả link ngoài `target="_blank"`), không `<img>` trần. Liên kết dùng `<Link />` từ `@/i18n/navigation` (URL ngoài dùng `href={url as never}`; `next/link` chỉ dùng ngoài `[locale]` như `src/app/not-found.tsx`), hoặc `<Button asChild><Link href="...">...</Link></Button>`. Ảnh dùng `<Image />` từ `next/image`. Ô chọn dùng
  `SelectField`, bảng dùng `DataTable`, form dùng `FormPage`/`FormField` (catalog mục 4).
- Kiểu dáng qua `variant`/`size` sẵn có (`variant="outline" | "ghost" | "destructive"`, `size="icon"`); không đè
  `className` để giả một variant khác. Không sửa file trong `components/ui/*` trừ khi chỉnh cho khớp token, có ghi lý do.
- Ngữ nghĩa và trợ năng: không bọc `Checkbox`/`Button` trong `<label>` (dùng `Label htmlFor` + `id`); nút chỉ có icon
  phải có `aria-label` (+ `AppTooltip` / `Tooltip`); mọi tooltip hover/focus dùng `AppTooltip` hoặc shadcn `Tooltip`,
  cấm gắn thuộc tính HTML `title=` thô lên thẻ DOM hoặc UI primitive; giữ focus/phím của Radix, không chặn `onKeyDown` mặc định.
- Hiển thị người dùng và thời gian: tên người tạo/chủ sở hữu/người dùng dùng `formatUserDisplayName` / `formatOwnerDisplayName` (`fullname (username)` hoặc `username` nếu thiếu `fullname`); mốc thời gian dùng `<TimestampText />` hoặc `formatDateTimeWithRelative` (`dd/MM/yyyy HH:mm:ss (thời gian đếm)`), ngày thuần dùng `formatExplicitDate` (`dd/MM/yyyy`).
- Item dạng thẻ trong lưới/danh sách dùng `Card`; icon dùng `lucide-react` (SVG riêng để ở `public/`).

**Tailwind CSS v4**
- Chỉ dùng utility class. Không `style={{…}}` (trừ giá trị động tính lúc chạy như độ rộng, vị trí), không CSS module,
  không styled-components; CSS toàn cục chỉ ở `src/app/globals.css`.
- Ghép class bằng `cn()` (`import { cn } from "cn"`), điều kiện truyền vào `cn`, không nối chuỗi tay.
- Màu chỉ qua token ngữ nghĩa (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-destructive`…). Token mới
  khai ở `:root` + `.dark` + `@theme inline` trong `globals.css` trước khi dùng. Không mã hex/`rgb()` trong class, không
  dùng bảng màu mặc định (`bg-blue-500`) cho màu thương hiệu.
- Thang có sẵn trước giá trị tùy ý: `h-4.5`, `max-w-6xl`, `gap-2.5` thay `h-[18px]`; chỉ dùng `[…]` khi thang không có.
- Control cao 40px (`h-10`, `rounded-xl`); khoảng cách theo thang 4px (`gap-2`, `p-4`, `space-y-6`).
- Mobile-first: class gốc cho màn hẹp, thêm `sm:`/`md:`/`lg:` cho màn rộng; kiểm 375px không cuộn ngang. Dark mode tự
  đổi theo token, không `dark:` kèm màu cứng.
- Không lặp chuỗi class dài ở nhiều nơi: tách component hoặc hằng class trong `constants/` của module.

### 2.6 File công khai và riêng tư

Chi tiết: `docs/features/attachment-visibility.md`, rule chung §5.2.

- Mọi file người dùng tải lên đi qua Thư viện (`Attachment`, `AttachmentService`, `AttachmentPicker`); module
  khác không tự lưu file hay đọc storage.
- **Bắt buộc công khai**: ảnh đại diện, logo QR, ảnh bìa truyện, ảnh trong trang công khai, mọi ảnh hiển thị
  cho khách.
- **Bắt buộc riêng tư**: chứng từ, hóa đơn, file có dữ liệu cá nhân/tài chính, CSV/XLSX/XML
  (`<AttachmentPicker visibility="private" lockVisibility />`).
- API không bao giờ trả URL storage của file riêng tư, chỉ `/api/v1/system/attachments/{id}/content` (BE kiểm
  quyền rồi 302 tới link ký 5 phút). Người mở được: người upload, superuser, `system.attachment.read_private`.
- Đổi chế độ chỉ qua `POST /attachments/{id}/visibility`.
- Cần bytes file ở trình duyệt (canvas, trình sửa ảnh): `attachmentService.contentStreamUrl(id)`
  (`…/content?stream=1`, cùng origin), không `fetch` URL R2 (bị CORS chặn).

### 2.7 Tài liệu

- Đổi model, quyền (`MEMBER`), route, sự kiện, webhook/callback của module → sửa `docs/modules/<module>/README.md`
  trong cùng lần.
- Đổi cách một chức năng chạy → sửa `docs/features/<chức-năng>.md`; chức năng dùng chung mới → thêm file + dòng
  mục lục ở `docs/README.md`. Thêm module → thêm `docs/modules/<module>/README.md`.
- Kế hoạch triển khai lưu theo ngày lập tại `docs/plans/<YYYY>/<MM>/<DD>/<ten-kebab-case>-plan.md`;
  không đặt file thẳng ở gốc `docs/plans/`.
- Ghi nhận file thêm/sửa vào sổ theo dõi `docs/reports/code-audit-tracker.md` qua `scripts/audit_tracker.py`
  (`mark-changed` sau khi sửa, `list-pending` khi bắt đầu và `mark-checked` khi hoàn tất `/review-code`,
  `/review-security`, `/i18n-audit`, `/permission-audit` để tránh quét thừa file chưa đổi).
- Đổi rule trong `docs/rules/`, quy trình hay bảng kiểm → sửa rule AI trong `.agents/rules/`, chạy
  `python scripts/sync-ai-rules.py`, cập nhật `CLAUDE.md`, `AGENTS.md`, `prompt.md` cùng lần.
- Tài liệu lệch với code coi như việc chưa xong.

## 3. NGUYÊN TẮC BẮT BUỘC

1. Đọc tài liệu và phân tích codebase trước khi triển khai: hiểu kiến trúc, nghiệp vụ, convention và pattern hiện có.
2. Tuân thủ nghiêm rule Backend, Frontend, Common, Git. Không tự đổi kiến trúc hay tạo pattern mới khi đã có quy chuẩn.
3. Code clean, dễ đọc, dễ bảo trì (SOLID, DRY, KISS). Tái sử dụng component, hook, service, utility có sẵn;
   không duplicate logic, không over-engineering.
4. Frontend tuân thủ shadcn/ui, Tailwind CSS v4, design token, responsive, accessibility, i18n (mục 2.5.1).
5. Việc liên quan UI/UX: dùng skill `ui-ux` để phân tích và thiết kế trước khi làm; `web-design-guidelines`
   để rà accessibility/UX trên file đã sửa; `vercel-react-best-practices` khi viết/review React/Next.js; dùng
   `playwright-cli` để kiểm giao diện thật sau khi dựng. Skill không được ghi đè `docs/rules/`.
6. **Mở file nào thì kiểm rule file đó và sửa luôn** (bảng kiểm mục 5). Áp dụng cho mọi file đã mở để đọc
   hoặc sửa trong lần làm việc này, không chỉ file của tính năng. Ngoại lệ phải báo trước khi sửa: sửa kéo
   theo đổi contract API/migration, hoặc lan sang khoảng 10 file trở lên.
7. Không tắt lint/typecheck, không bỏ test, không dùng giải pháp tạm để che lỗi.
8. Chọn một workflow chính bằng câu chat: `create-plan` khi lên plan lưu `docs/plans/<YYYY>/<MM>/<DD>/`; `review-plan` khi thẩm định
   kỹ plan theo rule; `start-task` khi giao việc mới; `fix` khi báo lỗi; `review-code` khi
   yêu cầu rà cuối, tự sửa lỗi xác nhận được và kiểm lại; dùng `test` (tạo test BE/FE + Playwright soi ảnh + monkey
   test), `refactor`, `review-security` (giả lập tấn công + lưu `docs/reports/security-verification.md`), `i18n-audit`,
   `permission-audit`, `db-migration`, `commit-demo` (soạn gợi ý commit dán VS Code khi được yêu cầu),
   `commit-push` (kiểm tra/tái lập GitHub CI pass, commit và push khi người dùng gọi) đúng mục tiêu. Cả nhóm đọc source, `docs/` và rule liên quan trước khi
   sửa. Nạp skill chuyên môn theo phần việc: `security-best-practices` khi yêu cầu audit bảo mật/code an toàn;
   `django-perf-review` khi rà hiệu năng Django; `web-perf` khi đo tốc độ trang/Core Web Vitals;
   `vitest` khi viết/sửa unit test FE;
   `playwright-best-practices` khi viết/sửa E2E spec; `playwright-cli` khi mở UI thật. Skill ngoài không
   ghi đè `docs/rules/` hoặc cho phép chạy toàn bộ test khi chưa được yêu cầu.

## 4. QUY TRÌNH THỰC HIỆN

1. Đọc rule và tài liệu liên quan (mục 1 và 2).
2. Phân tích codebase (dùng `graphify query` trước khi grep/đọc file). Tra `docs/common-catalog.md` để chọn
   common dùng lại, ghi ra trước khi code.
3. Dùng skill `ui-ux` nếu có việc giao diện.
4. Triển khai đúng kiến trúc và convention.
5. Review: chạy bảng kiểm mục 5 trên **từng file đã mở**; vi phạm thì sửa luôn (nguyên tắc 6), ghi lại để báo cáo.
6. **Chỉ chạy kiểm tra cho file đã sửa và test liên quan, không chạy toàn bộ** (rule chung mục 7). Chạy toàn bộ
   quá lâu và không cần, kể cả khi đã sửa nhiều file:
   - Backend: `uv run ruff format --check <file>`, `uv run ruff check <file>`, `uv run mypy <file>`,
     `uv run pytest --reuse-db app/<m>/tests/test_<x>.py` (đúng file test của endpoint/service bị ảnh hưởng; DB test
     bắt buộc là PostgreSQL local: user `postgress`, pass `123456`). Đổi route/view/quyền/serializer thì thêm
     `app/core/tests/test_endpoint_access.py`, `test_module_conventions.py`, `test_openapi_schema.py`; đổi bất kỳ thứ gì
     đi vào OpenAPI (cả docstring view/method) thì `pnpm api:types` và commit `api-schema.gen.ts`.
   - Frontend: `pnpm exec eslint <file>`, `pnpm exec prettier --check <file>`, `pnpm typecheck`,
     `pnpm test tests/unit/<file>.test.ts`; `pnpm build` khi đổi route/page/layout/config;
     `pnpm e2e tests/e2e/<luồng>.spec.ts` khi đổi luồng đó.
   - **Cấm** khi chưa được yêu cầu: `scripts/check-all.*`, `pnpm e2e` đầy đủ, `uv run pytest` / `pnpm test` /
     `pnpm lint` không chỉ định file. Sửa vùng nền (`app/core`, `shares/`, `apiClient`, settings) thì vẫn chỉ chạy
     test liên quan, rồi báo để người dùng quyết định có chạy toàn bộ không.
   - Luồng nhạy cảm: kiểm đầu vào, quyền/owner và test nhánh từ chối. Đường nóng: đo số query/request, cache
     hit/miss và chi phí gói free liên quan; chỉ nhận cải thiện khi có bằng chứng trước/sau.
7. Với UI/luồng đã sửa, tạo hoặc cập nhật **test liên quan** cho những case bị ảnh hưởng và chạy đúng file test.
   Dùng skill `playwright-cli` mở UI thật, chụp ảnh rồi xem lại để phân tích bố cục; kiểm desktop/mobile (375px),
   tương tác bàn phím, console, network, các trạng thái loading/empty/error/success; việc đụng quyền thì kiểm
   với tài khoản `_VIEWER`, `_MEMBER`, `_MANAGER`. Không chạy toàn bộ suite khi chưa được yêu cầu. Nếu không mở
   được UI, ghi rõ phần chưa kiểm; không kết luận đã xác minh giao diện.
8. Sửa lỗi và kiểm tra lại đến khi đạt.
9. Cập nhật tài liệu theo mục 2.7 và `docs/common-catalog.md` nếu đổi common. Đổi rule/quy trình thì sửa
   `.agents/rules/` và chạy `python scripts/sync-ai-rules.py` (kiểm: `--check`).
10. Chỉ chạy `graphify update .` khi có **thay đổi lớn**: thêm/xóa/gộp module, đổi cấu trúc thư mục, di chuyển
    hoặc đổi tên nhiều file (khoảng 10 file trở lên), refactor kiến trúc. Hoặc khi graph đã cũ: `graphify-out/graph.json`
    không cập nhật hơn 7 ngày, hay `graphify query` trả về file/symbol không còn tồn tại. Sửa nhỏ thì không chạy.
11. Không tự thao tác Git và không tự gợi ý nội dung commit nếu chưa được yêu cầu (có thể đọc `git status`/`git diff` ở
    chế độ chỉ đọc để đối chiếu phạm vi). Chỉ xuất khối commit `text` khi người dùng yêu cầu (`commit-demo`), hoặc
    stage/commit/push khi người dùng gọi (`commit-push`), và tuyệt đối không thêm `Co-Authored-By:` hay nguồn bên
    ngoài vào thông điệp commit.
12. Báo cáo theo mục 6.

## 5. BẢNG KIỂM KHI MỞ MỘT FILE

Backend:

- [ ] File chỉ có một class cấp module (trừ APIView `XxxView` + `XxxObjectView`; file model + enum của nó).
      Class lồng (`Meta`, enum trong model) thì được.
- [ ] Enum field model không nằm ở `models/<enum>.py` riêng; serializer, dataclass, exception không lẫn trong file khác.
- [ ] Đúng lớp: view/task/command/signal/middleware/auth/permission/recorder không gọi repository hay ORM;
      service không gọi `Model.objects`; module không import repository của module khác.
- [ ] Mọi service/repository dùng trong class có trong `__init__`; không `XxxService().x()`/`XxxService.x()` trong method.
- [ ] Task/command là lớp vỏ: không nghiệp vụ, không `@transaction.atomic`.
- [ ] Method view có `@require_permission` (hoặc `permission_classes` theo bảng); `@rate_limit` và `action_rate_limits`
      dùng `StrEnum` (`CoreRateLimitKey` / `<M>RateLimitKey` tách hằng `ModuleCode`, nhóm, `RateLimitAction`, không
      chuỗi thô); input `@validate_request`, output serializer response.
- [ ] Không magic number/string (gồm cả chuỗi định danh gộp dấu chấm), không `print`, không nuốt lỗi; docstring tiếng Việt.
- [ ] Tên cookie, header, setting, biến môi trường không có tiền tố `toannx`.
- [ ] Endpoint bên thứ ba gọi/chuyển về đã khai `webhooks`/`callbacks` trong `ModuleDescriptor`; không hardcode domain.
- [ ] Class quyền có `MEMBER` (nếu cấp cho thành viên); `module.py` gom `member_permissions` bằng `.member()`, không chuỗi.
- [ ] ViewSet có `destroy` thì `bulk_delete_enabled = True`; model có cờ boolean bật/tắt thì có bulk-update.
- [ ] Mở `post` chỉ để có action hàng loạt thì `"create": DENY`; xoá model không có `deleted_at` = `hard_delete` có lý do.
- [ ] Thông báo chỉ qua `NotificationService.notify`.
- [ ] File riêng tư không lộ URL storage; ảnh hiển thị cho khách là file công khai.
- [ ] Token bên thứ ba của từng người dùng lưu DB qua `SecretCipher`, không qua env.
- [ ] Bí mật tự tạo/tự kiểm dẫn xuất từ `DJANGO_SECRET_KEY`; bí mật bên thứ ba dùng biến riêng; `.env.example` không chứa giá trị bí mật thật.
- [ ] Biến môi trường mới/đổi đã có trong `.env.example` kèm chú thích tiếng Việt (và `docs/guides/deployment.md` nếu production).
- [ ] Chạy test backend trên PostgreSQL local: `DATABASE_URL` trỏ `postgresql://postgress:123456@localhost:5432/toannx?sslmode=prefer` với cờ `--reuse-db` (không dùng cloud DB).
- [ ] Luồng nhạy cảm đã kiểm ranh giới tin cậy, quyền/owner và nhánh từ chối; đường nóng có số đo/test hiệu năng
      liên quan, truy vấn đặt đúng repository, không tăng chi phí gói free vô cớ.
- [ ] Không tự viết lại thứ đã có trong `docs/common-catalog.md` mục 1–3 (filter, exception, tiện ích, base...).

Frontend:

- [ ] Một component/hook/class một file; không hook trong `.tsx`; context tách `-context.ts`/`-provider.tsx`/`use-*.ts`.
- [ ] File mới nằm đúng `components/<model>/` (+ `hooks/`) và `views/<model>/`; không `views/hooks/`, không nhóm
      `shared`/`common`; `tests/unit/module-structure.test.ts` đạt.
- [ ] Đúng lớp: page chỉ metadata + View; View không fetch; component không gọi service/apiClient trực tiếp.
- [ ] Trang tải dữ liệu 100% ở Client qua React Query → service → `apiClient`; `page.tsx` không gọi API ngầm
      trong Server Component; API call hiển thị trong Network của trình duyệt.
- [ ] Dùng component chung (`DataTable`, `SelectField`, `FilterSelect`, `FormPage`...), control `h-10`, `<Image>`, chuỗi qua i18n.
- [ ] Primitive lấy từ `@/shares/components/ui/*` (thiếu thì `pnpm dlx shadcn@latest add`); không `<button>`/`<input>`/
      `<select>`/`<a>`/`<img>` trần; liên kết dùng `<Link />` từ `@/i18n/navigation` (không import `next/link` trong
      module); ảnh dùng `<Image />`; không lặp `locale === "en" ? "en-US" : "vi-VN"`, `.toLocaleString("vi-VN")` hay
      export hằng `UPPER_CASE` trong `.tsx` (`tests/unit/code-conventions.test.ts`); kiểu dáng qua `variant`/`size`; nút
      chỉ icon có `aria-label`; mọi tooltip dùng `AppTooltip` / shadcn `Tooltip` (cấm thuộc tính HTML `title=` thô).
- [ ] Người tạo/chủ sở hữu/người dùng dùng `formatUserDisplayName` / `formatOwnerDisplayName` (`fullname (username)` hoặc `username`); mốc thời gian dùng `<TimestampText />` / `formatDateTimeWithRelative` (`dd/MM/yyyy HH:mm:ss (thời gian đếm)`), cột chỉ có ngày dùng `formatExplicitDate` (`dd/MM/yyyy`).
- [ ] Model có `JournalTracker` trên trang `[id]` (Admin & Portal) đều có tab `?tab=history` qua `RecordDetailTabs` + `RecordHistoryView` / `ActivityTimeline` (lọc thao tác, xem thêm, dịch field/enum), và `<FormPage backHref=...>` + `<FormBackButton />` giữ nút `Quay lại` khi đổi tab.
- [ ] Chỉ Tailwind utility + `cn()`; không `style={{}}` tĩnh, không hex/`bg-blue-500` cho màu thương hiệu; mobile-first,
      375px không cuộn ngang; dark mode đúng nhờ token.
- [ ] View kiểm quyền: `ForbiddenView` khi thiếu quyền trang; trang chi tiết dùng `useEditMode` + `EditModeProvider`.
- [ ] Bảng truyền đủ `onView`/`onEdit`/`onDelete` + `can`; không có `onX={canX ? fn : undefined}`.
- [ ] Có Xoá thì có `onBulkDelete`; có cờ boolean bật/tắt thì có `bulkStatus`; dùng `useBulkActions`
      (`tests/unit/table-conventions.test.ts` kiểm).
- [ ] Class màu có token trong `globals.css`; không giá trị tùy ý khi thang Tailwind có sẵn.
- [ ] Dialog `p-0` + `DialogFooter` có `mx-0 mb-0`; dialog có tab cao cố định.
- [ ] Mục menu có `permission`; module hơn 5 mục thì mọi mục có `section`, cùng cụm liền nhau.
- [ ] Hằng quyền ở file `permissions/*-permission.ts` khớp đúng một class quyền BE và dùng `createResourcePermissions` + `<M>_SCOPE` + `PERMISSION_ACTION`; không hardcode chuỗi quyền, `queryKey` chuỗi thô hay mã lỗi auth ngoài `constants/` (`code-conventions.test.ts`).
- [ ] Không `any`, không `console.log`, không đọc `process.env` ngoài `shares/config`.
- [ ] Key localStorage/sessionStorage, cookie, query key và tên hằng giữ chúng không có tiền tố `toannx`.
- [ ] Không tự viết lại thứ đã có trong `docs/common-catalog.md` mục 4–5 (input, bảng, form, hook, lib...).
- [ ] Route quản trị mới có tiền tố module trong `<M>_PATHNAMES` (`/quan-tri/<module-vi>/...`).
- [ ] Không có `<svg>`/`<path>` nội tuyến hay data URI SVG; SVG nằm trong `public/`, gọi qua hằng đường dẫn.
- [ ] Đã thêm/đổi common (BE hoặc FE) thì `docs/common-catalog.md` đã cập nhật.
- [ ] Đổi thứ đi vào OpenAPI (kể cả docstring view/method) thì đã chạy `pnpm api:types`, `api-schema.gen.ts` đi cùng commit.
- [ ] `tests/unit/one-unit-per-file.test.ts` và `app/core/tests/test_one_class_per_file.py` đạt (một đơn vị một file).
- [ ] Với UI/luồng đã sửa: có test liên quan, Playwright mở UI thật; ảnh chụp đã được xem, responsive, trạng thái,
      tương tác, console và network đã được kiểm; nếu chưa thì ghi rõ lý do.

Tài liệu:

- [ ] `docs/modules/<module>/README.md` và `docs/features/*.md` liên quan khớp với code sau khi sửa.
- [ ] `docs/reports/code-audit-tracker.md` đã ghi nhận ngày sửa/kiểm bằng `scripts/audit_tracker.py` (`mark-changed` hoặc `mark-checked`).
- [ ] Đổi `docs/rules/` hoặc quy trình → `.agents/rules/` đã sửa, `python scripts/sync-ai-rules.py --check` đạt,
      `CLAUDE.md` ↔ `AGENTS.md` khớp; nếu người dùng có nêu rule mới chưa có trong tài liệu, đã tự động cập nhật đủ các nơi trên trong cùng lượt.

## 6. BÁO CÁO

Ngắn gọn, đủ các ý:

1. Đã đổi gì (theo nhóm BE / FE / tài liệu), file chính.
2. Common đã dùng lại / thêm mới (đã vào `docs/common-catalog.md` chưa).
3. Vi phạm rule đã sửa thêm ở file nào.
4. Lệnh kiểm tra đã chạy và kết quả (số test pass/fail); phần nào **chưa** kiểm và lý do.
5. Vi phạm thấy mà chưa sửa (kèm lý do), việc còn tồn.
6. Chỉ soạn nội dung commit (dùng `commit-demo`) hoặc thực hiện commit và push (dùng `commit-push`) **khi người dùng
   yêu cầu**; mặc định không tự gợi ý commit ở cuối báo cáo, và không bao giờ chèn `Co-Authored-By:` hay nguồn AI bên
   ngoài vào commit.

## 7. NHẮC LẠI

- KHÔNG viết code khi chưa đọc rule.
- KHÔNG đụng phần ngoài phạm vi, KHÔNG tự thao tác git. Sửa vi phạm rule trong file đã mở **là trong phạm vi**.
- KHÔNG bỏ qua vi phạm thấy được trong file đã mở: sửa luôn, hoặc báo lý do chưa sửa.
- KHÔNG chạy toàn bộ test khi chưa được yêu cầu.
- KHÔNG tuyên bố hoàn thành khi chưa kiểm tra.
- LUÔN nhất quán với hệ thống hiện tại.

# 8. YÊU CẦU
