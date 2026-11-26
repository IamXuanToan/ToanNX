---
name: commit-push
description: "Thực hiện stage, tạo commit đúng chuẩn Conventional Commits của repo ToanNX và git push lên remote khi người dùng gọi để commit và đẩy code lên. Tôn trọng .githooks, kiểm tra an toàn secret/kiểm thử liên quan và tuyệt đối không thêm Co-Authored-By hay nguồn bên ngoài."
---

# Commit và Push thật lên Remote (`commit-push`)

Skill này thực hiện **`git add` → `git commit` → `git push`** lên remote khi người dùng **gọi trực tiếp** (`/commit-push`, `$commit-push` hoặc yêu cầu commit và push lên). Tuyệt đối không tự kích hoạt ở cuối các task khác.

> **Nguyên tắc an toàn cứng:**
> - **TUYỆT ĐỐI KHÔNG chèn nguồn hoặc chữ ký AI bên ngoài** (`Co-Authored-By: Claude ...`, `Co-Authored-By: ... <noreply@anthropic.com>`, `Generated with ...`) vào bất kỳ commit nào.
> - **TUYỆT ĐỐI KHÔNG dùng `--no-verify`** để lách `.githooks/commit-msg` hoặc `.githooks/pre-push`.
> - **CẤM `--force`** lên `main`, `develop`, `release/*`; mọi thao tác viết lại lịch sử hay force push đều phải do người dùng yêu cầu tường minh.

## Bước 1 — Kiểm tra trạng thái, nhánh và bảo mật trước khi stage

1. Đọc `docs/rules/git.md` và kiểm tra worktree:
   ```bash
   git branch --show-current
   git status --short
   git diff --stat
   ```
2. **Bảo vệ nhánh hiện tại**:
   - Nếu đang ở nhánh **`main`** và người dùng chưa xác nhận rõ cho phép commit/push thẳng vào `main` → **dừng lại hỏi xác nhận** trước khi commit.
   - Kiểm tên nhánh hiện tại có khớp `.githooks/pre-push` (`main`, `develop`, `feat|fix|ref|docs|test|perf|build|ci|chore|hotfix/...`, `release/x.y.z`); nếu sai mẫu sẽ không push được, báo người dùng hướng xử lý.
   - Kiểm trạng thái hook local (`git config --get core.hooksPath`); nếu chưa trỏ `.githooks`, lưu ý vẫn kiểm chặt mẫu commit message trước khi commit.
3. **Rà file nhạy cảm & rác build**:
   - Không bao giờ stage `.env`, `.env.local`, khóa cá nhân, token, `media/`, DB local, `.next/`, `node_modules/`, file scratch ngoài phạm vi hoặc artifact tạm.
   - Nếu worktree có file nhạy cảm chưa ignored → loại trừ khi `git add` (stage tường minh theo từng path sạch, **không** `git add -A` mù quáng) và cảnh báo người dùng.
4. **Kiểm tra nhanh trước khi commit (`docs/rules/git.md`)**:
   - Đọc diff thực tế của các file sẽ commit để hiểu đúng thay đổi và xem các kiểm tra liên quan (ví dụ `sync-ai-rules.py --check`, `check-workflow-skills.py`, `ruff`/`eslint`/unit test liên quan đã chạy ở task trước chưa). Nếu vừa sửa rule/skill/code mà chưa chạy kiểm nhanh tương ứng, chạy kiểm tra liên quan trước khi commit; **không** chạy full suite (`scripts/check-all.*`, full `e2e`) nếu chưa được yêu cầu.

## Bước 2 — Tách nhóm logic, Stage và Commit chuẩn

1. **Phạm vi & tách nhóm**:
   - Nếu người dùng chỉ định rõ phạm vi file/mục tiêu → chỉ stage đúng nhóm đó, giữ nguyên thay đổi khác.
   - Nếu worktree có nhiều thay đổi thuộc các mục đích độc lập nhau (ví dụ tính năng + rule/skill + sửa lỗi khác) → tách thành từng commit sạch theo mục đích (`docs/rules/git.md`), không nhồi chung một commit khổng lồ trừ khi là thay đổi nền liên kết chặt chẽ.
2. **Stage & kiểm diff đang stage**:
   ```bash
   git add -- <cac-file-thuoc-commit>
   git diff --cached --stat
   git diff --cached --check
   ```
   Xác minh không có conflict marker, secret bị lọt hay file nhầm trước khi commit.
3. **Soạn commit message sạch (KHÔNG `Co-Authored-By:`)**:
   - Tiêu đề ≤ 72 ký tự, mẫu `<type>(<scope>): <imperative-english-lowercase-no-period>` đúng `.githooks/commit-msg`.
   - Dòng trống thứ 2, body tiếng Anh súc tích dựa trên diff thật (đã đổi gì, vì sao, tác động migration/API/test).
   - Thực thi commit bằng hai cờ `-m` (tiêu đề riêng, body riêng) hoặc file message tạm (nhớ xóa ngay sau đó nếu tạo trong worktree — tốt nhất dùng nhiều `-m` hoặc pipe `--file -` từ stdin để không tạo rác trong repo), **tuyệt đối không thêm bất kỳ dòng `Co-Authored-By:` hay ghi công AI nào**.
   - Sau khi commit, chạy `git log -1 --format=%B` để xác nhận nội dung commit lưu trong Git hoàn toàn sạch, không dính trailer bên ngoài.

## Bước 3 — Đồng bộ & Push lên Remote (`origin`)

1. Kiểm upstream của nhánh hiện tại:
   ```bash
   git rev-parse --abbrev-ref --symbolic-full-name @{u}
   ```
2. **Trường hợp đã có upstream**:
   - Kiểm tra xem remote có commit mới chưa (`git fetch origin <branch> && git status -sb`).
   - Nếu nhánh local bị chậm sau remote (behind) hoặc phân kỳ (diverged): báo rõ hoặc chạy `git pull --rebase` khi an toàn (không có conflict bất ngờ); nếu phát sinh conflict thì dừng báo người dùng xử lý, không tự ý force push.
   - Chạy `git push`.
3. **Trường hợp chưa có upstream**:
   - Chạy `git push -u origin <branch>`.

## Bước 4 — Báo cáo kết quả

Báo ngắn gọn bằng **tiếng Việt có dấu**:
- Nhánh đã push và tên remote (`origin/<branch>`).
- Danh sách commit vừa tạo (`hash ngắn` + tiêu đề + nhóm file tương ứng), xác nhận đã vượt qua hook và không có trailer nguồn bên ngoài.
- Kết quả `git push` thực tế và trạng thái `git status --short` còn lại (file nào được giữ lại chưa commit nếu có).
