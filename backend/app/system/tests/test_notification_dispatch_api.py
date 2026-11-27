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


def test_qstash_failure_still_dispatches_via_cron_fallback_without_duplicates(
    client: Any, settings: Any, superuser: Any, fake_redis: FakeRedis, django_capture_on_commit_callbacks: Any
) -> None:
    """Khi QStash lỗi lúc notify(), cron fallback vẫn thấy việc ngay và chỉ gửi đúng 1 lần."""
    settings.CRON_SECRET = "cron"
    settings.FIREBASE_PROJECT_ID = "p"
    settings.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = "e30="
    NotificationKickService().remember_next_due(None, None)
    assert not NotificationKickService().has_due_work()

    from app.system.models.push_device import PushDevice
    from app.system.types.push_send_result import PushSendResult

    PushDevice.objects.create(user=superuser, fcm_token="tok-fallback")

    with (
        patch("app.system.services.qstash_client.QstashClient.publish", return_value=False),
        django_capture_on_commit_callbacks(execute=True),
    ):
        NotificationService().notify(
            "system.announcement.published",
            recipient=superuser,
            dedup_key="fallback-once",
            payload=NotificationPayload(title="Cảnh báo khẩn"),
        )

    assert NotificationKickService().has_due_work()
    with patch(
        "app.system.services.fcm_client.FcmClient.send",
        return_value=PushSendResult(ok=True, message_id="msg-1"),
    ) as mock_send:
        r1 = client.post(URL, HTTP_AUTHORIZATION="Bearer cron")
        r2 = client.post(URL, HTTP_AUTHORIZATION="Bearer cron")

    assert r1.status_code == 200 and r1.json()["data"] == {"sent": 1}
    assert r2.status_code == 200 and r2.json()["data"] == {"sent": 0}
    assert mock_send.call_count == 1
    assert NotificationDelivery.objects.get().status == "SENT"
