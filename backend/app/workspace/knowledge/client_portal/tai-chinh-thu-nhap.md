# Tài chính: Thu nhập và Nền tảng — /ca-nhan/tai-chinh

## Thu nhập và nền tảng là gì
Khoản thu (Income) ghi số tiền, ngày nhận, nội dung và nền tảng nguồn thu (Platform, VD Affiliate Shopee, YouTube).
Báo cáo tháng ở `/ca-nhan/tai-chinh/bao-cao`, hóa đơn ở `/ca-nhan/tai-chinh/hoa-don`, kết nối SePay ở
`/ca-nhan/tai-chinh/ket-noi-sepay` (cấu hình trên giao diện, không qua chat).

## Ghi thu nhập nhanh qua chat
Tool `create_finance_income` với `amount`, `platform_name`, `content`. Viết tắt: `30k` = 30.000đ, `1tr5` hoặc `1.5m` =
1.500.000đ, `200k` = 200.000đ. Ví dụ "tiền afff 30k", "nhận 500k youtube". Tên nền tảng khớp gần đúng; không rõ thì hệ
thống trả `needs_clarification`, khi đó hỏi chọn nền tảng có sẵn hoặc tạo mới bằng `create_finance_platform`. Ngày nhận
mặc định hôm nay nếu người dùng không nói.

## Sửa khoản thu vừa ghi
"sửa khoản vừa ghi thành 35k", "đổi nền tảng thành YouTube", "đổi ngày nhận sang hôm qua" → `update_finance_income` với ID khoản thu vừa ghi. Xem lại `/ca-nhan/tai-chinh/thu-nhap/<id>`.

## Xem dòng tiền và báo cáo thu nhập
Câu hỏi kiểu "tôi kiếm được bao nhiêu tuần này", "thu về bao nhiêu", "doanh thu tháng này", "tiền vào mấy ngày qua".
- Dòng tiền N ngày gần nhất: `get_finance_income_summary` với `days` (VD "dòng tiền 5 ngày").
- Theo khoảng ngày `from_date`..`to_date` hoặc theo tháng, năm và nền tảng.
- Danh sách nền tảng: `list_finance_platforms`. Sửa khoản thu: `update_finance_income`.
- Xóa khoản thu: `delete_personal_record` với `resource_type="income"`, xác nhận 2 bước.
