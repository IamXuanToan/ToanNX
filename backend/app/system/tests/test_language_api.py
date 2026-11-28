"""Kiểm thử API Language và đồng bộ bảng mapping EmailTemplateTranslation."""

from typing import Any

import pytest

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.system.models.email_template import EmailTemplate
from app.system.models.email_template_translation import EmailTemplateTranslation
from app.system.models.language import Language
from app.system.permissions.email_template_permission import EmailTemplatePermission
from app.system.permissions.language_permission import LanguagePermission
from app.system.services.language_seed_service import LanguageSeedService
from app.system.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/languages"
ACTIVE_URL = "/api/v1/system/languages/active"
TPL_URL = "/api/v1/system/email-templates"


class TestLanguageApi(BaseApiTestCase):
    """Kiểm thử CRUD ngôn ngữ, endpoint active công khai và mapping EmailTemplateTranslation."""

    def test_public_active_languages_and_admin_crud_with_translation_mapping(
        self, client: Any, staff: Any, login: Any
    ) -> None:
        """Khách đọc được ngôn ngữ đang bật; Admin thêm `ja` và đồng bộ `EmailTemplateTranslation`."""
        LanguageSeedService().seed_defaults()

        active_items = self.assert_success(client.get(ACTIVE_URL))
        assert [item["code"] for item in active_items][:2] == ["vi", "en"]

        grant(staff, *LanguagePermission.all(), *EmailTemplatePermission.all())
        api = login(staff)

        ja_res = self.assert_success(
            api.post(
                URL,
                {
                    "code": "ja",
                    "name": "日本語",
                    "native_name": "Tiếng Nhật",
                    "flag_emoji": "🇯🇵",
                    "sort_order": 3,
                },
                format="json",
            ),
            201,
        )
        assert ja_res["code"] == "ja"

        # Tạo mẫu email kèm bản dịch vi + ja -> tự sinh 2 dòng trong EmailTemplateTranslation
        tpl_res = self.assert_success(
            api.post(
                TPL_URL,
                {
                    "code": "welcome_multi",
                    "scope": "PERSONAL",
                    "category": "CUSTOM",
                    "translations": {
                        "vi": {"name": "Chào mừng", "subject": "Xin chào", "html_body": "<p>Chào</p>"},
                        "ja": {"name": "ようこそ", "subject": "こんにちは", "html_body": "<p>こんにちは</p>"},
                    },
                },
                format="json",
            ),
            201,
        )
        tpl = EmailTemplate.objects.get(pk=tpl_res["id"])
        assert EmailTemplateTranslation.objects.filter(template=tpl, language__code="vi").exists()
        assert EmailTemplateTranslation.objects.filter(template=tpl, language__code="ja").exists()

        # Không cho xóa ngôn ngữ mặc định vi
        vi_lang = Language.objects.get(code="vi")
        self.assert_error(api.delete(f"{URL}/{vi_lang.pk}"), 422, "SYSTEM_LANGUAGE_DEFAULT_PROTECTED")

        # Xóa được ngôn ngữ phụ ja (sau khi bỏ tham chiếu hoặc xóa mẫu)
        tpl.translation_items.filter(language__code="ja").delete()
        assert api.delete(f"{URL}/{ja_res['id']}").status_code == 204
