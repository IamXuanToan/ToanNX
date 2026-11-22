"""Cấu hình app Tài chính."""

from app.core.registry.core_module_config import CoreModuleConfig


class FinanceConfig(CoreModuleConfig):
    """App Tài chính cá nhân (giao dịch ngân hàng qua SePay, thu nhập, thuế, chứng từ) và đăng ký module."""

    default = True
    name = "app.finance"
    label = "finance"
    verbose_name = "Finance"
