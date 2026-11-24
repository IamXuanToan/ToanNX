# Nghiên cứu & Thiết kế Hệ thống Trích xuất Metadata URL (Link Metadata Extraction & SSRF Security)

> **Mục tiêu:** Cung cấp tính năng tự động đọc thông tin (Title, Image, Description, Price, Platform) khi Admin dán link sản phẩm (Shopee, Lazada, TikTok, Tiki, Amazon...), đồng thời thiết lập lá chắn bảo mật tuyệt đối chống tấn công SSRF (Server-Side Request Forgery) và bảo vệ tài nguyên hạ tầng.

---

## 1. Thứ tự Ưu tiên Nguồn Dữ liệu (Metadata Extraction Pipeline)

Khi Backend tiếp nhận một URL hợp lệ, quy trình trích xuất dữ liệu sẽ quét tài liệu HTML theo thứ tự ưu tiên từ chuẩn mực đến dự phòng:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Open Graph Protocol (og:title, og:image, og:description, og:site)   │
│    Chuẩn phổ biến nhất được hầu hết các website hỗ trợ để chia sẻ MXH. │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Nếu thiếu trường nào)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Twitter Card (twitter:title, twitter:image, twitter:description)    │
│    Cung cấp ảnh chất lượng cao và tiêu đề tóm tắt.                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Nếu thiếu)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Structured Data JSON-LD (Schema.org/Product, Schema.org/Offer)      │
│    Nguồn duy nhất có thể chứa giá bán (price), đơn vị tiền tệ (price-  │
│    Currency), tình trạng còn hàng (availability), thương hiệu (brand). │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Nếu thiếu)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. HTML Meta Tags Chuẩn (<title>, <meta name="description">)           │
│    Lớp dự phòng căn bản nhất cho mọi website cổ điển.                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Các cạm bẫy thực tế cần lưu ý:
1. `og:image` có thể là logo của sàn thay vì ảnh sản phẩm thực tế nếu trang lỗi hoặc chuyển hướng sang trang chủ.
2. `og:title` thường chứa các hậu tố SEO rác (ví dụ: *"Shopee Việt Nam | Mua và Bán Trên Ứng Dụng..."*). Cần có bộ lọc làm sạch chuỗi (String sanitizer).
3. Các trang thương mại điện tử là Single Page Application (SPA / React) có thể chỉ trả về khung HTML rỗng nếu không có SSR. Khi đó, metadata chỉ lấy được ở mức cơ bản hoặc phải cho phép người dùng tự điền tay (Manual fallback).

---

## 2. Đặc thù Từng Nền tảng E-Commerce Thực Tế

### 2.1. Shopee
- **Định dạng link:** Link rút gọn tiếp thị liên kết (`https://s.shopee.vn/...`, `https://shp.ee/...`) hoặc link web đầy đủ (`https://shopee.vn/product/...`).
- **Hành vi chuyển hướng:** Link rút gọn thực hiện chuyển hướng HTTP 302 qua chuỗi tracking trước khi đến URL sản phẩm cuối cùng.
- **Thực tế trích xuất:**
  - Shopee áp dụng hệ thống bảo vệ chống bot (Cloudflare / Akamai Bot Manager). Các request gửi không có User-Agent tiêu chuẩn của trình duyệt sẽ bị chặn HTTP 403 ngay lập tức.
  - Khi gửi request với User-Agent di động hoặc desktop chuẩn (Chrome), Shopee vẫn trả về các thẻ Open Graph cơ bản trong phần `<head>` (chứa `og:title` và `og:image`).
  - **Giá sản phẩm trên Shopee:** Thường được render bằng JavaScript ở client, **không thể lấy được giá đáng tin cậy chỉ từ HTML thô**. Vì vậy, với Shopee, hệ thống tự động điền Tên + Ảnh, còn Giá sẽ để ở chế độ `"view_at_store"` (Xem giá tại Shopee) hoặc cho Admin tự gõ giá tham khảo.

### 2.2. Lazada
- **Định dạng link:** `https://s.lazada.vn/...` hoặc `https://www.lazada.vn/products/...`.
- **Thực tế trích xuất:** Lazada có hỗ trợ thẻ Open Graph tương đối đầy đủ cho crawler. Khi resolve chuỗi chuyển hướng từ link rút gọn, hệ thống có thể đọc được tiêu đề và ảnh sản phẩm gốc.

### 2.3. TikTok Shop
- **Định dạng link:** `https://vt.tiktok.com/...` hoặc link web showcase.
- **Thực tế trích xuất:** Thẻ Open Graph của TikTok Shop cung cấp ảnh thumbnail chất lượng cao và tên sản phẩm rõ ràng.

### 2.4. Tiki & Các Website Thương Hiệu Khác (Apple, Thế Giới Di Động, Anker...)
- Các trang này hỗ trợ cấu trúc dữ liệu `Schema.org/Product` chuẩn mực trong thẻ `<script type="application/ld+json">`. Backend có thể trích xuất được cả tên, ảnh, mô tả và giá bán chính thức.

---

## 3. Đánh giá Thư viện & Quyết định Kỹ thuật

| Thư viện | Môi trường | Đánh giá | Quyết định |
| :--- | :--- | :--- | :--- |
| **`requests` + Lightweight Parser (Python)** | Backend Django | - `requests` đã có sẵn trong `pyproject.toml`.<br>- Kết hợp với parser HTML nhẹ (BeautifulSoup4 hoặc regex an toàn / HTMLParser của thư viện chuẩn).<br>- Kiểm soát 100% tầng socket, DNS resolution và kiểm tra SSRF trước khi gửi gói tin.<br>- Tiêu tốn cực ít RAM và CPU. | **CHỌN (Phương án tối ưu nhất)** |
| **`metascraper` (Node.js)** | Frontend Next.js | - Thư viện trích xuất rất mạnh mẽ trên Node.js.<br>- Nhưng chạy trên Vercel Serverless Function sẽ tốn CPU quota của gói Free.<br>- Khó can thiệp sâu vào tầng network socket để chặn DNS Rebinding triệt để như Python socket. | Không chọn |
| **Headless Chrome (Puppeteer / Playwright)** | Backend / Cloud | - Chạy được JavaScript để cào giá mọi website.<br>- Nhưng bundle cực nặng (>300MB), khởi động mất 3-5 giây, hoàn toàn không tương thích với gói Vercel Free và làm quá tải hệ thống. | **LOẠI BỎ HOÀN TOÀN** |

---

## 4. Lá chắn Bảo mật Toàn diện: Chống Tấn công SSRF (Server-Side Request Forgery)

Đây là yêu cầu **bắt buộc và tối quan trọng**. Khi máy chủ thực hiện HTTP request đến một URL do người dùng cung cấp từ bên ngoài, kẻ tấn công có thể lợi dụng để quét mạng nội bộ hoặc đánh cắp thông tin nhạy cảm của hệ thống.

Chúng tôi thiết kế module bảo vệ `SafeHttpClient` với 7 lớp phòng thủ:

```
┌────────────────────────────────────────────────────────────────────────┐
│ LỚP 1: Protocol Whitelist                                              │
│ Chỉ chấp nhận `http://` và `https://`. Cấm `file://`, `gopher://`,     │
│ `ftp://`, `data:`, `ldap://`, `dict://`.                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LỚP 2: Phân giải DNS & Chặn Dải IP Nội bộ / Đám mây (Blacklist IP)    │
│ Phân giải DNS trước khi mở kết nối. Cấm tuyệt đối:                     │
│ - Localhost: `127.0.0.0/8`, `::1`                                      │
│ - Private LAN: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`        │
│ - Cloud Metadata: `169.254.169.254` (AWS, GCP, Neon, Vercel metadata)  │
│ - Link-local / Carrier NAT: `169.254.0.0/16`, `100.64.0.0/10`          │
│ - Dải IPv6 riêng tư: `fc00::/7`, `fe80::/10`                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LỚP 3: Chống DNS Rebinding                                             │
│ Kết nối trực tiếp đến địa chỉ IP đã được xác thực an toàn ở Lớp 2      │
│ (Custom HTTP Adapter ghim IP đích, gửi header Host tương ứng).         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LỚP 4: Giới hạn Thời gian chờ (Timeouts)                               │
│ - Connection timeout: 3.0 giây                                         │
│ - Read timeout: 5.0 giây (Tránh bị server ngoài treo connection).      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LỚP 5: Kiểm tra Re-validation Khi Chuyển hướng (Redirect Loop & Hop)  │
│ Giới hạn tối đa 5 bước chuyển hướng (`max_redirects = 5`).            │
│ MỖI BƯỚC chuyển hướng đều phải chạy lại kiểm tra Lớp 1 và Lớp 2        │
│ (Tránh việc link ngoài redirect về 127.0.0.1).                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LỚP 6: Giới hạn Dung lượng Phản hồi (Max Response Size & Streaming)   │
│ Đọc stream tối đa 1 MB (`1,048,576 bytes`).                            │
│ Nếu vượt quá 1MB -> Ngắt kết nối ngay lập tức (Chống tấn công làm tràn │
│ bộ nhớ / Decompression bomb).                                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LỚP 7: Kiểm tra MIME-type Header                                       │
│ Chỉ phân tích nếu Content-Type là `text/html` hoặc                     │
│ `application/xhtml+xml`. Bỏ qua các file nhị phân (exe, zip, mp4).     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Quy trình Làm việc Thực tế (Workflow & UX)

1. **Người dùng dán link:** Admin dán link sản phẩm vào ô nhập URL.
2. **Frontend kiểm tra cơ bản:** Kiểm tra định dạng URL hợp lệ (`https://...`).
3. **Kích hoạt chủ động:** Admin bấm nút **"Lấy thông tin"** (Hệ thống KHÔNG tự động gửi request khi vừa paste để tránh spam).
4. **Backend xử lý:**
   - Kiểm tra cache Redis: Khóa `utilities:metadata:{sha256(url)}`. Nếu có -> Trả về ngay.
   - Nếu chưa có: `SafeHttpClient` fetch HTML an toàn -> Trích xuất dữ liệu -> Lưu Redis (TTL 7 ngày) -> Trả về JSON cho admin.
5. **Xem trước & Xác nhận (Review & Confirm):**
   - Modal hiển thị thẻ xem trước: Ảnh sản phẩm, Tên sản phẩm, Mô tả, Giá (nếu đọc được).
   - Admin có thể chỉnh sửa lại tiêu đề cho ngắn gọn hoặc đổi ảnh trước khi bấm **"Thêm vào danh sách"**.
6. **Bảo toàn liên kết:** Dù tên hiển thị có sửa thế nào, `destination_url` luôn giữ nguyên 100% link affiliate ban đầu.
7. **Đổi URL:** Nếu admin đổi URL sản phẩm đã lưu, hệ thống hỏi xác nhận: *"Bạn có muốn cập nhật lại thông tin theo link mới không?"* để không vô tình xoá mất tiêu đề admin đã tỉ mỉ biên tập.

---

## 6. Ma trận Xử lý Sự cố & Thông báo Lỗi (Failure Handling Matrix)

| Tình huống lỗi | Nguyên nhân | Cách xử lý của hệ thống | Thông báo hiển thị cho Admin |
| :--- | :--- | :--- | :--- |
| **HTTP 403 Forbidden** | Website đối tác chặn bot (ví dụ Shopee Cloudflare) | Không retry liên tục. Chuyển sang chế độ nhập thủ công. | *"Website nguồn giới hạn truy cập tự động. Bạn vui lòng nhập tên và ảnh sản phẩm thủ công."* |
| **HTTP 404 Not Found** | Link sản phẩm đã bị xóa hoặc link gõ sai | Trả về thông báo lỗi rõ ràng. | *"Không tìm thấy trang sản phẩm (Mã lỗi 404). Vui lòng kiểm tra lại đường link."* |
| **Timeout (> 5s)** | Máy chủ đối tác phản hồi quá chậm | Ngắt request, không làm treo server. | *"Không thể kết nối đến website nguồn do quá thời gian chờ. Bạn có thể tự nhập thông tin."* |
| **URL trỏ về IP nội bộ (SSRF)** | Kẻ xấu hoặc link cấu hình sai trỏ về localhost | Chặn ngay tại tầng DNS, ghi log bảo mật. | *"Đường dẫn không hợp lệ hoặc không được phép truy cập vì lý do bảo mật."* |
| **Không có ảnh hoặc ảnh lỗi** | Link ảnh ngoài bị lỗi hoặc trang không có thẻ `og:image` | Sử dụng ảnh placeholder mặc định theo tên danh mục hoặc logo sàn TMĐT. | Tự động điền logo sàn làm ảnh đại diện. |
| **Không tìm thấy giá bán** | Giá nằm trong JavaScript SPA | Đặt chế độ giá về `"view_at_store"` (Xem giá tại sàn), không gán giá = 0. | Tự động bật chế độ: "Xem giá tại [Sàn]". |
