---
trigger: model_decision
description: Dùng khi người dùng yêu cầu rà soát rule hoặc kiểm tra tuân thủ toàn hệ thống, ghi báo cáo vi phạm và đề xuất bổ sung rule; không dùng cho task thường.
---

# Rà soát rule toàn hệ thống

Chỉ chạy khi được yêu cầu. Không sửa code trong bước rà soát; sửa là việc riêng sau khi người dùng duyệt.

## Các bước

1. Đọc `docs/rules/*`, `CLAUDE.md`, `.agents/rules/*`, `docs/common-catalog.md`.
2. Chạy kiểm tra tự động **chỉ đọc**, không sửa:
   - Backend: `uv run ruff check .`, `uv run mypy .`,
     `uv run pytest --reuse-db app/core/tests/test_one_class_per_file.py app/core/tests/test_module_conventions.py
     app/core/tests/test_endpoint_access.py app/core/tests/test_openapi_schema.py` (DB local).
   - Frontend: `pnpm lint`, `pnpm typecheck`, `pnpm test tests/unit/one-unit-per-file.test.ts
     tests/unit/module-structure.test.ts tests/unit/table-conventions.test.ts tests/unit/module-registry.test.ts
     tests/unit/theme-tokens.test.ts tests/unit/api-contract.test.ts`.
   - Đồng bộ: `python scripts/sync-ai-rules.py --check`; `git diff --exit-code` sau `pnpm api:types`.
3. Rà tay theo bảng kiểm `.agents/rules/90-done-checklist.md` các vùng hay sai: điểm vào gọi ORM, service tạo trong method, View có logic,
   bảng ẩn nút thay vì khóa, màu thiếu token, chuỗi không qua i18n, env thiếu trong `.env.example`, tài liệu lệch code.
4. Ghi báo cáo `docs/reports/<yyyy-mm-dd>-rule-audit.md`:

| Mức | File:dòng | Vi phạm | Rule | Cách sửa | Ảnh hưởng (số file, có đổi API/migration?) |
| --- | --- | --- | --- | --- | --- |

5. Mục cuối báo cáo: rule còn thiếu hoặc mơ hồ, đề xuất thêm vào `docs/rules/` + `.agents/rules/` + `prompt.md`.
