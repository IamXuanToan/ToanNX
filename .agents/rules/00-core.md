---
trigger: always_on
description: Quy tắc cốt lõi của toannx.com, áp dụng cho mọi việc trong repo.
---

# Quy tắc cốt lõi — toannx.com

Rule AI là bản tóm tắt để làm đúng ngay từ đầu. Chi tiết và ngoại lệ nằm ở `docs/rules/` (`common.md`,
`backend.md`, `frontend.md`, `git.md`); khi lệch nhau thì **`docs/rules/` thắng**.

## Dự án

- Monorepo `backend/` (Django 6 + DRF, PostgreSQL/Neon, uv) và `frontend/` (Next.js 16 App Router, React 19,
  Tailwind 4, shadcn/ui, TanStack Query, next-intl, pnpm). Module: `system`, `utilities`, `novel`, `finance`;
  FE thêm `manage-app`, `home`.
- Hạ tầng đều là gói free: Vercel (FE + BE), Neon, Upstash Redis + QStash, Cloudflare R2, Firebase FCM
  (`docs/architecture/infrastructure.md`).
- Next.js 16 khác dữ liệu huấn luyện: đọc `frontend/node_modules/next/dist/docs/` trước khi viết code Next
  (`src/proxy.ts` thay middleware).

## Luôn làm

- **Mọi phản hồi gửi người dùng phải bằng tiếng Việt có dấu**: cập nhật giữa chừng, câu hỏi, giải thích, báo cáo
  cuối và thông báo lỗi; áp dụng cả khi skill hoặc nguồn tham khảo viết tiếng Anh. Giữ nguyên tên file, mã,
  tên API và lệnh CLI. Docstring, comment, tài liệu cũng tiếng Việt.
- **Đọc trước khi code**: `docs/common-catalog.md` (common đã có), `docs/modules/<module>/README.md`,
  `docs/features/*.md` liên quan, rule tương ứng. Có `graphify-out/graph.json` thì chạy `graphify query "<câu hỏi>"`
  trước khi grep/đọc file.
- **Dùng lại common**: đã có thì dùng, gần giống thì mở rộng, không viết bản thứ hai. Thêm/đổi common thì cập nhật
  `docs/common-catalog.md` cùng lần.
- **Một file một đơn vị** (một class / component / hook). Ngoại lệ: APIView `XxxView` + `XxxObjectView`; file
  model + enum của nó; shadcn `shares/components/ui/*`; export đặc biệt của Next. Class lồng (`Meta`) được phép.
- **Cập nhật tài liệu cùng lần sửa** (model, quyền, route, sự kiện, webhook → `docs/modules/<m>/README.md`; cách
  chức năng chạy → `docs/features/`). Tài liệu lệch code = việc chưa xong.
- **Mở file nào thì kiểm rule file đó và sửa luôn**; sửa kéo theo đổi contract API/migration hoặc lan ≥ 10 file thì
  báo trước.
- Báo rõ phần **chưa kiểm được trên giao diện thật**; không tuyên bố xong khi chưa chạy kiểm tra.

## Không bao giờ

- **Không tự thao tác git** (branch, commit, push, merge, xóa nhánh) khi chưa được yêu cầu rõ. Sau mỗi task,
  đọc trạng thái/diff Git và trả nội dung commit **gồm tiêu đề + body** theo `docs/rules/git.md` cho toàn bộ thay
  đổi chưa commit; đặt trong khối `text` để dán vào VS Code, không đưa lệnh `git commit`. Phân biệt thay đổi có
  sẵn với thay đổi của task.
- Không thêm dependency, module, tính năng ngoài phạm vi khi chưa được duyệt.
- **Không chạy toàn bộ test** (`scripts/check-all.*`, `pnpm e2e` đầy đủ, `uv run pytest`/`pnpm test` không chỉ
  file) khi chưa được yêu cầu. Chỉ chạy kiểm tra của file đã sửa và test liên quan.
- Không chạy test backend trên DB cloud: `DATABASE_URL` phải là PostgreSQL local
  (`postgresql://postgress:123456@localhost:5432/toannx?sslmode=prefer`), luôn `--reuse-db`.
- Không in giá trị bí mật (`.env`, token, khóa) ra màn hình hay log.
- Không dùng tiền tố `toannx` trong tên kỹ thuật (cookie, storage key, header, query/cache key, env var).
- Không tắt lint/typecheck, không bỏ test, không giải pháp tạm để che lỗi.
