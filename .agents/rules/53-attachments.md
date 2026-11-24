---
trigger: model_decision
description: Dùng khi làm với file đính kèm, ảnh, upload, thư viện file, R2, file công khai hoặc riêng tư (chứng từ, hóa đơn).
---

# File công khai và riêng tư

Chi tiết: `docs/rules/common.md` §5.2, `docs/features/attachment-visibility.md`, `docs/guides/cloudflare-r2.md`.

- Ảnh khách xem được (avatar, logo QR, ảnh trong trang công khai) phải là file **công khai**.
- Chứng từ, hóa đơn, CSV/XLSX/XML phải là file **riêng tư** (bucket R2 không public).
- **Không API nào trả URL storage của file riêng tư**; chỉ trả `/attachments/{id}/content` (backend kiểm quyền rồi
  stream hoặc chuyển tới link ký ngắn hạn).
- Thay nội dung file giữ nguyên id attachment nhưng lưu khóa storage mới (UUID), file cũ xóa ngay.
- Dung lượng tính cả hai bucket; cảnh báo ở 90% `ATTACHMENT_MAX_TOTAL_STORAGE_BYTES`.
- Ảnh SVG tải lên phải qua kiểm tra an toàn (`svg_inspector`); SVG giao diện nằm trong `frontend/public/`.
