# File công khai và riêng tư

## Chức năng

Mỗi file trong Thư viện (`Attachment`) có chế độ xem `public` (mặc định) hoặc `private`.

| | Công khai (`public`) | Riêng tư (`private`) |
| --- | --- | --- |
| Kho lưu | `STORAGES["default"]` (bucket R2 công khai; local `MEDIA_ROOT`) | `STORAGES["private"]` (bucket `CLOUDFLARE_R2_PRIVATE_BUCKET_NAME`, **không** bật public access; local `PRIVATE_MEDIA_ROOT`) |
| `url` API trả về | URL trực tiếp của storage | `/api/v1/system/attachments/{id}/content` |
| Ai mở được | Ai có link | Người upload, superuser, hoặc có `system.attachment.read_private` |
| Cách mở | Tải thẳng từ storage | API kiểm quyền rồi 302 tới link ký sống 5 phút; không quyền và không tồn tại đều 404 |
| Link chia sẻ | URL storage | Trang `/vi/tep/{id}` (đăng nhập rồi mới mở được) |

## Luồng xử lý file riêng tư

1. Upload với `visibility="private"` → `AttachmentService` ghi vào kho riêng (`R2PrivateStorage`).
2. Client đọc `url` = endpoint `/content`, không bao giờ nhận đường dẫn storage thật.
3. Mở file → `GET /attachments/{id}/content` → kiểm owner / `read_private` → 302 tới URL ký 5 phút.
4. Đổi chế độ → `POST /attachments/{id}/visibility`: chép file sang kho kia, cập nhật bản ghi, xóa bản cũ
   sau khi transaction commit (lỗi giữa chừng không mất file).

## Đọc bytes file trong trình duyệt (canvas, `fetch`)

URL của file công khai là URL storage R2 (`media.toannx.com`), khác origin với web: bucket không bật CORS thì
`fetch`/vẽ canvas bị chặn ("Failed to fetch", canvas "tainted"). Cần bytes (trình sửa ảnh, xử lý ảnh phía client) thì
đọc **cùng origin** qua `GET /api/v1/system/attachments/{id}/content?stream=1` — FE dùng
`attachmentService.contentStreamUrl(id)`. Backend kiểm quyền như `/content` rồi stream nội dung (không redirect, không
link ký). Chỉ để hiển thị (`<Image>`, `<img>`) thì vẫn dùng `url` trực tiếp.

Trình sửa ảnh (`lib/crop-image-canvas.ts`) giữ nguyên chất lượng gốc:
- Kiểu cắt mặc định **"Ảnh gốc"** (`ORIGINAL_CROP_ID`): khung phủ trọn ảnh, khóa kéo/thu phóng, lưu ra trọn ảnh
  (chỉ xoay/watermark) — `getCroppedImageCanvas` không truyền `pixelCrop`. Muốn cắt thì chọn Tự do / Vuông / Tròn / 4:3 / 16:9.
- Ảnh xuất có **đúng kích thước vùng cắt trên ảnh gốc**: vùng cắt làm tròn một lần, dùng cùng số nguyên cho canvas
  và `drawImage` (vẽ 1:1, không co giãn ngầm gây mờ); xoay quanh tâm canvas đã làm tròn, smoothing `high`.
- **Giữ định dạng gốc**: PNG/GIF → PNG (không mất dữ liệu), WebP → WebP 0.95, JPEG → JPEG 0.95; cắt tròn luôn PNG
  (nền trong suốt). Không nén PNG thành JPEG (chữ nhòe, vệt khối).

## Dung lượng (giới hạn `ATTACHMENT_MAX_TOTAL_STORAGE_BYTES`)

`AttachmentService.get_current_storage_usage_bytes` tính **cả hai kho**, chạy mỗi lần upload (chặn khi vượt, báo
`system.storage.quota_warning` khi qua ngưỡng):

| Tình huống | Cách tính |
| --- | --- |
| Đo được cả hai bucket qua Cloudflare R2 Usage API | bucket công khai + bucket riêng tư |
| Bucket riêng tư chưa cấu hình / API lỗi | API bucket công khai + tổng file riêng tư trong DB |
| Không đo được bucket công khai | Tổng DB của cả hai chế độ (file chưa dọn, gồm cả bản đã xoá mềm) |
| Hai biến bucket cùng tên (cấu hình nhầm) | Chỉ lấy số API một lần, không đếm hai lần |

Test: `backend/app/system/tests/test_attachment_storage_usage.py`.

## Quy định bắt buộc

- **Phải công khai**: ảnh đại diện, logo QR, ảnh bìa truyện (`Novel.thumbnail`), ảnh trong trang công khai
  (Utilities → Trang).
  `AttachmentPicker` mặc định chỉ liệt kê file công khai (`visibilityFilter="public"`).
- **Phải riêng tư**: chứng từ, hóa đơn, CSV/XLSX/XML. Màn chứng từ dùng
  `<AttachmentPicker visibility="private" lockVisibility />`. CSV/XLSX/XML luôn tải về, không xem trong trình duyệt.
- Không trả URL storage của file riêng tư ở bất kỳ API nào; không tạo link ký ở FE.
- `read_private` chỉ mở **xem**; không mở rộng quyền sửa/xóa (sửa/xóa theo `manage_all`).
- `read_private` và `manage_all` không bao giờ nằm trong `MEMBER` (xem [permission-scope.md](permission-scope.md)).
- Module khác cần file thì gọi service công khai của system (`AttachmentService`), không đọc storage trực tiếp.

## File chính

- BE: `backend/app/system/models/attachment.py` (`Visibility`), `services/attachment_service.py`,
  `backend/app/core/storage/r2_private_storage.py`
- FE: `frontend/src/modules/system/components/attachment-picker.tsx`, `attachment-visibility-toggle.tsx`,
  `views/file-access-view.tsx` (trang `/tep/{id}`)

Liên quan: [../guides/cloudflare-r2.md](../guides/cloudflare-r2.md), rule common §5.2.
