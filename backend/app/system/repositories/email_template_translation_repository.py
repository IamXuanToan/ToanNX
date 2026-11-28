"""Repository quản lý bảng mapping EmailTemplateTranslation."""

from typing import Any

from app.core.repositories.core_repository import CoreRepository
from app.system.models.email_template import EmailTemplate
from app.system.models.email_template_translation import EmailTemplateTranslation
from app.system.models.language import Language


class EmailTemplateTranslationRepository(CoreRepository[EmailTemplateTranslation]):
    """Đồng bộ và truy vấn các bản dịch theo khóa ngoại `(template, language)`."""

    model = EmailTemplateTranslation

    def upsert_translation(
        self,
        *,
        template: EmailTemplate,
        language: Language,
        name: str,
        subject: str,
        content: dict,
        html_body: str,
    ) -> EmailTemplateTranslation:
        """Tạo mới hoặc cập nhật bản dịch cho cặp `(template, language)`."""
        existing = self.get_queryset().filter(template=template, language=language).first()
        if existing is not None:
            return self.update(
                existing,
                name=name,
                subject=subject,
                content=content,
                html_body=html_body,
            )
        return self.create(
            template=template,
            language=language,
            name=name,
            subject=subject,
            content=content,
            html_body=html_body,
        )

    def remove_missing_languages(self, template: EmailTemplate, keep_language_ids: list[Any]) -> None:
        """Xóa mềm các bản dịch không còn nằm trong danh sách giữ lại."""
        qs = self.get_queryset().filter(template=template)
        if keep_language_ids:
            qs = qs.exclude(language_id__in=keep_language_ids)
        for item in qs:
            self.delete(item)
