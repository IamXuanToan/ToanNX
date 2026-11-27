"""Nghiệp vụ Phiếu Bảo hành & Sửa chữa: sinh mã BH-YYYYMM-NNN, đồng bộ trạng thái thiết bị."""

from decimal import Decimal
from typing import Any

from django.db import IntegrityError, transaction

from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.system.models.attachment import Attachment
from app.system.services.attachment_service import AttachmentService
from app.workspace.constants.workspace_error_code import WorkspaceErrorCode
from app.workspace.models.asset import Asset
from app.workspace.models.asset_warranty_claim import AssetWarrantyClaim
from app.workspace.permissions.asset_warranty_claim_permission import AssetWarrantyClaimPermission
from app.workspace.repositories.asset_warranty_claim_repository import (
    OPEN_STATUSES,
    AssetWarrantyClaimRepository,
)
from app.workspace.services.asset_service import AssetService
from app.workspace.services.workspace_exchange_service import WorkspaceExchangeService
from app.workspace.utils.date_math import add_months_clamped

MAX_CLAIM_CODE_RETRIES = 5
DEVICE_BUSY_STATUSES = (
    Asset.Status.IN_USE,
    Asset.Status.BACKUP,
    Asset.Status.IN_WARRANTY,
    Asset.Status.IN_REPAIR,
)


class AssetWarrantyClaimService(CoreCrudService[AssetWarrantyClaim, AssetWarrantyClaimRepository]):
    """Quản lý lịch sử gửi bảo hành/sửa chữa và tự đồng bộ trạng thái Asset."""

    repository_class = AssetWarrantyClaimRepository
    owner_field = "owner"
    manage_all_permission = AssetWarrantyClaimPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: AssetWarrantyClaimRepository | None = None,
        asset_service: AssetService | None = None,
        exchange_service: WorkspaceExchangeService | None = None,
        attachment_service: AttachmentService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc AssetService, tỷ giá và hóa đơn riêng tư."""
        super().__init__(repository or AssetWarrantyClaimRepository())
        self.asset_service = asset_service or AssetService()
        self.exchange_service = exchange_service or WorkspaceExchangeService()
        self.attachment_service = attachment_service or AttachmentService()

    @transaction.atomic
    def create(self, actor: Any, data: dict[str, Any]) -> AssetWarrantyClaim:
        """Tạo phiếu bảo hành cho thiết bị thuộc owner và đồng bộ trạng thái thiết bị."""
        payload = dict(data)
        asset_id = payload.pop("asset_id")
        asset = self.asset_service.get_by_id_for(actor, asset_id)
        owner = asset.owner

        attachment_ids = payload.pop("attachment_ids", [])
        explicit_rate = payload.pop("exchange_rate", None)
        self._validate_dates(payload)

        currency, rounded_cost, rate, cost_vnd = self.exchange_service.resolve_amount_vnd(
            payload.pop("currency_id"),
            payload.get("cost", Decimal("0")),
            payload["submitted_date"],
            explicit_rate=explicit_rate,
        )
        payload["currency"] = currency
        payload["cost"] = rounded_cost
        payload["exchange_rate"] = rate
        payload["cost_vnd"] = cost_vnd
        self._apply_part_warranty_end(payload)

        explicit_code = str(payload.pop("claim_code", "") or "").strip()
        if explicit_code:
            if self.repository.find_one(owner_id=owner.pk, claim_code=explicit_code) is not None:
                raise ConflictError(
                    "Mã phiếu bảo hành đã tồn tại.",
                    code=WorkspaceErrorCode.CLAIM_CODE_CONFLICT,
                    details={"claim_code": ["Mã phiếu bảo hành đã tồn tại."]},
                )
            claim = self.repository.create(
                actor=actor, owner=owner, asset=asset, claim_code=explicit_code, **payload
            )
        else:
            claim = self._create_with_generated_code(actor, owner, asset, payload)

        if attachment_ids:
            files = [
                self.attachment_service.set_visibility(actor, att_id, Attachment.Visibility.PRIVATE)
                for att_id in attachment_ids
            ]
            claim.attachments.set(files)

        self._sync_parent_asset_status(actor, asset)
        return claim

    @transaction.atomic
    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> AssetWarrantyClaim:
        """Cập nhật phiếu bảo hành, tính lại chi phí & trạng thái thiết bị cha."""
        claim = self.get_for_write(actor, pk)
        payload = dict(data)
        attachment_ids = payload.pop("attachment_ids", None)

        if "asset_id" in payload:
            new_asset = self.asset_service.get_by_id_for(actor, payload.pop("asset_id"))
            payload["asset"] = new_asset
        else:
            new_asset = claim.asset

        if "claim_code" in payload:
            new_code = str(payload["claim_code"] or "").strip()
            if not new_code:
                raise ValidationError(details={"claim_code": ["Mã phiếu không được để trống."]})
            existing = self.repository.find_one(owner_id=claim.owner_id, claim_code=new_code)
            if existing is not None and existing.pk != claim.pk:
                raise ConflictError(
                    "Mã phiếu bảo hành đã tồn tại.",
                    code=WorkspaceErrorCode.CLAIM_CODE_CONFLICT,
                    details={"claim_code": ["Mã phiếu bảo hành đã tồn tại."]},
                )
            payload["claim_code"] = new_code

        merged_dates = {
            "submitted_date": payload.get("submitted_date", claim.submitted_date),
            "returned_date": payload.get("returned_date", claim.returned_date),
        }
        self._validate_dates(merged_dates)

        if {"currency_id", "cost", "submitted_date", "exchange_rate"} & set(payload):
            currency_id = payload.pop("currency_id", claim.currency_id)
            raw_cost = payload.get("cost", claim.cost)
            submitted_date = payload.get("submitted_date", claim.submitted_date)
            if "exchange_rate" in payload:
                explicit_rate = payload.pop("exchange_rate")
            elif currency_id == claim.currency_id and submitted_date == claim.submitted_date:
                explicit_rate = claim.exchange_rate
            else:
                explicit_rate = None

            currency, rounded_cost, rate, cost_vnd = self.exchange_service.resolve_amount_vnd(
                currency_id,
                raw_cost,
                submitted_date,
                explicit_rate=explicit_rate,
            )
            payload["currency"] = currency
            payload["cost"] = rounded_cost
            payload["exchange_rate"] = rate
            payload["cost_vnd"] = cost_vnd

        self._apply_part_warranty_end(payload, existing=claim)

        old_asset = claim.asset
        updated = self.repository.update(claim, actor=actor, **payload)

        if attachment_ids is not None:
            files = [
                self.attachment_service.set_visibility(actor, att_id, Attachment.Visibility.PRIVATE)
                for att_id in attachment_ids
            ]
            updated.attachments.set(files)

        self._sync_parent_asset_status(actor, updated.asset)
        if old_asset.pk != updated.asset.pk:
            self._sync_parent_asset_status(actor, old_asset)
        return updated

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Xóa mềm phiếu bảo hành và đưa thiết bị về `IN_USE` nếu không còn phiếu mở."""
        claim = self.get_for_write(actor, pk)
        asset = claim.asset
        self.repository.delete(claim, actor=actor)
        self._sync_parent_asset_status(actor, asset)

    def _create_with_generated_code(
        self, actor: Any, owner: Any, asset: Asset, payload: dict[str, Any]
    ) -> AssetWarrantyClaim:
        """Sinh mã `BH-YYYYMM-NNN` có retry chống trùng khi tạo đồng thời."""
        prefix = f"BH-{payload['submitted_date']:%Y%m}-"
        base_seq = self.repository.count_with_code_prefix(owner.pk, prefix) + 1
        for offset in range(MAX_CLAIM_CODE_RETRIES):
            candidate = f"{prefix}{base_seq + offset:03d}"
            try:
                with transaction.atomic():
                    return self.repository.create(
                        actor=actor, owner=owner, asset=asset, claim_code=candidate, **payload
                    )
            except IntegrityError:
                continue
        raise ConflictError(
            "Không thể cấp mã phiếu bảo hành tự động do trùng lặp đồng thời.",
            code=WorkspaceErrorCode.CLAIM_CODE_CONFLICT,
        )

    def _sync_parent_asset_status(self, actor: Any, asset: Asset) -> None:
        """Đang có phiếu mở → `IN_WARRANTY`/`IN_REPAIR`; đóng hết phiếu → về `IN_USE`."""
        if asset.status not in DEVICE_BUSY_STATUSES:
            return
        open_claim = (
            self.repository.filter(asset_id=asset.pk, status__in=OPEN_STATUSES)
            .order_by("-submitted_date", "-created_at")
            .first()
        )
        if open_claim is not None:
            target = (
                Asset.Status.IN_WARRANTY
                if open_claim.claim_type == AssetWarrantyClaim.ClaimType.WARRANTY
                else Asset.Status.IN_REPAIR
            )
            self.asset_service.sync_warranty_status(actor, asset, target)
            return

        if asset.status in (Asset.Status.IN_WARRANTY, Asset.Status.IN_REPAIR):
            self.asset_service.sync_warranty_status(actor, asset, Asset.Status.IN_USE)

    def _validate_dates(self, payload: dict[str, Any]) -> None:
        submitted = payload.get("submitted_date")
        returned = payload.get("returned_date")
        if submitted and returned and returned < submitted:
            raise ValidationError(
                "Ngày nhận lại không được trước ngày gửi.",
                details={"returned_date": ["Ngày nhận lại phải lớn hơn hoặc bằng ngày gửi."]},
            )

    def _apply_part_warranty_end(
        self, payload: dict[str, Any], *, existing: AssetWarrantyClaim | None = None
    ) -> None:
        if "part_warranty_end_date" in payload and payload["part_warranty_end_date"] is not None:
            return
        returned = payload.get("returned_date", existing.returned_date if existing else None)
        months = payload.get("part_warranty_months", existing.part_warranty_months if existing else None)
        if returned and months and int(months) > 0:
            payload["part_warranty_end_date"] = add_months_clamped(
                returned, int(months), anchor_day=returned.day
            )
