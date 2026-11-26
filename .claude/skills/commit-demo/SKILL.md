---
name: commit-demo
description: "Soạn gợi ý nội dung commit chuẩn Conventional Commits của repo ToanNX (tiêu đề + body tiếng Anh) trong khối text để dán vào VS Code từ git status/diff. Chỉ đọc Git, tuyệt đối không stage/commit/push và không thêm Co-Authored-By hay nguồn bên ngoài. Dùng khi người dùng yêu cầu gợi ý commit, viết commit message hoặc gọi commit-demo."
---

# Soạn gợi ý Commit (`commit-demo`)

Skill này chỉ chạy khi người dùng **yêu cầu gợi ý nội dung commit** (`/commit-demo`, `$commit-demo` hoặc hỏi mẫu commit). Luôn hoạt động ở chế độ **chỉ đọc Git** — tuyệt đối không stage, commit, push, tạo nhánh hay sửa file code.

## Quy trình thực hiện

1. **Đọc chuẩn Git của dự án**: đọc `docs/rules/git.md` để nắm rõ `type`, `scope`, độ dài tiêu đề và quy tắc viết body.
2. **Đọc trạng thái & diff hiện tại (chỉ đọc)**:
   ```bash
   git status --short
   git diff --stat
   git diff --cached --stat
   ```
   Đọc thêm `git diff` (hoặc nội dung file untracked mới) đủ để hiểu đúng **bản chất thay đổi**, không chỉ liệt kê tên file và tuyệt đối không bịa kết quả test chưa chạy.
3. **Kiểm tra an toàn & phân nhóm commit**:
   - Nếu thấy file nhạy cảm/ngoài chuẩn (`.env`, `.env.local`, `media/`, DB local, build output, secret bị lộ hoặc file chưa vào `.gitignore`), **cảnh báo rõ bên ngoài khối `text`** để người dùng loại ra trước khi stage.
   - Phân biệt thay đổi có sẵn trước task (nếu biết từ ngữ cảnh) với thay đổi mới; tách thành `Commit 1`, `Commit 2` (đặt nhãn **ngoài** khối `text`) khi worktree chứa nhiều mục đích độc lập, trừ khi người dùng chỉ yêu cầu cho một nhóm cụ thể.
   - Nếu worktree sạch hoàn toàn (không có thay đổi nào), báo rõ là chưa có thay đổi để tạo commit.
4. **Định dạng văn bản commit dán trực tiếp vào VS Code**:
   - Đặt mỗi commit trong một khối ````text ... ```` thuần (không kèm lệnh `git commit`, cờ `-m` hay dấu nháy bọc).
   - **Dòng đầu**: `<type>(<scope>): <mo-ta-ngan>` bằng tiếng Anh, dạng mệnh lệnh, không viết hoa chữ cái đầu mô tả, không dấu chấm cuối, tối đa **72 ký tự** (khớp `.githooks/commit-msg`). Cho phép bỏ `(<scope>)` nếu thay đổi toàn cục hoặc nhiều scope cách nhau bằng `, `.
   - **Dòng thứ hai**: để trống.
   - **Body**: tiếng Anh ngắn gọn, nêu cụ thể đã đổi gì, vì sao cần đổi và tác động (migration/API/test nếu có), ưu tiên ≤ 72 ký tự/dòng.
   - **LUẬT CỨNG**: **tuyệt đối KHÔNG thêm dòng ghi công hay nguồn bên ngoài** (`Co-Authored-By: Claude ...`, `Co-Authored-By: ... <noreply@anthropic.com>`, `Generated with ...` hoặc bất kỳ nhãn AI nào). Chỉ dùng footer chuẩn của dự án như `BREAKING CHANGE:` khi thật sự phá vỡ contract.
