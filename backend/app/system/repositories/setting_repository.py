"""Repository truy vấn và quản lý cấu hình hệ thống (Setting)."""

from typing import Any

from app.core.repositories.core_repository import CoreRepository
from app.system.models.setting import Setting


class SettingRepository(CoreRepository[Setting]):
    """Repository thao tác dữ liệu Setting."""

    model = Setting

    def find_by_key(self, key: str) -> Setting | None:
        """Tìm cấu hình theo key định danh (chưa xóa mềm).

        Args:
            key: Khóa cấu hình (vd: auth_google_enabled).

        Returns:
            Setting hoặc None.
        """
        return self.get_queryset().filter(key=key).first()

    def get_value(self, key: str, default: Any = None) -> Any:
        """Lấy giá trị của một cấu hình.

        Args:
            key: Khóa cấu hình.
            default: Giá trị mặc định nếu cấu hình chưa tồn tại.

        Returns:
            Giá trị của cấu hình (JSON: boolean, string, number, dict, list) hoặc default.
        """
        setting = self.find_by_key(key)
        return setting.value if setting is not None else default

    def set_value(
        self,
        key: str,
        value: Any,
        description: str = "",
        category: str = "general",
        is_public: bool = False,
        actor: Any = None,
    ) -> Setting:
        """Cập nhật hoặc tạo mới một giá trị cấu hình.

        Args:
            key: Khóa cấu hình.
            value: Giá trị mới.
            description: Mô tả (nếu tạo mới).
            category: Nhóm cấu hình.
            is_public: Cờ công khai.
            actor: Người thực hiện cập nhật.

        Returns:
            Bản ghi Setting đã được lưu.
        """
        setting = self.find_by_key(key)
        if setting is not None:
            setting.value = value
            if description:
                setting.description = description
            if category:
                setting.category = category
            setting.is_public = is_public
            if actor is not None and hasattr(actor, "pk"):
                setting.updated_by = actor
            setting.save()
            return setting

        payload: dict[str, Any] = {
            "key": key,
            "value": value,
            "description": description,
            "category": category,
            "is_public": is_public,
        }
        if actor is not None and hasattr(actor, "pk"):
            payload["created_by"] = actor
            payload["updated_by"] = actor
        return self.model.objects.create(**payload)

    def find_public_settings(self) -> list[Setting]:
        """Lấy danh sách các cấu hình công khai (is_public=True).

        Returns:
            Danh sách bản ghi Setting.
        """
        return list(self.get_queryset().filter(is_public=True).order_by("key"))
