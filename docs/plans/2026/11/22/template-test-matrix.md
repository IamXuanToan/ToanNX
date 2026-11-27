# Ma trận Kiểm thử & Xử lý Tình huống Biên (Template Test Matrix & Edge Cases)

> **Mục tiêu:** Liệt kê đầy đủ mọi tình huống biên (Edge Cases), kịch bản lỗi, dữ liệu dị thường và xác định phương án xử lý, loại kiểm thử (Unit / Integration / E2E) cùng mức độ ưu tiên theo quy chuẩn kiểm thử của hệ thống ToanNX.

---

## 1. Nhóm Tình huống: Trích xuất Metadata & Bảo mật URL

| STT | Tình huống đầu vào (Input) | Kết quả kỳ vọng (Expected Result) | Cách xử lý kỹ thuật | Loại test | Mức ưu tiên |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 1 | URL hợp lệ nhưng website không có thẻ OpenGraph/JSON-LD | Vẫn lấy được thẻ `<title>` cơ bản; các trường khác để trống. | Fallback sang HTML `<title>`, không ném ngoại lệ 500. Chuyển sang cho admin nhập tay. | Unit / Integration | Cao |
| 2 | Website nguồn chặn bot trả về HTTP 403 (Shopee Bot Guard) | Backend không bị crash; trả về JSON thông báo yêu cầu nhập tay. | Bắt mã HTTP 403, trả về response có cấu trúc `{ success: false, code: "METADATA_BLOCKED" }`. | Integration | **Cực cao** |
| 3 | Link rút gọn affiliate (`s.shopee.vn`, `vt.tiktok.com`) | Chuyển hướng thành công theo chuỗi 302 đến URL sản phẩm cuối để lấy metadata. | `SafeHttpClient` follow redirects (tối đa 5 hops), mỗi hop đều tái kiểm tra IP an toàn. | Integration | **Cực cao** |
| 4 | URL trỏ tới localhost / IP nội mạng (`127.0.0.1`, `192.168.1.1`, `169.254.169.254`) | Chặn đứng tức thì, không gửi bất kỳ gói tin nào ra mạng nội bộ. | `SafeHttpClient` phân giải DNS, so khớp dải IP cấm (SSRF filter), raise `ValidationError`. | Unit / Security | **Tối thượng** |
| 5 | URL chuyển hướng (Redirect) trỏ về IP nội mạng | Bước redirect đầu an toàn, nhưng đích đến là `http://127.0.0.1:8000` -> Chặn ngay lập tức. | Kiểm tra re-validation trên từng bước chuyển hướng trong vòng lặp redirect. | Unit / Security | **Tối thượng** |
| 6 | Website nguồn trả file HTML khổng lồ (> 10MB) hoặc Decompression Bomb | Ngắt kết nối ngay khi nhận đủ 1MB đầu tiên, không làm tràn RAM server. | Đọc response dạng stream; nếu byte count > 1,048,576 bytes thì ngắt socket ngay lập tức. | Unit | Cao |
| 7 | Máy chủ nguồn bị treo kết nối (Tấn công Slowloris) | Request tự ngắt sau 5 giây, trả về lỗi timeout. | Thiết lập `connect_timeout = 3.0s`, `read_timeout = 5.0s` trên requests session. | Integration | Cao |
| 8 | Link ảnh sản phẩm trong metadata bị lỗi 404 hoặc 403 khi load trên trình duyệt | Giao diện không bị vỡ ảnh; tự động thay bằng placeholder có logo sàn TMĐT. | Thẻ ảnh Frontend bắt sự kiện `onError` -> Chuyển state sang hiển thị icon/logo fallback. | E2E | Cao |
| 9 | Admin tự sửa tên sản phẩm sau đó bấm "Quét lại metadata" | Không được tự động ghi đè tên do admin đã mất công sửa. | Hiển thị Dialog: *"Bạn có muốn giữ lại tên đã chỉnh sửa không?"* kèm 2 lựa chọn rõ ràng. | E2E / Unit | Trung bình |

---

## 2. Nhóm Tình huống: Dữ liệu Sản phẩm & Danh mục Affiliate

| STT | Tình huống đầu vào (Input) | Kết quả kỳ vọng (Expected Result) | Cách xử lý kỹ thuật | Loại test | Mức ưu tiên |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 10 | Sản phẩm không có ảnh (`image_url` rỗng) | Thẻ sản phẩm vẫn hiển thị đẹp, cân đối. | Template tự chuyển sang layout text-only hoặc dùng ảnh placeholder danh mục. | E2E | Cao |
| 11 | Sản phẩm không có giá hoặc sàn giấu giá trong JS | Không được tự gán giá = 0đ; hiển thị nhãn "Xem giá tại Shopee". | Hệ thống kiểm tra: nếu `price == null` -> tự động đặt `price_mode = "view_at_store"`. | Unit / E2E | **Cực cao** |
| 12 | Sản phẩm có giá gốc nhỏ hơn hoặc bằng giá bán (`original_price <= price`) | Không hiển thị huy hiệu giảm giá âm hoặc vô lý. | Logic tính toán: chỉ hiển thị % giảm giá khi `original_price > price`. | Unit | Cao |
| 13 | Tiêu đề sản phẩm quá dài (trên 150 ký tự) | Không tràn khung thẻ trên mobile và desktop. | CSS kẹp dòng `line-clamp-2` (mobile) và `line-clamp-3` (desktop), kèm tooltip khi hover. | E2E | Cao |
| 14 | Danh mục không có sản phẩm nào (Danh mục trống) | Không hiển thị tab danh mục trống trên trang công khai. | Client filter tự động ẩn các category có `product_count === 0`. | Unit / E2E | Trung bình |
| 15 | Admin xóa một danh mục đang chứa 10 sản phẩm | 10 sản phẩm không bị xóa mất; tự chuyển về "Chưa phân loại". | Form logic gán lại `category_id = "uncategorized"` cho các sản phẩm mồ côi. | Unit | Cao |
| 16 | Tìm kiếm tiếng Việt không dấu (gõ "ban phim" tìm "Bàn phím cơ") | Trả về chính xác các sản phẩm tương ứng. | Hàm `normalizeVietnamese()` loại bỏ dấu thanh Unicode NFD trước khi so khớp chuỗi. | Unit | **Cực cao** |
| 17 | Tìm kiếm chứa ký tự đặc biệt (`[`, `]`, `*`, `?`, `\`) | Không gây lỗi cú pháp Regex hoặc crash ứng dụng. | Escape ký tự đặc biệt trước khi đưa vào hàm tìm kiếm hoặc dùng `indexOf`. | Unit | Cao |
| 18 | Trang có 300 sản phẩm affiliate | Trang tải mượt mà, không giật lag khi cuộn trên điện thoại yếu. | Áp dụng `loading="lazy"` cho ảnh, phân trang client (24 sản phẩm/lần) hoặc ảo hóa danh sách. | E2E / Perf | Cao |

---

## 3. Nhóm Tình huống: Chuyển đổi Template & Tương thích Dữ liệu

| STT | Tình huống đầu vào (Input) | Kết quả kỳ vọng (Expected Result) | Cách xử lý kỹ thuật | Loại test | Mức ưu tiên |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 19 | Đổi từ template `ProductGrid` sang `ProductList` | 100% dữ liệu sản phẩm, danh mục, giá, link được giữ nguyên. | Hai template cùng dùng chung cấu trúc `AffiliateContentConfig`, chỉ đổi component render. | E2E | **Cực cao** |
| 20 | Đổi từ `Affiliate` sang `Bio` | Cảnh báo admin trước khi chuyển; giữ lại tên, avatar, cover; map các link affiliate sang link bio. | Modal xác nhận chuyển đổi loại trang; mapper tự động chuyển mảng items sang mảng links. | E2E | Cao |
| 21 | Nâng cấp template từ version 1 lên version 2 (thêm field mới) | Các trang tạo ở version 1 vẫn mở và render bình thường mà không lỗi. | Template Migrator tự động gán giá trị mặc định cho các field mới khi nạp config cũ. | Unit | **Cực cao** |
| 22 | Người xem truy cập trang Legacy cũ (Tiptap JSON) | Trang vẫn hiển thị chuẩn xác bài viết Tiptap như trước đây. | Dispatcher nhận diện `page_type === 'LEGACY_PAGE'` -> Gọi `LegacyTiptapPageRenderer`. | Integration / E2E | **Cực cao** |

---

## 4. Nhóm Tình huống: Responsive & Đa thiết bị

| STT | Tình huống đầu vào (Input) | Kết quả kỳ vọng (Expected Result) | Cách xử lý kỹ thuật | Loại test | Mức ưu tiên |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 23 | Màn hình điện thoại siêu hẹp (320px - iPhone SE) | Không có thanh cuộn ngang trang (No horizontal overflow); nút bấm không bị mất chữ. | Container padding `px-3`, nút CTA tự co giãn font `text-xs`, thẻ 1 hoặc 2 cột vừa vặn. | E2E (Playwright) | **Cực cao** |
| 24 | Thanh danh mục có 15 mục trên điện thoại | Cuộn ngang mượt mà, có chỉ báo trực quan. | CSS `overflow-x-auto no-scrollbar`, hiệu ứng bóng mờ (gradient mask) ở mép phải. | E2E | Cao |
| 25 | Thao tác chạm ngón tay (Touch targets) trên mobile | Người dùng bấm chuẩn xác, không bị bấm nhầm sang nút bên cạnh. | Đảm bảo nút và chip có vùng đệm tối thiểu `min-h-[44px]` và `min-w-[44px]`. | E2E | Cao |

---

## 5. Nhóm Tình huống: Xuất bản, Cache & Xung đột Phiên bản

| STT | Tình huống đầu vào (Input) | Kết quả kỳ vọng (Expected Result) | Cách xử lý kỹ thuật | Loại test | Mức ưu tiên |
| :---: | :--- | :--- | :--- | :---: | :---: |
| 26 | Trang ở trạng thái DRAFT; khách vãng lai truy cập URL | Trả về đúng HTTP 404 Not Found (Không làm lộ trang có tồn tại). | `PagePublicView` kiểm tra: nếu preview mà không có quyền -> ném `NotFoundError()`. | Integration (Backend) | **Cực cao** |
| 27 | Admin đang đăng nhập mở URL trang DRAFT | Hiển thị được trang nháp kèm thông báo "Đang xem trước bản nháp". | Token phiên được xác thực hợp lệ; header `Cache-Control: private, no-store`. | Integration | Cao |
| 28 | Admin sửa sản phẩm và bấm Lưu | Khách truy cập ngay lập tức thấy nội dung mới, không bị dính cache cũ. | `PageService.update` gọi `self.invalidate_public_cache()` tăng version namespace Redis. | Integration | **Cực cao** |
| 29 | Hai tab trình duyệt cùng sửa một trang (Xung đột phiên bản) | Tab lưu sau bị báo lỗi xung đột 409, không ghi đè mất công sức của tab kia. | Kiểm tra `content_version`: nếu lệch phiên bản -> trả lỗi `PAGE_VERSION_CONFLICT`. | Integration | Cao |
| 30 | Tạo trang trùng slug trên cùng một đường dẫn giữa (`PagePath`) | Báo lỗi 409 Conflict rõ ràng: "Slug đã được sử dụng". | UniqueConstraint ở database + validation bắt lỗi tại `PageService.create`. | Integration | Cao |
