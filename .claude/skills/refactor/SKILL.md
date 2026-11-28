---
name: refactor
description: "Tái cấu trúc code Backend Django và Frontend Next.js trong repo ToanNX theo đúng kiến trúc phân lớp, một file một đơn vị và tái sử dụng common, giữ nguyên contract API/UI và kiểm chứng hồi quy đầy đủ."
---

# Tái cấu trúc code chuẩn ToanNX

Skill này hướng dẫn tái cấu trúc (refactor) gọn, an toàn và tuân thủ tuyệt đối kiến trúc của ToanNX: **sạch logic nhưng không làm vỡ contract, không thay đổi hành vi ngoài phạm vi**.

## 1. Điều kiện tiên quyết trước khi refactor

1. Đọc `AGENTS.md`, `docs/common-catalog.md`, `docs/rules/common.md` và `backend.md` / `frontend.md` tương ứng phạm vi.
2. Nếu có `graphify-out/graph.json`, chạy `graphify query "<file hoặc symbol>"` để thấy toàn bộ điểm gọi (caller/callee), sau đó đọc file nguồn và test hiện có.
3. Chạy test liên quan làm **mốc baseline trước khi đụng code**. Nếu vùng cần refactor chưa có test bảo vệ hành vi quan trọng → viết characterization test trước.
4. Nếu việc refactor làm **thay đổi API contract/OpenAPI, migration, hoặc lan khoảng 10 file trở lên**, báo tác động cho người dùng trước khi thực hiện.

## 2. Những mẫu refactor chuẩn trong ToanNX

Đọc thêm bảng chi tiết ở [bảng kiểm refactor](references/refactor-checklist.md).

### 2.1 Backend (`url → view → service → repository`)
- **Trả trách nhiệm về đúng tầng**: Kéo `Model.objects` hoặc `XxxRepository()` ra khỏi `views/`, `tasks/`, `management/commands/`, `signals/`, `permissions/`, `middleware/` về `repositories/` và `services/`.
- **Chuẩn hóa Dependency Injection**: Mọi service/repository mà một lớp sử dụng khai trong `__init__` (`self.<tên>_service`). Chuyển `@staticmethod`/`@classmethod` công khai của service sang instance method gọi qua `self.<tên>_service`.
- **Tái sử dụng base & common**: Chuyển CRUD/owner/bulk lặp sang kế thừa `CoreRepository` / `CoreCrudService` / `CoreModelViewSet` hoặc filter chuẩn `Core*InFilter`.
- **Tách một class một file**: Tách enum/serializer/dataclass/exception bị nhồi chung file ra đúng thư mục (`serializers/validates/`, `serializers/responses/`, `constants/`, `types/`, `utils/`). Ngoại lệ chỉ gồm file APIView cặp `XxxView` + `XxxObjectView` và file model kèm enum field của chính model đó.
- **Loại trùng lặp & làm phẳng luồng**: Dùng early return (tối đa 3 cấp lồng), tách hàm đơn nhiệm, thay chuỗi `if/elif` theo biến thể bằng bảng/dict ánh xạ, gộp prefetch/select_related về `Repository.get_queryset()` để diệt N+1.

### 2.2 Frontend (`page → View → component/hook → service`)
- **Giữ `page.tsx` và `View` mỏng**: Đẩy `useQuery`, `useState`, `useEffect`, điều hướng sang `components/<model>/hooks/use-<tên>.ts`. `View` chỉ ghép component và kiểm `usePermission` / `useTranslations` / `useEditMode`.
- **Một đơn vị một file & phân nhóm đúng model**: Tách mọi helper component, hook khai trong `.tsx`, hoặc context bị gộp chung ra `-context.ts` / `-provider.tsx` / `hooks/use-*.ts`. Đưa file về đúng `components/<model>/` hoặc `views/<model>/` (không để file ở gốc hay thư mục `shared`/`common`).
- **Thay thế bản trùng bằng `src/shares/`**: Thay HTML trần (`<button>`, `<input>`, `<select>`, `<a>`, `<img>`) bằng primitive shadcn, `Link`, `Image`; thay bảng/form/filter tự chế bằng `DataTable`, `FilterSelect`, `FormPage`, `useBulkActions`, `useTableState`, `useTabState`.
- **An toàn kiểu & làm sạch**: Bỏ `any`, ép kiểu `as` thiếu kiểm soát, `console.log`, props dư, Tailwind class lặp dài (tách component/constant) hoặc màu thiếu `--color-*` token.

## 3. Đồng bộ phụ thuộc & tài liệu khi refactor

- Nếu thêm, đổi tên, gộp hoặc xóa helper dùng chung trong `app/core/` hoặc `src/shares/`: cập nhật `docs/common-catalog.md` cùng lần.
- Nếu đổi file/docstring/serializer đi vào OpenAPI: chạy `pnpm --dir frontend api:types` và cập nhật `frontend/src/shares/types/api-schema.gen.ts`.
- Nếu di chuyển hoặc đổi tên khoảng 10 file trở lên hay tái cấu trúc module lớn: chạy `graphify update .` theo `AGENTS.md`.
- Chỉ cập nhật `docs/modules/<m>/README.md` / `docs/features/` nếu đường đi/chức năng mô tả có thay đổi thực tế.
- Nếu tái cấu trúc làm đổi trường dữ liệu, tên hành vi Client Portal hoặc tham số AI tool, cập nhật luôn `backend/app/workspace/knowledge/client_portal/*.md` + `sync_assistant_knowledge` để RAG của AI chatbot luôn khớp code.
- Nếu người dùng nêu quy chuẩn hoặc rule mới chưa có trong `docs/rules/`, tự động cập nhật đồng bộ ngay vào `docs/rules/`, `.agents/rules/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md` (kèm test quy ước nếu kiểm được) và chạy `python scripts/sync-ai-rules.py` (`--check`) trong cùng lượt.

## 4. Kiểm chứng sau refactor

Chạy **đúng kiểm tra của vùng bị ảnh hưởng** (không chạy full suite trừ khi được yêu cầu):
- **Backend**: `uv run ruff format --check <files>`, `uv run ruff check <files>`, `uv run mypy <files>`, `uv run pytest --reuse-db app/core/tests/test_one_class_per_file.py app/core/tests/test_module_conventions.py app/core/tests/test_openapi_schema.py <related_tests>`.
- **Frontend**: `pnpm --dir frontend exec eslint <files>`, `pnpm --dir frontend exec prettier --check <files>`, `pnpm --dir frontend typecheck`, `pnpm --dir frontend test tests/unit/one-unit-per-file.test.ts tests/unit/module-structure.test.ts tests/unit/table-conventions.test.ts <related_tests>`.
- **UI bị chạm**: kiểm tra nhanh qua `playwright-cli` / Playwright E2E của luồng đó để chắc không đổi bố cục hoặc hành vi tương tác.
- **Cập nhật sổ theo dõi rà soát**: chạy `uv run --no-project python scripts/audit_tracker.py mark-changed --files <files...> --source refactor --note "<tóm tắt>"` để đánh dấu file vừa tái cấu trúc cần kiểm lại ở các lượt audit kế tiếp.
- Báo cáo theo `.agents/rules/90-done-checklist.md`; không tự thao tác Git và không tự gợi ý nội dung commit trừ khi người dùng yêu cầu (`commit-demo` / `commit-push`).
