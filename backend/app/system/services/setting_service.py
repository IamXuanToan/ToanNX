"""Service quản lý cấu hình hệ thống (Setting)."""

from typing import Any

from django.db import transaction

from app.core.services.core_crud_service import CoreCrudService
from app.system.constants.setting_cache import (
    PUBLIC_SETTING_CACHE_NAMESPACE,
    PUBLIC_SETTING_CACHE_TTL_SECONDS,
)
from app.system.constants.setting_key import SettingKey
from app.system.models.setting import Setting
from app.system.permissions.setting_permission import SettingPermission
from app.system.repositories.setting_repository import SettingRepository


class SettingService(CoreCrudService[Setting, SettingRepository]):
    """Service xử lý nghiệp vụ cấu hình hệ thống."""

    repository_class = SettingRepository
    manage_all_permission = SettingPermission.SETTING_UPDATE.code
    public_cache_namespace = PUBLIC_SETTING_CACHE_NAMESPACE

    def __init__(self, repository: SettingRepository | None = None) -> None:
        """Khởi tạo service với SettingRepository.

        Args:
            repository: Repository của Setting (nếu None sẽ tự khởi tạo).
        """
        super().__init__(repository or SettingRepository())

    def get_setting_value(self, key: str, default: Any = None) -> Any:
        """Lấy giá trị của một khóa cấu hình.

        Args:
            key: Khóa cấu hình (vd: auth_google_enabled).
            default: Giá trị mặc định.

        Returns:
            Giá trị JSON hoặc default.
        """
        return self.repository.get_value(key, default=default)

    @transaction.atomic
    def set_setting_value(
        self,
        key: str,
        value: Any,
        *,
        description: str = "",
        category: str = "general",
        is_public: bool = False,
        actor: Any = None,
    ) -> Setting:
        """Thiết lập giá trị cho một khóa cấu hình và làm mới cache công khai sau commit.

        Args:
            key: Khóa cấu hình.
            value: Giá trị mới.
            description: Mô tả.
            category: Nhóm cấu hình.
            is_public: Cờ công khai.
            actor: Người thực hiện cập nhật.

        Returns:
            Bản ghi Setting.
        """
        updated = self.repository.set_value(
            key=key,
            value=value,
            description=description,
            category=category,
            is_public=is_public,
            actor=actor,
        )
        self.invalidate_public_cache()
        return updated

    def is_social_login_enabled(self, provider: str) -> bool:
        """Kiểm tra phương thức đăng nhập mạng xã hội có đang được bật hay không.

        Args:
            provider: Tên provider ('google' hoặc 'github').

        Returns:
            True nếu đang cho phép, False nếu quản trị viên tạm khóa.
        """
        # Mặc định True nếu chưa có cấu hình trong DB
        val = self.get_setting_value(SettingKey.social_login(provider), default=True)
        return bool(val)

    def get_public_settings(self) -> dict[str, Any]:
        """Lấy danh sách các giá trị cấu hình được phép đọc công khai (Redis TTL 600s).

        Returns:
            Dictionary dạng {key: value}.
        """
        version = self.cache_service.namespace_version(PUBLIC_SETTING_CACHE_NAMESPACE)
        cache_key = None if version is None else f"{PUBLIC_SETTING_CACHE_NAMESPACE}:{version}:all"
        cached = self.cache_service.get_json(cache_key) if cache_key else None
        if isinstance(cached, dict):
            return cached

        records = self.repository.find_public_settings()
        result: dict[str, Any] = {}
        for record in records:
            result[record.key] = record.value
        # Đảm bảo các cờ auth luôn có giá trị boolean mặc định
        for key in (SettingKey.AUTH_GOOGLE_ENABLED, SettingKey.AUTH_GITHUB_ENABLED):
            result.setdefault(key.value, True)
        result.setdefault(
            SettingKey.SUPPORTED_LANGUAGES.value,
            [
                {"code": "vi", "name": "Tiếng Việt"},
                {"code": "en", "name": "English"},
            ],
        )
        if cache_key:
            self.cache_service.set_json(cache_key, result, PUBLIC_SETTING_CACHE_TTL_SECONDS)
        return result
