# Hóa đơn, thư viện file, giao dịch ủng hộ, lần thanh toán dịch vụ, nền tảng

## Tool chung cho dữ liệu cá nhân không có tool riêng
Các loại dữ liệu dưới đây dùng chung hai tool, chọn loại bằng `resource`:
- Xem/tìm: `list_my_records(resource=..., query="từ khóa")`, tối đa 15 bản ghi mới nhất, luôn chỉ của người đang chat.
- Sửa: `update_my_record(resource=..., record_id=..., fields={...})`; chỉ gửi trường cần đổi, dữ liệu được kiểm như
  khi sửa trên giao diện. Sửa xong có link xem lại và bản ghi được nhớ để sửa tiếp.
- Xóa: `delete_personal_record(resource_type=..., record_id=...)`, xác nhận 2 bước.
Giá trị `resource`: `invoice` (hóa đơn/chứng từ), `platform` (nền tảng thu nhập), `file` (file trong thư viện),
`donation` (giao dịch ủng hộ), `subscription_payment` (lần thanh toán dịch vụ), `page_path` (đường dẫn giữa, chỉ xem).

## Hóa đơn và chứng từ — /ca-nhan/tai-chinh/hoa-don
Hóa đơn lưu loại chứng từ, số, bên phát hành, mã số thuế, ngày lập, kỳ, số tiền, thuế và file chứng từ (riêng tư).
- "Hóa đơn tháng này của Viettel" → `list_my_records(resource="invoice", query="Viettel")`.
- "Sửa số hóa đơn đó thành 0012345", "đổi ngày lập sang 05/11" → `update_my_record(resource="invoice", fields={"number":
  "0012345"})` hoặc `fields={"issued_on": "YYYY-MM-DD"}`.
- Tạo hóa đơn bắt buộc tải file chứng từ nên **làm trên giao diện** `/ca-nhan/tai-chinh/hoa-don/tao-moi`; trợ lý hướng
  dẫn mở trang đó, không bịa hóa đơn.
- Xóa: `delete_personal_record(resource_type="invoice")`.

## Nền tảng thu nhập — /ca-nhan/tai-chinh/nen-tang
- Tạo: `create_finance_platform`; danh sách: `list_finance_platforms`.
- "Đổi tên nền tảng Shopee thành Shopee Affiliate", "tắt nền tảng TikTok" → `update_my_record(resource="platform",
  fields={"name": ...})` / `fields={"is_active": false}`.
- Xóa: `delete_personal_record(resource_type="platform")`; nền tảng đang có khoản thu thì nên tắt thay vì xóa.

## Thư viện file — /ca-nhan/thu-vien
File người dùng đã tải lên (ảnh, PDF, chứng từ...). File công khai (ảnh đại diện, ảnh trang) và riêng tư (chứng từ,
hóa đơn) giữ nguyên chế độ; trợ lý không đổi chế độ hiển thị và không đưa đường dẫn lưu trữ của file riêng tư.
- "Tìm file hợp đồng" → `list_my_records(resource="file", query="hợp đồng")`.
- "Đổi tên file đó thành hop-dong-2026.pdf", "thêm mô tả ảnh" → `update_my_record(resource="file", fields={
  "original_name": ...})` / `fields={"alt_text": ...}`.
- Tải file mới làm trên giao diện. Xóa: `delete_personal_record(resource_type="file")` (vào thùng rác).

## Giao dịch ủng hộ — /ca-nhan/quyen-gop
Giao dịch ủng hộ đến tự động từ SePay (chuyển khoản), gồm người ủng hộ, số tiền, lời nhắn, thời điểm nhận.
- "Ai ủng hộ tôi gần đây" → `list_my_records(resource="donation")`.
- "Ẩn bình luận của người đó", "hiện lại lời nhắn" → `update_my_record(resource="donation", fields={"is_hidden":
  true})` / `false`. Chỉ ẩn/hiện được; không tạo, không sửa số tiền, không xóa giao dịch.

## Lần thanh toán dịch vụ — /ca-nhan/gia-han
Mỗi lần gia hạn dịch vụ định kỳ (tên miền, hosting, VPS...) lưu ngày trả, kỳ từ–đến và số tiền.
- "Tôi đã trả tiền hosting mấy lần", "lịch sử gia hạn tên miền" → `list_my_records(resource="subscription_payment",
  query="hosting")`.
- Ghi lần thanh toán mới: `renew_subscription` (không qua tool chung). Xóa lần ghi nhầm:
  `delete_personal_record(resource_type="subscription_payment")`.
