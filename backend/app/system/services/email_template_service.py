"""Nghiệp vụ quản lý Mẫu Email (EmailTemplate), nhân bản, trộn biến an toàn và xem trước."""

import html
import re
from typing import Any

from django.db.models import QuerySet

from app.core.exceptions.authorization_error import AuthorizationError
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.services.core_crud_service import CoreCrudService
from app.system.constants.email_template_error_code import EmailTemplateErrorCode
from app.system.models.email_template import EmailTemplate
from app.system.permissions.email_template_permission import EmailTemplatePermission as P
from app.system.repositories.email_template_repository import EmailTemplateRepository
from app.system.repositories.email_template_translation_repository import (
    EmailTemplateTranslationRepository,
)
from app.system.repositories.language_repository import LanguageRepository

_DANGEROUS_TAG_RE = re.compile(
    r"<\s*(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*/\s*\1\s*>",
    re.I,
)
_EVENT_ATTR_RE = re.compile(r"\s+on[a-z]+\s*=\s*(['\"]).*?\1", re.I)
_JS_HREF_RE = re.compile(r"""href\s*=\s*(['"])\s*javascript:[^'"]*\1""", re.I)
_VAR_PLACEHOLDER_RE = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")
_TAG_STRIP_RE = re.compile(r"<[^>]+>")


class EmailTemplateService(CoreCrudService[EmailTemplate, EmailTemplateRepository]):
    """Quản lý mẫu email SYSTEM/PERSONAL với phân quyền 3 tầng và trộn biến chống XSS."""

    repository_class = EmailTemplateRepository
    owner_field = "owner"
    manage_all_permission = P.MANAGE_ALL.code

    def __init__(
        self,
        repository: EmailTemplateRepository | None = None,
        translation_repository: EmailTemplateTranslationRepository | None = None,
        language_repository: LanguageRepository | None = None,
    ) -> None:
        """Khởi tạo các repository cho EmailTemplate, bảng mapping bản dịch và Language."""
        super().__init__(repository=repository)
        self.translation_repository = translation_repository or EmailTemplateTranslationRepository()
        self.language_repository = language_repository or LanguageRepository()

    def get_queryset_for(self, actor: Any) -> QuerySet[EmailTemplate]:
        """Admin `manage_all` thấy tất cả; thành viên thấy mẫu `SYSTEM ACTIVE` + mẫu `PERSONAL` của mình."""
        if self.can_manage_all(actor):
            return self.get_queryset().select_related("owner")
        return self.repository.accessible_queryset(actor)

    def get_by_id_for(self, actor: Any, pk: Any) -> EmailTemplate:
        """Trả chi tiết mẫu nếu có quyền đọc; bản `AUTH`/`NOTIFICATION` hệ thống chỉ dành cho `manage_all`."""
        instance = self.get_by_id(pk)
        if self.can_manage_all(actor) or instance.owner_id == actor.pk:
            return instance
        if (
            instance.scope == EmailTemplate.Scope.SYSTEM
            and instance.status == EmailTemplate.Status.ACTIVE
            and instance.category in (EmailTemplate.Category.FEEDBACK_THANKS, EmailTemplate.Category.CUSTOM)
        ):
            return instance
        raise NotFoundError()

    def create(self, actor: Any, data: dict[str, Any]) -> EmailTemplate:
        """Tạo mẫu email mới; chỉ `manage_all` được tạo `scope=SYSTEM`."""
        payload = dict(data)
        scope = str(payload.get("scope") or EmailTemplate.Scope.PERSONAL)
        if scope == EmailTemplate.Scope.SYSTEM:
            if not self.can_manage_all(actor):
                raise AuthorizationError("Chỉ quản trị viên mới có quyền tạo mẫu email toàn hệ thống.")
            payload["owner"] = None
        else:
            payload["scope"] = EmailTemplate.Scope.PERSONAL
            payload["owner"] = actor

        code = str(payload.get("code") or "").strip()
        locale = str(payload.get("locale") or "vi").strip()
        if self.repository.exists_code(
            code=code,
            locale=locale,
            scope=payload["scope"],
            owner=payload["owner"],
        ):
            raise ConflictError(
                "Mã mẫu email đã tồn tại trong phạm vi và ngôn ngữ này.",
                code=EmailTemplateErrorCode.CODE_CONFLICT,
            )

        payload["html_body"] = self.sanitize_html(str(payload.get("html_body") or ""))
        self._sync_translations(payload, primary_locale=locale)
        instance = self.repository.create(**payload)
        self._persist_translation_rows(instance)
        return instance

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> EmailTemplate:
        """Cập nhật mẫu email; không cho người dùng thường sửa mẫu `SYSTEM`."""
        instance = self.get_by_id(pk)
        is_manager = self.can_manage_all(actor)
        if not is_manager:
            if instance.scope == EmailTemplate.Scope.SYSTEM:
                raise AuthorizationError("Không thể chỉnh sửa trực tiếp mẫu email hệ thống.")
            if instance.owner_id != actor.pk:
                raise NotFoundError()

        payload = dict(data)
        next_scope = str(payload.get("scope") or instance.scope)
        if next_scope == EmailTemplate.Scope.SYSTEM and not is_manager:
            raise AuthorizationError("Chỉ quản trị viên mới có quyền đặt phạm vi toàn hệ thống.")
        if "scope" in payload:
            payload["owner"] = None if next_scope == EmailTemplate.Scope.SYSTEM else (instance.owner or actor)

        code = str(payload.get("code") or instance.code).strip()
        locale = str(payload.get("locale") or instance.locale).strip()
        owner_check = (
            None if next_scope == EmailTemplate.Scope.SYSTEM else (payload.get("owner") or instance.owner)
        )
        if self.repository.exists_code(
            code=code,
            locale=locale,
            scope=next_scope,
            owner=owner_check,
            exclude_pk=instance.pk,
        ):
            raise ConflictError(
                "Mã mẫu email đã tồn tại trong phạm vi và ngôn ngữ này.",
                code=EmailTemplateErrorCode.CODE_CONFLICT,
            )

        if "html_body" in payload:
            payload["html_body"] = self.sanitize_html(str(payload["html_body"] or ""))
        if "translations" in payload or "html_body" in payload or "subject" in payload or "name" in payload:
            self._sync_translations(payload, existing=instance, primary_locale=locale)
        updated = self.repository.update(instance, **payload)
        self._persist_translation_rows(updated)
        return updated

    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm mẫu email; bảo vệ mẫu mặc định hệ thống và chặn xóa mẫu người khác."""
        instance = self.get_by_id(pk)
        is_manager = self.can_manage_all(actor)
        if not is_manager:
            if instance.scope == EmailTemplate.Scope.SYSTEM:
                raise AuthorizationError("Không thể xóa mẫu email hệ thống.")
            if instance.owner_id != actor.pk:
                raise NotFoundError()
        if instance.is_system_default:
            raise BusinessRuleError(
                "Không thể xóa mẫu email mặc định của hệ thống; hãy chuyển trạng thái sang Lưu trữ.",
                code=EmailTemplateErrorCode.SYSTEM_DEFAULT_PROTECTED,
            )
        self.repository.delete(instance)

    def duplicate(self, actor: Any, pk: Any) -> EmailTemplate:
        """Nhân bản một mẫu `SYSTEM` hoặc `PERSONAL` thành bản `PERSONAL` riêng của `actor`."""
        source = self.get_by_id_for(actor, pk)
        base_code = f"{source.code}_copy"[:70]
        candidate = base_code
        idx = 2
        while self.repository.exists_code(
            code=candidate,
            locale=source.locale,
            scope=EmailTemplate.Scope.PERSONAL,
            owner=actor,
        ):
            candidate = f"{base_code}_{idx}"[:80]
            idx += 1

        cloned = self.repository.create(
            code=candidate,
            name=f"{source.name} (Bản sao)"[:150],
            description=source.description,
            locale=source.locale,
            scope=EmailTemplate.Scope.PERSONAL,
            category=source.category,
            status=EmailTemplate.Status.ACTIVE,
            owner=actor,
            subject=source.subject,
            content=source.content,
            html_body=source.html_body,
            translations=source.translations or {},
            variables=source.variables,
            is_system_default=False,
        )
        self._persist_translation_rows(cloned)
        return cloned

    def preview(
        self,
        actor: Any,
        pk: Any,
        context: dict[str, Any],
        *,
        locale: str = "vi",
    ) -> dict[str, str]:
        """Trộn biến dữ liệu mẫu theo ngôn ngữ và trả về `subject`, `html_body`, `text_body` đã làm sạch."""
        template = self.get_by_id_for(actor, pk)
        return self.render_template(template, context, locale=locale)

    def find_active_thank_you_template(self, actor: Any, locale: str = "vi") -> EmailTemplate | None:
        """Tìm mẫu cảm ơn góp ý ưu tiên bản `PERSONAL` của `actor`, sau đó đến `SYSTEM`."""
        personal = (
            self.repository.get_queryset()
            .filter(
                owner=actor,
                scope=EmailTemplate.Scope.PERSONAL,
                category=EmailTemplate.Category.FEEDBACK_THANKS,
                status=EmailTemplate.Status.ACTIVE,
            )
            .order_by("-updated_at")
            .first()
        )
        if personal is not None:
            return personal
        qs = self.repository.get_queryset().filter(
            scope=EmailTemplate.Scope.SYSTEM,
            category=EmailTemplate.Category.FEEDBACK_THANKS,
            status=EmailTemplate.Status.ACTIVE,
        )
        return qs.filter(locale=locale).first() or qs.first()

    def find_active_system_template(self, code: str, locale: str) -> EmailTemplate | None:
        """Tìm mẫu `SYSTEM` đang `ACTIVE` theo mã và ngôn ngữ (dùng trong `EmailService`)."""
        return self.repository.find_active_system_template(code, locale)

    def render_template(
        self,
        template: EmailTemplate,
        context: dict[str, Any],
        *,
        locale: str = "vi",
    ) -> dict[str, str]:
        """Trộn biến `{{key}}` theo ngôn ngữ an toàn: escape HTML chống XSS trên mọi giá trị."""
        safe_str_map = {str(k): str(v if v is not None else "") for k, v in context.items()}
        safe_html_map = {k: html.escape(v, quote=True) for k, v in safe_str_map.items()}

        translations = template.translations if isinstance(template.translations, dict) else {}
        entry = (
            translations.get(locale)
            or translations.get(template.locale)
            or next(iter(translations.values()), None)
            or {}
        )
        raw_subject = str(entry.get("subject") or template.subject or "")
        raw_html = str(entry.get("html_body") or template.html_body or "")

        rendered_subject = _VAR_PLACEHOLDER_RE.sub(
            lambda m: safe_str_map.get(m.group(1), ""),
            raw_subject,
        )
        rendered_html = _VAR_PLACEHOLDER_RE.sub(
            lambda m: safe_html_map.get(m.group(1), ""),
            raw_html,
        )
        rendered_html = self.sanitize_html(rendered_html)
        lowered = rendered_html.lower()
        if rendered_html and "<body" not in lowered and "font-family" not in lowered:
            rendered_html = (
                "<div style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',"
                'Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.65;color:#18181b;">'
                f"{rendered_html}</div>"
            )
        text_body = re.sub(r"\n{3,}", "\n\n", _TAG_STRIP_RE.sub("", rendered_html)).strip()
        return {
            "subject": rendered_subject[:200],
            "html_body": rendered_html,
            "text_body": text_body,
        }

    def _sync_translations(
        self,
        payload: dict[str, Any],
        *,
        primary_locale: str = "vi",
        existing: EmailTemplate | None = None,
    ) -> None:
        """Chuẩn hóa `translations`, làm sạch HTML từng ngôn ngữ và đồng bộ các trường top-level."""
        raw_map = payload.get("translations")
        if raw_map is None and existing is not None:
            raw_map = dict(existing.translations or {})
        cleaned: dict[str, dict[str, Any]] = {}
        if isinstance(raw_map, dict):
            for lang, entry in raw_map.items():
                if not isinstance(entry, dict):
                    continue
                code = str(lang).strip().lower()[:10]
                if not code:
                    continue
                cleaned[code] = {
                    "name": str(entry.get("name") or "")[:150],
                    "subject": str(entry.get("subject") or "")[:200],
                    "content": entry.get("content") if isinstance(entry.get("content"), dict) else {},
                    "html_body": self.sanitize_html(str(entry.get("html_body") or "")),
                }

        if not cleaned:
            base_name = str(payload.get("name") or (existing.name if existing else "") or "")[:150]
            base_subject = str(payload.get("subject") or (existing.subject if existing else "") or "")[:200]
            base_content = payload.get("content") or (existing.content if existing else {}) or {}
            base_html = str(payload.get("html_body") or (existing.html_body if existing else "") or "")
            cleaned[primary_locale] = {
                "name": base_name,
                "subject": base_subject,
                "content": base_content,
                "html_body": self.sanitize_html(base_html),
            }

        payload["translations"] = cleaned
        primary = cleaned.get(primary_locale) or cleaned.get("vi") or next(iter(cleaned.values()))
        if not payload.get("name"):
            payload["name"] = (
                primary.get("name") or (existing.name if existing else "") or payload.get("code", "")
            )
        if not payload.get("subject"):
            payload["subject"] = primary.get("subject") or (existing.subject if existing else "") or ""
        if not payload.get("content"):
            payload["content"] = primary.get("content") or (existing.content if existing else {}) or {}
        if not payload.get("html_body"):
            payload["html_body"] = primary.get("html_body") or (existing.html_body if existing else "") or ""

    def _persist_translation_rows(self, template: EmailTemplate) -> None:
        """Đồng bộ từ điển `translations` của mẫu email xuống bảng mapping `EmailTemplateTranslation`."""
        translations = template.translations if isinstance(template.translations, dict) else {}
        keep_language_ids: list[Any] = []
        for lang_code, entry in translations.items():
            if not isinstance(entry, dict):
                continue
            language = self.language_repository.find_by_code(str(lang_code))
            if language is None:
                continue
            raw_content = entry.get("content")
            self.translation_repository.upsert_translation(
                template=template,
                language=language,
                name=str(entry.get("name") or template.name)[:150],
                subject=str(entry.get("subject") or template.subject)[:200],
                content=raw_content if isinstance(raw_content, dict) else {},
                html_body=str(entry.get("html_body") or ""),
            )
            keep_language_ids.append(language.pk)
        if keep_language_ids:
            self.translation_repository.remove_missing_languages(template, keep_language_ids)

    def sanitize_html(self, raw_html: str) -> str:
        """Loại bỏ thẻ `<script>`, `<style>`, `<iframe>`, `on*` và `javascript:` khỏi HTML email."""
        cleaned = _DANGEROUS_TAG_RE.sub("", raw_html or "")
        cleaned = _EVENT_ATTR_RE.sub("", cleaned)
        cleaned = _JS_HREF_RE.sub('href="#"', cleaned)
        return cleaned.strip()
