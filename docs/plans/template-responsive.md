# Đặc tả Bố cục Đa thiết bị & Responsive (Template Responsive Specification)

> **Mục tiêu:** Thiết lập quy chuẩn hiển thị responsive hoàn hảo trên mọi kích thước màn hình từ điện thoại siêu nhỏ (320px) đến màn hình máy tính Ultra-wide (1920px), kết hợp bộ chuyển đổi thiết bị trực tiếp (Live Device Selector) trong màn hình soạn thảo của Admin.

---

## 1. Chiến lược Điểm ngắt (Breakpoint Strategy & Viewports)

Hệ thống tuân thủ triết lý **Mobile-First**: giao diện được xây dựng tối ưu cho thiết bị di động trước, sau đó tự động mở rộng theo các điểm ngắt tiêu chuẩn của Tailwind CSS:

```
┌────────────────────────────────────────────────────────────────────────┐
│ MOBILE (< 640px)                                                       │
│ Các kích thước kiểm thử bắt buộc:                                      │
│ - 320px (iPhone SE thế hệ 1, màn hình nhỏ nhất)                        │
│ - 360px, 375px (iPhone mini, Galaxy phổ thông)                         │
│ - 390px, 430px (iPhone 14/15/16 Pro Max, màn hình lớn)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TABLET (640px – 1023px)                                                │
│ Các kích thước kiểm thử bắt buộc:                                      │
│ - 768px (iPad Mini / iPad tiêu chuẩn chiều dọc)                        │
│ - 820px, 834px (iPad Air / iPad Pro)                                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ DESKTOP (≥ 1024px)                                                     │
│ Các kích thước kiểm thử bắt buộc:                                      │
│ - 1024px (Laptop nhỏ, iPad Pro ngang)                                  │
│ - 1280px, 1440px (Màn hình Desktop chuẩn, MacBook)                     │
│ - 1920px (Màn hình Full HD / 2K)                                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Quy tắc Phân bổ Cột (Grid Columns Mapping)

Từng template có cấu hình số cột mặc định khoa học và cho phép admin tùy chỉnh trong khoảng an toàn:

| Template | Mobile (< 640px) | Tablet (640px – 1023px) | Desktop (≥ 1024px) | Giới hạn điều chỉnh |
| :--- | :--- | :--- | :--- | :--- |
| **Product Grid (Lưới SP)** | **2 cột** (hoặc 1 cột) | **3 cột** | **4 cột** (hoặc 5 cột) | Mobile: 1–2; Tablet: 2–3; Desktop: 3–5 |
| **Product List (Danh sách SP)** | **1 cột** (hàng dọc) | **1 cột** (hàng ngang) | **1 cột** hoặc **2 cột** | Mobile: 1; Tablet: 1; Desktop: 1–2 |
| **Minimal Links (Link Bio)** | **1 cột** | **1 cột** hoặc **2 cột** | **2 cột** | Mobile: 1; Tablet: 1–2; Desktop: 1–2 |
| **Creator Store (Storefront)** | **2 cột** (Featured: 1) | **3 cột** | **4 cột** (Featured: 3) | Tự động cân đối theo khối |
| **Category Hub (Cổng DM)** | **2 cột** (Category) | **3 cột** | **4 cột** + Sidebar trái | Tự ẩn sidebar trên tablet/mobile |
| **Donation Page (Ủng hộ)** | QR giữa màn hình | QR giữa hoặc bên dưới | QR bên phải, thông tin bên trái | Split layout trên Desktop |

---

## 3. Cơ chế Kế thừa & Ghi đè (Inheritance & Override Rules)

1. **Kế thừa thông minh (Smart Fallback):**
   - Nếu Admin chỉ chọn số cột Desktop = 4 mà không chỉnh Tablet hoặc Mobile, hệ thống sẽ tự động tính toán giá trị hợp lý nhất: Tablet = 3, Mobile = 2.
   - Admin không bao giờ phải cấu hình thủ công cả 3 thiết bị mới có giao diện đẹp.
2. **Khoảng cách (Gap & Spacing):**
   - Mobile: Gap nhỏ (`8px` hoặc `12px`) để tối ưu không gian hiển thị sản phẩm.
   - Desktop: Gap rộng rãi (`16px` hoặc `24px`) tạo cảm giác thoáng đãng, sang trọng.
3. **Mô tả sản phẩm (Line Clamp & Description Visibility):**
   - Trên Mobile: Tiêu đề sản phẩm tự động kẹp dòng `line-clamp-2` (tối đa 2 dòng, có dấu `...`), mô tả phụ tự động ẩn hoặc rút gọn để thẻ không bị dài ngoằng.
   - Trên Desktop: Hiển thị đầy đủ mô tả hoặc kẹp 3 dòng.
4. **Vùng chạm cảm ứng (Touch Target Accessibility):**
   - Mọi nút bấm, chip danh mục, icon trên Mobile đều đảm bảo kích thước tối thiểu **44x44px** theo khuyến nghị của Apple Human Interface Guidelines và Google Material Design để dễ dàng bấm bằng ngón tay cái.

---

## 4. Bộ Chuyển đổi Thiết bị trong Trang Quản trị (Admin Live Device Selector)

Trong màn hình soạn thảo của Admin, khung Live Preview bên phải được tích hợp thanh công cụ đổi kích thước khung nhìn:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [ 🖥️ Desktop (100%) ]  [ 📱 Tablet (768px) ]  [ 📲 Mobile (375px) ]    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Chế độ Desktop:** Chiếm toàn bộ chiều rộng của khung preview hoặc giới hạn ở 1200px.
- **Chế độ Tablet:** Giới hạn khung hình đúng `768px`, căn giữa, có viền giả lập bo góc của máy tính bảng.
- **Chế độ Mobile:** Giới hạn khung hình đúng `375px` (chuẩn iPhone), căn giữa, hiển thị chính xác trải nghiệm người dùng di động khi cuộn trang.
- **Tốc độ:** Chuyển đổi bằng CSS container queries hoặc `iframe`/`max-width`, không cần tải lại trang.
