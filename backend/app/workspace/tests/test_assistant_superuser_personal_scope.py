"""Superuser chat với Trợ lý vẫn CHỈ thấy và sửa dữ liệu cá nhân của mình (không lộ dữ liệu người khác)."""

import json
from datetime import timedelta
from decimal import Decimal
from typing import Any

import pytest
from django.utils import timezone

from app.core.security.secret_cipher import SecretCipher
from app.finance.models.income import Income
from app.system.models.currency import Currency
from app.system.tests.factories.user_factory import UserFactory
from app.system.tests.helpers.permission_helper import grant
from app.utilities.models.page import Page
from app.utilities.models.page_path import PagePath
from app.utilities.models.qr_code import QrCode
from app.utilities.models.short_link import ShortLink
from app.utilities.permissions.qr_code_permission import QrCodePermission
from app.workspace.constants.assistant_tool_permissions import DELETE_RESOURCE_PERMISSION_MAP
from app.workspace.models.asset import Asset
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim
from app.workspace.models.reminder import Reminder
from app.workspace.models.subscription import Subscription
from app.workspace.models.vault_item import VaultItem
from app.workspace.services.assistant_tools_service import AssistantToolsService
from app.workspace.tests.helpers.assistant_generic_records import make_generic_records

pytestmark = pytest.mark.django_db
OWN = "CuaToi"
OTHER = "CuaNguoiKhac"


def _make_records(owner: Any, tag: str, vnd: Currency, *, slug_suffix: str) -> dict[str, Any]:
    today = timezone.localdate()
    asset = Asset.objects.create(owner=owner, name=f"May {tag}", purchase_date=today, currency=vnd)
    records: dict[str, Any] = {
        "reminder": Reminder.objects.create(owner=owner, title=f"Viec {tag}", due_date=today),
        "short_link": ShortLink.objects.create(
            owner=owner, name=f"Link {tag}", slug=f"lk-{slug_suffix}", destination_url="https://a.example/"
        ),
        "vault_item": VaultItem.objects.create(
            owner=owner,
            title=f"Ket {tag}",
            secret_encrypted=SecretCipher().encrypt("workspace.vault.secret", f"bimat-{tag}"),
            secret_last4="1234",
        ),
        "asset": asset,
        "warranty_claim": AssetWarrantyClaim.objects.create(
            owner=owner,
            asset=asset,
            claim_code=f"BH-{slug_suffix}",
            submitted_date=today,
            service_center="TTBH",
            issue_description=f"Loi {tag}",
            currency=vnd,
        ),
        "subscription": Subscription.objects.create(
            owner=owner, name=f"DV {tag}", currency=vnd, renew_date=today + timedelta(days=3)
        ),
        "income": Income.objects.create(
            owner=owner,
            source=Income.Source.MANUAL,
            received_at=timezone.now(),
            received_date=today,
            currency=vnd,
            original_amount=Decimal("100000"),
            amount=Decimal("100000"),
            amount_status=Income.AmountStatus.OK,
            content=f"Thu {tag}",
        ),
        "page": Page.objects.create(
            owner=owner,
            path=PagePath.objects.get(segment="p"),
            title=f"Trang {tag}",
            slug=f"pg-{slug_suffix}",
        ),
    }
    records.update(make_generic_records(owner, tag, vnd, suffix=slug_suffix, page=records["page"]))
    grant(owner, QrCodePermission.CREATE, QrCodePermission.READ)
    actor = type(owner).objects.get(pk=owner.pk)
    created = AssistantToolsService().execute_tool(
        actor, "create_qr_code", {"name": f"QR {tag}", "content_text": f"noi dung {tag}"}, is_owner=True
    )
    assert created["ok"] is True, created
    records["qr_code"] = QrCode.objects.get(pk=created["created"]["id"])
    return records


@pytest.fixture
def scene(superuser: Any, vnd: Currency) -> dict[str, Any]:
    other = UserFactory()
    return {
        "actor": superuser,
        "own": _make_records(superuser, OWN, vnd, slug_suffix="own"),
        "other": _make_records(other, OTHER, vnd, slug_suffix="other"),
    }


READ_TOOLS: list[tuple[str, dict[str, Any]]] = [
    ("get_pending_reminders", {"scope": "all"}),
    ("list_short_links", {}),
    ("list_qr_codes", {}),
    ("list_vault_items", {}),
    ("get_assets_and_warranty", {}),
    ("list_warranty_claims", {}),
    ("get_upcoming_subscriptions", {"days_ahead": 30}),
    ("list_pages", {}),
    ("get_upcoming_events", {"days_ahead": 30}),
    ("get_finance_income_summary", {"days": 7}),
    ("get_personal_statistics", {}),
    *[("list_my_records", {"resource": key}) for key in ("invoice", "platform", "file", "donation")],
    ("list_my_records", {"resource": "subscription_payment"}),
]


LISTING_TOOLS = frozenset(
    {
        "get_pending_reminders",
        "list_short_links",
        "list_qr_codes",
        "list_vault_items",
        "get_assets_and_warranty",
        "list_warranty_claims",
        "get_upcoming_subscriptions",
        "list_pages",
        "list_my_records",
    }
)


class TestSuperuserPersonalScope:
    @pytest.mark.parametrize(("tool", "args"), READ_TOOLS, ids=[item[0] for item in READ_TOOLS])
    def test_read_tools_never_return_other_users_data(
        self, scene: dict[str, Any], tool: str, args: dict[str, Any]
    ) -> None:
        result = AssistantToolsService().execute_tool(scene["actor"], tool, dict(args), is_owner=True)
        assert result.get("ok") is True, result
        dumped = json.dumps(result, ensure_ascii=False, default=str)
        assert OTHER not in dumped
        assert "bimat-" not in dumped
        if tool in LISTING_TOOLS:
            # Chiều thuận: vẫn thấy dữ liệu của chính mình (test không "xanh rỗng").
            assert OWN in dumped, dumped

    def test_income_summary_counts_only_own_amount(self, scene: dict[str, Any]) -> None:
        result = AssistantToolsService().execute_tool(
            scene["actor"], "get_finance_income_summary", {"days": 7}
        )
        assert result["total_vnd"] == 100000

    @pytest.mark.parametrize(
        ("tool", "id_arg", "resource", "changes"),
        [
            ("update_reminder", "reminder_id", "reminder", {"title": "Hack"}),
            ("update_short_link", "short_link_id", "short_link", {"name": "Hack"}),
            ("update_qr_code", "qr_code_id", "qr_code", {"name": "Hack"}),
            ("update_vault_item", "vault_item_id", "vault_item", {"title": "Hack"}),
            ("update_asset", "asset_id", "asset", {"name": "Hack"}),
            ("update_warranty_claim", "claim_id", "warranty_claim", {"service_center": "Hack"}),
            ("update_subscription", "subscription_id", "subscription", {"name": "Hack"}),
            ("update_finance_income", "income_id", "income", {"content": "Hack"}),
            ("update_page", "page_id", "page", {"title": "Hack"}),
            ("reveal_vault_secret", "vault_item_id", "vault_item", {}),
            ("renew_subscription", "subscription_id", "subscription", {}),
        ],
    )
    def test_write_tools_reject_other_users_records(
        self, scene: dict[str, Any], tool: str, id_arg: str, resource: str, changes: dict[str, Any]
    ) -> None:
        target = scene["other"][resource]
        before = type(target).objects.get(pk=target.pk)
        result = AssistantToolsService().execute_tool(
            scene["actor"], tool, {id_arg: str(target.pk), **changes}, is_owner=True
        )
        assert result.get("ok") is False, result
        assert "bimat-" not in json.dumps(result, ensure_ascii=False, default=str)
        after = type(target).objects.get(pk=target.pk)
        assert after.updated_at == before.updated_at

    def test_write_tool_still_works_on_own_record(self, scene: dict[str, Any]) -> None:
        own = scene["own"]["short_link"]
        result = AssistantToolsService().execute_tool(
            scene["actor"],
            "update_short_link",
            {"short_link_id": str(own.pk), "name": "Đổi tên"},
            is_owner=True,
        )
        assert result["ok"] is True
        own.refresh_from_db()
        assert own.name == "Đổi tên"

    @pytest.mark.parametrize("resource", sorted(DELETE_RESOURCE_PERMISSION_MAP.keys()))
    def test_delete_rejects_other_users_records(self, scene: dict[str, Any], resource: str) -> None:
        target = scene["other"][resource]
        result = AssistantToolsService().execute_tool(
            scene["actor"],
            "delete_personal_record",
            {"resource_type": resource, "record_id": str(target.pk), "confirmed": True},
            is_owner=True,
            conversation_id="",
            turn_id="t2",
        )
        assert result.get("ok") is False
        assert type(target).objects.filter(pk=target.pk, deleted_at__isnull=True).exists()

    def test_superuser_tool_list_has_no_admin_tools(self, superuser: Any) -> None:
        names = {
            schema["function"]["name"] for schema in AssistantToolsService().tool_schemas(actor=superuser)
        }
        forbidden = ("user", "role", "permission", "setting", "webhook", "callback", "session", "config")
        admin_like = [name for name in names if any(word in name for word in forbidden)]
        assert admin_like == []
