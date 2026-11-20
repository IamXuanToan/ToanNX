"""Đăng ký module Tiện ích."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.utilities.permissions.page_path_permission import PagePathPermission
from app.utilities.permissions.page_permission import PagePermission
from app.utilities.permissions.qr_code_permission import QrCodePermission
from app.utilities.permissions.short_link_permission import ShortLinkPermission

MODULE = ModuleDescriptor(
    code="utilities",
    name="Utilities",
    description=(
        "Tiện ích: liên kết rút gọn `/s/{slug}`, mã QR (VietQR, liên kết, văn bản) lưu ảnh vào "
        "Thư viện và trang tùy chỉnh `/<đường dẫn giữa>/<slug>` soạn bằng Tiptap (JSON)."
    ),
    version="1.0.0",
    dependencies=("account", "iam", "attachment"),
    permissions=(
        *ShortLinkPermission.all(),
        *QrCodePermission.all(),
        *PagePermission.all(),
        *PagePathPermission.all(),
    ),
)
