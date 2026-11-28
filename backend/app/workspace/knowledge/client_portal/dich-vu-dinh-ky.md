# Dịch vụ định kỳ (Subscription) — /ca-nhan/dich-vu, /ca-nhan/gia-han

## Dịch vụ định kỳ là gì
Dịch vụ trả tiền theo chu kỳ (VPS, tên miền, SaaS, giải trí, viễn thông): tên, nhà cung cấp, nhóm, giá, tiền tệ, chu kỳ
gia hạn (Hàng tuần, Hàng tháng, Hàng quý, 6 tháng, Hàng năm, Tùy chỉnh theo ngày), ngày gia hạn tiếp theo, số ngày nhắc
trước, tự động trừ tiền, trang quản trị dịch vụ (link tới trang của nhà cung cấp) và lịch sử thanh toán.

## Thêm dịch vụ định kỳ qua chat
Tool `create_subscription` với `name`, `amount` (VD "thêm Netflix 200k"). Hệ thống hỏi lần lượt: **Chu kỳ gia hạn**, (nếu
Tùy chỉnh) **Số ngày chu kỳ**, **Số ngày nhắc trước**, **Tự động trừ tiền** (Có hoặc Không). Ngoại tệ cần tỷ giá; không
có tỷ giá tham chiếu thì hệ thống báo cần nhập tỷ giá.

## Gia hạn, xem và sửa dịch vụ
Câu thường gặp: "tôi vừa gia hạn Netflix", "đổi giá dịch vụ vừa thêm thành 260k", "tắt tự động trừ tiền", "nhắc trước 7 ngày cho VPS". Dịch vụ vừa tạo có sẵn ID → `update_subscription`. Xem lại tại `/ca-nhan/dich-vu/<id>`.
- Ghi nhận đã gia hạn, thanh toán: `renew_subscription` (tự lùi ngày gia hạn tiếp theo theo chu kỳ).
- Sắp gia hạn trong N ngày: `get_upcoming_subscriptions`; chi tiêu tháng: `get_spending_summary`.
- Sửa: `update_subscription`. Xóa: `delete_personal_record` với `resource_type="subscription"`, xác nhận 2 bước.
