"""POST /system/notifications/dispatch: chỉ cron có CRON_SECRET."""

from typing import Any

import pytest

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/notifications/dispatch"


def test_requires_secret(client: Any, settings: Any) -> None:
    settings.CRON_SECRET = ""
    assert client.post(URL).status_code == 404
    settings.CRON_SECRET = "cron"
    assert client.post(URL, HTTP_AUTHORIZATION="Bearer sai").status_code == 404
    response = client.post(URL, HTTP_AUTHORIZATION="Bearer cron")
    assert response.status_code == 200 and response.json()["data"] == {"sent": 0}
