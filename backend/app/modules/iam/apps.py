"""Cấu hình app IAM."""

from typing import Any

from django.apps import AppConfig
from django.db.models.signals import post_migrate

from app.core.registry.core_module_config import CoreModuleConfig


def _sync_after_migrate(sender: AppConfig, **kwargs: Any) -> None:
    """Đồng bộ quyền và vai trò hệ thống sau khi migrate."""
    from app.modules.iam.services.iam_sync_service import IamSyncService  # noqa: PLC0415

    IamSyncService().sync()


class IamConfig(CoreModuleConfig):
    """App IAM: vai trò, quyền, gán vai trò cho tài khoản."""

    default = True
    name = "app.modules.iam"
    label = "iam"
    verbose_name = "IAM"

    def ready(self) -> None:
        """Đăng ký module (CoreModuleConfig) rồi gắn xử lý riêng của module."""
        super().ready()
        post_migrate.connect(_sync_after_migrate, sender=self)
