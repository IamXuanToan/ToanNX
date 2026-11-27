# Kiến trúc Hệ thống Template-Based (Template System Architecture)

> **Mục tiêu:** Thiết lập kiến trúc kỹ thuật toàn diện cho hệ thống Template-Based Page, tuân thủ nghiêm ngặt nguyên tắc kiến trúc hệ thống ToanNX: `url → view → service → repository`, base trong `app/core`, và Next.js `page → view → component+hook → hook → service`.

---

## 1. Sơ đồ kiến trúc tổng thể (Architecture Topology)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       ADMIN BROWSER                                             │
│                                                                                                 │
│  ┌──────────────────────────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │ 1. Form Cấu Hình (Tabbed Controls)           │  │ 2. Live Preview Trực Tiếp               │  │
│  │    - Chọn Type & Template                    │  │    - Device Switcher (Desktop/Tablet/Mob)│  │
│  │    - Quick Add / Manual Add URL              │  │    - Render tức thì từ Client State     │  │
│  │    - Tùy chỉnh Theme, Bố cục, Responsive     │  │    - Tái sử dụng chính xác Public Comp  │  │
│  └──────────────────────┬───────────────────────┘  └─────────────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────────────────────────────────────┘
                          │ (Save: POST/PATCH /api/v1/utilities/pages/{id})
                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ NEXT.JS FRONTEND (toannx.com - Vercel)                                                          │
│ - Admin API client (gửi cookie session, CSRF token)                                            │
│ - Routing & Rewrite: `proxy.ts` bắt `toannx.com/<segment>/<slug>`                              │
│ - Public SSR: `app/[locale]/(public)/page-view/[segment]/[slug]/page.tsx`                      │
│ - Template Dispatcher: Chọn đúng Renderer theo `pageType` và `templateKey`                     │
└─────────────────────────┬───────────────────────────────────────────────────────────────────────┘
                          │ (Fetch data: serverApiGet /api/v1/utilities/pages/public/...)
                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ DJANGO BACKEND (api.toannx.com - Vercel Python WSGI)                                            │
│                                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ View Layer: `PageViewSet` (Admin CRUD) & `PagePublicView` (Public Read)                   │  │
│  └──────────────────────────────────────────┬────────────────────────────────────────────────┘  │
│                                             ▼                                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Service Layer: `PageService`                                                              │  │
│  │ - Validate `content_config`, `style_config`, `responsive_config` theo TemplateRegistry    │  │
│  │ - Kiểm tra quyền sở hữu ảnh / shortlink                                                   │  │
│  │ - Điều phối cache Redis: `invalidate_public_cache()`                                      │  │
│  │ - Đọc URL metadata an toàn với bộ lọc SSRF (`LinkMetadataService`)                        │  │
│  └──────────────────┬───────────────────────────────────────┬────────────────────────────────┘  │
│                     ▼                                       ▼                                   │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────────────────────────┐  │
│  │ Repository: `PageRepository`        │  │ Upstash Redis (Cache Layer)                      │  │
│  │ - `find_by_url`, `update`, `create` │  │ - `utilities:public:<ver>:page:<seg>:<slug>`     │  │
│  │ - Chỉ truy vấn khi cache miss       │  │ - `utilities:metadata:<url_hash>` (7 days TTL)    │  │
│  └──────────────────┬──────────────────┘  └──────────────────────────────────────────────────┘  │
│                     ▼                                                                           │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Neon PostgreSQL Database: Bảng `utilities_page` (JSONField có cấu trúc)                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Luồng xử lý dữ liệu (Data Flows)

### 2.1. Luồng Soạn thảo & Xem trước (Admin Edit & Live Preview)
1. **Khởi tạo:** Admin chọn Tạo trang (`/quan-tri/tien-ich/trang/tao-moi`) -> Chọn Page Type (vd: `AFFILIATE`) -> Chọn System Template (vd: `product_grid`).
2. **Form khởi tạo mặc định:** Hệ thống nạp default schema của template vào React Hook Form.
3. **Thêm sản phẩm siêu tốc (Quick Add):**
   - Admin dán link sản phẩm (Shopee, Lazada, TikTok, Tiki...).
   - Bấm "Lấy thông tin" -> Gọi API `POST /api/v1/utilities/pages/fetch-metadata`.
   - Backend chạy `LinkMetadataService` (bảo vệ SSRF, timeout 3s, parse OpenGraph/JSON-LD).
   - Trả về preview -> Admin xác nhận hoặc sửa lại -> Thêm vào mảng `items` trong `content_config`.
4. **Live Preview tức thì (Zero-latency):**
   - Panel bên phải lắng nghe state của React Hook Form (`useWatch`).
   - Cung cấp dữ liệu trực tiếp cho component renderer công khai (`AffiliatePageRenderer`).
   - Admin đổi màu primary, chuyển sang 3 cột, bật/tắt giá -> Khung preview phản hồi ngay lập tức trong trình duyệt (không gửi request lên server).
   - Có thanh chuyển đổi thiết bị (Desktop 1200px, Tablet 768px, Mobile 375px) để kiểm tra responsive trước khi lưu.
5. **Lưu trang (Publish / Save):**
   - Admin bấm "Lưu" hoặc "Xuất bản".
   - Frontend validate Zod Schema -> Gửi `POST/PATCH` lên `PageViewSet`.
   - Backend validate với `CoreValidateSerializer` -> `PageService` lưu vào DB và gọi `invalidate_public_cache()` (tăng version Redis namespace).

### 2.2. Luồng Hiển thị Trang Công khai (Public View Flow)
1. **Người xem truy cập:** `https://www.toannx.com/p/my-gear`
2. **Edge Proxy (`frontend/src/proxy.ts`):** Nhận diện `segment = 'p'`, `slug = 'my-gear'` -> Rewrite ngầm nội bộ sang Next.js App Router: `/[locale]/(public)/page-view/p/my-gear`.
3. **Next.js Server (SSR):**
   - Gọi `serverApiGet` đến endpoint `/api/v1/utilities/pages/public/p/my-gear`.
4. **Django Backend (`PagePublicView`):**
   - Kiểm tra Redis: Khóa `utilities:public:{version}:page:p:my-gear`.
   - **Cache HIT:** Trả về JSON ngay lập tức (< 15ms), **không truy vấn Neon DB** (Neon tiếp tục ngủ).
   - **Cache MISS:** Đọc từ `PageRepository`, lưu vào Redis (TTL 10 phút), trả về response kèm header `Cache-Control: public, max-age=60`.
5. **Next.js Hydration & Rendering:**
   - Next.js nạp dữ liệu vào `PageRendererDispatcher`.
   - Điều phối sang component tương ứng (ví dụ: `AffiliateRenderer` với template `ProductGrid`).
   - Render HTML hoàn chỉnh tại server, truyền xuống client để hiển thị tức thì với điểm SEO và Core Web Vitals tối đa.

---

## 3. Thiết kế Decoupled Template Registry

Chúng ta áp dụng triết lý: **"Code định hình bố cục, Database lưu trữ dữ liệu"**.

### 3.1. Template Registry trên Frontend (`frontend/src/modules/utilities/templates/`)
Mỗi System Template là một object đăng ký độc lập:
```typescript
export interface SystemTemplateDefinition<TContent, TStyle, TResponsive> {
  key: string;
  pageType: PageType;
  version: number;
  name: { vi: string; en: string };
  description: { vi: string; en: string };
  previewThumbnail: string;
  defaultContent: TContent;
  defaultStyle: TStyle;
  defaultResponsive: TResponsive;
  supportedFields: string[];
  renderer: React.ComponentType<{
    content: TContent;
    style: TStyle;
    responsive: TResponsive;
    preview?: boolean;
  }>;
}
```

### 3.2. Template Registry trên Backend (`backend/app/utilities/constants/template_registry.py`)
Backend quản lý danh mục template để phục vụ việc validate dữ liệu trước khi ghi:
```python
@dataclass(frozen=True)
class BackendTemplateDefinition:
    key: str
    page_type: str
    version: int
    validator_class: type[BaseTemplateValidator]
```

**Lợi ích kiến trúc:**
1. **Không cần migration database khi thêm template mới:** Khi muốn thêm template "Creator Minimal", lập trình viên chỉ cần tạo 1 component React và đăng ký vào registry.
2. **Kiểm soát chặt chẽ:** Tránh việc người dùng chèn mã HTML/JS độc hại, vì toàn bộ cấu trúc DOM do code React nội bộ kiểm soát.
3. **Nâng cấp phiên bản an toàn:** Nếu template v1 lên v2 có thay đổi style, template migrator có thể tự động map các setting cũ sang setting mới một cách liền mạch.

---

## 4. Kiểm soát Cache và Tối ưu Ngân sách Hạ tầng

Tuân thủ nghiêm ngặt tài liệu [Hạ tầng và giới hạn gói miễn phí](../../../../architecture/infrastructure.md):

1. **Bảo vệ Neon Compute (100 CU-giờ/tháng):**
   - Tất cả trang ở trạng thái `PUBLISHED` được cache tại Upstash Redis.
   - Khi có khách truy cập: Đọc từ Redis. Neon chỉ bị đánh thức duy nhất khi cache miss hoặc khi admin chỉnh sửa trang.
2. **Bảo vệ Vercel Active CPU (4 giờ/tháng):**
   - Không thực hiện crawler hoặc lấy metadata trong request của khách vãng lai.
   - Thao tác lấy metadata chỉ chạy theo yêu cầu chủ động (on-demand click) của Admin trong trang quản trị.
3. **Bảo vệ Cloudflare R2 (10GB & 1M Class A operations):**
   - Hình ảnh sản phẩm affiliate cho phép sử dụng trực tiếp URL từ server ảnh công khai của nền tảng (Shopee/Lazada/TikTok CDN) mà không bắt buộc download về R2.
   - Chỉ khi admin chủ động upload ảnh từ máy tính thì mới lưu vào R2 bucket `public`.
