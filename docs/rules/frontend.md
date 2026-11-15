# Rule frontend (Next.js 16)

Đọc trước: [common.md](common.md). Next.js 16 có thay đổi lớn: đọc `frontend/node_modules/next/dist/docs/`
trước khi dùng API mới (middleware → `src/proxy.ts`, error boundary dùng `retry`...).

## 1. Luồng xử lý (bắt buộc)

```
app/[locale]/.../page.tsx → modules/<m>/views → components/<c>/<c>.tsx (+ hooks/use-<c>.ts)
  → modules/<m>/hooks (React Query) → modules/<m>/services → shares/lib/api/api-client.ts
```

FE **không có lớp repository**: service của module gọi `apiClient` trực tiếp.

| Lớp | Được làm | Không được làm |
| --- | --- | --- |
| `page.tsx`, `layout.tsx` (`app/`) | `export const generateMetadata = createPageMetadata(...)`, `await params`, `setRequestLocale`, `<Suspense>`, render **đúng View/Layout của module** (ghép slot giữa module bằng prop) | Hook, state, gọi API, điều kiện, JSX bố cục/giao diện, component đặt trong `app/` (`_components`) |
| View (`modules/<m>/views`) | Ghép component của module, kiểm quyền (`usePermission`, `PermissionGate`) rồi truyền cờ quyền xuống | Gọi query/mutation, state, xử lý lỗi/loading, tính toán dữ liệu |
| Component | Nhận props, gọi hook riêng, render (kể cả loading/lỗi) | `fetch`, gọi service, state phức tạp trong file `.tsx` |
| Hook của component | State, sự kiện, form, ghép query/mutation | Gọi `apiClient`/service trực tiếp |
| Hook module (`hooks/`) | `useQuery`/`useMutation`, invalidate cache | JSX |
| Service (`services/`) | Gọi `apiClient`, chuẩn hóa dữ liệu gửi/nhận, quy tắc FE thuần (hàm không hook) | JSX, React hook, UI state |

UI primitive thuần (Button, Separator...) không cần hook riêng.

## 2. Cấu trúc module

```
src/modules/<m>/
  views/  components/<c>/{<c>.tsx, hooks/use-<c>.ts}  hooks/  services/<model>.service.ts
  constants/{routes,api-endpoints,query-keys,<m>-permissions}.ts
  schemas/  types/  messages/{vi,en}.json  navigation.ts
```

- **Service tách theo model của BE**, mỗi model một file và một object, tên trùng service BE:
  `iam/services/role.service.ts` ↔ `iam/services/role_service.py`, `user-role.service.ts` ↔
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
  `apiClient` cần để lấy CSRF và silent refresh; module `auth` dùng lại trong `AUTH_API_ENDPOINTS`.
- Module không có BE tương ứng: `manage-app` (khung quản trị: `AdminShell`, sidebar, màn chọn module,
  `constants/admin-navigation.ts`) và `home` (trang công khai, header, trang 404).

## 3. `shares/` dùng chung

`shares/` chỉ chứa thứ **không thuộc module nào** và **không import module**:

| Thư mục | Nội dung |
| --- | --- |
| `components/ui` | Primitive shadcn (thêm bằng `pnpm dlx shadcn@latest add <name>`) |
| `components/common` | Khối giao diện dùng lại, **mỗi component một thư mục** (xem dưới bảng) |
| `components/errors` | `ErrorState`, `QueryErrorState` (lỗi tải bản ghi: 404 → không tìm thấy + về danh sách), `ForbiddenView` |
| `components/layout` | `Logo`, `LanguageSwitcher`, `ThemeSwitcher` (không chứa route của module) |
| `components/providers` | Provider gốc của app |
| `lib/api` | `apiClient`, `ApiError`, chuyển case, CSRF, `session-paths` |
| `lib/seo.ts` | `buildAlternates`, `createPageMetadata` |
| `hooks/`, `config/`, `types/` | Hook, cấu hình, kiểu dùng chung |

**Cấu trúc `components/common`** (giống `components/` của module):

```
common/<tên>/
  <tên>.tsx              # component chính, tên file = tên thư mục (kebab-case)
  hooks/use-<tên>.ts     # hook riêng của component (nếu có); hook phụ đặt cùng thư mục hooks/
  components/<con>.tsx   # mảnh con chỉ component này dùng (nếu có)
  types.ts               # kiểu dùng chung trong thư mục (nếu có)
```

- Không đặt file component rời ở gốc `common/`, không có thư mục `common/hooks/` chung, không gom nhiều
  component vào một thư mục (mỗi picker một thư mục: `date-picker/`, `time-picker/`, `date-time-picker/`,
  `month-select/`). Import theo đường dẫn đầy đủ: `@/shares/components/common/page-header/page-header`.
- Class dùng chung của control nằm ở `common/form-control/form-control.styles.ts`.

| Nhóm | Component |
| --- | --- |
| Trang, trạng thái | `page-header`, `empty-state`, `loading-state`, `status-badge`, `confirm-dialog` |
| Bảng | `data-table` (gồm `components/`: toolbar, bulk bar, header cell, row actions, status switch), `data-pagination`, `filter-select` |
| Form | `form` (+ `hooks/use-form-extension`), `form-field`, `form-control`, `form-page`, `form-layout` (+ `components/form-section`, `form-actions`) |
| Ô nhập | `email-input`, `password-input`, `code-input`, `slug-input`, `number-input`, `money-input`, `color-input`, `tags-input`, `search-input` |
| Chọn | `select-field`, `multi-select`, `checkbox-field`, `radio-group-field`, `switch-field`, **`choice-list`**, **`choice-groups`** |
| Ngày giờ | `date-picker`, `time-picker`, `date-time-picker`, `month-select` |
| Khác | `file-upload-field`, `image-upload`, `tiptap-editor`, `tiptap-content`, `form-dialog`, `activity-timeline` |

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
- `ImageUpload` nhận callback `onChoose` và nhãn qua props để mở bộ chọn ảnh ngoài component;
  adapter/view của Attachment cung cấp thư viện và quyền. Common không import module hay gọi API.
- Soạn thảo nội dung dùng **một** editor: `TiptapEditor` (`shares/components/common/tiptap-editor/`, giá trị là
  Tiptap JSON); hiển thị dùng `TiptapContent` (static renderer, chạy được ở server). Không còn `RichTextEditor`,
  không lưu HTML tùy ý. Extension dùng chung khai trong `tiptap-editor/extensions.ts`; module thêm node riêng
  (ví dụ nút, banner của Custom Pages) qua prop `extensions`.
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
- Upload cơ bản dùng Input file + FieldError. Common nhận callback, adapter của module Attachment
  gọi API qua service/hook module; common không import module hoặc giữ endpoint của dự án tham khảo.
  Ảnh đơn dùng `AttachmentImageUpload` (adapter của `ImageUpload`): khung ảnh xem trước, Tải ảnh lên /
  Đổi ảnh / Gỡ ảnh; giá trị form là `UploadedFile | null`, gửi BE dạng `<field>Id`.
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
- Hộp xác nhận dùng `ConfirmDialog` (`shares/components/common/confirm-dialog/confirm-dialog.tsx`), không dùng `confirm()`.

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
- Nhóm Hệ thống: **Tài khoản → Người dùng, Phiên**; **Phân quyền → Vai trò, Quyền**. Phiên là nghiệp vụ
  Authentication, menu ghép vào Tài khoản ở `manage-app`; không chuyển service sang Account. Bảng Phiên có
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
- Module khác cắm phần của mình vào form của module nền qua slot `extensions` do page ghép (Account không
  import IAM). Slot gọi `useFormExtension(handler, dirty)`: `handler(record)` chạy sau khi lưu, `dirty` bật
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

- Không hardcode path API, route, query key: lấy từ `constants/` của module.
- Điều hướng: `Link`/`useRouter`/`redirect` từ `@/i18n/navigation` (không dùng `next/link`).
- Mọi text qua next-intl; message theo module; thêm khóa phải thêm đủ vi + en.
- Schema Zod là factory nhận hàm dịch (`createLoginSchema(t)`).
- Màu dùng token semantic (`bg-primary`, `text-muted-foreground`, `bg-canvas`); không hardcode màu.
- `PermissionGate`/`usePermission` chỉ để ẩn/hiện; backend luôn enforce.
- URL file/ảnh/icon từ API là URL tuyệt đối: dùng trực tiếp (`<img src={url}>`), không nối domain/basePath.
- Module FE theo đúng module BE (`account`, `iam`...), trừ `manage-app` và `home` chỉ có ở FE. Module nền không import module phụ thuộc nó;
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
  gộp lại, lọc theo quyền trong `/auth/me`.
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
- Lỗi ở error boundary được gửi về `/api/v1/health/client-errors` (log + Sentry khi bật).
