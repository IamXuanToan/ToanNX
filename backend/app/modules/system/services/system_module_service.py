"""Quản lý cấu hình module: bật/tắt (installed ≠ enabled ≠ quyền người dùng) và icon."""

from typing import Any

from django.db import transaction

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.registry.module_descriptor import ModuleDescriptor
from app.core.registry.module_registry import ModuleRegistry, module_registry
from app.core.utils.absolute_url import build_absolute_url
from app.modules.attachment.services.attachment_service import AttachmentService
from app.modules.system.models.system_module import SystemModule
from app.modules.system.repositories.system_module_repository import SystemModuleRepository
from app.modules.system.types.module_state import ModuleState


class SystemModuleService:
    """Đọc và thay đổi trạng thái module."""

    def __init__(
        self,
        registry: ModuleRegistry | None = None,
        repository: SystemModuleRepository | None = None,
        attachment_service: AttachmentService | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            registry: Module registry (test có thể truyền registry riêng).
            repository: Repository cấu hình module.
            attachment_service: Service attachment (kiểm tra icon SVG).
        """
        self.registry = registry or module_registry
        self.repository = repository or SystemModuleRepository()
        self.attachment_service = attachment_service or AttachmentService()

    def list_modules(self) -> list[ModuleState]:
        """Tất cả module đã cài kèm cấu hình (chưa có cấu hình = bật, icon mặc định).

        Returns:
            Danh sách trạng thái module.
        """
        settings_by_code = self.repository.get_settings()
        return [
            self._build_state(descriptor, settings_by_code.get(descriptor.code))
            for descriptor in self.registry.all()
        ]

    def get_state(self, code: str) -> ModuleState:
        """Trạng thái một module đã cài.

        Args:
            code: Mã module.

        Returns:
            Trạng thái module.

        Raises:
            NotFoundError: Module chưa cài.
        """
        descriptor = self._get_descriptor(code)
        return self._build_state(descriptor, self.repository.find_one(code=code))

    def is_enabled(self, code: str) -> bool:
        """Module đã cài và đang bật.

        Args:
            code: Mã module.

        Returns:
            True nếu đang bật.
        """
        descriptor = self.registry.get(code)
        if descriptor is None:
            return False
        if descriptor.is_core:
            return True
        flag = self.repository.get_flag(code)
        return True if flag is None else flag

    @transaction.atomic
    def set_enabled(self, actor: Any, code: str, enabled: bool) -> ModuleState:
        """Bật/tắt module, kiểm tra phụ thuộc.

        Args:
            actor: Người thực hiện.
            code: Mã module.
            enabled: Trạng thái mới.

        Returns:
            Trạng thái mới.

        Raises:
            NotFoundError: Module chưa cài (không thể bật bằng cờ database).
            BusinessRuleError: Module lõi, phụ thuộc đang tắt, hoặc module khác đang cần.
        """
        descriptor = self._get_descriptor(code)
        if descriptor.is_core:
            raise BusinessRuleError("Không thể tắt module lõi.", code=ErrorCode.MODULE_CORE_LOCKED)

        if enabled:
            missing = [
                dependency for dependency in descriptor.dependencies if not self.is_enabled(dependency)
            ]
            if missing:
                raise BusinessRuleError(
                    "Cần bật module phụ thuộc trước.",
                    code=ErrorCode.MODULE_DEPENDENCY_DISABLED,
                    details={"dependencies": missing},
                )
        else:
            dependents = [
                state.descriptor.code
                for state in self.list_modules()
                if state.enabled and code in state.descriptor.dependencies
            ]
            if dependents:
                raise BusinessRuleError(
                    "Module đang được module khác sử dụng.",
                    code=ErrorCode.MODULE_REQUIRED_BY_OTHERS,
                    details={"dependents": dependents},
                )

        row = self.repository.upsert(code, actor=actor, enabled=enabled)
        return self._build_state(descriptor, row)

    @transaction.atomic
    def set_icon(self, actor: Any, code: str, data: dict[str, Any]) -> ModuleState:
        """Đổi icon module: tên icon lucide và/hoặc file SVG tự upload.

        Args:
            actor: Người thực hiện.
            code: Mã module.
            data: `icon` (chuỗi rỗng = về icon mặc định), `icon_id` (id attachment SVG; None = gỡ).

        Returns:
            Trạng thái mới.

        Raises:
            NotFoundError: Module chưa cài hoặc file không tồn tại.
            ValidationError: File không phải SVG.
        """
        descriptor = self._get_descriptor(code)
        fields: dict[str, Any] = {}
        if "icon" in data:
            fields["icon"] = data["icon"]
        if "icon_id" in data:
            icon_id = data["icon_id"]
            fields["icon_attachment"] = None if icon_id is None else self.attachment_service.get_svg(icon_id)
        row = self.repository.upsert(code, actor=actor, **fields)
        return self._build_state(descriptor, row)

    def _get_descriptor(self, code: str) -> ModuleDescriptor:
        """Descriptor của module đã cài.

        Raises:
            NotFoundError: Module chưa cài (không thể cấu hình bằng database).
        """
        descriptor = self.registry.get(code)
        if descriptor is None:
            raise NotFoundError("Module chưa được cài đặt.", code=ErrorCode.MODULE_NOT_INSTALLED)
        return descriptor

    @staticmethod
    def _build_state(descriptor: ModuleDescriptor, row: SystemModule | None) -> ModuleState:
        """Ghép descriptor (code) với cấu hình (DB).

        Args:
            descriptor: Metadata module.
            row: Cấu hình đã lưu hoặc None.

        Returns:
            Trạng thái module.
        """
        enabled = descriptor.is_core or row is None or row.enabled
        icon = (row.icon if row is not None and row.icon else "") or descriptor.icon
        icon_file = row.icon_attachment if row is not None else None
        icon_url = build_absolute_url(str(icon_file.file.url)) if icon_file is not None else None
        return ModuleState(descriptor, enabled, icon, icon_url)
