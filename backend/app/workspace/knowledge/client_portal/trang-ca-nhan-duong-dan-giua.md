# Trang cá nhân (Page) và đường dẫn giữa (PagePath) — /ca-nhan/trang

## Địa chỉ công khai của trang gồm đường dẫn giữa và slug
Trang cá nhân công khai tại `toannx.com/<đường dẫn giữa>/<slug>`. Ví dụ trang slug `ToanToChill` ở đường dẫn giữa `p`
có địa chỉ `/p/ToanToChill`; chuyển sang đường dẫn giữa `kp` thì địa chỉ thành `/kp/ToanToChill`. Đường dẫn giữa có
sẵn sau khi cài đặt (seed): `p` (Trang — giới thiệu, link-in-bio) và `qr` (Trang chứa mã QR). Slug giữ nguyên chữ
hoa/thường người dùng gõ; mỗi đường dẫn giữa không có hai trang trùng slug (không phân biệt hoa thường).

## Đổi đường dẫn giữa của trang, ví dụ "đổi đường dẫn giữa sang kp"
1. Xác định trang: trang vừa thao tác (khối "BẢN GHI VỪA THAO TÁC") hoặc tra `list_pages` theo tên.
2. Gọi `update_page(page_id=..., path_segment="kp")`.
3. Nếu hệ thống báo chưa có đường dẫn giữa `kp`:
   - Người dùng đã nói "nếu chưa có thì tạo", "tự tạo luôn" → gọi lại ngay với `create_path_if_missing=true`.
   - Người dùng chưa nói → hỏi "Chưa có đường dẫn giữa kp, bạn có muốn tạo mới không?" rồi mới gọi lại.
4. Trả lời kèm địa chỉ mới (`public_url` trong kết quả) và link xem lại trang.
Đường dẫn giữa đang tắt thì không chuyển trang vào được; báo người dùng chọn đường dẫn khác (xem bằng
`list_my_records(resource="page_path")`).

## Đường dẫn giữa là danh mục dùng chung, quyền tạo theo vai trò
Đường dẫn giữa không thuộc riêng ai: tạo một lần, mọi trang của mọi người dùng chung. Trợ lý chỉ tự tạo khi tài khoản
có quyền tạo đường dẫn giữa (quản trị viên có sẵn); không có quyền thì báo nhờ quản trị viên tạo hoặc chọn đường dẫn có
sẵn. Trợ lý không sửa, không tắt, không xóa đường dẫn giữa (việc quản trị). Segment hợp lệ: 1–32 ký tự chữ thường a-z,
số 0-9 và dấu `-`; không trùng đoạn dành riêng của site (VD `quan-tri`, `admin`, `api`, `ca-nhan`).

## Tạo trang mới qua chat
`create_page(title=..., slug=...)` luôn tạo **bản nháp** ở đường dẫn giữa mặc định `p`. Người dùng muốn trang ở đường
dẫn khác ("tạo trang Giới thiệu ở /kp") thì truyền thêm `path_segment="kp"` (và `create_path_if_missing=true` nếu người
dùng đồng ý tạo khi chưa có). Nội dung, giao diện, ảnh đại diện, ảnh bìa và mẫu (template) soạn trên giao diện
`/ca-nhan/trang/<id>`.

## Sửa trang: tiêu đề, slug, mô tả, trạng thái
`update_page(page_id=..., ...)` đổi được: `title`, `slug`, `description`, `status` (`DRAFT` Bản nháp, `PUBLISHED` Công
khai, `UNPUBLISHED` Ngừng công khai) và `path_segment`. "Công khai trang đó" → `status="PUBLISHED"`; "ẩn trang", "gỡ
trang" → `status="UNPUBLISHED"` (không xóa). Xem danh sách: `list_pages`; trang lâu chưa cập nhật:
`get_stale_projects`. Xóa: `delete_personal_record(resource_type="page")`, xác nhận 2 bước.
