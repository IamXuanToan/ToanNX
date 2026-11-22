# Rà soát rule toàn hệ thống — 2026-11-22

Hai phần: (1) rule còn thiếu trong tài liệu, rút ra từ lỗi thật gặp trong phiên làm việc, đã bổ sung; (2) vi phạm
rule **đã có** đang nằm trong code (nợ kỹ thuật), chưa sửa vì lan khoảng 30 file — chờ quyết định.

## 1. Rule đã bổ sung

| Rule | Từ lỗi nào | Ghi ở |
| --- | --- | --- |
| Class màu ngữ nghĩa phải có token `--color-<tên>` trong `globals.css`; có test chặn | Số trên badge chuông tối màu (`text-destructive-foreground` không có token); icon thông báo mức INFO không lên màu (`text-info` không có token, đã đổi sang `text-primary`) | Rule frontend §4.0, `tests/unit/theme-tokens.test.ts` |
| Ưu tiên thang Tailwind thay giá trị tùy ý; đổi `globals.css` thì khởi động lại dev server | Class `md:grid-cols-[...]` / `h-[18px]`; CSS cũ còn trong cache Turbopack | Rule frontend §4.0 |
| `DialogContent p-0` thì `DialogFooter` thêm `mx-0 mb-0`; dialog có tab cao cố định; cột chứa bảng `flex-1 min-w-0` | Footer Hồ sơ cá nhân lệch, đổi tab nhảy layout, bảng tràn dialog | Rule frontend §3.1.1 (mới) |
| Truyền `signal` của React Query, không tự abort `fetch`; không để promise rơi | "Runtime Error: cancelled" | Rule frontend mục 5 |
| Service worker luôn hiện thông báo hệ điều hành; sửa SW phải Update trong DevTools | Push không nổi ra ngoài | Rule frontend mục 5, `docs/features/web-push.md` |
| ViewSet chỉ đọc mở `post` cho bulk thì `"create": DENY` | Lộ action `create` của nhật ký | Rule backend mục 9 |
| Model không có `deleted_at` xoá bằng `hard_delete` có lý do | Xoá nhật ký thay đổi | Rule backend mục 9 |
| Field unique ngắn dùng `UniqueConstraint` có điều kiện | Xoá tiền tệ lỗi 500 (`code` 3 ký tự) | Rule backend mục 9 |
| Dữ liệu test thoả ràng buộc unique | Test lần gửi thông báo trùng `dedup_key` | Rule backend mục 12 |
| Trả lời người dùng bằng tiếng Việt; chưa kiểm được UI thật thì nói rõ | Phản hồi của người dùng | Rule chung mục 2, `prompt.md`, `AGENTS.md`, `CLAUDE.md` |
| `graphify query` trước khi grep | Có ở `CLAUDE.md` nhưng chưa có trong `docs/rules` | Rule chung mục 2 |
| Sự kiện `OWNER` phải truyền `recipient`; `table-conventions.test.ts` | Có ở `CLAUDE.md` nhưng thiếu trong `prompt.md` | `prompt.md` |

## 2. Vi phạm rule đã có — ĐÃ SỬA (2026-11-22)

Đã sửa toàn bộ danh sách dưới đây và thêm test chặn tái phạm: `frontend/tests/unit/one-unit-per-file.test.ts`,
`backend/app/core/tests/test_one_class_per_file.py`. Chi tiết cách sửa ở mục 4.

### Frontend — "một component / một hook một file" (rule frontend §2.1)

| File | Vi phạm |
| --- | --- |
| `modules/manage-app/components/admin-shell.tsx` | 7 component (`AdminAttachmentPickerSlot`, `HeaderActions`, `LauncherLayout`, `WorkspaceLayout`, `LauncherSkeleton`, `WorkspaceSkeleton`, `AdminShell`) + hook trong `.tsx` |
| `modules/manage-app/components/admin-modules-provider.tsx` | Hook khai trong `.tsx` (phải tách `-context.ts` / `use-*.ts`) |
| `shares/components/common/tiptap-toolbar.tsx` | 3 component |
| `shares/components/common/time-picker-popover.tsx` | 2 component |
| `shares/components/common/form.tsx` | Hook trong `.tsx` |
| `shares/components/layout/logo.tsx` | `LogoMark` + `Logo` |
| `modules/system/components/attachment-edit-dialog.tsx` | `AttachmentEditForm` + `AttachmentEditDialog` |
| `modules/system/components/user-menu.tsx` | `AccountEmail` + `UserMenu` |
| `modules/system/views/attachment-tiptap-image-plugin.tsx`, `modules/utilities/views/qr-code-tiptap-plugin.tsx`, `modules/utilities/views/short-link-tiptap-plugin.tsx` | 2 component mỗi file |
| `modules/home/components/weather-widget.tsx` | `WeatherIcon` + `WeatherWidget` |
| `modules/home/components/clock-widget.tsx` | Hook trong `.tsx` |

### Backend

| File | Vi phạm | Rule |
| --- | --- | --- |
| `system/constants/notification_enums.py` | 3 enum một file | §2.2 một class một file |
| `system/serializers/responses/notification_preference_response_serializer.py`, `novel/serializers/responses/novel_import_response_serializer.py`, `novel/serializers/responses/reading_history_response_serializer.py`, `novel/serializers/validates/novel_import_validate_serializer.py` | Nhiều serializer một file | §2.2 |
| `novel/views/favorite_view.py` | Serializer khai trong file view | §2.2 |
| `utilities/services/page_service.py` (`public_url`), `utilities/services/short_link_service.py` (`is_resolvable`), `system/services/auth_cookie_service.py` (`set_cookies`, `clear_cookies`), `system/services/cleanup_service.py` (`run_all`), `system/services/refresh_token_service.py` (`hash_token`), `core/services/core_crud_service.py` (`log_event`) | Method công khai của service là `@staticmethod` | §4 |
| `system/tasks/purge_expired_auth.py`, `system/management/commands/createsuperuser.py` | Điểm vào gọi thẳng ORM/repository | §1 |

Đề xuất: sửa theo từng module (mỗi lần một nhóm file, chạy test của nhóm đó), kèm một test quy ước có danh sách nợ
để file mới không vi phạm thêm. Sửa `admin-shell.tsx` và `core_crud_service.py` đụng vùng nền nên làm riêng.

## 3. Đã kiểm

- Đối chiếu từ khoá của mọi core rule trong `CLAUDE.md`/`AGENTS.md` với `prompt.md` và `docs/rules/*`.
- Quét toàn bộ `src/**/*.tsx` (class màu không token, nhiều component/hook một file, chuỗi tiếng Việt viết cứng —
  không có) và `backend/app/**` (nhiều class một file, `@staticmethod` công khai trong service, điểm vào gọi ORM).
- `tests/unit/theme-tokens.test.ts` đạt sau khi sửa `text-info`.

## 4. Cách đã sửa

- FE: mỗi component/hook tách file riêng (`LogoMark` → `logo-mark.tsx`, `WeatherIcon`, `AccountEmail`,
  `TimeScrollColumn`, `AttachmentEditForm`, `TiptapToggle` (đổi tên từ `Toggle`), `UrlPopover`, nút chèn của 3 plugin
  Tiptap chuyển sang `components/`, `admin-shell.tsx` tách 6 component + `use-group-breadcrumb.ts` + hằng
  `HEADER_CLASS` ở `constants/admin-shell.ts`); context tách `-context.ts` / `-provider.tsx` / `hooks/use-*.ts`
  (`form`, `admin-modules`); `useClock` sang `components/hooks/use-clock.ts`, kiểu `ClockSnapshot` sang
  `home/types/clock.types.ts`.
- BE: 3 enum thông báo thành 3 file (`notification_scope.py`, `notification_level.py`, `notification_channel.py`);
  serializer lồng tách file riêng, serializer trong `favorite_view.py` chuyển sang `serializers/`; 7 method tĩnh
  thành method instance, các view gọi qua `self.auth_cookie_service` (khai trong `__init__`), `AuthSessionService`
  dùng `self.refresh_token_service`; task `purge_expired_auth` chỉ gọi `AuthSessionService.purge_expired_auth`;
  lệnh `createsuperuser` kiểm trùng qua `UserService.username_exists` (hết luôn một lỗi mypy cũ).

