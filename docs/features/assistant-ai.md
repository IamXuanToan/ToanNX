# Trợ lý AI & Chatbot đa kênh (Web + Telegram)

Trợ lý AI cá nhân trên ToanNX hỗ trợ đồng bộ 1 luồng chat trên Web Portal (`AssistantFloatingWidget`) và kênh Telegram 2 chiều (chat riêng DM & nhóm Telegram), giúp người dùng hỏi đáp, tra cứu số liệu thật, tạo mới dữ liệu nhanh bằng ngôn ngữ tự nhiên và xóa an toàn có xác nhận 2 bước.

## 1. Khả năng & Thao tác được hỗ trợ

Trợ lý AI được huấn luyện (`ASSISTANT_CORE_SYSTEM_PROMPT` trong `backend/app/workspace/constants/assistant_training_prompt.py`) để hiểu ngôn ngữ tự nhiên tiếng Việt (bao gồm viết tắt tiền tệ `30k`, `1tr5`, `200k`, ngày tương đối `hôm nay`, `5 ngày qua`, `tuần tới`) và thực thi trực tiếp qua bộ công cụ (`AssistantToolsService` & `AssistantWriteToolsService`):

| Nhóm nghiệp vụ | Tra cứu / Đọc | Tạo & Cập nhật | Xóa an toàn (2 bước) |
| --- | --- | --- | --- |
| **Nhắc việc (`Reminder`)** | Xem việc hôm nay, quá hạn, tuần này, tất cả, lọc theo từ khóa (`get_pending_reminders`) | Tạo nhắc việc mới (`create_quick_reminder`), sửa ngày/giờ/tiêu đề hoặc đánh dấu hoàn thành (`update_reminder`) | Xóa nhắc việc (`delete_personal_record` với `resource_type="reminder"`) |
| **Tài chính (`Income`, `Platform`)** | Xem dòng tiền theo `N` ngày gần nhất (`days=5`), khoảng ngày (`from_date`..`to_date`), hoặc theo tháng/năm & nền tảng (`get_finance_income_summary`); xem danh sách nền tảng (`list_finance_platforms`) | Ghi nhận thu nhập nhanh (`create_finance_income`), tự khớp nền tảng hoặc hỏi lại nếu mơ hồ; tạo nền tảng mới (`create_finance_platform`); sửa khoản thu (`update_finance_income`) | Xóa khoản thu (`delete_personal_record` với `resource_type="income"`) |
| **Thiết bị & Bảo hành (`Asset`, `AssetWarrantyClaim`)** | Tra cứu thiết bị, nơi mua, hạn bảo hành (`get_assets_and_warranty`), phiếu sửa chữa (`list_warranty_claims`) | Thêm thiết bị mới (`create_asset`), tạo phiếu bảo hành/sửa chữa (`create_warranty_claim`) | Xóa thiết bị / phiếu bảo hành (`delete_personal_record`) |
| **Dịch vụ định kỳ (`Subscription`)** | Xem dịch vụ sắp gia hạn trong `N` ngày (`get_upcoming_subscriptions`), tổng chi tiêu tháng (`get_spending_summary`) | Tạo dịch vụ định kỳ mới (`create_subscription`), ghi nhận gia hạn (`renew_subscription`) | Xóa dịch vụ (`delete_personal_record` với `resource_type="subscription"`) |
| **Tiện ích (`ShortLink`, `QrCode`)** | Xem danh sách link rút gọn (`list_short_links`), dự án/trang lâu chưa cập nhật (`get_stale_projects`) | Tạo link rút gọn (`create_short_link`), tạo mã QR (`create_qr_code`) | Xóa link rút gọn / mã QR (`delete_personal_record`) |
| **Lịch tổng hợp** | Xem lịch 6 nguồn trong `N` ngày tới (`get_upcoming_events`) | — | — |
| **Két sắt bí mật (`VaultItem`)** | **Tuyệt đối cấm** | **Tuyệt đối cấm** | **Tuyệt đối cấm** |

## 2. Bộ mẫu câu chat tự nhiên & Cách Bot phản hồi

### 2.1. Ghi nhận thu nhập nhanh (ví dụ `"tiền afff 30k"`)
- **Người dùng nhắn**: `tiền afff 30k` hoặc `nhận 1tr5 youtube hôm nay`.
- **Cách Bot xử lý**:
  1. Tự quy đổi `30k` → `30.000 VNĐ`, ngày nhận mặc định hôm nay (`Asia/Ho_Chi_Minh`).
  2. Đối chiếu `afff` với danh sách nền tảng của bạn:
     - **Khớp duy nhất 1 nền tảng** (ví dụ `Affiliate`): Bot tạo khoản thu ngay và trả lời xác nhận rõ nền tảng, số tiền, ngày nhận.
     - **Chưa có hoặc khớp nhiều nền tảng**: Bot **không tự tạo bừa**, trả về danh sách các nền tảng hiện có và **hỏi lại** bạn muốn chọn nền tảng nào, tạo nền tảng mới `afff`, hay ghi nhận chưa phân loại.

### 2.2. Hỏi dòng tiền theo số ngày (ví dụ `"dòng tiền nhập vào trong 5 ngày"`)
- **Người dùng nhắn**: `dòng tiền nhập vào trong 5 ngày` hoặc `5 ngày qua thu được bao nhiêu`.
- **Cách Bot xử lý**: Gọi `get_finance_income_summary(days=5)` để tính tổng thu nhập, thuế, số giao dịch, phân tích chi tiết theo từng ngày, theo từng nền tảng và liệt kê các giao dịch gần nhất.

### 2.3. Hỏi việc hôm nay rồi yêu cầu xóa (Xác nhận 2 bước chống xóa nhầm)
- **Lượt 1**: Bạn hỏi `hôm nay có việc gì?` → Bot gọi `get_pending_reminders(scope="today")` và liệt kê rõ từng việc.
- **Lượt 2**: Bạn nhắn `việc hôm nay không cần nữa xóa đi`.
  - Nếu có **nhiều việc**: Bot liệt kê từng việc kèm ngày/giờ và hỏi bạn muốn xóa chính xác việc nào.
  - Nếu xác định được **1 việc cụ thể**: Bot gọi `delete_personal_record` lần 1. Backend (`AssistantConfirmationService`) lưu yêu cầu chờ xác nhận vào cache/Redis (TTL 5 phút) gắn với lượt chat hiện tại và trả về `requires_confirmation: True`. Bot **bắt buộc hỏi lại** đúng tên và ngày/giờ của việc đó (ví dụ: *"Bạn có chắc chắn muốn xóa Nhắc việc 'Mua sữa' (ngày 2026-11-28 lúc 09:00) không?"*).
- **Lượt 3**: Bạn trả lời `Đồng ý` / `Xóa đi` → Bot gọi `delete_personal_record(..., confirmed=True)`. Backend kiểm tra đúng người sở hữu, đúng hội thoại, đúng mục và **phải khác lượt hỏi** (chống AI free tự xác nhận trong cùng 1 lượt) rồi mới thực hiện xóa thật.

## 2A. Huấn luyện nền tảng: luật nằm trong code (không chỉ trong prompt)

Model free hay bỏ qua lời dặn trong prompt, nên các luật quan trọng được ép bằng code
(plan: `docs/plans/2026/11/28/assistant-learning-memory-plan.md` §5.7):

- **AI hiểu model từ chính metadata** (`AssistantToolSpecBuilder`, `constants/assistant_tool_models.py`): mỗi tool
  gắn với model nguồn; mô tả, enum (kèm nhãn `VALUE=Nhãn`) và `maxLength` của tham số được bổ sung từ `verbose_name`,
  `help_text`, `choices` của model mỗi lần gửi schema cho LLM. Thêm field/choice vào model là AI tự thấy.
- **Nháp → chọn → tạo dùng chung cho mọi tool tạo** (`AssistantDraftService`, chạy trong
  `AssistantToolsService.execute_tool`): tùy chọn người dùng phải tự quyết chỉ khai **tên field** trong
  `constants/assistant_ask_fields.py` (`AssistantAskField`); câu hỏi lấy từ `verbose_name` + `help_text`, lựa chọn lấy
  từ `choices` / boolean (Có/Không) / mốc gợi ý cho field số, giới hạn lấy từ validator. Người dùng **chưa tự nêu** ô
  nào trong câu (nhận diện cụm từ không dấu và "N đơn vị" gần từ ngữ cảnh, VD "nhắc trước 10p", "1 tiếng", "hàng tuần";
  giá trị model tự điền bị bỏ qua) → không tạo, server trả câu hỏi đánh số + nút (`metadata.quick_replies`). Hiện áp
  dụng:

  | Tool | Ô hỏi (theo thứ tự) |
  | --- | --- |
  | `create_quick_reminder` | Nhắc trước (phút) — chỉ khi có giờ; Số ngày nhắc trước — khi chỉ có ngày; Lặp lại (`Reminder.Recurrence`) |
  | `create_short_link` | Kiểu mở (Chờ bấm nút / Chuyển ngay (1 giây) / Đếm ngược 3–5–10 giây; DB chỉ nhận `null` hoặc 1..60) → Mật khẩu (Không / Có → gõ, che khỏi lịch sử) |
  | `create_subscription` | Chu kỳ gia hạn (`Subscription.BillingCycle`) → Số ngày chu kỳ (chỉ khi `CUSTOM_DAYS`) → Số ngày nhắc trước → Tự động trừ tiền |
  | `create_asset` | Số tháng bảo hành |

  Ví dụ "Tạo tôi 1 nhắc lịch ngày hôm nay lúc 11h" → hỏi "Nhắc trước (phút)?" (Không nhắc trước / 5 / 15 / 30 / 60 phút,
  hoặc gõ "10 phút", "1 tiếng") → hỏi "Lặp lại?" → tạo. Link rút gọn còn được đổi slug sang slug đẹp **còn trống**
  (`ShortLinkService.suggest_available_slugs`). Thêm tool tạo mới: khai model trong `ASSISTANT_TOOL_MODELS` và (nếu cần)
  tên field trong `ASSISTANT_ASK_FIELDS` — không viết hàm hỏi riêng.
- **Trả lời theo số / nhãn / "N đơn vị", 0 token**: khi hội thoại có nháp, tin kế tiếp là `1`, `2`…, trùng nhãn lựa
  chọn hoặc dạng "15 phút" được map thẳng (không gọi LLM); đủ ô thì server gọi tool luôn. Tin không khớp lựa chọn → bỏ nháp, chat bình thường. Tin chứa
  mật khẩu được lưu dạng `••••••` và đánh dấu `contains_private_data`.
- **Trạng thái chờ lưu trong PostgreSQL** (`AssistantConversation.pending_action` + `pending_expires_at`, TTL 10 phút)
  cho cả nháp và xóa 2 bước — trước đây nằm trong `LocMemCache` theo process nên mất khi rơi vào instance serverless khác.
- **Thẻ kết quả & chặn URL bịa**: tool ghi thành công có thẻ (`AssistantResultCardBuilder`, `metadata.cards`) thì câu
  trả lời dùng nội dung server dựng từ DB (URL `{origin}/s/{slug}` thật); FE hiện nút **Sao chép link** / **Mở link**.
  Mọi câu trả lời khác qua `AssistantReplyGuard`: URL không có trong ngữ cảnh lượt đó (tin người dùng, output tool,
  lịch sử gửi model) hoặc không thuộc origin hệ thống bị thay bằng URL thật cùng slug hoặc gỡ bỏ.
- **Chọn tool theo câu hỏi** (`AssistantToolRouter`, nhóm trong `constants/assistant_tool_groups.py`): câu có từ khóa
  chủ đề chỉ gửi nhóm tool đó + nhóm lõi (≤ 14 tool); không nhận diện được → gửi đủ như cũ.
- **Enum tool lấy từ model**: `update_short_link.status` dùng `ShortLink.Status` (`ACTIVE`/`INACTIVE`; giá trị cũ
  `DISABLED` vẫn được hiểu là `INACTIVE`), `qr_type` lấy từ `QrCode.Type` (trừ `BANK_TRANSFER`).
  `test_assistant_tool_specs.py` fail nếu enum của tool không khớp choices của model nào.

## 2A.1. Nhắc việc hỏi đủ nội dung/ngày/giờ, link xem lại, nhớ bản ghi vừa thao tác

- **Nhắc việc** (`create_quick_reminder`) hỏi theo thứ tự những gì người dùng chưa nói: *Bạn muốn nhắc việc gì?* (tiêu đề
  chung chung như "nhắc lịch" không tính — `GENERIC_REMINDER_TITLE_WORDS`) → *Nhắc vào ngày nào?* (Hôm nay/Ngày mai/Ngày
  kia/Tuần sau hoặc gõ ngày) → *Nhắc lúc mấy giờ?* (Cả ngày, 08:00…20:00 hoặc gõ "14:30", "2h chiều") → nhắc trước (phút
  nếu có giờ, ngày nếu cả ngày) → lặp lại. Ngày/giờ tiếng Việt đọc bằng `AssistantDateTimeParser` (giờ Việt Nam; "trước
  2h" là khoảng nhắc, không phải giờ hẹn; nói giờ không nói ngày = hôm nay). Ô kiểu `text`/`date`/`time` khai bằng
  `value_kind` trong `ASSISTANT_ASK_FIELDS`.
- **Link xem lại**: mọi tool tạo/sửa thành công trả thẻ (`metadata.cards`: `type`, `kind_label`, `id`, `title`, `url`,
  `view_url`) với link tới trang chi tiết Portal (`constants/assistant_record_links.py`). Link xem lại **chỉ có một chỗ**:
  Web hiện đúng một nút **Xem chi tiết** từ thẻ; Telegram (không vẽ thẻ) được router gắn một dòng
  `🔗 Xem chi tiết <loại>` khi gửi (`AssistantResultCardBuilder.link_lines`). Nội dung tin lưu DB không chứa link Portal:
  `strip_view_links` gỡ mọi link `view_url` model tự chép (nhãn là tên bản ghi thì giữ chữ, nhãn "Xem chi tiết/tại đây"
  bỏ, dòng chỉ còn nhãn bỏ cả dòng); URL khác (trang công khai, link rút gọn) giữ nguyên. Tin cũ còn link được gỡ lúc
  trả API lịch sử (`AssistantMessageResponseSerializer.to_representation`). Thẻ trùng bản ghi được gộp.
- **Nhớ bản ghi vừa thao tác**: thẻ trong lịch sử gần được đưa vào system prompt (khối `BẢN GHI VỪA THAO TÁC` kèm ID +
  tool sửa/xóa) và tool sửa tương ứng luôn được gửi cho model (router không lọc mất) → "đổi tên cái vừa tạo", "dời sang 3h
  chiều" sửa đúng bản ghi bằng `update_*`, không xóa rồi tạo lại.
- **Không đổi nhầm hồ sơ**: `update_my_profile` chỉ chạy khi câu nói rõ tên/hồ sơ của chính mình
  (`PROFILE_INTENT_PHRASES`) — sự cố "đổi tên cái vừa tạo" từng đổi tên tài khoản đã có regression test.
- Markup gọi tool một số model in lẫn vào nội dung (DSML, `<｜…｜>`, `tool_calls>`) bị `AssistantReplyGuard` gỡ trước khi
  hiển thị. Mỗi lượt tool chạy trong `transaction.atomic()` (sửa lỗi 500 `select_for_update` ngoài transaction khi sửa/xóa).

## 2B. Chỉ dữ liệu cá nhân — từ chối yêu cầu quản trị bằng code

- `AssistantScopeGuard` (cụm từ trong `constants/assistant_scope_rules.py`) chặn **trước LLM và tool** mọi yêu cầu quản
  trị: liệt kê/đếm/tạo/xóa/khóa tài khoản người dùng, vai trò, phân quyền, cấu hình hệ thống/Bot, nhật ký, webhook,
  token/API key/biến môi trường, cơ sở dữ liệu, dữ liệu của người khác hoặc toàn hệ thống. Áp dụng **cả superuser /
  `manage_all`**, trên Web lẫn Telegram; trả câu từ chối cố định (`model_used="scope_guard"`, 0 token). Câu nói rõ
  "của tôi"/"két sắt" (VD "danh sách tài khoản trong két sắt của tôi") không bị chặn. Lệnh slash không qua guard.
- Mọi tool đọc/sửa/xóa lọc `owner_id = người đang chat` ở service/repository, kể cả superuser; tool sửa/xóa bản ghi người
  khác trả lỗi. `test_assistant_superuser_personal_scope.py` khóa toàn bộ tool đọc/sửa/xóa,
  `test_assistant_scope_guard.py` khóa danh sách câu từ chối/cho phép.

## 2C. RAG tri thức Client Portal (pgvector + Gemini, fallback full-text)

- Nguồn tri thức: `backend/app/workspace/knowledge/client_portal/*.md` (mỗi heading `##` là một đoạn: chức năng, tool,
  mẫu câu, lưu ý) + đoạn "Trường dữ liệu" sinh tự động từ metadata model của từng tool (không chứa field kỹ thuật/bí mật).
  Bảng `AssistantKnowledgeChunk` lưu nội dung + vector `halfvec(768)`.
- Nguồn thứ ba: đoạn "Thao tác <tài nguyên>" sinh tự động từ registry tool chung `ASSISTANT_RECORD_RESOURCES` (xem/sửa
  được trường nào, xóa được không, trang Portal, lưu ý) — thêm tài nguyên mới là tri thức có ngay.
- Đồng bộ **tự động sau mỗi `migrate`** (hook `post_migrate` trong `workspace/apps.py` →
  `AssistantKnowledgeService.sync_after_migrate`): môi trường mới, deploy, `scripts/dev.bat` đều có tri thức ngay mà không
  cần nhớ lệnh. DB test (`test_*`) chỉ nạp văn bản, không gọi Gemini; lỗi DB chỉ ghi cảnh báo, không làm hỏng `migrate`.
  Thủ công: `uv run python manage.py sync_assistant_knowledge` (`--no-embed` để không gọi Gemini) khi chỉ sửa `.md`;
  task dọn dẹp hằng ngày `sync_assistant_knowledge` là lưới an toàn (chỉ đoạn mới/đổi mới gọi Gemini). Bảng trống thì
  lượt chat đầu tự nạp (không nhúng).
- Truy hồi mỗi lượt chat: xếp hạng từ khóa không dấu (BM25 + bigram) luôn chạy; có `GEMINI_API_KEY` thì thêm tìm theo nghĩa
  (pgvector cosine, chỉ so vector cùng `embedding_model`) và trộn bằng RRF; top 3 đoạn (≤ 2.400 ký tự) chèn vào system
  prompt. Nhóm Telegram không gửi câu hỏi sang Gemini. Gemini lỗi/429 → cooldown, dùng từ khóa.
- Thêm chức năng mới: viết thêm file `.md` vào thư mục tri thức rồi chạy lệnh đồng bộ.

## 2C.1 Tool chung CRUD dữ liệu Portal không có tool riêng

- Registry `constants/assistant_record_resources.py` (`AssistantRecordResource`): `invoice` (hóa đơn/chứng từ),
  `platform` (nền tảng thu nhập), `file` (thư viện file, owner `created_by`), `donation` (giao dịch ủng hộ — chỉ
  ẩn/hiện `is_hidden`), `subscription_payment` (lần thanh toán — chỉ xem/xóa), `page_path` (đường dẫn giữa — danh mục
  chung, chỉ xem).
- `list_my_records(resource, query)`: kiểm quyền đọc, lọc owner (kể cả superuser), tìm không dấu, tối đa 15 dòng.
- `update_my_record(resource, record_id, fields)`: kiểm quyền sửa, validate bằng **serializer update của API**
  (`partial=True`), `get_for_write` + kiểm owner, gọi `service.update`; thẻ kết quả lấy link theo `resource`
  (`GENERIC_RECORD_LINKS`) và bản ghi được nhớ để sửa tiếp.
- Xóa 2 bước qua `delete_personal_record` với `invoice`, `platform`, `file`, `subscription_payment`.
- Tạo hóa đơn/tải file cần upload nên làm trên giao diện; Trợ lý hướng dẫn mở trang Portal.

## 2C.2 Đường dẫn giữa của trang (`/<segment>/<slug>`)

- `update_page(page_id, path_segment, create_path_if_missing)` và `create_page(..., path_segment,
  create_path_if_missing)`: tìm segment không phân biệt hoa thường; đang tắt → lỗi; chưa có và không cờ → lỗi gợi ý hỏi
  người dùng; chưa có + cờ + quyền `utilities.page_path.create` (superuser có) → tạo `PagePath` rồi chuyển trang.
  Không quyền → báo nhờ quản trị viên. Segment dành riêng (`quan-tri`, `api`, `ca-nhan`...) bị từ chối.
- Seed `utilities/0002_seed_page_paths` luôn có `p` và `qr` ở môi trường mới; `create_page` mặc định đường dẫn giữa
  đầu tiên theo `position` (`p`). Kết quả trả `path_segment`, `public_url` để trả lời đúng địa chỉ mới.
- Test: `test_assistant_generic_record_tools.py` (tool chung, xóa mới, đường dẫn giữa, post_migrate).

## 2D. Trả lời nhanh trên Web và Telegram

- **Web**: dưới câu hỏi lựa chọn có chip gọn (`h-7`, bo tròn) và — nếu ô cho phép — ô nhập ngay bên dưới
  (`metadata.quick_input`): `number` kèm đơn vị ("Số phút khác … phút", gửi "10 phút"), `text`, hoặc `secret` (ô mật khẩu
  có nút ẩn/hiện, bong bóng chờ hiện `••••••`). Nội dung câu hỏi không lặp danh sách lựa chọn.
- **Telegram**: lựa chọn là **nút inline** 2 nút/hàng (`callback_data = aqr:<số thứ tự>`); bấm → bot báo "Đã chọn …", gỡ
  bàn phím khỏi câu hỏi cũ và xử lý ngay (0 token, không qua QStash). Ô chỉ cần gõ → `force_reply` mở sẵn khung trả lời
  với gợi ý. Thành viên khác trong nhóm bấm nút → bị từ chối. Tin người dùng gõ mật khẩu được xóa khỏi chat (nếu bot có
  quyền); trong nhóm Telegram **không thu mật khẩu** — bot hủy thao tác và hướng dẫn tạo trong tin nhắn riêng/Web.
- Câu hỏi lựa chọn luôn gửi trong chat hiện tại (không chuyển DM) vì nháp gắn với hội thoại đó.

## 3. Phân quyền & An toàn cho AI Free

1. **Kiểm tra & Lọc Schema RBAC động theo tài khoản (`TOOL_PERMISSION_MAP`, `DELETE_RESOURCE_PERMISSION_MAP`)**: Hệ thống tự động lọc danh sách tool gửi lên AI và chặn cả lời gọi trực tiếp/Slash command theo đúng quyền thực tế của tài khoản (`actor.has_perm(...)`). Ví dụ: tài khoản không được cấp quyền module Tài chính sẽ không thấy tool Tài chính và không thể truy vấn hay tạo khoản thu nhập.
2. **Ép phạm vi chính chủ (`owner_id=actor.pk`)**: Kể cả khi tài khoản là Admin/Superuser có `*.manage_all`, mọi truy vấn và thao tác qua Chatbot chỉ tác động lên dữ liệu của chính chủ tài khoản đó.
3. **Chỉ Client Portal cá nhân — Cấm tuyệt đối Admin hệ thống**: Chatbot hoàn toàn không có tool đọc hay sửa cấu hình hệ thống, danh sách người dùng khác, vai trò/phân quyền, nhật ký hệ thống hay webhook.
4. **Két sắt bí mật (`VaultItem`) có kiểm quyền & ghi nhật ký**: Chỉ chính chủ (`is_owner=True`) có quyền `workspace.vault_item.read`/`reveal`/`create`/`update`/`delete` mới xem, giải mã đọc mã bí mật (tự ghi nhật ký `workspace.vault.revealed`), thêm, sửa hoặc xóa (2 bước) mục Két sắt của chính mình.
5. **Hỏi lại kỹ, hạn chế tự đoán & Xác nhận 2 bước**: Khi người dùng nói mơ hồ (ví dụ `"đổi tên thành ABC"` mà chưa rõ mục nào) hoặc yêu cầu xóa, Bot bắt buộc hỏi lại xác nhận rõ trước khi thực thi; Backend (`AssistantConfirmationService`) chặn mọi thao tác tự confirm trong cùng 1 lượt.

## 4. Cấu hình 2 chế độ cho Nhóm Telegram

Tại **Hồ sơ → Thông báo → Nơi nhận Telegram** (`TelegramChatList`), mỗi nhóm Telegram (`group` / `supergroup`) có 2 chế độ phản hồi riêng:

1. **Chỉ trả lời khi `@mention` / lệnh (`mention_only`)** — *Mặc định an toàn*:
   - Phù hợp cho nhóm đông thành viên. Bot chỉ đọc và trả lời khi được tag `@username_bot`, reply tin nhắn của bot hoặc gọi lệnh `/`.
2. **Đọc và trả lời mọi tin nhắn (`all_messages`)** — *Phù hợp nhóm 2 người (chỉ bạn và bot)*:
   - Bot đọc và trả lời mọi tin nhắn bạn gửi trong nhóm mà không cần `@mention` hay reply.
   - Bot vẫn tự động bỏ qua tin nhắn từ bot khác (`from.is_bot=True`) để tránh lặp vô tận, và vẫn áp dụng chính sách quyền chủ sở hữu (`telegram_group_tool_policy`) nếu có người khác trong nhóm chưa xác minh DM.

Admin cũng có thể bật/tắt AI Telegram toàn hệ thống và cấu hình chính sách mặc định tại **Quản trị → Hệ thống → Trợ lý AI** (`/quan-tri/he-thong/tro-ly-ai`).

## 5. Bộ lệnh Slash 0-token (dùng cả Web & Telegram)

- `/hom_nay` (`/today`): Xem việc cần làm & nhắc hẹn hôm nay.
- `/sap_toi [số_ngày]` (`/upcoming [days]`): Xem dịch vụ định kỳ sắp gia hạn.
- `/chi_tieu [mm/yyyy]` (`/spending [mm/yyyy]`): Tổng hợp chi tiêu tháng.
- `/thiet_bi [từ_khóa]` (`/assets [keyword]`): Tra cứu thiết bị & bảo hành.
- `/nhac_viec <nội_dung>` (`/remind <text>`): Tạo nhanh nhắc việc.
- `/xoa_lich_su` (`/clear`): Xóa lịch sử trò chuyện.
- `/tro_giup` (`/help`): Xem danh sách lệnh nhanh.
