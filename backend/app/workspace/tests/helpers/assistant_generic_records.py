"""Dữ liệu mẫu cho tài nguyên của tool chung Trợ lý (`list_my_records` / `update_my_record` / xóa 2 bước)."""

from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.utils import timezone

from app.finance.models.invoice import Invoice
from app.finance.models.platform import Platform
from app.system.models.attachment import Attachment
from app.system.models.currency import Currency
from app.utilities.models.donation_transaction import DonationTransaction
from app.utilities.models.page import Page
from app.workspace.models.subscription import Subscription
from app.workspace.models.subscription_payment import SubscriptionPayment


def make_generic_records(owner: Any, tag: str, vnd: Currency, *, suffix: str, page: Page) -> dict[str, Any]:
    """Tạo một bản ghi mỗi tài nguyên của registry, tên chứa `tag` để kiểm rò rỉ dữ liệu.

    Args:
        owner: Chủ sở hữu bản ghi.
        tag: Chuỗi đánh dấu xuất hiện trong tên/nội dung.
        vnd: Tiền tệ VND.
        suffix: Hậu tố cho trường duy nhất (code, sepay_id).
        page: Trang nhận ủng hộ của `owner`.

    Returns:
        Bản ghi theo khóa `resource` của registry.
    """
    today = timezone.localdate()
    platform = Platform.objects.create(
        owner=owner, name=f"NenTang {tag}", code=f"nt-{suffix}", default_currency=vnd
    )
    subscription = Subscription.objects.create(
        owner=owner, name=f"GoiThanhToan {tag}", currency=vnd, renew_date=today + timedelta(days=30)
    )
    return {
        "platform": platform,
        "invoice": Invoice.objects.create(
            owner=owner,
            number=f"HD-{tag}",
            issuer=f"BenPhatHanh {tag}",
            issued_on=today,
            currency=vnd,
            original_amount=Decimal("110000"),
            original_tax_amount=Decimal("10000"),
            amount=Decimal("110000"),
            tax_amount=Decimal("10000"),
        ),
        "file": Attachment.objects.create(
            created_by=owner,
            file=f"attachments/test/{suffix}.pdf",
            original_name=f"HopDong {tag}.pdf",
            content_type="application/pdf",
            size=1024,
            visibility="private",
        ),
        "subscription_payment": SubscriptionPayment.objects.create(
            owner=owner,
            subscription=subscription,
            paid_on=today,
            period_from=today,
            period_to=today + timedelta(days=30),
            amount=Decimal("50000"),
            currency=vnd,
            amount_vnd=Decimal("50000"),
            note=f"ThanhToan {tag}",
        ),
        "donation": DonationTransaction.objects.create(
            page=page,
            owner=owner,
            sepay_id=f"sp-{suffix}",
            amount=20000,
            donor_title=f"NguoiUngHo {tag}",
            message=f"LoiNhan {tag}",
            received_at=timezone.now(),
        ),
    }
