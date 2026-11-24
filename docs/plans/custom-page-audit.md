# Báo cáo Audit Source Module Custom Page hiện tại (`utilities.page`)

> **Ngày thực hiện:** 22/11/2026  
> **Phạm vi audit:** Toàn bộ mã nguồn Backend (`backend/app/utilities/`), Frontend (`frontend/src/modules/utilities/`), Database Models, Serializers, Services, Routing, Cache, Permissions, và các module liên quan (`system.attachment`, `utilities.qr_code`, `utilities.short_link`).  
> **Nguyên tắc:** Chuẩn hóa theo `docs/rules/`, `AGENTS.md`, không tạo module CMS mới khi module `utilities` hoàn toàn có thể mở rộng.

---

## 1. Tổng quan hệ thống Custom Page hiện tại

Hiện tại, chức năng Custom Page nằm trong module **Tiện ích (`utilities`)**:
- **Backend:** `backend/app/utilities/models/page.py`, `page_path.py`
- **Frontend:** `frontend/src/modules/utilities/components/page/`, `views/page/`, `services/page.service.ts`
- **Route quản trị:** `/quan-tri/tien-ich/trang` (`/admin/utilities/pages`)
- **Route công khai:** `toannx.com/<segment>/<slug>` (được điều hướng qua `frontend/src/proxy.ts` rewrite sang `/[locale]/(public)/page-view/[segment]/[slug]`).

Trang hiện tại hoạt động theo mô hình **Tiptap Rich-Text Editor**:
Admin tạo trang với tiêu đề, đường dẫn giữa (`PagePath`), slug, mô tả, ảnh đại diện, ảnh bìa, theme đơn giản (`mode`, `primary_color`, `background_color`, `text_color`, `button_style`) và soạn thảo toàn bộ thân trang bằng **Tiptap JSON** (`content: JSONField`).

---

## 2. Bảng đối chiếu chi tiết các thành phần Custom Page

| Chức năng | File hiện tại | Cách hoạt động | Giữ nguyên / Mở rộng / Thay thế | Lý do chi tiết |
| :--- | :--- | :--- | :--- | :--- |
| **Page Model** | `backend/app/utilities/models/page.py` | Kế thừa `JournalTracker, CoreModel`. Có `title`, `slug`, `path_id`, `status` (DRAFT/PUBLISHED/UNPUBLISHED), `content` (Tiptap JSON), `content_version`, `seo_title`, `seo_description`, `theme` (JSONField), `avatar_id`, `cover_id`. | **Mở rộng** | Giữ nguyên toàn bộ cấu trúc DB hiện tại để không làm hỏng dữ liệu cũ. Thêm các trường: `page_type` (mặc định `'LEGACY_PAGE'`), `template_key` (mặc định `'blank'`), `template_version` (int), `content_config` (JSONField - lưu dữ liệu theo template), `style_config` (JSONField), `responsive_config` (JSONField). |
| **PagePath Model** | `backend/app/utilities/models/page_path.py` | Quản lý đường dẫn giữa (vd: `qr`, `p`). Unique case-insensitive segment. Không thuộc owner cụ thể. | **Giữ nguyên** | Hoạt động hoàn hảo và ổn định, cho phép các trang có URL đẹp như `toannx.com/p/my-links` hoặc `toannx.com/qr/donate`. |
| **Page Repository** | `backend/app/utilities/repositories/page_repository.py` | Kế thừa `CoreRepository`. Đọc `find_by_url(segment, slug)` với `select_related("path", "owner", "avatar", "cover")`. | **Mở rộng** | Giữ nguyên logic truy vấn; thêm helper nếu cần thiết để truy vấn theo `page_type`. Không thay đổi cấu trúc ORM. |
| **Page Service** | `backend/app/utilities/services/page_service.py` | Kế thừa `CoreCrudService`. Xử lý slug tự sinh, kiểm tra quyền owner cho avatar/cover/tiptap refs, kiểm tra conflict version `content_version`, cache Redis `utilities:public`. | **Mở rộng** | Mở rộng phương thức `create`, `update`, `_resolve`, `get_public` để hỗ trợ validate `content_config`, `style_config`, `responsive_config` theo từng `page_type` và `template_key`. Giữ nguyên cơ chế Redis cache namespace bumping. |
| **Theme Validator** | `backend/app/utilities/validators/theme_validator.py` | Validate `mode`, `primary_color`, `background_color`, `text_color`, `button_style`. Kiểm tra tương phản WCAG >= 4.5:1. | **Mở rộng** | Mở rộng thành bộ validator cho `style_config` tổng quát (hỗ trợ gradient, border-radius, card styling, typography) nhưng vẫn bảo lưu logic validate theme cũ cho các trang legacy. |
| **Page Content Validator** | `backend/app/utilities/validators/page_content_validator.py` | Kiểm tra cây node/mark Tiptap JSON, giới hạn độ sâu node <= 20, chống XSS, kiểm tra attachment/shortlink thuộc owner. | **Giữ nguyên cho Legacy** | Tiếp tục validate cho các trang có `page_type == 'LEGACY_PAGE'`. Các template mới sẽ có validator riêng theo schema của template (`content_config`). |
| **Serializers (Create/Update)** | `backend/app/utilities/serializers/validates/page_create_validate_serializer.py`, `page_update_validate_serializer.py` | Nhận input `path_id`, `title`, `slug`, `content`, `theme`, v.v. Kế thừa `CoreValidateSerializer` (từ chối field lạ). | **Mở rộng** | Thêm các trường `page_type`, `template_key`, `template_version`, `content_config`, `style_config`, `responsive_config`. |
| **Serializers (Response)** | `page_detail_response_serializer.py`, `page_list_response_serializer.py`, `page_public_response_serializer.py` | Đóng gói JSON trả về cho Admin và Public view. Public serializer loại bỏ `id`, `owner`. | **Mở rộng** | Trả thêm `page_type`, `template_key`, `content_config`, `style_config`, `responsive_config` cho cả admin và public serializer. |
| **API Endpoints (ViewSet)** | `backend/app/utilities/views/page_view_set.py` | CRUD chuẩn qua `CoreModelViewSet`: GET danh sách, POST tạo, GET chi tiết, PATCH sửa, DELETE xóa mềm, POST bulk-update, POST bulk-delete, POST duplicate, GET history. | **Giữ nguyên** | Toàn bộ endpoint quản trị chuẩn DRF được giữ nguyên; thêm action `fetch-metadata` (hoặc view riêng) để đọc URL metadata an toàn. |
| **Public API View** | `backend/app/utilities/views/page_public_view.py` | `GET /utilities/pages/public/{segment}/{slug}`. Rate limit `public.read`. Cache header 60s khi published, `private, no-store` khi preview. | **Giữ nguyên** | Giữ nguyên API contract. Dữ liệu công khai trả về thêm các trường template để frontend tự dựng layout. |
| **Frontend Routing (Proxy)** | `frontend/src/proxy.ts` | Phân tích pathname: nếu đúng 2 đoạn `/<segment>/<slug>` và không thuộc `RESERVED_SEGMENTS` -> rewrite sang `/[locale]/page-view/[segment]/[slug]`. | **Giữ nguyên** | Cơ chế rewrite URL ở Edge rất chuẩn, giữ nguyên 100% URL công khai cho toàn bộ hệ thống. |
| **Public Page Container** | `frontend/src/app/[locale]/(public)/page-view/[segment]/[slug]/page.tsx` | SSR tải dữ liệu từ API `pagePublic(segment, slug)`, tạo Metadata SEO (title, description, canonical, OG image). | **Mở rộng** | Tại SSR, dựa vào `page.pageType` và `page.templateKey` để gọi Renderer tương ứng (AffiliateRenderer, BioRenderer, DonationRenderer, hoặc Legacy TiptapRenderer). |
| **Public Page Component** | `frontend/src/modules/utilities/components/page/public-page.tsx` | Render HTML dựa trên theme CSS variables + TiptapContent. | **Mở rộng / Bao bọc** | Đổi tên thành `LegacyTiptapPageRenderer` và làm renderer mặc định cho `page_type === 'LEGACY_PAGE'`. Tạo bộ điều phối `PageRendererDispatcher`. |
| **Page Form (Admin)** | `frontend/src/modules/utilities/components/page/page-form.tsx` & `use-page-form.ts` | Form một màn hình kết hợp Tiptap editor với Tabs (Nội dung, Giao diện, SEO, Cài đặt). Lưu bản nháp vào LocalStorage. | **Tái cấu trúc / Mở rộng** | Với trang Legacy: giữ nguyên form Tiptap. Với Template-Based Page: chuyển sang giao diện chuyên biệt (Form Tabs bên trái + Live Preview tương tác bên phải có đổi chế độ Desktop/Tablet/Mobile). |
| **Page Table (Admin)** | `frontend/src/modules/utilities/components/page/page-table.tsx` | Bảng quản lý danh sách trang với DataTable, bộ lọc status/path/owner, cột Thao tác (Xem/Sửa/Xóa/Nhân bản), TableBulkBar. | **Mở rộng** | Thêm cột hiển thị `Loại trang` (Badge: Affiliate, Bio, Donation, Bài viết Tiptap) và bộ lọc theo `page_type`. |
| **Page Types & Schemas FE** | `page.types.ts`, `custom-pages.types.ts`, `page.schema.ts` | Định nghĩa type và Zod schema cho form. | **Mở rộng** | Bổ sung discriminated union types cho từng loại trang và Zod schema validate tương ứng. |

---

## 3. Khảo sát khả năng tái sử dụng từ các module khác

Hệ thống ToanNX tuân thủ kiến trúc phân tầng độc lập (`CoreModelViewSet`, `CoreCrudService`, `CoreRepository`). Khi mở rộng Template-Based Page, các tài nguyên sau trong hệ thống có thể và cần được tái sử dụng:

### 3.1. Thư viện file (`system.attachment`) & Cloudflare R2
- **Cơ chế:** Attachment phân quyền chặt chẽ (`public` vs `private`). Ảnh đại diện (`avatar`), ảnh bìa (`cover`), logo mã QR và hình ảnh đưa vào trang công khai **bắt buộc là file `public`** (xem tài liệu [docs/features/attachment-visibility.md](../features/attachment-visibility.md)).
- **Tái sử dụng:**
  - `AttachmentImageUploadView` / `AttachmentPicker`: Tái sử dụng trực tiếp trong form quản trị để admin chọn ảnh đại diện, ảnh bìa, hoặc upload ảnh sản phẩm (trong trường hợp muốn lưu trữ ảnh cố định trên R2).
  - Tận dụng `AttachmentService.find_alive_images()` để kiểm tra quyền sở hữu ảnh (tránh việc dùng ảnh private hoặc ảnh của người khác).
  - Tối ưu R2: Đối với hàng trăm sản phẩm affiliate, hệ thống **không ép buộc upload ảnh lên R2**, mà cho phép dùng URL ảnh trực tiếp từ website gốc kèm cơ chế fallback (xem chi tiết tại Phần C & D).

### 3.2. Mã QR (`utilities.qr_code`) & VietQR
- **Cơ chế:** Module QR tạo mã QR URL, văn bản hoặc VietQR chuẩn NAPAS (sử dụng thư viện `napas-qr-python` và `segno`). Ảnh QR PNG được sinh tự động và lưu vào `Attachment`.
- **Tái sử dụng:**
  - Template **Donation Page** có thể cho phép:
    1. Chọn trực tiếp một mã QR VietQR đã có trong danh sách `QrCode` của user (qua `QrCodePicker`).
    2. Hoặc nhập trực tiếp thông tin ngân hàng + số tài khoản để tự động sinh QR on-the-fly.
  - Cơ chế liên kết: Khi chọn QR có sẵn, trang lưu snapshot `payload` và `image_url` hoặc tham chiếu `qr_code_id`. Nếu QR gốc bị xóa mềm, trang vẫn hiển thị được ảnh fallback hoặc thông tin chuyển khoản rõ ràng.

### 3.3. Link rút gọn (`utilities.short_link`)
- **Cơ chế:** Link `/s/{slug}` có đếm click (`clicks_count`), đếm visitor độc nhất (`visitors_count`), chống spam click debounce 3s và mã hóa mật khẩu/hạn dùng.
- **Tái sử dụng:**
  - Các nút liên kết hoặc sản phẩm trong Bio / Affiliate Page có thể tùy chọn gắn với một `ShortLink` có sẵn trong hệ thống nếu admin muốn đo lường chi tiết lượt click nội bộ.

### 3.4. Cache Redis (`Upstash Redis Free`)
- **Cơ chế:** Hệ thống sử dụng `CacheService` với namespace versioning (`utilities:public`).
- **Tái sử dụng:**
  - Cache trang công khai đã xuất bản trong 10 phút. Khi admin sửa/xóa/xuất bản trang, gọi `self.invalidate_public_cache()` để tăng version của namespace, hủy toàn bộ cache cũ mà không cần lặp qua từng key.
  - Đảm bảo lượt khách truy cập không đánh thức Neon PostgreSQL (giữ compute 0.25 CU luôn ngủ).
  - Sử dụng Redis để cache kết quả fetch metadata của các URL sản phẩm (TTL 7 ngày) để tránh gọi lại website nguồn nhiều lần.

### 3.5. Thành phần giao diện dùng chung (`frontend/src/shares/components/`)
Đã kiểm tra `docs/common-catalog.md` và source code:
- `DataTable`, `useTableState`, `TableBulkBar`, `TableRowActions`, `TableToolbar`: Dùng nguyên bản cho danh sách trang và danh sách sản phẩm trong admin.
- `FormPage`, `FormLayout`, `FormSection`, `FormActions`, `FormSubmitButton`: Khung chuẩn cho màn hình soạn thảo.
- `ColorInput`, `SlugInput`, `MoneyInput`, `NumberInput`, `SearchInput`, `SelectField`, `SwitchField`: Các input form chuẩn có sẵn, không cần viết lại.
- `EditModeProvider`, `useEditMode`: Cơ chế chuyển đổi giữa xem và sửa trang chi tiết.
- `ConfirmDialog`: Dùng khi xóa sản phẩm, xóa danh mục, hoặc reset cấu hình template.

---

## 4. Kết luận audit

1. **Không tạo module mới:** Không tạo app Django hay module Next.js riêng biệt dạng `cms`. Mở rộng trực tiếp trên `utilities.page`.
2. **Khả năng tương thích 100%:** Dữ liệu cũ với Tiptap JSON vẫn hoạt động bình thường nhờ cờ `page_type = 'LEGACY_PAGE'`.
3. **Mô hình mở rộng:** Bổ sung các JSONField có cấu trúc (`content_config`, `style_config`, `responsive_config`) giúp hệ thống cực kỳ linh hoạt, không cần migration liên tục khi thêm template mới, đồng thời giữ nguyên các ràng buộc an toàn của hạ tầng Vercel + Neon.
