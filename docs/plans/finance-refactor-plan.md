# Plan refactor module Tài chính (finance)

Trạng thái: **đã duyệt, đang thực hiện**. Đã duyệt: dependency `cryptography`, rollback DB local finance.
Plan này thay toàn bộ phần mô hình dữ liệu và chức năng của `finance-module-plan.md`. Giữ nguyên: chữ ký HMAC SePay,
API SePay v2, outbox thông báo (System), bucket private cho file chứng từ.

Mục lục:

1. Mục tiêu và phạm vi
2. Luồng nghiệp vụ
3. Mô hình dữ liệu
4. Tiền tệ và tỷ giá
5. Thuế khấu trừ
6. Nhận diện nền tảng
7. Nhận giao dịch
8. Hóa đơn / chứng từ
9. Báo cáo và dashboard
10. Phân quyền
11. API
12. Frontend
13. Các phase thực hiện
14. Kịch bản test
15. Thông báo (xem plan riêng)
16. Ngoài phạm vi

---

## 1. Mục tiêu và phạm vi

Module **ghi nhận** thu nhập. Nó trả lời ba câu, theo năm hoặc tháng, tính bằng VNĐ:

1. **Tổng thu nhập** là bao nhiêu.
2. **Đã khấu trừ thuế**: bao nhiêu thu nhập đã bị nền tảng khấu trừ thuế trước khi trả, và tiền thuế bị khấu trừ
   là bao nhiêu.
3. **Chưa khấu trừ thuế**: bao nhiêu thu nhập chưa bị khấu trừ.

Kèm theo là hóa đơn/chứng từ để đối chiếu về sau.

Module **không** tính thuế phải nộp, không quyết toán, không giảm trừ. Việc đó do một phần khác xử lý sau, dựa trên số
liệu module này cung cấp.

Chức năng:

| # | Chức năng | Mục |
|---|---|---|
| 1 | Thu nhập: webhook SePay, lấy thủ công (xem trước), nhập tay; sửa được | 7 |
| 2 | Hóa đơn/chứng từ: file đính kèm, gắn giao dịch | 8 |
| 3 | Nền tảng + lịch sử khấu trừ thuế (đổi % giữa năm vẫn đúng) | 5 |
| 4 | Quy tắc nhận diện bằng regex | 6 |
| 5 | Ngoại tệ: quy đổi VNĐ bằng tỷ giá API hoặc nhập tay | 4 |
| 6 | Báo cáo năm/tháng, dashboard biểu đồ | 9 |
| 7 | Kết nối SePay riêng cho từng người dùng | 7.1 |
| 8 | Vai trò thành viên (thao tác dữ liệu của mình) cho mọi module | 10 |
| 9 | Thông báo: chuông 2 tab, realtime/popup Firebase, Email, Telegram bot riêng; cấu hình ở Hồ sơ cá nhân | 15 + `notification-system-plan.md` |

Bỏ hẳn: tài khoản ngân hàng, kênh nền tảng, loại thu nhập mặc định, chính sách thuế, khoản thuế, ước tính thuế, phân
bổ thu nhập, loại dòng tiền, nhật ký webhook, lịch sử đồng bộ, giao dịch tiền ra, biến env `SEPAY_WEBHOOK_SECRET`,
`SEPAY_API_TOKEN` và `TELEGRAM_BOT_TOKEN`.

---

## 2. Luồng nghiệp vụ

```
[Cấu hình một lần]
  Hệ thống: tiền tệ (VND gốc, USD...) ── tỷ giá (API Vietcombank / nhập tay)
  Nền tảng: tiền tệ mặc định + lịch sử khấu trừ thuế (từ ngày X: có/không, %)
  Quy tắc: regex nội dung chuyển khoản → nền tảng
  Kết nối SePay: token API + URL webhook + secret riêng của mỗi người
  Hồ sơ cá nhân → Thông báo: trình duyệt (Firebase), bot Telegram riêng, chat nhận, sự kiện × kênh

[Mỗi lần có tiền]
  Webhook SePay (VNĐ) ─┐
  Lấy thủ công SePay ──┼─→ chống trùng → đọc số tiền ─(không đọc được)→ lưu, đưa vào "Cần xử lý"
  Nhập tay (VNĐ/ngoại tệ)┘                 │
                                           ├→ quy đổi VNĐ (ngoại tệ)
                                           ├→ nhận diện nền tảng (regex)
                                           └→ tra mốc khấu trừ theo ngày nhận → chụp %, tiền thuế bị khấu trừ
                                              → 1 giao dịch thu nhập

[Chứng từ]
  Hóa đơn / chứng từ khấu trừ: tải file, gắn các giao dịch liên quan

[Xem]
  Dashboard: biểu đồ theo tháng
  Báo cáo năm/tháng: tổng thu nhập, đã khấu trừ (+ tiền thuế bị khấu trừ), chưa khấu trừ, từng giao dịch
```

Nguyên tắc:

- Mọi tổng tính bằng **VNĐ**.
- Mỗi giao dịch **tự giữ** tỷ giá, % và tiền thuế bị khấu trừ của nó. Đổi cấu hình sau đó không làm sai số cũ.
- Chỉ nhận tiền vào. Mọi dữ liệu thuộc về người tạo (`owner`).
- Giao dịch không xác định được vẫn được lưu và nằm ở **Cần xử lý**. Giao dịch không rõ số tiền thì không cộng vào
  tổng.

---

## 3. Mô hình dữ liệu

Model finance kế thừa `JournalTracker, CoreModel`, có `owner` (FK user). Service đặt `owner_field = "owner"` và
`manage_all_permission`.

Tổng quan quan hệ:

```
system.Currency ─< system.ExchangeRate
system.Currency ─< Platform ─< PlatformTaxRate
                    │   └──< ClassificationRule
                    └──< Income >── Invoice (M2M, Invoice.incomes)
system.Attachment ─< Invoice (M2M, Invoice.attachments)
user ── SepayConnection (1-1)
```

### 3.1 `system.Currency`

| Field | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `code` | char(3) | unique, ISO 4217 (`VND`, `USD`) |
| `name` | char(100) | "Đồng Việt Nam", "Đô la Mỹ" |
| `symbol` | char(10) | `₫`, `$` |
| `decimal_places` | smallint 0–4 | số lẻ của số tiền gốc: VND 0, USD 2 |
| `is_base` | bool | đúng một dòng `true` (VND); không sửa mã, không tắt, không xóa |
| `is_active` | bool | chỉ tiền tệ bật mới chọn được |
| `position` | int | thứ tự hiển thị |

Seed bằng migration: `VND` (gốc, 0 số lẻ) và `USD` (2 số lẻ).

### 3.2 `system.ExchangeRate`

| Field | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `currency` | FK Currency | không có dòng cho tiền tệ gốc |
| `rate_date` | date | ngày công bố |
| `rate` | Decimal(18,6) | số VNĐ cho 1 đơn vị ngoại tệ, > 0 |
| `source` | `VIETCOMBANK_TRANSFER_BUY` / `MANUAL` | |
| `fetched_at` | datetime null | thời điểm lấy từ API |
| `note` | text | |

Unique `(currency, rate_date, source)`. Dòng do API tạo chỉ đọc. Dòng `MANUAL` sửa/xóa được.

### 3.3 `Platform` (nền tảng)

| Field | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `name` | char(150) | |
| `code` | slug | unique theo owner |
| `default_currency` | FK Currency | tiền tệ điền sẵn khi nhập tay |
| `is_active` | bool | |
| `note` | text | |

Platform không chứa field thuế. "Khấu trừ hiện tại" hiển thị là mốc mới nhất có hiệu lực hôm nay.

### 3.4 `PlatformTaxRate` (lịch sử khấu trừ của nền tảng)

| Field | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `platform` | FK | |
| `effective_from` | date | áp dụng từ ngày này (giờ Việt Nam) tới trước mốc kế tiếp |
| `tax_withheld` | bool | nền tảng có khấu trừ thuế trước khi trả không |
| `rate` | Decimal(5,2) | %: `0 < rate < 100` khi `tax_withheld`, `= 0` khi không |
| `note` | text | |

Unique `(platform, effective_from)`.

### 3.5 `ClassificationRule` (quy tắc nhận diện)

| Field | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `name` | char(150) | |
| `platform` | FK | cùng owner |
| `pattern` | char(500) | regex, kiểm cú pháp khi lưu |
| `priority` | int | lớn thắng |
| `is_active` | bool | |

### 3.6 `Income` (giao dịch thu nhập)

| Nhóm | Field | Kiểu | Ý nghĩa |
|---|---|---|---|
| Chung | `source` | `MANUAL` / `SEPAY` | |
| | `received_at` | datetime (UTC) | thời điểm tiền vào |
| | `received_date` | date | ngày Việt Nam của `received_at`; dùng cho báo cáo, tỷ giá, mốc thuế |
| | `content` | text | nội dung chuyển khoản / mô tả |
| | `note` | text | ghi chú tham khảo |
| Tiền gốc | `currency` | FK Currency | tiền tệ của số gốc |
| | `original_amount` | Decimal(18,4) null | số gốc; null khi không rõ |
| Quy đổi | `exchange_rate` | Decimal(18,6) | VND = 1 |
| | `rate_source` | `BASE` / `API` / `MANUAL` / `BANK_ACTUAL` | mục 4.4 |
| | `rate_date` | date null | ngày của tỷ giá đã dùng |
| | `amount` | Decimal(18,0) null | **VNĐ thực nhận**; null khi không rõ |
| | `amount_status` | `OK` / `UNKNOWN` | |
| Nền tảng | `platform` | FK null | null = chưa nhận diện |
| | `matched_rule` | FK null | |
| | `is_platform_locked` | bool | người dùng tự chọn nền tảng → chạy lại quy tắc không ghi đè |
| Khấu trừ | `tax_withheld` | bool | đã bị khấu trừ thuế hay chưa (chụp) |
| | `tax_rate` | Decimal(5,2) | % đã bị khấu trừ (chụp) |
| | `tax_amount` | Decimal(18,0) null | tiền thuế đã bị khấu trừ (VNĐ) |
| | `gross_amount` | Decimal(18,0) null | thu nhập trước khấu trừ = `amount + tax_amount` |
| | `tax_rate_entry` | FK PlatformTaxRate null | mốc đã dùng |
| | `is_tax_manual` | bool | người dùng tự nhập khấu trừ |
| | `tax_status` | enum | `WITHHELD` / `NOT_WITHHELD` / `NO_RATE` / `UNCLASSIFIED` / `PENDING` |
| SePay | `sepay_id` | char null | unique theo owner |
| | `reference_code` | char | index |
| | `bank_name`, `account_last4` | char | chỉ hiển thị |
| | `sepay_payload` | JSON | dữ liệu gốc |

Thuộc tính suy ra (không lưu):

- `needs_review` = `amount_status = UNKNOWN` hoặc `tax_status ∈ {UNCLASSIFIED, NO_RATE}`.
- `has_invoice` = có ít nhất một hóa đơn gắn.

### 3.7 `Invoice` (hóa đơn / chứng từ)

Mục đích: lưu bằng chứng cho thu nhập và khoản thuế đã bị khấu trừ, để đối chiếu khi quyết toán. Ví dụ: chứng từ
khấu trừ thuế TNCN do nền tảng cấp, hóa đơn/invoice gửi khách nước ngoài, sao kê thanh toán, hợp đồng.

| Field | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `doc_type` | enum | `WITHHOLDING_CERTIFICATE` (chứng từ khấu trừ thuế), `INVOICE` (hóa đơn/invoice), `STATEMENT` (sao kê/bảng thanh toán), `CONTRACT` (hợp đồng), `OTHER` |
| `number` | char(100) | số hóa đơn/chứng từ; có thể rỗng; unique theo `(owner, doc_type, issuer, number)` khi không rỗng |
| `issuer` | char(255) | bên phát hành (Meta Platforms Ireland, Google Asia Pacific, khách A...) |
| `issuer_tax_code` | char(50) | mã số thuế bên phát hành, nếu có |
| `issued_on` | date | ngày lập |
| `period_from`, `period_to` | date null | kỳ thu nhập chứng từ bao trùm; `period_from <= period_to` |
| `platform` | FK Platform null | cùng owner |
| `currency` | FK Currency | tiền tệ ghi trên chứng từ |
| `original_amount` | Decimal(18,4) | tổng tiền ghi trên chứng từ (theo `currency`), ≥ 0 |
| `exchange_rate`, `rate_source`, `rate_date` | | quy đổi như mục 4, dùng `issued_on`; `BANK_ACTUAL` không áp dụng |
| `amount` | Decimal(18,0) | tổng tiền quy VNĐ |
| `original_tax_amount` | Decimal(18,4) null | tiền thuế đã khấu trừ ghi trên chứng từ (theo `currency`) |
| `tax_amount` | Decimal(18,0) null | tiền thuế quy VNĐ (cùng tỷ giá) |
| `attachments` | M2M `system.Attachment` | **bắt buộc ≥ 1**; file private (bucket private), cùng owner |
| `incomes` | M2M `Income` | không bắt buộc; chỉ giao dịch cùng owner, chưa xóa |
| `note` | text | |

Hiển thị đối chiếu (tính lúc đọc, không lưu, không kết luận đúng/sai): tổng VNĐ thực nhận, tổng tiền thuế bị khấu
trừ, tổng trước khấu trừ của các giao dịch đã gắn, đặt cạnh `amount`/`tax_amount` của chứng từ, kèm chênh lệch.

Hành vi:

- Xóa mềm giao dịch: liên kết với hóa đơn được giữ, nhưng không hiện trong đối chiếu và danh sách. Khôi phục giao
  dịch thì liên kết hiện lại.
- Xóa mềm hóa đơn: giao dịch không bị ảnh hưởng. File đính kèm vẫn nằm trong thư viện.
- Một giao dịch gắn được nhiều hóa đơn (ví dụ vừa có invoice vừa có chứng từ khấu trừ).

### 3.8 `SepayConnection` (kết nối SePay của một người)

| Field | Ý nghĩa |
|---|---|
| `owner` | unique: mỗi user một kết nối |
| `public_id` | UUID ngẫu nhiên nằm trong URL webhook |
| `api_token_encrypted` | token API SePay mã hóa bằng common `SecretCipher` (mục 5.4 plan thông báo), mục đích `finance.sepay.token`. API không trả token, chỉ trả 4 ký tự cuối. |
| `secret_version` | int. Secret webhook = `salted_hmac("finance.sepay.webhook", f"{public_id}:{secret_version}").hexdigest()`, không lưu DB. Tạo secret mới thì tăng số này. |
| `is_active` | |
| `last_webhook_at`, `last_sync_at`, `last_error` | |

### 3.9 Xóa

Xóa các model `BankAccount`, `BankTransaction`, `IncomeRecord`, `IncomeAllocation`, `SepayWebhookEvent`,
`SepaySyncRun`, `PlatformAccount`, `IncomePlatform` (thay bằng `Platform`), `TaxPolicy`, `TaxEntry`,
`FinanceDocument`, `FinanceDocumentLink` cùng mọi filter/serializer/service/view/permission/test của chúng.

---

## 4. Tiền tệ và tỷ giá

### 4.1 Webhook SePay và tiền tệ

Payload SePay **không có trường tiền tệ**. `transferAmount` là integer, đơn vị VNĐ
([tài liệu payload](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook#payload)). Do đó:

- Giao dịch từ webhook và lấy thủ công: `currency = VND`, `rate_source = BASE`, `exchange_rate = 1`.
- Bộ đọc payload vẫn kiểm phòng hờ trường `currency`: không có hoặc bằng `VND` thì là VND; mã khác thì
  `amount_status = UNKNOWN`, lý do "SePay trả tiền tệ chưa hỗ trợ: XXX".
- Ngoại tệ vào hệ thống qua nhập tay. Khách trả USD mà ngân hàng tự đổi sang VNĐ thì webhook báo VNĐ; người dùng ghi
  thêm số USD gốc (`BANK_ACTUAL`).

### 4.2 Nguồn tỷ giá

| Nguồn | Khi dùng | Cách lấy |
|---|---|---|
| `VIETCOMBANK_TRANSFER_BUY` | mặc định khi nhập tay ngoại tệ | `GET https://www.vietcombank.com.vn/api/exchangerates?date=YYYY-MM-DD`, trường `transfer` của mã tiền tệ (đã gọi thử, trả JSON theo ngày) |
| `MANUAL` | ngân hàng khác, tỷ giá trung tâm NHNN, hoặc API lỗi | nhập ở giao dịch/hóa đơn, hoặc thêm dòng trong Hệ thống → Tỷ giá |

Ghi chú:

- Ngân hàng Nhà nước không có API công khai. Trang sbv.gov.vn chặn truy cập tự động.
- Theo Thông tư 92/2015/TT-BTC, thu nhập ngoại tệ quy đổi theo tỷ giá mua vào của ngân hàng nơi cá nhân mở tài
  khoản, tại thời điểm phát sinh thu nhập. Đây chỉ là cơ sở chọn nguồn, không phải tư vấn thuế.
- Endpoint Vietcombank không có tài liệu chính thức, nên toàn bộ nằm sau `VietcombankRateClient`. Tỷ giá đã lấy được
  lưu DB, mỗi ngày mỗi tiền tệ chỉ gọi một lần.

### 4.3 Tra tỷ giá: `ExchangeRateService.resolve(currency, d, source)`

1. Tiền tệ gốc → `1`, `BASE`.
2. DB có `(currency, d, source)` → trả.
3. Gọi API ngày `d`. Có số thì lưu rồi trả. Không có (ngày nghỉ) thì lùi từng ngày, tối đa **7 ngày**, lấy ngày gần
   nhất có số và trả kèm `rate_date` thật.
4. Hết 7 ngày, API lỗi hoặc timeout (10 giây) → lỗi `FINANCE_EXCHANGE_RATE_UNAVAILABLE`. Không lưu bản ghi, yêu cầu
   nhập tay.

### 4.4 Công thức quy đổi

Ký hiệu: `A` = số gốc (làm tròn theo `decimal_places`), `R` = tỷ giá, `N` = VNĐ thực nhận.

| `rate_source` | Khi nào | Nhập | Tính |
|---|---|---|---|
| `BASE` | VND | `N` | `A = N`, `R = 1` |
| `API` | ngoại tệ, tỷ giá tự động | `A`, ngày | `R` theo 4.3; `N = làm_tròn(A × R)` tới đồng, ROUND_HALF_UP |
| `MANUAL` | ngoại tệ, tỷ giá tay | `A`, `R` | `N = làm_tròn(A × R)` |
| `BANK_ACTUAL` | tiền đã về VNĐ (webhook), người dùng ghi thêm số ngoại tệ gốc | `N` có sẵn, `A` | `R = làm_tròn(N / A, 6)`; **`N` giữ nguyên** |

| A | R | N |
|---|---|---|
| 1.000,00 USD | 25.600 | 25.600.000 |
| 1.250,50 USD | 25.600 | 32.012.800 |
| 333,33 USD | 25.611,5 | 8.537.081 (từ 8.537.081,295) |
| 500,00 USD, đã về 12.800.000 (`BANK_ACTUAL`) | 25.600 | 12.800.000 |

### 4.5 Khi nào quy đổi lại

| Sự kiện | Hành vi |
|---|---|
| Sửa `A`, `R`, tiền tệ, `rate_source` (không phải `BANK_ACTUAL`) | tính lại `N`, rồi tính lại khấu trừ (5.4) |
| Sửa `received_at` khi `rate_source = API` | lấy tỷ giá ngày mới |
| Sửa/xóa dòng `ExchangeRate` | không đổi giao dịch/hóa đơn đã có; có nút "Lấy lại tỷ giá" |
| Giao dịch webhook đổi sang ngoại tệ | bắt buộc `BANK_ACTUAL`; không sửa được `N` (`FINANCE_AMOUNT_LOCKED`) |

---

## 5. Thuế khấu trừ

Module chỉ ghi lại **thuế mà nền tảng đã khấu trừ trước khi trả**. Không tính thuế phải nộp.

Ký hiệu cho một giao dịch:

- `N`: VNĐ thực nhận.
- `r`: % khấu trừ.
- `T`: tiền thuế đã bị khấu trừ.
- `G`: thu nhập trước khấu trừ.

### 5.1 Tra mốc

```
d = received_date (giờ Việt Nam)
entry = PlatformTaxRate của platform có effective_from <= d, lấy effective_from lớn nhất
```

Ví dụ: Facebook có mốc 8% từ 01/01 và 10% từ 01/07. Giao dịch 00:10 ngày 01/07 giờ Việt Nam (tức 30/06 17:10 UTC)
dùng 10%.

### 5.2 Tính tiền bị khấu trừ

Số vào tài khoản là số đã trừ thuế, tức `N = G × (1 − r/100)`. Suy ra:

```
T = làm_tròn( N × r / (100 − r) )    tới đồng, ROUND_HALF_UP
G = N + T
```

| N | r | T | G |
|---|---|---|---|
| 9.200.000 | 8% | 800.000 | 10.000.000 |
| 9.000.000 | 10% | 1.000.000 | 10.000.000 |
| 9.500.000 | 5% | 500.000 | 10.000.000 |
| 1.000.000 | 5% | 52.632 | 1.052.632 |
| 25.600.000 | 10% | 2.844.444 | 28.444.444 |
| 3.000.000 | không khấu trừ | 0 | 3.000.000 |

Với giao dịch ngoại tệ, `T` tính trên `N` (VNĐ). Màn hình hiện thêm `T` quy theo ngoại tệ để tham khảo, không lưu.

### 5.3 Trạng thái

| `tax_status` | Khi nào | `tax_withheld` | `T` |
|---|---|---|---|
| `PENDING` | `amount_status = UNKNOWN` | false | null |
| `UNCLASSIFIED` | chưa có nền tảng | false | 0 |
| `NO_RATE` | có nền tảng, không có mốc `<= d` | false | 0 (cảnh báo) |
| `NOT_WITHHELD` | mốc không khấu trừ | false | 0 |
| `WITHHELD` | mốc khấu trừ `r%` | true | theo 5.2 |

Nhập khấu trừ tay: `is_tax_manual = true`. Người dùng nhập `tax_withheld`, `r`, `T` (ví dụ theo chứng từ); `G = N + T`.

### 5.4 Khi nào tính lại khấu trừ

| Sự kiện | Hành vi |
|---|---|
| Tạo giao dịch | tính theo 5.1–5.3 |
| Sửa `platform`, `received_at`, hoặc `N` đổi — giao dịch không manual | tính lại |
| Giao dịch manual | không tự tính; nút "Tính lại theo nền tảng" bỏ manual rồi tính |
| Thêm/sửa/xóa mốc `PlatformTaxRate` | không tự đổi giao dịch; API trả `affected_income_ids` (giao dịch không manual có mốc áp dụng thay đổi); FE hỏi "Cập nhật N giao dịch?" |
| `amount_status` từ `UNKNOWN` thành `OK` | tính lần đầu |

---

## 6. Nhận diện nền tảng (regex)

1. Chuẩn hóa `content`: bỏ dấu tiếng Việt, viết hoa, gộp khoảng trắng.
2. Duyệt quy tắc `is_active` của owner theo `priority` giảm dần, rồi `created_at` tăng dần. Dùng
   `regex.search(pattern, normalized, IGNORECASE, timeout=0.05s)`; quy tắc đầu tiên khớp thắng.
3. Không khớp thì `UNCLASSIFIED` và phát thông báo `INCOME_NEEDS_REVIEW`. Regex quá thời gian coi như không khớp, ghi
   log cảnh báo kèm id quy tắc.
4. Lưu quy tắc thì kiểm cú pháp (`FINANCE_RULE_PATTERN_INVALID`).
5. "Thử nội dung": trả quy tắc khớp, đoạn khớp, nền tảng.
6. "Nhận diện lại": cho các id đã chọn hoặc mọi giao dịch chưa nhận diện; bỏ qua giao dịch `is_platform_locked`; sau
   đó tính lại khấu trừ theo 5.4.

Seed (migration, cho superuser đầu tiên; người dùng khác bấm "Tạo mẫu"):

| Nền tảng | Tiền tệ mặc định | pattern |
|---|---|---|
| Facebook | VND | `FACEBOOK\|META\s*PLATFORMS` |
| YouTube | VND | `YOUTUBE\|GOOGLE\s*ASIA` |
| TikTok | VND | `TIKTOK\|BYTEDANCE` |
| Shopee | VND | `SHOPEE` |

Seed **không** tạo mốc khấu trừ, vì % thật do người dùng tự nhập.

---

## 7. Nhận giao dịch

### 7.1 Kết nối SePay (mỗi người tự cấu hình)

Trang Kết nối SePay:

- Dán token API → "Kiểm tra" (gọi `/v2/bank-accounts`, chỉ báo thành công/thất bại + số tài khoản liên kết).
- URL webhook riêng `…/api/v1/finance/sepay/webhook/<public_id>` (dựng bằng `build_backend_url`) và secret (sao
  chép, tạo mới).
- Các bước cấu hình bên my.sepay.vn: sự kiện "Chỉ tiền vào", xác thực HMAC-SHA256, tắt "Dùng để xác thực thanh toán".
- Bật/tắt, xóa kết nối.

### 7.2 Webhook

`POST /api/v1/finance/sepay/webhook/<public_id>`, công khai.

| Bước | Điều kiện | Phản hồi |
|---|---|---|
| 1 | `public_id` không có hoặc kết nối tắt | 401 |
| 2 | HMAC `X-SePay-Signature = sha256=HMAC(secret, "{X-SePay-Timestamp}.{raw body}")` sai, hoặc lệch giờ > 300 giây | 401, phát `WEBHOOK_AUTH_FAILED` (gom theo giờ) |
| 3 | body không phải JSON, hoặc thiếu `id` | 400 |
| 4 | `transferType != "in"` | 200 `{"success": true}`, không lưu |
| 5 | trùng: (a) `sepay_id` đã có; (b) cùng `reference_code` khác rỗng + `amount` + `received_date` | 200, không tạo |
| 6 | `transferAmount` thiếu, `null`, `0`, âm, không phải số nguyên, hoặc tiền tệ lạ | lưu với `amount_status = UNKNOWN`, `tax_status = PENDING`, lý do trong `note`; 200; phát `INCOME_NEEDS_REVIEW` |
| 7 | hợp lệ | lưu `currency = VND`, nhận diện, tính khấu trừ; 200; phát `INCOME_RECEIVED` |
| 8 | lỗi DB | 503 (SePay gửi lại) |

`transactionDate` là giờ Việt Nam (`YYYY-MM-DD HH:mm:ss`), đổi sang UTC khi lưu. Sai định dạng thì dùng thời điểm
nhận request và ghi lý do vào `note`.

### 7.3 Lấy thủ công (có màn xem trước)

1. Chọn khoảng ngày (tối đa 92 ngày) → `POST /finance/sepay/preview`. Gọi SePay `/v2/transactions` bằng token của
   người đó (phân trang, ≤ 3 req/s), chỉ lấy tiền vào. Mỗi dòng có trạng thái:
   - `NEW`: chưa có. Tích sẵn.
   - `EXISTS`: trùng, dữ liệu giống. Khóa, không chọn được.
   - `CHANGED`: trùng nhưng số tiền/thời gian/nội dung khác. Không tích sẵn, hiện cũ → mới.
   - `INVALID`: không đọc được số tiền. Tích được, nhập dạng `UNKNOWN`.
   - Mỗi dòng kèm nền tảng, % và tiền thuế bị khấu trừ dự kiến.
2. Tích dòng → `POST /finance/sepay/import {from, to, ids[]}`. Backend gọi lại SePay và chỉ xử lý id được chọn có
   trong kết quả (không tin dữ liệu client gửi).
3. Ghi đè:
   - `EXISTS` không bao giờ bị ghi đè.
   - `CHANGED` khi được tích chỉ cập nhật `amount`, `received_at`, `content`, `reference_code`, `sepay_payload`.
   - Nền tảng đã khóa, khấu trừ manual, ghi chú, số gốc `BANK_ACTUAL` và liên kết hóa đơn giữ nguyên.
4. Trả `{created, updated, skipped}`. Không lưu lịch sử chạy.

### 7.4 Nhập tay

Form:

- Ngày giờ nhận.
- Nền tảng.
- Tiền tệ (điền sẵn `default_currency`).
- Số tiền gốc.
- Cách lấy tỷ giá: "Tự động (Vietcombank)" hoặc "Nhập tay", chỉ khi ngoại tệ. Chế độ tự động gọi
  `/system/exchange-rates/resolve`, hiện tỷ giá và ngày tỷ giá.
- VNĐ thực nhận: tự tính theo 4.4, hiện ngay.
- Khấu trừ: điền sẵn theo mục 5 (có/không, %, tiền thuế bị khấu trừ, trước khấu trừ). Sửa thì `is_tax_manual`.
- Nội dung, ghi chú.

Hành vi khác:

- Giao dịch webhook: chỉ sửa được nền tảng, nội dung, ghi chú, khấu trừ, và thêm số ngoại tệ gốc (`BANK_ACTUAL`).
  `N` khóa, trừ khi `amount_status = UNKNOWN`.
- Cảnh báo khi đã có giao dịch cùng ngày + cùng VNĐ thực nhận.

---

## 8. Hóa đơn / chứng từ

### 8.1 Màn danh sách (`/quan-tri/tai-chinh/hoa-don`)

- Cột: loại, số, bên phát hành, ngày lập, kỳ, nền tảng, số tiền (gốc + VNĐ), tiền thuế ghi trên chứng từ, số giao dịch
  gắn, số file.
- Lọc: năm (theo `issued_on`), loại, nền tảng. Tìm theo số và bên phát hành.

### 8.2 Form (một form dùng cho tạo/sửa/xem, theo `FormPage`)

1. **Thông tin:** loại, số, bên phát hành, mã số thuế bên phát hành, ngày lập, kỳ từ/đến, nền tảng, ghi chú.
2. **Số tiền:** tiền tệ, tổng tiền, tiền thuế đã khấu trừ (nếu có), tỷ giá (tự động theo ngày lập hoặc nhập tay),
   các giá trị quy VNĐ.
3. **File:** `AttachmentPicker` chế độ private, cho chọn nhiều file, bắt buộc ít nhất 1.
4. **Giao dịch liên quan:** danh sách giao dịch cùng owner (lọc theo nền tảng của chứng từ và kỳ `period_from`–
   `period_to`, hoặc năm của `issued_on`), chọn bằng `ChoiceList`. Lưu thì đồng bộ M2M.
5. **Đối chiếu** (chỉ đọc): tổng N, T, G của giao dịch đã chọn so với tổng tiền/tiền thuế của chứng từ, kèm chênh lệch.

### 8.3 Ở màn Thu nhập

- Cột/nhãn "Có chứng từ".
- Bộ lọc "Chưa có chứng từ".
- Trong form giao dịch có mục "Chứng từ" liệt kê hóa đơn đã gắn (link mở).

### 8.4 Quy tắc

- `attachments` ≥ 1 (`FINANCE_INVOICE_ATTACHMENT_REQUIRED`).
- File phải thuộc owner hoặc người gọi có `system.attachment.manage_all`. Hệ thống tự chuyển file sang private nếu
  đang public (dùng `AttachmentService` có sẵn).
- `incomes` chỉ nhận giao dịch cùng owner, chưa xóa (`FINANCE_INVOICE_INCOME_INVALID`).
- `period_from <= period_to` (`FINANCE_INVOICE_PERIOD_INVALID`).
- Trùng `(doc_type, issuer, number)` khi `number` khác rỗng → `FINANCE_INVOICE_DUPLICATE`.
- `tax_amount <= amount`.

---

## 9. Báo cáo và dashboard

### 9.1 Ba con số chính

Với `S_ok` = giao dịch của người xem trong năm `Y` (tháng `M` nếu có), theo `received_date`, chưa xóa mềm,
`amount_status = OK`:

| Chỉ số | Công thức |
|---|---|
| **Tổng thu nhập** | `Σ N` trên `S_ok` |
| **Thu nhập đã khấu trừ thuế** | `Σ N` trên `S_ok` có `tax_withheld = true` |
| ↳ Tiền thuế đã bị khấu trừ | `Σ T` trên `S_ok` có `tax_withheld = true` |
| **Thu nhập chưa khấu trừ thuế** | `Σ N` trên `S_ok` có `tax_withheld = false` |
| ↳ trong đó chưa nhận diện nền tảng | `Σ N` trên `S_ok` có `tax_status = UNCLASSIFIED` |
| Số giao dịch | `count(S_ok)` |
| Cần xử lý | số giao dịch `needs_review` trong kỳ (kể cả `UNKNOWN`) |

Kiểm luôn đúng: **đã khấu trừ + chưa khấu trừ = tổng thu nhập**.

Không có chỉ số "thuế phải nộp", "thuế suất bình quân" hay ước tính nào. `G` chỉ hiện ở từng giao dịch và trong CSV,
để phần xử lý thuế sau dùng.

### 9.2 Màn Báo cáo (`/quan-tri/tai-chinh/bao-cao`)

- Chọn năm (mặc định năm nay), tháng (tùy chọn).
- Thẻ: Tổng thu nhập, Đã khấu trừ (kèm tiền thuế bị khấu trừ), Chưa khấu trừ (kèm phần chưa nhận diện), Số giao
  dịch, Cần xử lý (bấm để lọc).
- Bảng theo nền tảng: số giao dịch, tổng thu nhập, đã khấu trừ, tiền thuế bị khấu trừ, chưa khấu trừ; dòng con theo %.
- Bảng theo tháng (12 dòng): cùng các cột trên.
- Bảng theo tiền tệ: số giao dịch, tổng số gốc, tổng VNĐ.
- `DataTable` từng giao dịch: ngày, nền tảng, nội dung, số gốc + tiền tệ, tỷ giá (nguồn, ngày), VNĐ thực nhận, khấu
  trừ (có/không, %), tiền thuế bị khấu trừ, trước khấu trừ, trạng thái, nhãn "Đã sửa tay", "Có chứng từ". Bấm một
  dòng ở các bảng trên thì lọc danh sách này.
- Xuất CSV đúng bộ lọc, có dòng tổng.

### 9.3 Dashboard (`/quan-tri/tai-chinh`)

Dùng `recharts` qua `shares/components/ui/chart.tsx` (đã cài), màu `--chart-1..5`. Chọn năm; dữ liệu từ
`/finance/reports/monthly?year=` (năm chọn + năm trước).

1. Thẻ: tổng thu nhập, đã khấu trừ, chưa khấu trừ, tiền thuế bị khấu trừ, số giao dịch; % so với cùng kỳ năm trước.
2. Ba biểu đồ đường theo tháng: **tổng thu nhập**, **đã khấu trừ**, **chưa khấu trừ**; nét đứt là năm trước.
3. Lũy kế từ đầu năm (3 đường).
4. Số giao dịch mỗi tháng (cột) + trung bình mỗi giao dịch (đường).
5. Tiền thuế bị khấu trừ theo tháng (cột).
6. Thu nhập theo nền tảng từng tháng (vùng chồng).
7. Donut tỷ trọng nền tảng; donut tỷ trọng tiền tệ (quy VNĐ).
8. % tăng/giảm so với tháng trước.

Bấm một tháng thì mở Báo cáo đúng tháng đó.

---

## 10. Phân quyền

| Module | Quyền |
|---|---|
| system (mới) | `system.currency.{read,create,update,delete}`, `system.exchange_rate.{read,create,update,delete}` |
| finance | `finance.income.*`, `finance.invoice.*`, `finance.platform.*` (gồm lịch sử khấu trừ), `finance.rule.*` (mỗi nhóm `read,create,update,delete,manage_all`), `finance.report.read`, `finance.sepay.manage` |

Vai trò mẫu `<MODULE>_MEMBER` ("Thành viên <module>"):

- `ModuleDescriptor.member_permissions` là **bắt buộc** với mọi module có quyền. Mẫu phải khớp quyền của module và
  không có `manage_all`.
- `RoleSeedService` sinh ba vai trò MANAGER / VIEWER / MEMBER cho mỗi module.

| Module | `member_permissions` |
|---|---|
| finance | `finance.{income,invoice,platform,rule}.{read,create,update,delete}`, `finance.report.read`, `finance.sepay.manage` |
| system | `system.attachment.{read,create,update,delete}`, `system.attachment_folder.{read,create,update,delete}`, `system.currency.read`, `system.exchange_rate.read`, cùng các quyền thông báo ở mục 10 plan thông báo |
| utilities | `utilities.{short_link,qr_code,page}.{read,create,update,delete}`, `utilities.page_path.read` |
| novel | `novel.novel.{read,create,update,delete}`, chương của truyện mình (`chapter_service` lọc theo owner truyện), `novel.{author,genre,tag}.read` |

`resolve` tỷ giá chỉ cần `system.exchange_rate.read`. Dòng tỷ giá lấy từ API do service tự lưu (dữ liệu công khai).

---

## 11. API

System:

| Method | Path | Ghi chú |
|---|---|---|
| CRUD | `/system/currencies` | khóa tiền tệ gốc; không xóa tiền tệ đang dùng |
| CRUD | `/system/exchange-rates` | lọc `currency`, `date_from`, `date_to`, `source`; dòng API chỉ đọc |
| GET | `/system/exchange-rates/resolve?currency=&date=&source=` | `{rate, rate_date, source}` |
| POST | `/system/exchange-rates/fetch` | `{currency, date}` lấy lại từ API |

Finance:

| Method | Path | Ghi chú |
|---|---|---|
| CRUD | `/finance/platforms` | |
| POST | `/finance/platforms/seed-defaults` | tạo 4 nền tảng + quy tắc mẫu cho người gọi |
| GET | `/finance/platforms/<id>/tax-rate?date=` | mốc áp dụng ngày đó |
| CRUD | `/finance/platforms/<id>/tax-rates` | lưu xong trả `affected_income_ids` |
| CRUD | `/finance/rules` | |
| POST | `/finance/rules/test` | |
| CRUD | `/finance/incomes` | lọc `year`, `month`, `platform`, `tax_status`, `tax_withheld`, `tax_rate`, `currency`, `source`, `needs_review`, `has_invoice`, `is_tax_manual`, `search`; `bulk-delete`, `history` |
| POST | `/finance/incomes/reclassify` | |
| POST | `/finance/incomes/recalculate-tax` | `{ids, reset_manual}` |
| POST | `/finance/incomes/<id>/refresh-rate` | |
| GET | `/finance/incomes/export` | CSV |
| CRUD | `/finance/invoices` | lọc `year`, `doc_type`, `platform`, `search`; body gồm `attachment_ids`, `income_ids` |
| GET | `/finance/reports/summary?year=&month=` | mục 9.1 + theo nền tảng, theo tiền tệ |
| GET | `/finance/reports/monthly?year=` | 12 tháng năm chọn + năm trước |
| GET/PUT/DELETE | `/finance/sepay/connection` | |
| POST | `/finance/sepay/connection/test`, `/finance/sepay/connection/rotate-secret` | |
| POST | `/finance/sepay/preview`, `/finance/sepay/import` | |
| POST | `/finance/sepay/webhook/<public_id>` | công khai, HMAC |

Mã lỗi finance:

- `FINANCE_RULE_PATTERN_INVALID`
- `FINANCE_TAX_RATE_INVALID`
- `FINANCE_TAX_RATE_DUPLICATE_DATE`
- `FINANCE_EXCHANGE_RATE_UNAVAILABLE`
- `FINANCE_CURRENCY_INACTIVE`
- `FINANCE_AMOUNT_LOCKED`
- `FINANCE_INVOICE_ATTACHMENT_REQUIRED`
- `FINANCE_INVOICE_INCOME_INVALID`
- `FINANCE_INVOICE_PERIOD_INVALID`
- `FINANCE_INVOICE_DUPLICATE`
- `FINANCE_SEPAY_NOT_CONNECTED`
- `FINANCE_SEPAY_TOKEN_INVALID`
- `FINANCE_SEPAY_RANGE_TOO_LONG`

Mã lỗi system: `SYSTEM_CURRENCY_BASE_LOCKED`, `SYSTEM_CURRENCY_IN_USE`.

Sự kiện thông báo: `INCOME_RECEIVED`, `INCOME_NEEDS_REVIEW`, `WEBHOOK_AUTH_FAILED`. Cả ba khai `audience = OWNER`,
`permission = finance.income.read` (riêng `webhook_auth_failed` là `finance.sepay.manage`), gửi qua `NotificationService.notify(recipient=owner kết nối)` (plan thông báo mục 5.2).

---

## 12. Frontend

Hệ thống (mới):

| Mục | vi | Màn |
|---|---|---|
| Tiền tệ | `/quan-tri/he-thong/tien-te` | `DataTable` + `CurrencyForm` |
| Tỷ giá | `/quan-tri/he-thong/ty-gia` | `DataTable` lọc tiền tệ/ngày/nguồn; "Lấy theo ngày"; `ExchangeRateForm` (nhập tay) |

Finance (7 mục, vi `/quan-tri/tai-chinh/...`, en `/admin/finance/...`):

| Mục | vi | Màn |
|---|---|---|
| Tổng quan | `/quan-tri/tai-chinh` | dashboard 9.3 |
| Thu nhập | `/thu-nhap` | `DataTable`, `IncomeForm` (7.4); tab "Cần xử lý"; bulk "Nhận diện lại", "Tính lại khấu trừ" |
| Hóa đơn | `/hoa-don` | mục 8 |
| Nền tảng | `/nen-tang` | `PlatformForm` + section "Lịch sử khấu trừ" (bảng mốc, thêm/sửa/xóa, hộp xác nhận cập nhật giao dịch) |
| Quy tắc nhận diện | `/quy-tac` | `RuleForm` + ô "Thử nội dung" |
| Báo cáo | `/bao-cao` | 9.2 |
| Kết nối SePay | `/ket-noi-sepay` | 7.1 + nút "Lấy giao dịch" mở màn xem trước 7.3 (checkbox + `TableBulkBar`) |

Cấu trúc code:

- Xóa bộ cấu hình chung cũ: `finance-resources.ts`, `finance-entity-form`, `finance-resource-table`,
  `finance-field-control`, `*-panels.tsx`.
- Mỗi tài nguyên một form + một bảng.
- Service mỗi model một file: `income`, `invoice`, `platform`, `platform-tax-rate`, `classification-rule`,
  `finance-report`, `sepay-connection` (finance); `currency`, `exchange-rate` (system).
- `modules/finance/lib/tax.ts`, `lib/currency.ts` tính xem trước trong form bằng số nguyên nhỏ nhất của tiền tệ.
  Unit test dùng bảng số 4.4, 5.2.
- Định dạng tiền: tra `common-catalog.md`. Đã có thì mở rộng, chưa có thì thêm `shares/lib/format-money.ts` (theo
  `decimal_places`) và cập nhật catalog.

---

## 13. Các phase thực hiện

Mỗi phase xong mới sang phase sau. Chỉ chạy kiểm tra cho phần sửa của phase đó.

| Phase | Việc | Xong khi |
|---|---|---|
| **0. Chuẩn bị** | `uv add cryptography`; `migrate finance zero`; xóa migration finance; xóa file mục 3.9 và FE finance cũ (rollback system thông báo nằm ở N2 plan thông báo) | `manage.py check` qua |
| **0b. Hệ thống thông báo** | làm phase N0–N7 của `notification-system-plan.md` (gồm rollback `system 0009`, `SecretCipher`, bỏ `TELEGRAM_BOT_TOKEN`) | đạt tiêu chí N0–N7; làm sau phase 1, trước phase 8 |
| **1. Vai trò thành viên** | `member_permissions` bắt buộc + validate; hằng `MODULE_MEMBER_*`; `RoleSeedService` sinh MEMBER; khai cho system/utilities/novel; `chapter_service` lọc theo owner truyện | `test_role_seed_service.py`, `test_module_registry.py`, test member mỗi module qua; rule `AGENTS.md`/`CLAUDE.md`/`prompt.md`/`rules/backend.md` §9/`authorization.md` cập nhật |
| **2. Tiền tệ, tỷ giá (system)** | model + migration seed VND/USD; `CurrencyService`, `ExchangeRateService`, `VietcombankRateClient` (URL trong `system/constants/exchange_rate.py`); view/serializer/quyền; gọi thử endpoint thật một lần (ngày thường, ngày nghỉ, ngày tương lai, mã không có) và ghi kết quả vào docstring; FE Tiền tệ, Tỷ giá | test mỗi endpoint (fake client) qua; R5–R7 mục 14 qua |
| **3. Model finance** | 7 model mục 3.3–3.8 + `0001_initial` + `0002_seed_defaults`; repository | `migrate` → `migrate finance zero` → `migrate` chạy được |
| **4. Bộ tính** | `CurrencyConverter` (4.4), `TaxWithholdingCalculator` (5.1–5.3): service thuần, không HTTP | `test_currency_converter.py`, `test_tax_withholding_calculator.py` qua đủ bảng số và ranh giới ngày |
| **5. Nhận diện** | `ClassificationService` (mục 6) | `test_classification_service.py` qua (ưu tiên, dấu, regex sai, timeout) |
| **6. Thu nhập, nền tảng, quy tắc** | service/view/serializer/filter `Platform`, `PlatformTaxRate`, `ClassificationRule`, `Income`; `IncomeService`: quy đổi → nhận diện → khấu trừ, các quy tắc 4.5 và 5.4 | test mỗi endpoint qua |
| **7. Hóa đơn** | `InvoiceService` (mục 8.4), view/serializer/filter; đối chiếu | I1–I8 mục 14 qua |
| **8. SePay** | `SepayConnectionService` (mã hóa token, secret dẫn xuất, rotate, test); `SepayWebhookService` (7.2); `SepayImportService` (7.3); `module.py` (quyền, `member_permissions`, `WebhookDefinition` path `/finance/sepay/webhook/{public_id}`, sự kiện); bỏ 2 biến env | S1–S29 và 14.6 qua |
| **9. Báo cáo** | `FinanceReportService.summary/monthly/export_csv` theo 9.1 (aggregate DB) | kỳ vọng 14.3 khớp từng số |
| **10. Hợp đồng API** | `spectacular --validate --fail-on-warn`; `pnpm api:types`; `test_endpoint_access.py` (webhook công khai), `test_module_conventions.py`, `test_openapi_schema.py` | qua |
| **11. Frontend finance** | mục 12; messages vi/en; mã lỗi trong `src/messages/{vi,en}.json` | eslint/prettier/typecheck; `lib/tax`, `lib/currency`, `api-contract`, `module-registry` test; `pnpm build` qua |
| **12. Tài liệu** | rule bí mật theo người dùng (`common.md` §5 + `AGENTS.md`/`CLAUDE.md`/`prompt.md`): token bên thứ ba của từng người lưu DB qua `SecretCipher`; rule thông báo (sự kiện khai `audience`/`permission`, phát kèm `owner`); `finance-setup-guide.md` viết lại (thêm phần tạo bot Telegram riêng); `deployment.md` (bỏ 3 biến env, cảnh báo đổi `DJANGO_SECRET_KEY`); `.env.example`; `common-catalog.md`; `SYSTEM_CONTEXT.md`; `authorization.md`; ghi chú thay thế trong `finance-module-plan.md` | đã soát |
| **13. E2E, kiểm tay** | `finance.spec.ts` chạy kịch bản mục 14 qua UI + webhook ký tay (tỷ giá dùng dòng `MANUAL` dựng sẵn); kiểm playwright desktop + mobile; `graphify update .` | qua |

---

## 14. Kịch bản test

Không gọi SePay hay Vietcombank thật:

- Webhook: test dựng payload mục 7.2 và ký bằng secret dẫn xuất của kết nối test.
- API SePay và Vietcombank: dùng fake client.
- Dữ liệu dùng chung: `app/finance/tests/scenarios/finance_2026.py`.

### 14.1 Cấu hình

| Loại | Dữ liệu |
|---|---|
| Tiền tệ | VND (gốc), USD (2 số lẻ) |
| Fake tỷ giá Vietcombank USD | 2026-12-15: 25.600; 2026-12-25: 25.650; 2026-12-26/27 (cuối tuần): không có |
| Facebook | VND; mốc 2026-01-01 khấu trừ 8% |
| YouTube | VND; mốc 2026-01-01 khấu trừ 5% |
| Shopee | VND; mốc 2026-01-01 không khấu trừ |
| Làm tự do | USD; mốc 2026-01-01 không khấu trừ |
| Upwork | USD; mốc 2026-01-01 khấu trừ 10%; quy tắc `UPWORK` |

### 14.2 Giao dịch

Giờ trong bảng là giờ Việt Nam.

| Bước | Hành động | Kết quả mong đợi |
|---|---|---|
| S1 | Webhook `1001`, 2026-03-15 10:20, "META PLATFORMS IRELAND THANH TOAN QC", 9.200.000, ref `FT26074001` | Facebook, khấu trừ 8%, T 800.000, G 10.000.000 |
| S2 | Webhook `1002`, 2026-06-30 23:30, "FACEBOOK PAYOUT", 4.600.000 | Facebook 8%, T 400.000 |
| S3 | Thêm mốc Facebook 2026-07-01 khấu trừ 10% | `affected_income_ids` rỗng; S1, S2 vẫn 8% |
| S4 | Webhook `1003`, 2026-07-01 00:10 (UTC 06-30 17:10), "FACEBOOK PAYOUT", 9.000.000 | Facebook **10%**, T 1.000.000 |
| S5 | Webhook `1004`, 2026-08-10, "GOOGLE ASIA PACIFIC YOUTUBE", 9.500.000, ref `FT26222004` | YouTube 5%, T 500.000 |
| S6 | Webhook `1009`, cùng ref/số tiền/ngày với S5 | trùng, không tạo |
| S7 | Webhook `1005`, 2026-09-05, "SHOPEE THANH TOAN DON HANG", 3.000.000 | Shopee, không khấu trừ |
| S8 | Webhook `1006`, 2026-10-01, "CHUYEN TIEN AN TRUA", 250.000 | `UNCLASSIFIED`, cần xử lý |
| S9 | Gửi lại `1006` | trùng |
| S10 | Webhook `1007`, `transferType: "out"` | bỏ qua |
| S11 | Webhook ký sai secret | 401 |
| S12 | `public_id` không tồn tại | 401 |
| S13 | Webhook `1010`, 2026-11-02, "TT TU MT PLTF 0211", 4.500.000 | `UNCLASSIFIED` |
| S14 | Sửa S13 → Facebook | khóa nền tảng, 10%, T 500.000, G 5.000.000 |
| S15 | Nhập tay 2026-11-20, Làm tự do, **VND** 15.000.000 | không khấu trừ |
| S16 | Nhập tay 2026-12-05, Facebook, 18.000.000 | 10%, T 2.000.000, G 20.000.000 |
| S17 | Nhập tay 2026-12-20, YouTube, 1.000.000 | 5%, T **52.632** (làm tròn), G 1.052.632 |
| S18 | Nhập tay 2026-12-28, Facebook, 9.000.000, sửa tiền thuế bị khấu trừ thành 950.000 (theo chứng từ) | manual, T 950.000, G 9.950.000 |
| S19 | Webhook `1008`, 2025-12-31 23:50, "FACEBOOK PAYOUT", 4.600.000 | `NO_RATE` (chưa có mốc), thuộc năm 2025 |
| S20 | Nhập tay 2026-12-15, Upwork, **1.000,00 USD**, tỷ giá tự động | R 25.600 (`API`), N 25.600.000, 10%, T 2.844.444, G 28.444.444; dòng tỷ giá được lưu |
| S21 | Nhập tay 2026-12-26 (thứ bảy), Làm tự do, **500,00 USD**, tự động | lùi về 12-25: R 25.650, N 12.825.000, không khấu trừ |
| S22 | Nhập tay 2026-12-10, Làm tự do, **300,00 USD**, tỷ giá tay 25.000 | `MANUAL`, N 7.500.000 |
| S23 | Webhook `1011`, 2026-12-12, "UPWORK ESCROW PAYOUT", 12.800.000 | Upwork 10%, T 1.422.222, G 14.222.222 |
| S24 | Sửa S23: thêm số gốc 500,00 USD | `BANK_ACTUAL`, R 25.600, N giữ 12.800.000 |
| S25 | Webhook `1012`, 2026-12-13, `transferAmount: "abc"` | lưu `UNKNOWN`/`PENDING`, 200, cần xử lý, **không cộng vào tổng** |
| S26 | Webhook `1013`, `transferAmount: 0` *(riêng, xóa ngay sau test)* | như S25 |
| S27 | Nhập tay USD ngày 2026-12-27, tự động, fake API lỗi, DB không có tỷ giá 7 ngày trước *(riêng)* | 400 `FINANCE_EXCHANGE_RATE_UNAVAILABLE`, không lưu |
| S28 | Payload có `"currency": "EUR"` *(riêng)* | `UNKNOWN`, lý do "tiền tệ chưa hỗ trợ: EUR" |
| S29 | Sửa S23 thành N 13.000.000 | 400 `FINANCE_AMOUNT_LOCKED` |

### 14.3 Kỳ vọng báo cáo năm 2026

Tính vào tổng: S1, S2, S4, S5, S7, S8, S13/14, S15, S16, S17, S18, S20, S21, S22, S23/24 = 15 giao dịch.
Cần xử lý: S8 (chưa nhận diện), S25 (không rõ số tiền) = 2.

| Chỉ số | Giá trị |
|---|---|
| **Tổng thu nhập** | **141.775.000** |
| **Thu nhập đã khấu trừ thuế** | **103.200.000** |
| ↳ Tiền thuế đã bị khấu trừ | **10.469.298** |
| **Thu nhập chưa khấu trừ thuế** | **38.575.000** |
| ↳ trong đó chưa nhận diện | 250.000 |
| Số giao dịch | 15 |
| Cần xử lý | 2 |

Kiểm: 103.200.000 + 38.575.000 = 141.775.000.

Theo nền tảng:

| Nền tảng | % | Số GD | Thu nhập | Đã khấu trừ | Tiền thuế bị khấu trừ | Chưa khấu trừ |
|---|---|---|---|---|---|---|
| Facebook | 8% | 2 | 13.800.000 | 13.800.000 | 1.200.000 | 0 |
| Facebook | 10% | 4 | 40.500.000 | 40.500.000 | 4.450.000 | 0 |
| YouTube | 5% | 2 | 10.500.000 | 10.500.000 | 552.632 | 0 |
| Upwork | 10% | 2 | 38.400.000 | 38.400.000 | 4.266.666 | 0 |
| Shopee | không | 1 | 3.000.000 | 0 | 0 | 3.000.000 |
| Làm tự do | không | 3 | 35.325.000 | 0 | 0 | 35.325.000 |
| Chưa nhận diện | | 1 | 250.000 | 0 | 0 | 250.000 |
| **Cộng** | | **15** | **141.775.000** | **103.200.000** | **10.469.298** | **38.575.000** |

Theo tháng (tháng 1, 2, 4, 5 bằng 0):

| Tháng | Số GD | Thu nhập | Đã khấu trừ | Tiền thuế bị khấu trừ | Chưa khấu trừ |
|---|---|---|---|---|---|
| 3 | 1 | 9.200.000 | 9.200.000 | 800.000 | 0 |
| 6 | 1 | 4.600.000 | 4.600.000 | 400.000 | 0 |
| 7 | 1 | 9.000.000 | 9.000.000 | 1.000.000 | 0 |
| 8 | 1 | 9.500.000 | 9.500.000 | 500.000 | 0 |
| 9 | 1 | 3.000.000 | 0 | 0 | 3.000.000 |
| 10 | 1 | 250.000 | 0 | 0 | 250.000 |
| 11 | 2 | 19.500.000 | 4.500.000 | 500.000 | 15.000.000 |
| 12 | 7 | 86.725.000 | 66.400.000 | 7.269.298 | 20.325.000 |
| **Năm** | **15** | **141.775.000** | **103.200.000** | **10.469.298** | **38.575.000** |

Theo tiền tệ:

| Tiền tệ | Số GD | Tổng gốc | Tổng VNĐ |
|---|---|---|---|
| VND | 11 | 83.050.000 ₫ | 83.050.000 |
| USD | 4 (S20, S21, S22, S23) | 2.300,00 $ | 58.725.000 |

Kiểm thêm:

- Báo cáo tháng 7/2026: 1 giao dịch; thu nhập 9.000.000, đã khấu trừ 9.000.000, tiền thuế 1.000.000.
- Báo cáo năm 2025: 1 giao dịch (S19); thu nhập 4.600.000, chưa khấu trừ 4.600.000 (cần xử lý vì `NO_RATE`).
- Lũy kế 2026 tổng thu nhập: cuối tháng 6 là 13.800.000, cuối tháng 9 là 35.300.000, cuối tháng 12 là 141.775.000.
- Nhập S25 thành 1.000.000 và để chưa nhận diện: tổng 142.775.000, chưa khấu trừ 39.575.000, cần xử lý 2.

### 14.4 Hóa đơn / chứng từ

| Bước | Hành động | Kết quả |
|---|---|---|
| I1 | Tạo `WITHHOLDING_CERTIFICATE`, Meta Platforms Ireland, số `FB-2026-H2`, kỳ 2026-07-01..2026-12-31, Facebook, VND, tổng 35.000.000, thuế 3.500.000, 1 file PDF, gắn S4, S14, S16 | tạo thành công; đối chiếu: N 31.500.000, T 3.500.000, G 35.000.000; chênh lệch tổng 0, thuế 0 |
| I2 | Tạo `INVOICE` khách A, `INV-001`, 2026-12-10, Làm tự do, **300,00 USD**, tỷ giá tay 25.000, gắn S22 | `amount` 7.500.000; đối chiếu N 7.500.000, chênh lệch 0 |
| I3 | Tạo hóa đơn không có file | 400 `FINANCE_INVOICE_ATTACHMENT_REQUIRED` |
| I4 | Gắn giao dịch của user khác | 400 `FINANCE_INVOICE_INCOME_INVALID` |
| I5 | Kỳ từ 2026-12-31 đến 2026-07-01 | 400 `FINANCE_INVOICE_PERIOD_INVALID` |
| I6 | Tạo lại `WITHHOLDING_CERTIFICATE` Meta số `FB-2026-H2` | 400 `FINANCE_INVOICE_DUPLICATE` |
| I7 | Lọc giao dịch 2026 "Chưa có chứng từ" | 11 (15 − S4, S14, S16, S22) |
| I8 | Xóa mềm S16 | I1 đối chiếu còn S4, S14: N 13.500.000, T 1.500.000, G 15.000.000; chênh lệch tổng 20.000.000, thuế 2.000.000; khôi phục S16 thì trở lại như I1 |

Hóa đơn không làm thay đổi số báo cáo ở 14.3.

### 14.5 Sửa lịch sử khấu trừ (dữ liệu riêng)

| Bước | Hành động | Kết quả |
|---|---|---|
| C1 | Sửa mốc Facebook 10% từ 2026-07-01 thành 2026-08-01 | `affected_income_ids` = [S4] (S18 manual nên không có) |
| C2 | Xác nhận cập nhật | S4 → 8%, T = 9.000.000 × 8 / 92 = **782.609**, G 9.782.609 |
| C3 | Báo cáo 2026 | tiền thuế bị khấu trừ = 10.469.298 − 1.000.000 + 782.609 = **10.251.907**; tổng thu nhập và đã khấu trừ không đổi |
| C4 | Không xác nhận ở C1 | S4 giữ 10% |

### 14.6 Tỷ giá, lấy thủ công, phân quyền

| Bước | Hành động | Kết quả |
|---|---|---|
| R1 | Thêm dòng tỷ giá `MANUAL` 12-15 = 25.700 | S20 vẫn 25.600 |
| R2 | S20 "Lấy lại tỷ giá" (API) | vẫn 25.600 (dòng đã đệm) |
| R3 | S20 đổi sang tỷ giá tay 25.700 | N 25.700.000, T 2.855.556, G 28.555.556 |
| R4 | Đổi ngày S21 thành 2026-12-15 | R 25.600, N 12.800.000 |
| R5 | Tắt USD rồi nhập tay USD | 400 `FINANCE_CURRENCY_INACTIVE` |
| R6 | Xóa USD đang được dùng | 400 `SYSTEM_CURRENCY_IN_USE` |
| R7 | Sửa/xóa VND | 400 `SYSTEM_CURRENCY_BASE_LOCKED` |
| P1 | Fake SePay trả `1001` (giống), `1004` (9.600.000), `2001` (mới, Shopee 2.000.000), `2002` (tiền ra), `2003` (`transferAmount: null`) | xem trước: `EXISTS`, `CHANGED`, `NEW`, `INVALID`; không có `2002` |
| P2 | Import chỉ `2001` | created 1; `1004` giữ 9.500.000 |
| P3 | Import thêm `1004` | updated 1; N 9.600.000, T 505.263, G 10.105.263; nền tảng và liên kết hóa đơn giữ nguyên |
| P4 | Import id không có trong kết quả SePay | skipped |
| Q1 | User B (`FINANCE_MEMBER`) tạo nền tảng, giao dịch, hóa đơn của mình | thành công |
| Q2 | B xem danh sách/báo cáo | chỉ dữ liệu của B |
| Q3 | B sửa/xóa giao dịch hay hóa đơn của A | 404 |
| Q4 | B gắn file của A vào hóa đơn | 400 |
| Q5 | Webhook `public_id` của A ký bằng secret của B | 401 |
| Q6 | `FINANCE_MANAGER` | thấy dữ liệu mọi người |
| Q7 | B sửa tỷ giá `MANUAL` | 403 |

---

## 15. Thông báo (xem plan riêng)

Toàn bộ thông báo nằm ở [notification-system-plan.md](notification-system-plan.md) và làm cùng đợt:

- chuông 2 tab Cá nhân / Hệ thống, mức info/warning/error;
- realtime + popup trình duyệt qua Firebase;
- Email, Telegram bot riêng mỗi người;
- tùy chọn theo sự kiện trong Hồ sơ cá nhân;
- gửi bất đồng bộ qua outbox.

Phần finance chỉ cần:

- Khai 3 sự kiện trong `module.py` theo mục 9 của plan thông báo: `finance.income.received`,
  `finance.income.needs_review`, `finance.sepay.webhook_auth_failed`. Cả ba có `scope PERSONAL`, `audience OWNER`.
- Webhook/import gọi `NotificationService.notify(..., recipient=connection.owner)` sau khi lưu thu nhập. Lỗi thông báo
  không làm hỏng webhook (kịch bản B1 của plan thông báo).
- Token SePay mã hóa bằng common `SecretCipher` (mục 5.4 plan thông báo).

---

## 16. Ngoài phạm vi

- Tính thuế phải nộp, quyết toán, giảm trừ gia cảnh, ước tính thuế (phần khác xử lý, dùng số liệu của module này).
- Tỷ giá tự động từ ngân hàng khác Vietcombank; tỷ giá trung tâm NHNN qua API.
- Lãi/lỗ chênh lệch tỷ giá; quản lý tài khoản ngân hàng; giao dịch tiền ra.
- Đọc nội dung file chứng từ tự động (OCR).

Nguồn:

- [SePay webhook payload](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook#payload)
- [Cục Thuế trả lời về quy đổi tỷ giá khi tính thuế TNCN](https://thuvienphapluat.vn/ma-so-thue/phap-luat-thue/cuc-thue-tra-loi-ve-quy-doi-ty-gia-khi-tinh-thue-tncn-tu-tien-luong-tien-cong-291458-222129.html)
- [Thu nhập từ nước ngoài quy đổi tỷ giá nào](https://congtyluatacc.vn/thu-nhap-tu-nuoc-ngoai-ke-khai-thue-tncn-quy-doi-ty-gia-nao/)
