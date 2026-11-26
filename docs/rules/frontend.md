# Rule frontend (Next.js 16)

Đọc trước: [common.md](common.md). Next.js 16 có thay đổi lớn: đọc `frontend/node_modules/next/dist/docs/`
trước khi dùng API mới (middleware → `src/proxy.ts`, error boundary dùng `retry`...).

## 1. Luồng xử lý (bắt buộc)

```
app/[locale]/.../page.tsx → modules/<m>/views/<nhóm>/ → components/<nhóm>/<c>.tsx (+ components/<nhóm>/hooks/use-<c>.ts)
  → modules/<m>/hooks (React Query) → modules/<m>/services → shares/lib/api/api-client.ts
```

FE **không có lớp repository**: service của module gọi `apiClient` trực tiếp.

| Lớp                               | Được làm                                                                                                                                                                    | Không được làm                                                                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `page.tsx`, `layout.tsx` (`app/`) | `export const generateMetadata = createPageMetadata(...)`, `await params` (khi cần), `<Suspense>`, render **đúng View/Layout của module** (ghép slot giữa module bằng prop) | Hook, state, gọi API, điều kiện, JSX bố cục/giao diện, component đặt trong `app/` (`_components`), gọi `setRequestLocale` (Next.js 16 dùng `next/root-params` trong `src/i18n/request.ts`) |
| View (`modules/<m>/views/<nhóm>`) | Ghép component của module, kiểm quyền (`usePermission`, `PermissionGate`, `useEditMode`) rồi truyền cờ quyền xuống; chỉ gọi `usePermission`/`useTranslations`/`useEditMode` | Gọi query/mutation, state, `useRouter`/`useEffect`, xử lý lỗi/loading, tính toán dữ liệu, hook riêng (`views/hooks/`)                                                                      |
| Component                         | Nhận props, gọi hook riêng, render (kể cả loading/lỗi)                                                                                                                      | `fetch`, gọi service, state phức tạp trong file `.tsx`                                                                                                                                     |
| Hook của component                | State, sự kiện, form, ghép query/mutation                                                                                                                                   | Gọi `apiClient`/service trực tiếp                                                                                                                                                          |
| Hook module (`hooks/`)            | `useQuery`/`useMutation`, invalidate cache                                                                                                                                  | JSX                                                                                                                                                                                        |
| Service (`services/`)             | Gọi `apiClient`, chuẩn hóa dữ liệu gửi/nhận, quy tắc FE thuần (hàm không hook)                                                                                              | JSX, React hook, UI state                                                                                                                                                                  |

UI primitive thuần (Button, Separator...) không cần hook riêng.

## 2. Cấu trúc module

```
src/modules/<m>/
  views/<nhóm>/<tên>-view.tsx
  components/<nhóm>/<tên>.tsx  components/<nhóm>/hooks/use-<tên>.ts
  hooks/use-<tên>.ts
  permissions/<model>-permission.ts  services/<model>.service.ts
  constants/{routes,api-endpoints,query-keys}.ts
  schemas/  types/  messages/{vi,en}.json  navigation.ts
```

- **Component và view chia theo model** (`tests/unit/module-structure.test.ts` kiểm):
  - Component nằm trong `components/<nhóm>/`, hook của nó trong `components/<nhóm>/hooks/`. Không có file ở gốc
    `components/`, không có `components/hooks/` cấp gốc. Chỉ một cấp nhóm, không tạo thư mục cho từng component.
  - `<nhóm>` là **model BE** (trùng tên `services/<nhóm>.service.ts`): `system/components/user/user-table.tsx`,
    `novel/components/author/author-form.tsx`. Màn không gắn model thì nhóm theo **chức năng**: `auth`
    (đăng nhập, quên mật khẩu, callback OAuth), `current-user` (hồ sơ, menu người dùng), `reader` (trình đọc
    truyện), `dashboard` (tài chính), `errors`/`landing`/`layout` (home), `shell`/`sidebar`/`launcher` (manage-app).
  - **Không có nhóm `shared`/`common` trong module**: component dùng chung nhiều model đặt ở nhóm dùng nó nhiều
    nhất (`finance/components/income/money-text.tsx`); dùng chung toàn app thì đưa lên `shares/`.
  - View nằm trong `views/<nhóm>/`, cùng tên nhóm với component (`system/views/user/user-list-view.tsx`).
    **Không có `views/hooks/`**: View chỉ gọi `usePermission`, `useTranslations`, `useEditMode`; query, state,
    `useRouter`, `useEffect`, gọi API nằm trong component + hook (chi tiết bản ghi: component `<model>-profile.tsx`
    như `UserProfile`; chuyển trang sau khi tạo: trong hook form).
  - Tên file giữ tiền tố model; import đường dẫn đầy đủ tới file, không barrel `index.ts`. Module mới tạo thẳng
    theo cấu trúc này.
- **Mỗi model một file quyền trong `permissions/`**, đặt tên `permissions/<model>-permission.ts` (khớp với
  phân quyền backend), ví dụ: `author-permission.ts`, `chapter-permission.ts`, `novel-permission.ts`. Không
  gộp chung quyền của nhiều model vào một file constants.
  - **Không viết chuỗi gộp `"<module>.<resource>.<action>"` trong `permissions/*-permission.ts` hay component/hook**: bắt buộc
    dùng `createResourcePermissions(<M>_SCOPE, "<resource>", { read: PERMISSION_ACTION.read, ... })` từ
    `@/shares/lib/permissions/resource-permissions` và `PERMISSION_ACTION` (`@/shares/constants/permission-actions`) kết hợp
    `<M>_SCOPE` xuất từ `constants/query-keys.ts` (`tests/unit/code-conventions.test.ts` kiểm tự động).
- **Mỗi hook một file trong `hooks/`**, đặt tên `hooks/use-<tên-hành-động>.ts` (ví dụ `use-client-novel.ts`,
  `use-toggle-favorite.ts`, `use-import-novel.ts`). Tuyệt đối không gom nhiều hook vào một file `use-<m>.ts`
  (`use-iam-queries.ts`, `use-iam-mutations.ts`, `use-admin-sessions.ts` là sai). Áp dụng cho **mọi** thư mục hook,
  xem §2.1.
- **Chuẩn hóa JSDoc docstring bắt buộc**:
  - Mọi file, exported component, custom hook, service object, service method, schema, helper và kiểu (types/interfaces)
    phải có JSDoc docstring rõ ràng bằng tiếng Việt.
  - Phải có `@param` mô tả chi tiết cho từng tham số, `@returns` mô tả dữ liệu trả về, giải thích rõ ràng vai trò nghiệp vụ.
- **Service tách theo model của BE**, mỗi model một file và một object, tên trùng service BE:
  `system/services/role.service.ts` ↔ `system/services/role_service.py`, `user-role.service.ts` ↔
  `user_role_service.py`. Không gộp cả module vào một `<m>.service.ts`. Method theo hành động
  (`list`, `get`, `create`, `update`, `assign`, `revoke`), không lặp tên model (`roleService.list`, không `listRoles`).
  CRUD chuẩn lấy từ `createCrudService<List, Detail, Create, Update>(endpoint)` (`list/listAll/get/create/update/
delete/bulkUpdate/bulkDelete/history`, cùng tên với action BE), service chỉ viết thêm method riêng.
- Hook module: danh sách `useListQuery`, chi tiết `useQuery`, ghi `useResourceMutation` (toast theo khóa message,
  invalidate `lists`/`detail` chuẩn, lỗi dịch theo mã). Không tự viết `onSuccess`/`onError` lặp lại.
- Quan hệ chọn bằng checkbox (vai trò, quyền) lưu bằng **một** request thay toàn bộ (`PUT` + danh sách id), BE xử lý
  trong một transaction; không gửi từng request cho mỗi mục.
- Danh sách gửi `page`/`pageSize` khi cần phân trang (bảng). Ô chọn/danh mục gọi `listAll()` không gửi `page` → BE trả hết.
- **Mỗi module tự khai** trong `constants/` (không khai chung ở `shares/`):
  - `routes.ts`: `<M>_ROUTES` (đường dẫn nội bộ, có hàm cho route động) và `<M>_PATHNAMES`
    (URL theo ngôn ngữ). `src/i18n/routing.ts` chỉ gộp các `<M>_PATHNAMES`.
  - **URL quản trị luôn có tiền tố module**: `/quan-tri/<module-vi>/<tài nguyên>` và `/admin/<module-en>/<tài nguyên>`
    (`/quan-tri/he-thong/nguoi-dung`, `/quan-tri/tien-ich/ma-qr`, `/quan-tri/truyen/tac-gia`,
    `/quan-tri/tai-chinh/giao-dich`; en `/admin/system/users`...). Chỉ màn chọn module là `/quan-tri`. Tiền tố
    hiện có: `he-thong`/`system`, `tien-ich`/`utilities`, `truyen`/`novel`, `tai-chinh`/`finance`; module mới
    chọn một tiền tố riêng. Đổi URL chỉ sửa `<M>_PATHNAMES` (pathname nội bộ và thư mục `app/` giữ nguyên), rồi
    sửa URL trong E2E và tài liệu cùng lần.
  - Sidebar đánh dấu mục có href khớp **dài nhất** (`findActiveNavHref`), nên mục gốc của module (Tổng quan) không
    sáng cùng mục con.
  - `api-endpoints.ts`: `<M>_API_ENDPOINTS`, path tương đối với `env.apiBasePath`.
  - `query-keys.ts`: xuất hằng phạm vi `<M>_SCOPE` (như `WORKSPACE_SCOPE = "workspace"`), `<m>Keys` dựng từ `<M>_SCOPE` và
    `createResourceKeys` (`all`, `lists`, `list(params)`, `detail(id)`, `history(id)`), thêm key riêng nếu cần. Module tổng hợp
    như `portal` tái dùng key chuẩn của tài nguyên gốc trong `portal/constants/query-keys.ts`; cấm truyền `queryKey: ["chuỗi-thô", ...]`
    trực tiếp trong component/hook ngoài `constants/`.
  - Module khác cần route/key thì import từ `@/modules/<khác>/constants/...` (ví dụ invalidate `authKeys.me()`).
- Ngoại lệ duy nhất ở `shares/`: `shares/lib/api/session-paths.ts` (CSRF, login, refresh, logout) vì chính
  `apiClient` cần để lấy CSRF và silent refresh; module `system` dùng lại trong `SYSTEM_API_ENDPOINTS`.
- Module không có BE tương ứng: `manage-app` (khung quản trị: `AdminShell`, sidebar, màn chọn module,
  `constants/admin-navigation.ts`) và `home` (trang công khai, header, trang 404).

## 2.1 Một file một component / một hook / một class (bắt buộc)

`tests/unit/one-unit-per-file.test.ts` kiểm mọi `.tsx` (trừ `components/ui`, `page.tsx`, `layout.tsx`): tối đa một
component, không khai hook, không `createContext`.

Áp dụng cho `modules/**`, `shares/**` và `app/**`. Tên file kebab-case trùng tên export duy nhất của file.

**Component** (`.tsx`):

- Mỗi file `.tsx` khai báo **đúng một component**, kể cả component con không export (`HeaderActions`,
  `LauncherLayout`, `WorkspaceSkeleton` trong `admin-shell.tsx`; `Toggle`, `UrlPopover` trong `tiptap-toolbar.tsx`;
  `AccountEmail` trong `user-menu.tsx` là sai).
- Component con tách thành file riêng **cùng thư mục**, tên mang tiền tố của component cha để nằm cạnh nhau:
  `admin-shell-header-actions.tsx`, `admin-shell-workspace-skeleton.tsx`, `tiptap-toolbar-url-popover.tsx`
  (giống nhóm `table-*` của `DataTable` trong `common/`).
- Hai component cùng chủ đề vẫn là hai file: `Logo` → `logo.tsx`, `LogoMark` → `logo-mark.tsx`.
- File component chỉ export component đó và kiểu props của nó (`<Tên>Props`). Không export kèm hằng số
  (`PAGE_SIZE_OPTIONS`, `DEFAULT_CURRENCY`, `THEME_PRESETS`, `BADGE_PRESETS`), hàm tiện ích hay re-export helper:
  hằng số → `constants/`, hàm → `lib/` (shares) hoặc `utils` của module, kiểu dùng chung → `types/` hoặc
  `<tên>.types.ts`. (`tests/unit/code-conventions.test.ts` chặn `export const UPPER_CASE` trong `.tsx`).

**Hook** (`.ts`):

- Mỗi file `use-*.ts` khai báo **đúng một hook**, ở mọi nơi: `modules/<m>/hooks/`,
  `modules/<m>/components/<nhóm>/hooks/`, `shares/hooks/`, `shares/components/common/hooks/`. Không đặt hook trong
  `views/`. Hook nội bộ (không export) cũng tách file riêng.
- **Không khai báo hook trong file `.tsx`** (kể cả hook private như `useGroupBreadcrumb` trong `admin-shell.tsx`,
  `useClock` trong `clock-widget.tsx`, `useFormId` trong `form.tsx`): chuyển vào `components/<nhóm>/hooks/use-<tên>.ts`.
- File hook chỉ export hook đó (và kiểu tham số/kết quả của nó). Hằng số cấu hình (`READER_FONT_SIZES`,
  `READER_THEMES` trong `use-reader-settings.ts`) → `constants/`.

**Context** (không phải component, không phải hook nhưng hay bị gộp):

- Tách ba file: `<tên>-context.ts` (`createContext` + kiểu giá trị), `<tên>-provider.tsx` (component Provider),
  `hooks/use-<tên>.ts` (hook đọc context). Không đặt `createContext` trong file hook hay file component khác.

**Class** (`ApiError`, class tiện ích...): mỗi class một file, tên kebab-case (`api-error.ts`).

**Ngoại lệ duy nhất:**

- `shares/components/ui/*`: giữ nguyên đầu ra của `shadcn add` (component ghép như `Select*`, `Sidebar*` nằm
  chung file theo thư viện). Không tự thêm component/hook mới vào các file này.
- File đặc biệt của Next (`page.tsx`, `layout.tsx`, `not-found.tsx`...) được export kèm `generateMetadata`,
  `metadata`, `dynamic`... theo quy ước của Next.

## 3. `shares/` dùng chung

Danh sách đầy đủ component/hook/lib/kiểu đang có: [docs/common-catalog.md](../common-catalog.md) mục 4–5. Tra
trước khi viết; thêm/đổi/xóa common thì cập nhật danh mục cùng lần ([common.md](common.md) mục 3.3).

`shares/` chỉ chứa thứ **không thuộc module nào** và **không import module**:

| Thư mục                       | Nội dung                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `components/ui`               | Primitive shadcn (thêm bằng `pnpm dlx shadcn@latest add <name>`)                                        |
| `components/common`           | Khối giao diện dùng lại đặt trực tiếp ở gốc `common/`, hook trong `common/hooks/`                       |
| `components/errors`           | `ErrorState`, `QueryErrorState` (lỗi tải bản ghi: 404 → không tìm thấy + về danh sách), `ForbiddenView` |
| `components/layout`           | `Logo`, `LanguageSwitcher`, `ThemeSwitcher` (không chứa route của module)                               |
| `components/providers`        | Provider gốc của app                                                                                    |
| `lib/api`                     | `apiClient`, `ApiError`, chuyển case, CSRF, `session-paths`                                             |
| `lib/seo.ts`                  | `buildAlternates`, `createPageMetadata`                                                                 |
| `hooks/`, `config/`, `types/` | Hook, cấu hình, kiểu dùng chung                                                                         |

**Cấu trúc `components/common`** (giống `components/` của module):

```
common/
  <tên>.tsx              # component, đặt trực tiếp ở gốc common/ (kebab-case)
  <tên>.types.ts         # kiểu dùng chung của component phức tạp (data-table.types.ts, choice-list.types.ts...)
  hooks/use-<tên>.ts     # hook riêng của component, tập trung tại common/hooks/
```

- Không tạo mỗi component một thư mục con riêng lẻ; mọi component đặt trực tiếp trong `common/`, hook của component nằm trong `common/hooks/`.
- Import theo đường dẫn đầy đủ tới file (tận gốc, không magic/barrel): `@/shares/components/common/page-header`, `@/shares/components/common/hooks/use-data-table`.
- Chuỗi class Tailwind dùng chung của control nằm ở `common/form-control.styles.ts` (hằng số, không phải component).

| Nhóm              | Component                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Trang, trạng thái | `page-header`, `empty-state`, `loading-state`, `status-badge`, `confirm-dialog`                                                                                                                        |
| Bảng              | `data-table` (+ các file con cùng cấp: `table-toolbar`, `table-bulk-bar`, `table-header-cell`, `table-row-actions`, `table-status-switch`, `table-column-resizer`), `data-pagination`, `filter-select` |
| Form              | `form` (+ `hooks/use-form-extension`), `form-field`, `form-control`, `form-page`, `form-layout`, `form-section`, `form-actions`, `form-submit-button`                                                  |
| Ô nhập            | `email-input`, `password-input`, `code-input`, `slug-input`, `number-input`, `money-input`, `color-input`, `tags-input`, `search-input`                                                                |
| Chọn              | `select-field`, `multi-select`, `checkbox-field`, `radio-group-field`, `switch-field`, **`choice-list`**, **`choice-groups`**                                                                          |
| Ngày giờ          | `date-picker`, `time-picker`, `date-time-picker`, `month-select`                                                                                                                                       |
| Khác              | `image-upload`, `tiptap-editor`, `tiptap-content`, `form-dialog`, `activity-timeline`                                                                                                                  |

- Có khối dùng chung thì dùng, không dựng lại trong module: đầu trang dùng `PageHeader`, bảng dùng `DataTable`,
  ô tìm dùng `SearchInput`, ô chọn dùng `SelectField`, bộ lọc dùng `FilterSelect`, rỗng dùng `EmptyState`,
  lỗi tải dùng `ErrorState` (lỗi tải một bản ghi dùng `QueryErrorState`), trang tạo/sửa dùng `FormPage` + `FormLayout` + `FormSection` + `FormActions`,
  ảnh đơn (ảnh đại diện, logo) dùng `ImageUpload`, nhóm mở/thu dùng `ui/accordion`.
- **Chưa có common phù hợp thì tạo common mới** (đúng cấu trúc thư mục ở trên, cập nhật bảng này), không
  dựng tạm trong module rồi để đó.
- Thứ chỉ một module dùng thì để trong module đó, không đẩy lên `shares/`.
- Ưu tiên primitive shadcn đã có. Chỉ tạo common khi cần gom hành vi dùng lại hoặc quy tắc hệ thống;
  không tạo component chỉ để bọc một thẻ HTML, bộ typography riêng, hoặc sao chép cả thư viện tham khảo.
  Editor, chart, crop ảnh và khối nghiệp vụ chỉ thêm khi màn hiện tại có yêu cầu cụ thể.
- `ImageUpload` chỉ xem trước, chọn ảnh từ Thư viện (`onChoose`) và gỡ ảnh. Không có input file hay
  nút tải ảnh trực tiếp trong form; adapter/view của Attachment cung cấp bộ chọn và kiểm quyền.
  Common không import module hay gọi API.
- Soạn thảo nội dung dùng **một** editor: `TiptapEditor` (`shares/components/common/tiptap-editor`, giá trị là
  Tiptap JSON); hiển thị dùng `TiptapContent` (static renderer, chạy được ở server). Không còn `RichTextEditor`,
  không lưu HTML tùy ý. Extension dùng chung khai trong `common/tiptap-extensions.ts`; module thêm node riêng
  (ví dụ nút, banner của trang tùy chỉnh — module Tiện ích) qua prop `extensions`.
- Module khác cắm vào editor qua plugin: component gọi `useTiptapInsertItem({key, label, icon, run})` và được page
  truyền vào slot `editorPlugins` (ảnh từ Attachment, mã QR là chèn ảnh PNG của QR, nút trỏ link rút gọn).
  Common không import module hay gọi API.

### Input và lỗi form

- Form dùng `common/Form` (luôn `noValidate`) cùng React Hook Form + Zod. Lỗi field hiển thị qua
  shadcn `FieldError`, `data-invalid`, `aria-invalid`, `aria-describedby`; không dùng popup validation
  của browser, `alert()` hoặc chỉ toast cho lỗi nhập liệu. `FormField` nối label/mô tả/lỗi với control.
- Dưới ô chỉ **một** dòng: có lỗi thì lỗi thế chỗ gợi ý (`FormField` tự làm). Không dùng câu gợi ý dài chỉ
  để nói ô "không bắt buộc" (làm lệch lưới hai cột).
- **Trường bắt buộc đánh dấu bằng `*` đỏ sau nhãn**: truyền `required` cho `FormField` (gắn luôn
  `aria-required`). Đây là cách duy nhất; không ghi "không bắt buộc" cho các ô còn lại. `required` phải khớp
  schema (ô chỉ bắt buộc khi tạo thì `required={!record}`, ví dụ mật khẩu, mã vai trò).
- Đăng nhập nhận **email hoặc tên người dùng** trong một ô (`identifier`, `autoComplete="username"`), không
  dùng `EmailInput` cho ô này.
- Email, mật khẩu dùng `EmailInput`, `PasswordInput`; schema dùng `emailField`, `passwordField`
  trong `shares/lib/field-schemas.ts`. Thông báo truyền từ namespace i18n của form.
- Slug dùng `SlugInput` và `slugField` từ common. Chuẩn hóa Unicode bằng
  `@sindresorhus/slugify` trong `shares/lib/code-slug-input.ts`; không tự viết hàm bỏ dấu ở module.
  Giữ nguyên bản đang gõ trong IME; slug URL của hai module nội dung theo hợp đồng 3–64 ký tự.
  Backend vẫn kiểm tra slug và ràng buộc unique.
- Mã định danh dùng `CodeInput`, không tự áp quy tắc slug cho mã vai trò hoặc mã nghiệp vụ.
- Số dùng `NumberInput`, tiền dùng `MoneyInput` (đều dùng `react-number-format`). Tiền nhận
  `currency="VND"` (nguyên) hoặc `currency="USD"` (tối đa hai số lẻ); form nhận số thô, không gửi
  chuỗi có phân cách/ký hiệu tiền. Kiểm tra bằng `moneyField` và hiển thị bằng `formatDisplayMoney`.
- **Mọi upload tệp chỉ thực hiện trong trang Thư viện** (`AttachmentLibrary` → `AttachmentUpload`).
  Form, hồ sơ cá nhân, mã QR và editor chỉ chọn tệp đã có qua `AttachmentPicker`; picker không có
  tab upload hay input file. Nếu cần ảnh mới, mở trang Thư viện, tải lên tại đó rồi làm mới picker.
  Ảnh đơn dùng `AttachmentImageUpload` (adapter của `ImageUpload`) với khung xem trước,
  Chọn ảnh từ Thư viện / Gỡ ảnh; giá trị form là `UploadedFile | null`, gửi BE dạng `<field>Id`.
- Form có đủ trường của model mà người quản trị được phép nhập (đối chiếu serializer validate của BE),
  không bỏ sót trường như ảnh, tên người dùng, cờ trạng thái. Trường chỉ một nhóm người được đặt
  (`isSuperuser`) thì ẩn với người không có quyền và không gửi lên.
- Tên người dùng là trường bắt buộc trên form tạo/sửa và API tạo; PATCH cho phép bỏ qua nhưng
  không nhận giá trị rỗng. Bộ chọn vai trò có nút Chọn tất cả / Bỏ chọn, lưu cùng form.

## 3.1 Chuẩn giao diện dùng chung (bắt buộc)

**Chiều cao control.** Mọi control tương tác cao **40px** (`h-10`), bo `rounded-xl`: `Button` (mọi `size`
đều ra 40px, nút chỉ icon `size-10`), `Input`, `PasswordInput`, `SearchInput`, `SelectField`, mục menu,
mục sidebar. Không tự đặt `h-8`, `h-9`, `size-8` cho nút/ô nhập trong module; nút nằm trong ô nhập
(hiện mật khẩu, xoá từ khóa) là `size-9 rounded-lg` để lọt trong viền.

**Select.** Mọi ô chọn dùng `SelectField` (`shares/components/common/select-field`), không dùng `<select>`
hay `ui/select` trực tiếp. Dưới 8 lựa chọn là Select thường; từ 8 lựa chọn trở lên tự thành dạng có ô tìm
(không phân biệt dấu, điều khiển bằng phím ↑ ↓ Enter). Danh sách lấy từ API (vai trò, người dùng, module…)
luôn coi là dài: truyền `searchable`.

**Bộ lọc.** Mọi bộ lọc trên toolbar bảng dùng `FilterSelect` (`common/filter-select`) và **cho chọn nhiều**:
ô 40px hiện tên bộ lọc; chọn một giá trị thì "Tên: giá trị", chọn nhiều thì tên + số đã chọn; popover
dòng **"Chọn tất cả"** đầu danh sách (trạng thái chọn một phần khi mới chọn vài mục), checkbox từng mục, ô tìm
khi từ 8 lựa chọn, "Xoá lọc" cuối. Bấm liên tiếp nhiều mục không mất mục trước (giữ lựa chọn cục bộ khi
popover mở). Không dùng `SelectField` với lựa chọn "Mọi …" làm bộ lọc.
Backend nhận nhiều giá trị phân tách dấu phẩy (`?status=ACTIVE,EXPIRED`, xem rule backend), `apiClient`
tự nối mảng trong `query` thành chuỗi đó.

**Bảng.** Mọi danh sách dạng bảng dùng `DataTable` (`shares/components/common/data-table`, khuôn theo
CommonDataTable của LoveMe, chạy trên `@tanstack/react-table`). Không dựng `<table>` riêng trong module.

| Phần           | Có sẵn trong `DataTable`                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Module truyền gì                                                                                                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Toolbar        | Ô tìm (trái), bộ lọc, control thêm, nút **Tải lại**, menu **Cột hiển thị** (nhớ theo `tableId`)                                                                                                                                                                                                                                                                                                                                                                                        | `search`, `filters`, `onClearFilters`, `toolbar`, `onReload`                                                                                                                             |
| Cột chọn       | Checkbox mỗi dòng + checkbox tiêu đề (chọn cả trang, trạng thái một phần)                                                                                                                                                                                                                                                                                                                                                                                                              | Tự hiện khi có thao tác hàng loạt; `canSelectRow` để chặn dòng (chính mình, bản ghi hệ thống)                                                                                            |
| Cột `#`        | Số thứ tự theo trang                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `showIndex={false}` để tắt                                                                                                                                                               |
| Sắp xếp        | Tiêu đề cột bấm xoay vòng tăng → giảm → bỏ, `aria-sort`                                                                                                                                                                                                                                                                                                                                                                                                                                | `sortKey` (trường `ordering` của BE) trên cột, `ordering` + `onOrderingChange`                                                                                                           |
| Cột Thao tác   | **Luôn hiện** Xem → Sửa → (Sao chép) → Xoá (hỏi xác nhận), rồi thao tác riêng (nút chỉ icon + tooltip, ví dụ **Thu hồi** phiên). Thiếu quyền/dòng bị khoá thì nút mờ + tooltip lý do, **không ẩn**. Nháy đúp dòng = Xem. Thêm nằm trên toolbar                                                                                                                                                                                                                                         | `onView`, `onEdit`, `onCopy`, `onDelete` (luôn truyền), `can` (`update`/`create`/`delete`), `canEditRow`, `canDeleteRow`; `rowActions`                                                   |
| Cột Trạng thái | Bật/tắt (khoá/mở, kích hoạt) là **chỉ một công tắc**, không kèm chữ "Hoạt động" bên cạnh; nhãn trạng thái ở tooltip + `aria-label`. Không có quyền thì chỉ badge                                                                                                                                                                                                                                                                                                                       | `TableStatusSwitch` (`onCheckedChange` chỉ truyền khi có quyền); bật/tắt không đặt trong cột Thao tác                                                                                    |
| Ghim cột       | Menu tiêu đề: Ghim trái / Ghim phải / Bỏ ghim, sticky theo bề rộng thực                                                                                                                                                                                                                                                                                                                                                                                                                | `enablePinning`; cấu hình lưu riêng theo `tableId`, an toàn SSR, có dự phòng khi storage bị chặn                                                                                         |
| Đổi độ rộng    | Kéo mép tiêu đề (cột ghim phải kéo mép trái) hoặc dùng phím ←/→ (Shift để chỉnh nhanh), Home/End giới hạn; nhấp đúp trả độ rộng tự nhiên. Menu Cột hiển thị có Khôi phục độ rộng cột                                                                                                                                                                                                                                                                                                   | Mặc định bật cho cột dữ liệu; `enableResizing`, `minWidth`, `maxWidth`; lưu riêng theo `tableId`. Cột chọn, `#`, Thao tác giữ kích thước tự động; card mobile không nhận độ rộng desktop |
| Hàng loạt      | Thanh thao tác hàng loạt (`TableBulkBar`) thay chỗ toolbar khi có dòng chọn, **thiết kế trên 1 dòng duy nhất** (`min-h-12 w-full flex items-center justify-between gap-3 rounded-xl border px-3.5 py-1.5`), tuyệt đối không dùng container flex-col hoặc bọc trong thẻ `Card` gây tách 2 tầng và căn giữa; bên trái là badge "Đã chọn n" mang màu nhấn + vạch chia + nút Bỏ chọn, bên phải là cụm nút hành động (Đổi trạng thái, thao tác tuỳ biến, Xoá có xác nhận); xong thì bỏ chọn | `bulkStatus` (`options`, `onChange`), `bulkActions` (`destructive`, `confirm` để hỏi xác nhận), `onBulkDelete`                                                                           |
| Trạng thái     | Khung chờ, làm mờ khi tải lại, lỗi + thử lại, rỗng (`EmptyState`: cao tối thiểu 320px, icon trong hai vòng nền nhạt, tiêu đề, mô tả, một lối ra), rỗng do tìm kiếm + **Xoá tìm kiếm**                                                                                                                                                                                                                                                                                                  | `isLoading`, `isFetching`, `error`, `empty`                                                                                                                                              |
| Phân trang     | "1–20 trong 132", số dòng mỗi trang (10/20/50/100), "Trang x/y", ‹, ô nhập trang (Enter), ›                                                                                                                                                                                                                                                                                                                                                                                            | `pagination` (`value`, `onPageChange`, `onPageSizeChange`)                                                                                                                               |
| Mobile         | Dưới `md` mỗi dòng là một card: checkbox góc trái, cột `mobile: "title"` ở đầu, thao tác góc phải, cột còn lại là hàng "nhãn — giá trị"                                                                                                                                                                                                                                                                                                                                                | `mobile: "title"` (đúng một cột) / `"hidden"`                                                                                                                                            |

- Cột khai bằng `DataTableColumn<T>[]`: `header` (chuỗi), `cell`, `sortKey`, `align: "end"` cho cột số,
  `hideBelow` cho cột phụ ở khung vừa, `enableHiding: false` cho cột luôn hiện. Giá trị trống ghi `—`.
- **Thao tác hàng loạt bắt buộc**: bảng có Xoá từng dòng thì phải có `onBulkDelete` (cột chọn dòng tự hiện);
  bảng không có Xoá thì không có cột chọn. Tài nguyên có cờ boolean bật/tắt (đang dùng/tắt, xuất bản/ẩn) thì có
  `bulkStatus` dựng bằng `createBooleanBulkStatus` (`shares/lib/bulk-status.ts`). Hook bảng gọi common
  `useBulkActions({ service, invalidate })` (`shares/hooks/use-bulk-actions.ts`) lấy `bulkDelete` /
  `bulkUpdate`, không viết `useBulkDeleteXxx` riêng. Dòng không thao tác được (bản ghi hệ thống, tỷ giá lấy từ
  API) chặn bằng `canSelectRow`. `tests/unit/table-conventions.test.ts` kiểm Xoá ↔ Xoá hàng loạt, công tắc
  trạng thái ↔ `bulkStatus`. Bảng không có thao tác nào thì `DataTable` tự ẩn cột Thao tác.
- **Cột Thao tác luôn có Xem / Sửa / Xoá** với tài nguyên có trang chi tiết; không bao giờ ẩn nút vì thiếu quyền.
  View kiểm quyền (`usePermission`) rồi truyền `canUpdate`/`canDelete`/`canCreate` xuống component bảng; component
  luôn truyền `onView`/`onEdit`/`onDelete` và khai quyền ở `can={{ update, delete, create }}` (cấm
  `onEdit={canUpdate ? fn : undefined}`). Hook bảng: `view` → `<M>_ROUTES.xxxDetail(id)`, `edit` →
  `withEditMode(<M>_ROUTES.xxxDetail(id))`. Ngoại lệ chỉ khi nghiệp vụ không có thao tác đó, phải ghi vào bảng
  ngoại lệ của [features/table-actions.md](../features/table-actions.md): `session-table` (Thu hồi, Xoá),
  `announcement-table` (Xoá), `exchange-rate-table` (Xoá, chưa có trang sửa), nhật ký thay đổi (Xem), thư viện
  file (lưới riêng). Switch trạng thái và thao tác hàng loạt vẫn chỉ truyền khi có quyền.
- **Ẩn/khóa theo quyền ba tầng** ([features/permission-ui.md](../features/permission-ui.md)): menu ẩn mục thiếu
  quyền `read` (module/nhóm hết mục thì ẩn); View trả `ForbiddenView` khi thiếu quyền trang (`read` cho list/detail,
  `create` cho trang tạo); trang chi tiết **mặc định chỉ xem**: View dùng `useEditMode(canUpdate)` +
  `<EditModeProvider canEdit={canUpdate}>`, truyền `isEditing` (không phải `canUpdate`) xuống form; `FormPage` tự
  hiện nút **Sửa** (`?mode=edit`). Quyền phụ chỉ dùng khi sửa cũng `&& isEditing`.
- Hằng quyền FE: mỗi class quyền BE đúng một file `permissions/<resource>-permission.ts` (khớp tên file BE),
  không gộp nhiều tài nguyên.
- Mutation xoá / hàng loạt nằm ở hook module (`useDeleteUser`, `useBulkSetUsersActive`, `useBulkDeleteUsers`):
  toast theo số bản ghi, invalidate cache, lỗi thì toast thông báo đã dịch. Backend chạy cả lô trong một
  transaction nên lỗi một dòng thì không dòng nào đổi.
- Cột đầu là link tới trang chi tiết (`font-medium`, hover gạch chân); dòng phụ (email, mã) `text-xs text-muted-foreground`.
- Hộp xác nhận dùng `ConfirmDialog` (`shares/components/common/confirm-dialog`), không dùng `confirm()`.

- **State bảng và lưu URL bắt buộc (URL State Persistence)**. Hook của component bảng bắt buộc dùng `useTableState`
  (`shares/hooks/use-table-state.ts`), tuyệt đối không tự viết `useState` cục bộ cho từ khóa (`search`), trang (`page`),
  số dòng (`pageSize`), sắp xếp (`ordering`) hay các bộ lọc tùy chọn (`filterKeys`, `dateRange`, `tier`, `status`...).
  Toàn bộ state phải được đồng bộ 2 chiều lên URL query parameters qua `window.history.replaceState` (giá trị mặc định không ghi)
  để khi người dùng chuyển trang, lọc dữ liệu, tải lại (F5) hay gửi link chia sẻ, giao diện vẫn giữ nguyên chính xác trạng thái đó.
  Đổi từ khóa, sắp xếp, số dòng hay bộ lọc thì về trang 1.

```ts
export function useUserTable() {
  const table = useTableState({ ordering: "-created_at" }); // filters { search, ordering, page, pageSize }
  const query = useUsers(table.filters); // useQuery với placeholderData: keepPreviousData
  const remove = useDeleteUser();
  return {
    query,
    table,
    remove: (user: User) => remove.mutateAsync(user.id) /* … */,
  };
}
```

- Ô tìm giữ bản đang gõ riêng, **chỉ áp dụng khi nhấn Enter** (bỏ qua Enter trong IME). Không debounce,
  không tìm theo từng ký tự. Nút xóa áp dụng ngay từ khóa rỗng.
- Bộ lọc riêng khai trong `useTableState({ filterKeys: [...] })`; đọc/ghi bằng `getFilterValues(key)` /
  `setFilterValues(key, values)` (URL lưu `a,b`), lọc giá trị lạ bằng `pickAllowedValues`, xoá bằng
  `clearFilters`; không tự giữ state thứ hai. Đổi bộ lọc về trang 1 và giữ các tham số còn lại trên URL.
  Truyền `onClearFilters={table.hasFilters ? table.clearFilters : undefined}` cho bảng.
- Danh sách dùng làm danh mục/ô chọn phải tải đủ các trang API, không chỉ lấy trang đầu hoặc cắt ở 100.

## 3.1.1 Dialog (bắt buộc)

- `DialogContent` đặt `p-0` (header/footer có viền riêng) thì `DialogFooter` phải thêm `mx-0 mb-0`: footer của
  shadcn có lề âm `-mx-4 -mb-4` dành cho `p-4`, để nguyên là footer lệch ra ngoài, nút bị cắt.
- Dialog có **tab** hoặc nội dung dài: chiều cao **cố định** (`h-[min(85vh,760px)]`), header + thanh tab + footer
  đứng yên, chỉ thân cuộn (`min-h-0 flex-1 overflow-y-auto`): đổi tab không nhảy kích thước.
- Hai cột trong dialog/trang: cột có nội dung rộng (bảng) dùng `flex-1 min-w-0` (hoặc `minmax(0,1fr)`) để bảng
  cuộn ngang trong khung, không đẩy cả khối tràn ra ngoài; dưới `md` xếp chồng.
- **Nút lưu của mọi tab nằm ở footer dialog**, không nằm trong nội dung tab: nội dung bọc `<Form id={…_FORM_ID}>`
  (id khai ở `constants/`), nút footer `type="submit" form={…_FORM_ID}`, chỉ hiện ở tab đang mở và khi có quyền sửa.
- **Đồng bộ Tab với URL (Tab State Persistence)**: Mọi trang hoặc form có cấu trúc Tabs chính (`PageForm`, `PortalProfile`...) bắt buộc phải đồng bộ tab đang chọn với URL query param (`?tab=...`) bằng hook `useTabState` (`shares/hooks/use-tab-state.ts`). Trạng thái tab được lưu vào lịch sử bằng `window.history.replaceState` (không kích hoạt router reload) để khi người dùng reload trang hoặc sao chép liên kết URL, ứng dụng tự động mở đúng tab đó.
- **Slug định dạng tùy biến (preserveCase)**: Với các tài nguyên công khai như trang tùy chỉnh (`Page`) và link rút gọn (`ShortLink`), slug cho phép giữ nguyên chữ hoa chữ thường (ví dụ: `ToanToChill`) qua cờ `preserveCase: true` trong `slugField`, `SlugInput` và `normalize_slug`, đồng thời kiểm tra trùng lặp không phân biệt hoa thường trong DB (`Lower("slug")`).

## 3.2 Chuẩn Next.js (Image, Link) và Shadcn UI (bắt buộc)

**Tối ưu hình ảnh với `next/image`.**

- Mọi hình ảnh hiển thị trong project **bắt buộc sử dụng component `<Image />` từ `next/image`** để tự động tối ưu hóa định dạng hiện đại (WebP, AVIF), responsive srcset, lazy loading và chống layout shift (CLS).
- **Tuyệt đối không dùng thẻ `<img>` trần** hoặc viết chú thích tắt cảnh báo eslint `// eslint-disable-next-line @next/next/no-img-element`.
- Cấu hình domains/remotePatterns tập trung tại `frontend/next.config.ts` (hỗ trợ `media.toannx.com`, Cloudflare R2 `**.r2.dev`, và `localhost`/`127.0.0.1`).
- Với khung chứa linh hoạt theo tỷ lệ (aspect-square, avatar, preview), container cha đặt `relative`, thẻ `<Image />` sử dụng `fill`, `className="object-cover"` (hoặc `object-contain`), và khai báo prop `sizes` phù hợp (ví dụ `sizes="80px"` hoặc `sizes="(max-width: 768px) 100vw, 33vw"`).
- Khi ảnh là chuỗi data URI (`data:image/...`) hoặc blob URL cục bộ từ browser: thêm prop `unoptimized`.

**Chuẩn liên kết với Navigation Link (bắt buộc).**

- Mọi liên kết chuyển trang hoặc mở URL trong module và cây `[locale]` **bắt buộc sử dụng `<Link />` từ
  `@/i18n/navigation`** (kể cả liên kết ngoài `target="_blank"` và link tải trực tiếp `data:`/`http(s):` với `href={url as never}` — `next-intl` tự bỏ qua prefix cho URL có scheme), hoặc bọc bằng `<Button asChild><Link href="...">...</Link></Button>`.
- Ngoại lệ duy nhất là file ngoài cây `[locale]` như `src/app/not-found.tsx` dùng `next/link` (`tests/unit/code-conventions.test.ts` kiểm tự động).
- **Tuyệt đối không dùng thẻ `<a>` trần** ở bất kỳ đâu trong component `.tsx`.
- Với liên kết ngoài (external URL như shopee, lazada, mạng xã hội, tài liệu...): dùng `<Link href={url as never} target="_blank" rel="noopener noreferrer">` từ `@/i18n/navigation`.
- Khi liên kết đóng vai trò là nút bấm, hành động (CTA), hoặc item có tương tác: bắt buộc kết hợp component `Button` của shadcn với prop `asChild`:
  ```tsx
  <Button asChild variant="outline">
    <Link href={url} target="_blank" rel="noopener noreferrer">
      <span>{label}</span>
      <ExternalLink className="size-3.5" />
    </Link>
  </Button>
  ```
  Không lồng thẻ `<button>` bên trong `<Link>` hoặc ngược lại mà không có `asChild`.

**SVG: đặt file trong `public/`, nơi dùng gọi theo đường dẫn, không khai trực tiếp.**

- Mọi SVG (icon thương hiệu Google/GitHub, minh họa trạng thái rỗng/lỗi, hình nền...) lưu thành file
  `frontend/public/<nhóm>/<tên>.svg` (kebab-case): `public/icons/google.svg`, `public/icons/github.svg`,
  `public/illustrations/empty-inbox.svg`. Logo vẫn theo mục Logo (PNG trong `public/brand/`).
- **Cấm** viết `<svg>...</svg>` hay `<path d="...">` trong `.tsx`, cấm component bọc SVG nội tuyến kiểu
  `GoogleIcon`, cấm chuỗi SVG/data URI `data:image/svg+xml` trong code hay CSS.
- Hiển thị bằng `<Image src="/icons/google.svg" alt="" width={20} height={20} />` từ `next/image`: `src` kết thúc
  `.svg` thì Next tự bỏ qua tối ưu (`unoptimized`). **Không** bật `images.dangerouslyAllowSVG`.
- Đường dẫn khai **một lần** thành hằng: SVG dùng chung ở `shares/lib/asset-paths.ts`
  (`ICON_PATHS.google = "/icons/google.svg"`), SVG của riêng một module ở `modules/<m>/constants/asset-paths.ts`.
  Nơi dùng import hằng, không gõ lại chuỗi `"/icons/..."`.
- Icon đơn sắc cần đổi màu theo chữ/theme: dùng `lucide-react` trước; lucide không có thì file SVG trong `public/`
  hiển thị qua CSS mask (`bg-current` + `mask-image: url(/icons/x.svg)`), vẫn không vẽ SVG nội tuyến.
- File SVG phải sạch: chỉ hình vẽ, không `<script>`, không `on*=`, không link ngoài; đã tối ưu (bỏ metadata của
  trình vẽ) trước khi thêm vào `public/`.
- Thêm SVG dùng chung thì ghi vào [docs/common-catalog.md](../common-catalog.md) mục 4.10 (rule chung mục 3.3).

**Sử dụng triệt để primitives của Shadcn UI.**

- Mọi thành phần tương tác và cấu trúc giao diện cơ bản (`Button`, `Checkbox`, `RadioGroup`, `Label`, `Input`, `Textarea`, `Dialog`, `Card`, `Tooltip`, `Badge`, `Avatar`, `Switch`, `Sheet`, `Popover`, `Select`, `Table`, `Tabs`, `Separator`...) **bắt buộc dùng component trong `@/shares/components/ui/*`**.
- Khi cần một component primitive mà thư mục `@/shares/components/ui/` chưa có: **bắt buộc chạy lệnh `pnpm dlx shadcn@latest add <tên-component>`** để cài đặt chuẩn từ thư viện shadcn, không tự viết component thủ công để thay thế.
- **Nghiêm cấm lồng lộn thẻ HTML sai ngữ nghĩa**: Tuyệt đối không bọc `<Checkbox />` hay `<Button />` (vốn là thẻ `<button>` của Radix) bên trong thẻ `<label>` để tự vẽ giả lập checkbox/nút bấm (vi phạm chuẩn HTML, gây lặp sự kiện click và phá vỡ trợ năng).
- **Nghiêm cấm viết thẻ `<button>` trần** kèm class CSS tự chế khi đã có component `Button` chuẩn của shadcn.
- Các item dạng card trong lưới (như media file, thẻ danh sách) phải sử dụng component `Card` của shadcn để đồng nhất border, background và shadow theo design system.

**Quy chuẩn Tên tệp trong Thư viện (Attachment).**

- Trường `original_name` của tệp (mặc định lấy theo tên file người dùng tải lên) **bắt buộc phải cho phép chỉnh sửa/đổi tên được** (Rename) cả ở tầng Backend (API PATCH nhận `original_name`) và Frontend (nút đổi tên nhanh trên card lưới và trong panel chi tiết), kèm thuộc tính `alt_text` cho hình ảnh để phục vụ SEO và accessibility.

**Tạo/sửa bản ghi là trang riêng, không popup.** Tạo mới ở `/<resource>/new` (vi: `/tao-moi`), sửa ở
`/<resource>/[id]`; nút "Tạo …" trên trang danh sách là `Link` sang trang đó. Tạo xong chuyển tới trang
chi tiết. Dialog chỉ dùng cho thao tác nhỏ ngay tại chỗ không cần trang riêng (xác nhận xoá…).
Trong bộ chọn Attachment, tạo/đổi tên/chuyển cha thư mục logic là thao tác nhỏ tại chỗ dùng chung
một form, để người dùng tiếp tục chọn ảnh mà không rời form phía sau. Không dùng ngoại lệ này cho
các tài nguyên nghiệp vụ khác. Xóa nhánh luôn xác nhận cách xử lý file; mặc định giữ file.

**Tạo = sửa = chi tiết: một form duy nhất.** Mỗi tài nguyên có **một** component form (`UserForm`,
`RoleForm`) nhận bản ghi khi sửa, không có bản ghi khi tạo. Cùng bố cục, cùng trường, cùng cách chọn
quan hệ; chỉ khác những gì bắt buộc khác (mã chỉ nhập khi tạo, mật khẩu "để trống nếu không đổi", nút
Tạo/Lưu) hoặc chỉ có khi đã có bản ghi (card Hoạt động). Không tách `XxxCreateForm`/`XxxEditForm` hai giao
diện; trang tạo chỉ là lớp mỏng lo điền sẵn (sao chép) rồi render đúng form đó.

**Khung trang form (không để form dạt một bên):**

```
FormPage (mx-auto max-w-6xl; CARD ĐẦU TRANG dính dưới header: tiêu đề · [Hủy] [Tạo/Lưu], không có ←)
└─ Form
   ├─ FormLayout  ── cột chính: ít card nhất có thể (thường MỘT card "Thông tin …" gồm ảnh + mọi ô nhập)
   │              └─ cột phụ 22rem: card Truy cập/Trạng thái (cờ dạng ChoiceList switch), card chỉ đọc (Hoạt động)
   ├─ khối QUAN HỆ trải ngang dưới hai cột (vai trò của người dùng — ChoiceList grid có ô tìm;
   │  quyền của vai trò — ChoiceGroups). Không đặt danh sách quan hệ vào cột phụ: nhiều mục là dài lê thê.
   └─ FormActions: khai cuối form, tự đưa nút lên đầu trang dính (portal); "Có thay đổi chưa lưu" đứng trước nút
```

- **Không chia nhỏ** mỗi 2–3 ô một card: gom ô của cùng một bản ghi vào một card, xếp `sm:grid-cols-2`.
  Card mới chỉ khi nội dung khác loại (cờ, quan hệ, thông tin chỉ đọc).
- **Thanh nút nằm ở đầu trang và dính dưới header khi cuộn** (không dùng thanh nổi dính đáy: nó đè lên nội dung
  và chiếm cả bề ngang chỉ để chứa hai nút). Đầu trang là **một card** (`bg-card rounded-xl border`) chứa tiêu
  đề + nút, luôn cách header 16px (lúc đầu và lúc dính); khi đã dính có bóng `shadow-md`, dải nền canvas
  phía trên che nội dung cuộn qua. Màn
  hẹp vẫn một hàng: tiêu đề cắt ngắn, nút bên phải (`PageHeader inline`). Nút gửi luôn là `FormSubmitButton`
  (gắn `form=<id>` vì đã nằm ngoài thẻ `<form>`; `Form` tự cấp id). Nút Lưu khi sửa chỉ bật khi form
  **hoặc** phần mở rộng có thay đổi.
- **Quan hệ (vai trò, quyền…) lưu cùng nút Tạo/Lưu**, ở cả tạo và sửa: chọn bằng checkbox, lưu bản ghi
  chính trước rồi đồng bộ quan hệ (`diffIds` → gán phần mới, gỡ phần bỏ; mutation `useSync…`). Không có
  công tắc gán ngay ở trang sửa mà trang tạo lại khác.
- Module khác cắm phần của mình vào form của module nền qua slot `extensions` do page ghép (form người
  dùng không import phần IAM). Slot gọi `useFormExtension(handler, dirty)`: `handler(record)` chạy sau khi lưu, `dirty` bật
  nút Lưu; form bọc slot bằng `FormExtensionContext.Provider` và gọi `registry.run(record)`.
- Dưới `lg` hai cột xếp chồng, cột phụ xuống dưới; khối quan hệ luôn ở cuối, đầu card có nhãn "Đã chọn n/tổng".

**Nút quay lại.** Header của workspace module có nút ← về màn chọn module (`AdminShell`). Trang form (tạo,
chi tiết, sửa) **không** có nút ← vì nút **Hủy** đã là lối về danh sách; người chỉ có quyền xem thì nút đó ghi
**Quay lại** (form luôn render `FormActions`). Trang con không phải form mà cần lối về thì dùng
`PageHeader backHref`.

**Hiển thị/chọn danh sách mục (vai trò, quyền, cờ…) — chuẩn hoá, KHÔNG mỗi màn một kiểu.**

**Mọi giao diện chọn nhiều phải có hai nút Chọn tất cả / Bỏ chọn tất cả** đặt cạnh nhau ở đầu
danh sách, áp dụng cho bộ chọn quan hệ, quyền, multi-select, bộ lọc và chọn dòng trong bảng.

- Chọn tất cả chỉ chọn các mục được phép thao tác; không chọn mục bị khóa hoặc thiếu quyền.
- Bỏ chọn tất cả gỡ các lựa chọn được phép thay đổi; giữ nguyên mục bị khóa.
- Phạm vi phải rõ ràng: bảng phân trang dùng "Chọn tất cả trong trang"; danh sách đang lọc thì
  ghi rõ nếu chỉ áp dụng cho kết quả lọc. Không âm thầm chọn dữ liệu ngoài phạm vi hiển thị đã nêu.
- Danh sách chia nhóm có thêm Chọn cả nhóm / Bỏ chọn cả nhóm; vẫn có hai nút cho toàn danh sách.
- Chỉ xem thì ẩn hai nút; khi đang tải hoặc lưu thì khóa nút. Khóa Chọn tất cả khi đã chọn hết
  các mục có thể chọn, khóa Bỏ chọn tất cả khi không có lựa chọn nào được phép gỡ.
- Nhãn nút phải qua i18n, đủ vi + en; hành vi chọn/bỏ chọn lưu theo cùng cơ chế của từng màn.

| Dữ liệu                                                                                      | Component                               | Cấu hình                                                                                                                                           |
| -------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Danh sách phẳng, ít mục, đọc từ trên xuống (vai trò của người dùng, cờ truy cập, trạng thái) | `ChoiceList` (`common/choice-list`)     | `layout="list"`; `control="checkbox"` để chọn nhiều, `"switch"` cho cờ bật/tắt, `"none"` chỉ xem                                                   |
| Nhiều mục chia nhóm (quyền theo module)                                                      | `ChoiceGroups` (`common/choice-groups`) | accordion mỗi nhóm (mặc định mở, Mở/Thu gọn tất cả), đầu nhóm "đã chọn/tổng", Chọn cả nhóm; mục là `ChoiceList layout="grid"` (card nhỏ 1/2/3 cột) |

- Danh sách từ 8 mục trở lên tự có ô tìm (lọc ngay, bỏ dấu, theo nhãn/mã/mô tả) — `ChoiceList searchable`,
  ngưỡng `CHOICE_SEARCHABLE_THRESHOLD`, như `SelectField`/`FilterSelect`.
- Kiểu công tắc (`switch`) không tô nền dòng đang bật (công tắc đã nói trạng thái); chỉ kiểu checkbox tô mục
  đã chọn. Mỗi mục có `relative` để input ẩn của Radix không tràn khỏi khung cuộn (từng làm trang dài thêm
  khoảng trắng).
- Mục là `ChoiceItem` (`value`, `label`, `code` mono, `description`, `badge`, `disabled`); mục đã chọn tô
  nền nhấn nhạt, bấm cả dòng/card để đổi, control nằm bên phải.
- Module chỉ **đổi dữ liệu sang `ChoiceItem`/`ChoiceGroup`** bằng hook của module (System:
  `system/hooks/use-permission-choice-groups.ts`, `system/hooks/use-role-choice-items.ts`, mỗi hook một file) rồi
  render component chung. Trang Quyền (chỉ xem), form vai trò (chọn quyền), form người dùng (chọn vai
  trò) đều theo bảng trên; thêm loại dữ liệu mới thì viết hook đổi dữ liệu, không dựng UI riêng.

**Câu chữ.** Không viết câu giới thiệu, chính sách hay khẩu hiệu dưới tiêu đề, kiểu "Dành cho tài khoản do
quản trị viên cấp.", "ToanNX không mở đăng ký công khai.", "Tài khoản chỉ do quản trị viên tạo.",
"Chọn một module để bắt đầu làm việc.". `PageHeader` mặc định chỉ có tiêu đề (+ nút); `description` chỉ khi
là dữ liệu của bản ghi (mã vai trò). Câu phụ chỉ được đặt ở field khi nói **hậu quả của thao tác**
("Đổi mật khẩu sẽ đăng xuất mọi phiên của người dùng.") hoặc định dạng cần nhập.

## 4. Quy ước

- Đa ngôn ngữ: Next.js 16 tự nhận diện locale qua `next/root-params` trong `src/i18n/request.ts`; **không** gọi `setRequestLocale` (deprecated) trong `page.tsx` hay `layout.tsx`.
- Không hardcode path API, route, query key, chuỗi quyền hay mã lỗi API kiểm điều kiện trong logic:
  - Route/endpoint/query key lấy từ `constants/` của module (`<M>_ROUTES`, `<M>_API_ENDPOINTS`, `<m>Keys`, `portalKeys`);
  - Quyền lấy từ `modules/<m>/permissions/*-permission.ts` (dựng bằng `createResourcePermissions` + `<M>_SCOPE` + `PERMISSION_ACTION`);
  - Mã lỗi xác thực/CSRF dùng chung của `apiClient` đặt tại `shares/constants/auth-error-codes.ts` (`AUTH_ERROR_CODES`), mã lỗi riêng module cần so sánh trong hook/logic đặt tại `modules/<m>/constants/error-codes.ts`.
- Hằng số dùng chung toàn FE (locale, timezone, tiền tệ, tùy chọn phân trang, ID toast phiên) lấy từ
  `shares/constants/` và helper `shares/lib/number-format.ts` (`getNumberLocale`, `formatVndText`,
  `formatDisplayNumber`), `shares/lib/localized-route.ts` (`isLocalizedRouteExact`, `startsWithLocalizedRoute`);
  không lặp `locale === "en" ? "en-US" : "vi-VN"`, `.toLocaleString("vi-VN")` hay key phiên/OAuth rải rác
  (`tests/unit/code-conventions.test.ts` kiểm tự động).
- Điều hướng: `<Link />`/`useRouter`/`redirect` từ `@/i18n/navigation` (không dùng `next/link` trong module hay cây
  `[locale]`, kể cả link ngoài `href={url as never}`; ngoại lệ duy nhất là `src/app/not-found.tsx`).
- Mọi text qua next-intl; message theo module; thêm khóa phải thêm đủ vi + en.
- Schema Zod là factory nhận hàm dịch (`createLoginSchema(t)`).
- Màu dùng token semantic (`bg-primary`, `text-muted-foreground`, `bg-canvas`); không hardcode màu (xem §4.0).
- `PermissionGate`/`usePermission` chỉ để ẩn/hiện; backend luôn enforce.
- URL file/ảnh/icon từ API là URL tuyệt đối: dùng trực tiếp trong `<Image src={url}>` (§3.2), không nối domain/basePath.
- Module FE theo đúng module BE (`system`, `novel`, `utilities`), trừ `manage-app` và `home` chỉ có ở FE. Module nền không import module phụ thuộc nó;
  page ghép giao diện nhiều module qua prop slot (ví dụ `UserDetailView aside={<UserRolesCard />}`,
  `history={<RecordHistoryView … />}`, `editorPlugins={<QrCodeTiptapPlugin />}`).
- Tạo/sửa nhanh tài nguyên liên quan ngay trong form khác dùng `FormDialog` bọc đúng form của tài nguyên đó
  (ví dụ tạo đường dẫn trang trong form trang); không viết form thứ hai.
- `tests/unit/module-registry.test.ts` kiểm mỗi module đã ghép đủ routing, messages, `global.d.ts`, navigation và
  không import ngang module ngoài slot cho phép.
- Cookie, key localStorage/sessionStorage, query key, tên event và **tên hằng giữ các key đó** không có tiền tố
  `toannx` ở mọi dạng (`toannx_`, `toannx-`, `toannx:`, `TOANNX_`). Key storage đặt `<module>_<việc>`
  (`novel_reader_settings`), khai bằng hằng `UPPER_SNAKE` cuối `_KEY` ([common.md](common.md) mục 3).
- Không barrel `index.ts`; thứ tự import: React/Next → thư viện → `@/shares` → module khác → tương đối.
- JSDoc theo §2 (mọi file, export, hook, service, kiểu).
- **Server Component là mặc định**; chỉ thêm `"use client"` ở component thật sự cần state, effect, sự kiện hay API
  trình duyệt, và đặt càng sâu càng tốt (không đánh dấu cả View/layout chỉ vì một nút).
- Không dùng `useEffect` để tính dữ liệu suy ra từ props/state (tính thẳng khi render) hay để gọi API (dùng React
  Query). `useEffect` chỉ để đồng bộ với hệ bên ngoài (DOM, storage, subscription) và luôn dọn dẹp.
- `key` của danh sách là id ổn định, không dùng index khi danh sách có thể đổi thứ tự/thêm/xóa.
- Nút chỉ có icon phải có `aria-label` (qua i18n) và tooltip; ảnh có `alt`; mọi thao tác dùng được bằng bàn phím.
- Không dùng `style={{…}}` inline cho giao diện tĩnh; chỉ cho giá trị động không có class tương ứng (độ rộng cột kéo).
- Biến môi trường chỉ đọc qua module cấu hình (`env` ở `shares/config`), không gọi `process.env` rải rác.

### 4.0 Thương hiệu: màu, logo, favicon (bắt buộc)

**Màu thương hiệu xanh lá** (theo logo cỏ bốn lá). Mọi màu nhấn đi qua token trong `src/app/globals.css`,
khai ở cả `:root` và `.dark`; không viết cứng mã màu hay class màu Tailwind (`violet-600`, `sky-500`…) trong
component. Vai trò từng màu (đã đo tương phản WCAG AA):

| Token             | Light                                              | Dark                                                    | Dùng cho                                                    |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| `--primary`       | `#3D812E` (chữ trắng 4.8:1)                        | `oklch(0.72 0.15 135)` + chữ `--primary-foreground` tối | Nút chính, link, mục đang chọn, sidebar đang chọn           |
| `--primary-hover` | `#206A2D` (6.6:1)                                  | `oklch(0.78 0.15 135)`                                  | Hover/nhấn của nút chính (`hover:bg-primary-hover`)         |
| `--ring`          | `#569533`                                          | `oklch(0.62 0.14 136)`                                  | Vòng focus, điểm nhấn trang trí (vầng sáng, chấm)           |
| `--primary-light` | `oklch(0.98 0.018 138)`                            | primary 16%                                             | Nền badge/ô chọn; chữ trên đó dùng `text-primary` (≥ 4.5:1) |
| `--chart-1…8`     | bảng 8 màu đa sắc (bắt đầu từ `--primary` xanh lá) | bản sáng cho dark mode (`oklch` tương phản rõ)          | Biểu đồ đơn & đa chuỗi (`CHART_COLORS`)                     |

- `#569533` chỉ đạt 3.7:1 với chữ trắng: **không** dùng làm nền nút có chữ, chỉ làm focus/trang trí.
- Nền trung tính (`--canvas`, `--item-hover`, `--surface-hover`) pha nhẹ sắc xanh (hue 140), không pha sắc khác.
- `--success` là xanh ngọc (hue 175) để khác nút chính; số liệu không tô màu nhấn (tránh bị đọc là "tốt").
  `--destructive` giữ đỏ, `--warning` giữ hổ phách.
- Chữ trên nền đỏ đặc (badge số thông báo) dùng `text-destructive-foreground` (token `--destructive-foreground`:
  luôn trắng).
- **Class màu ngữ nghĩa phải có token** `--color-<tên>` trong `@theme` của `globals.css` (`text-info` không có
  `--color-info` → Tailwind không sinh CSS, chữ ăn màu cha). Màu mới thì thêm token ở `:root` + `.dark` +
  `@theme` trước khi dùng. `tests/unit/theme-tokens.test.ts` kiểm.
- **Ưu tiên thang có sẵn** thay giá trị tùy ý: `h-4.5`, `min-w-4.5`, `max-w-6xl` thay `h-[18px]`… Chỉ dùng
  `[...]` khi thang không có (ví dụ `h-[min(85vh,760px)]`). Đổi `globals.css` mà trang chưa đổi màu: dev server
  (Turbopack) còn giữ CSS cũ, khởi động lại `pnpm dev`.
- Ở dark mode màu nhấn chỉ làm nền; đường mảnh (viền focus, gạch chân) dùng `--ring` hoặc giảm độ đục.
- **Màn hình công khai & Custom Page chuẩn Light/Dark hệ thống**: trang công khai (`/p/[slug]`, `/s/[slug]`, trang
  chủ, sản phẩm, quyên góp/donate) bắt buộc tôn trọng và thừa hưởng đầy đủ token Light/Dark hệ thống (`bg-canvas`,
  `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`...); không ép cứng màu nền/chữ sáng hoặc
  tối tĩnh làm sai lệch chế độ giao diện của người dùng.
- Email HTML (backend `templates/system/email`) không đọc được CSS biến: dùng đúng mã hex của bảng trên
  (nút `#3D812E`, link `#206A2D`).

**Logo và favicon** chỉ có một nguồn: `public/brand/logo.png` (PNG nền trong suốt). Mọi kích thước sinh bằng
`uv run --project backend python scripts/build_brand_assets.py` (cắt sát, chừa lề, thu nhỏ), không sửa tay:
`public/brand/logo-mark.png` (giao diện), `src/app/icon.png`, `src/app/favicon.ico`, `src/app/apple-icon.png`
(Next.js tự gắn thẻ `<link>`). Đổi logo = thay `logo.png` rồi chạy lại script. Giao diện chỉ hiển thị logo qua
`LogoMark`/`Logo` (`shares/components/layout/logo.tsx`, dùng `next/image`), không tự đặt `<Image src="/brand/…">`
hay vẽ SVG logo riêng.

## 4.1 Khung quản trị

- Khung nằm ở `modules/manage-app/components/shell/admin-shell`; `app/[locale]/(admin)/admin/layout.tsx` chỉ render nó.
- `/admin` (`/vi/quan-tri`) là **màn chọn module**: mỗi thẻ là một nhóm. Danh sách **khai tĩnh ở FE**, không
  có API hay bảng cấu hình module: mỗi module khai `group`, `icon` (component lucide), `items` trong
  `navigation.ts`; `ADMIN_MODULE_NAVIGATION` + `ADMIN_GROUPS` (`modules/manage-app/constants/admin-navigation.ts`)
  gộp lại, lọc theo quyền trong `/system/auth/me`.
- Trong một nhóm: sidebar của nhóm (đầu là bộ chuyển nhóm, thân chia mục theo module, chân là tài khoản),
  nội dung bên phải.
- **Không nhãn module thừa**: nhóm chỉ có một module (mọi nhóm hiện tại) thì sidebar **không** hiện nhãn module
  IN HOA (tên đã ở bộ chuyển nhóm); chỉ nhóm có từ hai module trở lên mới có nhãn module bấm thu gọn.
- **Cụm menu**: trong module, mục khai `section: "<module>.navSections.<code>"`; mục cùng cụm đặt liền nhau.
  Module **nhiều hơn 5 mục** bắt buộc chia cụm cho mọi mục (`tests/unit/admin-navigation.test.ts` kiểm). Cụm gom
  theo nghiệp vụ (tài khoản & phân quyền, danh mục, tích hợp, vận hành…), mục đầu tiên của module là trang hay
  dùng nhất. Sidebar thu gọn (dải icon, tự thu ở tablet): nhãn cụm ẩn, giữa các cụm có vạch ngăn, tooltip
  "Cụm › Mục". Đổi cụm thì cập nhật bảng cụm ở [features/admin-navigation.md](../features/admin-navigation.md). Breadcrumb trên header chỉ ghi các cấp cha; tên trang là `<h1>` trong `PageHeader`.
- Nhóm hiển thị khai ở `ADMIN_GROUPS`; tên/mô tả nhóm ở `common.adminGroups.<group>`; tên/mô tả module do
  `navigation.ts` của module khai bằng `nameKey`/`descriptionKey` trong namespace của chính module
  (`system.module.name`).
- Trang đọc danh sách nhóm qua `useAdminGroups()` (context do khung cung cấp), không import `navigation.ts`
  của module khác.
- Giao diện theo [DESIGN.md](../../DESIGN.md) (bộ mặt Clean): header và đầu sidebar `h-16`, mục menu
  `h-10 rounded-xl`, đang chọn `bg-primary-light text-primary`.

### Màn của module System

- Menu theo thứ tự: Người dùng, Phiên, Vai trò, Quyền, Thư viện, Nhật ký (`modules/system/navigation.ts`).
- Bảng Phiên có chọn dòng, `#`, mã phiên, **Thu hồi** trong cột Thao tác và thu hồi hàng loạt (hỏi xác nhận).
- Danh mục Quyền chỉ đọc; có tìm/lọc nhiều module; không có link chi tiết hay nút CRUD.
- Người dùng có cột **Hoạt động gần nhất** (`lastSeenAt`, chấm xanh "Đang trực tuyến" khi trong 5 phút —
  `isOnline` ở `shares/lib/presence.ts`) và **Đăng nhập gần nhất** (`lastLogin`); trang chi tiết có card Hoạt động.

## 5. Auth & API

- Gọi API cùng origin `/api/v1/*` (Next rewrite sang Django); cookie HttpOnly, không lưu token ở JS.
- `apiClient` tự gắn CSRF, request id, chuyển case, silent refresh single-flight; không tự viết lại.
- Logout/đổi quyền: xóa/invalidate cache React Query.
- **Tải dữ liệu 100% phía Client (cấm gọi API ngầm ở SSR)**: mọi trang (kể cả trang công khai như link rút gọn `/s/[slug]`, custom page `/p/[slug]`) bắt buộc gọi API lấy dữ liệu ở phía Client thông qua React Query (`useQuery`) + `service` + `apiClient`. Cấm dùng Server Component gọi API ngầm (`serverApiGet`/`backendFetch`/`fetch` ngầm ở server Next.js) để render trang; `page.tsx` chỉ nhận params và render View. Bắt buộc có API call hiển thị trực tiếp trên tab Network của DevTools trình duyệt để phục vụ việc debug lỗi, đồng thời tránh lỗi mạng/WAF/Cloudflare chặn giữa các serverless functions.
- **Hủy request**: truyền `signal` của React Query cho `apiClient`; không tự `AbortController.abort()` lên `fetch`
  trong module. `apiClient` không abort `fetch` khi bên ngoài hủy (abort làm lý do hủy lọt vào promise không ai
  bắt → Next dev báo "Runtime AbortError" / "Runtime Error: cancelled"); chỉ trả `ApiError` `REQUEST_CANCELLED`.
  Mọi promise tự tạo (`mutateAsync` gọi từ handler…) phải có `await`/`void` + xử lý lỗi, không để rơi.
- **Đọc bytes file** (canvas, `fetch` rồi xử lý): dùng `attachmentService.contentStreamUrl(id)` (cùng origin, backend
  stream), không `fetch` URL storage R2 (khác origin, bị CORS chặn) ([features/attachment-visibility.md](../features/attachment-visibility.md)).
- **Thông báo trình duyệt**: service worker `public/notification-sw.js` luôn hiện thông báo của hệ điều hành
  (Windows: góc màn hình), tab chỉ làm mới chuông. Sửa SW thì trình duyệt chạy bản cũ tới khi DevTools →
  Application → Service workers → Update ([features/web-push.md](../features/web-push.md)).

## 6. Test

- **Build thử vào thư mục khác** (`NEXT_DIST_DIR=.next-xxx pnpm build`) thì Next tự thêm `.next-xxx/types/**` vào
  `include` của `tsconfig.json` và ghi lại file không theo prettier → CI đỏ ở bước Format. Build xong phải bỏ các
  dòng đó (chỉ giữ `.next` và `.next-e2e`) và chạy `pnpm exec prettier --check tsconfig.json` trước khi commit.

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm e2e   # toàn bộ: chỉ khi được yêu cầu
pnpm exec eslint <file> && pnpm exec prettier --check <file>                                # file đã sửa
pnpm typecheck && pnpm test tests/unit/<file>.test.ts && pnpm e2e tests/e2e/<luồng>.spec.ts   # phần liên quan
```

- Khi làm việc chỉ chạy phần liên quan tới chỗ sửa ([common.md](common.md) mục 7).

- Unit (Vitest): `tests/unit`. E2E (Playwright): `tests/e2e`, chạy trên server thật với database riêng
  `toannx_e2e` (BE 8001, FE 3001 build vào `.next-e2e`), không đụng dữ liệu dev.
- Khi viết/sửa unit test FE, tham khảo skill `vitest` cho mock, fake timer và assertion; dùng API tương thích
  phiên bản trong `frontend/package.json`. Khi viết/sửa E2E spec, dùng `playwright-best-practices` cho locator,
  chờ điều kiện và fixture; `playwright-cli` dùng để mở UI thật, chụp và kiểm tương tác. Chỉ chạy file test
  liên quan theo rule chung mục 7.
- Kiểu dữ liệu: `pnpm api:types` sinh `shares/types/api-schema.gen.ts` từ OpenAPI (không sửa tay; CI đỏ nếu
  cũ). Chạy lại ngay khi BE đổi thứ đi vào OpenAPI, **kể cả chỉ đổi docstring của view/method** (rule backend §6). `ApiModel<"…Response">` là kiểu FE nhận được (đã camelCase). Kiểu viết tay phải có đúng tập field
  của response, kiểm trong `tests/unit/api-contract.test.ts` lúc `pnpm typecheck`.
- Lỗi ở error boundary được gửi về `/api/v1/system/health/client-errors` để ghi log mức ERROR ở BE.

## 7. Chuẩn hóa hệ thống xử lý lỗi (Error System)

### 7.1 Bộ trang lỗi toàn trang (Full-page Error Routes)

Mọi trang lỗi toàn cục phải tuân thủ layout tiêu chuẩn, giao diện trang nhã chuẩn Shadcn UI + Tailwind CSS, đầy đủ i18n và điều hướng thoát an toàn:

- **Lỗi 404 (Not Found)**:
  - Khai báo tại `app/[locale]/not-found.tsx` (sử dụng `NotFoundView` từ `@/modules/home/views/errors/not-found-view`) và `app/not-found.tsx` cấp gốc (cho đường dẫn không mang tiền tố locale).
  - Giao diện gồm: Logo hệ thống, Badge `404 · KHÔNG TÌM THẤY`, số `404` lớn phong cách mờ, icon minh họa `FileQuestion`, tiêu đề và mô tả thân thiện.
  - Cung cấp 2 lối điều hướng chính: nút **Về trang chủ** (`Home`) và nút **Quay lại trang trước** (`ArrowLeft`, `history.back()`), kèm các liên kết nhanh (Trang chủ, Thư viện, Đăng nhập).
- **Lỗi 403 (Forbidden - Truy cập bị từ chối)**:
  - Khai báo tại `shares/components/errors/forbidden-view.tsx`.
  - Hiển thị khi người dùng vào vùng quản trị hoặc xem tài nguyên không có quyền sở hữu/thẩm quyền.
  - Giao diện gồm: Badge `403 · TỪ CHỐI`, icon cảnh báo `ShieldAlert` (màu `destructive`), giải thích nguyên nhân rõ ràng.
  - Cung cấp nút **Về trang chủ**, **Quay lại**, và nút chuyển đổi **Đăng nhập tài khoản khác**.
- **Lỗi 500 (Server Error / Runtime Crash)**:
  - Khai báo tại `app/[locale]/error.tsx` (sử dụng `AppErrorView` từ `@/modules/home/views/errors/app-error-view`).
  - Giao diện gồm: Badge `500 · LỖI MÁY CHỦ`, icon `ServerCrash`, thông điệp an toàn không lộ lỗ hổng bảo mật.
  - Cung cấp nút **Thử lại ngay** (`retry()`) và nút **Về trang chủ**.
  - Hiển thị khối mã **Digest sự cố** kèm nút Sao chép để người dùng gửi cho bộ phận kỹ thuật; hiển thị chi tiết thông điệp kỹ thuật trong môi trường development.
  - Tự động báo cáo lỗi client về backend qua `useReportClientError(error)`.
- **Lỗi Global Error (Root Layout Crash)**:
  - Khai báo tại `app/global-error.tsx` (sử dụng `GlobalErrorView` từ `@/modules/home/views/errors/global-error-view`).
  - Tự dựng cấu trúc `<html>`/`<body>` độc lập, hỗ trợ dark mode tự nhiên, trình bày song ngữ (Việt - Anh), cung cấp nút **Thử lại** và **Tải lại trang**.

### 7.2 Khối báo lỗi trong trang (In-page Error States)

- **`ErrorState` (`shares/components/errors/error-state.tsx`)**: Dùng cho widget, section, bảng dữ liệu khi truy vấn thất bại. Sử dụng `Card` của Shadcn UI với token `destructive`, icon `AlertCircle` và nút **Thử lại**.
- **`QueryErrorState` (`shares/components/errors/query-error-state.tsx`)**: Phân loại tự động theo mã lỗi của `ApiError`:
  - `404 Not Found`: Hiển thị `SearchX` "Không tìm thấy bản ghi" + nút **Quay về danh sách** (tắt nút thử lại vô ích).
  - `403 Forbidden`: Hiển thị `ShieldAlert` "Truy cập bị từ chối" + thông báo quyền.
  - `Mất mạng / Timeout / Status 0`: Hiển thị `WifiOff` "Mất kết nối mạng" + nút **Thử kết nối lại**.
  - `500+ Server Error`: Hiển thị `ServerCrash` "Lỗi máy chủ" + nút **Thử lại**.
  - Các lỗi khác: Hiển thị thông báo đã dịch theo mã lỗi BE kèm nút **Thử lại**.

## 8. Kiểm tra giao diện sau khi sửa

- Với màn hình hoặc luồng đã sửa, tạo/cập nhật test liên quan cho các trạng thái và tương tác bị ảnh hưởng.
  Chạy đúng file Vitest/E2E liên quan; không chạy toàn bộ suite khi người dùng chưa yêu cầu (rule chung mục 7).
- Dùng skill `ui-ux` khi phân tích hoặc thiết kế UI, `web-design-guidelines` để rà accessibility/UX trên file
  đã sửa và `vercel-react-best-practices` khi viết/review React/Next.js. Sau khi dựng, dùng `playwright-cli`
  mở giao diện thật, chụp ảnh rồi xem lại để phát hiện lỗi bố cục; kiểm desktop, mobile 375px, bàn phím,
  console, network và các trạng thái loading/empty/error/success. Luồng quyền thì kiểm các vai trò liên quan.
- Nếu môi trường không mở được UI, ghi rõ phần chưa xác minh trong báo cáo; không nhận là đã kiểm giao diện.
  Skill hỗ trợ chỉ bổ sung góc nhìn, không thay thế quy tắc trong repo.
- Nếu thay đổi ảnh hưởng hiệu năng trang, dùng `vercel-react-best-practices` để rà mã và đo Network trên luồng
  bị ảnh hưởng (số request, kích thước tải, waterfall, trạng thái cache). Không khẳng định nhanh hơn chỉ từ
  cảm nhận hoặc từ số đo môi trường khác; giữ quy tắc API dữ liệu chạy ở Client của mục 1 và 5.
- Khi được yêu cầu audit tốc độ trang hoặc Core Web Vitals, dùng skill `web-perf` để đo trên URL/môi trường
  thực tế. Nếu không có công cụ trace, chỉ báo số liệu quan sát được và ghi rõ phép đo còn thiếu.
