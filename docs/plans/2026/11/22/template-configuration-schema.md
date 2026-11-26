# Đặc tả Schema Cấu hình Template (Template Configuration Schema)

> **Mục tiêu:** Định nghĩa cấu trúc dữ liệu JSON chi tiết, kiểu dữ liệu TypeScript (Frontend) và lược đồ kiểm thực Python/Zod (Backend/Frontend) cho `content_config`, `style_config`, `responsive_config`.

---

## 1. Cấu trúc tổng thể của bản ghi Page

Trên database `utilities_page`, mỗi trang gồm các trường chuẩn và các trường cấu hình:

```json
{
  "id": "c1f7a28e-4a6c-482d-8422-bc571b693240",
  "title": "Góc Đồ Công Nghệ & Bàn Phím Cơ",
  "slug": "cong-nghe",
  "path_id": "9a7516d3-bf58-45ee-912b-3e5fbfddc8e0",
  "status": "PUBLISHED",
  "page_type": "AFFILIATE",
  "template_key": "product_grid",
  "template_version": 1,
  "seo_title": "Góc Đồ Công Nghệ Của Toàn | Tổng Hợp Bàn Phím & Phụ Kiện",
  "seo_description": "Tổng hợp link mua và mã giảm giá các thiết bị công nghệ, bàn phím cơ, micro thu âm mình đang dùng.",
  "avatar_id": "4e73d32c-3837-4bf5-b4aa-71c1822818b4",
  "cover_id": "8b51d18f-a2e6-42bb-9543-98fe859e955d",
  "content_config": { /* Chi tiết nội dung theo Page Type */ },
  "style_config": { /* Giao diện, màu sắc, typography, card style */ },
  "responsive_config": { /* Cấu hình hiển thị theo Desktop, Tablet, Mobile */ },
  "content": { /* Tiptap doc chỉ dùng khi page_type == 'LEGACY_PAGE' */ }
}
```

---

## 2. Đặc tả `content_config` cho từng Page Type

### 2.1. `content_config` — Loại trang AFFILIATE (Trọng tâm)

```typescript
export interface AffiliateContentConfig {
  profile: {
    badge?: string;             // Ví dụ: "Official Affiliate Hub"
    title: string;              // Tên shop/creator hiển thị
    bio?: string;               // Tiểu sử ngắn
    announcement?: {            // Banner thông báo trên cùng
      enabled: boolean;
      text: string;
      link?: string;
      tone?: "info" | "warning" | "success" | "accent";
    };
    socialLinks?: Array<{
      platform: "facebook" | "tiktok" | "youtube" | "instagram" | "telegram" | "website" | "email";
      url: string;
    }>;
  };
  categories: Array<{
    id: string;                 // UUID v4
    name: string;               // Tên danh mục (vd: "Bàn phím cơ")
    slug: string;               // Slug (vd: "ban-phim-co")
    description?: string;
    icon?: string;              // Tên Lucide icon hoặc emoji
    imageUrl?: string;          // Ảnh thumbnail danh mục (tùy chọn)
    sortOrder: number;
    isVisible: boolean;
  }>;
  items: Array<{
    id: string;                 // UUID v4
    displayMode: "product" | "link"; // Thẻ sản phẩm đầy đủ HOẶC Nút link đơn giản
    title: string;              // Tên hiển thị (do admin quyết định)
    rawTitle?: string;          // Tên gốc lấy từ metadata
    description?: string;       // Mô tả ngắn
    categoryId: string;         // Thuộc danh mục nào
    destinationUrl: string;     // URL đích gắn affiliate (giữ nguyên params)
    rawUrl?: string;            // URL ban đầu lúc paste
    platform: "shopee" | "lazada" | "tiktok" | "tiki" | "amazon" | "custom";
    
    // Ảnh
    imageUrl?: string;          // URL ảnh ngoài hoặc link R2
    imageAttachmentId?: string; // Nếu upload vào Thư viện R2
    imageAlt?: string;

    // Giá
    priceConfig: {
      mode: "hidden" | "fixed" | "range" | "contact" | "view_at_store";
      amount?: number;          // Giá hiện tại (nếu fixed)
      originalAmount?: number;  // Giá gốc trước khi giảm
      rangeMin?: number;        // Khoảng giá tối thiểu
      rangeMax?: number;        // Khoảng giá tối đa
      currency: "VND" | "USD";  // Mặc định VND
      discountPercent?: number; // % giảm giá (nếu có)
      priceNote?: string;       // "Giá tham khảo", "Cập nhật lúc 10:00"
    };

    // Button & CTA
    buttonConfig: {
      label?: string;           // "Mua tại Shopee", "Xem giá", "Nhận ưu đãi"
      openInNewTab: boolean;    // Mặc định true
      customColor?: string;     // Ghi đè màu nút nếu muốn
    };

    // Nhãn & Trạng thái
    badge?: {
      text: string;             // "Hot", "Khuyên dùng", "Sale 50%", "Mới"
      tone: "primary" | "hot" | "sale" | "neutral";
    };
    isFeatured: boolean;        // Ghim lên đầu
    sortOrder: number;
    isVisible: boolean;
  }>;
}
```

### 2.2. `content_config` — Loại trang BIO (Link in Bio)

```typescript
export interface BioContentConfig {
  profile: {
    avatarUrl?: string;
    avatarAttachmentId?: string;
    coverUrl?: string;
    coverAttachmentId?: string;
    displayName: string;
    handle?: string;            // @toannx
    bioText: string;
    socials: Array<{ platform: string; url: string }>;
  };
  links: Array<{
    id: string;
    title: string;
    url: string;
    description?: string;
    icon?: string;
    thumbnailUrl?: string;
    badge?: string;
    highlight: boolean;         // Hiệu ứng rung nhẹ hoặc nổi bật
    buttonStyle?: "solid" | "outline" | "glass";
    sortOrder: number;
    isVisible: boolean;
  }>;
  showQrCode: boolean;
  qrCodeId?: string;            // Tham chiếu sang utilities_qr_code
}
```

### 2.3. `content_config` — Loại trang DONATION (Ủng hộ)

```typescript
export interface DonationContentConfig {
  creator: {
    name: string;
    avatarUrl?: string;
    message: string;            // "Ủng hộ mình một ly cà phê để duy trì blog nhé!"
    thankYouMessage: string;    // Lời cảm ơn sau khi chuyển khoản
  };
  bankAccount: {
    bankBin: string;            // Mã BIN ngân hàng (vd: "970422" - MBBank)
    bankName: string;           // Tên ngân hàng
    accountNumber: string;      // Số tài khoản
    accountHolder: string;      // Tên chủ tài khoản
    branch?: string;
  };
  qrCode: {
    source: "auto_vietqr" | "existing_record";
    existingQrId?: string;      // ID mã QR từ module QrCode
    presetAmount?: number;      // Số tiền mặc định nạp vào QR
    transferContent: string;    // Nội dung chuyển khoản (vd: "UNGHO TOANNX")
  };
  suggestedAmounts: Array<{
    amount: number;
    label: string;              // "1 ly cafe (30.000đ)", "1 cuốn sách (100.000đ)"
  }>;
  options: {
    showBankDetails: boolean;   // Hiện số tài khoản dưới dạng chữ để copy
    showCopyButton: boolean;    // Nút sao chép 1 chạm
    showDownloadQr: boolean;    // Nút tải ảnh QR về máy
  };
}
```

---

## 3. Đặc tả `style_config` (Giao diện & Theme)

```typescript
export interface StyleConfig {
  themePreset: "minimal_white" | "forest_green" | "dark_slate" | "ocean_blue" | "warm_beige" | "soft_pastel" | "custom";
  colors: {
    primary: string;            // Mã màu HEX (vd: #3D812E)
    secondary?: string;
    background: string;         // Mã màu nền (#FFFFFF hoặc #0F172A)
    surface: string;            // Màu nền thẻ card (#F8FAFC hoặc #1E293B)
    text: string;               // Màu chữ chính
    mutedText: string;          // Màu chữ mờ/phụ
    border: string;             // Màu đường viền
    accentBadge: string;        // Màu nhãn nổi bật
  };
  backgroundStyle: {
    type: "solid" | "linear_gradient" | "radial_gradient";
    gradient?: {
      angle: number;            // Góc độ (vd: 135deg)
      stops: Array<{ color: string; position: number }>; // position: 0 - 100
    };
  };
  typography: {
    fontFamily: "system" | "inter" | "roboto" | "playfair" | "montserrat";
    headingWeight: "medium" | "semibold" | "bold";
  };
  headerStyle: {
    layout: "centered" | "left_aligned" | "split" | "banner_overlay" | "compact";
    avatarShape: "circle" | "rounded" | "square";
    avatarSize: "sm" | "md" | "lg";
    coverHeight: "none" | "compact" | "medium" | "tall";
  };
  cardStyle: {
    variant: "elevated" | "outlined" | "flat" | "glassmorphism";
    borderRadius: "none" | "sm" | "md" | "lg" | "full"; // 0px, 8px, 12px, 16px, 9999px
    shadow: "none" | "sm" | "md" | "lg";
    imageAspectRatio: "1:1" | "4:3" | "16:9" | "auto";
    imageFit: "cover" | "contain";
    ctaPosition: "bottom" | "right" | "inside_image";
  };
}
```

---

## 4. Đặc tả `responsive_config` (Responsive Tối ưu)

```typescript
export interface ResponsiveConfig {
  containerMaxWidth: "sm" | "md" | "lg" | "xl" | "full"; // 640px, 768px, 1024px, 1280px
  desktop: {
    columns: number;            // 2, 3, 4, 5 cột (mặc định 4)
    gap: "sm" | "md" | "lg";    // 12px, 16px, 24px
    showCategorySidebar: boolean;
    headerAlignment: "center" | "left";
  };
  tablet: {
    columns: number;            // 2, 3 cột (mặc định 3)
    gap: "sm" | "md";
    showCategoryScrollChips: boolean;
  };
  mobile: {
    columns: number;            // 1 hoặc 2 cột (mặc định 2 cho Product Grid, 1 cho Link List)
    gap: "xs" | "sm";           // 8px, 12px
    hideDescription: boolean;   // Ẩn mô tả dài trên mobile để thẻ gọn
    compactCtaButton: boolean;  // Rút gọn nút mua thành icon hoặc text ngắn
    categoryDisplay: "scrollable_chips" | "accordion" | "dropdown";
  };
}
```

---

## 5. Phân tầng điều khiển Form (Controls Hierarchy)

Nhằm tránh làm người dùng choáng ngợp với hàng trăm input trên một màn hình:

### A. Basic Settings (Thiết lập cơ bản — Luôn mở)
- **Shop Profile:** Tên trang, avatar, mô tả ngắn, mạng xã hội.
- **Danh mục:** Thêm nhanh tên danh mục.
- **Thêm sản phẩm:** Ô paste URL và nút "Lấy thông tin".
- **Theme Preset:** Chọn nhanh 1 trong 6 bảng màu có sẵn.
- **Bố cục chính:** Chọn dạng lưới (Grid) hoặc danh sách (List).

### B. Advanced Settings (Thiết lập nâng cao — Đặt trong Accordion/Collapsible)
- **Tùy chỉnh màu chi tiết:** Bảng chọn màu Hex, độ tương phản WCAG.
- **Tùy biến thẻ Card:** Bo góc, đổ bóng, tỷ lệ khung hình ảnh.
- **Cấu hình giá:** Bật/tắt giá gốc, % giảm giá, ghi chú giá tham khảo.
- **Responsive chi tiết:** Tinh chỉnh số cột riêng cho Mobile / Tablet / Desktop.
- **SEO & OpenGraph:** Tùy biến `seo_title`, `seo_description` độc lập với tiêu đề trang.
