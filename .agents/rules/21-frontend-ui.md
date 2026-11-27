---
trigger: glob
globs: frontend/src/**/*.tsx, frontend/src/app/globals.css, frontend/public/**
description: Chuẩn giao diện shadcn/ui + Tailwind 4, bảng, form, quyền trên UI, màu, dialog, SVG.
---

# Giao diện (shadcn/ui + Tailwind 4)

Chi tiết: `docs/rules/frontend.md` §3.1, §3.2, §4; `docs/features/permission-ui.md`, `table-actions.md`,
`admin-navigation.md`. Việc UI/UX: dùng skill `ui-ux` trước khi làm; dùng `web-design-guidelines` để review
accessibility/UX trên file đã sửa, rồi `playwright-cli` để kiểm UI thật. Khi viết React/Next.js, tham khảo
`vercel-react-best-practices` về hiệu năng. Skill không được ghi đè rule của repo.

## Primitive và layout

- Primitive lấy từ `@/shares/components/ui/*` (thiếu thì `pnpm dlx shadcn@latest add <tên>`); không `<button>`,
  `<input>`, `<select>`, `<a>`, `<img>` trần. Link dùng `Link` (`@/i18n/navigation`), ảnh dùng `<Image />`.
- **Tooltip bắt buộc dùng `AppTooltip` / shadcn `Tooltip`, cấm `title=` HTML thô** trên thẻ DOM (`div`/`span`/`p`/`button`...) hay primitive (`Button`, `Badge`, `Link`, `Image`...; nút disabled cần lý do thì bọc `<span className="inline-flex">`); ngoại lệ chỉ cho `<iframe title=...>` và prop `title` của component cấu trúc (`PageHeader`, `FormPage`, `FormSection`, `ConfirmDialog`...; kiểm bởi `tests/unit/code-conventions.test.ts`).
- Mọi control cao 40px (`h-10`, `rounded-xl`); ô chọn là `SelectField`; bộ lọc bảng là `FilterSelect` nhiều lựa chọn.
- Chỉ Tailwind utility + `cn()`; không `style={{}}` tĩnh; mobile-first, 375px không cuộn ngang; dark mode qua token.
  Mọi trang công khai/custom page (`/p/[slug]`, `/s/[slug]`, donate, sản phẩm) cũng phải chuẩn Light/Dark theo token hệ thống.
- **Màu**: class màu ngữ nghĩa phải có token `--color-<tên>` trong `globals.css` (`theme-tokens.test.ts`); ưu tiên thang
  Tailwind (`h-4.5`) thay giá trị tùy ý; không hex/`bg-blue-500` cho màu thương hiệu.
- **SVG** đặt trong `public/<nhóm>/<tên>.svg`, gọi qua hằng (`ICON_PATHS`) + `<Image />`; cấm `<svg>`/`<path>` nội
  tuyến và data URI SVG. Icon đơn sắc dùng `lucide-react`.

## Bảng, form, dialog

- Bảng là `DataTable`. Cột Thao tác **luôn** có Xem/Sửa/Xóa: truyền đủ `onView`/`onEdit`/`onDelete`, thiếu quyền khai
  `can={{ update, delete }}` (nút mờ + tooltip). Cấm `onEdit={canUpdate ? fn : undefined}`. Ngoại lệ ghi ở
  `docs/features/table-actions.md`.
- Có Xóa từng dòng → có chọn nhiều + Xóa hàng loạt; cờ boolean → `bulkStatus` (`createBooleanBulkStatus`); dùng
  `useBulkActions`. `TableBulkBar` luôn một dòng, không bọc `Card`.
- Tạo/sửa/xem dùng **một** form (`FormPage` + `FormLayout` + `FormSection` + `FormActions`), không dialog; trường
  bắt buộc `FormField required`. Danh sách chọn dùng `ChoiceList`/`ChoiceGroups`.
- **Nút Quay lại trên header (Admin & Client)**: mọi trang Tạo / Xem / Sửa / trang con (cả `FormPage` lẫn `PageHeader` như Nhật ký, Yêu thích, Lịch sử đọc) thống nhất tên **`Quay lại`** và đặt ở cụm phải **luôn đứng bên trái nút chính** (`[...phụ] [Quay lại] [Sửa]`, `[...phụ] [Quay lại] [Lưu]`, `[Quay lại] [Tạo]` — không nhảy vị trí khi bấm Sửa, không `disabled` lên `<Link>` Quay lại); `Hủy` chỉ dùng trong popup/dialog (`ConfirmDialog`, `FormDialog`, nhánh `onCancel`). Trang chi tiết có tab (`RecordDetailTabs`, `PageForm`…) **bắt buộc** truyền `backHref` lên `<FormPage>` + dùng `<FormBackButton />` trong `<FormActions>` (hoặc đặt `<FormActions>` ngoài `</Tabs>`) để không bị mất nút `Quay lại` khi đổi tab.
- Dialog `DialogContent p-0` thì `DialogFooter` thêm `mx-0 mb-0`; dialog có tab cao cố định, chỉ thân cuộn; nút lưu ở
  footer (`<Form id>` + `form={…_FORM_ID}`).
- Form/trang có Tab chính (`PageForm`, `PortalProfile`...): đồng bộ URL query param `?tab=...` qua `useTabState` (`window.history.replaceState`). Bảng/danh sách/bộ lọc: bắt buộc lưu toàn bộ phân trang (`page`, `pageSize`), tìm kiếm (`search`), sắp xếp (`ordering`), bộ lọc (`filterKeys`) và khoảng ngày/năm vào URL query params qua `useTableState` hoặc `window.history.replaceState` (F5 không mất filter/trang). Slug công khai (`Page`, `ShortLink`) hỗ trợ giữ nguyên chữ hoa chữ thường kiểu `ToanToChill` (`preserveCase: true`).
- **Tab lịch sử thay đổi cho model `JournalTracker`**: mọi model BE có `JournalTracker` (`history_enabled = True`) khi có trang chi tiết/chỉnh sửa (`[id]/page.tsx`, Admin và Client Portal) **bắt buộc** có tab `?tab=history` (`RecordDetailTabs` + `RecordHistoryView` → `ActivityTimeline` common toàn hệ thống, lọc thao tác, `"Xem hoạt động cũ hơn"`, dịch đủ nhãn field/enum trong `journal-field-prefixes.ts` và `journal-value-prefixes.ts`).
- Lỗi tải bản ghi dùng `QueryErrorState`; soạn thảo dùng `TiptapEditor`/`TiptapContent`.
- **Hiển thị tên người dùng & thời gian chuẩn**: người tạo/chủ sở hữu/người dùng hiển thị **`fullname (username)`**, không có `fullname` thì chỉ **`username`** (dùng `formatUserDisplayName` / `formatOwnerDisplayName` trong `shares/lib/user-display.ts` hoặc `getUserDisplayName`). Mốc thời gian bản ghi (`Cập nhật`, `Tạo lúc`, nhật ký, hoạt động, tệp, phiên, chat…) hiển thị **`dd/MM/yyyy HH:mm:ss (<thời gian đếm>)`** qua `<TimestampText />` (`shares/components/common/timestamp-text.tsx`) hoặc `formatDateTimeWithRelative` (`shares/lib/date-time-format.ts`); cột chỉ có ngày hiển thị **`dd/MM/yyyy`** qua `formatExplicitDate`. Không gọi `format.relativeTime()` rời rạc hay `dateStyle`/`timeStyle` (`code-conventions.test.ts`).

## Quyền trên UI (ba tầng)

1. Menu: mục khai `permission`; thiếu quyền thì ẩn, module/nhóm hết mục thì ẩn. Module > 5 mục: mọi mục có `section`.
2. Trang: View trả `ForbiddenView` khi thiếu quyền trang.
3. Thao tác: trang chi tiết chỉ xem mặc định (`useEditMode` + `EditModeProvider`, nút Sửa thêm `?mode=edit`).

Sidebar: nhóm chỉ một module thì không hiện nhãn module IN HOA.

## Xác minh giao diện

- Với màn hình/luồng đã sửa: tạo hoặc cập nhật test liên quan cho các case bị ảnh hưởng; chạy đúng file test đó.
- Mở UI thật bằng Playwright, kiểm desktop/mobile (gồm 375px), các trạng thái loading/empty/error/success,
  tương tác bàn phím, quyền liên quan, console và network; chụp ảnh rồi xem lại để phát hiện lỗi bố cục.
- Không thể mở UI thì báo rõ chưa kiểm được; không tuyên bố đã xác minh giao diện. Không chạy E2E toàn bộ
  khi người dùng chưa yêu cầu.
