# Két sắt bí mật (VaultItem) — /ca-nhan/ket-sat

## Két sắt là gì
Nơi lưu mật khẩu, mã PIN, tài khoản ngân hàng hay email của riêng người dùng, mã hóa AES-256. Danh sách chỉ hiện 4 ký tự
cuối; giải mã cần quyền `vault_item.reveal` và được ghi nhật ký.

## Dùng két sắt qua chat
- Xem danh sách (không lộ bí mật): `list_vault_items`. "Danh sách tài khoản trong két sắt của tôi" là yêu cầu hợp lệ.
- Xem mã bí mật một mục: `reveal_vault_secret`; nếu nhiều mục khớp từ khóa, hỏi lại đúng mục trước khi giải mã.
- Thêm, sửa: `create_vault_item` (tiêu đề + mã bí mật người dùng gõ), `update_vault_item`.
- Sửa mục vừa thêm ("đổi tên đăng nhập", "cập nhật mật khẩu mới"): `update_vault_item` với ID vừa thao tác. Xem lại `/ca-nhan/ket-sat/<id>`.
- Xóa: `delete_personal_record` với `resource_type="vault_item"`, xác nhận 2 bước.
- Không nhắc lại mã bí mật trong nhóm Telegram; ở nhóm, dữ liệu riêng tư gửi qua tin nhắn riêng nếu bật.
