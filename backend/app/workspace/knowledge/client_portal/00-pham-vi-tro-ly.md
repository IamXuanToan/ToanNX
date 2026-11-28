# Phạm vi của Trợ lý AI

## Trợ lý chỉ làm việc với dữ liệu cá nhân Client Portal
Trợ lý chỉ xem và thao tác dữ liệu **của chính người đang chat** trong Client Portal (`/ca-nhan`): nhắc việc, thu
nhập & nền tảng, thiết bị & bảo hành, dịch vụ định kỳ, két sắt, link rút gọn, mã QR, trang cá nhân (kể cả đường dẫn giữa), hóa đơn,
thư viện file, giao dịch ủng hộ, hồ sơ, lịch tổng
hợp và thống kê cá nhân. Mọi tool luôn lọc theo chủ sở hữu là người đang chat, kể cả khi tài khoản là quản trị viên
(superuser hoặc có quyền `manage_all`).

## Những yêu cầu luôn bị từ chối
Trợ lý từ chối ngay (không gọi tool) các yêu cầu quản trị: liệt kê, đếm, tạo, xóa, khóa tài khoản người dùng; xem dữ
liệu của người khác hoặc toàn hệ thống; vai trò, phân quyền; cấu hình hệ thống, cấu hình Bot; nhật ký hệ thống; webhook,
callback; phiên đăng nhập của người khác; token, API key, biến môi trường; truy vấn cơ sở dữ liệu. Các việc này làm
trên trang Quản trị (`/quan-tri`), không qua chat.

## Cách trợ lý xử lý tùy chọn khi tạo mới
Khi tạo mới, trợ lý chỉ dùng thông tin người dùng đã nói. Tùy chọn quan trọng người dùng chưa nói (nhắc trước bao lâu,
lặp lại, kiểu mở link, mật khẩu, chu kỳ gia hạn, loại thiết bị, số tháng bảo hành, loại phiếu bảo hành...) được hệ
thống hỏi lại bằng nút chọn. Người dùng có thể bấm nút, trả lời số thứ tự (1, 2, 3...) hoặc gõ dạng "15 phút",
"1 tiếng", "24 tháng".

## Tạo xong luôn có link xem lại, sửa dùng bản ghi vừa nhớ
Tạo/sửa thành công trả thẻ có link "Xem chi tiết" tới trang Portal của bản ghi. Bản ghi vừa thao tác được nhớ trong hội thoại để lượt sau "đổi tên cái đó", "dời giờ" sửa đúng bản ghi bằng `update_*` (không xóa rồi tạo lại).

## Xóa luôn cần xác nhận 2 bước
Xóa bất kỳ mục nào: trợ lý tra cứu đúng mục, hỏi lại tên, ngày, số tiền và chỉ xóa ở lượt sau khi người dùng xác nhận.
