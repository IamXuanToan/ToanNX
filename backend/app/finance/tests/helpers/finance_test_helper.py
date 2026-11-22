"""Helper test Tài chính: kết nối SePay, payload webhook có ký, nền tảng + lịch sử thuế."""

import hashlib
import hmac
import json
import time
from datetime import date
from decimal import Decimal
from typing import Any

from app.finance.models.classification_rule import ClassificationRule
from app.finance.models.platform import Platform
from app.finance.models.platform_tax_rate import PlatformTaxRate
from app.finance.models.sepay_connection import SepayConnection
from app.finance.services.sepay_connection_service import SepayConnectionService
from app.system.models.currency import Currency

WEBHOOK_URL = "/api/v1/finance/sepay/webhook/{public_id}"
# Fake Vietcombank USD (mua chuyển khoản); 26–27/12/2026 là cuối tuần, không có số.
FAKE_RATES = {date(2026, 12, 15): Decimal(25600), date(2026, 12, 25): Decimal(25650)}


def currency(code: str) -> Currency:
    """Tiền tệ seed (VND/USD)."""
    return Currency.objects.get(code=code)


def make_connection(owner: Any) -> SepayConnection:
    """Kết nối SePay đang bật (token giả đã mã hóa)."""
    from app.core.security.secret_cipher import SecretCipher
    from app.finance.constants.finance_defaults import SEPAY_TOKEN_PURPOSE

    return SepayConnection.objects.create(
        owner=owner,
        api_token_encrypted=SecretCipher().encrypt(SEPAY_TOKEN_PURPOSE, "test-token"),
        token_last4="oken",
    )


def make_platform(
    owner: Any,
    code: str,
    name: str,
    currency_code: str = "VND",
    rates: tuple[tuple[date, bool, str], ...] = (),
    pattern: str | None = None,
) -> Platform:
    """Nền tảng + lịch sử khấu trừ + quy tắc (tùy chọn)."""
    platform = Platform.objects.create(
        owner=owner, code=code, name=name, default_currency=currency(currency_code)
    )
    for effective_from, withheld, rate in rates:
        PlatformTaxRate.objects.create(
            platform=platform, effective_from=effective_from, tax_withheld=withheld, rate=Decimal(rate)
        )
    if pattern:
        ClassificationRule.objects.create(
            owner=owner, name=f"Nhận diện {name}", platform=platform, pattern=pattern
        )
    return platform


def payload(sepay_id: int, when: str, content: str, amount: Any, **extra: Any) -> dict[str, Any]:
    """Payload webhook SePay đúng tên trường tài liệu (giờ VN)."""
    body = {
        "id": sepay_id,
        "gateway": "Vietcombank",
        "transactionDate": when,
        "accountNumber": "0123456789",
        "code": None,
        "content": content,
        "transferType": "in",
        "transferAmount": amount,
        "accumulated": 50000000,
        "subAccount": None,
        "referenceCode": f"FT{sepay_id}",
        "description": content,
    }
    body.update(extra)
    return body


def signed_post(
    client: Any,
    connection: SepayConnection,
    body: dict[str, Any],
    *,
    secret: str | None = None,
    public_id: Any = None,
) -> Any:
    """POST webhook ký HMAC-SHA256 bằng secret của kết nối (hoặc secret truyền vào)."""
    raw = json.dumps(body).encode()
    timestamp = str(int(time.time()))
    key = secret if secret is not None else SepayConnectionService().secret_for(connection)
    signature = "sha256=" + hmac.new(key.encode(), f"{timestamp}.".encode() + raw, hashlib.sha256).hexdigest()
    return client.post(
        WEBHOOK_URL.format(public_id=public_id or connection.public_id),
        data=raw,
        content_type="application/json",
        HTTP_X_SEPAY_SIGNATURE=signature,
        HTTP_X_SEPAY_TIMESTAMP=timestamp,
    )
