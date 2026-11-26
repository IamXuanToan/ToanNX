# AGENTS.md — ToanNX

Đọc theo thứ tự trước khi viết code:

1. [SYSTEM_CONTEXT.md](SYSTEM_CONTEXT.md) — bối cảnh và quyết định đã chốt.
2. [docs/rules/common.md](docs/rules/common.md) — rule chung (code sạch, bảo mật, API contract, test).
3. [docs/rules/backend.md](docs/rules/backend.md) — Django: `url → view → service → repository`, base trong `app/core`.
4. [docs/rules/frontend.md](docs/rules/frontend.md) — Next.js: `page → view → component+hook → hook → service`.
5. [docs/rules/git.md](docs/rules/git.md) — tên nhánh, commit và quy trình push.
6. [docs/common-catalog.md](docs/common-catalog.md) — danh mục common BE + FE đang có (tra trước khi viết).

Mục lục tài liệu: [docs/README.md](docs/README.md) — `docs/architecture/` (kiến trúc, xác thực, phân quyền, i18n,
kiểm thử), `docs/guides/` (triển khai, R2, OAuth, thông báo, tài chính), `docs/modules/<module>/` (tài liệu từng
module), `docs/features/` (mô tả từng chức năng: phạm vi quyền, ẩn/khóa theo quyền, cột Thao tác, sidebar, file
công khai/riêng tư, Web Push). Lý do của các chuẩn: [docs/plans/2026/11/15/system-standardization-plan.md](docs/plans/2026/11/15/system-standardization-plan.md).

Ba skill workflow đã chứa quy trình giao việc: Claude Code gọi `/start-task`, `/fix`, `/review-code`; Codex gọi
`$start-task`, `$fix`, `$review-code`, hoặc chỉ chat thường để AI tự chọn. [prompt.md](prompt.md) là bản tra cứu tùy chọn,
không cần dán khi gọi skill. Rule cho AI (tóm tắt, có trigger): [.agents/rules/](.agents/rules/);
sinh bản cho Claude Code: `python scripts/sync-ai-rules.py` (kiểm lệch: `--check`).

**Mỗi lượt chat trong repo**: tự đọc `.agents/rules/00-core.md`, `01-workflow.md`, `90-done-checklist.md`;
chọn các rule `model_decision` theo nghĩa yêu cầu và đọc chúng; khi mở hoặc sửa file thì đọc rule `glob` có mẫu
khớp đường dẫn. Chọn skill project theo mô tả trong `.agents/skills/*/SKILL.md` và bảng ở `01-workflow.md`;
đọc skill đã chọn trước khi làm. Nếu một skill cần dùng chưa có trong project, cài vào cả `.agents/skills/` và
`.claude/skills/`, rồi kiểm trigger trước khi dùng. Người dùng chỉ cần giao việc bằng chat thường.

## Quy tắc cốt lõi

- **Đồng bộ `AGENTS.md` ↔ `CLAUDE.md`**: sửa file này thì sửa luôn phần tương ứng trong `CLAUDE.md` (và ngược
  lại) trong cùng lần đó; nội dung rule hai file phải khớp. Đổi rule trong `docs/rules/` có tóm tắt ở đây thì
  cập nhật cả hai.
- **Rule AI: nguồn duy nhất là `.agents/rules/`, bản rule Claude được sinh tự động**: mỗi `.agents/rules/<số>-<tên>.md` có
  frontmatter `trigger` (`always_on` luôn nạp, `model_decision` AI tự chọn theo `description`, `glob` nạp khi file
  khớp `globs`, `manual` chỉ khi gọi) và tóm tắt `docs/rules/` (vẫn là nguồn đầy đủ, thắng khi lệch).
  `python scripts/sync-ai-rules.py` sinh `.claude/rules/` (always_on, glob → `paths:`), `.claude/skills/rule-<tên>/`
  (model_decision, gồm `rule-rule-audit`) và `.claude/commands/<tên>.md` (chỉ cho rule `manual`); checklist là
  `always_on`, không sửa tay file
  sinh ra. Đổi rule trong `docs/rules/` (hoặc quy trình/bảng kiểm) thì sửa rule AI tương ứng, chạy lại script, và
  cập nhật `CLAUDE.md`, `AGENTS.md`, `prompt.md` trong cùng lần; `--check` chạy trong `scripts/check-all.*`
  (rule chung mục 4).
- **Skill project**: `start-task` cho việc mới, `fix` cho lỗi, `review-code` cho lượt rà cuối do người dùng yêu
  cầu, cùng các skill hỗ trợ `create-plan`, `review-plan`, `test`, `refactor`, `review-security`, `i18n-audit`,
  `permission-audit`, `db-migration`, `check-ci`; mỗi skill đọc source, `docs/` và rule liên quan trước khi
  làm/sửa. Skill nội bộ ở `.agents/skills/`
  được liên kết sang `.claude/skills/`; skill ngoài cài qua CLI có nguồn/commit ở `skills-lock.json`. Chỉ
  `.claude/skills/rule-*/` do script rule sinh; chọn theo `.agents/rules/01-workflow.md`, ưu tiên `docs/rules/`.
  Đổi các skill project hoặc chuyên môn thì chạy `python scripts/check-workflow-skills.py` để kiểm trigger và bản Claude.
- **Không tự thao tác git**: không tạo nhánh, commit, push, merge, xóa nhánh khi chưa được yêu cầu rõ; làm trên
  nhánh hiện tại. Sau mỗi task, đọc Git status/diff và trả nội dung commit theo [docs/rules/git.md](docs/rules/git.md)
  cho toàn bộ thay đổi chưa commit, kể cả thay đổi có sẵn: mỗi commit có tiêu đề + body trong khối `text` để dán
  vào VS Code, không phải câu lệnh Git. Không tự stage hay commit.
- **Một file một đơn vị**: mỗi class, component, hook một file (kể cả phần không export). Ngoại lệ: file APIView
  chứa `XxxView` + `XxxObjectView`; file model chứa model + enum của chính model đó; `shares/components/ui/*` của
  shadcn; export đặc biệt của Next trong `page.tsx`/`layout.tsx`. Class lồng trong class cha (`Meta`, enum trong
  model) được chấp nhận ở toàn hệ thống. Chi tiết: rule backend §2.2, rule frontend §2.1.
- **Component và view chia theo model**: `components/<nhóm>/<tên>.tsx` + `components/<nhóm>/hooks/use-<tên>.ts`,
  `views/<nhóm>/<tên>-view.tsx`; `<nhóm>` = model BE (trùng `services/<nhóm>.service.ts`), màn không gắn model thì
  theo chức năng (`auth`, `current-user`, `reader`, `dashboard`, `shell`...). Không có file ở gốc
  `components/`/`views/`, không có `components/hooks/` cấp gốc, không có `views/hooks/`, không có nhóm
  `shared`/`common` (dùng chung → nhóm dùng nhiều nhất; toàn app → `shares/`). View chỉ gọi `usePermission`,
  `useTranslations`, `useEditMode` (rule frontend §2, `tests/unit/module-structure.test.ts`).
- **Đổi OpenAPI thì sinh lại kiểu API**: đổi route, view, serializer, `@extend_schema`, `help_text`, mã lỗi —
  **hoặc chỉ docstring của class view / method HTTP** (drf-spectacular đưa vào mô tả OpenAPI) — thì chạy
  `pnpm api:types` ngay trong lần đó và commit `frontend/src/shares/types/api-schema.gen.ts`; CI đỏ nếu lệch
  (rule backend mục 6).
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
- **Bí mật dùng `DJANGO_SECRET_KEY` khi hệ thống tự tạo và tự kiểm**: ký token, băm, mã xác minh nội bộ dẫn
  xuất từ `DJANGO_SECRET_KEY` (`django.core.signing` / `salted_hmac`, salt riêng từng mục đích), không thêm biến
  env bí mật mới. Bí mật bên thứ ba cấp cho cả hệ thống (OAuth secret, `CRON_SECRET`, khóa R2, service account
  Firebase) dùng biến riêng; bí mật bên thứ ba của từng người dùng (token SePay, token bot Telegram) lưu DB mã hóa
  bằng `SecretCipher`, không qua env; không đưa `DJANGO_SECRET_KEY` ra ngoài; không ghi bí mật thật vào
  `.env.example` (rule chung mục 5).
- **Quyền thành viên khai trong class quyền**: mỗi `XxxPermission` tự khai `MEMBER = (READ, CREATE, ...)`,
  `module.py` gom `member_permissions=(*XxxPermission.member(), ...)`; không khai bằng chuỗi/mẫu `*`; `MEMBER` không
  chứa `manage_all`/`read_private`. Phạm vi "của mình" đến từ việc thiếu `manage_all` (rule backend mục 9,
  [docs/features/permission-scope.md](docs/features/permission-scope.md)).
- **Ẩn/khóa theo quyền ba tầng**: menu ẩn mục thiếu quyền `read` (module hết mục thì ẩn); View trả `ForbiddenView`
  khi thiếu quyền trang; trang chi tiết mặc định chỉ xem (`useEditMode` + `EditModeProvider`, nút Sửa → `?mode=edit`),
  có `read` mà không `update` thì không sửa được. Mỗi class quyền BE một file quyền FE cùng tên (rule frontend §3.1).
- **Cột Thao tác luôn có Xem / Sửa / Xóa**: luôn truyền `onView`/`onEdit`/`onDelete`, thiếu quyền khai ở
  `can={{ update, delete }}` để nút mờ + tooltip, không ẩn nút; ngoại lệ (phiên, thông báo chung, tỷ giá, nhật ký,
  thư viện file) ghi ở [docs/features/table-actions.md](docs/features/table-actions.md) (rule frontend §3.1).
- **Chọn nhiều và thao tác hàng loạt**: bảng có Xoá thì bắt buộc có cột chọn + Xoá hàng loạt; tài nguyên có cờ
  boolean bật/tắt thì có Đổi trạng thái hàng loạt. BE bật `bulk_delete_enabled` / `bulk_update_serializer_class`;
  FE dùng common `useBulkActions` + `createBooleanBulkStatus`; bảng không có thao tác thì cột Thao tác tự ẩn
  (rule backend mục 9, rule frontend §3.1, `tests/unit/table-conventions.test.ts`).
- **Sidebar không nhãn module thừa**: nhóm chỉ một module thì không hiện nhãn module IN HOA (rule frontend §4.1).
- **Menu module chia cụm**: module hơn 5 mục khai `section` cho mọi mục, mục cùng cụm liền nhau; sidebar thu gọn
  có vạch ngăn giữa cụm, tooltip "Cụm › Mục" (rule frontend §4.1).
- **File công khai/riêng tư**: ảnh hiển thị cho khách (avatar, logo QR, ảnh trang công khai) bắt buộc công khai;
  chứng từ/hóa đơn/CSV/XLSX/XML bắt buộc riêng tư; API không bao giờ trả URL storage của file riêng tư (chỉ
  `/attachments/{id}/content`) (rule chung mục 5.2).
- **Tài liệu `docs/` cập nhật cùng lần sửa**: đổi model/quyền/route/sự kiện/webhook của module →
  `docs/modules/<module>/README.md`; đổi cách một chức năng chạy → `docs/features/<chức-năng>.md`; module mới thêm
  thư mục `docs/modules/<module>/`; kế hoạch triển khai lưu theo ngày lập ở `docs/plans/<YYYY>/<MM>/<DD>/`
  (không đặt file ở gốc `docs/plans/`) (rule chung mục 4).
- **Thông báo chỉ qua `NotificationService.notify`**: sự kiện khai `scope`/`audience`/`permission` trong
  `ModuleDescriptor.notification_events`; sự kiện `OWNER` phải truyền `recipient`; không tự gửi email/Telegram/push.
  Request không bao giờ gọi FCM/SMTP/Telegram: `notify` chỉ ghi outbox rồi đá QStash sau commit (cron là lưới an
  toàn); mọi lời gọi dịch vụ ngoài đều có timeout (rule backend mục 9).
- **Ngân sách gói free**: Redis (`CacheService`) chỉ để tăng tốc (PostgreSQL vẫn là nguồn gốc, Redis lỗi → dự phòng,
  không 500); chỉ cache dữ liệu công khai; lượt khách và cron không chạm Neon khi cache/mốc còn hiệu lực. Xem
  [docs/architecture/infrastructure.md](docs/architecture/infrastructure.md) trước khi thêm việc tốn
  DB/Redis/R2/function (rule backend mục 9).
- **URL quản trị có tiền tố module**: `/quan-tri/<module-vi>/...` (en `/admin/<module-en>/...`), ví dụ
  `/quan-tri/he-thong/nguoi-dung`, `/quan-tri/truyen/tac-gia`; chỉ sửa `<M>_PATHNAMES`, pathname nội bộ và thư mục
  `app/` giữ nguyên; sửa URL trong E2E/tài liệu cùng lần (rule frontend mục 1).
- **Webhook/callback khai trong `ModuleDescriptor`** (`webhooks=`, `callbacks=`) để hiện ở Hệ thống → Webhook /
  Callback; sửa endpoint là sửa khai báo cùng lần. URL không hardcode domain: `build_backend_url` (backend),
  `get_frontend_origin` (FE) (rule backend mục 8).
- **File env**: `.env.local` = local + pytest (PostgreSQL local, lưu file filesystem, không khóa R2, email console),
  `.env` = production (toannx.com / api.toannx.com), `.env.example` = đủ mọi biến kèm chú thích tiếng Việt. Backend
  có `.env.local` thì chỉ đọc file đó; `backend/conftest.py` tắt R2/Cloudflare/Firebase trong test và dừng nếu DB test
  không ở local (rule chung mục 5).
- **Biến môi trường luôn có trong `.env.example`**: thêm/đổi/xóa biến thì cập nhật `backend/.env.example` hoặc
  `frontend/.env.example` cùng lần, mỗi biến có chú thích tiếng Việt có dấu (dùng làm gì, lấy ở đâu, để trống
  thì sao), bí mật để trống; biến production ghi thêm vào `docs/guides/deployment.md` (rule chung mục 5).
- **Chỉ kiểm tra phần đã sửa**: format/lint/typecheck file đã sửa và test liên quan (BE đúng file
  `test_<resource>_<action>_api.py`, FE đúng file Vitest/spec E2E của luồng). Chạy toàn bộ (`scripts/check-all.*`,
  `pnpm e2e` đầy đủ, `uv run pytest`/`pnpm test` không chỉ định file) chỉ khi người dùng yêu cầu, kể cả khi sửa
  nhiều file (rule chung mục 7).
- **Chọn workflow theo câu chat**: lên kế hoạch/viết plan vào `docs/plans/<YYYY>/<MM>/<DD>/` → `create-plan`;
  review/thẩm định plan trong `docs/plans/<YYYY>/<MM>/<DD>/` → `review-plan`; task/tính năng mới → `start-task`; sửa lỗi/regression/test fail → `fix`;
  người dùng yêu cầu review code cuối → `review-code` (tự sửa lỗi xác nhận được và kiểm lại, rồi trả commit đúng
  `docs/rules/git.md`). Yêu cầu tự tạo test/chụp ảnh Playwright/monkey test → `test`; tái cấu trúc code → `refactor`;
  audit bảo mật kèm giả lập tấn công và file xác nhận trong `docs/` → `review-security`; rà thiếu i18n → `i18n-audit`;
  rà ma trận quyền BE–FE → `permission-audit`; thiết kế model/migration → `db-migration`; kiểm tra và sửa để bảo
  đảm GitHub CI luôn pass → `check-ci`. Chỉ một workflow chính; thêm
  skill chuyên môn theo phần việc. Yêu cầu audit bảo mật/code an toàn → `security-best-practices`; rà hiệu năng Django
  → `django-perf-review`; đo tốc độ trang/Core Web Vitals → `web-perf`; viết/sửa unit test FE → `vitest`;
  viết/sửa E2E spec → `playwright-best-practices`;
  mở UI thật → `playwright-cli`. Khi sửa xác thực, quyền, webhook, URL ngoài hoặc file riêng tư, kiểm ranh giới
  tin cậy và test nhánh từ chối liên quan. Khi sửa đường nóng, đo query/request/cache trước khi kết luận hiệu năng.
  Skill ngoài không ghi đè `docs/rules/` và không cho phép chạy toàn bộ test khi chưa được yêu cầu.
- **Xác minh UI sau khi sửa**: dùng `ui-ux` khi phân tích/thiết kế, `web-design-guidelines` để rà
  accessibility/UX, `vercel-react-best-practices` khi viết/review React/Next.js; tạo hoặc cập nhật test liên quan.
  Dùng `playwright-cli` mở UI thật, chụp ảnh và xem lại, kiểm responsive, trạng thái, tương tác, console và network.
  Nếu không mở được UI thì báo rõ phần chưa kiểm; không chạy toàn bộ E2E nếu chưa được yêu cầu.
- **Chạy test Backend trên PostgreSQL local**: khi chạy test backend (`pytest`), `DATABASE_URL` bắt buộc trỏ về
  PostgreSQL local (`postgresql://postgress:123456@localhost:5432/toannx?sslmode=prefer`, user `postgress`, pass `123456`),
  không trỏ tới DB cloud/server (Neon) để tránh quá lâu và timeout; luôn chạy với `--reuse-db`
  (`uv run pytest --reuse-db ...`).
- Làm đúng phạm vi, không thêm dependency khi chưa được đồng ý; docstring/comment tiếng Việt.
- **Mọi phản hồi cho người dùng bằng tiếng Việt có dấu**: cập nhật, câu hỏi, lỗi và báo cáo cuối, kể cả khi skill
  viết tiếng Anh; giữ nguyên tên file, mã, API và lệnh. Chưa kiểm được trên giao diện thật thì nói rõ.
- **Màu và dialog**: class màu ngữ nghĩa phải có token `--color-<tên>` trong `globals.css`
  (`tests/unit/theme-tokens.test.ts`); ưu tiên thang Tailwind thay giá trị tùy ý; `DialogContent p-0` thì
  `DialogFooter` thêm `mx-0 mb-0`; dialog có tab cao cố định, chỉ thân cuộn (rule frontend §3.1.1, §4.0). Form/trang có Tab chính (`PageForm`, `PortalProfile`...): đồng bộ URL query param `?tab=...` qua `useTabState` (`window.history.replaceState`). Bảng/danh sách/bộ lọc: bắt buộc lưu toàn bộ phân trang (`page`, `pageSize`), tìm kiếm (`search`), sắp xếp (`ordering`), bộ lọc (`filterKeys`) và khoảng ngày/năm vào URL query params qua `useTableState` hoặc `window.history.replaceState` (F5 không mất filter/trang). Slug công khai (`Page`, `ShortLink`) hỗ trợ giữ nguyên chữ hoa chữ thường kiểu `ToanToChill` (`preserveCase: true`).
- **Hủy request**: truyền `signal` của React Query cho `apiClient`, không tự abort `fetch` (rule frontend mục 5).
- **ViewSet chỉ đọc mở `post` cho bulk** thì khai `"create": DENY`; xoá model không có `deleted_at` bằng
  `hard_delete` có lý do; field unique ngắn dùng `UniqueConstraint` có điều kiện (rule backend mục 9).
- **Chuẩn Next.js và primitive shadcn**: hiển thị ảnh bắt buộc dùng `<Image />` từ `next/image` (cấm `<img>` trần); thẻ liên kết bắt buộc dùng `<Link />` từ `@/i18n/navigation` (kể cả link ngoài với `href={url as never}`; `next/link` chỉ dùng ngoài `[locale]` như `app/not-found.tsx`; cấm `<a>` trần); hằng số dùng chung (locale, timezone, tiền tệ, phân trang, ID toast) lấy từ `shares/constants/` và `shares/lib/number-format.ts` (`tests/unit/code-conventions.test.ts`); mọi UI primitive (`Button`, `Checkbox`, `Input`, `Label`...) lấy từ `@/shares/components/ui/`; cấm toàn bộ thẻ HTML trần tương tác (`<button>`, `<input>`, `<select>`, `<textarea>`, `<a>`, `<img>`).
- **Tải dữ liệu 100% phía Client (cấm gọi API ngầm ở SSR)**: mọi trang (kể cả trang công khai như link rút gọn `/s/[slug]`, custom page `/p/[slug]`) bắt buộc gọi API lấy dữ liệu ở phía Client thông qua React Query (`useQuery`) + `service` + `apiClient`. Cấm dùng Server Component gọi API ngầm (`serverApiGet`/`backendFetch`/`fetch` ngầm ở server Next.js) để render trang; `page.tsx` chỉ nhận params và render View. Bắt buộc có API call hiển thị trực tiếp trên tab Network của DevTools trình duyệt để phục vụ việc debug lỗi, đồng thời tránh lỗi mạng/WAF/Cloudflare chặn giữa các serverless functions (rule frontend §1, §5).
- **`graphify update .` chỉ chạy khi thay đổi lớn** (thêm/xóa/gộp module, đổi cấu trúc thư mục, di chuyển/đổi tên
  khoảng 10 file trở lên, refactor kiến trúc) **hoặc graph đã cũ** (`graphify-out/graph.json` quá 7 ngày, hay
  `graphify query` trả về file/symbol không còn). Sửa nhỏ thì không chạy.

## Thêm module mới (ví dụ `links`) — chỉ khai báo theo base

Backend:
1. `uv run python manage.py startapp links app/links`; `apps.py` kế thừa `CoreModuleConfig`
   (`default = True`, `name = "app.links"`, `label = "links"` = mã module).
2. `permissions/<model>_permission.py` (PermissionCatalog cho từng model riêng biệt, mỗi model 1 file, không gộp chung; mỗi quyền có name + description; mã dạng `<module>.<resource>.<action>`),
   `constants/<module>_error_code.py` (StrEnum mã lỗi riêng, thêm bản dịch FE — test bắt nếu thiếu), `module.py`
   (`ModuleDescriptor(..., permissions=(*ModelAPermission.all(), *ModelBPermission.all()), dependencies=..., cleanup_tasks=..., notification_events=...)`;
   `notification_events` là các `NotificationEventDefinition` mã `<module>.<resource>.<event>` module có thể phát;
   `webhooks`/`callbacks` là `WebhookDefinition`/`CallbackDefinition` của endpoint bên thứ ba gọi/chuyển về).
   Module có quyền phải khai `member_permissions=(*ModelAPermission.member(), ...)`; quyền thành viên khai ở
   `MEMBER = (...)` trong từng class quyền (không gồm `manage_all`/`read_private`).
   Module mới tự có vai trò `<MÃ_MODULE>_MANAGER`/`_VIEWER`/`_MEMBER` khi chạy `uv run python manage.py seed_roles`
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
   Mỗi hook một file `hooks/use-<tên>.ts`; mỗi component một file trong `components/<model>/`
   (`components/link/link-table.tsx`), hook của component ở `components/<model>/hooks/`; view ở `views/<model>/`.
   Chi tiết bản ghi: component `<model>-profile.tsx` tự tải dữ liệu, View chỉ kiểm quyền và ghép.
3. Bảng `DataTable` + `useTableState`, cột Thao tác luôn Xem/Sửa/Xóa (`onView`/`onEdit`/`onDelete` + `can`);
   trang chi tiết chỉ xem mặc định (`useEditMode` + `EditModeProvider`); một form cho tạo/sửa/xem (`FormPage` + `FormLayout` + `FormSection` +
   `FormActions`); tạo/sửa nhanh tài nguyên liên quan bằng `FormDialog` chứa đúng form đó. Soạn thảo dùng
   `TiptapEditor` (JSON), hiển thị bằng `TiptapContent`. Chi tiết: rule frontend mục 3.1.
4. Ghép vào `src/i18n/routing.ts`, `src/i18n/messages.ts`, `src/global.d.ts`, `ADMIN_MODULE_NAVIGATION`
   (`navigation.ts` khai `module`, `nameKey`/`descriptionKey`, `labelKey` là khóa đầy đủ trong namespace của module;
   hơn 5 mục thì mỗi mục khai `section: "<module>.navSections.<cụm>"`).
   `tests/unit/module-registry.test.ts` đỏ nếu quên chỗ nào.
   Chạy `pnpm api:types` khi đổi bất kỳ thứ gì đi vào OpenAPI (serializer, view, kể cả docstring của view/method); kiểu viết tay thêm một dòng vào `tests/unit/api-contract.test.ts`
   (hoặc dùng thẳng `ApiModel<"…Response">`). Model có `JournalTracker` thì thêm tiền tố nhãn field vào
   `system/constants/journal-field-prefixes.ts`. Lỗi tải bản ghi dùng `QueryErrorState`.
5. Module cùng cấp không import nhau: page ghép qua slot (`extensions`, `history`, `editorPlugins`).
   Lịch sử thay đổi: page truyền `<RecordHistoryView path=".../{id}/history" fieldPrefix="links.fields" />`.
6. Quy chuẩn UI & Tối ưu:
   - Hiển thị ảnh bắt buộc dùng `<Image />` từ `next/image` (không dùng thẻ `<img>` trần).
   - Thẻ liên kết bắt buộc dùng component `<Link />` từ `@/i18n/navigation` (kể cả liên kết ngoài `target="_blank"` với `href={url as never}`), hoặc bọc bằng `<Button asChild><Link href="...">...</Link></Button>`; tuyệt đối không dùng thẻ `<a>` trần hay import `next/link` trong module.
   - Mọi UI primitive (`Button`, `Checkbox`, `Label`, `Input`, `Dialog`, `Card`...) bắt buộc dùng từ `@/shares/components/ui/` (nếu thiếu thì tải bằng `pnpm dlx shadcn@latest add <name>`, không tự chế; không bọc button/checkbox vào thẻ `<label>`).
   - Tên tệp đính kèm (`original_name` / `alt_text`) phải cho phép người dùng đổi tên và cấu hình alt text.
   - Thanh thao tác hàng loạt (`TableBulkBar` / bulk bar chọn nhiều): bắt buộc thiết kế trên 1 dòng duy nhất (`min-h-12 w-full flex items-center justify-between gap-3 rounded-xl border px-3.5 py-1.5`), tuyệt đối không dùng container flex-col hoặc bọc trong thẻ `Card` gây tách 2 tầng và căn giữa; bên trái là badge số lượng + vạch chia + nút Bỏ chọn, bên phải là cụm nút hành động.

Tài liệu: thêm `docs/modules/links/README.md` (mục đích, model, quyền + `MEMBER`, màn quản trị theo cụm, sự kiện,
webhook/callback) và dòng mục lục ở `docs/README.md`.

Không cần sửa core hay IAM.
