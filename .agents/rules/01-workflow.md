---
trigger: always_on
description: Quy trình làm một việc trong repo và bảng "đổi gì thì cập nhật gì" để không sót.
---

# Quy trình làm việc

Có thể gọi trực tiếp `/start-task`, `/fix`, `/review-code` trong Claude Code hoặc `$start-task`, `$fix`, `$review-code`
trong Codex mà không dán `prompt.md`; skill lấy ngữ cảnh task hiện hành và tự đọc rule, docs, source. Chat thường vẫn
chọn workflow theo bảng bên dưới. Nếu gọi `start-task`/`fix` trong phiên mới mà không có mục tiêu/triệu chứng, hỏi
thông tin tối thiểu cần thiết và tiếp tục khảo sát phần độc lập.

## Các bước

1. Mỗi yêu cầu chat, đọc các rule `always_on` trong `.agents/rules/`; chọn rule `model_decision` theo ngữ nghĩa
   yêu cầu và nạp rule `glob` khi mở/sửa file khớp. Đọc `docs/rules/` đầy đủ theo phần việc. Người dùng không cần
   dán `prompt.md`, gõ tên skill hoặc lệnh slash. Việc UI thì dùng skill `ui-ux` trước khi thiết kế.
2. Phân tích: `graphify query`, tra `docs/common-catalog.md`, ghi ra common sẽ dùng lại.
3. Triển khai đúng lớp và convention hiện có, không tạo pattern mới khi đã có quy chuẩn.
4. Tự kiểm từng file đã mở theo `.agents/rules/90-done-checklist.md`, sửa vi phạm thấy được.
5. Chạy kiểm tra **chỉ cho phần đã sửa** (bên dưới).
6. Cập nhật tài liệu theo bảng "đổi gì thì cập nhật gì".
7. Báo cáo: đã đổi gì (BE/FE/tài liệu), common dùng lại/thêm, vi phạm đã sửa, lệnh kiểm tra + kết quả, phần chưa
   kiểm và lý do, việc còn tồn. Đọc `git status`/`git diff` ở chế độ chỉ đọc và đưa nội dung commit theo
   `docs/rules/git.md` cho **toàn bộ thay đổi chưa commit trong project**: mỗi commit có tiêu đề, dòng trống,
   body mô tả cụ thể trong khối `text` để dán vào VS Code, không phải lệnh Git. Nhiều mục đích độc lập thì
   tách nhiều khối; phân biệt thay đổi có sẵn. Không tự stage/commit/push.

## Chọn skill đúng việc

| Việc | Skill |
| --- | --- |
| Bắt đầu và triển khai task/tính năng mới | `start-task`; đọc source, rule và `docs/` liên quan trước khi viết |
| Sửa bug, regression, test fail hoặc hành vi sai | `fix`; tái hiện, tìm nguyên nhân gốc, sửa và kiểm hồi quy |
| Người dùng yêu cầu review code cuối task | `review-code`; rà toàn diện phần việc, tự sửa lỗi xác nhận được và kiểm lại |
| Tự tạo test FE/BE, chạy Playwright chụp ảnh sửa lỗi UI và monkey test | `test`; soi ảnh chụp, bóc bug bằng thao tác hỗn loạn, sửa và khóa regression test |
| Tái cấu trúc code BE/FE sạch mà giữ nguyên contract | `refactor`; tách lớp, một đơn vị/file, tái sử dụng `docs/common-catalog.md` |
| Audit bảo mật chủ động, giả lập tấn công và lưu file tái xác nhận | `review-security`; chạy exploit giả lập local, vá kèm test âm, ghi `docs/reports/security-verification.md` |
| Rà soát và sửa thiếu i18n `vi`/`en` toàn FE | `i18n-audit`; quét chuỗi cứng, đối chiếu JSON, BE error code và kiểm `/vi`/`/en` |
| Kiểm toán và lập ma trận phân quyền BE–FE ba tầng | `permission-audit`; đối chiếu `MEMBER`, owner, Admin/Portal và `seed_test_accounts` |
| Thiết kế model và Django migration an toàn cho PostgreSQL/Neon | `db-migration`; kiểm `UniqueConstraint` xóa mềm, index, `sqlmigrate` và migrate local |
| Hỏi về cấu trúc, quan hệ file/symbol hoặc nội dung codebase | `graphify`; query graph hiện có trước khi đọc rộng, chỉ update theo điều kiện của `AGENTS.md` |
| Tích hợp/tra dữ liệu SePay, chuyển khoản, VietQR, webhook thanh toán, hóa đơn | `sepay`; đọc trước khi gọi công cụ SePay |
| Người dùng yêu cầu audit bảo mật / code an toàn | `security-best-practices`; xem rule `security-review` |
| Người dùng yêu cầu rà hiệu năng Django | `django-perf-review`; xem rule `performance-review` |
| Viết/review React, Next.js | `vercel-react-best-practices`; giữ quy tắc Client-only của repo |
| Người dùng yêu cầu đo tốc độ trang/Core Web Vitals | `web-perf`; đo trên URL/môi trường thực, ghi rõ giới hạn công cụ |
| Viết/sửa unit test FE | `vitest` |
| Viết/sửa Playwright spec | `playwright-best-practices` |
| Mở UI thật, chụp và kiểm tương tác | `playwright-cli` |
| Thiết kế UI / rà UX | `ui-ux` / `web-design-guidelines` theo giai đoạn |

`start-task`, `fix`, `review-code` là workflow; skill chuyên môn chỉ nạp thêm khi phần việc cần. Chỉ chọn một
workflow chính theo mục đích câu chat; `review-code` chạy khi người dùng yêu cầu rà cuối, không mặc định sau mỗi
task. Nếu skill phù hợp chưa có trong project, cài vào `.agents/skills/` và `.claude/skills/` trước khi dùng,
kiểm tên, frontmatter và trigger; không tự thêm dependency của ứng dụng. `docs/rules/` quyết định kiến trúc,
phạm vi test và quyền thao tác.

## Kiểm tra theo phần đã sửa

| Đã sửa | Chạy |
| --- | --- |
| File Python | `uv run ruff format <file>`, `uv run ruff check <file>`, `uv run mypy <file>` |
| Endpoint/service | `uv run pytest --reuse-db app/<m>/tests/test_<x>.py` (DB local) |
| Route, view, quyền, serializer | thêm `core/tests/test_endpoint_access.py`, `test_module_conventions.py`, `test_openapi_schema.py` |
| Bất kỳ thứ gì vào OpenAPI (kể cả docstring view/method) | `pnpm api:types` trong `frontend/`, commit `api-schema.gen.ts` |
| File TS/TSX | `pnpm exec eslint <file>`, `pnpm exec prettier --check <file>`, `pnpm typecheck` |
| Logic FE có test | `pnpm test tests/unit/<file>.test.ts` |
| Route/page/layout/config FE | `pnpm build` (build vào thư mục riêng phải trả lại `tsconfig.json` nếu bị ghi đè) |
| Luồng người dùng | `pnpm e2e tests/e2e/<luồng>.spec.ts` |

Việc đổi UI/luồng: viết hoặc cập nhật test liên quan để bao phủ các trạng thái và tương tác bị ảnh hưởng; dùng
`playwright-cli` mở UI thật, chụp ảnh, kiểm responsive, console và network, rồi phân tích ảnh để sửa lỗi nhìn thấy.
Không chạy toàn bộ E2E khi chưa được yêu cầu; nếu môi trường không mở được UI, ghi rõ phần chưa xác minh.

## Đổi gì thì cập nhật gì (cùng lần sửa)

| Thay đổi | Phải cập nhật |
| --- | --- |
| Model, quyền, route, sự kiện, webhook/callback của module | `docs/modules/<m>/README.md` |
| Cách một chức năng chạy | `docs/features/<chức-năng>.md` (+ mục lục `docs/README.md` nếu file mới) |
| Thêm/đổi/xóa common BE/FE | `docs/common-catalog.md` |
| Thêm/đổi/xóa biến môi trường | `.env.example` (chú thích tiếng Việt), `docs/guides/deployment.md` nếu production |
| OpenAPI (route, serializer, view, docstring, mã lỗi) | `frontend/src/shares/types/api-schema.gen.ts` qua `pnpm api:types` |
| Rule trong `docs/rules/` | Rule AI tương ứng trong `.agents/rules/` → `python scripts/sync-ai-rules.py` |
| `CLAUDE.md` | `AGENTS.md` (và ngược lại), nội dung rule khớp nhau |
| Quy trình/bảng kiểm | `prompt.md` |
| Thay đổi lớn (thêm/gộp module, dời ≥ 10 file, đổi cấu trúc thư mục) | `graphify update .` |
