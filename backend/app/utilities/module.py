"""Đăng ký module Tiện ích."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.webhook_definition import WebhookDefinition
from app.utilities.permissions.donation_permission import DonationPermission
from app.utilities.permissions.page_path_permission import PagePathPermission
from app.utilities.permissions.page_permission import PagePermission
from app.utilities.permissions.qr_code_permission import QrCodePermission
from app.utilities.permissions.short_link_permission import ShortLinkPermission

MODULE = ModuleDescriptor(
    code="utilities",
    name="Utilities",
    description=(
        "Tiện ích: liên kết rút gọn `/s/{slug}`, mã QR (VietQR, liên kết, văn bản) lưu ảnh vào "
        "Thư viện, trang tùy chỉnh `/<đường dẫn giữa>/<slug>` và quyên góp tri ân qua SePay."
    ),
    version="1.0.0",
    dependencies=("system",),
    member_permissions=(
        *ShortLinkPermission.member(),
        *QrCodePermission.member(),
        *PagePermission.member(),
        *PagePathPermission.member(),
        *DonationPermission.member(),
    ),
    permissions=(
        *ShortLinkPermission.all(),
        *QrCodePermission.all(),
        *PagePermission.all(),
        *PagePathPermission.all(),
        *DonationPermission.all(),
    ),
    webhooks=(
        WebhookDefinition(
            code="utilities.donation",
            name="Biến động số dư SePay theo mã QR Donate",
            provider="SePay",
            path="/utilities/donations/webhook/{webhook_token}",
            description=(
                "SePay gọi khi mã QR trên trang Donate nhận được tiền ủng hộ. "
                "Hệ thống tự động phân loại quà tặng, kiểm duyệt từ ngữ xấu bằng Regex và hiển thị tri ân."
            ),
            auth="Token bí mật trong URL: {webhook_token}",
            setup=(
                "Trong cài đặt phương thức QR của trang Donate: Bật nhận Webhook SePay và sao chép Webhook URL.",
                "my.sepay.vn → Webhooks → Thêm webhook, dán URL; sự kiện: Chỉ tiền vào.",
            ),
        ),
    ),
)
