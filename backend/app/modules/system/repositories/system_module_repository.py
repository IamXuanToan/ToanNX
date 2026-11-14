"""Repository cấu hình module: bật/tắt, icon (đọc + ghi)."""

from typing import Any

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.modules.system.models.system_module import SystemModule


class SystemModuleRepository(CoreRepository[SystemModule]):
    """Truy cập dữ liệu SystemModule."""

    model = SystemModule

    def get_queryset(self) -> QuerySet[SystemModule]:
        """Cấu hình module kèm file icon (tránh N+1).

        Returns:
            QuerySet.
        """
        return super().get_queryset().select_related("icon_attachment")

    def get_settings(self) -> dict[str, SystemModule]:
        """Map mã module → bản ghi cấu hình cho các module đã có cấu hình.

        Returns:
            Dict cấu hình.
        """
        return {row.code: row for row in self.get_queryset()}

    def get_flag(self, code: str) -> bool | None:
        """Cờ của một module.

        Args:
            code: Mã module.

        Returns:
            True/False, hoặc None nếu chưa có cấu hình.
        """
        row = self.find_one(code=code)
        return None if row is None else row.enabled

    def upsert(self, code: str, *, actor: Any | None = None, **fields: Any) -> SystemModule:
        """Tạo hoặc cập nhật cấu hình của module (khóa dòng nếu đã có).

        Args:
            code: Mã module.
            actor: Người thực hiện.
            **fields: Field cần ghi (`enabled`, `icon`, `icon_attachment`).

        Returns:
            Bản ghi cấu hình.
        """
        row = SystemModule.objects.select_for_update().filter(code=code).first()
        if row is None:
            return self.create(actor=actor, code=code, **fields)
        return self.update(row, actor=actor, **fields)
