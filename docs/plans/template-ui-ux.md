# Thiết kế Trải nghiệm Người dùng & Giao diện Quản trị (Template UI/UX Specification)

> **Mục tiêu:** Đặc tả chi tiết luồng thao tác của quản trị viên (Admin UX), giao diện chỉnh sửa chia tab khoa học kết hợp Live Preview tức thì, phương thức thêm sản phẩm siêu tốc (Quick Add by URL), và giao diện các trang Bio, Donation, Affiliate.

---

## 1. Luồng Khởi tạo Trang (Admin Create Flow)

Thay vì bắt người dùng đi qua wizard 5 bước rườm rà, hệ thống tối giản thành **Quy trình 2 bước tinh gọn**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: CHỌN LOẠI TRANG & TEMPLATE (Modal hoặc Trang khởi tạo)         │
│                                                                        │
│ 1. Chọn loại: [ Affiliate Store ]  [ Link-in-Bio ]  [ Donation ]       │
│ 2. Chọn giao diện mẫu:                                                 │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│    │ Product Grid │  │ Product List │  │ Minimal Link │                │
│    └──────────────┘  └──────────────┘  └──────────────┘                │
│ 3. Nhập nhanh: Tiêu đề trang + Đường dẫn giữa (PagePath)               │
│                                           [ Bắt đầu chỉnh sửa ➔ ]     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 2: KHÔNG GIAN SOẠN THẢO TẬP TRUNG (Split-Screen Workspace)        │
│                                                                        │
│ ┌──────────────────────────────┐  ┌──────────────────────────────────┐ │
│ │ CỘT TRÁI: FORM CẤU HÌNH      │  │ CỘT PHẢI: LIVE PREVIEW TRỰC TIẾP │ │
│ │ - Tab 1: Nội dung (Sản phẩm) │  │ [ 🖥️ Desktop ] [ 📱 Mobile ]     │ │
│ │ - Tab 2: Giao diện (Theme)   │  │                                  │ │
│ │ - Tab 3: Bố cục (Layout)     │  │ (Cập nhật tức thì khi gõ/chọn)   │ │
│ │ - Tab 4: Responsive          │  │                                  │ │
│ │ - Tab 5: Cài đặt & SEO       │  │                                  │ │
│ └──────────────────────────────┘  └──────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Chi tiết Các Tab Cấu hình trong Admin

### Tab 1: Nội dung (Content Tab)
- **Thông tin Shop/Creator:** Avatar, Ảnh bìa, Tên hiển thị, Tiểu sử ngắn, Mạng xã hội.
- **Quản lý Danh mục:** Danh sách dạng chip hoặc hàng. Nút "+ Thêm danh mục", đổi tên, kéo thả sắp xếp, nút ẩn/hiện, nút xóa.
- **Danh sách Sản phẩm / Liên kết:**
  - Nút nổi bật: **[ ⚡ Thêm nhanh bằng link URL ]** và **[ + Thêm thủ công ]**.
  - Bảng quản lý sản phẩm: Thumbnail ảnh, Tên sản phẩm, Danh mục, Nền tảng (Shopee/Lazada...), Giá hiển thị, Trạng thái (Bật/Ẩn), Nút Sửa / Nhân bản / Xóa.
  - Hỗ trợ kéo thả (Drag & Drop) để sắp xếp thứ tự hiển thị.

### Tab 2: Giao diện (Style & Theme Tab)
- **Theme Preset:** Chọn nhanh 6 bộ màu chuẩn: Minimal White, Forest Green, Dark Slate, Ocean Blue, Warm Beige, Soft Pastel.
- **Tùy biến Màu sắc:** Bảng chọn mã HEX cho Màu chủ đạo (Primary), Màu nền (Background), Màu thẻ (Surface), Màu chữ (Text). Kèm thước đo tương phản WCAG tự động cảnh báo nếu chữ và nền khó đọc (< 4.5:1).
- **Kiểu dáng Thẻ Card:**
  - Kiểu viền: Nổi nhẹ (Elevated shadow), Viền mỏng (Outlined), hoặc Phẳng (Flat).
  - Độ bo góc: Vuông (0px), Bo vừa (8px), Bo tròn (16px), Viên thuốc (Pill).
  - Tỷ lệ ảnh: 1:1 (Vuông chuẩn), 4:3, hoặc 16:9.
- **Nút bấm (Button CTA):** Màu sắc, bo góc, có hiện icon sàn hay không.

### Tab 3: Bố cục (Layout Tab)
- Chuyển đổi qua lại giữa các kiểu bố cục: Dạng Lưới (Grid), Dạng Danh sách (List), Dạng Thẻ gọn (Compact).
- Bật/tắt thanh tìm kiếm công khai.
- Chọn kiểu hiển thị danh mục: Cuộn ngang (Chips), Tab ngang, hoặc Sidebar.

### Tab 4: Responsive Tab
- Tinh chỉnh số cột hiển thị độc lập cho Desktop (3–5 cột), Tablet (2–3 cột), Mobile (1–2 cột).
- Tùy chọn: Ẩn mô tả dài trên điện thoại để tiết kiệm diện tích cuộn trang.

### Tab 5: SEO & Xuất bản (SEO & Settings Tab)
- Đường dẫn giữa (`PagePath`), Slug trang, Tiêu đề SEO, Mô tả SEO, Ảnh chia sẻ mạng xã hội (OpenGraph Image).
- Trạng thái trang: Bản nháp (DRAFT), Công khai (PUBLISHED), Ngừng công khai (UNPUBLISHED).

---

## 3. Modal Thêm Sản Phẩm: Quick Add vs Manual Add

Nhằm giúp admin thêm hàng chục sản phẩm trong vài phút:

```
┌────────────────────────────────────────────────────────────────────────┐
│ DIALOG: THÊM SẢN PHẨM MỚI                                             │
│                                                                        │
│ [ ⚡ THÊM NHANH BẰNG LINK URL (Mặc định) ]   [ 📝 NHẬP THỦ CÔNG ]       │
│                                                                        │
│ Dán link sản phẩm (Shopee, Lazada, TikTok, Tiki, Amazon...):           │
│ ┌───────────────────────────────────────────────┐ ┌──────────────────┐ │
│ │ https://s.shopee.vn/8AXXXXXXXX                │ │ [ Lấy thông tin] │ │
│ └───────────────────────────────────────────────┘ └──────────────────┘ │
│                                                                        │
│ ── KẾT QUẢ QUÉT TỰ ĐỘNG ────────────────────────────────────────────── │
│ ┌──────────────┐  Tên hiển thị:                                        │
│ │              │  [ Bàn phím cơ Rain75 nhôm CNC Anode 3 mode       ]   │
│ │  Ảnh xem     │  Mô tả ngắn:                                          │
│ │  trước       │  [ Bàn phím gõ êm, âm trầm, pin trâu              ]   │
│ │              │  Danh mục: [ Bàn phím cơ ▼ ]   Nền tảng: [ Shopee ]   │
│ └──────────────┘  Giá hiển thị: [ 2.150.000 ₫ ]  [x] Giá tham khảo     │
│                   URL Affiliate: [ https://s.shopee.vn/8AXXXXXXXX   ]  │
│                                                                        │
│                                    [ Hủy ]  [ Lưu vào danh sách ➔ ]    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Thêm thủ công (Manual Add):** Dành cho trường hợp link không quét được hoặc admin muốn tự tải ảnh từ máy tính cá nhân lên R2.

---

## 4. Thiết kế Chi tiết Cho Trang Bio (Link in Bio)

- **4 Mẫu giao diện:**
  1. *Minimal:* Nền trắng tinh tế, avatar tròn, tên, bio chữ xám, các nút bấm viền mỏng đen.
  2. *Modern Glass:* Nền gradient nhẹ, các nút bấm hiệu ứng kính mờ (glassmorphism backdrop-blur).
  3. *Dark Gradient:* Nền đen huyền bí, chữ trắng, nút bấm chuyển màu thương hiệu nổi bật.
  4. *Split Layout:* Trên Desktop chia 2 nửa: Cột trái ghim Avatar và Bio cố định; Cột phải cuộn danh sách link.
- **Tính năng đặc thù:**
  - Nút mạng xã hội (Social Icons Row): Facebook, Youtube, TikTok, Instagram, Github, Telegram, Email.
  - Tùy chọn ghim link quan trọng (Rung nhẹ thu hút chú ý / Highlight border).
  - Tích hợp mã QR cá nhân ở cuối trang (người xem có thể quét để lưu danh bạ hoặc mở trên điện thoại).

---

## 5. Thiết kế Chi tiết Cho Trang Donation (Ủng hộ / Quyên góp)

- **4 Mẫu giao diện:**
  1. *VietQR Card:* Thẻ ngân hàng sang trọng với mã VietQR chuẩn NAPAS ở trung tâm, số tài khoản in rõ nét kèm nút "Sao chép số tài khoản" một chạm.
  2. *Creator Support (Buy Me A Coffee style):* Khung lời nhắn thân mật của tác giả, các nút chọn nhanh số tiền: `[ 30.000 ₫ - 1 ly cafe ]`, `[ 50.000 ₫ - 1 bữa sáng ]`, `[ 100.000 ₫ - 1 cuốn sách ]`, hoặc ô tự nhập số tiền.
  3. *Minimal QR:* Tối giản tối đa, chỉ có ảnh QR và tên chủ tài khoản, quét là chuyển tiền.
  4. *Donation Landing:* Trang đầy đủ có mục tiêu quyên góp (Goal progress bar) và lời cảm ơn.
- **Tích hợp module `utilities.qr_code`:**
  - Admin có thể chọn 1 mã QR đã tạo sẵn trong hệ thống hoặc nhập số tài khoản để tự sinh VietQR.
  - Lưu ý bảo mật: Hệ thống ghi rõ số tài khoản và thông điệp chuyển khoản, **tuyệt đối không tự động đánh dấu "đã thanh toán" chỉ vì người xem quét mã QR**.
  - Tích hợp SePay (nếu có): Được đề xuất như một tính năng nâng cao tùy chọn để tự động đối soát giao dịch tiền vào thông qua webhook.
