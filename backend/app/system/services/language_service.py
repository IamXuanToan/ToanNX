"""Nghiệp vụ quản lý danh mục Ngôn ngữ (`Language`) và cache công khai."""

from typing import Any

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.conflict_error import ConflictError
from app.core.services.core_crud_service import CoreCrudService
from app.system.constants.language_error_code import LanguageErrorCode
from app.system.models.language import Language
from app.system.repositories.language_repository import LanguageRepository

PUBLIC_LANGUAGE_CACHE_NAMESPACE = "system:languages"
PUBLIC_LANGUAGE_CACHE_TTL_SECONDS = 600


class LanguageService(CoreCrudService[Language, LanguageRepository]):
    """Quản lý ngôn ngữ hệ thống dùng chung cho mọi tính năng đa ngôn ngữ."""

    repository_class = LanguageRepository
    public_cache_namespace = PUBLIC_LANGUAGE_CACHE_NAMESPACE

    def create(self, actor: Any, data: dict[str, Any]) -> Language:
        """Tạo ngôn ngữ mới sau khi chuẩn hóa mã `code` viết thường và kiểm tra trùng."""
        payload = dict(data)
        code = str(payload.get("code") or "").strip().lower()
        payload["code"] = code
        if self.repository.exists_code(code):
            raise ConflictError(
                "Mã ngôn ngữ này đã tồn tại.",
                code=LanguageErrorCode.CODE_CONFLICT,
            )
        return super().create(actor, payload)

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Language:
        """Cập nhật thông tin ngôn ngữ (kiểm tra trùng mã nếu đổi)."""
        instance = self.get_by_id(pk)
        payload = dict(data)
        if "code" in payload:
            code = str(payload["code"] or "").strip().lower()
            payload["code"] = code
            if self.repository.exists_code(code, exclude_pk=instance.pk):
                raise ConflictError(
                    "Mã ngôn ngữ này đã tồn tại.",
                    code=LanguageErrorCode.CODE_CONFLICT,
                )
        if instance.is_default and payload.get("is_active") is False:
            raise BusinessRuleError(
                "Không thể tắt ngôn ngữ mặc định của hệ thống.",
                code=LanguageErrorCode.DEFAULT_PROTECTED,
            )
        return super().update(actor, pk, payload)

    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm ngôn ngữ (chặn xóa ngôn ngữ mặc định `vi`/`en`)."""
        instance = self.get_by_id(pk)
        if instance.is_default or instance.code in ("vi", "en"):
            raise BusinessRuleError(
                "Không thể xóa ngôn ngữ mặc định của hệ thống.",
                code=LanguageErrorCode.DEFAULT_PROTECTED,
            )
        self.repository.delete(instance)

    def list_active_public(self) -> list[dict[str, Any]]:
        """Trả danh sách ngôn ngữ đang bật (cache Redis 10 phút, dự phòng DB)."""
        version = self.cache_service.namespace_version(PUBLIC_LANGUAGE_CACHE_NAMESPACE)
        cache_key = None if version is None else f"{PUBLIC_LANGUAGE_CACHE_NAMESPACE}:{version}:active"
        cached = self.cache_service.get_json(cache_key) if cache_key else None
        if isinstance(cached, list):
            return cached

        rows = self.repository.list_active()
        result = [
            {
                "id": str(row.pk),
                "code": row.code,
                "name": row.name,
                "native_name": row.native_name,
                "flag_emoji": row.flag_emoji,
                "is_default": row.is_default,
                "sort_order": row.sort_order,
            }
            for row in rows
        ]
        if not result:
            result = [
                {
                    "id": "",
                    "code": "vi",
                    "name": "Tiếng Việt",
                    "native_name": "Tiếng Việt",
                    "flag_emoji": "🇻🇳",
                    "is_default": True,
                    "sort_order": 1,
                },
                {
                    "id": "",
                    "code": "en",
                    "name": "English",
                    "native_name": "English",
                    "flag_emoji": "🇺🇸",
                    "is_default": True,
                    "sort_order": 2,
                },
            ]
        if cache_key:
            self.cache_service.set_json(cache_key, result, PUBLIC_LANGUAGE_CACHE_TTL_SECONDS)
        return result
