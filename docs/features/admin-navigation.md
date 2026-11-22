# Điều hướng quản trị: nhóm, module, cụm, thu gọn

## Cấu trúc ba tầng

1. **Nhóm** (`ADMIN_GROUPS`): một thẻ ở màn chọn module (`/quan-tri`), một sidebar khi vào trong.
2. **Module** (`ADMIN_MODULE_NAVIGATION`): mỗi module FE một `navigation.ts`, khai `group`, `icon`, `items`.
   Nhóm chỉ có một module (mọi nhóm hiện tại) thì sidebar **không** hiện nhãn module (tên đã ở bộ chuyển nhóm
   phía trên). Nhóm có từ hai module thì mỗi module là một khối có nhãn IN HOA, bấm để thu gọn (khối chứa trang
   đang mở luôn mở).
3. **Cụm** (`AdminNavItem.section`): trong module, các mục liền nhau cùng `section` gom thành một cụm có nhãn
   nhỏ. Module nhiều hơn 5 mục bắt buộc chia cụm cho mọi mục; mục cùng cụm phải khai liền nhau
   (`tests/unit/admin-navigation.test.ts` kiểm).

Cụm hiện tại:

| Module | Cụm |
| --- | --- |
| system | Tài khoản & phân quyền (Người dùng, Phiên, Vai trò, Quyền) · Thư viện · Thông báo (Nhật ký thông báo, Gửi thông báo) · Danh mục (Tiền tệ, Tỷ giá) · Tích hợp (Webhook, Callback) · Vận hành (Cài đặt, Nhật ký) |
| finance | Tổng quan (Dashboard, Báo cáo) · Giao dịch (Khoản thu, Hóa đơn) · Cấu hình (Nền tảng, Quy tắc, SePay) |
| novel | Nội dung (Truyện, Chương) · Danh mục (Tác giả, Thể loại, Tag) |
| utilities | Một cụm không nhãn (4 mục) |

Nhãn cụm: `<module>.navSections.<code>` trong `messages/{vi,en}.json` của module.

## Lọc theo quyền

Mỗi mục khai `permission` (quyền `read`). Lọc trước khi gom cụm: cụm hết mục thì mất cả nhãn lẫn vạch ngăn;
module hết mục thì mất khỏi sidebar và màn chọn; trang mở khi chọn module là mục được phép đầu tiên.

## Các trạng thái sidebar

| Trạng thái | Khi nào | Hiển thị |
| --- | --- | --- |
| Mở đầy đủ | Desktop ≥ 1280px (mặc định) | Nhãn module IN HOA, nhãn cụm nhỏ, icon + tên mục |
| Thu gọn (dải icon 64px) | Bấm nút thu gọn, hoặc tablet 768–1279px (tự thu) | Nhãn module thành gạch ngắn, nhãn cụm ẩn, giữa các cụm có vạch ngăn, chỉ icon; tooltip "Cụm › Mục"; mục đang mở vẫn tô màu |
| Drawer | Mobile < 768px | Như mở đầy đủ, chọn mục thì drawer tự đóng |

## Thêm mục menu

1. Thêm route vào `<M>_ROUTES`/`<M>_PATHNAMES`.
2. Thêm item vào `navigation.ts` đúng cụm (đặt liền các mục cùng cụm), khai `permission`.
3. Cụm mới: thêm khóa `navSections.<code>` vào messages vi + en.

## File chính

- `frontend/src/modules/manage-app/constants/admin-navigation.ts` (`groupNavSections`)
- `frontend/src/modules/manage-app/components/sidebar/module-sidebar.tsx`, `sidebar-module-group.tsx`,
  `sidebar-nav-section.tsx`
- `frontend/src/shares/types/navigation.types.ts`
