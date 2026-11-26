---
name: db-migration
description: "Thiết kế, tạo và kiểm tra an toàn model và Django migration cho PostgreSQL/Neon trong repo ToanNX: CoreModel, JournalTracker, UniqueConstraint có điều kiện deleted_at__isnull=True, partial index, sqlmigrate và kiểm chứng migration local."
---

# Thiết kế Model & Django Migration an toàn (PostgreSQL / Neon)

Skill này đảm bảo mọi thay đổi schema PostgreSQL trong `backend/` tuân thủ chuẩn ORM ToanNX, tương thích soft-delete, an toàn với Neon PostgreSQL miễn phí và không làm gãy IAM/OpenAPI.

## 1. Kiểm chuẩn Model trước khi `makemigrations`

Đọc `docs/rules/backend.md`, `docs/architecture/architecture.md`, `docs/architecture/infrastructure.md`, `AGENTS.md`:
1. **Kế thừa & Thứ tự MRO**:
   - Mọi model kế thừa `CoreModel` (UUID primary key, timestamps UTC, audit fields, soft delete `deleted_at` nếu áp dụng).
   - Nếu cần ghi lịch sử thay đổi (Journal), đặt `JournalTracker` **trước** `CoreModel`: `class Invoice(JournalTracker, CoreModel)`.
   - Enum thuộc về field của model đặt lồng bên trong class model (`class Status(models.TextChoices)`); enum dùng chung đặt ở `constants/`.
   - Đặt trong `app/<m>/models/<model>.py` (1 model một file) và export trong `app/<m>/models/__init__.py`.
2. **Ràng buộc Unique & Soft Delete**:
   - Field văn bản ngắn hoặc mã (`code`, `slug`, ...) trên model có `deleted_at` phải dùng **`UniqueConstraint(fields=[...], condition=Q(deleted_at__isnull=True), name=...)`** thay vì `unique=True` trần để bản ghi xóa mềm không chặn tạo lại mã mới (hoặc kiểm tra khớp cơ chế `_deleted_<ms>` trong `CoreRepository`).
3. **Index & Hiệu năng gói Free Neon**:
   - Model có `owner_field` phải có partial index có điều kiện `condition=Q(deleted_at__isnull=True)` trên `(owner, ...)` phục vụ lọc danh sách nhanh mà ít tốn dung lượng index.
   - Tiền tệ luôn dùng `DecimalField` (không dùng `FloatField`); thời gian dùng `DateTimeField` timezone-aware (UTC).

## 2. Tạo & kiểm tra Migration trước khi áp dụng

1. Sinh migration:
   ```powershell
   uv run --project backend python backend/manage.py makemigrations <app_label>
   ```
2. **Soi SQL thật bằng `sqlmigrate`**:
   ```powershell
   uv run --project backend python backend/manage.py sqlmigrate <app_label> <migration_number>
   ```
   Kiểm tra kỹ:
   - Có thêm cột `NOT NULL` trên bảng đã có dữ liệu mà thiếu default an toàn hoặc gây rewrite/lock bảng lâu không? Nếu bảng lớn, tách làm nhiều bước (thêm nullable → backfill → đặt constraint `NOT NULL`).
   - Có **xóa cột / đổi tên cột** khi code đang chạy bản cũ chưa cập nhật không?
   - **CẤM seed Role/Permission IAM trong data migration** — quyền/vai trò chỉ đồng bộ tự động qua `sync_iam` (`post_migrate`) và `seed_roles`.
3. Kiểm tra không còn model lệch migration chưa sinh:
   ```powershell
   uv run --project backend python backend/manage.py makemigrations --check --dry-run
   ```

## 3. Áp dụng local & đồng bộ dây chuyền

1. Đảm bảo `DATABASE_URL` trong `backend/.env.local` trỏ về **PostgreSQL local** (`postgresql://postgress:123456@localhost:5432/toannx?sslmode=prefer`), không chạy lệnh thử nghiệm lên Neon production.
2. Chạy migrate local và kiểm OpenAPI / test:
   ```powershell
   uv run --project backend python backend/manage.py migrate
   uv run --project backend python backend/manage.py spectacular --validate --fail-on-warn
   ```
3. Nếu migration thay đổi field serializer/API response → chạy `pnpm --dir frontend api:types` và cập nhật `docs/modules/<m>/README.md`.
4. Chạy test model/API liên quan trên PostgreSQL local với `--reuse-db` (lưu ý nếu đổi schema, lần đầu tiên sau khi thêm migration nhớ chạy `--create-db` để pytest cập nhật lại bảng trên `test_toannx`, các lần sau dùng `--reuse-db` bình thường).
5. Tự rà `.agents/rules/90-done-checklist.md`; nếu người dùng nêu quy chuẩn DB/migration mới chưa có trong `docs/rules/`, tự động cập nhật đồng bộ ngay vào `docs/rules/`, `.agents/rules/`, `AGENTS.md`, `CLAUDE.md`, `prompt.md` và chạy `python scripts/sync-ai-rules.py` (`--check`) trong cùng lượt. Báo cáo kết quả migration (không tự thao tác Git hay tự gợi ý commit trừ khi người dùng yêu cầu).
