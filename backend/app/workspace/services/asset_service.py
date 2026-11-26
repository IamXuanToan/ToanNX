"""Nghiệp vụ Thiết bị cá nhân: quy đổi tỷ giá, hạn bảo hành & hóa đơn riêng tư."""

from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.services.core_crud_service import CoreCrudService
from app.system.models.attachment import Attachment
from app.system.services.attachment_service import AttachmentService
from app.workspace.constants.workspace_defaults import AI_TOOL_ITEM_LIMIT
from app.workspace.models.asset import Asset
from app.workspace.permissions.asset_permission import AssetPermission
from app.workspace.repositories.asset_repository import AssetRepository
from app.workspace.services.workspace_alerts_cache_service import WorkspaceAlertsCacheService
from app.workspace.services.workspace_exchange_service import WorkspaceExchangeService
from app.workspace.utils.date_math import add_months_clamped
from app.workspace.utils.notification_channels import normalize_workspace_channels


class AssetService(CoreCrudService[Asset, AssetRepository]):
    """Quản lý thiết bị cá nhân của owner (mở toàn hệ thống với `workspace.asset.manage_all`)."""

    repository_class = AssetRepository
    owner_field = "owner"
    manage_all_permission = AssetPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: AssetRepository | None = None,
        exchange_service: WorkspaceExchangeService | None = None,
        attachment_service: AttachmentService | None = None,
        alerts_cache_service: WorkspaceAlertsCacheService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc quy đổi tỷ giá, file đính kèm và cache lịch."""
        super().__init__(repository or AssetRepository())
        self.exchange_service = exchange_service or WorkspaceExchangeService()
        self.attachment_service = attachment_service or AttachmentService()
        self.alerts_cache_service = alerts_cache_service or WorkspaceAlertsCacheService()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> Asset:
        """Tạo thiết bị mới: kiểm tỷ giá ngoại tệ, tính hạn BH và gắn hóa đơn riêng tư."""
        payload = dict(data)
        invoice_ids = payload.pop("invoice_attachment_ids", [])
        explicit_rate = payload.pop("exchange_rate", None)

        currency, rounded_price, rate, price_vnd = self.exchange_service.resolve_amount_vnd(
            payload.pop("currency_id"),
            payload["purchase_price"],
            payload["purchase_date"],
            explicit_rate=explicit_rate,
        )
        payload["currency"] = currency
        payload["purchase_price"] = rounded_price
        payload["exchange_rate"] = rate
        payload["purchase_price_vnd"] = price_vnd

        self._apply_warranty_dates(payload)
        if "notification_channels" in payload:
            payload["notification_channels"] = normalize_workspace_channels(payload["notification_channels"])

        asset = super().create(actor, payload)
        if invoice_ids:
            attachments = [
                self.attachment_service.set_visibility(actor, pk, Attachment.Visibility.PRIVATE)
                for pk in invoice_ids
            ]
            asset.invoice_attachments.set(attachments)
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()
        return asset

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> Asset:
        """Cập nhật thiết bị: tính lại tỷ giá nếu đổi tiền tệ/ngày/giá, cập nhật hóa đơn."""
        asset = self.get_for_write(actor, pk)
        payload = dict(data)
        invoice_ids = payload.pop("invoice_attachment_ids", None)

        money_keys = {"currency_id", "purchase_price", "purchase_date", "exchange_rate"}
        if money_keys & set(payload):
            currency_id = payload.pop("currency_id", asset.currency_id)
            raw_price = payload.get("purchase_price", asset.purchase_price)
            purchase_date = payload.get("purchase_date", asset.purchase_date)
            if "exchange_rate" in payload:
                explicit_rate = payload.pop("exchange_rate")
            elif currency_id == asset.currency_id and purchase_date == asset.purchase_date:
                explicit_rate = asset.exchange_rate
            else:
                explicit_rate = None

            currency, rounded_price, rate, price_vnd = self.exchange_service.resolve_amount_vnd(
                currency_id,
                raw_price,
                purchase_date,
                explicit_rate=explicit_rate,
            )
            payload["currency"] = currency
            payload["purchase_price"] = rounded_price
            payload["exchange_rate"] = rate
            payload["purchase_price_vnd"] = price_vnd

        self._apply_warranty_dates(payload, existing=asset)
        if "notification_channels" in payload:
            payload["notification_channels"] = normalize_workspace_channels(payload["notification_channels"])
        updated = self.repository.update(asset, actor=actor, **payload)

        if invoice_ids is not None:
            attachments = [
                self.attachment_service.set_visibility(actor, att_id, Attachment.Visibility.PRIVATE)
                for att_id in invoice_ids
            ]
            updated.invoice_attachments.set(attachments)

        self.alerts_cache_service.schedule_alerts_next_due_on_commit()
        return updated

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm thiết bị và cập nhật mốc cảnh báo."""
        super().delete(actor, pk)
        self.alerts_cache_service.schedule_alerts_next_due_on_commit()

    def sync_warranty_status(self, actor: Any, asset: Asset, new_status: str) -> Asset:
        """Đồng bộ trạng thái từ phiếu bảo hành (không để service khác chạm ORM Asset)."""
        if asset.status == new_status:
            return asset
        return self.repository.update(asset, actor=actor, status=new_status)

    def search_with_warranty_summary(
        self, actor: Any, query: str = "", status: str = ""
    ) -> tuple[list[Asset], int]:
        """Tra cứu thiết bị của chính `actor` cho AI Tool (luôn lọc `owner_id=actor.pk`)."""
        return self.repository.search_for_owner(
            actor.pk,
            query=query,
            status=status,
            limit=AI_TOOL_ITEM_LIMIT,
        )

    def count_expiring_before(self, owner_id: Any, today: date, days_ahead: int = 30) -> int:
        """Đếm số thiết bị sắp hết bảo hành trong `days_ahead` ngày."""
        return self.repository.count_expiring_before(owner_id, today, today + timedelta(days=days_ahead))

    def list_warranty_between(self, owner_id: Any, start_date: date, end_date: date) -> list[Asset]:
        """Thiết bị có hạn bảo hành rơi vào khoảng ngày (dùng cho Calendar)."""
        return self.repository.list_with_warranty_between(owner_id, start_date, end_date)

    def sum_purchase_vnd(self, owner_id: Any, start_date: date, end_date: date) -> Decimal:
        """Tổng tiền mua thiết bị VNĐ trong khoảng ngày."""
        return self.repository.sum_purchase_vnd(owner_id, start_date, end_date)

    def _apply_warranty_dates(self, payload: dict[str, Any], *, existing: Asset | None = None) -> None:
        """Điền mặc định `warranty_start_date` = `purchase_date` và tự tính `warranty_end_date`."""
        warranty_type = payload.get(
            "warranty_type", existing.warranty_type if existing else Asset.WarrantyType.MANUFACTURER
        )
        purchase_date = payload.get(
            "purchase_date", existing.purchase_date if existing else timezone.localdate()
        )
        if existing is None:
            start = payload.get("warranty_start_date") or purchase_date
            months = payload.get("warranty_months")
            if warranty_type != Asset.WarrantyType.NONE and payload.get("warranty_start_date") is None:
                payload["warranty_start_date"] = start
            if (
                warranty_type != Asset.WarrantyType.NONE
                and payload.get("warranty_end_date") is None
                and months
                and int(months) > 0
            ):
                payload["warranty_end_date"] = add_months_clamped(start, int(months), anchor_day=start.day)
            return

        warranty_changed = any(
            k in payload for k in ("warranty_type", "warranty_months", "warranty_start_date", "purchase_date")
        )
        if warranty_changed and "warranty_end_date" not in payload:
            start = payload.get("warranty_start_date", existing.warranty_start_date) or purchase_date
            months = payload.get("warranty_months", existing.warranty_months)
            if warranty_type != Asset.WarrantyType.NONE and months and int(months) > 0:
                payload["warranty_end_date"] = add_months_clamped(start, int(months), anchor_day=start.day)
