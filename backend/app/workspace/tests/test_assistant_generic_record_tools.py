"""Tool chung của Trợ lý (`list_my_records` / `update_my_record`), xóa 2 bước tài nguyên mới,
đổi đường dẫn giữa của trang (tự tạo khi có quyền) và đồng bộ tri thức RAG sau `migrate`."""

import json
from typing import Any
from unittest.mock import MagicMock

import pytest
from django.apps import apps as django_apps
from django.db import DatabaseError
from django.db.models.signals import post_migrate

from app.system.models.currency import Currency
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page import Page
from app.utilities.models.page_path import PagePath
from app.utilities.permissions.page_path_permission import PagePathPermission
from app.utilities.permissions.page_permission import PagePermission
from app.workspace import apps as workspace_apps
from app.workspace.constants.assistant_record_resources import ASSISTANT_RECORD_RESOURCES
from app.workspace.constants.assistant_tool_schemas import build_assistant_tool_schemas
from app.workspace.models.assistant_conversation import AssistantConversation
from app.workspace.models.assistant_knowledge_chunk import AssistantKnowledgeChunk
from app.workspace.services.assistant_knowledge_service import (
    RESOURCE_SOURCE_PREFIX,
    AssistantKnowledgeService,
)
from app.workspace.services.assistant_result_card_builder import AssistantResultCardBuilder
from app.workspace.services.assistant_tool_router import AssistantToolRouter
from app.workspace.services.assistant_tools_service import AssistantToolsService
from app.workspace.tests.helpers.assistant_generic_records import make_generic_records

pytestmark = pytest.mark.django_db
OWN = "CuaToi"
OTHER = "CuaNguoiKhac"
# Tài nguyên có bản ghi mẫu (đường dẫn giữa là danh mục chung, kiểm riêng).
OWNED_RESOURCES = ("invoice", "platform", "file", "subscription_payment", "donation")
NEW_DELETABLE = ("invoice", "platform", "file", "subscription_payment")


def _page(owner: Any, slug: str, *, segment: str = "p") -> Page:
    return Page.objects.create(
        owner=owner, path=PagePath.objects.get(segment=segment), title=f"Trang {slug}", slug=slug
    )


def _run(actor: Any, tool: str, args: dict[str, Any], **kwargs: Any) -> dict[str, Any]:
    return AssistantToolsService().execute_tool(actor, tool, dict(args), is_owner=True, **kwargs)


@pytest.fixture
def scene(superuser: Any, vnd: Currency) -> dict[str, Any]:
    other = UserFactory()
    return {
        "actor": superuser,
        "own": make_generic_records(superuser, OWN, vnd, suffix="own", page=_page(superuser, "ung-ho-own")),
        "other": make_generic_records(other, OTHER, vnd, suffix="other", page=_page(other, "ung-ho-other")),
    }


class TestListMyRecords:
    @pytest.mark.parametrize("resource", OWNED_RESOURCES)
    def test_superuser_only_sees_own_records(self, scene: dict[str, Any], resource: str) -> None:
        result = _run(scene["actor"], "list_my_records", {"resource": resource})
        assert result["ok"] is True, result
        dumped = json.dumps(result, ensure_ascii=False, default=str)
        assert OWN in dumped
        assert OTHER not in dumped

    def test_query_filters_without_accents(self, scene: dict[str, Any]) -> None:
        result = _run(scene["actor"], "list_my_records", {"resource": "file", "query": "hopdong"})
        assert result["ok"] is True
        assert len(result["items"]) == 1

    def test_page_path_catalog_is_readable(self, superuser: Any) -> None:
        result = _run(superuser, "list_my_records", {"resource": "page_path"})
        segments = {item["segment"] for item in result["items"]}
        assert {"p", "qr"} <= segments

    def test_unknown_resource_is_rejected(self, superuser: Any) -> None:
        result = _run(superuser, "list_my_records", {"resource": "user"})
        assert result["ok"] is False

    def test_member_without_permission_is_denied(self, user: Any) -> None:
        result = _run(user, "list_my_records", {"resource": "invoice"})
        assert result["ok"] is False


class TestUpdateMyRecord:
    @pytest.mark.parametrize(
        ("resource", "fields", "attr", "expected"),
        [
            ("invoice", {"number": "0012345"}, "number", "0012345"),
            ("platform", {"name": "Shopee Affiliate"}, "name", "Shopee Affiliate"),
            ("file", {"original_name": "hop-dong-2026.pdf"}, "original_name", "hop-dong-2026.pdf"),
            ("donation", {"is_hidden": True}, "is_hidden", True),
        ],
    )
    def test_updates_own_record_and_returns_portal_link(
        self, scene: dict[str, Any], resource: str, fields: dict[str, Any], attr: str, expected: Any
    ) -> None:
        record = scene["own"][resource]
        args = {"resource": resource, "record_id": str(record.pk), "fields": fields}
        result = _run(scene["actor"], "update_my_record", args)
        assert result["ok"] is True, result
        assert result["updated"]["resource"] == resource
        record.refresh_from_db()
        assert getattr(record, attr) == expected
        cards = AssistantResultCardBuilder().build([("update_my_record", result)])
        assert len(cards) == 1
        assert "/vi/ca-nhan/" in cards[0]["view_url"]

    @pytest.mark.parametrize("resource", ("invoice", "platform", "file", "donation"))
    def test_rejects_other_users_record(self, scene: dict[str, Any], resource: str) -> None:
        target = scene["other"][resource]
        before = type(target).objects.get(pk=target.pk)
        field = {"invoice": "number", "platform": "name", "file": "original_name", "donation": "is_hidden"}[
            resource
        ]
        value: Any = True if resource == "donation" else "Hack"
        result = _run(
            scene["actor"],
            "update_my_record",
            {"resource": resource, "record_id": str(target.pk), "fields": {field: value}},
        )
        assert result.get("ok") is False
        after = type(target).objects.get(pk=target.pk)
        assert getattr(after, field) == getattr(before, field)

    def test_invalid_data_is_rejected_by_api_serializer(self, scene: dict[str, Any]) -> None:
        record = scene["own"]["platform"]
        result = _run(
            scene["actor"],
            "update_my_record",
            {"resource": "platform", "record_id": str(record.pk), "fields": {"color": "không-phải-màu"}},
        )
        assert result["ok"] is False
        assert "details" in result

    def test_read_only_resource_cannot_be_updated(self, scene: dict[str, Any]) -> None:
        record = scene["own"]["subscription_payment"]
        result = _run(
            scene["actor"],
            "update_my_record",
            {"resource": "subscription_payment", "record_id": str(record.pk), "fields": {"note": "x"}},
        )
        assert result["ok"] is False

    def test_missing_fields_is_rejected(self, scene: dict[str, Any]) -> None:
        record = scene["own"]["invoice"]
        result = _run(
            scene["actor"], "update_my_record", {"resource": "invoice", "record_id": str(record.pk)}
        )
        assert result["ok"] is False


class TestDeleteNewResources:
    @pytest.mark.parametrize("resource", NEW_DELETABLE)
    def test_two_step_delete_of_own_record(self, scene: dict[str, Any], resource: str) -> None:
        actor = scene["actor"]
        target = scene["own"][resource]
        conv = AssistantConversation.objects.create(owner=actor, channel=AssistantConversation.Channel.WEB)
        args = {"resource_type": resource, "record_id": str(target.pk)}
        step1 = _run(actor, "delete_personal_record", args, conversation_id=str(conv.pk), turn_id="t1")
        assert step1["requires_confirmation"] is True, step1
        assert step1.get("target_summary")
        assert type(target).objects.filter(pk=target.pk, deleted_at__isnull=True).exists()
        step2 = _run(
            actor,
            "delete_personal_record",
            {**args, "confirmed": True},
            conversation_id=str(conv.pk),
            turn_id="t2",
        )
        assert step2["ok"] is True, step2
        assert not type(target).objects.filter(pk=target.pk, deleted_at__isnull=True).exists()

    @pytest.mark.parametrize("resource", NEW_DELETABLE)
    def test_delete_other_users_record_is_rejected(self, scene: dict[str, Any], resource: str) -> None:
        target = scene["other"][resource]
        result = _run(
            scene["actor"],
            "delete_personal_record",
            {"resource_type": resource, "record_id": str(target.pk), "confirmed": True},
            turn_id="t2",
        )
        assert result.get("ok") is False
        assert type(target).objects.filter(pk=target.pk, deleted_at__isnull=True).exists()


class TestPagePathSegment:
    def test_move_page_to_existing_segment(self, superuser: Any) -> None:
        page = _page(superuser, "ToanToChill")
        result = _run(superuser, "update_page", {"page_id": str(page.pk), "path_segment": "qr"})
        assert result["ok"] is True, result
        assert result["updated"]["path_segment"] == "qr"
        assert result["updated"]["public_url"].endswith("/qr/ToanToChill")

    def test_missing_segment_without_flag_asks_and_creates_nothing(self, superuser: Any) -> None:
        page = _page(superuser, "gioi-thieu")
        result = _run(superuser, "update_page", {"page_id": str(page.pk), "path_segment": "kp"})
        assert result["ok"] is False
        assert "create_path_if_missing" in result["error"]
        assert not PagePath.objects.filter(segment="kp").exists()

    def test_missing_segment_is_created_when_requested_and_allowed(self, superuser: Any) -> None:
        page = _page(superuser, "gioi-thieu")
        result = _run(
            superuser,
            "update_page",
            {"page_id": str(page.pk), "path_segment": "KP", "create_path_if_missing": True},
        )
        assert result["ok"] is True, result
        assert result["updated"]["path_segment"] == "kp"
        assert result["updated"]["public_url"].endswith("/kp/gioi-thieu")
        page.refresh_from_db()
        assert page.path.segment == "kp"
        assert PagePath.objects.filter(segment="kp", is_active=True).count() == 1

    def test_member_without_create_permission_cannot_create_segment(self, user: Any) -> None:
        grant(user, PagePermission.READ, PagePermission.UPDATE)
        user = type(user).objects.get(pk=user.pk)
        page = _page(user, "trang-member")
        result = _run(
            user,
            "update_page",
            {"page_id": str(page.pk), "path_segment": "kp", "create_path_if_missing": True},
        )
        assert result["ok"] is False
        assert not PagePath.objects.filter(segment="kp").exists()
        page.refresh_from_db()
        assert page.path.segment == "p"

    def test_member_with_create_permission_can_create_segment(self, user: Any) -> None:
        grant(user, PagePermission.READ, PagePermission.UPDATE, PagePathPermission.PATH_CREATE)
        user = type(user).objects.get(pk=user.pk)
        page = _page(user, "trang-member")
        result = _run(
            user,
            "update_page",
            {"page_id": str(page.pk), "path_segment": "kp", "create_path_if_missing": True},
        )
        assert result["ok"] is True, result
        assert PagePath.objects.filter(segment="kp").exists()

    def test_inactive_segment_is_rejected(self, superuser: Any) -> None:
        PagePath.objects.create(segment="cu", name="CU", is_active=False)
        page = _page(superuser, "trang-cu")
        result = _run(
            superuser,
            "update_page",
            {"page_id": str(page.pk), "path_segment": "cu", "create_path_if_missing": True},
        )
        assert result["ok"] is False
        page.refresh_from_db()
        assert page.path.segment == "p"

    def test_reserved_segment_is_rejected(self, superuser: Any) -> None:
        page = _page(superuser, "trang-admin")
        result = _run(
            superuser,
            "update_page",
            {"page_id": str(page.pk), "path_segment": "quan-tri", "create_path_if_missing": True},
        )
        assert result["ok"] is False
        assert not PagePath.objects.filter(segment="quan-tri").exists()

    def test_other_users_page_cannot_be_moved(self, superuser: Any) -> None:
        other_page = _page(UserFactory(), "trang-khac")
        result = _run(
            superuser,
            "update_page",
            {"page_id": str(other_page.pk), "path_segment": "kp", "create_path_if_missing": True},
        )
        assert result["ok"] is False
        assert not PagePath.objects.filter(segment="kp").exists()

    def test_create_page_on_new_segment(self, superuser: Any) -> None:
        result = _run(
            superuser,
            "create_page",
            {
                "title": "Giới thiệu",
                "slug": "GioiThieu",
                "path_segment": "kp",
                "create_path_if_missing": True,
            },
        )
        assert result["ok"] is True, result
        assert result["created"]["path_segment"] == "kp"
        assert result["created"]["public_url"].endswith("/kp/GioiThieu")

    def test_create_page_defaults_to_seeded_p_segment(self, superuser: Any) -> None:
        result = _run(superuser, "create_page", {"title": "Mặc định"})
        assert result["ok"] is True, result
        assert result["created"]["path_segment"] == "p"

    def test_router_sends_page_tools_for_path_request(self) -> None:
        schemas = build_assistant_tool_schemas(is_owner=True)
        selected = AssistantToolRouter().select(schemas, "đổi đường dẫn giữa trang giới thiệu sang kp")
        names = {schema["function"]["name"] for schema in selected or []}
        assert {"update_page", "list_pages", "list_my_records", "update_my_record"} <= names


class TestKnowledgeSyncAfterMigrate:
    def test_every_registry_resource_has_a_knowledge_chunk(self) -> None:
        sources = {item["source"] for item in AssistantKnowledgeService().load_sources()}
        for key in ASSISTANT_RECORD_RESOURCES:
            assert f"{RESOURCE_SOURCE_PREFIX}{key}" in sources

    def test_sync_after_migrate_loads_chunks_without_calling_gemini_on_test_db(self) -> None:
        AssistantKnowledgeChunk.objects.all().delete()
        client = MagicMock()
        client.is_configured.return_value = True
        result = AssistantKnowledgeService(embedding_client=client).sync_after_migrate(using="default")
        assert result is not None
        assert AssistantKnowledgeChunk.objects.filter(source__startswith=RESOURCE_SOURCE_PREFIX).exists()
        assert AssistantKnowledgeChunk.objects.filter(source="trang-ca-nhan-duong-dan-giua.md").exists()
        client.embed_documents.assert_not_called()
        client.embed_query.assert_not_called()

    def test_sync_after_migrate_swallows_database_errors(self) -> None:
        service = AssistantKnowledgeService()
        service.sync = MagicMock(side_effect=DatabaseError("relation missing"))  # type: ignore[method-assign]
        assert service.sync_after_migrate(using="default") is None

    def test_post_migrate_signal_is_connected(self) -> None:
        config = django_apps.get_app_config("workspace")
        handler = workspace_apps._sync_knowledge_after_migrate
        # `disconnect` trả True khi handler đang được nối; nối lại ngay để không ảnh hưởng test khác.
        assert post_migrate.disconnect(handler, sender=config) is True
        post_migrate.connect(handler, sender=config)
