# Hồ sơ, Lịch tổng hợp, Thống kê, Thư viện — /ca-nhan, /ca-nhan/ho-so, /ca-nhan/thu-vien

## Hồ sơ cá nhân
Xem hồ sơ: `get_my_profile`. Đổi tên hiển thị: `update_my_profile` với `full_name` (xác nhận tên cũ → tên mới). Mật khẩu
đăng nhập, liên kết Google, kênh thông báo (Website, Telegram, Email, Push), nhóm Telegram nhận tin và bản tin hằng ngày
cấu hình tại `/ca-nhan/ho-so` trên giao diện.

## Lịch tổng hợp và thống kê cá nhân
- Lịch N ngày tới gộp nhắc việc, gia hạn dịch vụ, hết hạn bảo hành, phiếu bảo hành, thu nhập, quyên góp:
  `get_upcoming_events` (`days_ahead`, lọc `types`).
- Thống kê cá nhân theo tháng (thu nhập, chi tiêu, nhắc việc, thiết bị, dịch vụ, link, QR, két sắt):
  `get_personal_statistics`.
- Hỏi "bạn làm được gì", "có những chức năng nào": `get_my_capabilities` (chỉ chức năng cá nhân tài khoản có quyền).

## Thư viện file và quyên góp
Thư viện file đính kèm (`/ca-nhan/thu-vien`) và trang quyên góp (`/ca-nhan/quyen-gop`) quản lý trên giao diện; trợ lý
chỉ hướng dẫn đường dẫn, không tải lên hay xóa file qua chat.
