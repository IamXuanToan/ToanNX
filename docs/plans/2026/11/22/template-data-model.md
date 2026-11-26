# Mô hình Dữ liệu Hệ thống Template (Template Data Model)

> **Mục tiêu:** Phân tích kiến trúc cơ sở dữ liệu, so sánh chuyên sâu giữa phương án lưu trữ JSONField và Relational Models (bảng quan hệ riêng), thiết kế mở rộng cho model `Page` hiện tại và bảo đảm 100% tính tương thích ngược (Backward Compatibility).

---

## 1. Mở rộng Model `Page` Hiện Tại

Để tránh việc tạo thêm bảng CMS cồng kềnh và phân mảnh hệ thống, model `Page` trong `backend/app/utilities/models/page.py` được mở rộng thêm các trường có cấu trúc:

```python
class Page(JournalTracker, CoreModel):
    """Trang của owner; hỗ trợ cả trang Template hiện đại lẫn trang Tiptap cũ."""

    class PageType(models.TextChoices):
        AFFILIATE = "AFFILIATE", "Tiếp thị liên kết"
        BIO = "BIO", "Liên kết cá nhân (Bio)"
        DONATION = "DONATION", "Ủng hộ / Quyên góp"
        PRODUCT_CATALOG = "PRODUCT_CATALOG", "Danh mục sản phẩm số"
        PORTFOLIO = "PORTFOLIO", "Hồ sơ năng lực"
        LANDING = "LANDING", "Trang đích sự kiện"
        LEGACY_PAGE = "LEGACY_PAGE", "Trang bài viết tự do (Tiptap cũ)"

    # Các trường hiện có giữ nguyên 100%:
    # owner, path, title, slug, description, status, published_at,
    # seo_title, seo_description, avatar, cover, content, content_version, theme

    # CÁC TRƯỜNG MỞ RỘNG MỚI:
    page_type = models.CharField(
        max_length=32,
        choices=PageType.choices,
        default=PageType.LEGACY_PAGE,
        verbose_name="Loại trang",
        help_text="Xác định nhóm nghiệp vụ và template tương ứng.",
        db_comment="Loại trang template",
    )
    template_key = models.CharField(
        max_length=64,
        default="blank",
        verbose_name="Mã template",
        help_text="Key của System Template được chọn.",
        db_comment="Mã template hệ thống",
    )
    template_version = models.PositiveIntegerField(
        default=1,
        verbose_name="Phiên bản template",
        help_text="Dùng để tự động migrate config khi template nâng cấp.",
        db_comment="Phiên bản cấu hình template",
    )
    content_config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Cấu hình nội dung",
        help_text="Dữ liệu danh mục, sản phẩm, liên kết theo schema của template.",
        db_comment="Dữ liệu nội dung theo template",
    )
    style_config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Cấu hình giao diện",
        help_text="Màu sắc, typography, kiểu thẻ, nút bấm, bo góc.",
        db_comment="Cấu hình giao diện và phong cách",
    )
    responsive_config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Cấu hình responsive",
        help_text="Số cột, khoảng cách, ẩn/hiện trên desktop/tablet/mobile.",
        db_comment="Cấu hình bố cục theo thiết bị",
    )
```

---

## 2. So sánh Toàn diện: JSONField vs Relational Models

Đây là câu hỏi cốt lõi: **Có nên tách các sản phẩm Affiliate và Danh mục ra các bảng DB riêng biệt (`PageCategory`, `PageItem`) hay lưu trong `content_config` (JSONField)?**

| Tiêu chí phân tích | Phương án A: JSONField trong `Page` (ĐƯỢC CHỌN) | Phương án B: Relational Models (`PageCategory`, `PageItem`) |
| :--- | :--- | :--- |
| **Bảo vệ tài nguyên Neon DB (Gói 1GB, 100 CU)** | **Cực tốt**: Đọc 1 dòng duy nhất là có đủ toàn bộ trang. Neon không tốn thêm CU để JOIN nhiều bảng. | **Kém**: Mỗi lượt render phải JOIN 3 bảng (`Page` + `PageCategory` + `PageItem`), tốn nhiều CPU database hơn. |
| **Truy vấn SSR công khai** | **1 query duy nhất** (`PageRepository.find_by_url`). Tương thích hoàn hảo với kiểm thử `test_list_query_count.py`. | Cần `prefetch_related` phức tạp để tránh lỗi N+1 query. |
| **Tính nguyên tử khi Lưu (Atomic Save)** | **Tuyệt đối**: Lưu toàn bộ trang trong 1 câu UPDATE. Không bao giờ xảy ra lỗi dữ liệu mồ côi (orphaned items) hay lưu dở dang. | Phải chạy transaction phức tạp (xóa item cũ, thêm item mới, cập nhật danh mục, đánh lại index). |
| **Nhân bản trang (Duplicate)** | **Cực nhanh**: Chỉ cần clone 1 bản ghi `Page`. | Phải clone đệ quy bảng cha và hàng trăm bản ghi bảng con. |
| **Lịch sử thay đổi (`JournalTracker`)** | Theo dõi trọn vẹn toàn bộ snapshot thay đổi của trang trong 1 bản ghi Journal duy nhất. | Sinh ra hàng chục bản ghi Journal rác mỗi lần admin kéo thả đổi vị trí sản phẩm. |
| **Tốc độ Cache Redis** | Serialize và deserialize JSON trực tiếp, không cần qua ORM. | Phải serialize qua ModelSerializer cồng kềnh. |
| **Quy mô dữ liệu phù hợp** | Tối ưu tuyệt hảo cho các trang từ **5 đến 300 sản phẩm** (Kích thước JSON chỉ từ 20KB đến 100KB — hoàn toàn nằm trong mức cho phép của PostgreSQL JSONB). | Phù hợp nếu một trang có trên **10.000 sản phẩm** (sàn TMĐT lớn). Nhưng hệ thống này chỉ là trang giới thiệu của cá nhân. |
| **Tìm kiếm & Phân loại** | Thực hiện tức thì tại **Client-Side (JavaScript)** với độ trễ 0ms, không tốn tài nguyên server. | Tìm kiếm bằng câu query SQL `ILIKE`, mỗi thao tác gõ phím đánh thức Neon. |

### Kết luận phân tích:
Đối với mô hình Creator Storefront & Link-in-Bio, **Phương án A (JSONField có cấu trúc)** vượt trội hoàn toàn về hiệu năng, chi phí vận hành, tính ổn định và tính toàn vẹn dữ liệu.

---

## 3. Cấu trúc Chuẩn hóa bên trong `content_config`

Dù lưu trong JSONField, dữ liệu vẫn được chuẩn hóa theo mô hình Document-Store chặt chẽ:

```json
{
  "categories": [
    {
      "id": "c1f7a28e-0001-482d-8422-bc571b693240",
      "name": "Bàn phím cơ & Switch",
      "slug": "ban-phim-co",
      "sort_order": 1,
      "is_visible": true
    },
    {
      "id": "c1f7a28e-0002-482d-8422-bc571b693240",
      "name": "Thiết bị quay podcast",
      "slug": "thiet-bi-quay",
      "sort_order": 2,
      "is_visible": true
    }
  ],
  "items": [
    {
      "id": "e2a1b3c4-0001-4123-89ab-123456789abc",
      "category_id": "c1f7a28e-0001-482d-8422-bc571b693240",
      "display_mode": "product",
      "title": "Bàn phím cơ Rain75",
      "raw_title": "Bàn phím cơ Rain75 nhôm CNC Anode 3 mode...",
      "description": "Bàn phím nhôm âm hay nhất tầm giá 2 triệu.",
      "destination_url": "https://s.shopee.vn/abcdef?af_sub=toannx",
      "platform": "shopee",
      "image_url": "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-xyz",
      "price_config": {
        "mode": "fixed",
        "amount": 2150000,
        "original_amount": 2400000,
        "currency": "VND",
        "price_note": "Giá tham khảo"
      },
      "badge": { "text": "Khuyên dùng", "tone": "hot" },
      "is_featured": true,
      "sort_order": 1,
      "is_visible": true
    }
  ]
}
```

---

## 4. Model `PagePreset` (Bộ mẫu cá nhân hoá — Tùy chọn mở rộng)

Nhằm đáp ứng yêu cầu cho phép admin lưu lại cấu hình giao diện ưa thích để áp dụng nhanh cho các trang khác:

```python
class PagePreset(JournalTracker, CoreModel):
    """Preset giao diện do user lưu lại để tái sử dụng."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="custom_page_presets",
        verbose_name="Chủ sở hữu",
    )
    name = models.CharField(max_length=100, verbose_name="Tên preset")
    page_type = models.CharField(max_length=32, choices=Page.PageType.choices)
    template_key = models.CharField(max_length=64)
    style_config = models.JSONField(default=dict)
    responsive_config = models.JSONField(default=dict)
    include_sample_content = models.BooleanField(default=False)
    sample_content = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "utilities_page_preset"
        verbose_name = "Mẫu giao diện trang"
        ordering = ("-created_at",)
```
- Khi xóa một `PagePreset`, các trang đã tạo từ preset đó **hoàn toàn không bị ảnh hưởng**, vì trang đã sao chép độc lập toàn bộ config vào bản ghi `Page`.

---

## 5. Chiến lược Caching Metadata: Redis vs Database Table

- **Quyết định:** Sử dụng **Upstash Redis** với namespace `utilities:metadata:{url_hash}` và TTL = 7 ngày.
- **Lý do:**
  1. Metadata URL là dữ liệu tạm thời, có thể lấy lại bất kỳ lúc nào. Không cần lưu vĩnh viễn trong PostgreSQL làm phình dung lượng 1GB của Neon.
  2. Redis cho phép tự động giải phóng bộ nhớ khi hết hạn mà không cần viết cron dọn dẹp DB.

---

## 6. Bảo đảm Tương thích Ngược 100% (Backward Compatibility)

1. **Với các trang cũ đang chạy:**
   - Dữ liệu cũ trong DB tự động nhận `page_type = 'LEGACY_PAGE'` thông qua giá trị mặc định của migration.
   - Trường `content` (Tiptap JSON) tiếp tục được giữ nguyên vẹn.
   - Frontend kiểm tra: nếu `page.pageType === 'LEGACY_PAGE'` -> Sử dụng `LegacyTiptapPageRenderer` (chính là component `PublicPage` hiện tại) để hiển thị.
2. **Không làm hỏng URL:** Toàn bộ cơ chế định tuyến `toannx.com/<segment>/<slug>`, slug uniqueness và SEO meta tags tiếp tục hoạt động ổn định 100%.
