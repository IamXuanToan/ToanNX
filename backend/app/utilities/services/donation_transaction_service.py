"""Service xử lý giao dịch quyên góp (DonationTransaction): ingest webhook, thống kê, kiểm duyệt, xuất CSV."""

import csv
import io
import logging
import re
from datetime import timedelta
from decimal import Decimal
from typing import Any
from zoneinfo import ZoneInfo

from django.core.exceptions import ObjectDoesNotExist
from django.db import DatabaseError, transaction
from django.db.models import Count, Q, QuerySet, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.core.services.core_crud_service import CoreCrudService
from app.finance.models.income import Income
from app.finance.models.platform import Platform
from app.finance.utils.vn_time import parse_sepay_datetime
from app.system.models.currency import Currency
from app.utilities.constants.donation_constants import DEFAULT_TIER_EXPIRY_DAYS
from app.utilities.models.donation_transaction import DonationTransaction
from app.utilities.models.page import Page
from app.utilities.permissions.donation_permission import DonationPermission
from app.utilities.repositories.donation_transaction_repository import DonationTransactionRepository
from app.utilities.services.donation_content_filter import DonationContentFilter
from app.utilities.services.donation_gift_classifier import DonationGiftClassifier

logger = logging.getLogger(__name__)


class DonationTransactionService(CoreCrudService[DonationTransaction, DonationTransactionRepository]):
    """Nghiệp vụ quyên góp: tự động bóc tách webhook, phân quyền 1 người vs tất cả."""

    repository_class = DonationTransactionRepository
    owner_field = "owner"
    manage_all_permission = DonationPermission.MANAGE_ALL.code

    def __init__(
        self,
        repository: DonationTransactionRepository | None = None,
        content_filter: DonationContentFilter | None = None,
        gift_classifier: DonationGiftClassifier | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        super().__init__(repository or DonationTransactionRepository())
        self.content_filter = content_filter or DonationContentFilter()
        self.gift_classifier = gift_classifier or DonationGiftClassifier()

    def find_page_and_qr_by_token(self, webhook_token: str) -> tuple[Page, dict[str, Any]] | None:
        """Tìm trang Donate và mã QR có cấu hình khớp với webhook_token."""
        if not webhook_token:
            return None

        # Quét các trang DONATION còn hoạt động
        candidate_pages = Page.objects.filter(
            deleted_at__isnull=True,
            page_type=Page.PageType.DONATION,
        ).select_related("owner")

        for page in candidate_pages:
            config = page.content_config or {}
            qr_codes = config.get("qrCodes") or config.get("qr_codes") or []
            if isinstance(qr_codes, list):
                for item in qr_codes:
                    if not isinstance(item, dict):
                        continue
                    token = item.get("webhookToken") or item.get("webhook_token")
                    enabled = item.get("webhookEnabled") or item.get("webhook_enabled")
                    if enabled and token and token == webhook_token:
                        return page, item

        return None

    @transaction.atomic
    def ingest_webhook(self, webhook_token: str, payload: dict[str, Any]) -> tuple[DonationTransaction, bool]:
        """Tiếp nhận webhook SePay theo webhook_token của mã QR.

        Raises:
            NotFoundError: Không tìm thấy trang hoặc mã QR có token này.
            ValidationError: Payload thiếu thông tin bắt buộc.
        """
        match = self.find_page_and_qr_by_token(webhook_token)
        if match is None:
            raise NotFoundError("Không tìm thấy cấu hình mã QR tương ứng với webhook token này.")

        page, qr_item = match
        sepay_id = str(payload.get("id") or "")
        if not sepay_id:
            raise ValidationError("Payload SePay thiếu trường id giao dịch.")

        # Kiểm tra chống ghi nhận trùng lặp
        existing = DonationTransaction.objects.filter(sepay_id=sepay_id).first()
        if existing is not None:
            return existing, False

        # Đọc dữ liệu giao dịch
        try:
            amount = int(Decimal(str(payload.get("transferAmount") or 0)))
        except (ValueError, TypeError):
            amount = 0

        raw_content = str(payload.get("content") or payload.get("description") or "")
        received_at = parse_sepay_datetime(payload.get("transactionDate")) or timezone.now()

        # Kiểm duyệt từ ngữ
        is_censored = self.content_filter.is_censored(raw_content)

        # Lọc lời nhắn (bỏ tiền tố donate nếu có)
        message = ""
        if not is_censored and raw_content:
            clean_msg = re.sub(
                r"^(?:donate|ủng\s*hộ|ung\s*ho)\s*", "", raw_content, flags=re.IGNORECASE
            ).strip()
            message = clean_msg[:500]

        # Phân loại quà tặng & bậc vinh danh
        gift_type, gift_label = self.gift_classifier.classify_gift(amount, raw_content)
        tier = self.gift_classifier.classify_tier(amount)

        # Tính thời hạn vinh danh đếm ngược
        tier_expires_at = None
        if tier != DonationTransaction.Tier.NORMAL:
            config = page.content_config or {}
            expiry_days = int(config.get("leaderboardDays") or DEFAULT_TIER_EXPIRY_DAYS)
            tier_expires_at = timezone.now() + timedelta(days=expiry_days)

        # Danh xưng tri ân xoay vòng
        donor_title = self.gift_classifier.get_donor_title(sepay_id)

        # Lưu giao dịch
        donation = self.repository.create(
            actor=page.owner,
            page=page,
            qr_item_id=str(qr_item.get("id") or ""),
            owner=page.owner,
            sepay_id=sepay_id,
            amount=amount,
            donor_title=donor_title,
            message=message,
            original_content=raw_content,
            gift_type=gift_type,
            gift_label=gift_label,
            tier=tier,
            tier_expires_at=tier_expires_at,
            is_hidden=False,
            is_censored=is_censored,
            received_at=received_at,
        )

        self._sync_to_finance_income(donation)
        return donation, True

    def _sync_to_finance_income(self, donation: DonationTransaction) -> None:
        """Đồng bộ giao dịch quyên góp SePay sang bản ghi Thu nhập (Income) của module Finance."""
        try:
            currency = Currency.objects.filter(code="VND", deleted_at__isnull=True).first()
            if not currency:
                currency = Currency.objects.filter(is_base=True, deleted_at__isnull=True).first()
            if not currency:
                return

            platform, _ = Platform.objects.get_or_create(
                owner=donation.owner,
                code="sepay_donation",
                defaults={
                    "name": "Ủng hộ & Quyên góp SePay",
                    "default_currency": currency,
                    "created_by": donation.owner,
                },
            )

            vn_tz = ZoneInfo("Asia/Ho_Chi_Minh")
            received_vn = donation.received_at.astimezone(vn_tz)
            content = donation.original_content or donation.message or f"Ủng hộ trang {donation.page.title}"

            Income.objects.update_or_create(
                owner=donation.owner,
                sepay_id=donation.sepay_id,
                defaults={
                    "source": Income.Source.SEPAY,
                    "received_at": donation.received_at,
                    "received_date": received_vn.date(),
                    "content": content,
                    "currency": currency,
                    "original_amount": Decimal(str(donation.amount)),
                    "amount": Decimal(str(donation.amount)),
                    "exchange_rate": Decimal("1.0"),
                    "platform": platform,
                    "tax_withheld": False,
                    "tax_rate": Decimal("0.0"),
                    "tax_amount": Decimal("0.0"),
                    "amount_status": Income.AmountStatus.OK,
                    "tax_status": Income.TaxStatus.NOT_WITHHELD,
                    "created_by": donation.owner,
                },
            )
        except (DatabaseError, ObjectDoesNotExist, ValueError) as exc:
            logger.warning("Lỗi đồng bộ giao dịch quyên góp sang thu nhập tài chính: %s", exc)

    def list_public_feed(self, page_id: Any, limit: int = 20, page: int = 1) -> list[dict[str, Any]]:
        """Lấy danh sách các lượt ủng hộ công khai cho trang Donate (hỗ trợ phân trang cuộn)."""
        page_obj = Page.objects.filter(id=page_id, deleted_at__isnull=True).first()
        if not page_obj:
            return []

        # Kiểm tra cờ ẩn số tiền của cấp trang hoặc của từng mã QR
        config = page_obj.content_config or {}
        is_page_hidden = bool(config.get("hideAmount") or config.get("hide_amount"))
        qr_codes = config.get("qrCodes") or config.get("qr_codes") or []
        hidden_amount_qr_ids = set()
        any_qr_hidden = False
        if isinstance(qr_codes, list):
            for q in qr_codes:
                if isinstance(q, dict) and (q.get("hideAmount") or q.get("hide_amount")):
                    any_qr_hidden = True
                    hidden_amount_qr_ids.add(str(q.get("id") or ""))

        offset = max(0, (page - 1) * limit)
        transactions = DonationTransaction.objects.filter(
            page_id=page_id,
            deleted_at__isnull=True,
            is_hidden=False,
            is_censored=False,
        ).order_by("-received_at")[offset : offset + limit]

        results = []
        for tx in transactions:
            hide_amount = is_page_hidden or (tx.qr_item_id in hidden_amount_qr_ids) or any_qr_hidden
            results.append(
                {
                    "id": str(tx.id),
                    "donor_title": tx.donor_title,
                    "amount": None if hide_amount else tx.amount,
                    "hide_amount": hide_amount,
                    "gift_type": tx.gift_type,
                    "gift_label": tx.gift_label,
                    "tier": tx.tier,
                    "tier_expires_at": tx.tier_expires_at.isoformat() if tx.tier_expires_at else None,
                    "message": tx.message,
                    "received_at": tx.received_at.isoformat(),
                }
            )

        return results

    def list_public_leaderboard(self, page_id: Any) -> list[dict[str, Any]]:
        """Lấy danh sách Bảng Vinh danh (Đồng, Bạc, Vàng) còn hiệu lực đếm ngược."""
        page_obj = Page.objects.filter(id=page_id, deleted_at__isnull=True).first()
        config = (page_obj.content_config or {}) if page_obj else {}
        is_page_hidden = bool(config.get("hideAmount") or config.get("hide_amount"))
        qr_codes = config.get("qrCodes") or config.get("qr_codes") or []
        hidden_amount_qr_ids = set()
        any_qr_hidden = False
        if isinstance(qr_codes, list):
            for q in qr_codes:
                if isinstance(q, dict) and (q.get("hideAmount") or q.get("hide_amount")):
                    any_qr_hidden = True
                    hidden_amount_qr_ids.add(str(q.get("id") or ""))

        now = timezone.now()
        transactions = DonationTransaction.objects.filter(
            page_id=page_id,
            deleted_at__isnull=True,
            is_hidden=False,
            is_censored=False,
            tier__in=[
                DonationTransaction.Tier.BRONZE,
                DonationTransaction.Tier.SILVER,
                DonationTransaction.Tier.GOLD,
                DonationTransaction.Tier.DIAMOND,
            ],
            tier_expires_at__gt=now,
        ).order_by("-amount", "-received_at")[:30]

        results = []
        for tx in transactions:
            hide_amount = is_page_hidden or (tx.qr_item_id in hidden_amount_qr_ids) or any_qr_hidden
            results.append(
                {
                    "id": str(tx.id),
                    "donor_title": tx.donor_title,
                    "amount": None if hide_amount else tx.amount,
                    "hide_amount": hide_amount,
                    "gift_label": tx.gift_label,
                    "tier": tx.tier,
                    "tier_expires_at": tx.tier_expires_at.isoformat() if tx.tier_expires_at else None,
                    "message": tx.message,
                    "received_at": tx.received_at.isoformat(),
                }
            )

        return results

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> DonationTransaction:
        """Chỉ cho phép cập nhật cờ is_hidden của giao dịch quyên góp."""
        donation = self.get_by_id_for(actor, pk)
        if "is_hidden" in data:
            donation.is_hidden = bool(data["is_hidden"])
            donation.save(update_fields=["is_hidden", "updated_at"])
        return donation

    def toggle_hidden(self, actor: Any, pk: Any, is_hidden: bool) -> DonationTransaction:
        """Chủ trang hoặc Admin có quyền MANAGE_ALL ẩn/hiện bình luận."""
        return self.update(actor, pk, {"is_hidden": is_hidden})

    def summary_stats(
        self,
        actor: Any,
        date_from: Any = None,
        date_to: Any = None,
        page_id: Any = None,
        owner_id: Any = None,
    ) -> dict[str, Any]:
        """Thống kê doanh thu, số lượt donate theo phạm vi quyền (1 người vs tất cả)."""
        queryset = self.get_queryset_for(actor)
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)
        if date_from:
            queryset = queryset.filter(received_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(received_at__lte=date_to)
        if page_id:
            queryset = queryset.filter(page_id=page_id)

        aggregates = queryset.aggregate(
            total_amount=Sum("amount"),
            total_count=Count("id"),
            censored_count=Count("id", filter=Q(is_censored=True)),
            hidden_count=Count("id", filter=Q(is_hidden=True)),
        )

        # Cơ cấu quà tặng
        by_gift = list(
            queryset.values("gift_type", "gift_label")
            .annotate(count=Count("id"), total=Sum("amount"))
            .order_by("-count")[:10]
        )

        # Bảng vinh danh đang hoạt động
        now = timezone.now()
        active_tiers = queryset.filter(tier_expires_at__gt=now).values("tier").annotate(count=Count("id"))
        tier_counts = {item["tier"]: item["count"] for item in active_tiers}

        # Biến động ủng hộ theo ngày (TruncDate)
        daily_qs = (
            queryset.annotate(date=TruncDate("received_at"))
            .values("date")
            .annotate(amount=Sum("amount"), count=Count("id"))
            .order_by("date")
        )
        daily_trend = [
            {
                "date": item["date"].strftime("%Y-%m-%d") if item["date"] else "",
                "amount": item["amount"] or 0,
                "count": item["count"] or 0,
            }
            for item in daily_qs
        ]

        return {
            "total_amount": aggregates["total_amount"] or 0,
            "total_count": aggregates["total_count"] or 0,
            "censored_count": aggregates["censored_count"] or 0,
            "hidden_count": aggregates["hidden_count"] or 0,
            "by_gift": by_gift,
            "active_tier_counts": tier_counts,
            "daily_trend": daily_trend,
        }

    def export_csv(self, actor: Any, queryset: QuerySet[DonationTransaction] | None = None) -> str:
        """Xuất danh sách giao dịch ra định dạng CSV UTF-8 kèm BOM."""
        scoped = queryset if queryset is not None else self.get_queryset_for(actor)
        scoped = scoped.order_by("-received_at")

        output = io.StringIO()
        # Ghi BOM UTF-8 để Excel mở không bị lỗi font tiếng Việt
        output.write("\ufeff")

        writer = csv.writer(output)
        writer.writerow(
            [
                "Thời gian",
                "Mã SePay",
                "Trang nhận",
                "Danh xưng",
                "Số tiền (VNĐ)",
                "Quà quy đổi",
                "Bậc vinh danh",
                "Lời nhắn",
                "Nội dung gốc",
                "Trạng thái",
            ]
        )

        for tx in scoped:
            status_text = "Bình thường"
            if tx.is_censored:
                status_text = "Vi phạm từ ngữ (Đã che)"
            elif tx.is_hidden:
                status_text = "Chủ trang ẩn"

            writer.writerow(
                [
                    tx.received_at.strftime("%Y-%m-%d %H:%M:%S"),
                    tx.sepay_id,
                    tx.page.title,
                    tx.donor_title,
                    tx.amount,
                    tx.gift_label,
                    tx.get_tier_display(),
                    tx.message,
                    tx.original_content,
                    status_text,
                ]
            )

        return output.getvalue()
