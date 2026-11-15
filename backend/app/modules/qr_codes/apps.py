"""Cấu hình app QR Codes."""

from app.core.registry.core_module_config import CoreModuleConfig


class QrCodesConfig(CoreModuleConfig):
    """App Mã QR và đăng ký module."""

    default = True
    name = "app.modules.qr_codes"
    label = "qr_codes"
    verbose_name = "QR Codes"
