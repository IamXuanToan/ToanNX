"""Test schema OpenAPI: sinh được, hợp lệ, không cảnh báo và đúng envelope chuẩn."""

from pathlib import Path
from typing import Any

import pytest
import yaml
from django.core.management import call_command


@pytest.fixture(scope="module")
def schema(tmp_path_factory: pytest.TempPathFactory) -> dict[str, Any]:
    """Sinh schema một lần cho cả module (fail nếu có warning/error)."""
    path: Path = tmp_path_factory.mktemp("openapi") / "schema.yaml"
    call_command("spectacular", "--validate", "--fail-on-warn", "--file", str(path))
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _json_schema(operation: dict[str, Any], status: str) -> dict[str, Any]:
    return operation["responses"][status]["content"]["application/json"]["schema"]


class TestOpenApiSchema:
    """Schema phản ánh đúng contract API."""

    def test_success_response_is_enveloped(self, schema: dict[str, Any]) -> None:
        body = _json_schema(schema["paths"]["/api/v1/auth/me"]["get"], "200")
        assert set(body["properties"]) == {"success", "data", "meta"}

    def test_paginated_list_has_pagination_meta(self, schema: dict[str, Any]) -> None:
        ref = _json_schema(schema["paths"]["/api/v1/account/users"]["get"], "200")["$ref"]
        component = schema["components"]["schemas"][ref.rsplit("/", 1)[-1]]
        assert "pagination" in component["properties"]["meta"]["properties"]

    def test_request_body_uses_validate_serializer(self, schema: dict[str, Any]) -> None:
        operation = schema["paths"]["/api/v1/account/users"]["post"]
        ref = operation["requestBody"]["content"]["application/json"]["schema"]["$ref"]
        assert ref.endswith("/UserCreateValidateRequest")

    def test_cookie_and_bearer_security(self, schema: dict[str, Any]) -> None:
        assert set(schema["components"]["securitySchemes"]) == {"cookieJwt", "bearerJwt"}
        assert schema["paths"]["/api/v1/account/users"]["get"]["security"] == [
            {"cookieJwt": []},
            {"bearerJwt": []},
        ]
