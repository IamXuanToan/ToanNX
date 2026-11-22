"""Test định dạng response, request id, lỗi 404/405, health."""

from typing import Any

from rest_framework.test import APIClient

from app.core.tests.base.base_api_test_case import BaseApiTestCase


class TestResponses(BaseApiTestCase):
    """Response chuẩn."""

    def test_request_id_echo_and_validation(self, db: Any, client: APIClient) -> None:
        response = client.get("/api/v1/system/health", HTTP_X_REQUEST_ID="abcdef12-3456")
        assert response["X-Request-ID"] == "abcdef12-3456"
        assert self.assert_success(response)["status"] == "ok"
        injected = client.get("/api/v1/system/health", HTTP_X_REQUEST_ID="bad\nvalue")
        assert injected["X-Request-ID"] != "bad\nvalue"

    def test_unknown_url_json_404(self, db: Any, client: APIClient) -> None:
        self.assert_error(client.get("/api/v1/nope"), 404, "NOT_FOUND")

    def test_method_not_allowed(self, db: Any, client: APIClient) -> None:
        self.assert_error(client.delete("/api/v1/system/auth/csrf"), 405, "METHOD_NOT_ALLOWED")

    def test_readiness(self, db: Any, client: APIClient) -> None:
        assert self.assert_success(client.get("/api/v1/system/health/ready"))["status"] == "ready"
