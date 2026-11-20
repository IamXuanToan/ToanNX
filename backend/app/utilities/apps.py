"""Cấu hình app Tiện ích."""

from app.core.registry.core_module_config import CoreModuleConfig


class UtilitiesConfig(CoreModuleConfig):
    """App Tiện ích (liên kết rút gọn, mã QR, trang tùy chỉnh) và đăng ký module."""

    default = True
    name = "app.utilities"
    label = "utilities"
    verbose_name = "Utilities"
