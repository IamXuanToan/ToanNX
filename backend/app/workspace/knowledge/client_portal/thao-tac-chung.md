# Cách thao tác chung với Trợ lý (tạo, sửa, xem lại, xóa)

## Sửa bản ghi vừa tạo, "đổi tên cái đó", "sửa lại cái vừa rồi"
Mỗi lần tạo/sửa, hệ thống ghi nhớ bản ghi đó trong hội thoại (khối "BẢN GHI VỪA THAO TÁC" có loại, tên, ID và tool sửa).
Khi người dùng nói "cái đó", "cái vừa tạo", "đổi tên thành…", "dời giờ", "sửa giá", "đổi slug" thì dùng đúng ID đó với tool
`update_*` tương ứng: nhắc việc `update_reminder`, link rút gọn `update_short_link`, thiết bị `update_asset`, phiếu bảo hành
`update_warranty_claim`, dịch vụ `update_subscription`, khoản thu `update_finance_income`, mã QR `update_qr_code`, trang
`update_page`, két sắt `update_vault_item`; hóa đơn, nền tảng, file, giao dịch ủng hộ dùng `update_my_record` với `resource` và
`record_id`. Đổi/sửa KHÔNG bao giờ xóa rồi tạo lại. Nhiều bản ghi cùng loại vừa thao tác
mà người dùng không nói rõ cái nào thì hỏi lại.

## Link xem lại sau khi tạo hoặc sửa
Mọi thao tác tạo/sửa thành công đều trả thẻ kết quả kèm link "Xem chi tiết" tới trang Portal của bản ghi:
nhắc việc `/ca-nhan/nhac-viec/<id>`, thiết bị `/ca-nhan/thiet-bi/<id>`, phiếu bảo hành `/ca-nhan/bao-hanh/<id>`, dịch vụ
`/ca-nhan/dich-vu/<id>`, két sắt `/ca-nhan/ket-sat/<id>`, link rút gọn `/ca-nhan/link-rut-gon/<id>`, mã QR
`/ca-nhan/ma-qr/<id>`, trang `/ca-nhan/trang/<id>`, khoản thu `/ca-nhan/tai-chinh/thu-nhap/<id>`, nền tảng
`/ca-nhan/tai-chinh/nen-tang/<id>`, hóa đơn `/ca-nhan/tai-chinh/hoa-don/<id>`, thư viện file `/ca-nhan/thu-vien`,
ủng hộ `/ca-nhan/quyen-gop`, hồ sơ `/ca-nhan/ho-so`. Link do hệ thống dựng, trợ lý không tự viết đường dẫn.

## Trả lời câu hỏi lựa chọn của hệ thống
Khi hệ thống hỏi (VD "Nhắc lúc mấy giờ?"), người dùng bấm nút, trả lời số thứ tự, gõ nhãn nút hoặc gõ giá trị: "14:30",
"2h chiều", "ngày mai", "05/12", "15 phút", "1 tiếng", "24 tháng". Trả lời việc khác hẳn thì nháp bị bỏ và trợ lý trò chuyện
bình thường. Nháp tự hết hạn sau 10 phút.

## Cách hiểu ngày giờ tiếng Việt
Theo giờ Việt Nam (UTC+7): "hôm nay/sáng nay/tối nay" = hôm nay; "ngày mai/sáng mai/chiều mai" = ngày mai; "ngày kia" = +2
ngày; "tuần sau" = +7 ngày; "05/12" là ngày 5 tháng 12 (đã qua thì sang năm sau); "11h", "11h30", "11 giờ 30", "14:30";
"2h chiều", "8h tối" cộng 12 giờ; "trước 2h", "sớm 30 phút" là khoảng nhắc trước, không phải giờ hẹn.

## Xóa luôn xác nhận 2 bước
Tra đúng bản ghi (hoặc dùng ID vừa thao tác), gọi `delete_personal_record` lần 1 để hỏi lại tên/ngày/số tiền; chỉ khi
người dùng đồng ý ở lượt sau mới xóa. Người dùng muốn "đổi" hay "sửa" thì không xóa.

## Bảng thao tác đầy đủ: tạo, xem, sửa, xóa từng loại dữ liệu
| Loại | Tạo | Xem | Sửa | Xóa (`resource_type`) |
| --- | --- | --- | --- | --- |
| Nhắc việc | `create_quick_reminder` | `get_pending_reminders` | `update_reminder` | `reminder` |
| Link rút gọn | `create_short_link` | `list_short_links` | `update_short_link` | `short_link` |
| Mã QR | `create_qr_code` | `list_qr_codes` | `update_qr_code` | `qr_code` |
| Trang cá nhân | `create_page` | `list_pages` | `update_page` (cả đường dẫn giữa) | `page` |
| Khoản thu | `create_finance_income` | `get_finance_income_summary` | `update_finance_income` | `income` |
| Nền tảng thu nhập | `create_finance_platform` | `list_finance_platforms` | `update_my_record` | `platform` |
| Hóa đơn / chứng từ | trên giao diện (cần file) | `list_my_records` | `update_my_record` | `invoice` |
| Thiết bị | `create_asset` | `get_assets_and_warranty` | `update_asset` | `asset` |
| Phiếu bảo hành | `create_warranty_claim` | `list_warranty_claims` | `update_warranty_claim` | `warranty_claim` |
| Dịch vụ định kỳ | `create_subscription` | `get_upcoming_subscriptions` | `update_subscription`, `renew_subscription` | `subscription` |
| Lần thanh toán dịch vụ | `renew_subscription` | `list_my_records` | không | `subscription_payment` |
| Két sắt | `create_vault_item` | `list_vault_items`, `reveal_vault_secret` | `update_vault_item` | `vault_item` |
| File thư viện | trên giao diện (tải lên) | `list_my_records` | `update_my_record` | `file` |
| Giao dịch ủng hộ | tự động từ SePay | `list_my_records` | `update_my_record` (ẩn/hiện) | không |
| Hồ sơ | không | `get_my_profile` | `update_my_profile` | không |
| Đường dẫn giữa | qua `update_page`/`create_page` khi có quyền | `list_my_records` | không | không |
Việc "trên giao diện" thì trợ lý hướng dẫn mở đúng trang Portal, không giả vờ đã làm.
