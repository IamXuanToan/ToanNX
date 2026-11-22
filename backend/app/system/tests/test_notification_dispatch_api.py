"""POST /system/notifications/dispatch: QStash (chữ ký) hoặc cron ngoài (CRON_SECRET)."""

from typing import Any
from unittest.mock import patch

import pytest

from app.core.tests.helpers.fake_redis import FakeRedis
from app.system.models.notification_delivery import NotificationDelivery
from app.system.services.notification_kick_service import NotificationKickService
from app.system.services.notification_service import NotificationService
from app.system.tests.helpers.qstash_helper import sign
from app.system.types.notification_payload import NotificationPayload

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/notifications/dispatch"


def test_requires_secret(client: Any, settings: Any) -> None:
    settings.CRON_SECRET = ""
    assert client.post(URL).status_code == 404
    settings.CRON_SECRET = "cron"
    assert client.post(URL, HTTP_AUTHORIZATION="Bearer sai").status_code == 404
    response = client.post(URL, HTTP_AUTHORIZATION="Bearer cron")
    assert response.status_code == 200 and response.json()["data"] == {"sent": 0}


def test_cron_skips_db_when_nothing_due(
    client: Any, settings: Any, fake_redis: FakeRedis, django_assert_num_queries: Any
) -> None:
    """Lưới an toàn chạy định kỳ không được đánh thức Neon khi không có việc."""
    settings.CRON_SECRET = "cron"
    NotificationKickService().remember_next_due(None, None)
    with django_assert_num_queries(0):
        response = client.post(URL, HTTP_AUTHORIZATION="Bearer cron")
    assert response.json()["data"] == {"sent": 0}


def test_qstash_signature_forces_dispatch(client: Any, settings: Any, superuser: Any) -> None:
    settings.QSTASH_CURRENT_SIGNING_KEY = "current-signing-key-0123456789abcdef"
    settings.FIREBASE_PROJECT_ID = "p"
    settings.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = "e30="
    NotificationService().notify(
        "system.auth.login",
        recipient=superuser,
        dedup_key="x",
        payload=NotificationPayload(title="t"),
    )
    with patch("app.system.services.notification_service.NotificationService.dispatch_pending") as dispatch:
        dispatch.return_value = 3
        response = client.post(
            URL,
            data=b"{}",
            content_type="application/json",
            HTTP_UPSTASH_SIGNATURE=sign("current-signing-key-0123456789abcdef", b"{}"),
        )
    assert response.status_code == 200 and response.json()["data"] == {"sent": 3}
    dispatch.assert_called_once_with(force=True)


def test_bad_qstash_signature_is_404(client: Any, settings: Any) -> None:
    settings.QSTASH_CURRENT_SIGNING_KEY = "current-signing-key-0123456789abcdef"
    response = client.post(
        URL,
        data=b"{}",
        content_type="application/json",
        HTTP_UPSTASH_SIGNATURE=sign("other-signing-key-0123456789abcdef0", b"{}"),
    )
    assert response.status_code == 404
    assert not NotificationDelivery.objects.exists()
