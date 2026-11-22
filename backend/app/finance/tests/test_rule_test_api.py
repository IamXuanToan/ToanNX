"""Quy tắc nhận diện: regex sai, thử nội dung có dấu, nhận diện lại."""

from typing import Any

import pytest

from app.finance.tests.helpers.finance_test_helper import make_platform

pytestmark = pytest.mark.django_db


def test_invalid_regex_rejected(superuser: Any, login: Any) -> None:
    platform = make_platform(superuser, "fb", "Facebook")
    response = login(superuser).post(
        "/api/v1/finance/rules",
        {"name": "x", "platform_id": str(platform.pk), "pattern": "(abc"},
        format="json",
    )
    assert response.json()["error"]["code"] == "FINANCE_RULE_PATTERN_INVALID"


def test_match_ignores_accents_and_priority(superuser: Any, login: Any) -> None:
    make_platform(superuser, "fb", "Facebook", pattern="THANH TOAN")
    response = login(superuser).post(
        "/api/v1/finance/rules/test", {"content": "Thanh toán quảng cáo"}, format="json"
    )
    data = response.json()["data"]
    assert data["platform_name"] == "Facebook" and data["matched_text"] == "THANH TOAN"
