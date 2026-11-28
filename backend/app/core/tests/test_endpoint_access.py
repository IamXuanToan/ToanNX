"""Gọi thật mọi endpoint của module để chắc phân quyền đúng như khai báo.

- View dùng quyền mặc định (IAM): khách → 401, người đã đăng nhập nhưng không có quyền → 403.
- View ghi đè `permission_classes` phải nằm trong `PUBLIC_VIEWS` / `LOGIN_ONLY_VIEWS` dưới đây. Module mới
  mở một API công khai hoặc chỉ cần đăng nhập thì phải thêm tên view vào đây (có người review).
- View chỉ cần đăng nhập: khách → 401.
"""

import re
import uuid
from typing import Any

import pytest
from django.urls import URLPattern, URLResolver, get_resolver
from rest_framework.permissions import AllowAny
from rest_framework.test import APIClient

from app.core.permissions.is_active_authenticated import IsActiveAuthenticated
from app.system.models.user import User
from app.system.permissions.has_iam_permission import HasIamPermission

pytestmark = pytest.mark.django_db

MODULE_PREFIX = "app."
METHODS = ("get", "post", "put", "patch", "delete")

# View công khai (AllowAny): đăng nhập, CSRF, health, link rút gọn, trang công khai, cron dọn dẹp (có secret).
PUBLIC_VIEWS = frozenset(
    {
        "CsrfView",
        "LoginView",
        "RefreshView",
        "LogoutView",
        "HealthView",
        "LanguageActiveView",
        "ReadinessView",
        "CleanupView",
        "ClientErrorView",
        "ShortLinkResolveView",
        "PagePublicView",
        "PageFeedbackPublicView",
        "PasswordResetRequestView",
        "PasswordResetValidateTokenView",
        "PasswordResetConfirmView",
        "VerifyEmailView",
        "InvitationValidateView",
        "AcceptInvitationView",
        "SocialAuthUrlView",
        "SocialLoginView",
        "PublicSettingView",
        "SepayWebhookView",
        "DonationWebhookView",
        "DonationPublicFeedView",
        "DonationPublicLeaderboardView",
        "NotificationDispatchView",
        "SystemTelegramWebhookView",
        "WorkspaceCronTickView",
        "WorkspaceCronDispatchDueView",
        "TelegramAssistantProcessView",
    }
)
# View chỉ cần đăng nhập (dữ liệu của chính người dùng hoặc danh mục tĩnh).
LOGIN_ONLY_VIEWS = frozenset(
    {
        "LogoutAllView",
        "MeView",
        "AttachmentContentView",
        "SendVerificationEmailView",
        "SessionView",
        "SessionObjectView",
        "UserSocialAccountView",
        "SocialLinkView",
        "SocialUnlinkView",
        "TelegramBotView",
        "QrBankView",
        "ReadingHistoryView",
        "ReadingHistoryObjectView",
        "FavoriteView",
        "NovelClientView",
        "ChapterClientView",
    }
)

_REGEX_GROUP = re.compile(r"\(\?P<\w+>[^)]*\)")
_CONVERTER = re.compile(r"<(?:(\w+):)?\w+>")


def _sample(converter: str | None) -> str:
    """Giá trị mẫu cho tham số URL."""
    if converter == "int":
        return "1"
    return str(uuid.uuid4()) if converter == "uuid" else "sample"


def _path(prefix: str, pattern: URLPattern | URLResolver) -> str:
    """Ghép đoạn URL, thay tham số bằng giá trị mẫu (router dùng regex, path() dùng converter)."""
    part = str(pattern.pattern).lstrip("^").rstrip("$")
    part = _REGEX_GROUP.sub(lambda _: str(uuid.uuid4()), part)
    part = _CONVERTER.sub(lambda match: _sample(match.group(1)), part)
    return prefix + part


def _endpoints(patterns: list[URLPattern | URLResolver], prefix: str = "/") -> list[tuple[type, str, str]]:
    """(lớp view, method, URL) của mọi endpoint thuộc module."""
    found: list[tuple[type, str, str]] = []
    for pattern in patterns:
        url = _path(prefix, pattern)
        if isinstance(pattern, URLResolver):
            found += _endpoints(pattern.url_patterns, url)
            continue
        callback = pattern.callback
        view_class = getattr(callback, "cls", None) or getattr(callback, "view_class", None)
        if (
            view_class is None
            or not view_class.__module__.startswith(MODULE_PREFIX)
            or view_class.__module__.startswith("app.core")
        ):
            continue
        actions = getattr(callback, "actions", None) or {}
        methods = [m for m in actions if m in METHODS] or [m for m in METHODS if hasattr(view_class, m)]
        found += [(view_class, method, url) for method in methods if method in view_class.http_method_names]
    return found


ENDPOINTS = _endpoints(get_resolver().url_patterns)


def _call(api: APIClient, method: str, url: str) -> Any:
    return getattr(api, method)(url, {}, format="json") if method != "get" else api.get(url)


def _kind(view_class: type) -> str:
    classes = list(view_class.permission_classes)  # type: ignore[attr-defined]
    if HasIamPermission in classes:
        return "iam"
    if classes == [IsActiveAuthenticated]:
        return "login"
    if AllowAny in classes:
        return "public"
    return "unknown"


def test_endpoints_found() -> None:
    assert len(ENDPOINTS) > 50


def test_override_views_are_declared() -> None:
    """View công khai / chỉ đăng nhập phải khai trong danh sách của file này."""
    public = {cls.__qualname__ for cls, _, _ in ENDPOINTS if _kind(cls) == "public"}
    login_only = {cls.__qualname__ for cls, _, _ in ENDPOINTS if _kind(cls) == "login"}
    unknown = {cls.__qualname__ for cls, _, _ in ENDPOINTS if _kind(cls) == "unknown"}
    assert public == PUBLIC_VIEWS, f"View công khai chưa khai/khai thừa: {public ^ PUBLIC_VIEWS}"
    assert login_only == LOGIN_ONLY_VIEWS, (
        f"View chỉ đăng nhập chưa khai/khai thừa: {login_only ^ LOGIN_ONLY_VIEWS}"
    )
    assert not unknown, f"permission_classes ngoài chuẩn: {unknown}"


def test_anonymous_gets_401_on_protected_endpoints() -> None:
    api = APIClient()
    wrong = [
        f"{method.upper()} {url} → {response.status_code}"
        for view_class, method, url in ENDPOINTS
        if _kind(view_class) in {"iam", "login"} and (response := _call(api, method, url)).status_code != 401
    ]
    assert not wrong, "Khách phải nhận 401:\n" + "\n".join(wrong)


def test_user_without_permission_gets_403_on_iam_endpoints(user: User, login: Any) -> None:
    api = login(user)
    wrong = []
    for view_class, method, url in ENDPOINTS:
        if _kind(view_class) != "iam":
            continue
        response = _call(api, method, url)
        code = response.json().get("error", {}).get("code") if response.content else None
        if response.status_code != 403 or code != "PERMISSION_DENIED":
            wrong.append(f"{method.upper()} {url} → {response.status_code} {code}")
    assert not wrong, "Người không có quyền phải nhận 403 PERMISSION_DENIED:\n" + "\n".join(wrong)
