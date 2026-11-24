# Kế hoạch Triển khai Hệ thống Template (Template Implementation Plan)

> **Mục tiêu:** Xây dựng lộ trình thực hiện từng bước (Phased Implementation), đảm bảo an toàn tuyệt đối cho hệ thống đang chạy, không làm hỏng dữ liệu cũ, tuân thủ nghiêm ngặt quy trình kiểm thử và nguyên tắc của dự án ToanNX.

---

## 1. Các Giai đoạn Thực hiện (Implementation Phases)

```
┌────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 0: AUDIT, NGHIÊN CỨU & PHÊ DUYỆT THIẾT KẾ (Hiện tại)         │
│ - Hoàn thành 12 tài liệu thiết kế và file HTML wireframe tương tác.    │
│ - Chờ Admin phê duyệt các quyết định kiến trúc cốt lõi.               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 1: BACKEND DATA MODEL & SERIALIZERS (Nền móng dữ liệu)       │
│ - Viết migration mở rộng `utilities_page`: `page_type`, `template_key`,│
│   `content_config`, `style_config`, `responsive_config`.              │
│ - Cập nhật `PageCreateValidateSerializer`, `PageUpdateValidate-        │
│   Serializer`, `PageDetailResponseSerializer`, `PagePublicSerializer`. │
│ - Viết bộ validator dữ liệu cho từng template trong service.           │
│ - Viết trọn vẹn test backend cho model & serializer mới.               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 2: METADATA EXTRACTION & BẢO MẬT SSRF (Backend Service)      │
│ - Xây dựng `SafeHttpClient` với 7 lớp phòng thủ chống SSRF.            │
│ - Xây dựng `LinkMetadataService` trích xuất OpenGraph & JSON-LD.       │
│ - Thêm endpoint `POST /api/v1/utilities/pages/fetch-metadata`.         │
│ - Caching metadata trên Redis (TTL 7 ngày).                            │
│ - Viết bộ test chuyên sâu cho SSRF filter và các trường hợp URL lỗi.   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 3: FRONTEND PUBLIC RENDERERS & TEMPLATE ENGINE               │
│ - Xây dựng Template Dispatcher trên Next.js Server Component.          │
│ - Xây dựng 6 Affiliate Renderers: Product Grid, Product List, v.v.     │
│ - Xây dựng Bio Renderer & Donation Renderer.                           │
│ - Tích hợp tìm kiếm không dấu phía client và bộ lọc danh mục.          │
│ - Bảo toàn `LegacyTiptapPageRenderer` cho các trang cũ.                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 4: FRONTEND ADMIN UI & LIVE PREVIEW WORKSPACE                │
│ - Xây dựng giao diện Form chia tab: Nội dung, Giao diện, Bố cục, SEO.  │
│ - Xây dựng Modal Quick Add URL (dán link -> quét metadata -> xem trước)│
│ - Tích hợp Live Preview phản hồi tức thì với bộ chuyển đổi thiết bị    │
│   (Desktop 1200px / Tablet 768px / Mobile 375px).                     │
│ - Bảng quản lý danh mục và danh sách sản phẩm (kéo thả sắp xếp).       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 5: CHUẨN HOÁ, KIỂM THỬ E2E & TÀI LIỆU HOÀN THIỆN            │
│ - Chạy `pnpm api:types` cập nhật `api-schema.gen.ts`.                  │
│ - Viết test E2E Playwright cho toàn bộ luồng tạo, xem trước, xuất bản. │
│ - Cập nhật `docs/modules/utilities/README.md`.                         │
│ - Kiểm tra toàn diện trên môi trường local trước khi bàn giao.         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Danh sách Các Quyết định Cần Quản trị viên Phê duyệt (Approval Checklist)

Trước khi bắt đầu viết code nghiệp vụ, kính gửi quản trị viên xem xét và chốt các quyết định sau:

1. **Về Mô hình Dữ liệu:**
   - [x] **Đề xuất:** Lưu trữ danh mục và sản phẩm của trang bên trong trường `content_config: JSONField` của model `Page` thay vì tách bảng DB riêng.
   - *Lý do:* Tối ưu tuyệt đối cho Vercel + Neon 1GB, truy vấn 1 query duy nhất cho trang công khai, atomic save, và không sinh N+1 query.

2. **Về Khai báo Template:**
   - [x] **Đề xuất:** Khai báo System Template trong Code (React Components & TypeScript Registry) thay vì lưu cấu trúc layout trong Database.
   - *Lý do:* Nâng cấp giao diện đồng loạt không cần migration, an toàn bảo mật, zero runtime overhead.

3. **Về Trích xuất Metadata URL:**
   - [x] **Đề xuất:** Backend thực hiện on-demand bằng Python (`requests` an toàn + SSRF filter) khi Admin bấm "Lấy thông tin" trong trang quản trị.
   - *Lý do:* Tránh tốn quota CPU của Vercel Serverless Function và bảo vệ hệ thống tuyệt đối trước tấn công quét mạng nội bộ.

4. **Về Hình ảnh Sản phẩm:**
   - [x] **Đề xuất:** Sử dụng trực tiếp link ảnh ngoài (External Image URL) với cờ `unoptimized={true}` của Next.js và ảnh fallback khi lỗi; chỉ upload lên R2 khi admin chủ động chọn ảnh từ máy tính.
   - *Lý do:* Tiết kiệm 100% hạn mức 10GB lưu trữ R2 và 1.000 ảnh tối ưu hóa miễn phí của Vercel Hobby.

5. **Về Giá Sản phẩm:**
   - [x] **Đề xuất:** Mặc định sử dụng chế độ `"view_at_store"` (Xem giá tại sàn) hoặc "Giá tham khảo" do admin tự nhập.
   - *Lý do:* Tránh hiển thị thông tin giá lỗi thời khi các sàn TMĐT đổi giá Flash Sale liên tục.

6. **Về Tìm kiếm & Phân loại:**
   - [x] **Đề xuất:** Tìm kiếm tức thì tại Client-Side với thuật toán chuẩn hóa tiếng Việt không dấu (NFD Unicode).
   - *Lý do:* Phản hồi 0ms, không tốn bất kỳ request nào về Neon DB.
