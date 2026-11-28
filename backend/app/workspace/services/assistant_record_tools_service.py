"""Tool chung `list_my_records` / `update_my_record`: đọc & sửa mọi tài nguyên Client Portal khai trong
registry.

Luật giống hệt API giao diện: quyền RBAC theo từng tài nguyên, dữ liệu sửa đi qua serializer validate của
chính API,
và luôn ép lọc chủ sở hữu = người đang chat (kể cả superuser/`manage_all`).
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from django.db.models import Q

from app.finance.services.invoice_service import InvoiceService
from app.finance.services.platform_service import PlatformService
from app.system.services.attachment_service import AttachmentService
from app.utilities.services.donation_transaction_service import DonationTransactionService
from app.utilities.services.page_path_service import PagePathService
from app.workspace.constants.assistant_record_resources import ASSISTANT_RECORD_RESOURCES
from app.workspace.constants.workspace_defaults import AI_TOOL_ITEM_LIMIT
from app.workspace.services.subscription_payment_service import SubscriptionPaymentService
from app.workspace.types.assistant_record_resource import AssistantRecordResource


class AssistantRecordToolsService:
    """Đọc/sửa tài nguyên Portal theo registry; không có tool riêng cho từng loại."""

    def __init__(
        self,
        invoice_service: InvoiceService | None = None,
        platform_service: PlatformService | None = None,
        donation_service: DonationTransactionService | None = None,
        attachment_service: AttachmentService | None = None,
        subscription_payment_service: SubscriptionPaymentService | None = None,
        page_path_service: PagePathService | None = None,
    ) -> None:
        """Khởi tạo service của từng tài nguyên trong registry (tên thuộc tính khớp `service_attr`)."""
        self.invoice_service = invoice_service or InvoiceService()
        self.platform_service = platform_service or PlatformService()
        self.donation_service = donation_service or DonationTransactionService()
        self.attachment_service = attachment_service or AttachmentService()
        self.subscription_payment_service = subscription_payment_service or SubscriptionPaymentService()
        self.page_path_service = page_path_service or PagePathService()

    def readable_resources(self, actor: Any) -> list[str]:
        """Tài nguyên người dùng có quyền đọc (để mô tả tool)."""
        return [
            key
            for key, resource in ASSISTANT_RECORD_RESOURCES.items()
            if self._can(actor, resource.read_permission)
        ]

    def list_records(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Liệt kê tối đa 15 bản ghi của chính người dùng, lọc theo từ khóa (`query`)."""
        resource, error = self._resource(args)
        if resource is None:
            return {"ok": False, "error": error}
        if not self._can(actor, resource.read_permission):
            return {"ok": False, "error": f"Bạn chưa được cấp quyền `{resource.read_permission}`."}
        queryset = getattr(self, resource.service_attr).get_queryset_for(actor)
        if resource.owner_field:
            queryset = queryset.filter(**{resource.owner_field: actor.pk})
        if resource.base_filter:
            queryset = queryset.filter(**resource.base_filter)
        query = str(args.get("query") or "").strip()
        if query and resource.search_fields:
            condition = Q()
            for field_name in resource.search_fields:
                condition |= Q(**{f"{field_name}__unaccent__icontains": query})
            queryset = queryset.filter(condition)
        total = queryset.count()
        rows = list(queryset.order_by(*resource.ordering)[:AI_TOOL_ITEM_LIMIT])
        return {
            "ok": True,
            "resource": resource.key,
            "label": resource.label,
            "total_count": total,
            "items": [self._serialize(resource, row) for row in rows],
            "note": resource.note,
        }

    def update_record(self, actor: Any, args: dict[str, Any]) -> dict[str, Any]:
        """Sửa một bản ghi của chính người dùng; dữ liệu kiểm bằng serializer validate của API."""
        resource, error = self._resource(args)
        if resource is None:
            return {"ok": False, "error": error}
        if resource.update_serializer is None or not resource.update_permission:
            return {"ok": False, "error": f"Không sửa {resource.label} qua Trợ lý. {resource.note}".strip()}
        if not self._can(actor, resource.update_permission):
            return {"ok": False, "error": f"Bạn chưa được cấp quyền `{resource.update_permission}`."}
        record_id = str(args.get("record_id") or "").strip()
        fields = args.get("fields")
        if not record_id or not isinstance(fields, dict) or not fields:
            return {"ok": False, "error": "Cần `record_id` và `fields` (các trường muốn sửa)."}
        serializer = resource.update_serializer(data=fields, partial=True)
        if not serializer.is_valid():
            return {"ok": False, "error": "Dữ liệu không hợp lệ.", "details": serializer.errors}
        service = getattr(self, resource.service_attr)
        record = service.get_for_write(actor, record_id)
        if resource.owner_field and getattr(record, f"{resource.owner_field}_id", None) != actor.pk:
            return {"ok": False, "error": f"Chỉ được sửa {resource.label} của chính bạn."}
        updated = service.update(actor, record.pk, dict(serializer.validated_data))
        return {"ok": True, "updated": {"resource": resource.key, **self._serialize(resource, updated)}}

    # ------------------------------------------------------------------ Nội bộ
    def _resource(self, args: dict[str, Any]) -> tuple[AssistantRecordResource | None, str]:
        key = str(args.get("resource") or "").strip()
        resource = ASSISTANT_RECORD_RESOURCES.get(key)
        if resource is None:
            return (
                None,
                f"Loại dữ liệu '{key}' không hỗ trợ. Hợp lệ: {', '.join(ASSISTANT_RECORD_RESOURCES)}.",
            )
        return resource, ""

    def _can(self, actor: Any, permission: str) -> bool:
        return bool(getattr(actor, "is_superuser", False) or (permission and actor.has_perm(permission)))

    def _serialize(self, resource: AssistantRecordResource, row: Any) -> dict[str, Any]:
        data: dict[str, Any] = {"id": str(row.pk)}
        for field_path in resource.list_fields:
            data[field_path.replace("__", "_")] = self._value(row, field_path)
        title_parts = [str(self._value(row, name) or "") for name in resource.title_fields]
        data["title"] = " — ".join(part for part in title_parts if part) or str(row)
        return data

    def _value(self, row: Any, field_path: str) -> Any:
        current: Any = row
        parts = field_path.split("__")
        for index, part in enumerate(parts):
            if current is None:
                return None
            display = getattr(current, f"get_{part}_display", None)
            if index == len(parts) - 1 and callable(display):
                return display()
            current = getattr(current, part, None)
        if isinstance(current, datetime | date):
            return current.isoformat()
        if isinstance(current, Decimal):
            return str(current)
        return current
