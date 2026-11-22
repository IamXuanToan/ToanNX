"""Dịch vụ tích hợp OAuth GitHub."""

from urllib.parse import urlencode

import requests
from django.conf import settings

from app.core.exceptions.business_rule_error import BusinessRuleError
from app.system.constants.account_error_code import AccountErrorCode
from app.system.services.oauth_provider_service import OAuthProviderService
from app.system.types.oauth_user_info import OAuthUserInfo


class GitHubOAuthService(OAuthProviderService):
    """Xử lý xác thực OAuth với GitHub."""

    provider_name = "github"

    AUTH_URL = "https://github.com/login/oauth/authorize"
    TOKEN_URL = "https://github.com/login/oauth/access_token"  # noqa: S105
    USERINFO_URL = "https://api.github.com/user"
    EMAILS_URL = "https://api.github.com/user/emails"
    SCOPES = "read:user user:email"

    def is_configured(self) -> bool:
        """Kiểm tra cấu hình GitHub OAuth trong settings."""
        client_id = getattr(settings, "GITHUB_OAUTH_CLIENT_ID", "")
        client_secret = getattr(settings, "GITHUB_OAUTH_CLIENT_SECRET", "")
        return bool(client_id and client_secret)

    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """Tạo URL đăng nhập GitHub OAuth."""
        client_id = getattr(settings, "GITHUB_OAUTH_CLIENT_ID", "")
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": self.SCOPES,
            "state": state,
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    def get_user_info(self, code: str, redirect_uri: str) -> OAuthUserInfo:
        """Đổi authorization code lấy user info từ GitHub."""
        client_id = getattr(settings, "GITHUB_OAUTH_CLIENT_ID", "")
        client_secret = getattr(settings, "GITHUB_OAUTH_CLIENT_SECRET", "")

        token_data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
        }

        try:
            token_resp = requests.post(
                self.TOKEN_URL,
                data=token_data,
                headers={"Accept": "application/json"},
                timeout=10,
            )
        except requests.RequestException as exc:
            raise BusinessRuleError(
                "Không thể kết nối tới máy chủ GitHub để xác thực.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_AUTH_FAILED,
            ) from exc

        if token_resp.status_code != 200:
            raise BusinessRuleError(
                "Mã xác thực GitHub không hợp lệ hoặc đã hết hạn.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_INVALID_CODE,
            )

        token_json = token_resp.json()
        access_token = token_json.get("access_token")
        if not access_token:
            error_desc = token_json.get("error_description", "Không nhận được access token từ GitHub.")
            raise BusinessRuleError(error_desc, code=AccountErrorCode.ACCOUNT_SOCIAL_INVALID_CODE)

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
        }

        try:
            user_resp = requests.get(self.USERINFO_URL, headers=headers, timeout=10)
        except requests.RequestException as exc:
            raise BusinessRuleError(
                "Không thể lấy thông tin người dùng từ GitHub.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_AUTH_FAILED,
            ) from exc

        if user_resp.status_code != 200:
            raise BusinessRuleError(
                "Lỗi khi truy xuất thông tin từ tài khoản GitHub.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_AUTH_FAILED,
            )

        user_json = user_resp.json()
        github_id = str(user_json.get("id", ""))
        if not github_id:
            raise BusinessRuleError(
                "Dữ liệu người dùng GitHub không hợp lệ (thiếu id).",
                code=AccountErrorCode.ACCOUNT_SOCIAL_AUTH_FAILED,
            )

        # Lấy email chính (primary verified email)
        email = str(user_json.get("email") or "").lower().strip()
        if not email:
            try:
                emails_resp = requests.get(self.EMAILS_URL, headers=headers, timeout=10)
                if emails_resp.status_code == 200:
                    emails_data = emails_resp.json()
                    for item in emails_data:
                        if item.get("primary") and item.get("verified"):
                            email = str(item.get("email", "")).lower().strip()
                            break
                    if not email and emails_data:
                        email = str(emails_data[0].get("email", "")).lower().strip()
            except requests.RequestException:
                pass

        display_name = str(user_json.get("name") or user_json.get("login") or "").strip()
        avatar_url = str(user_json.get("avatar_url") or "")

        return OAuthUserInfo(
            provider=self.provider_name,
            uid=github_id,
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
            extra_data=user_json,
        )
