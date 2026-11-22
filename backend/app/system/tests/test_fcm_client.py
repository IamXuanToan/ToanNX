"""FcmClient: làm mới access token có timeout; lỗi Google Auth là lỗi tạm (thử lại sau), không treo."""

from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from google.auth.exceptions import TransportError

from app.system.services import fcm_client as module
from app.system.services.fcm_client import FcmClient


@pytest.fixture(autouse=True)
def _firebase(settings: Any) -> None:
    settings.FIREBASE_PROJECT_ID = "p"
    settings.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = "e30="
    module._credentials.clear()


def _credentials(refresh: Any) -> MagicMock:
    credentials = MagicMock(valid=False, token="t")
    credentials.refresh.side_effect = refresh
    return credentials


def test_refresh_uses_timeout() -> None:
    seen: dict[str, Any] = {}

    def refresh(request: Any) -> None:
        seen["timeout"] = request.keywords["timeout"]

    session = MagicMock()
    session.post.return_value.ok = True
    session.post.return_value.json.return_value = {"name": "m1"}
    with patch.object(
        module.service_account.Credentials, "from_service_account_info", return_value=_credentials(refresh)
    ):
        result = FcmClient(session).send("token", {"title": "x"})
    assert result.ok and seen["timeout"] == module.NOTIFICATION_PROVIDER_TIMEOUT_SECONDS


def test_auth_transport_error_is_temporary() -> None:
    def refresh(request: Any) -> None:
        raise TransportError("timeout")

    with patch.object(
        module.service_account.Credentials, "from_service_account_info", return_value=_credentials(refresh)
    ):
        result = FcmClient(MagicMock()).send("token", {"title": "x"})
    assert not result.ok and not result.permanent and result.error_code == "PUSH_UNAVAILABLE"
