# Kế hoạch: chuẩn hóa quyền thành viên, ẩn/khóa theo quyền, cột Thao tác, sidebar, Web Push, tài liệu

Ngày lập: 2026-11-22. Trạng thái: **đã thực hiện** (2026-11-22) theo các phương án đề xuất ở mục 9
(`MEMBER` trong class quyền; Xem = chỉ xem, Sửa = `?mode=edit`; nút mờ + tooltip; popup khi tab không focus;
thư mục `docs/features/`). Còn tồn: trang sửa tỷ giá ở FE (đang là ngoại lệ cột Thao tác).

## 0. Hiện trạng đã kiểm

### 0.1 Quyền thành viên (`member_permissions`)

- Phạm vi dữ liệu **không** nằm ở vai trò mà nằm ở quyền `manage_all`: `CoreCrudService.get_queryset_for` /
  `can_access` lọc theo `owner_field` khi actor **không** có `<module>.<resource>.manage_all`.
- `<MODULE>_MEMBER` (sinh trong `role_seed_service.py`) chỉ là một tập con của `permissions` (đọc/tạo/sửa/xóa),
  không có `manage_all` → tự động chỉ thao tác bản ghi mình tạo. `_MANAGER` có cả `manage_all`.
- Cách hiểu của bạn là đúng với code hiện tại: "member" = các quyền thao tác bình thường, phạm vi "của mình" đến từ
  việc thiếu `manage_all`. **Không cần đổi logic phân quyền**, chỉ đổi cách khai báo.
- Chỗ chưa ổn: `member_permissions` khai bằng **chuỗi + fnmatch** (`"system.push_device.*"`) trong `module.py`, tách
  rời class `XxxPermission`. Gõ sai mã chỉ lộ khi chạy `validate()`, đổi tên quyền phải sửa hai nơi, IDE không tìm được
  tham chiếu.

### 0.2 Frontend: ẩn menu / khóa thao tác

- Sidebar lọc mục theo `item.permission` (`use-admin-shell.ts`); module/nhóm không còn mục nào thì ẩn. Đã đúng.
- Trang list/detail phần lớn có `ForbiddenView` + `canUpdate → disabled`. Còn lệch:
  - Detail **không** kiểm quyền đọc (chỉ dựa vào API 403): `user-detail-view`, `role-detail-view`,
    `page-detail-view`, `page-path-detail-view`, `qr-code-detail-view`, `short-link-detail-view`.
  - `journal-entry-detail-view` không truyền trạng thái chỉ đọc (đúng vì nhật ký chỉ đọc, cần ghi rõ là ngoại lệ).
- File quyền FE không khớp 1-1 với BE: `currency-permission.ts` gộp `exchange_rate`, `notification-permission.ts`
  gộp `announcement`/`notification_delivery`; thiếu file cho `telegram_bot`, `telegram_chat`, `push_device`,
  `notification_preference`.

### 0.3 Cột Thao tác của bảng

- `TableRowActions` chỉ có Sửa / Sao chép / Xóa, **không có Xem**. Mọi bảng truyền `onEdit={canUpdate ? … : undefined}`
  → thiếu quyền thì nút **biến mất**, cột trông khác nhau giữa các người dùng.

### 0.4 Sidebar

- Mỗi module là một danh sách phẳng. System có 13 mục liền nhau (người dùng, phiên, vai trò, quyền, thư viện, cài
  đặt, thông báo, thông báo chung, tiền tệ, tỷ giá, webhook, callback, nhật ký) nên khó tìm.
- Thu gọn (dải icon 64px): nhãn module mờ đi thành gạch ngắn, chỉ còn icon có tooltip; 13 icon liền nhau không phân
  biệt được cụm.
- Vi phạm rule: `module-sidebar.tsx` chứa 2 component (`SidebarModuleGroup` + `ModuleSidebar`).

### 0.5 Web Push

- `public/notification-sw.js` chỉ hiện popup hệ điều hành khi **không có tab nào `visibilityState === "visible"`**.
  Trình duyệt mở nhưng nằm sau cửa sổ khác thì tab vẫn "visible" → chỉ có toast Sonner trong trang, không có popup
  nổi. Vì vậy bạn không thấy thông báo nổi ra ngoài như Facebook.
- BE (`fcm_client.py`) gửi tin data-only + `Urgency: high`, không cần sửa.

### 0.6 Tài liệu

- `docs/` đang phẳng, lẫn kiến trúc (`architecture.md`), hướng dẫn cài đặt (`finance-setup-guide.md`,
  `notification-setup-guide.md`, `oauth.md`, `cloudflare-r2.md`) và rule. Không có tài liệu theo module, không có chỗ
  mô tả từng chức năng.
- Quy định file riêng tư/công khai chỉ có trong `SYSTEM_CONTEXT.md` (dòng 54–62), chưa có trong `docs/rules/` hay
  `prompt.md`.
- `prompt.md` là một danh sách rule dài, phần yêu cầu chỉ có `[Nội dung yêu cầu]`, không có khung mục tiêu, phạm vi,
  tiêu chí hoàn thành.

## 1. Pha 1: BE `member_permissions` khai bằng class quyền

**Thiết kế** (giữ base tối thiểu, lớp con tự khai):

```python
class AttachmentPermission(PermissionCatalog):
    FILE_READ = PermissionDefinition(...)
    FILE_CREATE = ...
    FILE_UPDATE = ...
    FILE_DELETE = ...
    FILE_MANAGE_ALL = ...
    FILE_READ_PRIVATE = ...

    # Quyền của vai trò <MODULE>_MEMBER: thao tác bản ghi do mình tạo.
    MEMBER = (FILE_READ, FILE_CREATE, FILE_UPDATE, FILE_DELETE)
```

- `PermissionCatalog.member()` trả về `cls.MEMBER` (mặc định `()`); `all()` giữ nguyên, chỉ lấy `PermissionDefinition`.
- `ModuleDescriptor.member_permissions: tuple[PermissionDefinition, ...]`;
  `module.py`: `member_permissions=(*AttachmentPermission.member(), *AttachmentFolderPermission.member(), ...)`.
- `_validate_member_permissions`: bỏ fnmatch; mỗi phần tử phải nằm trong `permissions`, không được là `manage_all`
  và không được là quyền mở rộng phạm vi kiểu `read_private`. Module có quyền mà `member_permissions` rỗng thì báo lỗi
  như hiện tại.
- `role_seed_service.py`: nhận mã quyền trực tiếp thay cho pattern (giữ được tương thích nếu `permission_patterns`
  còn dùng cho `ADMIN`/`_VIEWER`, chỉ đổi nhánh member).
- Áp cho 4 module: `system`, `utilities`, `novel`, `finance`. Danh sách quyền member giữ y như hiện tại (không đổi
  vai trò đã seed); `"system.push_device.*"` … mở thành các hằng tương ứng.
- Test: `core/tests/test_module_registry.py` (quy tắc validate mới), `system/tests/test_role_seed_service.py`
  (member có đúng tập quyền cũ), các test `test_member_sees_only_own` đang có.

## 2. Pha 2: FE quyền khớp BE + ẩn/khóa đúng chỗ

1. Tách file quyền FE đúng 1-1 với class BE: `exchange-rate-permission.ts`, `announcement-permission.ts`,
   `notification-delivery-permission.ts`, `telegram-bot-permission.ts`, … Mỗi file ghi rõ class BE tương ứng.
   Thêm test unit so mã quyền FE với `api-schema`/danh mục quyền BE (nếu OpenAPI không có danh mục thì so với file
   snapshot sinh từ `sync_iam`).
2. Chuẩn ba tầng, ghi thành rule:
   - **Menu**: mục có `permission = <resource>.read`; không có quyền → ẩn mục; module/nhóm hết mục → ẩn.
   - **Trang** (View): list/detail/create kiểm quyền và trả `ForbiddenView` (create cần `create`, detail cần `read`).
   - **Thao tác**: có `read` mà không `update` → form ở chế độ chỉ đọc (input `disabled`, không có nút Lưu); nút Thêm,
     thao tác hàng loạt, switch trạng thái khóa theo quyền tương ứng.
3. Sửa các detail view thiếu kiểm quyền đọc ở mục 0.2.
4. Kiểm bằng Playwright với 3 tài khoản: `*_VIEWER`, `*_MEMBER`, `*_MANAGER` trên mỗi module (menu, URL gõ tay,
   nút trong form, cột thao tác).

## 3. Pha 3: Cột Thao tác luôn có Xem / Sửa / Xóa

- `TableRowActions` / `DataTable` thêm `onView`; thứ tự cố định **Xem → Sửa → (Sao chép) → Xóa → rowActions**.
- Ba nút Xem/Sửa/Xóa **luôn hiển thị**. Thiếu quyền hoặc dòng không cho phép (`canEditRow`, `canDeleteRow`: chính
  mình, bản ghi hệ thống, superuser) thì nút **mờ + disabled**, tooltip nói lý do ("Bạn không có quyền sửa",
  "Không thể xóa tài khoản của chính bạn").
- API đổi từ `onEdit={canUpdate ? fn : undefined}` sang `onEdit={fn}` + `permissions={{ update: canUpdate, delete: canDelete }}`
  để không còn cách vô tình ẩn nút.
- Ngoại lệ (khai tên trong rule, không tự thêm): `session-table` (chỉ Thu hồi), `journal-entry` (chỉ Xem),
  `exchange-rate`/`announcement` nếu nghiệp vụ không cho sửa. Mọi ngoại lệ ghi lý do trong rule frontend.
- Xem và Sửa cần phân biệt: xem mục 7, quyết định 2.

## 4. Pha 4: Sidebar chia cụm + trạng thái thu gọn

- `AdminModuleNavigation.items` → `sections: { labelKey, items }[]` (module ít mục dùng một section không nhãn).
- Đề xuất cụm:
  - **System**: Tài khoản & phân quyền (Người dùng, Phiên, Vai trò, Quyền) · Thư viện (Tệp) · Thông báo (Thông báo,
    Thông báo chung) · Danh mục (Tiền tệ, Tỷ giá) · Tích hợp (Webhook, Callback) · Vận hành (Cài đặt, Nhật ký).
  - **Finance**: Tổng quan (Dashboard, Báo cáo) · Giao dịch (Khoản thu, Hóa đơn) · Cấu hình (Nền tảng, Quy tắc, SePay).
  - **Novel**: Nội dung (Truyện, Chương) · Danh mục (Tác giả, Thể loại, Tag).
  - **Utilities**: giữ một cụm (4 mục).
- Thu gọn: giữa các cụm có vạch ngăn; icon có tooltip "Cụm › Mục"; mục đang mở vẫn tô màu; không cuộn ngang.
- Ma trận kiểm (Playwright, ảnh chụp): desktop mở / desktop thu gọn / tablet (tự thu) / mobile drawer × tài khoản
  đủ quyền / thiếu quyền (cụm rỗng phải ẩn cả nhãn lẫn vạch ngăn).
- Tách `SidebarModuleGroup` (và `SidebarSection` mới) ra file riêng.
- Dùng skill `ui-ux` dựng 2–3 wireframe trước khi code.

## 5. Pha 5: Web Push nổi ra ngoài trình duyệt

- SW: dùng `client.focused` thay `visibilityState`. Tab đang focus → gửi vào trang (toast + làm mới chuông); còn lại
  (trình duyệt sau cửa sổ khác, thu nhỏ, đã đóng tab) → `showNotification` của hệ điều hành. Mọi trường hợp vẫn
  `postMessage` để chuông các tab cập nhật.
- Popup: icon `brand/logo-mark.png`, `badge` đơn sắc, `tag` + `renotify` (gộp theo thông báo), `timestamp`; bấm
  popup → focus tab đang có và điều hướng, không có tab thì mở mới; đánh dấu đã đọc.
- Xin quyền: banner/nút "Bật thông báo trên trình duyệt" (gọi `Notification.requestPermission` từ thao tác người dùng),
  hiện trạng thái `denied` kèm hướng dẫn mở lại trong cài đặt site.
- Tài liệu: điều kiện để thấy popup (HTTPS hoặc localhost, quyền site, Windows Focus Assist / macOS Focus tắt).
- Kiểm: Playwright cấp quyền `notifications`, giả lập push vào SW; kiểm tay trên Chrome/Edge Windows.

## 6. Pha 6: Tài liệu theo module + mô tả chức năng

Cấu trúc mới:

```
docs/
  README.md                 # mục lục, đọc gì khi làm việc gì
  common-catalog.md         # giữ ở gốc (CLAUDE.md/AGENTS.md trỏ tới)
  rules/                    # giữ nguyên
  architecture/             # architecture, authentication, authorization, i18n, testing, reference-audit
  guides/                   # hướng dẫn cài đặt / vận hành: deployment, cloudflare-r2, oauth,
                            #   notification-setup, finance-setup, web-push-setup
  modules/                  # mỗi module một thư mục
    system/README.md        # mục đích, model, quyền + MEMBER, route FE/BE, sự kiện thông báo, webhook/callback
    utilities/README.md
    novel/README.md
    finance/README.md
    manage-app/README.md    # khung quản trị, nhóm, sidebar
    home/README.md
  features/                 # MÔ TẢ chức năng, mỗi file một chức năng, đọc là hiểu luồng
    attachment-visibility.md   # file công khai vs riêng tư: kho lưu, URL, link ký 5 phút, đổi chế độ, nơi bắt buộc công khai
    attachment-library.md
    permission-scope.md        # read/create/update/delete + manage_all, 3 vai trò dựng sẵn, MEMBER
    permission-ui.md           # ẩn menu, ForbiddenView, chỉ đọc, nút disabled
    table-actions.md
    admin-navigation.md        # nhóm, module, cụm, thu gọn
    web-push.md
    soft-delete.md
    change-history.md
    ...
  plans/  reports/          # giữ nguyên
```

- Chuyển file theo bảng trên và sửa mọi link trong `CLAUDE.md`, `AGENTS.md`, `prompt.md`, `SYSTEM_CONTEXT.md`, rule,
  docstring đang trỏ `docs/...`.
- Quy định mới: **đổi hành vi một module/chức năng thì cập nhật `docs/modules/<m>/` và `docs/features/<x>.md` trong
  cùng lần sửa** (giống quy định với `common-catalog.md`). Thêm module mới thì thêm thư mục `docs/modules/<m>/`.

## 7. Pha 7: Rule, prompt.md, CLAUDE.md/AGENTS.md

- `docs/rules/backend.md`: mục quyền: `MEMBER` trong class quyền, `member_permissions` lấy từ `.member()`, cấm chuỗi.
- `docs/rules/frontend.md`: ba tầng ẩn/khóa (mục 2), cột Thao tác (mục 3) + bảng ngoại lệ, sidebar có cụm (mục 4),
  Web Push (mục 5).
- `docs/rules/common.md`: file công khai/riêng tư (rút từ `SYSTEM_CONTEXT.md`): CSV/XLSX/XML và chứng từ luôn riêng
  tư; avatar, logo QR, ảnh trong trang công khai bắt buộc công khai; không trả URL storage của file riêng tư; mở qua
  `/attachments/{id}/content` + `read_private`. Thêm quy định cập nhật `docs/modules`, `docs/features`.
- `CLAUDE.md` + `AGENTS.md`: thêm các core rule tương ứng (giữ hai file khớp nhau).
- `prompt.md` viết lại theo khung:
  1. Vai trò và bối cảnh dự án (1 đoạn).
  2. Tài liệu phải đọc (đường dẫn mới theo pha 6, kèm khi nào đọc `docs/modules/<m>` / `docs/features`).
  3. Rule cốt lõi (rút gọn, trỏ về `docs/rules/` cho chi tiết; bổ sung quyền, cột thao tác, sidebar, file
     công khai/riêng tư, cập nhật tài liệu).
  4. Quy trình (giữ 10 bước hiện có).
  5. Bảng kiểm khi mở file (bổ sung các mục mới).
  6. Định dạng báo cáo.
  7. **Khung yêu cầu**: Mục tiêu · Module/màn hình · Phạm vi · Ngoài phạm vi · Tiêu chí hoàn thành · Ghi chú.
- `docs/common-catalog.md`: cập nhật `PermissionCatalog.member()`, `TableRowActions` (onView, disabled), type
  navigation `sections`.

## 8. Thứ tự và kiểm tra

| Pha | Phụ thuộc | Kiểm tra |
| --- | --- | --- |
| 1 BE member | không | ruff/mypy file sửa, `test_module_registry`, `test_role_seed_service`, test member các module |
| 2 FE quyền | 1 (chỉ tên) | eslint/prettier/typecheck, unit test quyền, Playwright 3 vai trò |
| 3 Cột thao tác | 2 | unit test `TableRowActions`, E2E bảng người dùng + một bảng mỗi module |
| 4 Sidebar | 2 | `module-registry.test.ts`, Playwright 4 trạng thái × 2 tài khoản |
| 5 Web Push | không | Playwright SW + kiểm tay Chrome/Edge |
| 6 Tài liệu | 1–5 (nội dung) | link check bằng grep `docs/` |
| 7 Rule/prompt | 1–6 | đọc chéo CLAUDE.md ↔ AGENTS.md |

Pha 3 và 4 sửa vùng nền (`shares/`, `manage-app`) và đụng hơn 10 file: báo trước khi làm theo rule. Chạy
`graphify update .` sau pha 6 (di chuyển nhiều file).

## 9. Cần bạn chốt

1. `MEMBER` khai trong class quyền (đề xuất), hay đánh dấu từng quyền `PermissionDefinition(..., member=True)`?
2. Xem và Sửa: (a) Xem mở trang chi tiết **chỉ đọc**, trong header có nút "Sửa" (cần `update`); Sửa trong bảng mở
   thẳng chế độ sửa (`?mode=edit`). Đề xuất (a). (b) Cả hai mở cùng một trang như hiện tại, Xem chỉ khác ở chỗ form
   khóa.
3. Thiếu quyền thì nút **mờ + tooltip** (đề xuất) hay mờ không tooltip?
4. Web Push: popup hệ điều hành khi tab **không focus** (giống Facebook, đề xuất) hay **luôn** popup kể cả đang xem trang?
5. Tên thư mục mô tả: `docs/features/` (đề xuất) hay `docs/mo-ta/`?
