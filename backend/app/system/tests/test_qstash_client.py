"""QstashClient: đăng tin (timeout ngắn, lỗi không ném) và kiểm chữ ký lượt gọi lại."""

from typing import Any
from unittest.mock import MagicMock

import pytest
import requests

from app.system.services.qstash_client import QstashClient
from app.system.tests.helpers.qstash_helper import DISPATCH_URL as URL
from app.system.tests.helpers.qstash_helper import sign

PATH = "/api/v1/system/notifications/dispatch"


@pytest.fixture(autouse=True)
def _keys(settings: Any) -> None:
    settings.QSTASH_CURRENT_SIGNING_KEY = "current-signing-key-0123456789abcdef"
    settings.QSTASH_NEXT_SIGNING_KEY = "next-signing-key-0123456789abcdef00"


def test_verify_accepts_current_and_next_key() -> None:
    client = QstashClient()
    assert client.verify(sign("current-signing-key-0123456789abcdef", b"{}"), b"{}", PATH)
    assert client.verify(sign("next-signing-key-0123456789abcdef00", b"{}"), b"{}", PATH)


@pytest.mark.parametrize(
    ("signature", "body", "path"),
    [
        (lambda: sign("wrong-signing-key-0123456789abcdef0", b"{}"), b"{}", PATH),
        (lambda: sign("current-signing-key-0123456789abcdef", b"{}"), b'{"x":1}', PATH),
        (
            lambda: sign(
                "current-signing-key-0123456789abcdef", b"{}", sub="https://api.toannx.com/api/v1/other"
            ),
            b"{}",
            PATH,
        ),
        (lambda: sign("current-signing-key-0123456789abcdef", b"{}", exp_offset=-3600), b"{}", PATH),
        (lambda: "", b"{}", PATH),
    ],
)
def test_verify_rejects(signature: Any, body: bytes, path: str) -> None:
    assert not QstashClient().verify(signature(), body, path)


def test_publish_sends_delay_and_dedup(settings: Any) -> None:
    settings.QSTASH_TOKEN = "token"
    session = MagicMock()
    session.post.return_value.ok = True
    assert QstashClient(session).publish(URL, delay_seconds=60, deduplication_id="abc")
    url = session.post.call_args.args[0]
    headers = session.post.call_args.kwargs["headers"]
    assert url.endswith(f"/v2/publish/{URL}")
    assert headers["Upstash-Delay"] == "60s" and headers["Upstash-Deduplication-Id"] == "abc"
    assert session.post.call_args.kwargs["timeout"] <= 1


def test_publish_noop_without_token_or_absolute_url(settings: Any) -> None:
    session = MagicMock()
    assert not QstashClient(session).publish(URL)
    settings.QSTASH_TOKEN = "token"
    assert not QstashClient(session).publish(PATH)
    assert not session.post.called


def test_publish_error_is_swallowed(settings: Any) -> None:
    settings.QSTASH_TOKEN = "token"
    session = MagicMock()
    session.post.side_effect = requests.ConnectTimeout()
    assert not QstashClient(session).publish(URL)
