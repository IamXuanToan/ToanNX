"""Cấu hình app Attachment."""

from app.core.registry.core_module_config import CoreModuleConfig


class AttachmentConfig(CoreModuleConfig):
    """App Attachment: lưu trữ file dùng chung."""

    default = True
    name = "app.attachment"
    label = "attachment"
    verbose_name = "Attachment"
