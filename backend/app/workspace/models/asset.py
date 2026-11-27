"""Model Thiết bị cá nhân, thông tin nơi mua & hạn bảo hành."""

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.db.models import Q

from app.core.models.core_model import CoreModel
from app.core.tracking.journal_tracker import JournalTracker


class Asset(JournalTracker, CoreModel):
    """Tài sản/thiết bị cá nhân kèm nơi mua lịch sử và theo dõi hạn bảo hành."""

    journal_fields = (
        "name",
        "brand",
        "model_code",
        "category",
        "serial_number",
        "imei",
        "status",
        "purchase_date",
        "purchase_price_vnd",
        "purchase_store",
        "warranty_type",
        "warranty_end_date",
    )

    class Category(models.TextChoices):
        """Phân loại thiết bị."""

        LAPTOP = "LAPTOP", "Laptop"
        PHONE = "PHONE", "Điện thoại"
        TABLET = "TABLET", "Máy tính bảng"
        MONITOR = "MONITOR", "Màn hình"
        PERIPHERAL = "PERIPHERAL", "Phụ kiện"
        AUDIO = "AUDIO", "Âm thanh"
        NETWORK = "NETWORK", "Thiết bị mạng"
        CAMERA = "CAMERA", "Máy ảnh"
        OTHER = "OTHER", "Khác"

    class Status(models.TextChoices):
        """Trạng thái sử dụng thiết bị."""

        IN_USE = "IN_USE", "Đang dùng"
        BACKUP = "BACKUP", "Dự phòng"
        IN_WARRANTY = "IN_WARRANTY", "Đang bảo hành"
        IN_REPAIR = "IN_REPAIR", "Đang sửa chữa"
        SOLD = "SOLD", "Đã bán"
        BROKEN = "BROKEN", "Đã hỏng"

    class PurchaseChannel(models.TextChoices):
        """Kênh mua hàng."""

        OFFICIAL_STORE = "OFFICIAL_STORE", "Hãng chính thức"
        RETAILER = "RETAILER", "Đại lý / Cửa hàng"
        ECOMMERCE = "ECOMMERCE", "Sàn TMĐT"
        SECOND_HAND = "SECOND_HAND", "Mua lại / Cũ"
        COMPANY = "COMPANY", "Công ty cấp"
        GIFT = "GIFT", "Được tặng"

    class WarrantyType(models.TextChoices):
        """Loại hình bảo hành."""

        MANUFACTURER = "MANUFACTURER", "Bảo hành hãng"
        STORE = "STORE", "Bảo hành cửa hàng"
        EXTENDED = "EXTENDED", "Bảo hành mở rộng"
        NONE = "NONE", "Không bảo hành"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_assets",
        verbose_name="Chủ sở hữu",
        help_text="Người sở hữu thiết bị.",
        db_comment="Chủ sở hữu thiết bị",
    )
    name = models.CharField(
        max_length=200,
        verbose_name="Tên thiết bị",
        help_text="Tên nhận diện thiết bị.",
        db_comment="Tên thiết bị",
    )
    brand = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Hãng sản xuất",
        help_text="Thương hiệu của thiết bị.",
        db_comment="Hãng sản xuất",
    )
    model_code = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Mã model",
        help_text="Mã hiệu sản phẩm (SKU/Part Number).",
        db_comment="Mã model",
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
        verbose_name="Loại thiết bị",
        help_text="Nhóm thiết bị.",
        db_comment="Loại thiết bị",
    )
    serial_number = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Số Serial",
        help_text="Mã số sê-ri trên máy hoặc hộp.",
        db_comment="Số Serial",
    )
    imei = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Số IMEI",
        help_text="Mã IMEI (nếu có).",
        db_comment="Số IMEI",
    )
    specs = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Thông số kỹ thuật",
        help_text="Cặp khóa-giá trị cấu hình phần cứng.",
        db_comment="Thông số kỹ thuật JSON",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_USE,
        verbose_name="Trạng thái",
        help_text="Tình trạng sử dụng hiện tại.",
        db_comment="Trạng thái thiết bị",
    )
    purchase_date = models.DateField(
        verbose_name="Ngày mua",
        help_text="Ngày mua thiết bị.",
        db_comment="Ngày mua",
    )
    purchase_price = models.DecimalField(
        max_digits=18,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name="Giá mua gốc",
        help_text="Số tiền thanh toán theo tiền tệ gốc.",
        db_comment="Giá mua theo nguyên tệ",
    )
    currency = models.ForeignKey(
        "system.Currency",
        on_delete=models.PROTECT,
        related_name="workspace_assets",
        verbose_name="Tiền tệ",
        help_text="Đơn vị tiền tệ lúc mua.",
        db_comment="Tiền tệ mua",
    )
    exchange_rate = models.DecimalField(
        max_digits=18,
        decimal_places=6,
        default=Decimal("1"),
        verbose_name="Tỷ giá quy đổi",
        help_text="Tỷ giá sang VNĐ tại ngày mua.",
        db_comment="Tỷ giá sang VNĐ",
    )
    purchase_price_vnd = models.DecimalField(
        max_digits=18,
        decimal_places=0,
        default=Decimal("0"),
        verbose_name="Giá mua VNĐ",
        help_text="Giá trị quy đổi VNĐ.",
        db_comment="Giá mua quy đổi VNĐ",
    )
    purchase_store = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Nơi mua",
        help_text="Tên cửa hàng, đại lý hoặc sàn TMĐT.",
        db_comment="Tên nơi mua",
    )
    purchase_channel = models.CharField(
        max_length=24,
        choices=PurchaseChannel.choices,
        default=PurchaseChannel.RETAILER,
        verbose_name="Kênh mua",
        help_text="Hình thức nơi bán.",
        db_comment="Kênh mua hàng",
    )
    purchase_branch_address = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Địa chỉ chi nhánh mua",
        help_text="Địa chỉ cửa hàng lúc mua.",
        db_comment="Địa chỉ chi nhánh mua",
    )
    purchase_order_code = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Mã đơn hàng / Số hóa đơn",
        help_text="Mã đơn hoặc số chứng từ bán hàng.",
        db_comment="Mã đơn hàng",
    )
    purchase_order_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Link đơn hàng",
        help_text="Đường dẫn tới chi tiết đơn hàng trực tuyến.",
        db_comment="URL đơn hàng",
    )
    store_warranty_contact = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Liên hệ bảo hành nơi bán",
        help_text="Số điện thoại/email hỗ trợ của nơi bán.",
        db_comment="Liên hệ nơi bán",
    )
    warranty_type = models.CharField(
        max_length=20,
        choices=WarrantyType.choices,
        default=WarrantyType.MANUFACTURER,
        verbose_name="Loại bảo hành",
        help_text="Phạm vi bảo hành áp dụng.",
        db_comment="Loại bảo hành",
    )
    warranty_months = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Số tháng bảo hành",
        help_text="Thời hạn bảo hành tính theo tháng.",
        db_comment="Số tháng bảo hành",
    )
    warranty_start_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Ngày bắt đầu BH",
        help_text="Ngày tính bảo hành (mặc định bằng ngày mua).",
        db_comment="Ngày bắt đầu bảo hành",
    )
    warranty_end_date = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        verbose_name="Ngày hết hạn BH",
        help_text="Ngày kết thúc bảo hành.",
        db_comment="Ngày hết hạn bảo hành",
    )
    warranty_provider = models.CharField(
        max_length=150,
        blank=True,
        default="",
        verbose_name="Đơn vị bảo hành",
        help_text="Hãng hoặc trung tâm bảo hành ủy quyền.",
        db_comment="Đơn vị bảo hành",
    )
    warranty_note = models.TextField(
        blank=True,
        default="",
        verbose_name="Ghi chú bảo hành",
        help_text="Điều kiện hoặc phạm vi bảo hành đặc biệt.",
        db_comment="Ghi chú bảo hành",
    )
    invoice_attachments = models.ManyToManyField(
        "system.Attachment",
        blank=True,
        related_name="workspace_assets",
        verbose_name="Hóa đơn / Chứng từ",
        help_text="Danh sách tệp hóa đơn riêng tư của thiết bị.",
    )
    notes = models.TextField(
        blank=True,
        default="",
        verbose_name="Ghi chú",
        help_text="Ghi chú bổ sung về thiết bị.",
        db_comment="Ghi chú chung",
    )

    class Meta:
        db_table = "workspace_asset"
        indexes = (
            models.Index(
                fields=("owner", "warranty_end_date"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_asset_owner_warranty",
            ),
            models.Index(
                fields=("owner", "status"),
                condition=Q(deleted_at__isnull=True),
                name="idx_ws_asset_owner_status",
            ),
        )
        verbose_name = "Thiết bị"
        verbose_name_plural = "Thiết bị"

    def __str__(self) -> str:
        """Tên thiết bị."""
        return self.name
