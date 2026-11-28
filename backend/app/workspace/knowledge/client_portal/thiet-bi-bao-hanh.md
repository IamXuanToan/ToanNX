# Thiết bị và Bảo hành (Asset, AssetWarrantyClaim) — /ca-nhan/thiet-bi, /ca-nhan/bao-hanh

## Thiết bị là gì
Thiết bị cá nhân: tên, loại (Laptop, Điện thoại, Máy tính bảng, Màn hình, Phụ kiện, Âm thanh, Thiết bị mạng, Máy ảnh,
Khác), hãng, model, serial, IMEI, ngày mua, giá mua (quy đổi VND theo tỷ giá), nơi mua, số tháng bảo hành và ngày hết
hạn bảo hành tự tính. Trạng thái: Đang dùng, Dự phòng, Đang bảo hành, Đang sửa chữa, Đã bán, Đã hỏng.

## Thêm thiết bị qua chat
Tool `create_asset`. Hệ thống hỏi **Loại thiết bị** nếu câu chưa rõ (nói "laptop", "iPhone", "tai nghe" là tự nhận) và
**Số tháng bảo hành**: Không có bảo hành, 6, 12, 24, 36 tháng hoặc gõ "18 tháng". Giá viết tắt `25tr` được hiểu.

## Sửa thiết bị qua chat
`update_asset` với `asset_id` (thiết bị vừa thêm có sẵn ID): đổi tên, giá, ngày mua, số tháng bảo hành, trạng thái (Đang dùng, Dự phòng, Đã bán, Đã hỏng...). VD "đổi giá máy vừa thêm thành 25tr", "đánh dấu iPhone cũ là đã bán". Xem lại tại `/ca-nhan/thiet-bi/<id>`.

## Phiếu bảo hành và sửa chữa
Tool `create_warranty_claim` (chọn thiết bị theo `asset_id` hoặc `asset_name`). Hệ thống hỏi **Loại phiếu** nếu chưa rõ:
Bảo hành, Sửa chữa tính phí, Bảo trì - Vệ sinh. Mở phiếu thì thiết bị chuyển sang Đang bảo hành hoặc Đang sửa chữa; đóng
phiếu (Đã hoàn tất, Từ chối BH, Đã hủy) thì về Đang dùng. Xem: `get_assets_and_warranty`, `list_warranty_claims`.
Sửa: `update_asset`, `update_warranty_claim`. Xóa: `delete_personal_record` (`asset`, `warranty_claim`), xác nhận 2 bước.
