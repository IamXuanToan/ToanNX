# Rule frontend (Next.js 16)

Đọc trước: [common.md](common.md). Next.js 16 có thay đổi lớn: đọc `frontend/node_modules/next/dist/docs/`
trước khi dùng API mới (middleware → `src/proxy.ts`, error boundary dùng `retry`...).

## 1. Luồng xử lý (bắt buộc)

```
app/[locale]/.../page.tsx → modules/<m>/views → components/<c>.tsx (+ components/hooks/use-<c>.ts)
  → modules/<m>/hooks (React Query) → modules/<m>/services → shares/lib/api/api-client.ts
```

FE **không có lớp repository**: service của module gọi `apiClient` trực tiếp.

| Lớp | Được làm | Không được làm |
| --- | --- | --- |
| `page.tsx`, `layout.tsx` (`app/`) | `export const generateMetadata = createPageMetadata(...)`, `await params` (khi cần), `<Suspense>`, render **đúng View/Layout của module** (ghép slot giữa module bằng prop) | Hook, state, gọi API, điều kiện, JSX bố cục/giao diện, component đặt trong `app/` (`_components`), gọi `setRequestLocale` (Next.js 16 dùng `next/root-params` trong `src/i18n/request.ts`) |
| View (`modules/<m>/views`) | Ghép component của module, kiểm quyền (`usePermission`, `PermissionGate`) rồi truyền cờ quyền xuống | Gọi query/mutation, state, xử lý lỗi/loading, tính toán dữ liệu |
| Component | Nhận props, gọi hook riêng, render (kể cả loading/lỗi) | `fetch`, gọi service, state phức tạp trong file `.tsx` |
| Hook của component | State, sự kiện, form, ghép query/mutation | Gọi `apiClient`/service trực tiếp |
| Hook module (`hooks/`) | `useQuery`/`useMutation`, invalidate cache | JSX |
| Service (`services/`) | Gọi `apiClient`, chuẩn hóa dữ liệu gửi/nhận, quy tắc FE thuần (hàm không hook) | JSX, React hook, UI state |

UI primitive thuần (Button, Separator...) không cần hook riêng.

## 2. Cấu trúc module

```
src/modules/<m>/
  views/  components/*.tsx  components/hooks/use-*.ts  hooks/use-<tên>.ts
  permissions/<model>-permission.ts  services/<model>.service.ts
  constants/{routes,api-endpoints,query-keys}.ts
  schemas/  types/  messages/{vi,en}.json  navigation.ts
```

- **Mỗi model một file quyền trong `permissions/`**, đặt tên `permissions/<model>-permission.ts` (khớp với
  phân quyền backend), ví dụ: `author-permission.ts`, `chapter-permission.ts`, `novel-permission.ts`. Không
  gộp chung quyền của nhiều model vào một file constants.
- **Mỗi hook một file trong `hooks/`**, đặt tên `hooks/use-<tên-hành-động>.ts` (ví dụ `use-client-novel.ts`,
  `use-toggle-favorite.ts`, `use-import-novel.ts`). Tuyệt đối không gom nhiều hook vào một file `use-<m>.ts`.
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
  - `api-endpoints.ts`: `<M>_API_ENDPOINTS`, path tương đối với `env.apiBasePath`.
  - `query-keys.ts`: `<m>Keys` dựng bằng `createResourceKeys` (`all`, `lists`, `list(params)`, `detail(id)`,
    `history(id)`), thêm key riêng nếu cần.
  - Module khác cần route/key thì import từ `@/modules/<khác>/constants/...` (ví dụ invalidate `authKeys.me()`).
- Ngoại lệ duy nhất ở `shares/`: `shares/lib/api/session-paths.ts` (CSRF, login, refresh, logout) vì chính
  `apiClient` cần để lấy CSRF và silent refresh; module `system` dùng lại trong `SYSTEM_API_ENDPOINTS`.
- Module không có BE tương ứng: `manage-app` (khung quản trị: `AdminShell`, sidebar, màn chọn module,
  `constants/admin-navigation.ts`) và `home` (trang công khai, header, trang 404).

## 3. `shares/` dùng chung

`shares/` chỉ chứa thứ **không thuộc module nào** và **không import module**:

| Thư mục | Nội dung |
| --- | --- |
| `components/ui` | Primitive shadcn (thêm bằng `pnpm dlx shadcn@latest add <name>`) |
| `components/common` | Khối giao diện dùng lại đặt trực tiếp ở gốc `common/`, hook trong `common/hooks/` |
| `components/errors` | `ErrorState`, `QueryErrorState` (lỗi tải bản ghi: 404 → không tìm thấy + về danh sách), `ForbiddenView` |
| `components/layout` | `Logo`, `LanguageSwitcher`, `ThemeSwitcher` (không chứa route của module) |
| `components/providers` | Provider gốc của app |
| `lib/api` | `apiClient`, `ApiError`, chuyển case, CSRF, `session-paths` |
| `lib/seo.ts` | `buildAlternates`, `createPageMetadata` |
| `hooks/`, `config/`, `types/` | Hook, cấu hình, kiểu dùng chung |

**Cấu trúc `components/common`** (giống `components/` của module):

```
common/
  <tên>.tsx              # component, đặt trực tiếp ở gốc common/ (kebab-case)
  <tên>.types.ts         # kiểu dùng chung của component phức tạp (data-table.types.ts, choice-list.types.ts...)
  hooks/use-<tên>.ts     # hook riêng của component, tập trung tại common/hooks/
```

- Không tạo mỗi component một thư mục con riêng lẻ; mọi component đặt trực tiếp trong `common/`, hook của component nằm trong `common/hooks/`.
- Import theo đường dẫn đầy đủ tới file (tận gốc, không magic/barrel): `@/shares/components/common/page-header`, `@/shares/components/common/hooks/use-data-table`.
- Class dùng chung của control nằm ở `common/form-control.styles.ts`.

| Nhóm | Component |
| --- | --- |
| Trang, trạng thái | `page-header`, `empty-state`, `loading-state`, `status-badge`, `confirm-dialog` |
| Bảng | `data-table` (gồm `components/`: toolbar, bulk bar, header cell, row actions, status switch), `data-pagination`, `filter-select` |
| Form | `form` (+ `hooks/use-form-extension`), `form-field`, `form-control`, `form-page`, `form-layout` (+ `components/form-section`, `form-actions`) |
| Ô nhập | `email-input`, `password-input`, `code-input`, `slug-input`, `number-input`, `money-input`, `color-input`, `tags-input`, `search-input` |
| Chọn | `select-field`, `multi-select`, `checkbox-field`, `radio-group-field`, `switch-field`, **`choice-list`**, **`choice-groups`** |
| Ngày giờ | `date-picker`, `time-picker`, `date-time-picker`, `month-select` |
| Khác | `image-upload`, `tiptap-editor`, `tiptap-content`, `form-dialog`, `activity-timeline` |

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

| Phần | Có sẵn trong `DataTable` | Module truyền gì |
| --- | --- | --- |
| Toolbar | Ô tìm (trái), bộ lọc, control thêm, nút **Tải lại**, menu **Cột hiển thị** (nhớ theo `tableId`) | `search`, `filters`, `onClearFilters`, `toolbar`, `onReload` |
| Cột chọn | Checkbox mỗi dòng + checkbox tiêu đề (chọn cả trang, trạng thái một phần) | Tự hiện khi có thao tác hàng loạt; `canSelectRow` để chặn dòng (chính mình, bản ghi hệ thống) |
| Cột `#` | Số thứ tự theo trang | `showIndex={false}` để tắt |
| Sắp xếp | Tiêu đề cột bấm xoay vòng tăng → giảm → bỏ, `aria-sort` | `sortKey` (trường `ordering` của BE) trên cột, `ordering` + `onOrderingChange` |
| Cột Thao tác | Sửa, Sao chép, Xoá (hỏi xác nhận), rồi thao tác riêng của bảng (nút chỉ icon + tooltip, ví dụ **Thu hồi** phiên); Thêm nằm trên toolbar. Xem chi tiết bằng link ở tên bản ghi | `onEdit`, `onCopy`, `onDelete` + `canDeleteRow`; `rowActions` (`key`, `label`, `icon`, `onClick`, `hidden`, `destructive`) |
| Cột Trạng thái | Bật/tắt (khoá/mở, kích hoạt) là **chỉ một công tắc**, không kèm chữ "Hoạt động" bên cạnh; nhãn trạng thái ở tooltip + `aria-label`. Không có quyền thì chỉ badge | `TableStatusSwitch` (`onCheckedChange` chỉ truyền khi có quyền); bật/tắt không đặt trong cột Thao tác |
| Ghim cột | Menu tiêu đề: Ghim trái / Ghim phải / Bỏ ghim, sticky theo bề rộng thực | `enablePinning`; cấu hình lưu riêng theo `tableId`, an toàn SSR, có dự phòng khi storage bị chặn |
| Đổi độ rộng | Kéo mép tiêu đề (cột ghim phải kéo mép trái) hoặc dùng phím ←/→ (Shift để chỉnh nhanh), Home/End giới hạn; nhấp đúp trả độ rộng tự nhiên. Menu Cột hiển thị có Khôi phục độ rộng cột | Mặc định bật cho cột dữ liệu; `enableResizing`, `minWidth`, `maxWidth`; lưu riêng theo `tableId`. Cột chọn, `#`, Thao tác giữ kích thước tự động; card mobile không nhận độ rộng desktop |
| Hàng loạt | Thanh thay chỗ toolbar khi có dòng chọn, **nền trắng có viền như toolbar** (không tô cả dải màu, chỉ chip "Đã chọn n" mang màu nhấn), Bỏ chọn, **Đổi trạng thái**, thao tác riêng, **Xoá (n)** có xác nhận; xong thì bỏ chọn | `bulkStatus` (`options`, `onChange`), `bulkActions` (`destructive`, `confirm` để hỏi xác nhận), `onBulkDelete` |
| Trạng thái | Khung chờ, làm mờ khi tải lại, lỗi + thử lại, rỗng (`EmptyState`: cao tối thiểu 320px, icon trong hai vòng nền nhạt, tiêu đề, mô tả, một lối ra), rỗng do tìm kiếm + **Xoá tìm kiếm** | `isLoading`, `isFetching`, `error`, `empty` |
| Phân trang | "1–20 trong 132", số dòng mỗi trang (10/20/50/100), "Trang x/y", ‹, ô nhập trang (Enter), › | `pagination` (`value`, `onPageChange`, `onPageSizeChange`) |
| Mobile | Dưới `md` mỗi dòng là một card: checkbox góc trái, cột `mobile: "title"` ở đầu, thao tác góc phải, cột còn lại là hàng "nhãn — giá trị" | `mobile: "title"` (đúng một cột) / `"hidden"` |

- Cột khai bằng `DataTableColumn<T>[]`: `header` (chuỗi), `cell`, `sortKey`, `align: "end"` cho cột số,
  `hideBelow` cho cột phụ ở khung vừa, `enableHiding: false` cho cột luôn hiện. Giá trị trống ghi `—`.
- Quyền quyết định thao tác nào có: **view** kiểm quyền (`usePermission`) rồi truyền `canUpdate`/`canDelete`
  xuống component bảng; component chỉ truyền callback sửa/xóa/sao chép/đổi trạng thái khi có quyền.
- Mutation xoá / hàng loạt nằm ở hook module (`useDeleteUser`, `useBulkSetUsersActive`, `useBulkDeleteUsers`):
  toast theo số bản ghi, invalidate cache, lỗi thì toast thông báo đã dịch. Backend chạy cả lô trong một
  transaction nên lỗi một dòng thì không dòng nào đổi.
- Cột đầu là link tới trang chi tiết (`font-medium`, hover gạch chân); dòng phụ (email, mã) `text-xs text-muted-foreground`.
- Hộp xác nhận dùng `ConfirmDialog` (`shares/components/common/confirm-dialog`), không dùng `confirm()`.

**State bảng.** Hook của component bảng dùng `useTableState` (`shares/hooks/use-table-state.ts`), không tự viết
`useState` cho từ khóa/trang/sắp xếp. State đồng bộ lên URL (`search`, `page`, `pageSize`, `ordering`; giá trị
mặc định không ghi) nên tải lại hay gửi link vẫn giữ nguyên. Đổi từ khóa, sắp xếp, số dòng thì về trang 1.

- Ô tìm giữ bản đang gõ riêng, **chỉ áp dụng khi nhấn Enter** (bỏ qua Enter trong IME). Không debounce,
  không tìm theo từng ký tự. Nút xóa áp dụng ngay từ khóa rỗng.
- Bộ lọc riêng khai trong `useTableState({ filterKeys: [...] })`; đọc/ghi bằng `getFilterValues(key)` /
  `setFilterValues(key, values)` (URL lưu `a,b`), lọc giá trị lạ bằng `pickAllowedValues`, xoá bằng
  `clearFilters`; không tự giữ state thứ hai. Đổi bộ lọc về trang 1 và giữ các tham số còn lại trên URL.
  Truyền `onClearFilters={table.hasFilters ? table.clearFilters : undefined}` cho bảng.
- Danh sách dùng làm danh mục/ô chọn phải tải đủ các trang API, không chỉ lấy trang đầu hoặc cắt ở 100.

## 3.2 Chuẩn hình ảnh (Next.js Image) và Shadcn UI (bắt buộc)

**Tối ưu hình ảnh với `next/image`.**
- Mọi hình ảnh hiển thị trong project **bắt buộc sử dụng component `<Image />` từ `next/image`** để tự động tối ưu hóa định dạng hiện đại (WebP, AVIF), responsive srcset, lazy loading và chống layout shift (CLS).
- **Tuyệt đối không dùng thẻ `<img>` trần** hoặc viết chú thích tắt cảnh báo eslint `// eslint-disable-next-line @next/next/no-img-element`.
- Cấu hình domains/remotePatterns tập trung tại `frontend/next.config.ts` (hỗ trợ `media.toannx.com`, Cloudflare R2 `**.r2.dev`, và `localhost`/`127.0.0.1`).
- Với khung chứa linh hoạt theo tỷ lệ (aspect-square, avatar, preview), container cha đặt `relative`, thẻ `<Image />` sử dụng `fill`, `className="object-cover"` (hoặc `object-contain`), và khai báo prop `sizes` phù hợp (ví dụ `sizes="80px"` hoặc `sizes="(max-width: 768px) 100vw, 33vw"`).
- Khi ảnh là chuỗi data URI (`data:image/...`) hoặc blob URL cục bộ từ browser: thêm prop `unoptimized`.

**Sử dụng triệt để primitives của Shadcn UI.**
- Mọi thành phần tương tác và cấu trúc giao diện cơ bản (`Button`, `Checkbox`, `RadioGroup`, `Label`, `Input`, `Textarea`, `Dialog`, `Card`, `Tooltip`, `Badge`, `Avatar`, `Switch`, `Sheet`, `Popover`, `Select`, `Table`, `Tabs`, `Separator`...) **bắt buộc dùng component trong `@/shares/components/ui/*`**.
- Khi cần một component primitive mà thư mục `@/shares/components/ui/` chưa có: **bắt buộc chạy lệnh `pnpm dlx shadcn@latest add <tên-component>`** để cài đặt chuẩn từ thư viện shadcn, không tự viết component thủ công để thay thế.
- **Nghiêm cấm lồng lộn thẻ HTML sai ngữ nghĩa**: Tuyệt đối không bọc `<Checkbox />` hay `<Button />` (vốn là thẻ `<button>` của Radix) bên trong thẻ `<label>` để tự vẽ giả lập checkbox/nút bấm (vi phạm chuẩn HTML, gây lặp sự kiện click và phá vỡ trợ năng).
- **Nghiêm cấm viết thẻ `<button>` trần** kèm class CSS tự chế khi đã có component `Button` chuẩn của shadcn.
- Các item dạng card trong lưới (như media file, thẻ danh sách) phải sử dụng component `Card` của shadcn để đồng nhất border, background và shadow theo design system.

**Quy chuẩn Tên tệp trong Thư viện (Attachment).**
- Trường `original_name` của tệp (mặc định lấy theo tên file người dùng tải lên) **bắt buộc phải cho phép chỉnh sửa/đổi tên được** (Rename) cả ở tầng Backend (API PATCH nhận `original_name`) và Frontend (nút đổi tên nhanh trên card lưới và trong panel chi tiết), kèm thuộc tính `alt_text` cho hình ảnh để phục vụ SEO và accessibility.
- Nhóm Hệ thống có một module `system`, menu theo thứ tự: Người dùng, Phiên, Vai trò, Quyền, Thư viện,
  Nhật ký (`modules/system/navigation.ts`). Bảng Phiên có
  chọn dòng, `#`, mã phiên, **Thu hồi** trong cột Thao tác và thu hồi hàng loạt (hỏi xác nhận). Danh mục
  Quyền chỉ đọc; có tìm/lọc nhiều module; không có link chi tiết hay nút CRUD.
- Người dùng có cột **Hoạt động gần nhất** (`lastSeenAt`, chấm xanh "Đang trực tuyến" khi trong 5 phút —
  `isOnline` ở `shares/lib/presence.ts`) và **Đăng nhập gần nhất** (`lastLogin`); trang chi tiết có card Hoạt động.

```ts
export function useUserTable() {
  const table = useTableState({ ordering: "-created_at" }); // filters { search, ordering, page, pageSize }
  const query = useUsers(table.filters); // useQuery với placeholderData: keepPreviousData
  const remove = useDeleteUser();
  return { query, table, remove: (user: User) => remove.mutateAsync(user.id) /* … */ };
}
```

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

| Dữ liệu | Component | Cấu hình |
| --- | --- | --- |
| Danh sách phẳng, ít mục, đọc từ trên xuống (vai trò của người dùng, cờ truy cập, trạng thái) | `ChoiceList` (`common/choice-list`) | `layout="list"`; `control="checkbox"` để chọn nhiều, `"switch"` cho cờ bật/tắt, `"none"` chỉ xem |
| Nhiều mục chia nhóm (quyền theo module) | `ChoiceGroups` (`common/choice-groups`) | accordion mỗi nhóm (mặc định mở, Mở/Thu gọn tất cả), đầu nhóm "đã chọn/tổng", Chọn cả nhóm; mục là `ChoiceList layout="grid"` (card nhỏ 1/2/3 cột) |

- Danh sách từ 8 mục trở lên tự có ô tìm (lọc ngay, bỏ dấu, theo nhãn/mã/mô tả) — `ChoiceList searchable`,
  ngưỡng `CHOICE_SEARCHABLE_THRESHOLD`, như `SelectField`/`FilterSelect`.
- Kiểu công tắc (`switch`) không tô nền dòng đang bật (công tắc đã nói trạng thái); chỉ kiểu checkbox tô mục
  đã chọn. Mỗi mục có `relative` để input ẩn của Radix không tràn khỏi khung cuộn (từng làm trang dài thêm
  khoảng trắng).
- Mục là `ChoiceItem` (`value`, `label`, `code` mono, `description`, `badge`, `disabled`); mục đã chọn tô
  nền nhấn nhạt, bấm cả dòng/card để đổi, control nằm bên phải.
- Module chỉ **đổi dữ liệu sang `ChoiceItem`/`ChoiceGroup`** bằng hook của module (IAM:
  `usePermissionChoiceGroups`, `useRoleChoiceItems` trong `iam/hooks/use-permission-choice-groups.ts`) rồi
  render component chung. Trang Quyền (chỉ xem), form vai trò (chọn quyền), form người dùng (chọn vai
  trò) đều theo bảng trên; thêm loại dữ liệu mới thì viết hook đổi dữ liệu, không dựng UI riêng.

**Câu chữ.** Không viết câu giới thiệu, chính sách hay khẩu hiệu dưới tiêu đề, kiểu "Dành cho tài khoản do
quản trị viên cấp.", "TOANNX không mở đăng ký công khai.", "Tài khoản chỉ do quản trị viên tạo.",
"Chọn một module để bắt đầu làm việc.". `PageHeader` mặc định chỉ có tiêu đề (+ nút); `description` chỉ khi
là dữ liệu của bản ghi (mã vai trò). Câu phụ chỉ được đặt ở field khi nói **hậu quả của thao tác**
("Đổi mật khẩu sẽ đăng xuất mọi phiên của người dùng.") hoặc định dạng cần nhập.

## 4. Quy ước

- Đa ngôn ngữ: Next.js 16 tự nhận diện locale qua `next/root-params` trong `src/i18n/request.ts`; **không** gọi `setRequestLocale` (deprecated) trong `page.tsx` hay `layout.tsx`.
- Không hardcode path API, route, query key: lấy từ `constants/` của module.
- Điều hướng: `Link`/`useRouter`/`redirect` từ `@/i18n/navigation` (không dùng `next/link`).
- Mọi text qua next-intl; message theo module; thêm khóa phải thêm đủ vi + en.
- Schema Zod là factory nhận hàm dịch (`createLoginSchema(t)`).
- Màu dùng token semantic (`bg-primary`, `text-muted-foreground`, `bg-canvas`); không hardcode màu.
- `PermissionGate`/`usePermission` chỉ để ẩn/hiện; backend luôn enforce.

### 4.0 Thương hiệu: màu, logo, favicon (bắt buộc)

**Màu thương hiệu xanh lá** (theo logo cỏ bốn lá). Mọi màu nhấn đi qua token trong `src/app/globals.css`,
khai ở cả `:root` và `.dark`; không viết cứng mã màu hay class màu Tailwind (`violet-600`, `sky-500`…) trong
component. Vai trò từng màu (đã đo tương phản WCAG AA):

| Token | Light | Dark | Dùng cho |
| --- | --- | --- | --- |
| `--primary` | `#3D812E` (chữ trắng 4.8:1) | `oklch(0.72 0.15 135)` + chữ `--primary-foreground` tối | Nút chính, link, mục đang chọn, sidebar đang chọn |
| `--primary-hover` | `#206A2D` (6.6:1) | `oklch(0.78 0.15 135)` | Hover/nhấn của nút chính (`hover:bg-primary-hover`) |
| `--ring` | `#569533` | `oklch(0.62 0.14 136)` | Vòng focus, điểm nhấn trang trí (vầng sáng, chấm) |
| `--primary-light` | `oklch(0.98 0.018 138)` | primary 16% | Nền badge/ô chọn; chữ trên đó dùng `text-primary` (≥ 4.5:1) |
| `--chart-1…5` | dải xanh lá từ ba màu trên | bản sáng | Biểu đồ một sắc |

- `#569533` chỉ đạt 3.7:1 với chữ trắng: **không** dùng làm nền nút có chữ, chỉ làm focus/trang trí.
- Nền trung tính (`--canvas`, `--item-hover`, `--surface-hover`) pha nhẹ sắc xanh (hue 140), không pha sắc khác.
- `--success` là xanh ngọc (hue 175) để khác nút chính; số liệu không tô màu nhấn (tránh bị đọc là "tốt").
  `--destructive` giữ đỏ, `--warning` giữ hổ phách.
- Ở dark mode màu nhấn chỉ làm nền; đường mảnh (viền focus, gạch chân) dùng `--ring` hoặc giảm độ đục.
- Email HTML (backend `templates/system/email`) không đọc được CSS biến: dùng đúng mã hex của bảng trên
  (nút `#3D812E`, link `#206A2D`).

**Logo và favicon** chỉ có một nguồn: `public/brand/logo.png` (PNG nền trong suốt). Mọi kích thước sinh bằng
`uv run --project backend python scripts/build_brand_assets.py` (cắt sát, chừa lề, thu nhỏ), không sửa tay:
`public/brand/logo-mark.png` (giao diện), `src/app/icon.png`, `src/app/favicon.ico`, `src/app/apple-icon.png`
(Next.js tự gắn thẻ `<link>`). Đổi logo = thay `logo.png` rồi chạy lại script. Giao diện chỉ hiển thị logo qua
`LogoMark`/`Logo` (`shares/components/layout/logo.tsx`, dùng `next/image`), không tự đặt `<Image src="/brand/…">`
hay vẽ SVG logo riêng.
- URL file/ảnh/icon từ API là URL tuyệt đối: dùng trực tiếp (`<img src={url}>`), không nối domain/basePath.
- Module FE theo đúng module BE (`system`, `novel`, `utilities`), trừ `manage-app` và `home` chỉ có ở FE. Module nền không import module phụ thuộc nó;
  page ghép giao diện nhiều module qua prop slot (ví dụ `UserDetailView aside={<UserRolesCard />}`,
  `history={<RecordHistoryView … />}`, `editorPlugins={<QrCodeTiptapPlugin />}`).
- Tạo/sửa nhanh tài nguyên liên quan ngay trong form khác dùng `FormDialog` bọc đúng form của tài nguyên đó
  (ví dụ tạo đường dẫn trang trong form trang); không viết form thứ hai.
- `tests/unit/module-registry.test.ts` kiểm mỗi module đã ghép đủ routing, messages, `global.d.ts`, navigation và
  không import ngang module ngoài slot cho phép.
- Key kỹ thuật (cookie, storage, query key...) không mang tên dự án ([common.md](common.md) mục 3).
- Không barrel `index.ts`; thứ tự import: React/Next → thư viện → `@/shares` → module khác → tương đối.
- Exported function/hook/component có JSDoc tiếng Việt.

## 4.1 Khung quản trị

- Khung nằm ở `modules/manage-app/components/admin-shell`; `app/[locale]/(admin)/admin/layout.tsx` chỉ render nó.
- `/admin` (`/vi/quan-tri`) là **màn chọn module**: mỗi thẻ là một nhóm. Danh sách **khai tĩnh ở FE**, không
  có API hay bảng cấu hình module: mỗi module khai `group`, `icon` (component lucide), `items` trong
  `navigation.ts`; `ADMIN_MODULE_NAVIGATION` + `ADMIN_GROUPS` (`modules/manage-app/constants/admin-navigation.ts`)
  gộp lại, lọc theo quyền trong `/system/auth/me`.
- Trong một nhóm: sidebar của nhóm (đầu là bộ chuyển nhóm, thân chia mục theo module, chân là tài khoản),
  nội dung bên phải. Breadcrumb trên header chỉ ghi các cấp cha; tên trang là `<h1>` trong `PageHeader`.
- Nhóm hiển thị khai ở `ADMIN_GROUPS`; tên/mô tả ở `common.adminGroups.<group>`, tên module ở
  `common.adminModules.<module>`.
- Trang đọc danh sách nhóm qua `useAdminGroups()` (context do khung cung cấp), không import `navigation.ts`
  của module khác.
- Giao diện theo [DESIGN.md](../../DESIGN.md) (bộ mặt Clean): header và đầu sidebar `h-16`, mục menu
  `h-10 rounded-xl`, đang chọn `bg-primary-light text-primary`.

## 5. Auth & API

- Gọi API cùng origin `/api/v1/*` (Next rewrite sang Django); cookie HttpOnly, không lưu token ở JS.
- `apiClient` tự gắn CSRF, request id, chuyển case, silent refresh single-flight; không tự viết lại.
- Logout/đổi quyền: xóa/invalidate cache React Query.

## 6. Test

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
```

- Unit (Vitest): `tests/unit`. E2E (Playwright): `tests/e2e`, chạy trên server thật với database riêng
  `toannx_e2e` (BE 8001, FE 3001 build vào `.next-e2e`), không đụng dữ liệu dev.
- Kiểu dữ liệu: `pnpm api:types` sinh `shares/types/api-schema.gen.ts` từ OpenAPI (không sửa tay; CI đỏ nếu
  cũ). `ApiModel<"…Response">` là kiểu FE nhận được (đã camelCase). Kiểu viết tay phải có đúng tập field
  của response, kiểm trong `tests/unit/api-contract.test.ts` lúc `pnpm typecheck`.
- Lỗi ở error boundary được gửi về `/api/v1/system/health/client-errors` (log + Sentry khi bật).

## 7. Chuẩn hóa hệ thống xử lý lỗi (Error System)

### 7.1 Bộ trang lỗi toàn trang (Full-page Error Routes)
Mọi trang lỗi toàn cục phải tuân thủ layout tiêu chuẩn, giao diện trang nhã chuẩn Shadcn UI + Tailwind CSS, đầy đủ i18n và điều hướng thoát an toàn:

- **Lỗi 404 (Not Found)**:
  - Khai báo tại `app/[locale]/not-found.tsx` (sử dụng `NotFoundView` từ `@/modules/home/views/not-found-view`) và `app/not-found.tsx` cấp gốc (cho đường dẫn không mang tiền tố locale).
  - Giao diện gồm: Logo hệ thống, Badge `404 · KHÔNG TÌM THẤY`, số `404` lớn phong cách mờ, icon minh họa `FileQuestion`, tiêu đề và mô tả thân thiện.
  - Cung cấp 2 lối điều hướng chính: nút **Về trang chủ** (`Home`) và nút **Quay lại trang trước** (`ArrowLeft`, `history.back()`), kèm các liên kết nhanh (Trang chủ, Thư viện, Đăng nhập).
- **Lỗi 403 (Forbidden - Truy cập bị từ chối)**:
  - Khai báo tại `shares/components/errors/forbidden-view.tsx`.
  - Hiển thị khi người dùng vào vùng quản trị hoặc xem tài nguyên không có quyền sở hữu/thẩm quyền.
  - Giao diện gồm: Badge `403 · TỪ CHỐI`, icon cảnh báo `ShieldAlert` (màu `destructive`), giải thích nguyên nhân rõ ràng.
  - Cung cấp nút **Về trang chủ**, **Quay lại**, và nút chuyển đổi **Đăng nhập tài khoản khác**.
- **Lỗi 500 (Server Error / Runtime Crash)**:
  - Khai báo tại `app/[locale]/error.tsx` (sử dụng `AppErrorView` từ `@/modules/home/views/app-error-view`).
  - Giao diện gồm: Badge `500 · LỖI MÁY CHỦ`, icon `ServerCrash`, thông điệp an toàn không lộ lỗ hổng bảo mật.
  - Cung cấp nút **Thử lại ngay** (`retry()`) và nút **Về trang chủ**.
  - Hiển thị khối mã **Digest sự cố** kèm nút Sao chép để người dùng gửi cho bộ phận kỹ thuật; hiển thị chi tiết thông điệp kỹ thuật trong môi trường development.
  - Tự động báo cáo lỗi client về backend qua `useReportClientError(error)`.
- **Lỗi Global Error (Root Layout Crash)**:
  - Khai báo tại `app/global-error.tsx` (sử dụng `GlobalErrorView` từ `@/modules/home/views/global-error-view`).
  - Tự dựng cấu trúc `<html>`/`<body>` độc lập, hỗ trợ dark mode tự nhiên, trình bày song ngữ (Việt - Anh), cung cấp nút **Thử lại** và **Tải lại trang**.

### 7.2 Khối báo lỗi trong trang (In-page Error States)
- **`ErrorState` (`shares/components/errors/error-state.tsx`)**: Dùng cho widget, section, bảng dữ liệu khi truy vấn thất bại. Sử dụng `Card` của Shadcn UI với token `destructive`, icon `AlertCircle` và nút **Thử lại**.
- **`QueryErrorState` (`shares/components/errors/query-error-state.tsx`)**: Phân loại tự động theo mã lỗi của `ApiError`:
  - `404 Not Found`: Hiển thị `SearchX` "Không tìm thấy bản ghi" + nút **Quay về danh sách** (tắt nút thử lại vô ích).
  - `403 Forbidden`: Hiển thị `ShieldAlert` "Truy cập bị từ chối" + thông báo quyền.
  - `Mất mạng / Timeout / Status 0`: Hiển thị `WifiOff` "Mất kết nối mạng" + nút **Thử kết nối lại**.
  - `500+ Server Error`: Hiển thị `ServerCrash` "Lỗi máy chủ" + nút **Thử lại**.
  - Các lỗi khác: Hiển thị thông báo đã dịch theo mã lỗi BE kèm nút **Thử lại**.
