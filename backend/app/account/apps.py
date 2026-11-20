"""Cấu hình app Account."""

from app.core.registry.core_module_config import CoreModuleConfig


class AccountConfig(CoreModuleConfig):
    """App Account: tài khoản người dùng (danh tính, hồ sơ, mật khẩu).

    Không chứa phân quyền: vai trò/quyền thuộc module IAM (IAM phụ thuộc Account, không có chiều ngược lại).
    """

    default = True
    name = "app.account"
    label = "account"
    verbose_name = "Account"
