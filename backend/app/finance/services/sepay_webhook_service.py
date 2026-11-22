"""Webhook SePay theo từng người: tìm kết nối theo `public_id`, kiểm HMAC, chỉ ghi tiền vào.

Chữ ký: `X-SePay-Signature = sha256=HMAC-SHA256(secret, "{X-SePay-Timestamp}.{raw body}")`,
lệch giờ ≤ 300 giây.
Kết nối không có/đang tắt và sai chữ ký trả cùng 401 (không lộ kết nối nào có thật).
"""

import hashlib
import hmac
import json
import logging
import time
from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.exceptions.authentication_error import AuthenticationError
from app.core.exceptions.validation_error import ValidationError
from app.finance.constants.finance_defaults import SEPAY_WEBHOOK_TOLERANCE_SECONDS
from app.finance.constants.finance_notification_event import FinanceNotificationEvent as Event
from app.finance.models.income import Income
from app.finance.models.sepay_connection import SepayConnection
from app.finance.services.income_service import IncomeService
from app.finance.services.sepay_connection_service import SepayConnectionService
from app.finance.services.sepay_transaction_parser import SepayTransactionParser
from app.system.services.notification_service import NotificationService
from app.system.types.notification_payload import NotificationPayload

logger = logging.getLogger(__name__)
SIGNATURE_PREFIX = "sha256="
SEPAY_PAGE_PATH = "/admin/finance/sepay"


class SepayWebhookService:
    """Một webhook = một transaction DB; trùng thì coi như đã xử lý (SePay gửi lại)."""

    def __init__(
        self,
        connection_service: SepayConnectionService | None = None,
        income_service: IncomeService | None = None,
        notification_service: NotificationService | None = None,
    ) -> None:
        """Khởi tạo phụ thuộc."""
        self.connection_service = connection_service or SepayConnectionService()
        self.income_service = income_service or IncomeService()
        self.notification_service = notification_service or NotificationService()
        self.parser = SepayTransactionParser()

    def verify(self, public_id: Any, raw_body: bytes, signature: str, timestamp: str) -> SepayConnection:
        """Kết nối đang bật + chữ ký đúng + còn hạn.

        Raises:
            AuthenticationError: Sai bất kỳ điều kiện nào.
        """
        connection = self.connection_service.find_active(public_id)
        if connection is None:
            raise AuthenticationError("Webhook không hợp lệ.")
        try:
            sent_at = int(timestamp)
        except (TypeError, ValueError):
            sent_at = 0
        reason = ""
        if abs(time.time() - sent_at) > SEPAY_WEBHOOK_TOLERANCE_SECONDS:
            reason = "timestamp_expired"
        else:
            secret = self.connection_service.secret_for(connection)
            expected = (
                SIGNATURE_PREFIX
                + hmac.new(secret.encode(), f"{sent_at}.".encode() + raw_body, hashlib.sha256).hexdigest()
            )
            if not hmac.compare_digest(expected, signature or ""):
                reason = "signature_invalid"
        if reason:
            self._report_auth_failure(connection, reason)
            raise AuthenticationError("Webhook không hợp lệ.")
        return connection

    def handle(self, connection: SepayConnection, raw_body: bytes) -> Income | None:
        """Ghi giao dịch tiền vào cho chủ kết nối; tiền ra hoặc trùng thì không tạo.

        Raises:
            ValidationError: Body không phải JSON hoặc thiếu `id` (không có khóa chống trùng).
        """
        payload = self._parse(raw_body)
        if payload.get("transferType") != "in":
            return None
        with transaction.atomic():
            income, _created = self.income_service.ingest_sepay(
                connection.owner, self.parser.from_webhook(payload)
            )
            self.connection_service.touch_webhook(connection)
        return income

    @staticmethod
    def _parse(raw_body: bytes) -> dict[str, Any]:
        try:
            payload = json.loads(raw_body)
        except (ValueError, UnicodeDecodeError) as exc:
            raise ValidationError("Payload không phải JSON.") from exc
        if not isinstance(payload, dict) or payload.get("id") in (None, ""):
            raise ValidationError("Payload thiếu id.")
        return payload

    def _report_auth_failure(self, connection: SepayConnection, reason: str) -> None:
        """Log lý do (không log body), báo chủ kết nối gom theo giờ; lỗi ở đây không làm hỏng phản hồi 401."""
        logger.warning("Webhook SePay %s bị từ chối: %s", connection.public_id, reason)
        now = timezone.now()
        self.notification_service.notify(
            Event.WEBHOOK_AUTH_FAILED,
            recipient=connection.owner,
            dedup_key=f"{reason}:{now:%Y%m%d%H}",
            payload=NotificationPayload(
                title="Webhook SePay bị từ chối",
                body=f"Lý do: {reason}. Kiểm tra secret và giờ máy chủ.",
                link=SEPAY_PAGE_PATH,
                level="ERROR",
                message_key="finance.notifications.webhookAuthFailed",
                params={"reason": reason},
            ),
        )
