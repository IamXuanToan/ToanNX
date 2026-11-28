# Nhắc việc, nhắc lịch & Chủ đề (Reminder) — /ca-nhan/nhac-viec

## Nhắc việc là gì
Công việc cá nhân có nội dung (tiêu đề), **Chủ đề phân loại**, ngày đến hạn, giờ (tùy chọn, để trống là nhắc cả ngày),
độ ưu tiên (Thấp, Trung bình, Cao, Khẩn cấp), nhắc trước và lặp lại. Thông báo gửi theo kênh người dùng chọn ở
Hồ sơ → Thông báo (Website, Telegram, Email, Push). Xem danh sách và lịch tại `/ca-nhan/nhac-viec`, chi tiết
`/ca-nhan/nhac-viec/<id>`.

## Chủ đề nhắc việc (`ReminderTopic`)
- Nhắc việc phân loại theo **Chủ đề** (thay cho nhãn tự do), có các chủ đề mặc định sẵn của hệ thống:
  **Công việc**, **Ngày kỷ niệm**, **Ngày giỗ**, **Gia đình**, **Sinh nhật**, **Sức khỏe**, **Tài chính**.
- Người dùng có thể **tạo, sửa màu/tên hoặc xóa chủ đề cá nhân** trực tiếp ngay trong form Tạo / Sửa nhắc việc
  bằng nút mở hộp thoại quản lý Chủ đề (không cần chuyển menu khác). Các chủ đề mặc định hệ thống được bảo vệ
  để mọi người dùng đều sử dụng ổn định.
- Trên bảng danh sách Nhắc việc có bộ lọc theo **Chủ đề** và hiển thị huy hiệu màu chủ đề ngay trên từng dòng.

## Tạo nhắc việc, nhắc lịch, đặt lịch hẹn qua chat
Tool `create_quick_reminder`. Gọi ngay khi người dùng muốn tạo, kể cả câu mơ hồ như "tôi muốn tạo 1 nhắc lịch".
Hỗ trợ truyền thêm `topic_name` khi người dùng nhắc đến chủ đề (ví dụ: `"Ngày giỗ"`, `"Ngày kỷ niệm"`, `"Công việc"`).
Hệ thống tự hỏi bằng nút những gì người dùng CHƯA nói, theo thứ tự:
1. **Bạn muốn nhắc việc gì?** — khi chưa có nội dung cụ thể (tiêu đề chung chung như "nhắc lịch", "công việc" không tính).
2. **Nhắc vào ngày nào?** — Hôm nay, Ngày mai, Ngày kia, Tuần sau hoặc gõ ngày (05/12, 2026-12-05). Nói giờ mà không nói
   ngày ("nhắc lúc 11h") thì hiểu là hôm nay.
3. **Nhắc lúc mấy giờ?** — Cả ngày (không giờ), 08:00, 09:00, 12:00, 14:00, 17:00, 20:00 hoặc gõ "14:30", "2h chiều".
4. Có giờ → **Nhắc trước?** (Không nhắc trước/đúng giờ, 5, 15, 30, 60 phút hoặc "10 phút", "1 tiếng"); cả ngày → **Số
   ngày nhắc trước** (Không, Trước 1 ngày, Trước 3 và 1 ngày, Trước 7, 3 và 1 ngày).
5. **Lặp lại?** — Không lặp, Hàng ngày, Hàng tuần, Hàng tháng, Hàng năm.
Câu nói đủ ("nhắc tôi ngày giỗ ông nội 15/12, trước 3 ngày, lặp hàng năm, chủ đề Ngày giỗ") thì tạo luôn không hỏi.
Tạo xong luôn kèm link "Xem chi tiết" tới trang của nhắc việc đó.

## Sửa, dời giờ, đổi tên, đổi chủ đề, hoàn thành nhắc việc
Tool `update_reminder` với `reminder_id`. Câu thường gặp: "đổi tên cái vừa tạo thành Họp sprint", "đổi chủ đề sang
Ngày kỷ niệm", "dời sang 3h chiều", "chuyển sang ngày mai", "nhắc trước 30 phút thôi", "bỏ lặp lại", "đánh dấu xong
việc họp". Nhắc việc vừa tạo/sửa trong hội thoại đã có sẵn ID trong khối "BẢN GHI VỪA THAO TÁC" → sửa thẳng bằng ID đó,
KHÔNG xóa rồi tạo lại. Chưa có ID thì tra `get_pending_reminders` trước; nhiều mục khớp thì hỏi lại đúng mục. Việc lặp lại
khi hoàn thành tự sinh lần kế tiếp (giữ nguyên chủ đề).

## Xem và xóa nhắc việc
- Xem: `get_pending_reminders` với `scope` = today (hôm nay), overdue (quá hạn), week (tuần này), all (tất cả). Lệnh nhanh
  `/hom_nay`, `/nhac_viec`.
- Xóa: `delete_personal_record` với `resource_type="reminder"`, luôn xác nhận 2 bước.
