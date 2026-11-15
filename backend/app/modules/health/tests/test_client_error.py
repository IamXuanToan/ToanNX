"""POST /health/client-errors: ghi log lỗi trình duyệt (Sentry bắt log ERROR khi bật)."""

import logging
from typing import Any

import pytest

from app.core.context.user_context import request_context
from app.core.logging.sentry import _attach_request_id, init_sentry

pytestmark = pytest.mark.django_db
URL = "/api/v1/health/client-errors"


def test_client_error_is_logged(client: Any, caplog: Any) -> None:
    body = {"message": "Boom", "url": "/vi/quan-tri", "digest": "abc", "stack": "at x"}
    with caplog.at_level(logging.ERROR, logger="app.client"):
        response = client.post(URL, body, format="json")
    assert response.status_code == 204
    assert any("Boom" in record.getMessage() for record in caplog.records)


def test_client_error_validates_body(client: Any) -> None:
    assert client.post(URL, {"message": "x" * 1001, "url": "/"}, format="json").status_code == 400


def test_client_error_requires_csrf(csrf_client: Any) -> None:
    assert csrf_client.post(URL, {"message": "x", "url": "/"}, format="json").status_code == 403


def test_sentry_event_gets_request_id() -> None:
    with request_context("req-abcdef12"):
        event = _attach_request_id({}, {})
    assert event["tags"]["request_id"] == "req-abcdef12"


def test_sentry_disabled_without_dsn() -> None:
    init_sentry(dsn="", environment="test", release="", traces_sample_rate=0.0)  # không ném lỗi, không gửi gì
