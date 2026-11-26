# Rule chung (backend + frontend)

Áp dụng cho mọi người và AI agent. Rule riêng: [backend.md](backend.md), [frontend.md](frontend.md).

## 1. Thứ tự ưu tiên

Correctness > Security > Maintainability > Performance > Developer Experience > Visual polish.

## 2. Phạm vi và cách làm

- Làm đúng phạm vi được yêu cầu; không thêm tính năng, module giả hay API trả dữ liệu mock.
- **Mở file nào thì kiểm rule file đó**: vi phạm trong file đang mở (đọc hay sửa) thì sửa luôn, coi là trong phạm
  vi, và ghi vào báo cáo. Sửa kéo theo đổi contract API/migration hoặc lan khoảng 10 file trở lên thì báo trước.
- Không over-engineering: không tạo abstraction/thư mục chỉ để đủ tên; không để thư mục rỗng.
- **Agent trả lời người dùng bằng tiếng Việt có dấu** (cập nhật giữa chừng, câu hỏi, báo cáo cuối), kể cả khi
  skill/tài liệu tham khảo viết tiếng Anh. Tên file, mã, lệnh giữ nguyên.
- Tìm hiểu codebase: chạy `graphify query "<câu hỏi>"` trước khi grep/đọc file (`graphify-out/graph.json`);
  chỉ đọc file thô ở đúng chỗ graph đã chỉ ra.
- Sửa xong mà chưa kiểm được trên giao diện thật (thiếu tài khoản, DB E2E lỗi…) thì nói rõ trong báo cáo,
  không tuyên bố đã chạy đúng.
- Scaffold bằng CLI chính thức: `uv init`, `uv add`, `django-admin startproject`, `manage.py startapp`,
  `create-next-app`, `pnpm add`, `shadcn add`. Không viết tay lockfile hay khai báo dependency giả.
- Không sửa source tham khảo (PMS, Medoly); không copy credentials hay cấu hình production.

## 3. Code sạch

- **Một file một đơn vị**: mỗi class một file (BE và FE), mỗi component một file, mỗi hook một file. Tên file
  snake_case (BE) / kebab-case (FE) trùng tên class/component/hook (`RoleSeedService` → `role_seed_service.py`,
  `UserMenu` → `user-menu.tsx`, `useUserMenu` → `use-user-menu.ts`).
  - Áp dụng cả cho phần **không export**: class phụ, component con, hook nội bộ viết "tạm" trong file khác đều
    phải tách ra file riêng. Không có ngoại lệ "chỉ dùng trong file này".
  - Hằng số, enum, dataclass, kiểu dùng ở nơi khác không khai trong file của class/component/hook: đưa vào
    `constants/`, `types/` (BE và FE); hàm tiện ích dùng từ hai file trở lên vào `utils/` (BE) / `lib/` (FE).
    Hàm private và hằng số private **chỉ file đó dùng** được giữ trong file (không export).
    Chi tiết: [backend.md §2.2](backend.md), [frontend.md §2.1](frontend.md).
  - Ngoại lệ BE: file APIView chứa đúng 2 class `XxxView` + `XxxObjectView` của một tài nguyên; file model
    chứa model + enum của nó (mục dưới).
    Ngoại lệ FE: `shares/components/ui/*` (đầu ra shadcn) và export đặc biệt của Next trong `page.tsx`/`layout.tsx`.
  - **Class lồng được chấp nhận ở toàn hệ thống**: class con khai bên trong class cha và chỉ phục vụ class cha
    (`class Meta`, `class Config`, `class Status(models.TextChoices)` trong model) thì giữ trong class đó, không tính
    là class thứ hai. Class con mà nơi khác cũng dùng thì tách file riêng.
  - Ngoại lệ BE chỉ cho **file model**: `models/<model>.py` được khai thêm enum (`TextChoices`/`IntegerChoices`)
    của chính model đó cạnh class model (xem [backend.md §2.2](backend.md)).
  - Ví dụ code trong docstring/comment không tính.
- Hàm làm một việc; tên nói rõ ý định (`get_manageable_user`, `useLoginForm`), không viết tắt khó hiểu.
- Viết code có xuống dòng ngay từ đầu, không sinh code nén để chờ formatter sửa: mỗi statement một dòng;
  khối `if`/`try`/`catch`, callback nhiều bước và JSX nhiều prop phải tách dòng, thụt lề rõ ràng.
  Chạy formatter trước khi bàn giao và kiểm tra format trong gate của repo.
- Tách khối logic bằng một dòng trống; nghiệp vụ nhiều bước dùng comment bước:

  ```text
  # ============================================================
  # BƯỚC 1: Kiểm tra dữ liệu đầu vào
  # ============================================================
  ```

  Chỉ dùng cho nghiệp vụ thực sự nhiều bước, không chèn vào hàm ngắn.
- Không magic number/string: đặt hằng số có tên (constants, settings, enum).
  - Các chuỗi/cấu hình dùng chung toàn app (locale, timezone, tiền tệ, mã hóa/header HTTP mặc định, mẫu email,
    ID toast phiên, tùy chọn phân trang) khai **một chỗ duy nhất** ở `backend/app/core/constants/defaults.py` (BE)
    hoặc `frontend/src/shares/constants/` (FE); hằng riêng của module đặt trong `constants/` của module (BE:
    `auth_frontend_routes.py`, FE: `auth-storage.ts`, `page-constants.ts`, `page-theme-presets.ts`...).
  - Tuyệt đối không lặp rải rác `locale === "en" ? "en-US" : "vi-VN"`, `"Asia/Ho_Chi_Minh"`, `"VND"`/`"₫"`, tên key
    `localStorage`/`sessionStorage`/toast hoặc lời gọi `.toLocaleString("vi-VN")` trong component/hook/service; dùng
    helper chuẩn (`getNumberLocale`, `formatVndText`, `formatDisplayNumber` ở `shares/lib/number-format.ts`).
- **Không có tiền tố `toannx` trong tên kỹ thuật** (cả BE và FE), ở mọi dạng viết (`toannx_`, `toannx-`,
  `toannx:`, `toannx.`, `TOANNX_`, `toannxAuth`):
  - **Tên cookie**: `access_token`, `refresh_token`, `session_hint`, `csrftoken`; không `toannx_access`, `toannx-auth`.
  - **Key localStorage/sessionStorage/IndexedDB**: `<module>_<việc>` như `novel_reader_settings`,
    `attachment_view_mode`; không `toannx_theme`, `toannx:draft:<id>`.
  - **Tên biến/hằng giữ các key đó**: `READER_SETTINGS_KEY`, `ACCESS_COOKIE_NAME`; không `TOANNX_STORAGE_KEY`.
  - Cũng áp cho header (`X-Request-Id`, không `X-Toannx-...`), query/cache key, claim JWT, tên event, kênh
    `BroadcastChannel`, biến môi trường (`DATABASE_URL`, không `TOANNX_DATABASE_URL`), khóa setting.
  - Trình duyệt đã tách storage/cookie theo domain nên tiền tố là thừa; đổi tên dự án cũng không phải đổi key.
  - Tên dự án chỉ xuất hiện ở nội dung hiển thị (logo, tiêu đề, footer), domain, tên DB và dữ liệu seed
    (username `toannx` trong `seed_local`).
- Không nuốt lỗi (`except Exception: pass`, `catch {}` rỗng); lỗi phải có mã ổn định hoặc được log.
- Không `console.log`/`print` trong code chạy thật; không `any`/`type: ignore`/`noqa` không lý do
  (nếu bắt buộc phải ghi lý do ngay trên dòng đó).
- Không để code chết: không comment cả khối code cũ, không giữ hàm/biến/import không dùng, không file "tạm".
  Lịch sử đã có trong git. `TODO` phải kèm lý do và việc cần làm cụ thể, không để `TODO` trống.

### 3.1 Đặt tên

| Loại | Quy ước | Ví dụ |
| --- | --- | --- |
| Hằng số | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE`, `LOGO_MARK_SIZE` |
| Boolean | Tiền tố `is_`/`has_`/`can_`/`should_` (BE), `is`/`has`/`can`/`should` (FE) | `is_active`, `canDelete` |
| Hàm, method | Động từ + đối tượng, nói rõ việc làm | `find_by_email`, `get_for_write`, `buildAlternates` |
| Hàm trả bool | Câu hỏi | `is_not_self`, `hasPermission` |
| Handler FE | Prop `onXxx`, hàm xử lý `handleXxx` | `onDelete` → `handleDelete` |
| Collection | Số nhiều | `roles`, `permission_ids` |

- Một khái niệm một tên trên cả BE và FE (BE `original_name` ↔ FE `originalName`); không đặt hai tên cho một thứ.
- Không viết tắt trừ từ phổ biến (`id`, `url`, `api`, `db`); không tên chung chung (`data2`, `tmp`, `handle`, `manager`).

### 3.2 Kích thước và độ phức tạp

- Ưu tiên **return sớm** thay cho `if` lồng nhau; không lồng quá 3 cấp (`if`/`for`/`try`).
- Hàm dài hơn ~50 dòng hoặc nhận quá 4 tham số vị trí là dấu hiệu cần tách (BE dùng tham số keyword-only `*`,
  FE dùng một object props/options).
- File component vượt ~200 dòng hoặc có nhiều khối giao diện độc lập → tách component con (mỗi component một file).
- Không tối ưu sớm (`useMemo`/`useCallback`/cache) khi chưa đo được vấn đề; tối ưu thì ghi lý do.

### 3.3 Danh mục common ([docs/common-catalog.md](../common-catalog.md))

- **Đọc danh mục trước khi viết code**: mọi lớp nền, decorator, filter, exception, tiện ích BE (`app/core/`,
  phần dùng chung của `system`) và mọi component, hook, service, lib, kiểu FE (`src/shares/`, phần dùng chung của
  `system`/`manage-app`) đều liệt kê ở đó. Đã có thì **dùng cái có sẵn**, không viết bản thứ hai, không tự viết
  lại thành phần trong module.
- Có thứ gần giống nhưng thiếu tính năng → mở rộng common đó (thêm prop/tham số), không tạo bản song song.
- Chưa có và từ hai module trở lên cần → tạo common mới đúng chỗ (`app/core/<nhóm>/`, `shares/components/common/`,
  `shares/hooks/`, `shares/lib/`...). Chỉ một module cần → để trong module đó.
- **Thêm, đổi tên, xóa hay đổi công dụng một common thì cập nhật `docs/common-catalog.md` trong cùng lần sửa**:
  tên export, đường dẫn file, dùng khi nào, đặt đúng nhóm. Common không có trong danh mục coi như chưa xong.

## 4. Tài liệu trong code

- Mọi class/hàm public có docstring (Python, Google-style) / JSDoc (TypeScript) **tiếng Việt có dấu**.
- Comment giải thích **vì sao**, không lặp lại code làm gì.
- Hằng số quyền phải có `name` + `description` để đọc là hiểu quyền dùng làm gì.
- **`AGENTS.md` và `CLAUDE.md` luôn đồng bộ**: sửa một file thì sửa luôn phần tương ứng ở file kia trong cùng
  lần đó (`AGENTS.md` tiếng Việt cho mọi agent, `CLAUDE.md` tiếng Anh cho Claude Code; nội dung rule phải khớp).
  Đổi rule trong `docs/rules/` mà hai file này có tóm tắt thì cập nhật cả hai.
- **Rule cho AI (`.agents/rules/`) luôn đồng bộ với `docs/rules/`**: `docs/rules/` là nguồn chuẩn đầy đủ;
  `.agents/rules/*.md` là bản tóm tắt cho agent, frontmatter `trigger` (`always_on` luôn bật, `model_decision` AI tự
  chọn theo `description`, `glob` theo file khớp `globs`, `manual` chỉ khi gọi). Bản cho Claude Code
  (`.claude/rules/`, `.claude/skills/rule-*/`, `.claude/commands/`) **sinh tự động** bằng
  `python scripts/sync-ai-rules.py`, không sửa tay; `--check` chạy trong `scripts/check-all.*`. Đổi một rule trong
  `docs/rules/` (hoặc quy trình/bảng kiểm) thì sửa rule AI tương ứng, `CLAUDE.md`, `AGENTS.md`, `prompt.md` trong cùng
  lần. Cách viết rule AI: `.agents/rules/40-docs-and-rules.md`.
- **Skill quy trình và hỗ trợ của project**: `start-task` cho việc mới, `fix` cho lỗi đã có, `review-code` cho lượt
  rà cuối có tự sửa lỗi xác nhận được; cùng các skill hỗ trợ chuyên biệt `create-plan`, `review-plan`, `test`,
  `refactor`, `review-security`, `i18n-audit`, `permission-audit`, `db-migration`, `check-ci`. Chọn bằng ngữ nghĩa câu chat theo `.agents/rules/01-workflow.md`;
  `review-code` không tự chạy sau mọi lần sửa. Các skill phải đọc source thực, mục lục `docs/`, rule và tài liệu
  liên quan trước khi sửa; kiểm đúng phạm vi rồi báo nội dung commit theo [git.md](git.md).
- Nguồn skill project ở `.agents/skills/<tên>/`; skill viết riêng cho repo được liên kết sang
  `.claude/skills/<tên>/`. Skill cài từ bên ngoài có nguồn/commit trong `skills-lock.json` và có thể được liên kết
  bằng CLI. Các thư mục này khác `.claude/skills/rule-*/` sinh từ rule; không sửa tay bản sinh, không để skill
  ghi đè `docs/rules/`. `scripts/check-workflow-skills.py` kiểm tên, mô tả và bản Claude của các skill project và
  chuyên môn; `scripts/check-all.*` gọi kiểm tra này khi chạy toàn bộ.
- **Tài liệu trong `docs/` cập nhật cùng lần sửa** (mục lục và cấu trúc ở [docs/README.md](../README.md)):
  - đổi model, quyền (`MEMBER`), route, sự kiện thông báo, webhook/callback của module → `docs/modules/<module>/README.md`;
  - đổi cách một chức năng chạy (phạm vi quyền, ẩn/khóa theo quyền, cột Thao tác, sidebar, file công khai/riêng
    tư, Web Push…) → file tương ứng trong `docs/features/`; chức năng dùng chung mới → thêm file + dòng mục lục;
  - đổi cách cài đặt/vận hành → `docs/guides/`; đổi kiến trúc nền → `docs/architecture/`;
  - thêm module → thêm `docs/modules/<module>/README.md`;
  - viết hoặc cập nhật kế hoạch triển khai → lưu vào `docs/plans/<YYYY>/<MM>/<DD>/<ten-kebab-case>-plan.md`
    theo ngày lập để dễ tra cứu theo ngày; không đặt file plan trực tiếp ở gốc `docs/plans/`.
  Tài liệu lệch với code coi như việc chưa xong.

## 5. Bảo mật

- Không hardcode secrets, URL môi trường; mọi cấu hình qua biến môi trường.
- **Bí mật**: bí mật hệ thống tự tạo và tự kiểm (ký token, băm, mã xác minh nội bộ, link ký) luôn dẫn xuất
  từ `DJANGO_SECRET_KEY` qua `django.core.signing` / `salted_hmac`, mỗi mục đích một `salt` riêng; không tạo biến
  env bí mật mới cho các việc này. Bí mật bên thứ ba cấp cho **cả hệ thống** (OAuth client secret, `CRON_SECRET`,
  khóa R2, service account Firebase) dùng biến env riêng. Bí mật bên thứ ba của **từng người dùng** (token API
  SePay, token bot Telegram) lưu DB đã mã hóa bằng `SecretCipher` (khóa dẫn xuất từ `DJANGO_SECRET_KEY` theo mục
  đích), API chỉ trả 4 ký tự cuối, không qua env. Secret webhook riêng từng người do hệ thống tự tạo thì dẫn xuất
  bằng `salted_hmac` (không lưu DB). Không bao giờ đưa `DJANGO_SECRET_KEY` ra ngoài hệ thống. Đổi
  `DJANGO_SECRET_KEY` làm mất hiệu lực các bí mật dẫn xuất/mã hóa đó (ghi trong `docs/guides/deployment.md`). Không ghi
  giá trị bí mật thật vào `.env.example`, code, log hay commit.
- **Ba file env mỗi phía** (`backend/`, `frontend/`; chỉ `.env.example` được commit):
  - `.env.local`: máy dev + pytest. DB PostgreSQL local, `FILE_STORAGE_BACKEND` = filesystem, không khóa R2, không
    `CLOUDFLARE_API_TOKEN`, email console, `SEPAY_ENV=sandbox`. Backend có file này thì **chỉ đọc file này** (không
    gộp `.env`); Next.js gộp `.env.local` lên `.env` nên `frontend/.env.local` phải khai đủ mọi biến.
  - `.env`: production (domain `toannx.com`, API `api.toannx.com`); là bản để chép vào biến môi trường server/Vercel.
  - `.env.example`: mẫu đủ mọi biến code đọc, chú thích tiếng Việt, không giá trị bí mật.
- **Test không gọi dịch vụ ngoài**: `backend/conftest.py` tắt R2 Usage API, R2, Firebase trong mọi test và dừng phiên
  test nếu `DATABASE_URL` không trỏ về PostgreSQL local. Test cần dịch vụ ngoài thì mock hoặc tự đặt setting trong test.
- **Thêm/đổi tên/xóa biến môi trường thì cập nhật file example trong cùng lần sửa**: `backend/.env.example`
  (BE) hoặc `frontend/.env.example` (FE). Mỗi biến có chú thích **tiếng Việt có dấu** ngay phía trên: dùng làm
  gì, lấy giá trị ở đâu, để trống thì hệ thống làm gì; biến cùng nhóm đặt chung dưới một tiêu đề. Bí mật để
  trống, biến không bí mật ghi giá trị mặc định. Biến chạy production thì ghi thêm vào `docs/guides/deployment.md`.
- Backend là nơi kiểm soát quyền cuối cùng; FE chỉ ẩn/hiện.
- Không trả stack trace, mật khẩu, token, hash ra client.
- Không tin dữ liệu client: validate mọi input; kiểu file xác định bằng chữ ký file, không bằng header.
- Log không chứa dữ liệu nhạy cảm (mật khẩu, token, cookie, nội dung file); log kèm `request_id` để đối chiếu.
- Thêm dependency phải được người yêu cầu đồng ý; chọn gói còn bảo trì, ghim version qua lockfile.
- Khi sửa luồng xác thực, quyền/owner, webhook, URL bên ngoài, file riêng tư hoặc dữ liệu tài chính, kiểm tra
  ranh giới tin cậy và thêm test hồi quy cho nhánh từ chối/lỗi liên quan. Skill `security-best-practices` và
  `review-security` (giả lập tấn công cục bộ + tạo/tái xác nhận `docs/reports/security-verification.md`) dùng khi
  người dùng yêu cầu rà soát bảo mật hoặc hướng dẫn viết code an toàn; không tự biến mọi task thành audit toàn repo.

## 5.1 Thời gian và số tiền

- BE lưu và so sánh thời gian ở UTC có múi giờ (`django.utils.timezone.now()`), không dùng `datetime.now()` naive.
  API trả ISO 8601; FE hiển thị theo locale và múi giờ người xem.
- Tiền và số cần chính xác dùng `Decimal` (BE) / số nguyên đơn vị nhỏ nhất hoặc chuỗi (FE), không dùng float để tính.

## 5.2 File công khai và riêng tư

Chi tiết luồng: [docs/features/attachment-visibility.md](../features/attachment-visibility.md).

- Mọi file người dùng tải lên đi qua Thư viện (`Attachment`, `AttachmentService`); module khác không tự lưu file
  hay đọc storage trực tiếp.
- **Bắt buộc công khai** (`public`): ảnh đại diện, logo QR, ảnh bìa truyện, ảnh trong trang công khai, mọi ảnh
  hiển thị cho khách.
  Bộ chọn (`AttachmentPicker`) mặc định chỉ liệt kê file công khai.
- **Bắt buộc riêng tư** (`private`): chứng từ, hóa đơn, file chứa dữ liệu cá nhân/tài chính, CSV/XLSX/XML. Màn
  dùng file riêng tư truyền `visibility="private" lockVisibility`. CSV/XLSX/XML luôn tải về, không hiển thị.
- File riêng tư nằm ở kho riêng (bucket R2 không bật public access); API chỉ trả
  `/api/v1/system/attachments/{id}/content`, **không bao giờ** trả URL storage thật. Mở file: BE kiểm quyền rồi
  302 tới link ký 5 phút; không quyền và không tồn tại cùng trả 404. Link chia sẻ là trang `/vi/tep/{id}`.
- Người mở được file riêng tư: người upload, superuser, người có `system.attachment.read_private`
  (`read_private` chỉ mở xem, không mở rộng sửa/xóa). `read_private`/`manage_all` không vào `MEMBER`.
- Đổi chế độ chỉ qua `POST /attachments/{id}/visibility` (chép sang kho kia, xóa bản cũ sau commit); không tự
  di chuyển file giữa hai kho trong module.

## 6. API contract

- Path: `/api/v1/<module>/<resource>[/<id>]`, không có `/` cuối, danh từ số nhiều.
- Response thành công `{success, data, meta}`; lỗi `{success: false, error: {code, message, details, request_id}}`.
- `error.code` là hợp đồng ổn định giữa BE và FE: không đổi giá trị đã phát hành; FE dịch theo code.
- Mã lỗi nghiệp vụ **mới** mang tiền tố của module sở hữu (`SYSTEM_*`, `NOVEL_*`, `UTILITIES_*`); mã chung không
  tiền tố module (`VALIDATION_ERROR`, `NOT_FOUND`...). Mã đã phát hành giữ nguyên dù module đã gộp
  (`ACCOUNT_*`, `IAM_*`, `AUTH_*` nay thuộc `system`). Thêm mã phải thêm message vi + en.
- Không phá contract đã phát hành: không xóa/đổi tên field, không đổi kiểu dữ liệu hay ý nghĩa giá trị.
  Cần đổi thì thêm field mới, chuyển FE sang, rồi mới bỏ field cũ; bắt buộc đổi ngay thì commit có `!`
  (xem [git.md](git.md)).
- JSON BE dùng snake_case; FE dùng camelCase (apiClient tự chuyển).
- API danh sách: `?search=` (tìm kiếm), `?ordering=field` / `-field` (sắp xếp), lọc theo field
  (`?is_active=true`), `?page=&page_size=` (≤ 100). Trang vượt quá trả 404; giá trị lọc sai trả 400.
- Mọi field input/output có mô tả (`help_text`) để OpenAPI là tài liệu contract đầy đủ.
- Danh sách tài nguyên mặc định mới nhất trước (`-created_at`); client vẫn được chọn thứ tự khác.
  Danh sách block nội dung giữ thứ tự `position` do người dùng sắp đặt.

## 7. Kiểm thử và hoàn thành

- Không báo PASS khi chưa chạy thật.
- **Chỉ chạy kiểm tra liên quan tới phần đã sửa trong lần đó**, không chạy toàn bộ (chậm):
  - BE: `ruff format`/`ruff check`/`mypy` trên file đã sửa; `pytest` đúng file test của endpoint/service bị ảnh
    hưởng (`uv run pytest --reuse-db app/<m>/tests/test_<x>.py`). `DATABASE_URL` khi test bắt buộc trỏ về PostgreSQL
    local (`postgresql://postgress:123456@localhost:5432/toannx?sslmode=prefer`, user `postgress`, pass `123456`),
    tuyệt đối không dùng DB cloud/server (Neon) để tránh chậm mạng và timeout. Đổi route, view, quyền, serializer
    thì chạy thêm `core/tests/test_endpoint_access.py`, `test_module_conventions.py`, `test_openapi_schema.py`.
    **Đổi bất kỳ thứ gì đi vào OpenAPI** (route, view, serializer, `@extend_schema`, `help_text`, mã lỗi, **kể cả
    docstring của view và method HTTP**) thì chạy `pnpm api:types` và commit `api-schema.gen.ts` cùng lần
    (rule backend §6; CI đỏ nếu file lệch dù chỉ một dòng mô tả).
  - FE: `eslint`/`prettier --check` trên file đã sửa, `pnpm typecheck` (kiểu liên đới cả project), Vitest đúng
    file test liên quan; `pnpm build` khi đổi route/page/layout/config; E2E chỉ spec của luồng bị đổi
    (`pnpm e2e tests/e2e/<luồng>.spec.ts`).
  - Toàn bộ (`scripts/check-all.ps1`/`.sh`, `pnpm e2e` đầy đủ, `uv run pytest` / `pnpm test` / `pnpm lint`
    **không chỉ định file**) **chỉ chạy khi người dùng yêu cầu**, kể cả khi đã sửa nhiều file: chạy toàn bộ quá lâu
    và không cần. Sửa vùng nền rộng (`app/core`, `shares/`, `apiClient`, settings) thì vẫn chỉ chạy test file liên
    quan, rồi báo để người dùng quyết định có chạy toàn bộ không.
  - Báo cáo ghi rõ đã chạy lệnh nào, kết quả, và phần nào chưa kiểm.
- Sửa bug: thêm test tái hiện trước/cùng lúc với bản sửa.
- Test nằm cạnh code: `app/<m>/tests/`, `app/core/tests/` (BE); `frontend/tests/` (FE).
- **Quy chuẩn API test backend**: Mỗi endpoint đúng 1 file test riêng biệt (`test_<resource>_<action>_api.py`).
  Không gộp chung các action CRUD vào một file model; không tách file test quyền riêng biệt.
  Mỗi file test endpoint phải bao phủ toàn diện: full data, min data, validation errors, mã HTTP status, envelope response,
  chưa đăng nhập (401), thiếu quyền (403), cô lập owner (404/403 cho người khác, manage_all thành công).

- Test phải ổn định: không `sleep` chờ, không phụ thuộc thứ tự chạy hay dữ liệu dev; cố định thời gian khi
  test logic theo giờ; dữ liệu tạo bằng factory.
- Khi thay đổi đường nóng, đo đúng nơi bị ảnh hưởng trước/sau: BE kiểm số query không tăng theo số bản ghi,
  thời gian và số lệnh Redis khi có liên quan; FE kiểm waterfall Network, số request và kích thước tài nguyên
  trên luồng thực tế. Chỉ kết luận cải thiện hiệu năng khi có số đo hoặc test chứng minh; xét ngân sách free ở
  `docs/architecture/infrastructure.md` trước khi thêm cache, cron hoặc lời gọi dịch vụ ngoài.

### Định nghĩa hoàn thành (Definition of Done)

1. Đúng phạm vi yêu cầu, không đụng phần ngoài; vi phạm rule trong các file đã mở đã được sửa hoặc báo lý do.
2. Theo đúng rule (kiến trúc, một file một đơn vị, đặt tên, docstring tiếng Việt, i18n đủ vi + en).
3. Có test cho hành vi mới/lỗi đã sửa; format, lint, typecheck và các test **liên quan** đều qua.
4. Nếu có đổi UI, đã kiểm tra thực tế (`playwright-cli`): desktop + mobile, light + dark, loading/rỗng/lỗi.
5. Tài liệu (`docs/modules/<m>/`, `docs/features/`, `SYSTEM_CONTEXT.md`) cập nhật theo §4; thêm/đổi/xóa common thì
   `docs/common-catalog.md` đã cập nhật. `graphify update .` chỉ chạy
   khi thay đổi lớn (thêm/xóa/gộp module, đổi cấu trúc thư mục, di chuyển/đổi tên khoảng 10 file trở lên, refactor
   kiến trúc) hoặc graph đã cũ (quá 7 ngày, hay query trả về file không còn); sửa nhỏ thì không chạy.

## 8. Git

- Theo [quy tắc nhánh và commit](git.md). Commit nhỏ theo một thay đổi logic; không commit `.env`,
  `media/`, build output hoặc dữ liệu công cụ cục bộ.
- **AI agent không tự thao tác git** (tạo nhánh, commit, push, merge, xóa nhánh) khi chưa được yêu cầu rõ;
  làm trên nhánh hiện tại. Sau mỗi task, đọc trạng thái và diff Git (cả file chưa theo dõi) rồi gợi ý nội dung
  commit gồm tiêu đề và body theo [git.md](git.md), ở dạng văn bản để dán vào VS Code, cho toàn bộ thay đổi chưa
  commit; không trả lệnh Git thay nội dung commit, không tự stage/commit/push.
