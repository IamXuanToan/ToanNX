# Hướng dẫn cài đặt và dùng module Tài chính

Cập nhật 22/11/2026. Thiết kế: [plans/finance-refactor-plan.md](../plans/finance-refactor-plan.md). Thông báo
(chuông, Telegram, popup trình duyệt): [notification-setup-guide.md](notification-setup.md).

## 1. Module làm gì

Theo dõi **thu nhập** của từng người: khoản nào nền tảng đã khấu trừ thuế (bao nhiêu), khoản nào chưa. Module
**không tính số thuế phải nộp**; báo cáo chỉ ra tổng thu nhập, đã khấu trừ (kèm tiền thuế), chưa khấu trừ.

| Màn | Đường dẫn (vi) | Làm được gì |
| --- | --- | --- |
| Tổng quan | `/quan-tri/tai-chinh` | KPI năm, 3 đường theo tháng (tổng / đã khấu trừ / chưa khấu trừ), lũy kế, tăng trưởng, theo nền tảng |
| Báo cáo | `/quan-tri/tai-chinh/bao-cao` | Bảng năm/tháng: tổng, đã khấu trừ, tiền thuế, chưa khấu trừ, chưa phân loại |
| Thu nhập | `/quan-tri/tai-chinh/thu-nhap` | Nhập tay hoặc từ SePay; sửa được mọi khoản; xuất CSV |
| Hóa đơn | `/quan-tri/tai-chinh/hoa-don` | Hóa đơn/chứng từ (file riêng tư) gắn với các khoản thu, để sau này khấu trừ thuế |
| Nền tảng | `/quan-tri/tai-chinh/nen-tang` | Facebook, YouTube… kèm **lịch sử tỷ lệ khấu trừ** |
| Quy tắc | `/quan-tri/tai-chinh/quy-tac` | Regex trên nội dung chuyển khoản → nền tảng; thử trên chuỗi mẫu |
| Kết nối SePay | `/quan-tri/tai-chinh/ket-noi-sepay` | Token API, URL + secret webhook riêng, lấy giao dịch thủ công có xem trước |

### Công thức

- Nền tảng có tỷ lệ khấu trừ `r` (%) hiệu lực từ một ngày. Khoản thu dùng tỷ lệ có `effective_from` lớn nhất
  ≤ ngày nhận (giờ VN). Ví dụ Facebook 8% từ 01/01, 10% từ 01/07.
- Tiền nhận thực `N`, tiền thuế `T = làm tròn(N × r / (100 − r))`, thu nhập trước thuế `G = N + T`.
- Mỗi khoản **chụp lại** `r` và `T` lúc tạo; đổi lịch sử tỷ lệ thì hệ thống báo các khoản bị ảnh hưởng, chỉ
  tính lại khi bấm. Có thể sửa tay `r`/`T` từng khoản.
- Ngoại tệ: `N = làm tròn(A × tỷ giá)` quy về VNĐ. Tỷ giá lấy từ Vietcombank (mua chuyển khoản, lùi tối đa 7
  ngày khi nghỉ lễ) hoặc nhập tay ở Hệ thống → Tỷ giá; hoặc nhập số VNĐ thực nhận từ ngân hàng.
- Webhook SePay không có trường tiền tệ: luôn là VNĐ. Không đọc được số tiền → khoản ở trạng thái "cần xem lại".

## 2. Phân quyền

Mỗi module có 3 vai trò: `FINANCE_MANAGER` (mọi quyền, thấy dữ liệu mọi người), `FINANCE_VIEWER` (chỉ xem),
`FINANCE_MEMBER` (xem/tạo/sửa/xóa nền tảng, thu nhập, hóa đơn, quy tắc **do mình tạo**, xem báo cáo của mình,
kết nối SePay của mình).
Gán vai trò ở Hệ thống → Người dùng.

## 3. Kết nối SePay (mỗi người tự làm)

Không còn biến env `SEPAY_API_TOKEN`/`SEPAY_WEBHOOK_SECRET`. Chỉ `SEPAY_ENV` (sandbox/production) dùng chung.

1. my.sepay.vn → Cấu hình công ty → API Access → tạo API Token (quyền đọc giao dịch).
2. Vào **Kết nối SePay**, dán token → Lưu (token lưu DB đã mã hóa, chỉ hiện 4 ký tự cuối).
3. Màn hiện **URL webhook riêng** `https://api.toannx.com/api/v1/finance/sepay/webhook/<mã>` và **secret**
   (dẫn xuất từ `DJANGO_SECRET_KEY`, không lưu DB).
4. my.sepay.vn → Webhooks → Thêm webhook: dán URL, sự kiện **Chỉ tiền vào**, tắt "Dùng để xác thực thanh toán",
   xác thực **HMAC-SHA256** với secret ở bước 3, bật tự gửi lại khi server lỗi.
5. Thử: Test mode → Mô phỏng giao dịch; khoản thu mới xuất hiện ở Thu nhập và có thông báo trên chuông.

Lấy giao dịch thủ công: **Kết nối SePay → Lấy giao dịch** chọn khoảng ngày → màn xem trước (Mới / Đã có / Khác) → tích chọn → Nhập. Khoản đã có không bao giờ bị ghi đè nếu không chọn.

Đổi `DJANGO_SECRET_KEY` hoặc bấm **Tạo secret mới** → secret cũ hết hiệu lực, phải dán secret mới vào SePay.
Token bị lộ → thu hồi ở my.sepay.vn, tạo token mới rồi lưu lại.

## 4. Kiểm tra sau khi cài

- Backend: `uv run pytest app/finance -q` (kịch bản năm 2026 ở `app/finance/tests/scenarios/finance_2026.py`
  khớp báo cáo: tổng 141.775.000, đã khấu trừ 103.200.000, thuế 10.469.298, chưa khấu trừ 38.575.000).
- Frontend: `pnpm e2e tests/e2e/finance.spec.ts`.
