"""Trang tùy chỉnh: `toannx.com/<path.segment>/<slug>`, nội dung là JSON Tiptap."""

from django.conf import settings
from django.db import models
from django.db.models.functions import Lower

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Page(JournalTracker, CoreModel):
    """Trang của owner; hỗ trợ cả trang Template hiện đại lẫn trang Tiptap cũ."""

    journal_excluded_fields = ("content", "content_config")

    class Status(models.TextChoices):
        """Trạng thái xuất bản."""

        DRAFT = "DRAFT", "Bản nháp"
        PUBLISHED = "PUBLISHED", "Công khai"
        UNPUBLISHED = "UNPUBLISHED", "Ngừng công khai"

    class PageType(models.TextChoices):
        """Loại trang template hoặc trang soạn thảo tự do."""

        AFFILIATE = "AFFILIATE", "Tiếp thị liên kết"
        BIO = "BIO", "Liên kết cá nhân (Bio)"
        DONATION = "DONATION", "Ủng hộ / Quyên góp"
        PRODUCT_CATALOG = "PRODUCT_CATALOG", "Danh mục sản phẩm số"
        PORTFOLIO = "PORTFOLIO", "Hồ sơ năng lực"
        LANDING = "LANDING", "Trang đích sự kiện"
        LEGACY_PAGE = "LEGACY_PAGE", "Trang bài viết tự do (Tiptap cũ)"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="custom_pages",
        verbose_name="Chủ sở hữu",
        help_text="Người dùng sở hữu trang.",
        db_comment="Chủ sở hữu trang",
    )
    path = models.ForeignKey(
        "utilities.PagePath",
        on_delete=models.PROTECT,
        related_name="pages",
        verbose_name="Đường dẫn giữa",
        help_text="Đoạn URL giữa (`qr`, `p`...).",
        db_comment="Đường dẫn giữa của trang",
    )
    title = models.CharField(
        max_length=150, verbose_name="Tiêu đề", help_text="Tiêu đề trang.", db_comment="Tiêu đề trang"
    )
    slug = models.CharField(
        max_length=64,
        verbose_name="Slug",
        help_text="Đoạn cuối của URL công khai, unique trong cùng đường dẫn giữa.",
        db_comment="Slug URL trang",
    )
    description = models.TextField(
        blank=True, max_length=1000, verbose_name="Mô tả", help_text="Mô tả trang.", db_comment="Mô tả trang"
    )
    status = models.CharField(
        max_length=11,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="Trạng thái",
        help_text="Chỉ PUBLISHED mới công khai.",
        db_comment="Trạng thái trang",
    )
    content = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Nội dung",
        help_text="Tài liệu Tiptap đã validate (chỉ node/mark trong danh sách cho phép).",
        db_comment="Nội dung Tiptap JSON",
    )
    content_version = models.PositiveIntegerField(
        default=1,
        verbose_name="Phiên bản nội dung",
        help_text="Tăng mỗi lần lưu nội dung; PATCH phải gửi đúng để không ghi đè lẫn nhau.",
        db_comment="Phiên bản nội dung",
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Công khai lúc",
        help_text="Lần gần nhất chuyển sang PUBLISHED.",
        db_comment="Thời điểm công khai",
    )
    seo_title = models.CharField(
        max_length=160,
        blank=True,
        verbose_name="SEO title",
        help_text="Tiêu đề SEO, rỗng dùng title.",
        db_comment="Tiêu đề SEO",
    )
    seo_description = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="SEO description",
        help_text="Mô tả SEO.",
        db_comment="Mô tả SEO",
    )
    theme = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Giao diện",
        help_text="Theme có cấu trúc, không chứa CSS/JS tùy ý.",
        db_comment="Cấu hình theme",
    )
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
    avatar = models.ForeignKey(
        "system.Attachment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Ảnh đại diện",
        help_text="Attachment ảnh đại diện.",
        db_comment="Ảnh đại diện trang",
    )
    cover = models.ForeignKey(
        "system.Attachment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Ảnh bìa",
        help_text="Attachment ảnh bìa.",
        db_comment="Ảnh bìa trang",
    )

    class Meta:
        db_table = "utilities_page"
        verbose_name = "Trang tùy chỉnh"
        verbose_name_plural = "Trang tùy chỉnh"
        constraints = [
            # Không điều kiện: slug đã xóa không dùng lại trong cùng đường dẫn giữa.
            models.UniqueConstraint("path", Lower("slug"), name="utilities_page_path_slug_ci_unique"),
            models.CheckConstraint(
                condition=models.Q(status__in=["DRAFT", "PUBLISHED", "UNPUBLISHED"]),
                name="utilities_page_status_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    page_type__in=[
                        "AFFILIATE",
                        "BIO",
                        "DONATION",
                        "PRODUCT_CATALOG",
                        "PORTFOLIO",
                        "LANDING",
                        "LEGACY_PAGE",
                    ]
                ),
                name="utilities_page_type_valid",
            ),
        ]
        indexes = [
            models.Index(
                fields=["owner", "-created_at"],
                condition=models.Q(deleted_at__isnull=True),
                name="page_owner_created_alive_idx",
            )
        ]

    def __str__(self) -> str:
        """Tiêu đề trang."""
        return self.title
