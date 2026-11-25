# Playbook Monkey Test cho ToanNX

Mục tiêu của monkey test là tìm ra các lỗi không nằm trong happy path: race condition khi click nhanh, mất filter khi F5, lỗi React khi state chuyển đột ngột, tràn ngang mobile khi mở dialog, nhập ký tự đặc biệt gây crash/500, hoặc màn bị hỏng khi tài khoản thiếu quyền.

## Nguyên tắc an toàn

1. **Chỉ chạy trên môi trường test/local**: Script [monkey-explore.mjs](../scripts/monkey-explore.mjs) mặc định từ chối mọi host không phải `localhost` hoặc `127.0.0.1`.
2. **Bảo toàn phiên/dữ liệu hệ thống khi chỉ cần kiểm ổn định**: Mặc định tránh bấm nút `Đăng xuất` (`data-testid="logout"`), nút xóa vĩnh viễn tài khoản admin đang dùng, hoặc thu hồi chính phiên hiện tại (trừ khi chạy test chuyên biệt trong chế độ `--allow-destructive` trên DB E2E `toannx_e2e`).
3. **Tái hiện được 100%**: Mọi lần chạy dùng `MONKEY_SEED` (mặc định timestamp hoặc truyền `--seed 12345`). Khi có lỗi, log đầy đủ `seed`, danh sách route, bước lỗi và hành động gần nhất.

## Cách chạy nhanh bằng Playwright

1. Đảm bảo server local đang chạy (ví dụ `http://localhost:3001` + BE `8001`, đã `seed_test_accounts`), hoặc dùng cổng E2E (`http://localhost:3002`).
2. Chạy quét hỗn loạn từ thư mục gốc repo (tùy chọn `--storage-state` sau khi đăng nhập hoặc truyền `--email` / `--password` để tự đăng nhập qua `/vi/dang-nhap`):
   ```powershell
   node .agents/skills/test/scripts/monkey-explore.mjs --base-url http://localhost:3001 --email admin@toannx.local --password Toannx@123 --routes "/vi/quan-tri,/vi/quan-tri/he-thong/nguoi-dung,/vi/quan-tri/tai-chinh/thu-nhap,/vi/quan-tri/tien-ich/trang,/vi/ca-nhan" --steps 60 --seed 20261125
   ```
3. Kiểm đa vai trò (rất hay bắt được bug phân quyền FE): chạy lại với `finance.viewer@toannx.local`, `finance.member@toannx.local`, `portal.member@toannx.local` trên đúng cùng danh sách `--routes`.

## Giải thích 5 nhóm thao tác monkey thực hiện

| Nhóm | Mô phỏng hành vi thật | Lỗi hay phát hiện |
| --- | --- | --- |
| Click & Double-click chaos | Click liên tiếp nút, tab, row action, sort header, switch trạng thái, mở/đóng dialog nhanh | Gửi POST trùng, modal kẹt overlay, mismatch aria/Radix, unhandled rejection |
| Fuzz input & boundary | Điền Unicode có dấu dài, emoji, `<img src=x onerror=alert(1)>`, số `-999999` / `9999999999`, khoảng trắng, `/?#%` | Backend 500 vì quá độ dài/type error, vỡ UI card, XSS thô, filter crash |
| Reload & History chaos | F5 giữa chừng, `goBack`/`goForward`, đổi `/vi` ↔ `/en`, hủy request đang chạy | Mất bộ lọc/trang URL, `Runtime Error: cancelled`, infinite loading |
| Viewport jitter | Đổi kích thước `375x812`, `768x1024`, `1280x800` liên tục ngay khi mở bảng/dialog/drawer | Tràn ngang (`scrollWidth > clientWidth`), footer dialog bị khuất, bulk bar rớt 2 dòng |
| Visual & Media check | Kiểm tra `img.complete && naturalWidth > 0`, chụp ảnh tại bước lỗi hoặc định kỳ | Ảnh rỗng/broken link, missing i18n, badge/text đè nhau |

## Biến phát hiện thành regression test

Khi `monkey-report.json` hoặc screenshot cho thấy lỗi:
1. Dùng `read_file` mở ảnh chụp lỗi để nhìn rõ trạng thái UI.
2. Chạy lại đúng `--seed <seed>` để xác nhận tái hiện ổn định.
3. Viết test unit / API / Playwright E2E nhỏ gọn khóa đúng trường hợp vừa vỡ (không bê nguyên vòng lặp random vào CI).
4. Sửa code và chạy lại cả regression test + monkey cùng `--seed` đó cho đến khi `errors === 0`.
