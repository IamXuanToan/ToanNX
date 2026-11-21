# DESIGN.md — khu quản trị ToanNX

Quyết định giao diện đã chốt cho `/admin`. Màn mới theo file này, không chọn lại.

## Brief

- **Sản phẩm:** khu quản trị toannx.com. Màn chọn nhóm module, rồi workspace có sidebar chia theo module.
- **Người dùng:** chủ site (superuser) và vài staff có phân quyền chi tiết, chủ yếu dùng máy tính.
- **Việc chính:** quản lý người dùng; vai trò và quyền.

## Bộ mặt

- **Clean** (P13): điều hướng `sidebar`, vùng chứa `classic`, bề mặt flat, font Inter (giữ font hiện có).
- Sidebar nền trắng (`--sidebar`), không kẻ dọc; nội dung trên nền xám `--canvas`; header `h-16` nền `--card`.
- Màu nhấn: xanh lá của brand theo logo cỏ bốn lá: `--primary` `#3D812E` (nút, link, mục đang chọn), `--primary-hover`
  `#206A2D`, `--ring` `#569533` (focus, trang trí; không làm nền chữ trắng). Neutral pha sắc xanh hue 140; `--success`
  xanh ngọc hue 175. Mục sidebar đang chọn: `bg-primary-light text-primary`. Chi tiết: rule frontend §4.0.
- Logo: cỏ bốn lá PNG (`public/brand/logo.png`), favicon/logo-mark sinh bằng `scripts/build_brand_assets.py`.
- Sắc: Neutral. Trạng thái: badge `success` (hoạt động) / `destructive` (khóa) khi chỉ xem; có quyền đổi thì
  cột Trạng thái chỉ là công tắc (nhãn ở tooltip), không kèm chữ.
- Dark mode: có (dùng `.dark` sẵn có).

## Khung

- Breadcrumb trên header chỉ ghi các cấp cha; tên trang là `<h1>` trong `PageHeader`.
- Tài khoản: hàng avatar ở chân sidebar trong workspace; avatar trên header chỉ ở màn chọn module (không có sidebar).
- Nhóm module trong sidebar thu gọn được; thu sidebar về dải icon 64px.
- Control: mọi nút, ô nhập, ô chọn cao 40px (`h-10`), bo `rounded-xl`.
- Tabs: dùng nguyên kiểu mặc định của shadcn/ui Radix; không ghi đè kiểu của `TabsList` và `TabsTrigger`.
- Bảng: `DataTable` trong card trắng `rounded-xl border`, phân trang ở chân card; dưới `md` mỗi dòng là một card.
- Bộ lọc: `FilterSelect` chọn nhiều, ô 40px "Tên: giá trị" hoặc tên + số đã chọn; viền/nền nhấn nhạt khi đang lọc.
- Rỗng: `EmptyState` cao tối thiểu 320px, icon trong hai vòng nền nhạt, tiêu đề đậm, một nút lối ra.
- Danh mục nhóm (Quyền): mỗi nhóm một mục accordion trong card, mục con là card nhỏ lưới 1/2/3 cột.
- Tạo/sửa/chi tiết: **một form** cho cả ba, trang riêng, `FormPage` căn giữa `max-w-6xl` có nút ← về danh sách;
  cột chính một card "Thông tin …" (ảnh + mọi ô, lưới 2 cột), cột phụ 22rem (Truy cập dạng danh sách công tắc,
  Hoạt động khi sửa); quan hệ (vai trò, quyền) là khối trải ngang dưới hai cột, lưới card có ô tìm; tiêu đề + Hủy/Tạo/Lưu trong **một card đầu trang** dính dưới header khi cuộn
  (bóng khi đã dính), không có nút ←, 375px vẫn một hàng (chốt 15/11/2026, bỏ thanh nổi dính đáy).
- Trường bắt buộc: `*` đỏ sau nhãn. Đăng nhập: một ô "Email hoặc tên người dùng".
- Danh sách chọn (vai trò, quyền, cờ): `ChoiceList` / `ChoiceGroups`, mục chọn nền nhấn nhạt; không kiểu riêng.
- Header workspace có nút ← về màn chọn module. Thanh hàng loạt nền trắng có viền, chip "Đã chọn n" màu nhấn.
  (dựng lại 14/11/2026)
- Đầu trang chỉ có tiêu đề (+ nút), không câu giới thiệu.

## Màn đã dựng

- Thư viện Attachment: phương án **B — lưới + panel 300px**, thuộc nhóm Hệ thống.
  Thumbnail cao 112px, ảnh trong panel cao 160px; lưới tự điền các cột từ 128px để file không phóng quá lớn.
  Desktop xem thông tin bên phải; dưới `lg` mở chi tiết trong dialog. Chọn nhiều theo trang có Chọn tất cả /
  Bỏ chọn tất cả; xóa mềm có xác nhận. Bộ chọn avatar có tab Thư viện / Tải lên, chỉ chọn một ảnh.
  Dùng nguyên token Clean, Inter, control 40px; có dark mode. Luồng: form avatar → chọn thư viện
  hoặc upload → Dùng ảnh này → lưu cùng form. Thư viện dùng dữ liệu API thật, không seed ảnh mẫu.
- Màn chọn module, Người dùng, Chi tiết người dùng, Vai trò, Chi tiết vai trò (dựng lại 14/11/2026).
- Trang Module đã bỏ (14/11/2026): không còn bật/tắt hay đổi icon module.
- Tạo người dùng, Tạo vai trò (trang riêng thay popup, 14/11/2026).
