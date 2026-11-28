# Mã QR (QrCode) — /ca-nhan/ma-qr

## Mã QR là gì và tạo qua chat
Mã QR cá nhân có tên, loại và nội dung: Liên kết (URL), Văn bản (TEXT) hoặc Chuyển khoản VietQR (cần chọn ngân hàng,
chỉ tạo trên giao diện `/ca-nhan/ma-qr/tao-moi`). Kiểu dáng, logo chỉnh trên giao diện.
- Tạo: `create_qr_code` với `name` và `content_text`; loại tự suy: nội dung là URL thì `URL`, còn lại `TEXT`.
- Sửa tên, nội dung (QR vừa tạo có sẵn ID): `update_qr_code`. Xem lại `/ca-nhan/ma-qr/<id>`. Xem danh sách: `list_qr_codes`.
- Xóa: `delete_personal_record` với `resource_type="qr_code"`, xác nhận 2 bước.

## Trang chứa mã QR
Mã QR có thể đặt vào trang công khai ở đường dẫn giữa `qr` (VD `/qr/<slug>`); cách tạo, sửa trang và đổi đường dẫn giữa
xem tài liệu "Trang cá nhân và đường dẫn giữa".
