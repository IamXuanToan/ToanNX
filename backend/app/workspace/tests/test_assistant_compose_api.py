"""Kiểm thử API sinh & biên tập nội dung Tiptap bằng AI: POST /api/v1/workspace/assistant/compose."""

from decimal import Decimal
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from django.utils import timezone

from app.core.tests.base.base_api_test_case import BaseApiTestCase
from app.finance.models.income import Income
from app.finance.models.platform import Platform
from app.finance.permissions.income_permission import IncomePermission
from app.system.models.currency import Currency
from app.system.tests.helpers.permission_helper import grant
from app.workspace.models.reminder import Reminder
from app.workspace.permissions.assistant_permission import AssistantPermission
from app.workspace.permissions.reminder_permission import ReminderPermission
from app.workspace.services.workspace_timezone_service import WorkspaceTimezoneService

pytestmark = pytest.mark.django_db
URL = "/api/v1/workspace/assistant/compose"


class TestAssistantComposeApi(BaseApiTestCase):
    """Kiểm thử phân quyền, làm sạch HTML Tiptap và RAG cá nhân theo quyền RBAC."""

    def test_compose_requires_permission_sanitizes_html_and_respects_rbac_rag(
        self, user: Any, login: Any, client: Any, settings: Any, vnd: Currency
    ) -> None:
        self.assert_unauthorized(client.post(URL, {"prompt": "Viết bài"}, format="json"))
        self.assert_forbidden(
            login(user).post(URL, {"prompt": "Viết bài"}, format="json"),
            "PERMISSION_DENIED",
        )

        # Chỉ cấp quyền CHAT + Reminder.READ (KHÔNG cấp Income.READ)
        grant(user, AssistantPermission.CHAT, ReminderPermission.READ)
        today = WorkspaceTimezoneService().local_today("Asia/Ho_Chi_Minh")
        Reminder.objects.create(owner=user, title="Họp tổng kết tuần", due_date=today)
        plat = Platform.objects.create(owner=user, name="YouTube", code="YT", default_currency=vnd)
        Income.objects.create(
            owner=user,
            platform=plat,
            currency=vnd,
            original_amount=Decimal("500000"),
            amount=Decimal("500000"),
            received_at=timezone.now(),
            received_date=today,
            content="Tiền YouTube",
        )

        settings.XKIRO_API_BASE = "https://xkiro.example.com/v1"
        settings.XKIRO_API_KEY = "test-secret"
        settings.XKIRO_MODEL = "model-a"

        captured_user_msg: list[str] = []

        def fake_post(url: str, *, json: Any, headers: Any, timeout: Any, **kwargs: Any) -> MagicMock:
            captured_user_msg.append(json["messages"][1]["content"])
            resp = MagicMock()
            resp.status_code = 200
            resp.headers = {"content-type": "application/json"}
            resp.json.return_value = {
                "model": "model-a",
                "choices": [
                    {
                        "message": {
                            "content": (
                                "```html\n"
                                "<h2>Báo cáo tuần</h2><p>Nội dung chuẩn.</p>"
                                "<script>alert(1)</script>\n"
                                "```"
                            )
                        }
                    }
                ],
                "usage": {"total_tokens": 42},
            }
            return resp

        with patch("requests.Session.post", side_effect=fake_post):
            res = self.assert_success(
                login(user).post(
                    URL,
                    {
                        "prompt": "Viết báo cáo nhắc việc và thu nhập tuần này",
                        "mode": "generate",
                        "use_personal_rag": True,
                    },
                    format="json",
                )
            )

        # Đã loại bỏ code fence và thẻ <script> nguy hiểm
        assert res["html"] == "<h2>Báo cáo tuần</h2><p>Nội dung chuẩn.</p>"
        assert "<script>" not in res["html"]
        assert res["model_used"] == "model-a"
        assert res["tokens_used"] == 42

        # RAG chỉ lấy Nhắc việc (có quyền), KHÔNG lấy Tài chính (thiếu IncomePermission.READ)
        assert "Nhắc việc" in res["rag_sources"]
        assert "Tài chính" not in res["rag_sources"]
        assert "Họp tổng kết tuần" in captured_user_msg[0]
        assert "500000" not in captured_user_msg[0]

        # Nếu cấp thêm IncomePermission.READ -> RAG lấy được cả Tài chính
        grant(user, IncomePermission.READ)
        with patch("requests.Session.post", side_effect=fake_post):
            res2 = self.assert_success(
                login(user).post(
                    URL,
                    {
                        "prompt": "Tổng hợp thu nhập 30 ngày qua",
                        "mode": "generate",
                        "use_personal_rag": True,
                    },
                    format="json",
                )
            )
        assert "Tài chính" in res2["rag_sources"]

    def test_compose_sse_stream_decodes_utf8_without_mojibake(
        self, user: Any, login: Any, settings: Any
    ) -> None:
        grant(user, AssistantPermission.CHAT)
        settings.XKIRO_API_BASE = "https://xkiro.example.com/v1"
        settings.XKIRO_API_KEY = "test-secret"
        settings.XKIRO_MODEL = "model-a"

        sse_lines = [
            (
                b'data: {"model":"model-a","choices":'
                b'[{"delta":{"content":"<h2>M\\u1ee5c \\u0110\\u00edch</h2>"}}]}'
            ),
            (
                'data: {"model":"model-a","choices":'
                '[{"delta":{"content":"<p>Chính sách bảo mật dữ liệu.</p>"}}],'
                '"usage":{"total_tokens":88}}'
            ).encode(),
            b"data: [DONE]",
        ]

        def fake_stream_post(*args: Any, **kwargs: Any) -> MagicMock:
            resp = MagicMock()
            resp.status_code = 200
            resp.headers = {"content-type": "text/event-stream"}
            resp.iter_lines.return_value = iter(sse_lines)
            return resp

        with patch("requests.Session.post", side_effect=fake_stream_post):
            res = self.assert_success(
                login(user).post(
                    URL,
                    {"prompt": "Viết chính sách bảo mật", "mode": "generate", "use_personal_rag": False},
                    format="json",
                )
            )

        assert res["html"] == "<h2>Mục Đích</h2><p>Chính sách bảo mật dữ liệu.</p>"
        assert res["tokens_used"] == 88
