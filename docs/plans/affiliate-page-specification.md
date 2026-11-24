# Đặc tả Chi tiết: Hệ thống Trang Tiếp thị Liên kết (Affiliate Page Specification)

> **Mục tiêu:** Đây là tài liệu đặc tả sâu nhất của hệ thống. Xây dựng giải pháp toàn diện cho trang tổng hợp sản phẩm và liên kết tiếp thị (Affiliate Storefront), hỗ trợ đa dạng ngành hàng (đồ công nghệ, bàn phím, thiết bị quay dựng, mô hình gundam, gia dụng, sách...), tối ưu trải nghiệm người xem và tỷ lệ nhấp chuột (CTR).

---

## 1. Mục đích và Phạm vi Nghiệp vụ (Scope & Purpose)

Trang Affiliate của ToanNX là một **Curated Creator Storefront** (Không gian giới thiệu sản phẩm chọn lọc của tác giả):
- **Nhiệm vụ chính:** Giới thiệu sản phẩm yêu thích, phân loại theo danh mục khoa học, cung cấp tìm kiếm tức thì, hiển thị thông tin trực quan và điều hướng người xem đến các sàn thương mại điện tử (Shopee, Lazada, TikTok Shop, Tiki, Amazon hoặc website bất kỳ).
- **Phạm vi nghiêm ngặt:** **Không xây dựng giỏ hàng và không xử lý thanh toán trực tiếp** trên hệ thống ToanNX. Mọi giao dịch mua hàng đều diễn ra trên website của đối tác/nền tảng.

---

## 2. Hai chế độ hiển thị dữ liệu (Data Modes)

Hệ thống hỗ trợ đồng thời 2 phong cách hiển thị trong cùng một trang hoặc tách biệt theo template:

```
┌────────────────────────────────────────────────────────────────────────┐
│ CHẾ ĐỘ A: SIMPLE LINK (Nút liên kết tối giản)                          │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ [Icon/Logo Shopee]  Bộ dụng cụ Gundam Pro ─────────── [ Mua ngay ] │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ Dành cho: Các liên kết phụ kiện nhỏ, tài liệu tải về, link shop tổng.  │
│ Trường dữ liệu: Title, URL, Icon/Platform badge, Mô tả ngắn (tùy chọn) │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ CHẾ ĐỘ B: PRODUCT CARD (Thẻ sản phẩm thương mại đầy đủ)                │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ ┌──────────────┐  Micro Thu Âm Shure MV7X              [ HOT ]     │ │
│ │ │              │  Mô tả: Micro dynamic chuyên podcast              │ │
│ │ │  Ảnh 1:1     │  Giá: 4.890.000 ₫  (Giá gốc: 5.500.000 ₫, -11%)   │ │
│ │ │              │  Nền tảng: Shopee Mall                            │ │
│ │ └──────────────┘  [ Mua tại Shopee ↗ ]                             │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ Dành cho: Sản phẩm công nghệ, đồ gia dụng, thiết bị chính cần ảnh đẹp. │
│ Trường dữ liệu: Ảnh, Tên, Giá bán, Giá gốc, Giảm giá, Nền tảng, CTA    │
└────────────────────────────────────────────────────────────────────────┘
```

### Kiến trúc thống nhất (Unified Entity):
Thay vì tạo hai bảng dữ liệu khác nhau, hệ thống sử dụng một thực thể item thống nhất với trường cờ `display_mode: "product" | "link"`. Điều này cho phép admin tự do trộn lẫn giữa sản phẩm chính (Product Card) và các liên kết phụ (Simple Link) trong cùng một danh mục mà không làm phức tạp hoá mô hình dữ liệu.

---

## 3. Cấu hình chi tiết từng Sản phẩm / Liên kết

Mỗi sản phẩm trong danh sách được cấu hình qua các nhóm thuộc tính sau:

### 3.1. Thông tin cơ bản (Basic Information)
- **ID:** UUID v4 sinh tự động.
- **Tên hiển thị (`title`):** Tên do admin đặt (ví dụ: *"Micro thu âm mình đang dùng"*). Cho phép đổi tên hiển thị hoàn toàn độc lập với tên trên sàn TMĐT.
- **Tên gốc (`raw_title`):** Tên trích xuất tự động từ sàn (ví dụ: *"Microphone Shure MV7X Dynamic Podcast XLR Chính Hãng..."*). Lưu lại để tham khảo khi cần khôi phục.
- **Mô tả ngắn (`description`):** Đánh giá cá nhân của tác giả (tối đa 250 ký tự). Có thể bật/tắt hiển thị trên mobile.
- **URL đích (`destination_url`):** URL affiliate thực tế (bảo toàn 100% các query parameters tiếp thị liên kết: `af_sub`, `universal_link`, `tracking_id`...).
- **URL gốc (`raw_url`):** Link nhập ban đầu lúc dán vào form.
- **Nền tảng (`platform`):** Tự động nhận diện từ tên miền:
  - `shopee`: Logo cam, nhãn "Shopee"
  - `lazada`: Logo xanh tím, nhãn "Lazada"
  - `tiktok`: Logo đen, nhãn "TikTok Shop"
  - `tiki`: Logo xanh dương, nhãn "Tiki"
  - `amazon`: Logo vàng đen, nhãn "Amazon"
  - `custom`: Nhãn website đối tác
- **Danh mục (`category_id`):** Gắn vào 1 danh mục cụ thể (ví dụ: "Bàn phím", "Thiết bị quay").
- **Nhãn nổi bật (`badge`):** Hỗ trợ gắn badge: `HOT`, `KHUYÊN DÙNG`, `SALE`, `MỚI`, hoặc chữ tự nhập (Custom Text).
- **Ghim nổi bật (`is_featured`):** Boolean. Sản phẩm ghim sẽ xuất hiện trong mục "Nổi bật" hoặc ở vị trí đầu tiên.
- **Thứ tự sắp xếp (`sort_order`):** Số nguyên để kéo thả sắp xếp vị trí.
- **Trạng thái hiển thị (`is_visible`):** Cho phép tạm ẩn sản phẩm mà không cần xoá.

---

### 3.2. Cấu hình Giá (Price Configuration) — Chống Thông tin Lỗi thời

Giá trên các sàn TMĐT (đặc biệt là Shopee/Lazada) biến động liên tục theo ngày và theo khung giờ Flash Sale. Nếu hệ thống tự ý hiển thị một con số cố định mà không giải thích, người xem sẽ gặp hiểu lầm khi bấm sang sàn và thấy giá khác.

Hệ thống thiết kế 5 chế độ giá chuyên biệt:

| Chế độ giá (`price_mode`) | Cách hiển thị trên giao diện | Khi nào nên dùng? |
| :--- | :--- | :--- |
| **1. Ẩn giá (`hidden`)** | Không hiển thị bất kỳ dòng giá nào. Chỉ hiện tên và nút CTA. | Khi sản phẩm có nhiều phân loại giá khác nhau hoặc giá biến động quá mạnh. |
| **2. Giá cố định / Giá tham khảo (`fixed`)** | Hiển thị: `1.250.000 ₫`<br>Kèm chú thích nhỏ bên dưới: *(Giá tham khảo)* | Khi admin muốn cung cấp mức giá ước lượng để người mua dễ hình dung ngân sách. |
| **3. Khoảng giá (`range`)** | Hiển thị: `350.000 ₫ – 500.000 ₫` | Khi sản phẩm có nhiều tuỳ chọn (ví dụ: switch bàn phím, kích cỡ áo, dung lượng RAM). |
| **4. Xem tại sàn (`view_at_store`)** | Hiển thị chữ màu nhã: *"Xem giá tại Shopee"* hoặc *"Bấm để cập nhật giá"* | **Khuyên dùng nhất cho Affiliate**: Tránh tuyệt đối việc hiển thị giá cũ, kích thích người dùng click vào link. |
| **5. Liên hệ (`contact`)** | Hiển thị: *"Liên hệ báo giá"* | Dành cho các dịch vụ hoặc sản phẩm custom theo yêu cầu. |

**Quy tắc kiểm soát dữ liệu giá:**
- **Không tự động gán giá = 0:** Nếu quét link mà không tìm thấy giá trong metadata, hệ thống mặc định chuyển sang chế độ `view_at_store`, tuyệt đối không hiển thị `0 ₫`.
- **Hiển thị giá gốc và % giảm giá:** Chỉ hiển thị khi `original_amount > amount` và admin bật cờ `show_discount`.
- **Đơn vị tiền tệ:** Mặc định `VND` (định dạng `1.500.000 ₫`), hỗ trợ `USD` (`$150.00`).
- **Thời điểm kiểm tra giá (`last_price_checked_at`):** Lưu timestamp lần cuối fetch metadata để admin biết dữ liệu đã cũ hay mới.

---

### 3.3. Cấu hình Hình ảnh (Image Strategies) — Tối ưu Chi phí R2 & Hiệu năng

Mỗi sản phẩm có thể có ảnh đại diện. Tuy nhiên, việc tự động tải hàng trăm tấm ảnh sản phẩm về Cloudflare R2 sẽ làm tốn băng thông và dung lượng lưu trữ 10GB miễn phí của R2.

Hệ thống phân tích 3 chiến lược hình ảnh:

```
┌────────────────────────────────────────────────────────────────────────┐
│ CHIẾN LƯỢC 1: EXTERNAL HOTLINK KÈM FALLBACK (Lựa chọn mặc định)        │
│                                                                        │
│ Trình duyệt khách ──► Tải trực tiếp ảnh từ CDN Shopee / TikTok CDN     │
│   ├─ Thành công: Hiển thị ngay, R2 tốn 0 byte, Neon tốn 0 byte!        │
│   └─ Thất bại (403/404/Hotlink Block): Tự động chuyển sang ảnh Fallback│
│      (Icon danh mục hoặc Logo sàn thương mại)                          │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ CHIẾN LƯỢC 2: MANAGED R2 IMAGE (Chủ động chọn lọc)                     │
│ Admin chỉ upload ảnh vào Thư viện R2 đối với các sản phẩm quan trọng,  │
│ sản phẩm tự chụp thật (real review photo), hoặc ảnh bìa chính.         │
└────────────────────────────────────────────────────────────────────────┘
```

**Giải pháp kỹ thuật cho Next.js Image:**
1. **Tránh vượt hạn mức Image Optimization của Vercel (1.000 ảnh/tháng):**
   - Với các ảnh từ domain bên ngoài (Shopee, Lazada, Tiki), Next.js Image component sẽ dùng thuộc tính `unoptimized={true}`. Trình duyệt sẽ tải trực tiếp từ CDN của sàn mà không chạy qua serverless optimization function của Vercel.
2. **Xử lý lỗi ảnh hỏng (Broken image fallback):**
   - Frontend gắn sự kiện `onError` trên thẻ ảnh: nếu ảnh bị lỗi (403 do hotlink protection, 404 do shop đổi ảnh), tự động thay thế bằng component placeholder thanh lịch có logo sàn và tên danh mục.
3. **Tùy biến hiển thị ảnh trên thẻ:**
   - Tỷ lệ khung hình: `1:1` (chuẩn TMĐT), `4:3` (chụp ngang), `16:9` (banner sản phẩm).
   - Object fit: `cover` (lấp đầy khung) hoặc `contain` (hiển thị trọn vẹn sản phẩm trên nền trắng).
   - Lazy loading: Toàn bộ ảnh sản phẩm phía dưới màn hình đầu tiên được bật `loading="lazy"` để tăng tốc độ nạp trang.

---

### 3.4. Nút bấm Mua hàng & Kêu gọi Hành động (CTA Button)
- **Bảo toàn liên kết:** Link gắn trên nút bấm sử dụng chính xác `destination_url` do admin lưu, tuyệt đối không bị xoá các query string affiliate.
- **Hành vi mở liên kết:** Mặc định mở tab mới (`target="_blank"`), tự động gắn thuộc tính an toàn: `rel="noopener noreferrer nofollow"`.
- **Nhãn nút bấm linh hoạt:**
  - *"Mua tại Shopee"* (kèm logo Shopee)
  - *"Mua tại Lazada"* (kèm logo Lazada)
  - *"Xem sản phẩm"*
  - *"Xem giá mới nhất"*
  - *"Nhận ưu đãi"*
- **Tùy chỉnh kiểu nút:** Nút tràn rộng (Full width) hoặc nút vừa chữ (Auto width); bo góc vuông, bo tròn 8px, hoặc hình viên thuốc (pill).

---

## 4. Danh mục 6 Template Affiliate Chuyên Biệt

Chúng tôi thiết kế 6 mẫu giao diện đáp ứng mọi nhu cầu từ tối giản đến cửa hàng trực quan:

### Template A — Minimal Affiliate Links (Danh sách Nút Tối giản)
- **Ý tưởng:** Phong cách Link-in-Bio nhưng được tối ưu cho sản phẩm.
- **Bố cục:** Header nhỏ gọn -> Thanh danh mục dạng cuộn ngang (Chips) -> Danh sách các liên kết dạng nút bấm rộng 100%. Mỗi dòng có icon sàn bên trái, tên sản phẩm ở giữa, và nút "Mua" bên phải.
- **Ưu điểm:** Cực kỳ nhẹ, tốc độ tải dưới 0.5s, hoàn hảo cho bio TikTok/Instagram.

### Template B — Product Grid (Lưới Sản Phẩm Đa Năng — Chuẩn TMĐT)
- **Ý tưởng:** Giống một gian hàng online thu nhỏ, hiển thị trực quan và bắt mắt.
- **Bố cục:**
  - Header gian hàng kèm avatar, tên shop và thanh tìm kiếm tức thì.
  - Tab chuyển danh mục dính trên đầu trang (Sticky Category Bar).
  - Lưới sản phẩm responsive: Desktop 4 cột, Tablet 3 cột, Mobile 2 cột.
  - Mỗi thẻ sản phẩm gồm: Ảnh vuông 1:1, Badge giảm giá/Hot ở góc ảnh, Tên sản phẩm (giới hạn 2 dòng), Giá bán & giá gốc, Nút bấm mua hàng màu nổi bật.

### Template C — Product List (Danh Sách Hàng Ngang Chi Tiết)
- **Ý tưởng:** Dành cho người xem thích đọc thông tin chi tiết và đánh giá ngắn của tác giả.
- **Bố cục:** Mỗi sản phẩm là một hàng ngang:
  - Thumbnail ảnh vuông bên trái (80x80px trên mobile, 120x120px trên desktop).
  - Khối thông tin ở giữa: Tên sản phẩm, dòng nhận xét ngắn của tác giả ("Đã dùng 6 tháng rất bền"), giá bán.
  - Cụm nút CTA bên phải.
- **Ưu điểm:** Hiển thị được mô tả chi tiết mà không làm vỡ bố cục như dạng lưới.

### Template D — Creator Storefront (Không Gian Nhà Sáng Tạo Toàn Diện)
- **Ý tưởng:** Kết hợp hoàn hảo giữa thương hiệu cá nhân và danh mục affiliate.
- **Bố cục:**
  - Ảnh bìa lớn (Cover Banner) phía trên.
  - Avatar, tên tác giả, các nút mạng xã hội (Youtube, Facebook, TikTok).
  - **Mục Tiêu Điểm (Featured Spotlight):** Thanh trượt ngang 3-5 sản phẩm được tác giả khuyên dùng nhiều nhất.
  - **Mục Danh Mục Chính:** Lưới sản phẩm được nhóm trực tiếp theo từng danh mục.
  - Tùy chọn chèn thêm một khối nhận ủng hộ (Donation Card) ở cuối trang.

### Template E — Category Hub (Cổng Phân Loại Chuyên Sâu)
- **Ý tưởng:** Phù hợp khi tác giả có hơn 100 sản phẩm thuộc nhiều lĩnh vực khác nhau.
- **Bố cục:**
  - Phía trên là lưới các Thẻ Danh Mục lớn (Category Cards) kèm ảnh đại diện của nhóm (vd: "Góc Setup", "Máy Quay", "Mô Hình").
  - Người dùng bấm vào danh mục nào thì trang cuộn mượt (smooth scroll) hoặc chuyển tab hiển thị riêng các sản phẩm của nhóm đó.
  - Desktop hỗ trợ thanh Sidebar danh mục cố định bên trái (như các trang tài liệu/storefront lớn).

### Template F — Compact Mobile Cards (Thẻ Siêu Gọn Cho Điện Thoại)
- **Ý tưởng:** Tối ưu mật độ thông tin (information density) cao nhất cho người dùng lướt nhanh trên smartphone.
- **Bố cục:** Thẻ dạng thẻ rút gọn, viền mỏng, ảnh nhỏ 48x48px, tên 1 dòng, giá và nút mua tích hợp trên cùng 1 hàng. Giúp người xem lướt qua được 10-15 sản phẩm trong một màn hình cuộn mà không mỏi tay.

---

## 5. Quản lý Danh mục (Categories Management)

### 5.1. Cấu trúc và Quy tắc Nghiệp vụ
- **Thuộc tính:** `id`, `name`, `slug`, `icon`, `sort_order`, `is_visible`.
- **Quan hệ:** **Một sản phẩm thuộc đúng một danh mục chính.** (Đơn giản, tránh trùng lặp dữ liệu trên giao diện và tránh bẫy N+1 trong cấu trúc JSON).
- **Mục "Tất cả" (All):** Luôn là tuỳ chọn mặc định ở đầu thanh lọc.
- **Danh mục trống:** Nếu một danh mục không có sản phẩm nào đang bật (`is_visible: true`), danh mục đó sẽ tự động ẩn trên giao diện công khai để tránh làm người xem thất vọng.
- **Xử lý khi xóa danh mục:** Khi admin xóa một danh mục trong trang quản trị, các sản phẩm thuộc danh mục đó sẽ được tự động chuyển về danh mục mặc định "Chưa phân loại" (Uncategorized) thay vì bị xóa mất.

### 5.2. Các Kiểu Giao diện Danh mục (Category UI Modes)
- **Thanh cuộn ngang (Scrollable Chips):** Các nút hình viên thuốc cuộn ngang mượt mà trên mobile, có hiệu ứng mờ ở hai mép (gradient fade) để người dùng nhận biết còn nội dung cuộn tiếp.
- **Tab ngang (Horizontal Tabs):** Phù hợp khi số lượng danh mục ít (dưới 6 danh mục).
- **Thanh Sidebar (Desktop Category Sidebar):** Hiển thị danh mục dạng cột đứng bên trái màn hình desktop, nội dung sản phẩm bên phải.

---

## 6. Tìm kiếm & Bộ lọc Công khai (Public Search & Filter)

### 6.1. Tìm kiếm Tức thì Phía Client (Instant Client-side Search)
Đối với hầu hết các trang Creator/Affiliate (từ 10 đến 300 sản phẩm), toàn bộ dữ liệu cấu hình đã nằm trọn vẹn trong payload JSON của trang (chỉ khoảng 30–80KB).
- **Giải pháp tối ưu:** Tìm kiếm hoàn toàn ở **Client-Side (JavaScript trong trình duyệt)**.
- **Lợi ích vượt trội:**
  - Tốc độ phản hồi: **0 mili-giây** (kết quả lọc ngay khi vừa gõ phím).
  - Không gửi bất kỳ HTTP request nào về server -> **Tiết kiệm 100% tài nguyên CPU Vercel và Neon DB**.
  - Không cần cài đặt Elasticsearch hay Algolia tốn kém.

### 6.2. Thuật toán Xử lý Tiếng Việt Không Dấu (Diacritics Normalization)
Người dùng Việt Nam thường xuyên tìm kiếm không dấu trên điện thoại (ví dụ gõ `"ban phim"` thay vì `"bàn phím"`, `"tai nghe"` thay vì `"tai nghe"`).
Frontend sử dụng thuật toán chuẩn hoá Unicode NFD để loại bỏ dấu thanh:
```typescript
function normalizeVietnamese(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
```
Tìm kiếm bao phủ đồng thời: Tên sản phẩm, Tên thương hiệu, Mô tả ngắn, và Tên danh mục.

### 6.3. Sắp xếp (Sorting Options)
Hỗ trợ các chế độ sắp xếp linh hoạt:
- **Mặc định (Custom Order):** Theo thứ tự sắp xếp do admin chỉ định.
- **Nổi bật lên đầu (Featured First):** Các sản phẩm gắn cờ `is_featured` luôn ưu tiên đứng trước.
- **Giá tăng dần (Price: Low to High):** Các sản phẩm không có giá hoặc để "Xem tại shop" sẽ được xếp ở cuối.
- **Giá giảm dần (Price: High to Low).**
- **Tên A → Z.**

---

## 7. Xử lý Trải nghiệm Theo Số Lượng Sản Phẩm (Scale UX)

| Quy mô sản phẩm | Trải nghiệm Danh mục & Tìm kiếm | Phân trang / Cuộn |
| :--- | :--- | :--- |
| **Nhỏ (5 – 20 sản phẩm)** | Ẩn thanh tìm kiếm nếu không cần thiết; hiển thị toàn bộ dạng lưới hoặc danh sách; không phân trang. | Cuộn 1 trang duy nhất, cực kỳ gọn gàng. |
| **Vừa (20 – 100 sản phẩm)** | Hiển thị thanh tìm kiếm tức thì; thanh danh mục dạng chips; hỗ trợ lọc theo danh mục kết hợp tìm kiếm. | Tải toàn bộ trong 1 payload; client render ngay lập tức; bật `loading="lazy"` cho ảnh. |
| **Lớn (100 – 500 sản phẩm)** | Thanh tìm kiếm luôn cố định (sticky); có bộ lọc danh mục và sắp xếp giá; hiển thị trạng thái "Không tìm thấy sản phẩm phù hợp". | Sử dụng kỹ thuật chia trang tại client (Client-side pagination 24 sản phẩm/trang) hoặc nút "Xem thêm sản phẩm" (Load More) để DOM nhẹ và mượt mà trên điện thoại cấu hình yếu. |
