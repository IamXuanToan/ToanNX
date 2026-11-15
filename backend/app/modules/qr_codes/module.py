"""Đăng ký module QR Codes."""

from app.core.registry.module_descriptor import ModuleDescriptor
from app.modules.qr_codes.permissions.qr_codes_permission import QrCodesPermission

MODULE = ModuleDescriptor(
    code="qr_codes",
    name="QR Codes",
    description="Tạo mã QR (chuyển khoản VietQR, liên kết, văn bản); ảnh lưu vào Thư viện.",
    version="1.0.0",
    dependencies=("account", "iam", "attachment"),
    permissions=QrCodesPermission.all(),
)
