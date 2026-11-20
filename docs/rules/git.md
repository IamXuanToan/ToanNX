# Quy tắc Git

## Nhánh

| Nhánh | Tạo từ | Merge vào | Dùng cho |
| --- | --- | --- | --- |
| `main` | — | — | Bản phát hành (production). Không commit trực tiếp. |
| `develop` | `main` | — | Nhánh tích hợp mặc định. Không commit trực tiếp khi đã làm việc theo PR. |
| `feat/<ten-ngan>` | `develop` | `develop` | Tính năng mới |
| `fix/<ten-ngan>` | `develop` | `develop` | Sửa lỗi chưa phát hành |
| `ref/<ten-ngan>` | `develop` | `develop` | Đổi cấu trúc, giữ nguyên hành vi |
| `docs/`, `test/`, `perf/`, `build/`, `ci/`, `chore/` | `develop` | `develop` | Theo đúng type commit |
| `release/<x.y.z>` | `develop` | `main` + `develop` | Chuẩn bị phát hành (chỉ sửa lỗi, version, changelog) |
| `hotfix/<ten-ngan>` | `main` | `main` + `develop` | Lỗi khẩn cấp trên production |

- Tên nhánh: chữ thường ASCII, số, dấu gạch ngang; không khoảng trắng, không dấu tiếng Việt.
  Ví dụ: `feat/utilities-qr-logo`, `fix/page-block-owner`, `ref/module-config`, `release/1.2.0`.
- Có ticket thì thêm mã sau type: `feat/tnx-12-utilities-qr-logo`.
- Không force push nhánh dùng chung (`main`, `develop`, `release/*`). Trước khi push: kiểm tra nhánh hiện
  tại và `git pull --rebase` để đồng bộ với remote.
- Merge vào `develop`: squash merge (một nhánh = một commit đúng chuẩn). Merge `release/*`, `hotfix/*`
  vào `main`: merge commit, gắn tag `vX.Y.Z`.

## Commit

Mẫu: `<type>(<scope>): <mo-ta-ngan>`. Có thể bỏ `(<scope>)` khi thay đổi không thuộc một phần cụ thể.
Viết mô tả bằng tiếng Anh, ở dạng mệnh lệnh, không viết hoa chữ đầu và không có dấu chấm cuối; tối đa
72 ký tự cho dòng đầu. Dùng body để giải thích lý do, migration hoặc tác động không hiển nhiên.

| Type | Dùng khi | Ví dụ |
| --- | --- | --- |
| `feat` | Thêm hành vi hoặc API | `feat(utilities): add public redirects` |
| `fix` | Sửa lỗi | `fix(utilities): protect page ownership` |
| `ref` | Đổi cấu trúc, giữ nguyên hành vi | `ref(iam): move permission catalogs` |
| `docs` | Chỉ sửa tài liệu | `docs(repo): define Git workflow` |
| `test` | Chỉ thêm hoặc sửa test | `test(utilities): cover slug collisions` |
| `perf` | Cải thiện hiệu năng | `perf(pages): prefetch visible blocks` |
| `style` | Định dạng code, không đổi logic (ruff format, prettier) | `style(frontend): apply prettier` |
| `build` | Dependency hoặc cách build | `build(frontend): update pnpm lockfile` |
| `ci` | Pipeline kiểm tra, deploy | `ci(repo): run backend checks` |
| `chore` | Bảo trì không đổi hành vi | `chore(repo): add Git ignore rules` |
| `revert` | Hoàn tác commit | `revert: feat(utilities): add public redirects` |

### Scope

Scope là tên module hoặc khu vực, chữ thường, gạch ngang thay cho gạch dưới:

| Khu vực | Scope |
| --- | --- |
| Module backend/frontend | `account`, `iam`, `authentication`, `attachment`, `health`, `journal`, `novel`, `utilities`, `manage-app` |
| Hạ tầng chung | `core` (backend `app/core`), `shares` (frontend `src/shares`), `i18n` |
| Toàn tầng | `backend`, `frontend` |
| Repo, công cụ, tài liệu chung | `repo`, `deps`, `docs` |

Thay đổi phá vỡ hợp đồng (API, mã lỗi, biến môi trường) dùng `!` sau type hoặc scope và footer
`BREAKING CHANGE:` trong body. Ví dụ:

```text
feat(account)!: rename user error codes

BREAKING CHANGE: IAM_EMAIL_EXISTS is now ACCOUNT_EMAIL_EXISTS.
```

## Kiểm tra tự động (git hook)

Repo có hook trong `.githooks/`, bật một lần sau khi clone:

```bash
git config core.hooksPath .githooks
```

- `commit-msg`: dòng đầu phải đúng mẫu `<type>(<scope>)!: <mo-ta>` (≤ 72 ký tự). Bỏ qua commit merge,
  `fixup!`/`squash!`.
- `pre-push`: tên nhánh phải thuộc bảng trên.

Không dùng `--no-verify` để lách hook.

## Trước khi commit và push

1. Chạy kiểm tra liên quan; trước khi báo hoàn thành, chạy `scripts/check-all.ps1` (hoặc `.sh`) và
   `pnpm e2e` theo [rule chung](common.md).
2. Stage đúng file của thay đổi. Xem `git diff --cached --stat` và `git diff --cached --check`.
3. Không đưa secret, `.env`, database local, `media/`, dependency cài đặt, cache hoặc build output vào Git.
4. Mỗi commit diễn đạt một thay đổi logic. Commit khởi tạo repository có thể chứa toàn bộ bản nền hiện tại.
5. Push nhánh đang làm lên `origin`; lần đầu dùng `git push -u origin <branch>`.
