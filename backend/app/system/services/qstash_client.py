"""Client Upstash QStash: đăng tin gọi lại một endpoint của backend (một lượt function riêng) và kiểm chữ ký
của lượt gọi lại.

- `publish`: một HTTP request, timeout 1 giây; lỗi chỉ log và trả False (cron ngoài là lưới an toàn).
- `verify`: header `Upstash-Signature` là JWT HS256 ký bằng `QSTASH_CURRENT_SIGNING_KEY` hoặc
  `QSTASH_NEXT_SIGNING_KEY` (đang xoay khóa); kiểm `iss=Upstash`, hạn `exp/nbf`, đường dẫn trong `sub` và
  băm SHA-256 của body. Token và khóa không bao giờ được log.
- Gói free: 1.000 tin/ngày (lần thử lại cũng tính), hẹn trễ tối đa 7 ngày.
"""

import base64
import hashlib
import logging
from urllib.parse import urlsplit

import jwt
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

PUBLISH_TIMEOUT_SECONDS = 1.0
# QStash tự thử lại khi endpoint trả lỗi; giữ ít để không tốn hạn mức tin/ngày.
PUBLISH_RETRIES = 2
MAX_DELAY_SECONDS = 7 * 24 * 3600
SIGNATURE_LEEWAY_SECONDS = 30
ISSUER = "Upstash"


class QstashClient:
    """Thiếu `QSTASH_TOKEN` thì coi như chưa cấu hình: `publish` không làm gì."""

    def __init__(self, session: requests.Session | None = None) -> None:
        """Khởi tạo client."""
        self.session = session or requests.Session()

    def is_configured(self) -> bool:
        """Đã có token để đăng tin."""
        return bool(settings.QSTASH_TOKEN)

    def publish(self, destination_url: str, *, delay_seconds: int = 0, deduplication_id: str = "") -> bool:
        """Đăng một tin POST `{}` tới `destination_url`.

        Args:
            destination_url: URL tuyệt đối của endpoint nhận.
            delay_seconds: Hẹn trễ (0 = ngay).
            deduplication_id: Cùng id trong khoảng ngắn thì QStash chỉ giữ một tin.

        Returns:
            True khi QStash nhận tin.
        """
        if not self.is_configured() or "://" not in destination_url:
            return False
        headers = {
            "Authorization": f"Bearer {settings.QSTASH_TOKEN}",
            "Content-Type": "application/json",
            "Upstash-Retries": str(PUBLISH_RETRIES),
        }
        delay = max(0, min(int(delay_seconds), MAX_DELAY_SECONDS))
        if delay:
            headers["Upstash-Delay"] = f"{delay}s"
        if deduplication_id:
            headers["Upstash-Deduplication-Id"] = deduplication_id[:100]
        try:
            response = self.session.post(
                f"{settings.QSTASH_URL.rstrip('/')}/v2/publish/{destination_url}",
                headers=headers,
                data=b"{}",
                timeout=PUBLISH_TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            logger.warning("qstash.publish_failed error=%s", type(exc).__name__)
            return False
        if not response.ok:
            logger.warning("qstash.publish_rejected status=%s", response.status_code)
            return False
        return True

    def verify(self, signature: str, body: bytes, path: str) -> bool:
        """Kiểm lượt gọi lại có đúng từ QStash cho endpoint này không.

        Args:
            signature: Header `Upstash-Signature`.
            body: Body thô của request.
            path: Đường dẫn request đang nhận (so với `sub`).

        Returns:
            True khi chữ ký hợp lệ với một trong hai khóa.
        """
        keys = [key for key in (settings.QSTASH_CURRENT_SIGNING_KEY, settings.QSTASH_NEXT_SIGNING_KEY) if key]
        if not signature or not keys:
            return False
        body_hash = base64.urlsafe_b64encode(hashlib.sha256(body).digest()).decode().rstrip("=")
        for key in keys:
            try:
                claims = jwt.decode(
                    signature,
                    key,
                    algorithms=["HS256"],
                    issuer=ISSUER,
                    leeway=SIGNATURE_LEEWAY_SECONDS,
                    options={"require": ["iss", "sub", "exp", "nbf", "body"]},
                )
            except jwt.PyJWTError:
                continue
            if urlsplit(str(claims["sub"])).path.rstrip("/") != path.rstrip("/"):
                return False
            return str(claims["body"]).rstrip("=") == body_hash
        return False
