---
name: start-task
description: "Bắt đầu và triển khai một task mới trong repo ToanNX: thêm tính năng, module, API, màn hình hoặc luồng nghiệp vụ. Tự chọn khi người dùng giao việc xây mới bằng chat thường. Không dùng cho yêu cầu chỉ sửa lỗi đã có hoặc review cuối; các việc đó dùng fix hoặc review-code."
---

# Bắt đầu task mới

Skill này tự đủ để xử lý yêu cầu mới: `/start-task` trong Claude Code hoặc `$start-task` trong Codex, không cần dán `prompt.md`. Nếu lời gọi không có đối số, lấy mục tiêu từ task hiện hành trong hội thoại và file/ticket đã chỉ. Nếu đây là phiên mới và chưa có mục tiêu, hỏi ngắn gọn người dùng muốn xây gì; vẫn đọc bối cảnh repo trong lúc chờ. Không tự biến diff có sẵn thành yêu cầu tính năng.

Thực hiện việc được giao đến khi có kết quả kiểm chứng được. Không dừng ở bản kế hoạch nếu người dùng đã yêu cầu triển khai. `docs/rules/` là nguồn chuẩn; skill này không thay đổi quyền thao tác Git, test hay triển khai.

## 1. Nạp bối cảnh trước khi sửa

1. Đọc `AGENTS.md`, `SYSTEM_CONTEXT.md`, `docs/README.md`, `docs/rules/common.md`, `docs/rules/git.md`, `docs/common-catalog.md` và rule `always_on` trong `.agents/rules/`. Đọc `docs/rules/backend.md` và/hoặc `docs/rules/frontend.md` theo tầng sẽ chạm; đọc cả hai nếu task full-stack. Nếu thư mục làm việc có `AGENTS.md` gần hơn, đọc thêm file đó.
2. Theo mục lục `docs/`, đọc README của module liên quan, mô tả chức năng trong `docs/features/`, tài liệu kiến trúc/hạ tầng trong `docs/architecture/`, hướng dẫn trong `docs/guides/`, kế hoạch đang dở trong `docs/plans/` khi liên quan. Không coi tên file hoặc bản tóm tắt là đã đọc nội dung. Không quét mọi tài liệu không liên quan.
3. Có graph thì `graphify query` để định vị luồng, sau đó mở **source thực**: entrypoint, lớp gọi tiếp, contract, test và common đang dùng. Graph chỉ là chỉ dẫn, phải đối chiếu code hiện tại. Chỉ cập nhật graph theo điều kiện của `AGENTS.md`.
4. Đọc `git status`/diff ở chế độ chỉ đọc để nhận ra thay đổi có sẵn và không ghi đè. Tóm tắt phạm vi, chỗ tái sử dụng, contract và kiểm tra cần làm trước khi triển khai.

Khi khảo sát, lần từ entrypoint đến caller, base/common, service/repository hoặc hook/service FE, contract, test. Chỉ dùng graph làm chỉ dẫn và đối chiếu source thật. Chốt đầu vào/đầu ra, quyền, trạng thái lỗi và tiêu chí nghiệm thu; nếu thiếu thông tin không thể suy ra, hỏi một câu tập trung rồi làm phần độc lập. Với module mới, đọc một module tương tự và kế hoạch chuẩn hóa trước khi thiết kế cấu trúc.

## 2. Triển khai

### Mốc dùng skill chuyên môn

Đọc `SKILL.md` của skill đã cài trong project **trước mốc liên quan**, theo bảng dưới. Skill chuyên môn bổ sung phương pháp; `docs/rules/` và yêu cầu hiện tại quyết định contract, phạm vi test và quyền thao tác. Nếu cần skill chưa cài, cài vào `.agents/skills/` và `.claude/skills/`, kiểm tên/trigger trước khi dùng; không thêm dependency ứng dụng chỉ để cài skill.

| Mốc | Skill | Bằng chứng cần có |
| --- | --- | --- |
| Trước khi thiết kế/thay UI, luồng UX | `ui-ux` | Bố cục, trạng thái dữ liệu và thao tác theo quyền; nếu đã được giao dựng thì thực hiện luôn. |
| Khi viết React/Next, data fetching hoặc bundle | `vercel-react-best-practices` | Giữ Client-only React Query của repo, `signal`, ảnh và tải mã phù hợp. |
| Khi làm auth, quyền, secret, thanh toán, webhook, upload, file riêng tư, API công khai | `security-best-practices` nếu yêu cầu secure coding/review bảo mật Python/TS/JS; luôn áp rule bảo mật trong `docs/rules/common.md` | Trust boundary, nhánh từ chối và test liên quan. |
| Khi làm queryset/list/bulk/cache hoặc đường nóng Django | `django-perf-review` | N+1, query count, index và ngân sách free tier. |
| Khi viết/sửa unit test FE hoặc Playwright spec | `vitest` / `playwright-best-practices` | Test hành vi, selector và dữ liệu ổn định. |
| Sau khi làm UI, có local web chạy được | `web-design-guidelines` và `playwright-cli` | Desktop/mobile, keyboard, loading/empty/error/forbidden, console và Network. |
| Khi yêu cầu đo tốc độ trang và có URL/môi trường đo | `web-perf` | Số đo, môi trường và điều kiện đo; không gọi suy đoán là số đo. |
| Trước phần việc hoặc công cụ SePay | `sepay` | Hợp đồng tích hợp và dữ liệu an toàn. |

Chỉ nạp các skill có điều kiện đúng; không gọi tất cả theo thói quen. Đọc [bảng nghiệm thu task mới](references/acceptance-matrix.md) theo phần thay đổi, đối chiếu rule và source trước khi bàn giao.

- Chọn rule `glob` theo file sẽ mở/sửa và `model_decision` theo nghiệp vụ; đọc nội dung rule được chọn trước khi viết.
- Đi theo kiến trúc và convention đã có; tra `docs/common-catalog.md` trước khi tạo common. Với backend giữ `view → service → repository`; frontend giữ `page → view → component/hook → service` và dữ liệu Client qua React Query. Không thêm dependency hay mở rộng tính năng ngoài phạm vi khi chưa được đồng ý.
- Làm từng phần có thể kiểm: contract/model/quyền, logic, UI, test và tài liệu liên quan. Khi đổi OpenAPI, sinh lại API types cùng lần; khi đổi common, cập nhật catalog; khi đổi hành vi, cập nhật `docs/modules/` và `docs/features/` đúng mục.
- Nếu phải đổi contract API/migration hoặc phạm vi lan khoảng 10 file trở lên, báo sớm trong lúc làm với tác động cụ thể. Tiếp tục các bước đã được người dùng cho phép; không coi thông báo đó là yêu cầu chờ xác nhận cho sửa đổi có thể hoàn tác.

## 3. Chốt task

Kiểm từng file đã mở theo `.agents/rules/90-done-checklist.md`; sửa vi phạm thấy được. Chạy lint, typecheck và test **liên quan đến phần sửa**, backend chỉ dùng PostgreSQL local với `--reuse-db`; không chạy toàn bộ suite nếu chưa được yêu cầu. Với UI, kiểm giao diện thật và các trạng thái/viewport khi môi trường cho phép; nếu không kiểm được, ghi rõ. Báo đã làm gì, test/giới hạn, tài liệu đã cập nhật và nội dung commit **tiêu đề + body** trong khối `text` theo `docs/rules/git.md`; không tự stage/commit/push.
