# Link rút gọn (ShortLink) — /ca-nhan/link-rut-gon

## Link rút gọn là gì
Đường dẫn ngắn dạng `<tên miền hệ thống>/s/<slug>` chuyển tới URL đích, có thống kê lượt truy cập, số người vào và lần
truy cập gần nhất. Slug không phân biệt hoa thường; slug đã dùng (kể cả link đã xóa) không dùng lại được.

## Tạo link rút gọn qua chat
Tool `create_short_link`. Hệ thống tự gợi ý slug đẹp còn trống (từ tên miền đích, VD `facebook`, `my-facebook`) rồi hỏi:
1. **Kiểu mở**: Chờ bấm nút (trang trung gian, người xem bấm mới chuyển), Chuyển ngay (1 giây), Đếm ngược 3, 5, 10 giây
   (tối đa 60 giây).
2. **Mật khẩu**: Không đặt hoặc Đặt mật khẩu (người dùng gõ mật khẩu; tin nhắn được che khỏi lịch sử).
Đặt ngày hết hạn khi người dùng nói rõ ("hết hạn 31/12"). Kết quả luôn là link thật do hệ thống trả, kèm nút Sao chép và
Mở link; trợ lý không tự viết lại tên miền.

## Xem, sửa, tạm tắt link rút gọn
Câu thường gặp: "đổi slug link vừa tạo thành fb-toan", "đặt mật khẩu cho link đó", "tạm tắt link facebook", "đổi đích sang trang khác". Link vừa tạo có sẵn ID trong hội thoại → `update_short_link` với ID đó. Kết quả luôn có link rút gọn thật + "Xem chi tiết" `/ca-nhan/link-rut-gon/<id>`.
- Xem danh sách: `list_short_links`.
- Sửa tên, slug, URL đích, kiểu mở, mật khẩu, hết hạn: `update_short_link`.
- Tạm tắt hoặc bật lại: `update_short_link` với `status` = `INACTIVE` hoặc `ACTIVE`.
- Xóa: `delete_personal_record` với `resource_type="short_link"`, xác nhận 2 bước.
