"""Assertion dùng chung cho API test (tên không bắt đầu bằng Test để pytest không thu thập)."""

import json
from typing import Any

from rest_framework.response import Response

SENSITIVE_KEYS = {"password", "token_hash", "refresh_token", "access_token", "secret"}


class BaseApiTestCase:
    """Mixin assertion cho response chuẩn của API."""

    @staticmethod
    def assert_success(response: Response, status: int = 200) -> Any:
        """Response thành công đúng định dạng; trả về `data`."""
        assert response.status_code == status, response.content
        body = response.json()
        assert body["success"] is True
        assert body["meta"]["request_id"]
        return body["data"]

    @staticmethod
    def assert_error(response: Response, status: int, code: str | None = None) -> dict[str, Any]:
        """Response lỗi đúng định dạng, không lộ traceback; trả về khối `error`."""
        assert response.status_code == status, response.content
        body = response.json()
        assert body["success"] is False
        error = body["error"]
        assert error["request_id"]
        assert "traceback" not in json.dumps(body).lower()
        if code is not None:
            assert error["code"] == code, error
        return dict(error)

    @staticmethod
    def assert_paginated(response: Response) -> tuple[list[Any], dict[str, int]]:
        """Response phân trang; trả về (items, pagination)."""
        assert response.status_code == 200, response.content
        body = response.json()
        pagination = body["meta"]["pagination"]
        assert set(pagination) == {"page", "page_size", "total", "total_pages"}
        return body["data"], pagination

    def assert_unauthorized(self, response: Response, code: str | None = None) -> None:
        """401."""
        self.assert_error(response, 401, code)

    def assert_forbidden(self, response: Response, code: str | None = None) -> None:
        """403."""
        self.assert_error(response, 403, code)

    @staticmethod
    def assert_no_sensitive_data(response: Response) -> None:
        """Body không chứa khóa nhạy cảm ở bất kỳ cấp nào."""

        def walk(value: Any) -> None:
            if isinstance(value, dict):
                for key, item in value.items():
                    assert key not in SENSITIVE_KEYS, f"Lộ khóa nhạy cảm: {key}"
                    walk(item)
            elif isinstance(value, list):
                for item in value:
                    walk(item)

        walk(response.json())
