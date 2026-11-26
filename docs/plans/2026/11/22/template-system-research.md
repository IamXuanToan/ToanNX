# Nghiên cứu Hệ thống Website dạng Template-Based (Template-Based Website System)

> **Mục tiêu:** Định hình kiến trúc, khái niệm cốt lõi, đối chuẩn (benchmark) các nền tảng hàng đầu và chứng minh lý do tại sao phương pháp Template-Based vượt trội so với Visual Drag-and-Drop Builder cho dự án ToanNX.

---

## 1. Khái niệm cốt lõi (Core Concepts)

Hệ thống được tổ chức thành 5 cấp độ rõ ràng:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. PAGE TYPE (Loại trang)                                              │
│    Xác định nghiệp vụ, schema dữ liệu đầu vào và các trường nội dung   │
│    (Ví dụ: AFFILIATE, BIO, DONATION, PORTFOLIO, LANDING, LEGACY_PAGE)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. SYSTEM TEMPLATE (Mẫu hệ thống lập trình sẵn)                        │
│    Bố cục, khung hiển thị và logic render giao diện bằng code React    │
│    (Ví dụ với AFFILIATE: Product Grid, Product List, Minimal Links...) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. THEME PRESET (Bộ nhận diện dựng sẵn)                                │
│    Bộ màu (primary, background, surface, text), font chữ, bo góc...   │
│    (Ví dụ: Minimal White, Forest Green, Dark Slate, Ocean Blue...)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. PAGE INSTANCE (Bản thể trang cụ thể trong DB)                       │
│    Dữ liệu sản phẩm/link do admin nhập + cấu hình theme & responsive   │
│    Lưu trong bảng `utilities_page`                                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. SAVED PRESET (Bộ mẫu cá nhân hóa đã lưu - Tùy chọn)                 │
│    Tập hợp các cấu hình style/layout được admin lưu lại để tái sử dụng │
└────────────────────────────────────────────────────────────────────────┘
```

### Phân biệt rành mạch:
- **Page Type:** Xác định **"Trang này chứa dữ liệu gì?"** (Danh sách sản phẩm affiliate, thông tin bio & mạng xã hội, hay tài khoản chuyển khoản ngân hàng).
- **System Template:** Xác định **"Dữ liệu đó được xếp theo bố cục nào?"** (Dạng lưới thẻ card, dạng danh sách hàng ngang, hay danh mục có sidebar).
- **Theme Preset:** Xác định **"Trang mang phong cách màu sắc/kiểu dáng nào?"** (Sáng, tối, xanh lá thương hiệu, pastel nhẹ nhàng).
- **Page Instance:** Là trang thực tế do admin cấu hình với nội dung thật (URL, giá, tên sản phẩm, avatar).

---

## 2. Đối chuẩn các nền tảng thực tế (Benchmark & Reference Systems)

| Nền tảng | Mô hình | Điểm mạnh đáng học hỏi | Điểm yếu / Hạn chế |
| :--- | :--- | :--- | :--- |
| **Linktree** | Structured Link / Card Builder | - Cực kỳ tối giản, thao tác thêm link siêu tốc.<br>- Quản lý danh mục theo Header/Divider.<br>- Giao diện responsive trên mobile hoàn hảo. | - Cấu hình thẻ sản phẩm nghèo nàn.<br>- Thiếu lọc danh mục mạnh mẽ cho trang nhiều sản phẩm (>50 sản phẩm nhìn rất dài). |
| **Beacons.ai** | Multi-Block Creator Store | - Cho phép chia khối: Links, Store, Donation, Video.<br>- Đọc link Shopee/Amazon tự render thẻ sản phẩm.<br>- Hỗ trợ tab danh mục cuộn ngang mượt mà. | - Trực quan nhưng đôi khi nhồi nhét quá nhiều tính năng thừa (bán khoá học, booking email...). |
| **Stan Store** | Creator E-commerce Hub | - Tối ưu tỷ lệ chuyển đổi (CRO) rất cao.<br>- Thẻ sản phẩm có ảnh, giá ưu đãi, badge "Best Seller".<br>- Bố cục 1 cột và 2 cột cực gọn trên điện thoại. | - Giao diện đóng kín, khó tùy biến màu sắc sâu theo thương hiệu cá nhân. |
| **Buy Me A Coffee / Ko-fi** | Creator Donation & Support | - Khung hiển thị thanh toán/ủng hộ rất rõ ràng.<br>- Có các mốc số tiền gợi ý (1 ly cà phê, 3 ly, 5 ly).<br>- Lời nhắn cảm ơn và thông tin chuyển khoản rõ ràng. | - Không phù hợp để làm danh mục sản phẩm affiliate lớn. |
| **Shopee / Lazada Storefront** | E-commerce Storefront | - Phân loại danh mục rất rõ ràng.<br>- Tìm kiếm sản phẩm cực nhanh.<br>- Thẻ sản phẩm chuẩn mực: Ảnh 1:1, Giá sale, % Giảm, Nền tảng bán. | - Rất nhiều banner quảng cáo rối mắt, không phù hợp với phong cách cá nhân/creator tối giản. |
| **Carrd.co** | Single-page Builder | - Giao diện cực nhẹ, load nhanh dưới 1 giây.<br>- Bố cục container + section rất chuẩn. | - Vẫn còn tư duy visual kéo thả toạ độ/element, khiến người dùng không chuyên dễ làm vỡ layout responsive. |

---

## 3. So sánh: Template-Based vs Visual Page Builder

Tại sao dự án ToanNX **bắt buộc chọn Template-Based** và **loại bỏ Visual Page Builder** (Elementor, GrapesJS, Canva)?

| Tiêu chí | Template-Based System (Lựa chọn) | Visual Page Builder (Loại bỏ) |
| :--- | :--- | :--- |
| **Trải nghiệm người dùng (UX)** | **Điền form có cấu trúc**: Chọn template -> Nhập URL -> Tự lấy ảnh/giá -> Tích chọn ẩn/hiện. Ai cũng làm được trong 3 phút. | **Kéo thả canvas**: Phải căn lề (margin/padding), kéo rộng/hẹp, xếp cột. Rất mất thời gian và dễ làm lệch layout. |
| **Responsive (Mobile/Tablet)** | **Tự động & Chuẩn xác**: Template code sẵn responsive grid (Tailwind CSS: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`). Không bao giờ bị vỡ giao diện trên bất kỳ màn hình nào. | **Thảm họa responsive**: Người dùng chỉnh đẹp trên Desktop nhưng sang Mobile bị tràn chữ, vỡ ảnh, nút bị đè lên nhau. |
| **Dung lượng Database & Neon** | **Cực nhỏ**: Chỉ lưu JSON cấu hình dữ liệu thuần túy (vài KB). Không lưu HTML rác hay CSS inline khổng lồ. | **Cực lớn**: Lưu hàng chục KB đến hàng MB cây DOM, style JSON phức tạp cho mỗi trang, nhanh chóng làm đầy giới hạn 1GB của Neon. |
| **Hiệu năng & Bundle Size** | **Gọn nhẹ**: Zero runtime builder dependencies. Render bằng component React thuần túy, SSR cực nhanh trên Vercel. | **Nặng nề**: Phải nạp thư viện kéo thả (GrapesJS nặng ~500KB - 1MB JS), làm chậm trang web nghiêm trọng. |
| **Bảo trì & Nâng cấp (Maintenance)** | **Dễ dàng**: Muốn đổi giao diện của toàn bộ các trang, chỉ cần cập nhật code template React. Dữ liệu sản phẩm giữ nguyên 100%. | **Bất khả thi**: Mỗi trang là một mớ HTML/CSS riêng biệt, không thể nâng cấp đồng loạt khi đổi design system. |
| **Tính nhất quán thương hiệu** | Đảm bảo tính thẩm mỹ cao vì bố cục do lập trình viên/designer thiết kế chuẩn mực trước. | Người dùng tự do kéo thả dẫn đến giao diện lộn xộn, màu sắc không đồng bộ, mất tính chuyên nghiệp. |

---

## 4. Danh mục 7 Page Types mục tiêu

1. **AFFILIATE (Trọng tâm nhất):**
   - Mục đích: Trang giới thiệu sản phẩm giới thiệu (đồ công nghệ, bàn phím, gundam, mỹ phẩm, sách...).
   - Đặc điểm: Không giỏ hàng, không thanh toán trực tiếp; điều hướng sang Shopee, Lazada, TikTok Shop, Tiki, Amazon.
   - Hỗ trợ cả 2 chế độ: Simple Link (nút gọn) và Product Card (ảnh, giá, nhãn giảm giá, nút CTA).

2. **BIO (Link in Bio):**
   - Mục đích: Trang danh thiếp điện tử, tổng hợp link mạng xã hội và các liên kết quan trọng của cá nhân/creator.
   - Bố cục: Avatar, tên, tiểu sử ngắn, social icons, danh sách nút bấm liên kết, QR code cá nhân.

3. **DONATION (Ủng hộ / Quyên góp):**
   - Mục đích: Nhận ủng hộ tài chính từ độc giả/người theo dõi.
   - Thành phần: Mã QR VietQR chuẩn NAPAS, thông tin số tài khoản/chủ tài khoản, nút copy 1 chạm, các nút gợi ý số tiền (20k, 50k, 100k, tùy chọn), lời cảm ơn.

4. **PRODUCT_CATALOG (Danh mục dịch vụ / sản phẩm số):**
   - Mục đích: Giới thiệu dịch vụ, khóa học, ebook, phần mềm của tác giả.
   - Thành phần: Hình ảnh bìa, mô tả tính năng, bảng thông số, giá niêm yết, liên kết đăng ký.

5. **PORTFOLIO (Hồ sơ năng lực):**
   - Mục đích: Trưng bày dự án cá nhân, kỹ năng, kinh nghiệm làm việc, bài viết nổi bật.
   - Bố cục: Hero section, danh sách project cards kèm gallery ảnh và link demo/github, timeline kỹ năng.

6. **LANDING (Trang đích sự kiện / thông báo):**
   - Mục đích: Giới thiệu một chiến dịch cụ thể, ra mắt sách mới, hoặc thông báo đặc biệt.
   - Bố cục: Hero banner lớn, đếm ngược (nếu có), các điểm nổi bật, form/nút đăng ký tham gia.

7. **LEGACY_PAGE (Trang Tiptap cũ):**
   - Mục đích: Giữ nguyên vẹn khả năng đọc và hiển thị các trang bài viết tự do đã soạn thảo bằng Tiptap trước đây.
   - Đảm bảo 100% backward compatibility, không làm gián đoạn bất kỳ trang nào đang chạy trên production.
