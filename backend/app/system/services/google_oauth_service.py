"""Dịch vụ tích hợp OAuth Google."""

from urllib.parse import urlencode

import requests
from django.conf import settings

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.system.constants.account_error_code import AccountErrorCode
from app.system.services.oauth_provider_service import OAuthProviderService
from app.system.types.oauth_user_info import OAuthUserInfo


class GoogleOAuthService(OAuthProviderService):
    """Xử lý xác thực OAuth 2.0 với Google."""

    provider_name = "google"

    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"  # noqa: S105
    USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
    SCOPES = "openid email profile"

    def is_configured(self) -> bool:
        """Kiểm tra cấu hình Google OAuth trong settings."""
        client_id = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "")
        client_secret = getattr(settings, "GOOGLE_OAUTH_CLIENT_SECRET", "")
        return bool(client_id and client_secret)

    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """Tạo URL đăng nhập Google OAuth."""
        client_id = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "")
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": self.SCOPES,
            "state": state,
            "access_type": "offline",
            "prompt": "select_account",
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    def get_user_info(self, code: str, redirect_uri: str) -> OAuthUserInfo:
        """Đổi authorization code lấy user info từ Google."""
        client_id = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "")
        client_secret = getattr(settings, "GOOGLE_OAUTH_CLIENT_SECRET", "")

        token_data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }

        try:
            token_resp = requests.post(self.TOKEN_URL, data=token_data, timeout=5)
        except requests.RequestException as exc:
            raise BusinessRuleError(
                "Không thể kết nối tới máy chủ Google để xác thực.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_AUTH_FAILED,
            ) from exc

        if token_resp.status_code != 200:
            raise BusinessRuleError(
                "Mã xác thực Google không hợp lệ hoặc đã hết hạn.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_INVALID_CODE,
            )

        token_json = token_resp.json()
        access_token = token_json.get("access_token")
        if not access_token:
            raise BusinessRuleError(
                "Không nhận được access token từ Google.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_AUTH_FAILED,
            )

        try:
            user_resp = requests.get(
                self.USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=5,
            )
        except requests.RequestException as exc:
            raise BusinessRuleError(
                "Không thể lấy thông tin người dùng từ Google.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_AUTH_FAILED,
            ) from exc

        if user_resp.status_code != 200:
            raise BusinessRuleError(
                "Lỗi khi truy xuất thông tin từ tài khoản Google.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_AUTH_FAILED,
            )

        user_json = user_resp.json()
        sub = str(user_json.get("sub", ""))
        if not sub:
            raise BusinessRuleError(
                "Dữ liệu người dùng Google không hợp lệ (thiếu sub).",
                code=AccountErrorCode.ACCOUNT_SOCIAL_AUTH_FAILED,
            )

        return OAuthUserInfo(
            provider=self.provider_name,
            uid=sub,
            email=str(user_json.get("email", "")).lower().strip(),
            display_name=str(user_json.get("name", "")).strip(),
            avatar_url=str(user_json.get("picture", "")),
            extra_data=user_json,
        )
