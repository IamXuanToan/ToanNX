---
name: review-security
description: "Rà soát bảo mật hệ thống full-stack cho repo ToanNX, thực hiện giả lập tấn công (Auth, CSRF, IDOR, leo thang quyền IAM, file riêng tư, webhook HMAC, XSS/SSRF/ReDoS), vá lỗ hổng kèm test âm và tạo/cập nhật file trong docs/reports/ để tự động tái xác nhận ở các lần sau."
---

# Rà soát bảo mật, giả lập tấn công và tự động xác nhận lại

Skill này thực hiện kiểm toán bảo mật **chủ động có kiểm chứng** cho cả Backend Django và Frontend Next.js trong repo ToanNX: vừa soi tĩnh mã nguồn, vừa **giả lập tấn công thực nghiệm** trên môi trường local/test, xử lý triệt để lỗ hổng tìm được và duy trì file xác nhận tự động trong `docs/reports/`.

> **Giới hạn an toàn bắt buộc:**
> - **TUYỆT ĐỐI KHÔNG** chạy giả lập tấn công lên domain/DB production hoặc gửi payload thật tới dịch vụ thứ ba (SePay, Cloudflare R2, Firebase, Telegram). Chỉ tấn công vào Django `APIClient` / `csrf_client` trên PostgreSQL test local (`--reuse-db`) hoặc server local (`localhost`/`127.0.0.1` + DB test/dev).
> - Không in secret thật (`.env`, token, `DJANGO_SECRET_KEY`, signed URL thật) ra màn hình, log hay báo cáo.
> - `docs/rules/` luôn thắng skill ngoài; mọi bản vá phải đúng lớp `view → service → repository` và chuẩn quyền/API của repo.

## Bước 0 — Tái xác nhận tự động & Chốt phạm vi theo Sổ theo dõi

1. Chạy `uv run --no-project python scripts/audit_tracker.py list-pending --axis security --format paths` để kiểm tra danh sách file mới sửa / `NEEDS_CHECK` trên trục `security` trong **`docs/reports/code-audit-tracker.md`**. Mặc định tập trung soi sâu & giả lập tấn công vào **các file đang `NEEDS_CHECK`** và các luồng nhạy cảm liên quan (trừ khi người dùng yêu cầu rà lại toàn bộ hệ thống).
2. Kiểm tra xem file **`docs/reports/security-verification.md`** đã tồn tại chưa. Nếu **đã có**:
   - Đọc bảng case `SEC-*` và mục **"Lệnh tái xác nhận tự động"** trong file đó.
   - Chạy lại toàn bộ các lệnh test/exploit đã ghi nhận để xác minh **không có lỗ hổng cũ nào bị tái phát (regression)**.
   - Đánh dấu case nào vừa Fail hoặc cần mở rộng do code trong `NEEDS_CHECK` / `git status` vừa thay đổi.
3. Đọc tài liệu nền & nạp skill tham chiếu:
   - `docs/rules/common.md` (mục 5 & 5.2), `docs/architecture/authentication.md`, `docs/architecture/authorization.md`, `docs/features/attachment-visibility.md`, `docs/features/permission-scope.md`, `.agents/rules/54-security-review.md`.
   - Đọc `.agents/skills/security-best-practices/SKILL.md` cùng 3 tài liệu tham chiếu đúng stack: `python-django-web-server-security.md`, `javascript-typescript-nextjs-web-server-security.md`, `javascript-typescript-react-web-frontend-security.md`.

## Bước 1 — Lập bản đồ bề mặt tấn công (Attack Surface)

Xác định phạm vi rà (toàn hệ thống nếu người dùng không giới hạn, hoặc tập trung sâu vùng vừa đổi + bề mặt nhạy cảm liên quan):
- **Public & Cron endpoints** (`PUBLIC_VIEWS` trong `core/tests/test_endpoint_access.py`, webhook SePay/Donation, `CleanupView`, `NotificationDispatchView`, `/s/{slug}`, `/pages/public/...`, login/refresh/reset/social auth).
- **Login-only endpoints** (`LOGIN_ONLY_VIEWS`: `/me`, `/sessions`, `/attachments/{id}/content`, `/qr-codes/banks`, `/novel/client/*`).
- **IAM & Owner-scoped CRUD** (`system`, `utilities`, `novel`, `finance`, bulk actions, export CSV).
- **FE Client & Proxy boundary** (`src/proxy.ts`, `sanitizeNextPath`, `TiptapContent`, QR/Page renderer, `NEXT_PUBLIC_*`, cookie & token handling).

## Bước 2 — Giả lập tấn công & Kiểm tra các case

Đọc chi tiết toàn bộ vector và payload giả lập tại [attack-playbook.md](references/attack-playbook.md). Thực hiện giả lập đủ **7 nhóm tấn công** (bằng test `pytest` dùng `APIClient`/`csrf_client`, script Python cục bộ, hoặc Playwright/Vitest):

1. **AuthN, JWT & Session Bypass**: giả mạo JWT (`alg: none`, sai chữ ký, payload giả `sub`/`sid`), dùng access token của phiên đã thu hồi hoặc user bị `is_active=False`, replay **refresh token đã xoay vòng** (xác nhận toàn family phiên bị thu hồi + 401 `AUTH_REFRESH_REUSED`), giả cookie `session_hint=1` bypass `proxy.ts` vào thẳng API/UI admin, kiểm brute-force login/refresh chạm rate limit `429`.
2. **CSRF & Origin Spoofing**: gửi `POST/PATCH/DELETE` và `bulk-*` kèm cookie `access_token` nhưng bỏ qua/làm sai `X-CSRFToken` hoặc đổi `Origin`/`Referer`; kiểm Login CSRF và Logout CSRF.
3. **IDOR / BOLA & Lọc chéo Owner**: dùng User A tấn công `GET/PATCH/DELETE/duplicate/bulk/history/export` bản ghi của User B trên mọi model có `owner_field` → **phải trả 404** (không lộ 403 khi không phải chủ, trừ cấu hình đặc biệt đã định); thử truyền `?owner=<userB>`/`?owners=<userB>` khi không có `manage_all`; thử user có `read` nhưng thiếu `update`/`delete`/`export` gọi thẳng API ghi/xuất.
4. **Privilege Escalation & Mass Assignment**: staff không phải superuser thử sửa `is_superuser=True`, tự bật `is_active`/`is_staff` của mình, sửa tài khoản superuser, tự gán vai trò có quyền cao hơn mình đang có (`IAM_PRIVILEGE_ESCALATION`), sửa `is_system` role, chèn trường nội bộ (`owner_id`, `created_by`, `deleted_at`, `sepay_id`) qua JSON payload.
5. **Upload, File riêng tư & SVG/XML XSS/XXE**: upload file giả đuôi (`.php`/`.html` đổi sang `.png`), SVG nhúng `<script>`, `onload=`, `<foreignObject>`, `javascript:`, `xlink:href` ngoài; XML có `<!DOCTYPE`/`ENTITY` (XXE); gọi `/api/v1/system/attachments/{id}/content` hoặc rà response serializer xem có lộ storage URL thật của file `private` hay không (người lạ phải nhận 404).
6. **Webhook HMAC, Cron Secret & Secret Exposure**: bắn `SepayWebhookView`/`DonationWebhookView` thiếu/sai chữ ký HMAC-SHA256, `timestamp` lệch > ±300s (replay), sửa 1 ký tự body; bắn Cron endpoint với header `CRON_SECRET` rỗng/sai; quét response API/log/`.env.example`/`api-schema` đảm bảo không lộ `token` SePay, Telegram bot token, password hash hay `DJANGO_SECRET_KEY`.
7. **Injection, ReDoS, Open Redirect & XSS (FE + BE)**: Open redirect `?next=//evil.com`, `?next=/\evil.com`; ShortLink `destination_url` là `javascript:alert(1)` / `data:text/html`; `ClassificationRule` regex ác ý `(a+)+$` gây ReDoS; Stored XSS qua Tiptap/Custom Page/tên file/JSON-LD (`</script>`); kiểm `frontend/src` xem có SSR leak hoặc `NEXT_PUBLIC_*` chứa khóa bí mật.

## Bước 3 — Xử lý lỗ hổng & khóa bằng Regression Test

Với mỗi lỗ hổng xác nhận được:
1. Ghi nhận rõ `ID` (`SEC-xxx`), file:dòng, đường đi dữ liệu, payload PoC tái hiện và tác động.
2. Sửa tận gốc ở đúng lớp BE (`view → service → repository`) hoặc FE (`validate`, `sanitize`, `permission` UI 3 tầng). Không chỉ che nút trên FE để chống lỗi BE.
3. Viết **test âm (negative security test)** vào đúng file `test_<resource>_<action>_api.py` (hoặc Vitest/Playwright spec tương ứng) tái hiện chính payload tấn công vừa khai thác, khẳng định bị chặn (401/403/404/400/422/429).
4. Chạy lại toàn bộ PoC và test liên quan sau khi vá để chứng minh lỗ hổng đã đóng hoàn toàn (không chạm DB production).

## Bước 4 — Ghi file xác nhận tự động vào `docs/`

Khi hoàn thành kiểm tra và xử lý:
1. Tạo hoặc cập nhật **`docs/reports/security-verification.md`** theo đúng mẫu tại [report-template.md](references/report-template.md). Nếu đây là lần đầu có file mới này, thêm 1 dòng dẫn vào `docs/README.md` mục Báo cáo (hoặc kiểm tra đã liên kết chưa).
2. Trong file `docs/reports/security-verification.md` phải có đủ:
   - **Tổng hợp ngày quét, phạm vi và kết quả từng case (`SEC-001`, `SEC-002`, ...)** gồm: nhóm tấn công, endpoint/file mục tiêu, vector/payload giả lập, kỳ vọng an toàn, file test hồi quy khóa cứng case đó, trạng thái (`PASS` / `OPEN` / `PARTIAL`).
   - **Mục `Lệnh tái xác nhận tự động`**: khối lệnh hoàn chỉnh (BE dùng PostgreSQL local `--reuse-db` + FE Vitest/kiểm tĩnh) để bất kỳ lần chạy `/review-security` sau chỉ cần chạy lại là tự động xác minh toàn bộ hệ thống bảo mật không bị hồi quy.
   - **Mục `Giới hạn & Mục chưa kiểm runtime`** (nếu có case chưa bắn trực tiếp lên browser/server thật).
3. Nếu phát sinh đợt audit lớn cần lưu snapshot riêng theo ngày, có thể ghi thêm `docs/reports/<yyyy-mm-dd>-security-review.md` nhưng **vẫn giữ `docs/reports/security-verification.md` làm nguồn baseline sống để lần sau tự động xác nhận lại**.
4. Sau khi mọi test âm & kiểm tra bảo mật đạt, đóng dấu các file vừa rà/vá ở trục `security` vào `docs/reports/code-audit-tracker.md` qua `uv run --no-project python scripts/audit_tracker.py mark-checked --axis security --files <files...> --status <PASS|FIXED> --note "<tóm tắt SEC-*>"`.

Kiểm lại theo `.agents/rules/90-done-checklist.md`. Nếu người dùng nêu quy chuẩn bảo mật mới chưa có trong `docs/rules/`, tự động cập nhật đồng bộ ngay vào `docs/rules/`, `.agents/rules/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md` (kèm test quy ước nếu kiểm được) và chạy `python scripts/sync-ai-rules.py` (`--check`) trong cùng lượt. Không tự thao tác Git và không tự gợi ý nội dung commit trừ khi người dùng yêu cầu riêng (`commit-demo` / `commit-push`).
