"""Integration tests cho trang, block và dữ liệu công khai."""

from typing import Any

import pytest

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.modules.account.tests.factories.user_factory import UserFactory
from app.modules.custom_pages.models.page import Page
from app.modules.custom_pages.models.page_block import PageBlock
from app.modules.custom_pages.permissions.custom_pages_permission import CustomPagesPermission as P
from app.modules.custom_pages.services.page_block_service import PageBlockService
from app.modules.iam.tests.helpers.permission_helper import grant

pytestmark = pytest.mark.django_db
BASE = "/api/v1/custom_pages/pages"


class TestPageApi(BaseApiTestCase):
    """Trang và block có IAM, ownership, trạng thái công khai."""

    @staticmethod
    def page_payload(slug: str = "my-page", **changes: Any) -> dict[str, Any]:
        """Payload trang hợp lệ."""
        return {"title": "My page", "slug": slug, **changes}

    @staticmethod
    def block_payload(block_type: str = "TEXT", **content: Any) -> dict[str, Any]:
        """Payload block hợp lệ."""
        return {"block_type": block_type, "content": content or {"text": "Hello world"}}

    def test_create_blocks_publish_and_qr(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE, P.READ, P.UPDATE)
        api = login(user)
        created = self.assert_success(api.post(BASE, self.page_payload(), format="json"), 201)
        page_id = created["id"]
        assert created["owner_id"] == str(user.pk)
        assert created["status"] == "DRAFT"
        self.assert_error(api.get("/api/v1/custom_pages/public/my-page"), 404, "NOT_FOUND")
        blocks_url = f"{BASE}/{page_id}/blocks"
        text = self.assert_success(
            api.post(blocks_url, self.block_payload(text="Visible text"), format="json"), 201
        )
        qr = self.assert_success(
            api.post(
                blocks_url, self.block_payload("QR_CODE", target_type="PAGE", label="Scan"), format="json"
            ),
            201,
        )
        hidden = self.assert_success(
            api.post(blocks_url, {**self.block_payload(text="Private"), "is_visible": False}, format="json"),
            201,
        )
        assert [text["position"], qr["position"], hidden["position"]] == [0, 1, 2]
        detail = self.assert_success(api.get(f"{BASE}/{page_id}"), 200)
        assert len(detail["blocks"]) == 3
        self.assert_success(api.patch(f"{BASE}/{page_id}", {"status": "PUBLISHED"}, format="json"), 200)
        public = self.assert_success(api.get("/api/v1/custom_pages/public/my-page"), 200)
        assert public["canonical_url"] == "http://testserver/p/my-page"
        assert len(public["blocks"]) == 2
        assert public["blocks"][1]["content"]["qr_payload"] == public["canonical_url"]
        assert "owner_id" not in public
        assert "Private" not in str(public)

    def test_update_delete_reorder_and_isolation(self, user: Any, login: Any) -> None:
        grant(user, P.CREATE, P.READ, P.UPDATE, P.DELETE)
        api = login(user)
        page = self.assert_success(api.post(BASE, self.page_payload(), format="json"), 201)
        page_id = page["id"]
        blocks_url = f"{BASE}/{page_id}/blocks"
        first = self.assert_success(api.post(blocks_url, self.block_payload(text="One"), format="json"), 201)
        second = self.assert_success(api.post(blocks_url, self.block_payload(text="Two"), format="json"), 201)
        self.assert_success(
            api.patch(f"{blocks_url}/{first['id']}", {"content": {"text": "Updated"}}, format="json"), 200
        )
        ordered = self.assert_success(
            api.post(f"{blocks_url}/reorder", {"block_ids": [second["id"], first["id"]]}, format="json"), 200
        )
        assert [item["id"] for item in ordered] == [second["id"], first["id"]]
        self.assert_error(
            api.post(f"{blocks_url}/reorder", {"block_ids": [first["id"]]}, format="json"),
            400,
            "VALIDATION_ERROR",
        )
        assert api.delete(f"{blocks_url}/{second['id']}").status_code == 204
        assert PageBlock.objects.get(pk=second["id"]).deleted_at is not None
        assert PageBlock.objects.get(pk=first["id"]).position == 0
        other = UserFactory()
        grant(other, P.READ, P.UPDATE, P.DELETE)
        other_api = login(other)
        self.assert_error(other_api.get(f"{BASE}/{page_id}"), 404, "NOT_FOUND")
        self.assert_error(
            other_api.patch(f"{BASE}/{page_id}", {"title": "Hijack"}, format="json"), 404, "NOT_FOUND"
        )
        self.assert_error(other_api.post(blocks_url, self.block_payload(), format="json"), 404, "NOT_FOUND")
        self.assert_error(other_api.delete(f"{blocks_url}/{first['id']}"), 404, "NOT_FOUND")
        assert api.delete(f"{BASE}/{page_id}").status_code == 204
        assert Page.objects.get(pk=page_id).deleted_at is not None
        self.assert_error(api.get("/api/v1/custom_pages/public/my-page"), 404, "NOT_FOUND")

    def test_validation_and_permission(self, user: Any, login: Any, client: Any) -> None:
        self.assert_unauthorized(client.post(BASE, self.page_payload(), format="json"))
        self.assert_forbidden(login(user).post(BASE, self.page_payload(), format="json"))
        grant(user, P.CREATE, P.UPDATE)
        api = login(user)
        self.assert_success(api.post(BASE, self.page_payload(), format="json"), 201)
        self.assert_error(api.post(BASE, self.page_payload(slug="MY-PAGE"), format="json"), 409, "CONFLICT")
        self.assert_error(
            api.post(BASE, self.page_payload(slug="abc/def"), format="json"), 400, "VALIDATION_ERROR"
        )
        self.assert_error(
            api.post(
                BASE,
                self.page_payload(theme={"background_color": "#ffffff", "text_color": "#eeeeee"}),
                format="json",
            ),
            400,
            "VALIDATION_ERROR",
        )
        page_id = Page.objects.get(slug="my-page").pk
        blocks_url = f"{BASE}/{page_id}/blocks"
        self.assert_error(
            api.post(blocks_url, self.block_payload(text="<script>x</script>"), format="json"),
            400,
            "VALIDATION_ERROR",
        )
        self.assert_error(
            api.post(
                blocks_url,
                self.block_payload(
                    "QR_CODE", target_type="URL", target_url="javascript:alert(1)", label="Bad"
                ),
                format="json",
            ),
            400,
            "VALIDATION_ERROR",
        )
        self.assert_error(
            api.post(
                blocks_url,
                self.block_payload("IMAGE", attachment_id=str(page_id), alt="Foreign"),
                format="json",
            ),
            404,
            "NOT_FOUND",
        )

    def test_create_rate_limit(self, user: Any, login: Any, settings: Any) -> None:
        """Giới hạn tạo trang theo user, không giới hạn toàn site."""
        settings.CUSTOM_PAGE_CREATE_RATE_LIMIT = 1
        grant(user, P.CREATE)
        api = login(user)
        self.assert_success(api.post(BASE, self.page_payload(slug="first-page"), format="json"), 201)
        self.assert_error(
            api.post(BASE, self.page_payload(slug="second-page"), format="json"), 429, "RATE_LIMITED"
        )

    def test_block_generic_crud_cannot_bypass_page_scope(self, user: Any) -> None:
        """Hàm CRUD kế thừa không được tạo/sửa/xóa block của chủ trang khác."""
        page = Page.objects.create(owner=user, title="Owner page", slug="owner-page")
        block = PageBlock.objects.create(
            page=page, block_type=PageBlock.Type.TEXT, content={"text": "Original"}, position=0
        )
        other = UserFactory()
        service = PageBlockService()

        with pytest.raises(BusinessRuleError):
            service.create(
                other,
                {"page": page, "block_type": PageBlock.Type.TEXT, "content": {"text": "Injected"}},
            )
        with pytest.raises(BusinessRuleError):
            service.update(other, block.pk, {"content": {"text": "Changed"}})
        with pytest.raises(BusinessRuleError):
            service.delete(other, block.pk)

        block.refresh_from_db()
        assert block.content == {"text": "Original"}
        assert block.deleted_at is None
        assert PageBlock.objects.filter(page=page).count() == 1
