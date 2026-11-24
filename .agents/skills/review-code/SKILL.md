---
name: review-code
description: "Review code cuối task trong repo ToanNX và tự sửa lỗi xác nhận được trước khi bàn giao. Dùng khi người dùng nói reviewcode, review code cuối, soát code trước commit hoặc yêu cầu kiểm tổng phần vừa làm. Kiểm rule, i18n, shadcn/ui, Tailwind, bảo mật, hiệu năng, test, docs và trả nội dung commit chuẩn. Không tự kích hoạt cho mỗi chỉnh sửa nhỏ."
---

# Review code cuối và tự sửa

Skill này tự đủ cho lượt rà cuối: `/review-code` trong Claude Code hoặc `$review-code` trong Codex, không cần dán `prompt.md`. Khi lệnh không có đối số, lấy phạm vi từ task đang làm trong hội thoại; nếu không có, dùng thay đổi staged, unstaged và untracked của worktree cùng caller/contract/test liên quan. Không mặc nhiên nhận mọi thay đổi cũ là của mình. Nếu worktree có nhiều mục đích độc lập, rà theo nhóm, giữ ranh giới mỗi nhóm và soạn commit riêng. Chỉ hỏi khi không thể xác định phạm vi nào một cách an toàn.

Đây là lượt rà cuối **có quyền sửa** trong phạm vi được giao: tìm lỗi bằng chứng rõ, sửa, rồi kiểm lại. Không chỉ đưa danh sách khuyến nghị. `docs/rules/` quyết định chuẩn; phân biệt lỗi đã xác nhận với rủi ro cần đo thêm.

## 1. Chốt phạm vi và đọc ngữ cảnh

1. Đọc `AGENTS.md`, `SYSTEM_CONTEXT.md`, `docs/README.md`, `docs/rules/common.md`, `docs/rules/git.md`, `docs/common-catalog.md`, rule `always_on`. Đọc `backend.md`/`frontend.md` và rule `glob` theo file liên quan; full-stack đọc cả hai. Đọc `docs/modules/<module>/README.md`, các `docs/features/` liên quan và `docs/architecture/`/`docs/guides/` khi chức năng đụng nền hoặc dịch vụ ngoài.
2. Xác định phạm vi người dùng nêu; nếu không nêu, review phần vừa làm trong cuộc trò chuyện cùng caller/contract/test liên quan. Dùng `git status`/diff (staged, unstaged, untracked) để nhận ra các thay đổi có sẵn; không tự nhận hoặc sửa tràn sang việc độc lập. Nếu không xác định được ranh giới task, nêu giả định phạm vi trước khi tiếp tục.
3. Có graph thì `graphify query` để định vị, sau đó **đọc source thật** theo luồng `entrypoint → xử lý → dữ liệu → output`, cùng test và tài liệu. Không kết luận chỉ từ tên file, diff hoặc graph cũ. Đọc [bảng kiểm theo thay đổi](references/review-matrix.md); áp đúng các mục liên quan.

Trước khi phán đoán, đọc file nguồn hoàn chỉnh ở điểm đổi, caller/callee và base/common bị ảnh hưởng, test hiện có và doc mô tả hành vi. Phân biệt ba loại: vi phạm rule/bug chứng minh được, rủi ro cần thử/đo thêm, và sở thích thiết kế. Chỉ tự sửa vi phạm/bug đã xác nhận; nếu đo/thử xác nhận rủi ro là lỗi, sửa và kiểm lại. Rủi ro chưa xác minh phải được báo đúng mức.

## 2. Review có bằng chứng

- Kiểm correctness, contract API/OpenAPI, kiến trúc, quyền/owner, ranh giới tin cậy, đầu vào, lỗi và dữ liệu bí mật. Với Django kiểm ORM chỉ trong repository, N+1/query-count, index/cache/chi phí free tier khi đường nóng bị chạm.
- Với Next/React kiểm dữ liệu Client qua React Query và `signal`, i18n vi/en, `Image`/`Link`, primitive shadcn, Tailwind token, responsive, bàn phím, aria, trạng thái loading/empty/error/forbidden, số request, render/bundle khi có dấu hiệu.
- Chọn skill chuyên môn theo phần review: `security-best-practices` cho đánh giá bảo mật Python/TS/JS trong phạm vi; `django-perf-review` cho nghi vấn Django; `vercel-react-best-practices` cho React/Next; `web-design-guidelines` cho UI/accessibility; `vitest`/`playwright-best-practices` khi sửa test; `playwright-cli` khi cần xem UI thật. `web-perf` chỉ khi có URL/môi trường để đo. Skill ngoài không ghi đè rule repo.
- Nạp skill chuyên môn **trước** phần rà tương ứng; mở `SKILL.md` đã cài và đọc tài liệu tham chiếu cần thiết. Nếu skill cần dùng chưa có trong project, cài vào `.agents/skills/` và `.claude/skills/`, kiểm tên/trigger; không thêm dependency ứng dụng chỉ để cài skill. Mỗi lượt review đều rà bảo mật theo rule repo; khi file Python/TS/JS chạm ranh giới tin cậy, nạp `security-best-practices` để review bảo mật chuyên sâu. Đọc `sepay` trước khi rà SePay, webhook thanh toán hoặc hóa đơn.
- Ghi file:dòng, hành vi sai, cách tái hiện hoặc bằng chứng, tác động. Không gán mức nghiêm trọng từ suy đoán; không gọi một cải thiện là đã đo nếu chỉ đọc code.

## 3. Tự sửa, kiểm lại, bàn giao

### Thứ tự rà và điểm dừng

1. Dựng bản đồ thay đổi: file, mục đích, đường đi thực thi, quyền, contract và test. Ưu tiên lỗi có tác động cao: lộ dữ liệu/permission/secret, sai dữ liệu hoặc contract, crash, rồi UI/accessibility/i18n và hiệu năng. Áp từng hàng trong `references/review-matrix.md` có liên quan; ghi *không áp dụng* trong ghi chú nội bộ thay vì báo thành lỗi.
2. Với BE, kiểm endpoint và mọi điểm vào có đúng lớp, owner, bulk, OpenAPI, query count/N+1. Với FE, kiểm Client-only React Query + `signal`, route/vi-en, quyền ba tầng, shadcn/ui, Tailwind token, Image/Link/SVG, loading/empty/error/forbidden, keyboard/mobile. Kiểm tài liệu và `.env.example` khi contract đổi. Kiểm cả file đã mở theo rule file đó.
3. Khi review UI, dùng `web-design-guidelines`; dùng `ui-ux` nếu cần sửa luồng/bố cục; dùng `playwright-cli` để thấy UI thật khi có môi trường. Khi sửa unit/E2E test, dùng `vitest`/`playwright-best-practices`. Khi nghi chậm BE/FE, dùng `django-perf-review`/`vercel-react-best-practices`; chỉ dùng `web-perf` nếu có URL đo. Nêu rõ kết luận tĩnh và kết quả đo thực.
4. Mỗi phát hiện cần file:dòng, điều kiện tái hiện hoặc lập luận từ source, tác động và hướng sửa. Sửa lỗi xác nhận được, test đúng hành vi bị lỗi, kiểm lại chính phát hiện đó. Lặp đến khi không còn lỗi xác nhận được trong phạm vi; không sửa việc độc lập chỉ để làm đẹp repo. Nếu sửa lan sang contract/migration hoặc khoảng 10 file trở lên, thông báo tác động sớm.

Sửa từng nhóm lỗi xác nhận được trong phạm vi, kể cả test và tài liệu kéo theo. Nếu đổi contract API/migration hoặc lan khoảng 10 file trở lên, báo trước với tác động; tiếp tục phần sửa đã được yêu cầu và có thể hoàn tác. Không thêm dependency, thao tác production hoặc thay đổi không thể đảo ngược nếu chưa được cho phép. Không làm sạch thay đổi người dùng không liên quan.

Sau mỗi nhóm sửa, chạy format/lint/typecheck/test **đúng phần đã sửa** và tái kiểm vấn đề ban đầu. Backend test chỉ trên PostgreSQL local với `--reuse-db`; không chạy full suite chỉ vì đây là review cuối. Đổi OpenAPI thì chạy `pnpm api:types`; UI thì kiểm giao diện thật, responsive, console, Network nếu môi trường cho phép. Dừng khi không còn lỗi xác nhận được trong phạm vi hoặc chỉ còn việc cần thông tin/quyền từ bên ngoài; ghi rõ điều chưa xác minh.

Cuối cùng chạy `.agents/rules/90-done-checklist.md`. Báo phạm vi đã rà, lỗi đã sửa (file:dòng và bằng chứng) hoặc không có phát hiện, lỗi còn lại và lý do, kiểm tra đã chạy, phần UI/hiệu năng/bảo mật mới kiểm tĩnh, tài liệu/contract đã đồng bộ. Không ghi “đạt” cho phần chưa kiểm. Đưa **nội dung commit tiêu đề + body** theo `docs/rules/git.md` trong khối `text` để dán vào VS Code. Xem toàn bộ worktree để tách commit theo mục đích; không trả lệnh Git và không tự stage/commit/push.
