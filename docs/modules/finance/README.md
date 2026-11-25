# Module Finance (`finance`)

Theo dõi khoản thu, hóa đơn/chứng từ, nền tảng thu tiền và thuế suất, quy tắc tự phân loại giao dịch, kết nối
SePay nhận biến động số dư. Phụ thuộc `system` (tiền tệ, file riêng tư).

- BE: `backend/app/finance/` · FE: `frontend/src/modules/finance/`
- URL quản trị: `/quan-tri/tai-chinh/...` · nhóm `finance` (Tổng quan, Báo cáo, Thu nhập, Hóa đơn toàn sàn)
- URL cá nhân (Portal): `/ca-nhan/tai-chinh/...` (Dashboard, Báo cáo, Thu nhập, Hóa đơn, Nền tảng, Quy tắc phân loại, Kết nối SePay riêng của tài khoản)
- Cài đặt SePay: [../../guides/finance-setup.md](../../guides/finance-setup.md)

## Model

`Income`, `Invoice` (file chứng từ riêng tư, gắn nhiều khoản thu), `Platform`, `PlatformTaxRate`,
`ClassificationRule`, `SepayConnection` (API token lưu mã hóa bằng `SecretCipher`).

## Quyền

| Class                | Tài nguyên                  | `MEMBER`                     |
| -------------------- | --------------------------- | ---------------------------- |
| `IncomePermission`   | `income` (+ `manage_all`)   | read, create, update, delete |
| `InvoicePermission`  | `invoice` (+ `manage_all`)  | read, create, update, delete |
| `PlatformPermission` | `platform` (+ `manage_all`) | read, create, update, delete |
| `RulePermission`     | `rule` (+ `manage_all`)     | read, create, update, delete |
| `ReportPermission`   | `report`                    | read                         |
| `SepayPermission`    | `sepay`                     | manage                       |

## Màn quản trị (Admin)

Quản trị viên có quyền `manage_all` và `system.user.read` có thể lọc Tổng quan, Báo cáo, Khoản thu, Hóa đơn theo từng người dùng (`?owner=`).

| Cụm       | Màn                 | Route                  |
| --------- | ------------------- | ---------------------- |
| Tổng quan | Dashboard · Báo cáo | `tai-chinh`, `bao-cao` |
| Giao dịch | Khoản thu · Hóa đơn | `thu-nhap`, `hoa-don`  |

## Màn cá nhân (Client Portal)

Tất cả người dùng cá nhân tự quản lý tài chính và cấu hình phân loại riêng tại `/ca-nhan/tai-chinh/...` (luôn khóa dữ liệu theo tài khoản đang đăng nhập và ẩn bộ lọc/cột người dùng, kể cả khi người dùng có `manage_all`):

| Cụm              | Màn                                          | Route                                  |
| ---------------- | -------------------------------------------- | -------------------------------------- |
| Tổng quan        | Dashboard · Báo cáo                          | `tai-chinh`, `bao-cao`                 |
| Giao dịch        | Khoản thu · Hóa đơn                          | `thu-nhap`, `hoa-don`                  |
| Cấu hình cá nhân | Nền tảng · Quy tắc phân loại · Kết nối SePay | `nen-tang`, `quy-tac`, `ket-noi-sepay` |

## Sự kiện thông báo

`finance.income.received`, `finance.income.needs_review`, `finance.sepay.webhook_auth_failed` (hằng ở
`constants/finance_notification_event.py`).

## Webhook

`finance.sepay`: SePay gọi khi có biến động số dư; khai trong `ModuleDescriptor.webhooks`, hiện ở
Hệ thống → Webhook.

## Chức năng liên quan

[File công khai và riêng tư](../../features/attachment-visibility.md): chứng từ luôn riêng tư.
