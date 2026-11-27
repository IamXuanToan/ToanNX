---
name: review-plan
description: "Thẩm định và review kỹ lưỡng các file plan trong docs/plans/ (cấu trúc <YYYY>/<MM>/<DD>/) của repo ToanNX bằng cách đọc đầy đủ docs/rules/, .agents/rules/, SYSTEM_CONTEXT.md, docs/common-catalog.md, tài liệu kiến trúc/tính năng và đối chiếu source code thực tế để phát hiện sai rule, hổng kiến trúc, rủi ro bảo mật/quyền/free-tier, thiếu edge case và mâu thuẫn nội tại."
---

# Review và thẩm định Plan chuẩn ToanNX

Skill này tự đủ để thẩm định plan: `/review-plan` trong Claude Code hoặc `$review-plan` trong Codex, hoặc qua chat thường khi người dùng yêu cầu review plan trong `docs/plans/` (tổ chức theo `<YYYY>/<MM>/<DD>/`).

> **Nguyên tắc sắt khi review:**
>
> - **Tìm hết trong ĐÚNG 1 lượt (Single-Pass Exhaustive Audit)**: tuyệt đối không đọc lướt rồi để sót lỗi/caller sang vòng `/review-plan` sau. Trước khi xuất báo cáo, bắt buộc chạy đủ quét tác động (`Impact Grep`) và đọc đủ các cổng kiểm tra CI liên quan.
> - **Mọi phát hiện phải có bằng chứng 2 chiều**: chỉ rõ `Vị trí trong plan (mục/dòng)` ↔ `Rule / Tài liệu / File source thật (đường dẫn:dòng)`, nêu rõ tác động khi triển khai và hướng sửa cụ thể đúng chuẩn ToanNX.
> - **Không biến chi tiết triển khai mặc định thành `Minor` vô tận**: Plan là đặc tả kiến trúc, hợp đồng API, dữ liệu, quyền, bảo mật và biên nghiệp vụ — **không phải code từng dòng**. Không bới các nhắc nhở code hiển nhiên đã có trong `docs/rules/` thành lỗi bắt sửa plan.

## 1. Xác định mục tiêu và nạp toàn bộ ngữ cảnh + Gatekeepers trong 1 lượt

Nếu người dùng không chỉ định file cụ thể, tìm file plan đang mở hoặc mới thêm/sửa trong `docs/plans/<YYYY>/<MM>/<DD>/` (qua ngữ cảnh hội thoại và `git status`).

Thực hiện **đầy đủ trong một đợt khảo sát song song** trước khi phân tích lỗi:

1. **File plan mục tiêu**: đọc từ đầu đến cuối file trong `docs/plans/<YYYY>/<MM>/<DD>/`. Nếu plan nối tiếp plan khác trong `docs/plans/`, đọc luôn phần liên quan để phát hiện tham chiếu lỗi thời hoặc xung đột.
2. **Toàn bộ bộ rule & kiến trúc liên quan** _(bỏ qua phần đã đọc và còn nguyên vẹn trong hội thoại)_:
   - `AGENTS.md`, `SYSTEM_CONTEXT.md`, `docs/README.md`, `docs/common-catalog.md`.
   - `docs/rules/common.md`, `docs/rules/backend.md`, `docs/rules/frontend.md`, `docs/rules/git.md`.
   - Các rule AI trong `.agents/rules/`: `00-core.md`, `01-workflow.md`, `10-backend.md`, `11-tests.md`, `20-frontend.md`, `21-frontend-ui.md`, `30-env-secrets.md`, `40-docs-and-rules.md`, `50-notifications.md`, `51-permissions.md`, `52-free-tier-infra.md`, `53-attachments.md`, `54-security-review.md`, `55-performance-review.md`, `90-done-checklist.md`.
   - `docs/architecture/` (`infrastructure.md`, `authorization.md`, `authentication.md`, `i18n.md`, `testing.md`, `architecture.md`), `docs/features/*.md` và `docs/modules/<m>/README.md` của các module chạm tới.
3. **Quét tác động toàn repo (`Impact Grep`) ngay lượt 1 — bắt buộc khi sửa/xóa tài nguyên cũ**:
   - Với **mọi** model, field, service, endpoint, permission, error code, route hoặc hook/component FE mà plan dự kiến **xóa, dời thư mục hoặc đổi chữ ký/hành vi**, chạy ngay `git grep` trên `backend/`, `frontend/`, `docs/` để gom **100% caller, view, serializer, test hiện hữu và component FE liên quan** trong một lần duy nhất.
4. **Đọc trọn bộ file "Cổng bảo vệ CI" (CI Gatekeeper Bundle) khớp phạm vi ngay lượt 1**:
   - Chạy `graphify query` (nếu có `graphify-out/graph.json`) và đọc đồng thời:
   - **Nếu plan chạm Backend**: `backend/pyproject.toml`, `backend/conftest.py` (khi thêm biến ENV ngoài), `backend/config/settings.py`, `backend/config/urls.py`, `backend/app/core/views/{core_model_view_set.py,core_api_view.py}`, `backend/app/core/cache/cache_service.py` (nếu dùng lock/Redis), cùng các file cổng CI `backend/app/core/tests/{test_module_conventions.py,test_one_class_per_file.py,test_endpoint_access.py,test_list_query_count.py,test_error_codes.py,test_openapi_schema.py}` và `module.py` / `urls.py` / `services/` của module liên quan.
   - **Nếu plan chạm Frontend**: `frontend/package.json`, `frontend/src/app/globals.css`, `frontend/src/i18n/{routing.ts,messages.ts}`, `frontend/src/global.d.ts`, `frontend/src/proxy.ts`, navigation/shell bị chạm (`admin-navigation.ts`, `portal-sidebar.tsx`, `portal-bottom-nav.tsx`), cùng các test quy ước `frontend/tests/unit/{module-registry.test.ts,module-structure.test.ts,one-unit-per-file.test.ts,table-conventions.test.ts,theme-tokens.test.ts,code-conventions.test.ts,messages.test.ts,api-contract.test.ts}`.

## 2. Thẩm định đủ 12 trục & Phân ngưỡng lỗi (`Materiality Gate`)

Rà một lượt qua toàn bộ 12 hạng mục trong [ma trận kiểm toán plan 12 trục](references/review-plan-matrix.md). Mục không liên quan đánh dấu nội bộ _Không áp dụng_.

### Phân ngưỡng bắt buộc (tránh nitpick lặp vô hạn)

| Mức độ                                  | Tiêu chuẩn áp dụng                                                                                                                                                                                                                                                                                                              | Ảnh hưởng phán quyết                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **🔴 Blocker**                          | Vi phạm kiến trúc/rule cứng làm gãy CI, migration hoặc build; lỗ hổng bảo mật/phân quyền (`IDOR`, `SSRF`, lộ secret/file private, `manage_all` sai); bịa tên API/model/package; xóa/sửa tài nguyên cũ nhưng bỏ sót caller/test phụ thuộc; vượt trần timeout `≤ 5s` hoặc đốt ngân sách gói Free (`Neon CU`, `Vercel`, `QStash`). | **KHÔNG ĐẠT / CẦN BỔ SUNG**                    |
| **🟠 Major**                            | Thiếu edge case nghiệp vụ/tài chính/múi giờ/race condition quan trọng; thiếu đặc tả quyền/endpoint/trạng thái lỗi chính gây hiểu sai khi code; thiếu kiểm soát N+1/payload lớn hoặc thiếu kịch bản test cho luồng nhạy cảm.                                                                                                     | **CẦN BỔ SUNG**                                |
| **🟡 Minor**                            | **Chỉ tính lỗi có thật trong chính nội dung plan**: mâu thuẫn nội tại giữa hai mục của plan (VD: tên lock, số lượng lệnh, tên route viết khác nhau giữa §5 và §11), định nghĩa/tham số sai nhẹ, hoặc thiếu hẳn hạng mục tài liệu/test mới phát sinh cần liệt kê ở lộ trình.                                                     | Báo rõ nhưng chỉ yêu cầu sửa phần thật sự lệch |
| **Lưu ý triển khai** _(không tính lỗi)_ | Quy ước hiển nhiên khi viết code đã nằm sẵn trong `docs/rules/` mà plan **không viết sai ngược lại** (VD: nhớ đăng ký `INSTALLED_APPS`/`urls.py`, dùng `method=` cho filter boolean, bọc `EditModeProvider`, nhắc chi tiết trong `conftest.py`…). **Tuyệt đối không gắn nhãn `🟡 Minor`** để ép sửa plan nhiều vòng.            | Không chặn phán quyết **`ĐẠT`**                |

### Quy tắc Re-review (Vòng 2 trở đi)

Khi review lại cùng một file plan đã từng sửa sau review trước:

- Chỉ kiểm: **(1)** mọi `Blocker`/`Major`/`Minor` của vòng trước đã được xử lý dứt điểm chưa, và **(2)** phần mới sửa có gây mâu thuẫn nội tại hay vi phạm mới với codebase không.
- **Không bới thêm tiểu tiết triển khai** ở các vòng sau. Nếu sạch lỗi thực sự → chốt ngay **`ĐẠT (Sẵn sàng triển khai)`**.

## 3. Xuất báo cáo thẩm định & tùy chọn sửa plan

Trình bày báo cáo hoàn toàn bằng **tiếng Việt có dấu** (giữ nguyên tên file, mã, API và lệnh) theo cấu trúc:

1. **Kết luận tổng quan**: `ĐẠT (Sẵn sàng triển khai)` / `CẦN BỔ SUNG` / `KHÔNG ĐẠT (Có Blocker cần sửa trước khi code)`, kèm bảng đếm `🔴 Blocker` / `🟠 Major` / `🟡 Minor` (nếu có tiểu tiết nhắc code hiển nhiên, tách gọn vào mục _Lưu ý khi triển khai_, **không** cộng vào cột `Minor`).
2. **Điểm làm tốt & Đối chiếu Fact-check**: tóm tắt ngắn phần plan đã bám chuẩn và bảng đối chiếu các thực thể chính trong plan với source thật.
3. **Danh sách phát hiện chi tiết (`🔴 Blocker` → `🟠 Major` → `🟡 Minor`)** _(bỏ qua nếu `0/0/0`)_:
   - Mỗi phát hiện ghi đủ 4 phần:
     - **Vị trí trong plan**: `<tên file plan>:<dòng / mục>`
     - **Đối chiếu chuẩn**: `<rule / doc / source file:dòng>`
     - **Vấn đề & tác động**: giải thích rõ bản chất lỗi, test/cổng CI nào sẽ fail hoặc rủi ro sản xuất nào sẽ xảy ra.
     - **Đề xuất sửa cụ thể**: hướng chỉnh thẳng vào nội dung plan.
4. **Lưu ý khi triển khai (tùy chọn — không bắt sửa plan)** _(nếu có nhắc nhở code hữu ích ngoài ngưỡng `Minor`)_.
5. **Quyết định / Câu hỏi còn mở cần người dùng chốt** _(nếu có)_.
6. **Bước tiếp theo**:
   - Nếu người dùng chỉ yêu cầu review và còn lỗi cần sửa: hỏi rõ có muốn AI cập nhật thẳng toàn bộ các điểm sửa này vào `docs/plans/<YYYY>/<MM>/<DD>/<ten>.md` ngay hay chốt các phương án mở trước.
   - Nếu người dùng yêu cầu review **và sửa luôn plan**: cập nhật trực tiếp file plan, chạy `uv run --no-project python scripts/audit_tracker.py mark-changed --files <file_plan> --source review-plan --note "<tóm tắt sửa plan>"`, rà lại một lượt theo phần sửa để chốt `ĐẠT (0/0/0)`. Nếu người dùng đặt ra rule/quy chuẩn mới chưa có trong `docs/rules/`, tự động cập nhật đồng bộ ngay vào `docs/rules/`, `.agents/rules/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md` và chạy `python scripts/sync-ai-rules.py` (`--check`) trong cùng lượt. Không tự thao tác Git và không tự gợi ý nội dung commit (chỉ xuất khối commit khi người dùng yêu cầu qua `commit-demo`, tuyệt đối không thêm `Co-Authored-By:` hay nguồn bên ngoài).
