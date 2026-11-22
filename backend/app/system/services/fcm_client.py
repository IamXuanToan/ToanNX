"""Client Firebase Cloud Messaging HTTP v1: lấy access token từ service account (`google-auth`), gửi tin
`data` tới một token trình duyệt. Service worker của FE tự hiển thị popup (không cần SDK Firebase
trong SW)."""

import base64
import json
import logging
import threading
from typing import Any

import requests
from django.conf import settings
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import service_account

from app.system.constants.notification_defaults import (
    FCM_SCOPE,
    FCM_SEND_URL,
    NOTIFICATION_PROVIDER_TIMEOUT_SECONDS,
)
from app.system.constants.notification_error_code import NotificationErrorCode
from app.system.types.push_send_result import PushSendResult

logger = logging.getLogger(__name__)
# Mã lỗi FCM nghĩa là token không còn dùng được → tắt thiết bị, không thử lại.
PERMANENT_ERRORS = frozenset({"UNREGISTERED", "INVALID_ARGUMENT", "SENDER_ID_MISMATCH"})
HTTP_TOO_MANY = 429
HTTP_SERVER_ERROR = 500

_lock = threading.Lock()
_credentials: dict[str, Any] = {}


class FcmClient:
    """Thiếu `FIREBASE_PROJECT_ID` hoặc service account thì coi như chưa cấu hình (kênh PUSH bị ẩn)."""

    def __init__(self, session: requests.Session | None = None) -> None:
        """Khởi tạo client."""
        self.session = session or requests.Session()

    def is_configured(self) -> bool:
        """Đã đặt đủ biến Firebase."""
        return bool(settings.FIREBASE_PROJECT_ID and settings.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64)

    def send(self, token: str, data: dict[str, str]) -> PushSendResult:
        """Gửi tin data-only (mọi giá trị là chuỗi) tới một token.

        Args:
            token: Token FCM của trình duyệt.
            data: Nội dung cho service worker (title, body, link, level, notification_id...).

        Returns:
            Kết quả; lỗi tạm (mạng, 429, 5xx) không `permanent`.
        """
        if not self.is_configured():
            return PushSendResult(
                ok=False, error_code=NotificationErrorCode.PUSH_NOT_CONFIGURED, permanent=True
            )
        try:
            access_token = self._access_token()
            response = self.session.post(
                FCM_SEND_URL.format(project_id=settings.FIREBASE_PROJECT_ID),
                headers={"Authorization": f"Bearer {access_token}"},
                json={"message": {"token": token, "data": data, "webpush": {"headers": {"Urgency": "high"}}}},
                timeout=NOTIFICATION_PROVIDER_TIMEOUT_SECONDS,
            )
        except (requests.RequestException, ValueError) as exc:
            logger.warning("FCM lỗi kết nối: %s", type(exc).__name__)
            return PushSendResult(ok=False, error_code=NotificationErrorCode.PUSH_UNAVAILABLE)
        if response.ok:
            return PushSendResult(ok=True, message_id=str(response.json().get("name", "")))
        return self._error(response)

    def _error(self, response: requests.Response) -> PushSendResult:
        try:
            error = response.json().get("error", {})
        except ValueError:
            error = {}
        codes = {
            str(detail.get("errorCode", ""))
            for detail in error.get("details", [])
            if isinstance(detail, dict)
        }
        codes.add(str(error.get("status", "")))
        if codes & PERMANENT_ERRORS:
            return PushSendResult(
                ok=False, error_code=NotificationErrorCode.PUSH_TOKEN_INVALID, permanent=True
            )
        if response.status_code == HTTP_TOO_MANY or response.status_code >= HTTP_SERVER_ERROR:
            return PushSendResult(ok=False, error_code=NotificationErrorCode.PUSH_UNAVAILABLE)
        return PushSendResult(ok=False, error_code=f"FCM_{response.status_code}", permanent=True)

    def _access_token(self) -> str:
        """Access token OAuth2 dùng lại tới gần hết hạn (google-auth tự biết khi nào cần làm mới)."""
        with _lock:
            credentials = _credentials.get("value")
            if credentials is None:
                info = json.loads(base64.b64decode(settings.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64))
                credentials = service_account.Credentials.from_service_account_info(info, scopes=[FCM_SCOPE])
                _credentials["value"] = credentials
            if not credentials.valid:
                credentials.refresh(GoogleAuthRequest())
            return str(credentials.token)
