# Quy tắc Git

## Nhánh

- `develop`: nhánh tích hợp. `main`: bản phát hành khi dự án bắt đầu phát hành.
- Tạo nhánh công việc từ `develop` theo mẫu `<type>/<ten-ngan>`: `feat/short-links-ui`,
  `fix/page-block-owner`, `ref/permission-catalogs`, `docs/git-rules`, `test/short-link-redirect`.
- Tên nhánh dùng chữ thường ASCII, số và dấu gạch ngang; không có khoảng trắng hoặc dấu tiếng Việt.
- `hotfix/<ten-ngan>` dành cho lỗi khẩn cấp trên `main`; đưa bản sửa trở lại `develop` sau khi phát hành.
- Không force push nhánh dùng chung. Trước khi push, kiểm tra nhánh hiện tại và đồng bộ với remote.

## Commit

Mẫu: `<type>(<scope>): <mo-ta-ngan>`. Có thể bỏ `(<scope>)` khi thay đổi không thuộc một phần cụ thể.
Viết mô tả bằng tiếng Anh, ở dạng mệnh lệnh, không viết hoa chữ đầu và không có dấu chấm cuối; tối đa
72 ký tự cho dòng đầu. Dùng body để giải thích lý do, migration hoặc tác động không hiển nhiên.

| Type | Dùng khi | Ví dụ |
| --- | --- | --- |
| `feat` | Thêm hành vi hoặc API | `feat(short-links): add public redirects` |
| `fix` | Sửa lỗi | `fix(custom-pages): protect block ownership` |
| `ref` | Đổi cấu trúc, giữ nguyên hành vi | `ref(iam): move permission catalogs` |
| `docs` | Chỉ sửa tài liệu | `docs(repo): define Git workflow` |
| `test` | Chỉ thêm hoặc sửa test | `test(short-links): cover slug collisions` |
| `perf` | Cải thiện hiệu năng | `perf(pages): prefetch visible blocks` |
| `build` | Dependency hoặc cách build | `build(frontend): update pnpm lockfile` |
| `ci` | Pipeline kiểm tra, deploy | `ci(repo): run backend checks` |
| `chore` | Bảo trì không đổi hành vi | `chore(repo): add Git ignore rules` |
| `revert` | Hoàn tác commit | `revert: feat(short-links): add public redirects` |

Thay đổi phá vỡ hợp đồng dùng `!` sau type hoặc scope và footer `BREAKING CHANGE:` trong body.
Ví dụ: `feat(api)!: rename public page endpoint`.

## Trước khi commit và push

1. Chạy kiểm tra liên quan; trước khi báo hoàn thành, chạy `scripts/check-all.ps1` (hoặc `.sh`) và
   `pnpm e2e` theo [rule chung](common.md).
2. Stage đúng file của thay đổi. Xem `git diff --cached --stat` và `git diff --cached --check`.
3. Không đưa secret, `.env`, database local, `media/`, dependency cài đặt, cache hoặc build output vào Git.
4. Mỗi commit diễn đạt một thay đổi logic. Commit khởi tạo repository có thể chứa toàn bộ bản nền hiện tại.
5. Push nhánh đang làm lên `origin`; lần đầu dùng `git push -u origin <branch>`.
