"""POST /health/client-errors: ghi log lỗi trình duyệt."""

import logging
from typing import Any

import pytest

pytestmark = pytest.mark.django_db
URL = "/api/v1/system/health/client-errors"


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
