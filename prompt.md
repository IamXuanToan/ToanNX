# BẮT BUỘC: ĐỌC TÀI LIỆU VÀ TUÂN THỦ RULE HỆ THỐNG

## 0. RULE CỐT LÕI (nắm trước khi làm bất cứ việc gì)

Đây là bản tóm tắt. Chi tiết và ngoại lệ nằm ở `docs/rules/`; khi hai bên lệch nhau thì `docs/rules/` thắng.

### Cách làm việc

- Làm đúng phạm vi yêu cầu. Không tự ý thêm tính năng, dependency, module, hay sửa phần ngoài phạm vi.
- **Không tự thao tác git**: không tạo nhánh, commit, push, merge, xóa nhánh khi chưa được yêu cầu rõ.
  Làm thẳng trên nhánh hiện tại. Chỉ gợi ý câu commit khi được hỏi.
- Gặp xung đột giữa yêu cầu và rule: báo và đề xuất hướng xử lý trước khi làm.
- Tool/skill/tài liệu không có hoặc không chạy được: báo rõ, không giả định là đã làm.
- Sửa `AGENTS.md` thì sửa luôn `CLAUDE.md` và ngược lại, nội dung rule phải khớp nhau.

### Tổ chức code (BE + FE)

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
- Không magic number/string; không `print`/`console.log`; không nuốt lỗi; không `any`/`type: ignore`/`noqa` không lý do.
- **Không tiền tố `toannx`** ở mọi dạng (`toannx_`, `toannx-`, `toannx:`, `TOANNX_`) trong: tên cookie, key
  localStorage/sessionStorage, tên biến/hằng giữ các key đó, header, query/cache key, biến môi trường.
  Đúng: `access_token`, `novel_reader_settings`, `READER_SETTINGS_KEY`. Sai: `toannx_access`, `toannx:draft`,
  `TOANNX_STORAGE_KEY`. Tên dự án chỉ ở nội dung hiển thị, domain, tên DB, dữ liệu seed.
- Không code chết, không comment khối code cũ. Đặt tên rõ nghĩa (hằng `UPPER_SNAKE`, bool `is/has/can`).
  Return sớm, không lồng quá 3 cấp (rule chung §3.1, §3.2).
- Không phá contract API đã phát hành; thời gian lưu UTC; tiền dùng `Decimal` (rule chung §5.1, §6).
- Xong việc theo "Định nghĩa hoàn thành" ở rule chung §7.
- Docstring/JSDoc và comment bằng **tiếng Việt**, giải thích nghiệp vụ và lý do, không mô tả điều hiển nhiên.

### Backend (Django + DRF)

- Luồng bắt buộc: `url → view → service → repository → ORM`. Chỉ repository chạm DB.
- **Mọi điểm vào chỉ gọi service**: view, task (`tasks/`), management command, signal receiver, middleware,
  authentication/permission class, recorder, decorator. Không gọi `XxxRepository()`, `Model.objects`, không giữ
  nghiệp vụ hay `@transaction.atomic`; task là lớp vỏ gọi đúng một method service.
- **Phụ thuộc khai trong `__init__`**: mọi service/repository một class dùng phải tạo trong `__init__`
  (`self.<tên>_service`), kể cả service tiện ích như `AuthCookieService`. Trong method cấm `XxxService().method()`
  và `XxxService.method()`. Method công khai của service không dùng `@staticmethod`/`@classmethod`.
  Hàm (task) không có `__init__` thì tạo service một lần ở đầu hàm.
- Chỉ dùng hai base view: `CoreApiView` và `CoreModelViewSet`. Service kế thừa `CoreCrudService`.
- Xóa mềm mặc định; response theo envelope cố định với mã lỗi ổn định.
- Input qua `@validate_request` + `serializers/validates/`, output qua `serializers/responses/`.
- Quyền dạng `<module>.<resource>.<action>`, nguồn sự thật là bảng IAM. Vai trò dựng sẵn: 1 role ADMIN và cặp
  `<MODULE>_MANAGER` / `<MODULE>_VIEWER` cho mỗi module, không tự đặt thêm role.
- Mỗi endpoint đúng một file test `test_<resource>_<action>_api.py`.

### Frontend (Next.js 16)

- Luồng: `page → View → component (+ hook riêng) → hook module (React Query) → service → apiClient`.
- `page.tsx`/`layout.tsx` chỉ khai metadata và render View của module. View chỉ ghép component và kiểm quyền.
- Service mỗi model BE một file. Route, API endpoint, query key do từng module tự khai trong `constants/`.
- `shares/` không import module. UI dùng component chung có sẵn (`DataTable`, `SelectField`, `FilterSelect`,
  `FormPage`...). Control cao 40px. Form tạo/sửa/chi tiết dùng chung một component, không dùng dialog.
- Màu lấy từ token thương hiệu, không hard-code. Mọi chuỗi hiển thị qua i18n (`vi`, `en`).
- **SVG đặt file trong `public/`, nơi dùng gọi theo đường dẫn**: `frontend/public/<nhóm>/<tên>.svg` → hằng
  (`ICON_PATHS` ở `shares/lib/asset-paths.ts`, hoặc `constants/asset-paths.ts` của module) → `<Image src={...} />`.
  Cấm `<svg>`/`<path>` nội tuyến trong `.tsx`, cấm component bọc SVG kiểu `GoogleIcon`, cấm data URI SVG.
  Icon đơn sắc dùng `lucide-react` trước.

## 1. TÀI LIỆU PHẢI ĐỌC

Trước khi thực hiện bất kỳ yêu cầu nào, bắt buộc đọc và hiểu:

- `CLAUDE.md`, `AGENTS.md`, `SYSTEM_CONTEXT.md`
- **`docs/common-catalog.md`**: danh mục common BE + FE đang có. Đọc trước khi viết bất kỳ code nào.
- `docs/rules/` (`common.md`, `backend.md`, `frontend.md`, `git.md`)
- `docs/architecture.md`, `docs/authentication.md`, `docs/authorization.md`, `docs/deployment.md`,
  `docs/i18n.md`, `docs/testing.md`, `docs/sentry.md`, `docs/reference-audit.md`
- `docs/plans/` và `docs/reports/` khi liên quan

## 2. NGUYÊN TẮC BẮT BUỘC

1. Đọc tài liệu và phân tích codebase trước khi triển khai: hiểu kiến trúc, nghiệp vụ, convention và pattern hiện có.
2. Tuân thủ nghiêm rule Backend, Frontend, Common, Git. Không tự đổi kiến trúc hay tạo pattern mới khi đã có quy chuẩn.
3. Code clean, dễ đọc, dễ bảo trì (SOLID, DRY, KISS). Tái sử dụng component, hook, service, utility có sẵn;
   không duplicate logic, không over-engineering.
4. Frontend tuân thủ shadcn/ui, Tailwind, design token, responsive, accessibility, i18n.
5. Việc liên quan UI/UX: bắt buộc dùng skill `ui-ux` để phân tích và thiết kế trước khi làm.
6. **Mở file nào thì kiểm rule file đó và sửa luôn** (bảng kiểm mục 3.1). Áp dụng cho mọi file đã mở để đọc
   hoặc sửa trong lần làm việc này, không chỉ file của tính năng. Ngoại lệ phải báo trước khi sửa: sửa kéo
   theo đổi contract API/migration, hoặc lan sang khoảng 10 file trở lên.
7. Không tắt lint/typecheck, không bỏ test, không dùng giải pháp tạm để che lỗi.

## 3. QUY TRÌNH THỰC HIỆN

1. Đọc rule và tài liệu liên quan (mục 0 và 1).
2. Phân tích codebase (dùng `graphify query` trước khi grep/đọc file). Tra `docs/common-catalog.md` để chọn
   common dùng lại, ghi ra trước khi code.
3. Dùng skill `ui-ux` nếu có việc giao diện.
4. Triển khai đúng kiến trúc và convention.
5. Review: chạy bảng kiểm 3.1 trên **từng file đã mở**; vi phạm thì sửa luôn (nguyên tắc 6), ghi lại để báo cáo.
6. **Chỉ chạy kiểm tra cho phần sửa trong lần này**, không chạy toàn bộ (rule chung mục 7):
   - Backend: `uv run ruff format --check <file>`, `uv run ruff check <file>`, `uv run mypy <file>`,
     `uv run pytest app/<m>/tests/test_<x>.py` (đúng file test của endpoint/service bị ảnh hưởng). Đổi route/view/
     quyền/serializer thì thêm `app/core/tests/test_endpoint_access.py`, `test_module_conventions.py`,
     `test_openapi_schema.py` và `pnpm api:types`.
   - Frontend: `pnpm exec eslint <file>`, `pnpm exec prettier --check <file>`, `pnpm typecheck`,
     `pnpm test tests/unit/<file>.test.ts`; `pnpm build` khi đổi route/page/layout/config;
     `pnpm e2e tests/e2e/<luồng>.spec.ts` khi đổi luồng đó.
   - Chạy toàn bộ (`scripts/check-all.*`, `pnpm e2e` đầy đủ) chỉ khi được yêu cầu. Sửa vùng nền (`app/core`,
     `shares/`, `apiClient`, settings) thì báo để người dùng quyết định.
7. Dùng skill `playwright-cli` để kiểm tra UI và luồng tương tác: responsive, console, network, các trạng thái
   loading/empty/error/success. Không kết luận chạy đúng khi chưa kiểm tra thực tế.
8. Sửa lỗi và kiểm tra lại đến khi đạt.
9. Chỉ chạy `graphify update .` khi có **thay đổi lớn**: thêm/xóa/gộp module, đổi cấu trúc thư mục, di chuyển
   hoặc đổi tên nhiều file (khoảng 10 file trở lên), refactor kiến trúc. Hoặc khi graph đã cũ: `graphify-out/graph.json`
   không cập nhật hơn 7 ngày, hay `graphify query` trả về file/symbol không còn tồn tại. Sửa nhỏ thì không chạy.
10. Báo cáo ngắn gọn: đã đổi gì, common nào đã dùng lại / thêm mới (đã vào danh mục chưa), **vi phạm rule đã sửa thêm ở file nào**, đã chạy lệnh kiểm tra nào và kết quả,
    phần nào chưa kiểm, vi phạm thấy mà chưa sửa (kèm lý do), việc còn tồn.

### 3.1 Bảng kiểm khi mở một file

Backend:

- [ ] File chỉ có một class cấp module (trừ APIView `XxxView` + `XxxObjectView`; file model + enum của nó).
      Class lồng (`Meta`, enum trong model) thì được.
- [ ] Enum field model không nằm ở `models/<enum>.py` riêng; serializer, dataclass, exception không lẫn trong file khác.
- [ ] Đúng lớp: view/task/command/signal/middleware/auth/permission/recorder không gọi repository hay ORM;
      service không gọi `Model.objects`; module không import repository của module khác.
- [ ] Mọi service/repository dùng trong class có trong `__init__`; không `XxxService().x()`/`XxxService.x()` trong method.
- [ ] Task/command là lớp vỏ: không nghiệp vụ, không `@transaction.atomic`.
- [ ] Method view có `@require_permission` (hoặc `permission_classes` theo bảng); input `@validate_request`, output
      serializer response.
- [ ] Không magic number/string, không `print`, không nuốt lỗi; docstring tiếng Việt.
- [ ] Tên cookie, header, setting, biến môi trường không có tiền tố `toannx`.
- [ ] Không tự viết lại thứ đã có trong `docs/common-catalog.md` mục 1–3 (filter, exception, tiện ích, base...).

Frontend:

- [ ] Một component/hook/class một file; không hook trong `.tsx`; context tách `-context.ts`/`-provider.tsx`/`use-*.ts`.
- [ ] Đúng lớp: page chỉ metadata + View; View không fetch; component không gọi service/apiClient trực tiếp.
- [ ] Dùng component chung (`DataTable`, `SelectField`, `FilterSelect`, `FormPage`...), control `h-10`, `<Image>`, chuỗi qua i18n.
- [ ] Không `any`, không `console.log`, không đọc `process.env` ngoài `shares/config`.
- [ ] Key localStorage/sessionStorage, cookie, query key và tên hằng giữ chúng không có tiền tố `toannx`.
- [ ] Không tự viết lại thứ đã có trong `docs/common-catalog.md` mục 4–5 (input, bảng, form, hook, lib...).
- [ ] Không có `<svg>`/`<path>` nội tuyến hay data URI SVG; SVG nằm trong `public/`, gọi qua hằng đường dẫn.
- [ ] Đã thêm/đổi common (BE hoặc FE) thì `docs/common-catalog.md` đã cập nhật.

## 4. NHẮC LẠI

- KHÔNG viết code khi chưa đọc rule.
- KHÔNG đụng phần ngoài phạm vi, KHÔNG tự thao tác git. Sửa vi phạm rule trong file đã mở **là trong phạm vi**.
- KHÔNG bỏ qua vi phạm thấy được trong file đã mở: sửa luôn, hoặc báo lý do chưa sửa.
- KHÔNG tuyên bố hoàn thành khi chưa kiểm tra.
- LUÔN nhất quán với hệ thống hiện tại.

# YÊU CẦU CẦN THỰC HIỆN

[Nội dung yêu cầu]
