# Module Tài chính cá nhân — thu nhập, giao dịch ngân hàng (SePay), chứng từ, thuế
> **Đã thay thế** phần mô hình dữ liệu và chức năng bởi [finance-refactor-plan.md](finance-refactor-plan.md) và
> [notification-system-plan.md](../22/notification-system-plan.md) (11/2026).


Ngày 21/11/2026 · bản 5 (chống trùng theo mã giao dịch; mẫu thông báo; rà soát hoàn thiện).
Trạng thái: **ĐÃ TRIỂN KHAI GIAI ĐOẠN 0–6** (code + test) — còn kiểm thật V1/V2/V3/V4 và checklist go-live (giai đoạn 7).

Tiến độ (21/11/2026):

- Giai đoạn 0: `EmailService` thành instance method + `send_template`/`send_now`; `SettingKey`, tham số
  keyword-only; `notification_events` + `NotificationEventDefinition` trong `ModuleDescriptor`; thêm `requests`,
  `regex`; ghi lý do `noqa`. Sửa thêm lỗi có sẵn: OAuth Google/GitHub gọi `BusinessRuleError(code, message)` sai
  chữ ký → 500 thay vì mã lỗi (đã có test).
- Giai đoạn 0b: `Attachment.visibility`, kho riêng tư `STORAGES["private"]`, `AttachmentStorageService`,
  `GET /attachments/{id}/content`, `POST /attachments/{id}/visibility`, quyền `system.attachment.read_private`,
  XLSX/CSV/XML, dọn file và đo dung lượng theo hai kho; FE: props `AttachmentPicker`/`AttachmentUpload`, công tắc
  Riêng tư, biểu tượng khóa, nút chuyển trong dialog chi tiết, trang `/tep/[id]`.
- Khác thiết kế ở 5.6: file riêng tư **không trả `url = null`** mà trả `url` = URL API có kiểm quyền
  (`/api/v1/system/attachments/{id}/content`, tuyệt đối theo domain request) — giữ nguyên contract, mọi nơi
  đang dùng `url` không vỡ, vẫn không lộ link R2. Không thêm field `content_url`.
- V5: CSP hiện có `img-src https:` nên link ký R2 hiển thị được, không cần sửa.
- Giai đoạn 1–6 (21/11/2026): module `finance` (13 model, API theo mục 5–7, quyền 5.4), webhook HMAC + chống trùng
  theo mã giao dịch + lấy thủ công API v2, nhập tay/sửa/khôi phục/gộp, engine quy tắc (`regex` timeout), khoản thu +
  phân bổ + hủy, thuế ước tính có bản chụp thuế suất, chứng từ riêng tư + liên kết, dashboard/báo cáo năm (giờ VN,
  CSV, in), thông báo Email/Telegram qua outbox `system`. FE: nhóm "Tài chính" (Tổng quan, Giao dịch, Thu nhập,
  Nền tảng + Kênh, Quy tắc, Chứng từ, Thuế + Chính sách, Báo cáo, Kết nối SePay) và Hệ thống → Thông báo.
- Khác thiết kế: biểu đồ dashboard vẽ bằng CSS (chưa thêm `shadcn chart`/recharts để không thêm dependency FE);
  bảng/form các tài nguyên dựng từ cấu hình (`modules/finance/constants/finance-resources.ts`) + panel nghiệp vụ.
- Giai đoạn 7 còn: chạy E2E (chưa viết spec finance), V1 (mã webhook = mã API, kiểm trong Test mode), V2 (gửi thử
  webhook sau deploy), V3 (định dạng `/start <mã>` khi thêm bot vào nhóm — code đã nhận cả `/start@bot <mã>`),
  V4 (bucket R2 riêng tư), checklist go-live SePay.

Cơ sở: source `develop` (21/11/2026), `docs/rules/*`, `docs/common-catalog.md`, `SYSTEM_CONTEXT.md`,
`docs/guides/deployment.md`, skill `sepay` đối chiếu developer.sepay.vn và sepay.vn/bang-gia.html (đọc 21/11/2026), tài liệu
giới hạn Vercel.

Đọc nhanh: mục 1 (quyết định) → mục 3 (SePay) → mục 5 (model) → mục 6 (UI) → mục 11 (giai đoạn) → mục 12 (rà soát, việc cần kiểm).

---

## 1. Quyết định đã chốt

| #   | Chủ đề                         | Quyết định                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Phạm vi xem file chứng từ      | Theo luật Thư viện hiện có: người upload xem file của mình; superuser hoặc người có `system.attachment.manage_all` xem tất cả                                                                                                                                                                                                                   |
| D2  | Upload chứng từ                | Giữ luật Thư viện, upload qua bộ chọn dùng chung `AttachmentPicker` (đã có upload kéo thả qua `canUpload`); màn Chứng từ chỉ truyền props (5.6), không tự viết bộ upload                                                                                                                                                                        |
| D3  | Dependency                     | Duyệt `regex` (timeout chống regex treo), `shadcn chart` (recharts), khai `requests` tường minh. Không `openpyxl`: xuất CSV (Excel mở được) + in PDF bằng trang in                                                                                                                                                                              |
| D4  | Nhận giao dịch                 | Chỉ nhận webhook SePay (đơn giản, dưới 50 giao dịch/tháng). Không tự gọi API định kỳ, không GitHub Actions, không cron đồng bộ. Webhook mất sau khi SePay hết lượt gửi lại thì dùng nút **Lấy giao dịch từ SePay** (người dùng bấm, chọn khoảng ngày)                                                                                           |
| D4b | Đối chiếu                      | Chủ dự án tự kiểm lại cuối tháng; hệ thống phải lưu đủ mã giao dịch (id SePay, mã tham chiếu ngân hàng) và ngày giờ để đối chiếu sao kê. Không làm tính năng theo dõi hạn mức gói FREE                                                                                                                                                          |
| D5  | Thời hạn Journal               | Theo rule hiện tại (`JOURNAL_RETENTION_DAYS`, mặc định 365 ngày); không ngoại lệ cho `finance`                                                                                                                                                                                                                                                  |
| D6  | Ngân hàng                      | Ngân hàng và tài khoản cấu hình ở SePay; hệ thống chỉ nhận qua webhook (+ lấy thủ công khi cần). Không màn tạo tài khoản ngân hàng thủ công                                                                                                                                                                                                     |
| D7  | Xác minh thu nhập              | Giao dịch nhận diện được → khoản thu **đã xác nhận** ngay. Chỉ giao dịch không nhận diện được (hoặc xung đột) là **chưa xác minh**, chờ xử lý. Mọi kết quả đều sửa được                                                                                                                                                                         |
| D8  | Tiền vào/ra                    | Webhook nhận cả tiền vào và tiền ra; dashboard tách rõ "Thu nhập" và "Dòng tiền ngân hàng (vào/ra)"                                                                                                                                                                                                                                             |
| D9  | Sửa giao dịch                  | Không tin dữ liệu 100 %: mọi trường của giao dịch ngân hàng đều sửa được (số tiền, chiều, ngày giờ, nội dung, mã tham chiếu, tài khoản). Bản SePay gửi về được giữ nguyên trong `source_snapshot` để so sánh, khôi phục và chống trùng (4.8)                                                                                                    |
| D10 | File riêng tư                  | Attachment có chế độ `public`/`private`. File riêng tư chỉ người upload, superuser hoặc người có quyền `system.attachment.read_private` xem được; người khác (kể cả có link) không xem được, không dò ra được. Nơi upload tự đặt chế độ qua props của bộ chọn; Thư viện có nút chuyển công khai/riêng tư; có màn "không có quyền xem tệp" (5.6) |
| D11 | Loại file chứng từ             | Mở thêm XLSX, CSV, XML cho Thư viện (chỉ lưu, không đọc nội dung)                                                                                                                                                                                                                                                                               |
| D12 | Giao dịch ngân hàng có 3 nguồn | Webhook (chính), **nhập tay**, **lấy qua API** (bấm); mọi giao dịch sửa được (D9)                                                                                                                                                                                                                                                               |
| D13 | Chống trùng                    | **Theo mã giao dịch** (mã tham chiếu ngân hàng `reference_code`) là khóa chính giữa các nguồn (3.4)                                                                                                                                                                                                                                             |
| D14 | Nội dung thông báo             | Tiền vào/ra, mã giao dịch, nền tảng, số tiền, nội dung (7.1)                                                                                                                                                                                                                                                                                    |

---

## 2. Nguyên tắc nền

1. **Giao dịch ngân hàng ≠ thu nhập.** `BankTransaction` là giao dịch ngân hàng (**sửa được**, giữ bản gốc SePay để
   đối chiếu — D9); `IncomeRecord` là khoản thu nhập. Thống kê thu nhập chỉ cộng `IncomeRecord`, không cộng giao dịch ngân hàng → không thể đếm trùng
   giữa tiền ngân hàng và khoản nhập tay.
2. **Thực nhận ≠ trước thuế; thuế ước tính ≠ thuế đã nộp.** Số trước thuế và thuế chỉ có khi người dùng nhập theo
   căn cứ; số ước tính luôn có nhãn "ước tính".
3. **Không nhận webhook không chứng minh không có giao dịch.** Có nút lấy thủ công từ API cho trường hợp webhook bị
   mất; báo cáo ghi rõ phạm vi dữ liệu.
4. **Không suy đoán**: nền tảng, trùng lặp, tỷ giá, năm tính thuế.
5. **Không xóa dữ liệu tài chính**: giao dịch không có API xóa (trừ giao dịch thử); nền tảng ngừng dùng thì tắt;
   khoản thu sai thì hủy (`void`) có lý do.
6. **Dùng lại trước**: IAM, Attachment, Journal, Setting, EmailService, `to_ascii`, base view/service.
7. **Ít hạ tầng**: không Redis/Celery/worker/scheduler mới; chỉ webhook + PostgreSQL + cron dọn dẹp hằng ngày đã có.

---

## 3. SePay — đã xác minh trên tài liệu chính thức

| Chủ đề                   | Sự thật                                                                                                                                                                                                                                                                                                                                                                               | Nguồn                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Payload webhook          | `id` (integer, không đổi qua retry/replay), `gateway`, `transactionDate` (`YYYY-MM-DD HH:mm:ss` giờ VN, không múi giờ), `accountNumber`, `subAccount`, `code` (có thể null), `content` (gốc), `transferType` `in`/`out`, `description` (có thể rỗng, thường có tên người chuyển), `transferAmount` (integer VND, luôn dương), `accumulated` (có thể 0), `referenceCode` (có thể rỗng) | `/vi/sepay-webhooks/tich-hop-webhook`                 |
| Phản hồi hợp lệ          | HTTP 200/201 + body đúng `{"success": true}` trong 30 giây                                                                                                                                                                                                                                                                                                                            | cùng trang                                            |
| Xác thực                 | HMAC-SHA256 ký `{X-SePay-Timestamp}.{raw body}`, header `X-SePay-Signature: sha256=<hex>`, chống replay ±5 phút                                                                                                                                                                                                                                                                       | `/vi/sepay-webhooks/xac-thuc`                         |
| Retry                    | Xem 3.2: tự gửi lại 8 lần trong ~33 phút; sau đó webhook bị đánh dấu Failed và **không tự gửi nữa**                                                                                                                                                                                                                                                                                   | `/vi/sepay-webhooks/xu-ly-loi#lich-retry`             |
| Gửi lại thủ công         | Trên trang quản lý webhook của SePay, admin gửi lại được kể cả log đã thành công                                                                                                                                                                                                                                                                                                      | `/vi/sepay-webhooks/tich-hop-webhook#chong-trung-lap` |
| API giao dịch            | `GET https://userapi.sepay.vn/v2/transactions`, Bearer token cả công ty, `id` là **UUID**, `since_id` + `transaction_date_sort=asc`, `per_page ≤ 100`, `has_more`; không có trường tên người chuyển                                                                                                                                                                                   | `/vi/sepay-api/v2/giao-dich/danh-sach`                |
| Rate limit API           | 3 request/giây/IP, 429 + `Retry-After`                                                                                                                                                                                                                                                                                                                                                | `/vi/sepay-api/v2/xac-thuc`                           |
| Định danh                | Webhook `id` (số) ≠ API `id` (UUID) → mã chung giữa hai nguồn là mã giao dịch ngân hàng (`referenceCode` / `reference_number`); mã này có thể trống hoặc dùng chung cho giao dịch lô, nên chống trùng kèm tài khoản + chiều + số tiền (3.4)                                                                                                                                           | skill `sepay`, `/vi/sepay-api/v2/nang-cap-tu-v1`      |
| Quản lý webhook bằng API | Chỉ qua OAuth2 → UI hướng dẫn cấu hình trên my.sepay.vn, không giả lập                                                                                                                                                                                                                                                                                                                | `/vi/sepay-oauth2/api-webhook`                        |
| IP gửi ra                | 7 IPv4 + 2 IPv6, có thể đổi                                                                                                                                                                                                                                                                                                                                                           | `/vi/dia-chi-ip`                                      |
| Test mode                | Môi trường riêng (`userapi-sandbox.sepay.vn`, token/secret riêng), **Mô phỏng giao dịch**                                                                                                                                                                                                                                                                                             | skill `sepay`                                         |
| Gói FREE                 | 50 giao dịch **tiền vào**/tháng, có webhook + API; vượt thì tính phí (nhu cầu thực tế dưới 50, không làm tính năng theo dõi)                                                                                                                                                                                                                                                          | sepay.vn/bang-gia.html                                |

Lưu ý ngân hàng (D6): với tài khoản cá nhân ở BIDV, MSB, OCB, KienlongBank (kết nối API, không SMS), SePay chỉ nhận
tiền qua VA. Chủ dự án xác nhận đã cấu hình ngân hàng trên SePay; hệ thống chỉ hiện thông tin `va_only` lấy từ API
ở trang tài khoản, không bắt cấu hình gì thêm.

### 3.1 Nhận webhook

- `POST /api/v1/finance/sepay/webhook`: public (`authentication_classes = []`, `[AllowAny]`, không cookie nên không
  CSRF), có rate limit theo IP, liệt kê trong `test_endpoint_access.py`. Phản hồi bằng `JsonResponse`
  `{"success": true}`: ngoại lệ có ghi chú với envelope chuẩn vì đây là hợp đồng với bên thứ ba.
- Thứ tự trong request:
  1. Đọc `request.body` (bytes gốc) trước khi chạm `request.data`.
  2. `SEPAY_WEBHOOK_SECRET` rỗng → từ chối tất cả (401).
  3. Kiểm timestamp ±300 giây, so HMAC constant-time; sai → 401, log chỉ request_id + lý do.
  4. Một transaction: insert-ignore `SepayWebhookEvent` (unique `sepay_webhook_id`) → tạo/gộp `BankTransaction`
     (3.4) → phân loại.
  5. Lưu được hoặc trùng `id` → 200 `{"success": true}`; DB lỗi → 503 để SePay retry.
  6. Thông báo chạy sau commit; lỗi thông báo không ảnh hưởng giao dịch.
- Cấu hình trên my.sepay.vn (UI hướng dẫn từng bước): sự kiện **Cả hai** (vào + ra); **tắt** "Dùng để xác thực thanh
  toán" (không có đơn hàng); **tắt** "Chỉ gửi khi có mã thanh toán" và lọc mã; xác thực HMAC-SHA256; **bật** "Tự
  động gửi lại khi server trả lỗi" và cảnh báo khi lỗi liên tiếp.

### 3.2 Khi server lỗi: SePay có gửi lại không? (đã kiểm tài liệu)

| Lỗi phía server                                                                      | SePay xử lý                                                         | Kết quả                                                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Không kết nối được (DNS, connection refused, lỗi SSL) hoặc quá 30 giây không trả lời | **Luôn gửi lại**, không cần bật gì                                  | Server sống lại trong ~33 phút thì không mất                                 |
| Server trả HTTP ngoài 2xx (500, 503…)                                                | Chỉ gửi lại khi bật **Tự động gửi lại khi server trả lỗi**          | Bật tùy chọn này thì giống dòng trên; không bật thì **mất ngay** từ lần đầu  |
| Lịch gửi lại                                                                         | 8 lần (ngay, +1, +1, +2, +3, +5, +8, +13 phút), tổng ~33 phút       | Hết 8 lần → webhook **Failed**, SePay không tự gửi nữa (có cảnh báo nếu bật) |
| Sau khi Failed                                                                       | Admin vẫn **gửi lại thủ công** được từ lịch sử gửi trên my.sepay.vn | Cách thứ nhất để lấy lại                                                     |

Kết luận: không mất nếu server sập dưới ~33 phút và đã bật "Tự động gửi lại khi server trả lỗi". Sập lâu hơn thì có
hai cách lấy lại, đều do người dùng chủ động:

1. Gửi lại thủ công trên my.sepay.vn (webhook vào như bình thường, trùng `id` thì bỏ qua).
2. Nút **Lấy giao dịch từ SePay** trong trang Kết nối SePay (mục 3.3).

### 3.3 Lấy giao dịch thủ công qua API (D4)

- Chỉ chạy khi người dùng bấm (quyền `finance.sepay.sync`): chọn khoảng ngày (mặc định 7 ngày gần nhất, tối đa 31
  ngày một lần) → BE gọi `GET /v2/transactions?transaction_date_from=…&transaction_date_to=…&per_page=100`, đọc đến
  `has_more=false`, nghỉ ≥ 350 ms/trang (3 request/giây), gặp 429 thì dừng và báo.
- Mỗi dòng đi qua đúng luồng chống trùng của webhook (3.4): đã có thì chỉ gắn UUID API vào bản ghi cũ, chưa có thì
  tạo mới (`origin = api`). Không bao giờ tạo bản thứ hai cho cùng một khoản tiền.
- Kết quả hiện ngay: số lấy về, số mới, số đã có, số nghi trùng; ghi một dòng `SepaySyncRun` để xem lại lịch sử.
- Không cursor, không chạy định kỳ, không khóa phức tạp (bấm hai lần cùng lúc vẫn an toàn nhờ unique + gộp).

### 3.4 Chống trùng theo mã giao dịch (D13)

"Mã giao dịch" = mã tham chiếu ngân hàng (`referenceCode` ở webhook, `reference_number` ở API, số "FT…"/"Số bút toán"
trên sao kê). Đây là mã duy nhất **chung cho cả ba nguồn** (webhook, API, nhập tay), vì id của SePay khác nhau giữa
webhook (số) và API (UUID).

Thứ tự kiểm khi một giao dịch đến (webhook, API hoặc người dùng lưu form nhập tay):

| Bước | Kiểm                                                                                | Kết quả                                                                                                                                                                                                                                                                          |
| ---- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Cùng `sepay_webhook_id` (UNIQUE) hoặc cùng `sepay_api_id` (UNIQUE)                  | Đã có → bỏ qua (webhook gửi lại, gửi lại thủ công, bấm lấy lại)                                                                                                                                                                                                                  |
| 2    | Cùng **tài khoản + mã giao dịch**                                                   | Cùng chiều và cùng số tiền → **là một giao dịch**: gắn id còn thiếu vào bản cũ (`origin = both`/`manual_merged`), không tạo dòng mới. Cùng mã nhưng khác số tiền/chiều → tạo mới ở `needs_review/possible_duplicate`, liên kết bản cũ (ngân hàng dùng chung mã cho giao dịch lô) |
| 3    | Không có mã giao dịch (một số ngân hàng bỏ trống với lãi, phí; nhập tay không điền) | So dấu phụ: cùng tài khoản, chiều, số tiền, thời điểm (đến giây với SePay; ±1 ngày với nhập tay), nội dung. Có ứng viên → `needs_review/possible_duplicate` + nút **Gộp** / **Không trùng**; không tự gộp                                                                        |
| 4    | Không khớp gì                                                                       | Tạo mới                                                                                                                                                                                                                                                                          |

- So khớp dùng giá trị trong `source_snapshot` với giao dịch SePay (không dùng giá trị người dùng đã sửa) và giá trị
  hiện tại với giao dịch nhập tay. Mã giao dịch so sau khi bỏ khoảng trắng hai đầu, không phân biệt hoa thường.
- Có index (`bank_account`, `reference_code`) để tra nhanh. Không đặt UNIQUE trên mã vì giao dịch lô có thể dùng chung
  mã (bước 2 đã xử lý).
- Đua đồng thời (webhook và bấm lấy thủ công cùng lúc): `transaction.atomic` + `select_for_update` trên ứng viên;
  UNIQUE id là chốt cuối, `IntegrityError` → đọc lại và gộp.
- Form nhập tay: gõ mã giao dịch đã có → báo ngay "Giao dịch này đã có" kèm link, không cho lưu bản trùng.
- Khoản **thu nhập** nhập tay (không phải giao dịch) rồi giao dịch đến sau: khớp nền tảng + số tiền + trong
  `finance_duplicate_window_days` ngày với khoản thu chưa có giao dịch → không tạo khoản thu mới, đưa vào cần xử lý
  với gợi ý "liên kết vào khoản thu X".
- Kiểm trước khi chốt code (V1): `referenceCode` của webhook và `reference_number` của API cho cùng một giao dịch phải
  giống nhau.

### 3.5 Lỗi khác

| Tình huống                             | Xử lý                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Token API sai/hết hạn khi lấy thủ công | Báo lỗi rõ trên màn hình (`FINANCE_SEPAY_AUTH_FAILED`), lưu vào lịch sử lấy                   |
| 429 khi lấy thủ công                   | Dừng, báo số đã lấy được, bấm lại sau                                                         |
| Chữ ký webhook sai liên tục            | Trang Kết nối SePay hiện lần lỗi xác thực gần nhất; sự kiện thông báo kỹ thuật (gom theo giờ) |
| Lẫn Test mode với live                 | `SEPAY_ENV` + token/secret riêng; dữ liệu sandbox `is_test`, loại khỏi mọi thống kê           |

---

## 4. Nghiệp vụ

### 4.1 Luồng

```
Webhook SePay ─► xác thực ─► SepayWebhookEvent ─┐
Lấy thủ công qua API (bấm) ─► SepaySyncRun ──────┤
                                                 ▼
                         BankTransaction (gộp, chống trùng)
                                                 ▼
                    Tiền vào: chạy quy tắc nhận diện      Tiền ra: quy tắc phân loại dòng tiền ra
        ┌──────────────────┬───────────────────┐                    ▼
   khớp 1 nền tảng     xung đột / nghi trùng   không khớp       Tab "Tiền ra" (không vào hàng đợi
        ▼                    ▼                    ▼              xử lý, không bao giờ là thu nhập âm)
 IncomeRecord          Cần xử lý             Cần xử lý
 "đã xác nhận" (D7)    (chưa xác minh)       (chưa xác minh)
        └─────── người dùng sửa được mọi lúc ───────┘
                                                 ▼
                         Outbox thông báo ─► Email / Telegram
```

### 4.2 Trạng thái

`BankTransaction.classification_status`:

| Giá trị             | Nghĩa                                                            |
| ------------------- | ---------------------------------------------------------------- |
| `unclassified`      | Chưa xác minh: không quy tắc khớp hoặc nội dung rỗng             |
| `needs_review`      | Chưa xác minh: xung đột quy tắc, nghi trùng, khớp khoản nhập tay |
| `auto_classified`   | Nhận diện được → có khoản thu đã xác nhận                        |
| `manual_classified` | Người dùng chọn/sửa; quy tắc không bao giờ ghi đè                |
| `excluded`          | Không phải thu nhập (cá nhân, chuyển nội bộ, hoàn tiền…)         |

`review_reason`: `no_rule`, `empty_content`, `rule_conflict`, `possible_duplicate`, `matches_manual_income`.

`flow_category` (bản chất dòng tiền, dùng cho cả vào và ra): `income`, `internal_transfer`, `personal`, `refund`,
`reversal`, `fee`, `expense`, `other`. Tiền ra mặc định `other` cho tới khi quy tắc hoặc người dùng phân loại.

`IncomeRecord.status`: `confirmed` (tự động khi nhận diện được, hoặc người dùng lưu) · `void` (hủy có lý do).
Mức hoàn thiện hồ sơ (tính, không lưu): thiếu chứng từ, thiếu thông tin thuế, thiếu kỳ/năm tính thuế, chưa có giao
dịch ngân hàng.

`TaxEntry.kind`: `withheld`, `paid`, `estimated`, `refunded`; `confidence`: `confirmed_by_document`,
`declared_by_payer`, `user_claimed`, `estimated`.

### 4.3 Quy tắc nhận diện

- Chuẩn hóa (giữ nội dung gốc, lưu thêm `normalized_content`): NFC → bỏ dấu (`to_ascii`) → chữ hoa → ký tự không phải
  chữ/số thành khoảng trắng → gộp khoảng trắng.
- Chế độ **Từ khóa** (mặc định; "chứa tất cả"/"chứa một trong", tự escape, theo ranh giới từ) hoặc **Regex**
  (thư viện `regex` có timeout; pattern ≤ 200 ký tự; nội dung cắt ≤ 512 ký tự).
- Điều kiện: chiều (vào/ra), tài khoản ngân hàng (tùy chọn), khoảng số tiền (tùy chọn). Đích: nền tảng (+ tài khoản
  nền tảng mặc định) **hoặc** một `flow_category` (ví dụ "MẸ CHUYỂN" → `personal`; tiền ra "PHI SMS" → `fee`).
- Nhiều quy tắc khớp: cùng đích → tự động; khác đích nhưng quy tắc đầu có ưu tiên cao hơn hẳn → tự động, có cảnh báo
  quy tắc khác cũng khớp; khác đích cùng mức ưu tiên cao nhất → `needs_review/rule_conflict`.
- Test chạy ở BE (cú pháp Python), FE hiển thị span highlight.
- Sửa quy tắc: `version + 1`, Journal ghi lại; không tự áp dụng lại. **Xem trước trên lịch sử** → **Áp dụng lại** chỉ
  cho `unclassified`/`needs_review`/`auto_classified` chưa bị người dùng sửa; không chạm `manual_classified`,
  `excluded` và khoản thu người dùng đã sửa hoặc đã gắn chứng từ/thuế (những bản đó chuyển `needs_review` để quyết).

### 4.4 Thu nhập, phân bổ, thuế (D7)

- Nhận diện được: tạo `IncomeRecord` `confirmed` (thực nhận = số tiền giao dịch; trước thuế/thuế để trống) + phân bổ
  toàn phần.
- Sửa được mọi lúc: từ trang giao dịch (đổi nền tảng/kênh, chuyển "không phải thu nhập") và từ form khoản thu (số
  tiền trước thuế, phí, kỳ, năm thuế, ghi chú, thuế, chứng từ). Khi người dùng sửa, đặt `is_user_edited` → quy tắc
  áp dụng lại không ghi đè.
- Không nhận diện được: không tạo khoản thu cho tới khi người dùng phân loại (khi đó tạo `confirmed`).
- `IncomeAllocation(bank_transaction, income_record, amount)`: 1 giao dịch ↔ nhiều khoản thu, 1 khoản thu ↔ nhiều lần
  nhận. Tổng phân bổ ≤ số tiền giao dịch và ≤ thực nhận của khoản thu (kiểm trong service, có khóa dòng).
- Nhập tay: `source = manual`, có thể không có giao dịch (tiền mặt, trước khi dùng hệ thống).
- Thời gian: `received_at`, `income_date` (phát sinh), `earned_period_start/end` (kỳ doanh thu), `tax_year`
  (người dùng chọn; chưa chọn thì báo "chưa xác nhận năm tính thuế", không mặc định năm nhận tiền).
- Ngoại tệ: số gốc, loại tiền, tỷ giá, nguồn tỷ giá — nhập tay, không tự lấy.
- `TaxPolicy` (loại thuế, loại thu nhập, thuế suất, ngưỡng, hiệu lực, căn cứ pháp lý) chỉ để ước tính; `TaxEntry`
  ước tính lưu bản chụp thuế suất, đổi chính sách không tính lại lịch sử. Không suy thuế từ số tiền nhận.
- Quy định thuế 2026 còn nhiều cách hiểu giữa các nguồn tư vấn → module không hard-code, không kết luận số thuế cuối
  cùng phải nộp hay được hoàn.

### 4.5 Chứng từ (D1, D2)

- `FinanceDocument` trỏ tới `Attachment` (file thật ở Thư viện) + loại (`invoice`, `withholding_certificate`,
  `tax_payment_receipt`, `bank_statement`, `platform_report`, `receipt`, `contract`, `other`), kỳ, năm, nền tảng,
  số tiền, số chứng từ, đơn vị phát hành, `validity_status` (mặc định `unverified` — không mặc định là hóa đơn hợp lệ).
- `FinanceDocumentLink`: nhiều–nhiều với giao dịch, khoản thu, khoản thuế (ba FK nullable, check đúng một).
  Bổ sung chứng từ sau chỉ thêm liên kết, không tạo khoản thu mới.
- Chọn hoặc upload nhiều file một lần qua `AttachmentPicker` với chế độ riêng tư mặc định (5.6); xem file theo phạm
  vi Thư viện (D1, D10).
- Thiếu chứng từ: khoản thu có thuế khấu trừ mà chưa có `withholding_certificate`, hoặc người dùng bật
  `document_required`.

### 4.6 Kiểm soát số liệu

1. Thu nhập = tổng `IncomeRecord` `confirmed`; dòng tiền ngân hàng = tổng `BankTransaction` (không `is_test`) — hai
   khối riêng, không cộng lẫn.
2. Nhóm theo ngày giờ Việt Nam (UTC+7): 00:30 ngày 01/01/2027 giờ VN là 17:30 ngày 31/12/2026 UTC.
3. Tiền `DecimalField(max_digits=18, decimal_places=0)` cho VND; ngoại tệ 4 chữ số thập phân; không float.
4. Sửa giao dịch luôn ghi Journal (cũ → mới, người sửa); bản SePay gốc không bao giờ bị ghi đè (4.8).
5. Báo cáo kèm phạm vi dữ liệu (ngày giao dịch đầu tiên/cuối cùng của từng tài khoản, số giao dịch chưa xác minh).

### 4.7 Dữ liệu lưu để tự đối chiếu cuối tháng (D4b)

Mỗi giao dịch lưu đủ để so từng dòng với sao kê ngân hàng và lịch sử trên my.sepay.vn, không cần thêm tính năng
đối soát tự động:

| Trường                                                                | Dùng để                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sepay_webhook_id`                                                    | Tra giao dịch trong **Lịch sử gửi** webhook trên my.sepay.vn, gửi lại thủ công                                                                                                           |
| `sepay_api_id` (UUID, khi lấy qua API)                                | Tra qua SePay API                                                                                                                                                                        |
| `reference_code`                                                      | **Mã giao dịch** (mã tham chiếu ngân hàng) — so với sao kê, khóa chống trùng chính (3.4)                                                                                                 |
| `transaction_at`                                                      | Ngày giờ ngân hàng ghi sổ (giờ VN từ SePay, lưu UTC, hiển thị giờ VN)                                                                                                                    |
| `created_at` (có sẵn của `CoreModel`)                                 | Lúc hệ thống ghi nhận (webhook đến, lấy thủ công hoặc nhập tay) — thấy được giao dịch đến muộn. Không đặt tên `received_at` vì `IncomeRecord.received_at` đã mang nghĩa "ngày nhận tiền" |
| `origin`                                                              | `webhook` / `api` / `both` / `manual` / `manual_merged` — biết dòng nào lấy thủ công, dòng nào nhập tay                                                                                  |
| `bank_account`, `direction`, `amount`, `raw_content`, `balance_after` | Khớp dòng sao kê                                                                                                                                                                         |

Màn Giao dịch có lọc theo tháng + tài khoản, sắp theo `transaction_at`, hiện các cột trên và **xuất CSV** để đặt cạnh
sao kê.

### 4.8 Sửa giao dịch ngân hàng (D9)

- Sửa được: `bank_account`, `direction`, `amount`, `transaction_at`, `raw_content`, `reference_code`, `balance_after`,
  `note` (cùng các trường phân loại). Không sửa: `sepay_webhook_id`, `sepay_api_id`, `origin` (định danh kỹ thuật).
- Lúc tạo, hệ thống lưu `source_snapshot` (JSON: tài khoản, chiều, số tiền, ngày giờ, nội dung, mã tham chiếu đúng
  như SePay gửi), **không bao giờ đổi**. Payload đầy đủ còn nằm ở `SepayWebhookEvent.raw_body`.
- Trường `is_edited` (tính từ so sánh với snapshot): danh sách có nhãn "Đã sửa"; trang chi tiết hiện cột "SePay gửi"
  cạnh "Hiện tại" cho từng trường đã khác, có nút **Khôi phục theo SePay** (từng trường hoặc toàn bộ, có xác nhận).
- Chống trùng (3.4) so trên `source_snapshot`, không trên giá trị đã sửa → sửa không làm hỏng việc gộp webhook/API.
  Thống kê và báo cáo dùng giá trị **hiện tại** (đã sửa).
- Sửa số tiền khi đã có phân bổ: khoản thu tự tạo chưa bị người dùng sửa thì cập nhật thực nhận theo; tổng phân bổ
  vượt số tiền mới thì chặn lưu, báo phải chỉnh phân bổ trước.
- Sửa nội dung không tự chạy lại quy tắc; có nút **Chạy lại quy tắc** cho giao dịch đó (không áp cho bản phân loại
  tay trừ khi người dùng bấm).
- Không xóa giao dịch thật; ghi nhận sai hẳn (ví dụ giao dịch không có thật) thì chuyển `excluded` + ghi chú.
  Giao dịch thử `is_test` xóa được.
- Quyền `finance.bank_transaction.update` (tách khỏi `classify` để có thể cho người khác chỉ phân loại).

### 4.9 Nhập tay giao dịch ngân hàng (D12)

- Dùng khi tiền đã qua ngân hàng mà hệ thống không có (webhook mất, giao dịch trước khi nối SePay) và không muốn lấy
  qua API. Khác với **khoản thu nhập nhập tay** (tiền mặt, không qua ngân hàng): giao dịch nhập tay xuất hiện trong
  dòng tiền ngân hàng và đi qua quy tắc nhận diện như giao dịch SePay.
- Cùng form với sửa giao dịch: tài khoản (chọn trong danh sách tài khoản đã ghi nhận), chiều, số tiền, ngày giờ, nội
  dung, mã tham chiếu (nên nhập để đối chiếu sao kê), ghi chú. `origin = manual`, `source_snapshot` rỗng.
- Quyền `finance.bank_transaction.create`.
- Chống trùng khi giao dịch SePay đến sau: theo 3.4. Có mã giao dịch trùng (cùng tài khoản, chiều, số tiền) → tự
  gộp vào bản nhập tay. Không có mã → nghi trùng (±1 ngày, vì giờ nhập tay không chính xác đến giây), tạo giao dịch
  SePay ở `needs_review/possible_duplicate` kèm nút **Gộp vào giao dịch nhập tay**. Khi gộp (tự động hoặc bấm): bản nhập tay nhận id SePay + `source_snapshot`, `origin` thành `manual_merged`, giá
  trị người dùng giữ nguyên (khác snapshot thì hiện "Đã sửa"), phân loại/phân bổ của bản nhập tay giữ nguyên;
  `SepayWebhookEvent` chuyển sang trỏ bản nhập tay; bản SePay tạm (nếu đã tạo) bị xóa cứng vì chưa có liên kết nào;
  ghi Journal. Chọn **Không trùng** thì bản SePay ở lại như giao dịch bình thường.

---

## 5. Cấu trúc module và model

### 5.1 Ranh giới

```
system (nền) ── thêm: TelegramChat, NotificationRoute, NotificationDelivery, sự kiện thông báo khai trong ModuleDescriptor
  ▲
finance (mới) ── SePay, tài khoản nhận tiền, giao dịch, nền tảng, quy tắc, thu nhập, thuế, chứng từ, báo cáo
```

- Module `finance`: BE `app/finance`, FE `modules/finance`, API `/api/v1/finance/...`, bảng `finance_*`, nhóm quản trị
  mới "Tài chính". Tích hợp SePay nằm trong `finance/services/sepay_*` (chỉ finance dùng; module khác cần thì tách).
- Telegram + outbox thông báo trong `system` vì là năng lực dùng chung; `finance` chỉ gọi
  `NotificationService.publish(...)`.
- Single-tenant: không `owner_field`, bảo vệ bằng IAM.

### 5.2 Model `finance`

| Model                 | Mục đích                              | Trường chính                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Vòng đời                                                                                                                                                                                       |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BankAccount`         | Tài khoản nhận tiền (tự ghi nhận, D6) | `sepay_bank_account_id` (UUID, unique nullable), `bank_name`, `account_number`, `label`, `va_only` (từ API), `is_active`, `last_transaction_at`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Tự tạo khi webhook/API gặp tài khoản mới (khóa: ngân hàng + số tài khoản); người dùng chỉ sửa nhãn, bật/tắt. Không xóa khi còn giao dịch                                                       |
| `SepayWebhookEvent`   | Nhật ký webhook hợp lệ                | `sepay_webhook_id` (unique), `raw_body`, `received_at`, `status`, `error_code`, `bank_transaction`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Không ghi request sai chữ ký; quyền đọc hạn chế                                                                                                                                                |
| `SepaySyncRun`        | Lịch sử các lần lấy thủ công          | `requested_by`, khoảng ngày, số lấy về/mới/đã có/nghi trùng, `status`, `error_code`, thời gian                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Chỉ để xem lại; không cursor                                                                                                                                                                   |
| `BankTransaction`     | Giao dịch ngân hàng                   | Định danh (không sửa): `sepay_webhook_id`, `sepay_api_id`, `origin`, `is_test`, `source_snapshot` (bản SePay gửi). Sửa được: `bank_account`, `direction`, `amount`, `currency`, `transaction_at`, `raw_content`, `raw_description`, `reference_code`, `sepay_code`, `sub_account`, `balance_after`. Phân loại: `normalized_content`, `classification_status`, `review_reason`, `flow_category`, `platform`, `platform_account`, `matched_rule` + `matched_rule_version` + `match_span`, `conflict_rules`, `duplicate_candidate`, `related_transaction` (hoàn tiền/đảo chiều), `note` (lúc hệ thống ghi nhận = `created_at` của `CoreModel`) | JournalTracker trên mọi trường sửa được; DELETE bị chặn trừ `is_test`. Index (`bank_account`, `reference_code`) cho chống trùng, (`bank_account`, `transaction_at`), (`classification_status`) |
| `IncomePlatform`      | Nền tảng                              | `name`, `code`, `description`, `icon` (FK `Attachment`, null = icon mặc định), `default_income_type`, `is_active`, `position`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Ngừng dùng = tắt                                                                                                                                                                               |
| `PlatformAccount`     | Kênh/tài khoản trong nền tảng         | `platform`, `name`, `external_ref`, `note`, `is_active`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Không bắt buộc cho giao dịch                                                                                                                                                                   |
| `ClassificationRule`  | Quy tắc                               | `name`, `match_mode`, `pattern`, `match_on`, `direction`, `bank_account`, `amount_min/max`, đích nền tảng **hoặc** `target_flow_category`, `priority`, `is_active`, `examples`, `version`, `description`                                                                                                                                                                                                                                                                                                                                                                                                                                    | JournalTracker                                                                                                                                                                                 |
| `IncomeRecord`        | Khoản thu                             | `platform`, `platform_account`, `income_type`, `source` (`bank`/`manual`), `gross_amount`, `fee_amount`, `net_amount`, `currency`, ngoại tệ, `received_at`, `income_date`, `earned_period_start/end`, `tax_year`, `status`, `void_reason`, `is_user_edited`, `document_required`, `note`                                                                                                                                                                                                                                                                                                                                                    | JournalTracker; hủy thay vì xóa                                                                                                                                                                |
| `IncomeAllocation`    | Giao dịch ↔ khoản thu                 | `bank_transaction`, `income_record`, `amount`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Unique cặp                                                                                                                                                                                     |
| `TaxPolicy`           | Chính sách thuế                       | `name`, `tax_kind`, `income_type`, `rate`, `threshold_amount`, `effective_from/to`, `legal_basis`, `note`, `is_active`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | JournalTracker                                                                                                                                                                                 |
| `TaxEntry`            | Khoản thuế                            | `income_record` (null), `kind`, `tax_kind`, `amount`, `tax_year`, kỳ, `withholder_name`, `paid_at`, `reference_no`, `confidence`, `policy` + `rate_snapshot`, `note`                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | JournalTracker                                                                                                                                                                                 |
| `FinanceDocument`     | Chứng từ                              | `attachment` (`PROTECT`), `doc_type`, `title`, `description`, `platform`, kỳ, `tax_year`, `amount`, `currency`, `document_number`, `issuer`, `issued_at`, `validity_status`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | JournalTracker                                                                                                                                                                                 |
| `FinanceDocumentLink` | Chứng từ ↔ giao dịch/khoản thu/thuế   | `document` + đúng một FK đích                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Nhiều–nhiều                                                                                                                                                                                    |

Lý do chính: giao dịch + phân loại chung một bảng (1–1, cùng vòng đời), bản SePay gốc là một cột JSON thay vì bảng
riêng; khoản thu tách riêng (nhập tay, nhiều lần
nhận, thuế, chứng từ); thuế tách bảng (nhiều loại thuế cho một khoản, có thuế không gắn khoản thu); cấu hình không
bí mật dùng `system.Setting`, bí mật ở ENV; chuyển tiền nội bộ/cá nhân nhận
diện bằng quy tắc (đích `flow_category`), không cần bảng tài khoản riêng.

### 5.3 Bổ sung `system`

| Thành phần                                                             | Nội dung                                                                                                                                                                                        |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NotificationEventDefinition` + `ModuleDescriptor.notification_events` | Module khai sự kiện như khai quyền (`code`, tên, mô tả, `kind` nghiệp vụ/kỹ thuật)                                                                                                              |
| `TelegramChat`                                                         | `chat_id` (unique), `title`, `chat_type`, `status` (`active`/`unreachable`/`removed`), `is_active`, `last_verified_at`, `last_error_code`                                                       |
| `NotificationRoute`                                                    | `event_code`, `channel` (`email`/`telegram`), `telegram_chat` hoặc `recipient_user`, `is_active`, `throttle_minutes`                                                                            |
| `NotificationDelivery` (outbox)                                        | `route`, `event_code`, `dedup_key`, `subject`, `body`, `status`, `attempts`, `next_attempt_at`, `last_error_code`, `sent_at`, `provider_message_id`; unique (`route`, `dedup_key`)              |
| `NotificationService`                                                  | `publish(event_code, dedup_key, context)`: tạo delivery (insert-ignore), gửi ngay với timeout ngắn, lỗi thì hẹn retry (tối đa 5 lần); cron dọn dẹp hằng ngày đã có chạy thêm `dispatch_pending` |
| `TelegramService`                                                      | `getMe`, `getUpdates`, `getChatMember`, `sendMessage`; token `TELEGRAM_BOT_TOKEN` trong ENV, không lưu DB, không hiển thị                                                                       |
| `EmailService`                                                         | Sửa vi phạm (mục 10) + method gửi đồng bộ cho outbox, template `system/email/notification_{vi,en}`                                                                                              |

### 5.4 Quyền

`finance.bank_account.{read,update}` · `finance.bank_transaction.{read,create,update,classify}` ·
`finance.platform.{read,create,update,delete}` · `finance.classification_rule.{read,create,update,delete,apply}` ·
`finance.income_record.{read,create,update,void}` · `finance.tax_policy.{read,create,update,delete}` ·
`finance.tax_entry.{read,create,update,delete}` · `finance.document.{read,create,update,delete}` ·
`finance.sepay.{read,sync}` · `finance.report.{read,export}`;
`system.telegram_chat.{read,create,update,delete}` · `system.notification_route.{read,create,update,delete}` ·
`system.notification_delivery.{read,retry}`. Vai trò `FINANCE_MANAGER`/`FINANCE_VIEWER` tự sinh.

### 5.5 Cấu hình

- ENV: `SEPAY_ENV` (`sandbox`/`production`), `SEPAY_API_TOKEN`, `SEPAY_WEBHOOK_SECRET`, `SEPAY_WEBHOOK_ALLOWED_IPS`
  (tùy chọn), `TELEGRAM_BOT_TOKEN`, `CLOUDFLARE_R2_PRIVATE_BUCKET_NAME` (5.6). Cập nhật `.env.example`,
  `docs/guides/deployment.md`.
- Giao dịch nhận khi `SEPAY_ENV=sandbox` tự đánh `is_test = True`.
- `Setting` nhóm `finance`: `finance_auto_classify_enabled`, `finance_duplicate_window_days`.
- UI chỉ hiện "đã cấu hình / chưa cấu hình" cho bí mật.

### 5.6 File riêng tư trong Thư viện (D10, D11 — sửa `system`, là common)

Hiện trạng: `AttachmentSummaryResponseSerializer.url` trả URL tuyệt đối của storage → ai có link đều mở được; file
nằm ở `attachments/YYYY/MM/<uuid>.<ext>` (UUID khó đoán nhưng link lộ là lộ hẳn).

Backend:

- `Attachment.visibility` (`public` mặc định / `private`), migration thêm cột (file cũ đều `public` → không đổi
  hành vi cũ).
- File riêng tư nằm ở **bucket R2 riêng không bật public access** (`CLOUDFLARE_R2_PRIVATE_BUCKET_NAME`); local dùng
  thư mục ngoài `MEDIA_ROOT` công khai. Không có URL trực tiếp nào dùng được lâu dài.
- Response: file `private` có `url = null` và `content_url = /api/v1/system/attachments/{id}/content` (field mới,
  không phá contract). File `public` giữ như cũ.
- `GET /system/attachments/{id}/content`: đăng nhập + (người upload **hoặc** superuser **hoặc**
  `system.attachment.read_private`) → 302 tới URL ký của R2 hạn 5 phút (`boto3 generate_presigned_url`), header
  `Cache-Control: private, no-store`; local thì stream. Không đủ quyền và không tồn tại trả **cùng một** lỗi 404 →
  không dò được file nào tồn tại.
- Quyền mới `system.attachment.read_private` ("Xem mọi tệp riêng tư"), tách khỏi `manage_all` để cấp riêng cho người
  cần xem chứng từ mà không cần quản lý toàn Thư viện.
- `POST /system/attachments/{id}/visibility` (`system.attachment.update` + owner/`manage_all`): chuyển object giữa
  hai bucket (copy → cập nhật `file` → xóa bản cũ, trong một service có xử lý lỗi giữa chừng), ghi Journal.
  Chuyển sang riêng tư: link công khai cũ hết dùng được (bản đã cache ở trình duyệt/CDN có thể còn một thời gian —
  cảnh báo trong dialog). Chuyển sang công khai: cảnh báo "ai có link đều xem được".
- Loại file mới (D11): XLSX (zip, kiểm có `[Content_Types].xml`), CSV (UTF-8 hợp lệ, không byte NUL), XML (kiểm
  bằng `defusedxml`, chặn DTD/entity). Ba loại này luôn tải về (`Content-Disposition: attachment`, `nosniff`), không
  hiển thị trực tiếp trong trình duyệt. Mặc định upload ở chế độ riêng tư.
- Dọn file (`purge_deleted_files`) và đo dung lượng (`R2UsageService`) tính cả bucket riêng tư.

Frontend (common, cập nhật `docs/common-catalog.md`):

- `AttachmentPicker` / `AttachmentUpload` thêm props, nơi dùng chỉ khai một lần, admin không phải chỉnh từng file:
  - `visibility?: "public" | "private"` — chế độ cho file upload mới (mặc định `public`, giữ hành vi cũ);
  - `lockVisibility?: boolean` — khóa lựa chọn (màn Chứng từ: `private` + khóa);
  - `accept?: AttachmentKind[]` (`image`, `pdf`, `spreadsheet`, `xml`…) thay cho `imageOnly` (giữ `imageOnly` làm
    bí danh để không phá nơi đang dùng);
  - `multiple?: boolean` + `onSelectMany` cho chọn nhiều file.
- Vùng upload hiện công tắc **Riêng tư** (khi không khóa), file riêng tư có biểu tượng khóa trong lưới/bảng.
- `AttachmentDetailDialog`: nút **Chuyển sang riêng tư / công khai** (có `ConfirmDialog` với cảnh báo trên).
- Bộ chọn ở nơi bắt buộc công khai (avatar, logo QR, ảnh chèn vào trang công khai) chỉ liệt kê file `public`
  (prop `visibilityFilter="public"`), tránh chèn ảnh riêng tư vào trang công khai rồi bị vỡ.
- Ảnh riêng tư hiển thị qua `content_url` với `<Image unoptimized />` (không để Next lưu bản tối ưu công khai).
- Màn **Không có quyền xem tệp**: route `/[locale]/tep/[id]` (en `/files/[id]`) — link chia sẻ của file riêng tư trỏ
  về đây; page gọi `content_url` phía server: có quyền → chuyển tới file; chưa đăng nhập → trang đăng nhập (`next`
  quay lại); không quyền/không tồn tại → màn dùng `ForbiddenView` với nội dung chung "Bạn không có quyền xem tệp
  này hoặc tệp không tồn tại", nút về trang chủ/đăng nhập tài khoản khác.
- Cập nhật `SYSTEM_CONTEXT.md` (đoạn "URL file vẫn truy cập trực tiếp" chỉ còn đúng với file công khai; ghi rõ bộ
  chọn có upload).

---

## 6. UI/UX

Wireframe chi tiết làm bằng skill `ui-ux` ở từng giai đoạn giao diện; mục này chốt tổ chức. Nhóm quản trị
**Tài chính**:

| Menu                 | Đường dẫn (vi)                   | Nội dung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tổng quan            | `/quan-tri/tai-chinh`            | Bộ chọn năm/khoảng thời gian + cơ sở thời gian (ngày nhận tiền / kỳ doanh thu). Khối **Thu nhập**: tổng đã xác nhận, nhận qua ngân hàng, nhập tay, thuế khấu trừ, thuế đã nộp, theo nền tảng, theo tháng. Khối **Dòng tiền ngân hàng** (D8): tiền vào, tiền ra, chênh lệch theo tháng; tiền vào chia thu nhập / không phải thu nhập / chưa xác minh; tiền ra chia theo loại (hoàn tiền, phí, chuyển nội bộ, chi tiêu, khác). Khối **Việc cần làm**: chưa xác minh, nghi trùng, thiếu chứng từ, lỗi xác thực webhook gần nhất. Mỗi chỉ số có chú thích ý nghĩa |
| Giao dịch            | `/quan-tri/tai-chinh/giao-dich`  | Tab: Tất cả · **Chưa xác minh** (badge) · Tiền ra. Chi tiết (một form): thông tin giao dịch sửa được, trường đã khác bản SePay hiện cột "SePay gửi" + **Khôi phục theo SePay**; phân loại (nền tảng/kênh, loại dòng tiền, ghi chú, **Tạo quy tắc từ giao dịch này**); phân bổ khoản thu; chứng từ; lịch sử                                                                                                                                                                                                                                                    |
| Thu nhập             | `/quan-tri/tai-chinh/thu-nhap`   | Danh sách + một form tạo/sửa/xem: số tiền (trước thuế/phí/thực nhận), thời gian (nhận, phát sinh, kỳ, năm thuế), ngoại tệ, giao dịch phân bổ, khoản thuế, chứng từ, hủy                                                                                                                                                                                                                                                                                                                                                                                       |
| Nền tảng             | `/quan-tri/tai-chinh/nen-tang`   | Danh sách có icon; form: thông tin, icon (chọn từ Thư viện, khung vuông `object-contain`), kênh/tài khoản, quy tắc của nền tảng                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Quy tắc nhận diện    | `/quan-tri/tai-chinh/quy-tac`    | Danh sách theo ưu tiên, cảnh báo xung đột; form có bảng thử cột phải: nhiều chuỗi mẫu, highlight phần khớp, nền tảng xác định, quy tắc khác cùng khớp, lỗi regex có vị trí; **Xem trước trên lịch sử** → **Áp dụng lại** (xác nhận)                                                                                                                                                                                                                                                                                                                           |
| Chứng từ             | `/quan-tri/tai-chinh/chung-tu`   | Lọc loại/năm/nền tảng/trạng thái hợp lệ; chọn/upload nhiều file qua bộ chọn dùng chung (mặc định riêng tư); liên kết giao dịch/khoản thu/thuế                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Thuế                 | `/quan-tri/tai-chinh/thue`       | Tab: Khoản thuế · Chính sách thuế                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Báo cáo              | `/quan-tri/tai-chinh/bao-cao`    | Theo năm: thu nhập theo nguồn, thực nhận, thuế khấu trừ/đã nộp/ước tính, dòng tiền vào/ra, mức hoàn thiện hồ sơ, phạm vi dữ liệu, danh sách chi tiết; xuất CSV, in PDF; nhãn "Bảng tổng hợp tham khảo — không phải tờ khai"                                                                                                                                                                                                                                                                                                                                   |
| Kết nối SePay        | `/quan-tri/tai-chinh/sepay`      | Tab: **Trạng thái & kiểm tra** (môi trường, bí mật đã cấu hình, Test kết nối, URL webhook + sao chép, hướng dẫn cấu hình trên my.sepay.vn, lần nhận webhook cuối, lỗi xác thực gần nhất, bật/tắt tự phân loại, hướng dẫn gửi lại thủ công trên my.sepay.vn) · **Lấy giao dịch từ SePay** (chọn khoảng ngày → kết quả mới/đã có/nghi trùng, lịch sử các lần lấy) · **Tài khoản ngân hàng** (tự ghi nhận, nhãn, ngày giao dịch đầu/cuối) · **Webhook đã nhận**                                                                                                  |
| Hệ thống → Thông báo | `/quan-tri/thong-bao` (`system`) | Tab: **Telegram** (trạng thái bot, đăng ký nhóm, kiểm tra, gửi thử) · **Quy tắc gửi** (ma trận sự kiện × Email/Telegram, nhóm theo module) · **Lịch sử gửi** (lọc, gửi lại)                                                                                                                                                                                                                                                                                                                                                                                   |

Luồng chính:

- **Xử lý giao dịch chưa xác minh**: tab Chưa xác minh → mở giao dịch → chọn nền tảng hoặc "Không phải thu nhập"
  - loại → Lưu (tạo khoản thu `confirmed` khi là thu nhập) → tùy chọn "Tạo quy tắc" với form điền sẵn và test ngay
    trên giao dịch đó.
- **Sửa kết quả tự động** (D7): mở giao dịch hoặc khoản thu → sửa → lưu; đánh dấu người dùng đã sửa.
- **Test webhook**: hướng dẫn Test mode + **Mô phỏng giao dịch** của SePay; giao dịch thử (`is_test`) hiện ở danh
  sách, xóa được.
- **Đăng ký nhóm Telegram**: "Thêm nhóm" → mã ký 10 phút + link `https://t.me/<bot>?startgroup=<mã>` → thêm bot vào
  nhóm → "Kiểm tra" → BE gọi `getUpdates` tìm `/start <mã>` → lưu chat id/tên → `getChatMember` xác minh quyền gửi →
  gửi tin thử. Không nhận chat id nhập tay chưa xác minh.

UX chung: control 40px, `DataTable` (card trên mobile), `ConfirmDialog` cho thao tác không hoàn tác, đủ trạng thái
loading/rỗng/lỗi/thành công, i18n vi/en, tiền định dạng vi-VN, số tài khoản che còn 4 số cuối ngoài trang chi tiết.

---

## 7. Email và Telegram

- Sự kiện: `finance.transaction.received`, `finance.transaction.needs_review` (nghiệp vụ, không phải lỗi kỹ thuật),
  `finance.sepay.webhook_auth_failed` (kỹ thuật), `finance.review.digest` (tổng hợp tồn đọng hằng ngày, tùy chọn).
- Chống trùng: `dedup_key` theo đối tượng (`finance.transaction.received:<id giao dịch>`) → webhook gửi lại hay lấy
  thủ công lại không gửi lần hai; giao dịch nhập tay không phát `received` (chính người dùng vừa nhập); lỗi kỹ thuật gom theo mã lỗi + giờ, cộng `throttle_minutes`.
- Gửi ngay sau commit (Telegram 5 s, SMTP 10 s); lỗi → thử lại khi cron dọn dẹp hằng ngày chạy, tối đa 5 lần, có nút Gửi lại.
- Telegram: HTML đã escape; xử lý 403 (bot bị xóa/không quyền → `removed`), 400 chat không tồn tại, nâng cấp
  supergroup (`migrate_to_chat_id`), 429 (`retry_after`). Không dùng webhook Telegram.
- Test: email backend `locmem`, Telegram client giả; không gửi thật.

### 7.1 Nội dung thông báo giao dịch (D14)

Một mẫu cho cả Telegram và Email (Email thêm tiêu đề), song ngữ vi/en theo template:

```
Tiền vào · Shopee Affiliate
Số tiền: +2.450.000 ₫
Mã giao dịch: FT26069ABC
Nội dung: SHOPEE AFFILIATE PAYMENT 202611
Tài khoản: MBBank ••1234 · 21/11/2026 09:35
Xem chi tiết: https://toannx.com/vi/quan-tri/tai-chinh/giao-dich/<id>
```

| Trường             | Quy tắc hiển thị                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Tiền vào / Tiền ra | Theo `direction`; số tiền có dấu `+` / `−`                                                                                   |
| Nền tảng           | Tên nền tảng đã nhận diện; tiền ra hiện loại dòng tiền (Phí, Hoàn tiền…); không nhận diện được → "Chưa xác định — cần xử lý" |
| Mã giao dịch       | `reference_code`; trống → "Không có mã"                                                                                      |
| Số tiền            | Định dạng vi-VN, đơn vị ₫                                                                                                    |
| Nội dung           | Nội dung chuyển khoản gốc, escape HTML, cắt ở 200 ký tự                                                                      |
| Tài khoản          | Ngân hàng + 4 số cuối, không số đầy đủ; không tên người chuyển                                                               |

Thông báo kỹ thuật (lỗi xác thực webhook) dùng mẫu riêng: loại lỗi, số lần trong giờ, thời điểm gần nhất, link trang
Kết nối SePay.

---

## 8. Hạ tầng

- Webhook trên Django/Vercel; cold start Vercel + Neon thường vài giây, dưới ngưỡng 30 giây; lỡ thì SePay tự gửi lại
  (~33 phút), sau đó gửi lại thủ công trên my.sepay.vn hoặc bấm lấy thủ công.
- Không scheduler mới: không GitHub Actions, không cron đồng bộ. Chỉ thêm việc gửi lại thông báo lỗi vào cron dọn dẹp
  hằng ngày đã có.
- Không Redis/Celery; ghi log tập trung cho lỗi không lường trước.
- Xuất CSV theo năm làm bản sao lưu cá nhân; sao lưu DB theo gói Neon (kiểm khi deploy).

---

## 9. Bảo mật, rủi ro, kiểm thử

### 9.1 Bảo mật

HMAC + timestamp + fail closed; rate limit webhook; không lưu body chưa xác thực; bí mật chỉ ở ENV, không log; log
chỉ id, số tiền, trạng thái, 4 số cuối tài khoản; `raw_body`/`raw_description` chỉ cho quyền `finance.sepay.read`;
nội dung chuyển khoản luôn escape, không bao giờ coi là lệnh; CSV xuất chống formula injection; icon SVG qua
`find_svg_problem`; chứng từ ở chế độ riêng tư (5.6); dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP
(`raw_body` giữ lâu dài làm bằng chứng gốc nên chỉ người có `finance.sepay.read` đọc được).

### 9.2 Rủi ro

| #    | Rủi ro                                                                                         | Biện pháp                                                                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | Webhook ↔ API không chung id → ghi trùng                                                       | Gộp theo mã giao dịch (3.4); không có mã thì nghi trùng chờ người dùng; kiểm V1 trong Test mode                                                       |
| R-1b | Ngân hàng dùng chung một mã giao dịch cho nhiều giao dịch (lô) → gộp nhầm                      | Chỉ gộp khi cùng tài khoản + mã + chiều + số tiền; khác số tiền thì nghi trùng, không gộp                                                             |
| R-2  | Nhóm theo UTC → sai năm thu nhập                                                               | Tổng hợp theo `Asia/Ho_Chi_Minh`, test ranh giới năm                                                                                                  |
| R-3  | Quy tắc quá rộng → nhận sai nền tảng, vì đã tự xác nhận (D7) nên sai đi thẳng vào số liệu      | Bắt buộc xem trước trên lịch sử khi tạo/bật quy tắc; cảnh báo quy tắc khớp quá nhiều; dashboard có "giao dịch tự nhận diện trong kỳ" để soát          |
| R-4  | Đổi quy tắc ghi đè kết quả đã sửa                                                              | Không tự áp dụng; khóa bản người dùng sửa                                                                                                             |
| R-5  | Suy thuế từ số thực nhận                                                                       | Không có logic suy luận; ước tính có nhãn                                                                                                             |
| R-6  | Thu nhập tháng 12 nhận tháng 1                                                                 | Kỳ doanh thu + năm thuế riêng                                                                                                                         |
| R-7  | Tiền cá nhân/nội bộ tính vào doanh thu                                                         | Không khớp quy tắc → chưa xác minh, không tự là thu nhập; quy tắc loại trừ                                                                            |
| R-8  | Hoàn tiền/đảo chiều                                                                            | `related_transaction`; tiền ra không là thu nhập âm                                                                                                   |
| R-9  | Lịch sử chỉnh sửa (Journal) bị dọn sau 365 ngày (D5)                                           | Dữ liệu vẫn còn; bản SePay gốc giữ mãi trong `source_snapshot` nên vẫn so được giá trị gốc ↔ hiện tại; tăng `JOURNAL_RETENTION_DAYS` bằng ENV nếu cần |
| R-10 | Tài khoản liên kết lại → UUID SePay mới; cùng số ở hai ngân hàng                               | Khóa tài khoản theo (ngân hàng, số); UUID chỉ để tham chiếu                                                                                           |
| R-11 | Server sập quá ~33 phút → webhook Failed, không tự có lại                                      | Gửi lại thủ công trên my.sepay.vn hoặc nút lấy thủ công; bật cảnh báo lỗi webhook của SePay; chủ dự án kiểm cuối tháng (4.7)                          |
| R-12 | Lẫn Test mode vào live                                                                         | `SEPAY_ENV`, `is_test`, secret riêng                                                                                                                  |
| R-13 | Thiếu lịch sử trước khi dùng                                                                   | Báo cáo hiện ngày giao dịch đầu tiên; nhập tay hoặc lấy thủ công theo khoảng ngày                                                                     |
| R-14 | Regex gây treo                                                                                 | `regex` có timeout + giới hạn độ dài                                                                                                                  |
| R-15 | Bấm lấy thủ công hai lần; outbox gửi trùng                                                     | Unique id + gộp; unique `dedup_key` + chuyển trạng thái có điều kiện                                                                                  |
| R-16 | Email bằng thread trên serverless bị mất                                                       | Outbox + gửi đồng bộ                                                                                                                                  |
| R-17 | Số giao dịch khác báo cáo nền tảng (phí, khấu trừ)                                             | Trước thuế/phí/thực nhận + phân bổ một phần, hiện chênh lệch                                                                                          |
| R-18 | Webhook đến khi DB lỗi                                                                         | Chỉ trả 200 sau commit; 503 khi lỗi                                                                                                                   |
| R-19 | Nội dung rỗng                                                                                  | `unclassified/empty_content`, không chạy quy tắc                                                                                                      |
| R-20 | Quên bật "Tự động gửi lại khi server trả lỗi" → lỗi 5xx mất ngay                               | Checklist cấu hình trên trang Kết nối SePay và go-live ghi rõ bước này                                                                                |
| R-21 | Chuyển ảnh đang dùng ở trang công khai/avatar sang riêng tư → ảnh vỡ                           | Dialog cảnh báo; bộ chọn ở nơi công khai chỉ liệt kê file `public`                                                                                    |
| R-22 | Đọc file riêng tư qua link cũ đã lưu cache trước khi chuyển riêng tư                           | Cảnh báo khi chuyển; file chứng từ upload thẳng ở chế độ riêng tư (không qua giai đoạn công khai)                                                     |
| R-23 | Giao dịch nhập tay rồi SePay đến sau → trùng                                                   | Nghi trùng + nút Gộp (4.9), không tự gộp vì giờ nhập tay không chính xác                                                                              |
| R-24 | Người xem chứng từ có `finance.document.read` nhưng không mở được file riêng tư của người khác | Có chủ ý (D10): cấp thêm `system.attachment.read_private` cho người cần xem file                                                                      |

Để sau: đọc báo cáo CSV/XLSX của Shopee/AdSense, OCR chứng từ, nhiều người dùng (owner), quản lý webhook qua OAuth2,
hóa đơn điện tử SePay.

### 9.3 Kiểm thử

- **Số tiền và chống trùng (làm đầu tiên)**: cùng webhook `id` hai lần; webhook rồi API và ngược lại (cùng mã giao
  dịch) → một giao dịch; cùng mã khác số tiền → nghi trùng, không gộp; không có mã → nghi trùng; mã khác hoa thường/
  khoảng trắng vẫn khớp; nhập tay có mã rồi SePay đến → tự gộp; form nhập tay gõ mã đã có → báo trùng; song song cùng
  id; ranh giới năm giờ VN.
- Webhook: chữ ký đúng/sai, thiếu header, timestamp quá hạn, secret rỗng, body đổi một byte, DB lỗi → 503, body
  phản hồi đúng.
- Lấy thủ công: phân trang `has_more`, 429, token sai, khoảng ngày quá 31 ngày bị chặn, bấm hai lần không tạo trùng
  (client SePay giả, không gọi mạng).
- Quy tắc: từ khóa/regex, chuẩn hóa, xung đột, ưu tiên, regex lỗi/treo, áp dụng lại không chạm bản người dùng sửa.
- Sửa giao dịch: snapshot không đổi sau khi sửa; sửa rồi lấy thủ công vẫn gộp đúng; khôi phục theo SePay; sửa số
  tiền nhỏ hơn tổng phân bổ bị chặn; Journal ghi đủ cũ → mới.
- Nhập tay giao dịch: tạo, nghi trùng khi SePay đến sau, gộp giữ phân loại/phân bổ, chọn "không trùng".
- File riêng tư: người upload/superuser/`read_private` xem được; người khác và file không tồn tại trả cùng 404;
  chưa đăng nhập 401; response không có URL trực tiếp; chuyển công khai ↔ riêng tư đổi bucket và link cũ hết dùng;
  XLSX/CSV/XML sai chữ ký bị từ chối, XML có DTD bị chặn; route `/tep/[id]` hiện đúng ba trạng thái.
- Thu nhập/thuế/chứng từ: ràng buộc phân bổ, hủy, ước tính lưu bản chụp, chứng từ thêm sau.
- Thông báo: dedup, throttle, retry, Telegram 403/429/migrate, email `locmem`.
- Quyền: mỗi endpoint một file `test_<resource>_<action>_api.py`; webhook trong `test_endpoint_access.py`; mọi danh sách trong `test_list_query_count.py`.
- SePay thật: chỉ Test mode + **Mô phỏng giao dịch**; go-live bằng một giao dịch nhỏ thật.

---

## 10. Vi phạm rule trong file đã đọc (sửa ở giai đoạn 0)

| File                                                  | Vi phạm                                                                                                            | Hướng sửa                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `backend/app/system/services/email_service.py`        | Method công khai `@classmethod`; ba method lặp khối dựng/gửi; thread pool không an toàn trên serverless            | Instance method, gom `send_template`, nơi gọi tạo `self.email_service` trong `__init__` |
| `backend/app/system/services/setting_service.py`      | `set_setting_value` 6 tham số vị trí; khóa `auth_*_enabled` là chuỗi lặp                                           | Tham số keyword-only; hằng khóa ở `system/constants/`                                   |
| `backend/app/system/services/google_oauth_service.py` | Dùng `requests` chưa khai trong `pyproject.toml`                                                                   | `uv add requests` (D3)                                                                  |
| `backend/app/core/storage/r2_usage_service.py`        | `# noqa: S310` không ghi lý do                                                                                     | Ghi lý do                                                                               |
| `SYSTEM_CONTEXT.md`                                   | Ghi "bộ chọn không có tab upload" nhưng `AttachmentPicker` đã có upload kéo thả (`canUpload`) — tài liệu lệch code | Sửa cùng lúc với 5.6                                                                    |

---

## 11. Giai đoạn triển khai

Mỗi giai đoạn gồm code, test, i18n, catalog, docs; chỉ kiểm phần đã sửa; giai đoạn có UI dùng skill `ui-ux` trước
và `playwright-cli` sau.

| Giai đoạn                            | Mục tiêu               | Phạm vi                                                                                                                                                                                                                                        | Phụ thuộc                 | Hoàn thành khi                                                                                                                             |
| ------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 0. Nền                               | Gỡ vướng               | Sửa vi phạm mục 10; `EmailService` gửi đồng bộ; `notification_events` trong `ModuleDescriptor`; thêm dependency D3                                                                                                                             | —                         | Test system liên quan xanh; catalog cập nhật                                                                                               |
| 0b. File riêng tư                    | Chứng từ không lộ      | Mục 5.6 trọn gói: `visibility`, bucket riêng tư, `content_url`, quyền `read_private`, chuyển chế độ, loại file mới, props `AttachmentPicker`/`AttachmentUpload`, nút trong `AttachmentDetailDialog`, route `/tep/[id]` + màn không có quyền    | 0                         | Test 9.3 phần file riêng tư xanh; kiểm thật trên R2 (bucket riêng tư không mở được bằng link trực tiếp); catalog + SYSTEM_CONTEXT cập nhật |
| 1. Kết nối SePay                     | Nối được SePay         | Scaffold `finance`, quyền, nhóm FE; `BankAccount`; `SepayApiClient`; Test kết nối; trang Kết nối SePay                                                                                                                                         | 0                         | Test mode: thấy tài khoản, test kết nối đúng                                                                                               |
| 2. Tiếp nhận & chống trùng           | Không mất, không trùng | Webhook; `SepayWebhookEvent`; `BankTransaction`; chống trùng theo mã giao dịch (3.4); nút lấy thủ công + `SepaySyncRun`; danh sách + một form nhập tay/sửa giao dịch (4.8, 4.9) + gộp nghi trùng, lọc theo tháng + xuất CSV (4.7); kiểm V1, V2 | 1                         | Toàn bộ test chống trùng xanh; mô phỏng giao dịch rồi lấy thủ công cùng ngày vẫn ra đúng một dòng                                          |
| 3. Nhận diện & xử lý tay             | Phân loại tin cậy      | Nền tảng (+icon), kênh, quy tắc, engine, API test, xem trước/áp dụng lại, tab Chưa xác minh, Tiền ra, phân loại tay, tạo quy tắc từ giao dịch                                                                                                  | 2                         | Kịch bản xung đột/không khớp/áp dụng lại đạt; UI test quy tắc kiểm desktop + mobile                                                        |
| 4. Thu nhập, thuế, chứng từ (cần 0b) | Hồ sơ đủ               | `IncomeRecord` (tự tạo `confirmed`), phân bổ, nhập tay, nghi trùng nhập tay, chính sách/khoản thuế, chứng từ + liên kết, thiếu chứng từ                                                                                                        | 3                         | Ràng buộc phân bổ, không suy thuế, chứng từ thêm sau đều có test                                                                           |
| 5. Dashboard & báo cáo               | Số đúng                | API tổng hợp (giờ VN, hai cơ sở thời gian), khối Thu nhập + Dòng tiền ngân hàng, biểu đồ, báo cáo năm, phạm vi dữ liệu, CSV, in PDF                                                                                                            | 4                         | Số dashboard khớp tổng `IncomeRecord`/`BankTransaction` trong test                                                                         |
| 6. Email & Telegram                  | Biết ngay khi có việc  | Model + service mục 5.3, UI Hệ thống → Thông báo, sự kiện finance                                                                                                                                                                              | 0, 2 (song song 3–5 được) | Không gửi trùng khi webhook gửi lại hoặc lấy thủ công; lỗi gửi không ảnh hưởng giao dịch                                                   |
| 7. Hoàn thiện & go-live              | Vận hành thật          | E2E, rà bảo mật, cập nhật `docs/` và `SYSTEM_CONTEXT.md`, checklist go-live SePay (webhook live HMAC, bật "Tự động gửi lại khi server trả lỗi" + cảnh báo lỗi liên tiếp, giao dịch nhỏ thật), `graphify update .`                              | 1–6                       | Checklist đạt                                                                                                                              |

Trước giai đoạn 6, cảnh báo webhook lỗi dựa vào cảnh báo sẵn có của SePay.

---

## 12. Rà soát lần cuối (21/11/2026)

Câu hỏi mở cũ đã chốt: O1 → D10, O2 → D11. Không còn câu hỏi nghiệp vụ chặn giai đoạn 0.

Đã sửa khi rà soát:

- Mâu thuẫn "upload chỉ ở Thư viện" ↔ upload ở màn Chứng từ: không mâu thuẫn thật, vì `AttachmentPicker` đã có
  upload; chỉ thêm props (5.6). Tài liệu `SYSTEM_CONTEXT.md` lệch code, đưa vào mục 10.
- Các chỗ còn nhắc "đối soát định kỳ" sau khi bỏ đồng bộ tự động đã đổi thành gửi lại/lấy thủ công.
- Giao dịch nhập tay thêm vào chống trùng (4.9), quyền `create`, giai đoạn 2, kiểm thử, rủi ro R-23.
- File riêng tư tách thành giai đoạn 0b vì là thay đổi common của `system`, giai đoạn 4 phụ thuộc nó.
- Quyền xem file riêng tư tách `read_private` khỏi `manage_all` (R-24).
- Bản 5: chống trùng chuyển sang theo mã giao dịch (D13, 3.4); thêm mẫu thông báo (7.1); bỏ `BankTransaction.received_at`
  trùng tên khác nghĩa với `IncomeRecord.received_at` (dùng `created_at` có sẵn); sắp lại bảng quyết định; viết lại V2,
  V3 dễ hiểu.

Cần kiểm khi bắt tay làm (không cần chủ dự án quyết, nhưng phải xác minh thật trước khi chốt code):

| #   | Việc                                                                                                                                                                                                                                                                                                                                             | Ở giai đoạn |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| V1  | Mã giao dịch của webhook (`referenceCode`) và của API (`reference_number`) cho cùng một giao dịch giống nhau — thử bằng Test mode: mô phỏng giao dịch rồi bấm lấy thủ công, phải ra đúng một dòng                                                                                                                                                | 2           |
| V2  | Chữ ký webhook không bị hỏng trên đường đi. SePay ký lên nguyên văn nội dung gửi đi; nếu request đi qua proxy (`toannx.com` rewrite sang backend) mà proxy đổi nội dung (nén, đổi mã hóa) thì chữ ký không khớp và hệ thống từ chối mọi webhook. Cách làm: cấu hình URL webhook thẳng vào `api.toannx.com` và gửi thử một webhook sau khi deploy | 2 / go-live |
| V3  | Đăng ký nhóm Telegram: khi thêm bot vào nhóm qua link, tin nhắn bot nhận được chứa mã đăng ký ở đúng dạng nào — chỉ ảnh hưởng cách code đọc mã, người dùng không phải làm gì (nội dung tin gửi đi đã chốt ở 7.1)                                                                                                                                 | 6           |
| V4  | R2: tạo được link tạm trên bucket riêng tư bằng `boto3` hiện có; copy file giữa hai bucket                                                                                                                                                                                                                                                       | 0b          |
| V5  | Ảnh riêng tư hiển thị được qua `<Image unoptimized />` (đã đồng ý); thêm domain R2 vào CSP `img-src` nếu cần                                                                                                                                                                                                                                     | 0b          |
