"""Dịch vụ điều phối liên kết và đăng nhập qua mạng xã hội (OAuth)."""

from typing import Any

from django.http import HttpRequest

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.authentication_error import AuthenticationError
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.exceptions.validation_error import ValidationError
from app.system.constants.account_error_code import AccountErrorCode
from app.system.models.user import User
from app.system.models.user_social_account import UserSocialAccount
from app.system.repositories.user_social_account_repository import UserSocialAccountRepository
from app.system.services.auth_service import AuthService
from app.system.services.github_oauth_service import GitHubOAuthService
from app.system.services.google_oauth_service import GoogleOAuthService
from app.system.services.oauth_provider_service import OAuthProviderService
from app.system.services.setting_service import SettingService
from app.system.types.auth_result import AuthResult
from app.system.utils.frontend_url import is_trusted_frontend_origin


class OAuthService:
    """Điều phối xác thực, liên kết và hủy liên kết tài khoản mạng xã hội."""

    def __init__(
        self,
        user_social_account_repository: UserSocialAccountRepository | None = None,
        auth_service: AuthService | None = None,
        google_oauth_service: GoogleOAuthService | None = None,
        github_oauth_service: GitHubOAuthService | None = None,
        setting_service: SettingService | None = None,
    ) -> None:
        self.user_social_account_repository = user_social_account_repository or UserSocialAccountRepository()
        self.auth_service = auth_service or AuthService()
        self.google_oauth_service = google_oauth_service or GoogleOAuthService()
        self.github_oauth_service = github_oauth_service or GitHubOAuthService()
        self.setting_service = setting_service or SettingService()
        self._providers: dict[str, OAuthProviderService] = {
            UserSocialAccount.Provider.GOOGLE.value: self.google_oauth_service,
            UserSocialAccount.Provider.GITHUB.value: self.github_oauth_service,
        }

    def get_provider(self, provider: str, check_enabled: bool = True) -> OAuthProviderService:
        """Lấy dịch vụ nhà cung cấp OAuth tương ứng.

        Args:
            provider: Tên nhà cung cấp (google, github...).
            check_enabled: Kiểm tra xem quản trị viên có đang bật phương thức này không.

        Returns:
            OAuthProviderService tương ứng.

        Raises:
            BusinessRuleError: Nếu nhà cung cấp không được hỗ trợ, chưa cấu hình hoặc bị tạm khóa.
        """
        normalized = provider.lower().strip()
        provider_service = self._providers.get(normalized)
        if not provider_service:
            raise BusinessRuleError(
                f"Nền tảng {provider} không được hỗ trợ.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_PROVIDER_UNSUPPORTED,
            )
        if check_enabled and not self.setting_service.is_social_login_enabled(normalized):
            raise BusinessRuleError(
                f"Phương thức đăng nhập qua {provider.title()} đang tạm thời bị quản trị viên tắt.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_PROVIDER_DISABLED,
            )
        if not provider_service.is_configured():
            raise BusinessRuleError(
                f"Nền tảng {provider.capitalize()} chưa được cấu hình Client ID / Secret trên hệ thống.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_AUTH_FAILED,
            )
        return provider_service

    def get_authorization_url(self, provider: str, state: str, redirect_uri: str) -> str:
        """Tạo URL chuyển hướng xác thực OAuth.

        Args:
            provider: Tên nền tảng.
            state: Chuỗi state bảo vệ CSRF.
            redirect_uri: Callback URL của client (phải thuộc origin Frontend tin cậy).

        Returns:
            URL xác thực đầy đủ.

        Raises:
            ValidationError: Nếu `redirect_uri` không thuộc origin được phép.
        """
        if not is_trusted_frontend_origin(redirect_uri):
            raise ValidationError(
                "Redirect URI không thuộc domain được phép.",
                details={"redirect_uri": ["Redirect URI không thuộc domain được phép."]},
            )
        return self.get_provider(provider).get_authorization_url(state, redirect_uri)

    def login(self, request: HttpRequest, provider: str, code: str, redirect_uri: str) -> AuthResult:
        """Đăng nhập bằng tài khoản mạng xã hội đã liên kết. Không cho phép đăng ký mới.

        Args:
            request: HTTP request (để lấy IP / User-Agent).
            provider: Tên nền tảng.
            code: Mã xác thực do provider trả về.
            redirect_uri: Redirect URI đã dùng khi khởi tạo.

        Returns:
            AuthResult chứa session và tokens để đặt cookie phiên.

        Raises:
            NotFoundError: Nếu tài khoản mạng xã hội chưa được liên kết.
            AuthenticationError: Nếu tài khoản đã bị khóa.
        """
        provider_service = self.get_provider(provider)
        oauth_user_info = provider_service.get_user_info(code, redirect_uri)

        social_account = self.user_social_account_repository.find_by_provider_uid(
            provider=oauth_user_info.provider,
            uid=oauth_user_info.uid,
        )

        if not social_account:
            raise NotFoundError(
                "Tài khoản mạng xã hội này chưa được liên kết với bất kỳ tài khoản nào trong hệ thống. "
                "Vui lòng đăng nhập bằng mật khẩu trước để liên kết trong Hồ sơ cá nhân.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_NOT_LINKED,
            )

        user = social_account.user
        if not user.is_active:
            raise AuthenticationError("Tài khoản đã bị khóa.", code=ErrorCode.AUTH_USER_INACTIVE)

        # Cập nhật thông tin profile mới nhất từ mạng xã hội
        self.user_social_account_repository.update(
            social_account,
            display_name=oauth_user_info.display_name or social_account.display_name,
            avatar_url=oauth_user_info.avatar_url or social_account.avatar_url,
            extra_data=oauth_user_info.extra_data or social_account.extra_data,
        )

        return self.auth_service.create_session_for_user(request, user)

    def link(self, user: User, provider: str, code: str, redirect_uri: str) -> UserSocialAccount:
        """Liên kết tài khoản mạng xã hội với người dùng đang đăng nhập.

        Args:
            user: Người dùng hiện tại.
            provider: Tên nền tảng.
            code: Mã xác thực OAuth.
            redirect_uri: Redirect URI đã dùng.

        Returns:
            UserSocialAccount mới tạo.

        Raises:
            ConflictError: Nếu tài khoản này đã được người khác liên kết hoặc user đã liên kết provider này.
        """
        provider_service = self.get_provider(provider)
        oauth_user_info = provider_service.get_user_info(code, redirect_uri)

        # Kiểm tra tài khoản provider:uid đã liên kết với người khác chưa
        if self.user_social_account_repository.exists_by_provider_uid(
            provider=oauth_user_info.provider,
            uid=oauth_user_info.uid,
            exclude_user_id=user.id,
        ):
            raise ConflictError(
                "Tài khoản mạng xã hội này đã được liên kết với một tài khoản khác trong hệ thống.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_ALREADY_LINKED,
            )

        # Kiểm tra user này đã liên kết provider này chưa
        existing = self.user_social_account_repository.find_by_user_and_provider(
            user_id=user.id,
            provider=oauth_user_info.provider,
        )
        if existing:
            raise ConflictError(
                f"Bạn đã liên kết tài khoản {provider.capitalize()} rồi. Vui lòng hủy liên kết cũ trước.",
                code=AccountErrorCode.ACCOUNT_SOCIAL_PROVIDER_EXISTS,
            )

        return self.user_social_account_repository.create(
            user=user,
            provider=oauth_user_info.provider,
            uid=oauth_user_info.uid,
            email=oauth_user_info.email,
            display_name=oauth_user_info.display_name,
            avatar_url=oauth_user_info.avatar_url,
            extra_data=oauth_user_info.extra_data,
        )

    def unlink(self, user: User, provider: str) -> None:
        """Hủy liên kết tài khoản mạng xã hội của người dùng.

        Args:
            user: Người dùng hiện tại.
            provider: Tên nền tảng.

        Raises:
            NotFoundError: Nếu chưa có liên kết với provider này.
            BusinessRuleError: Nếu hủy liên kết duy nhất khi chưa có mật khẩu.
        """
        normalized = provider.lower().strip()
        social_account = self.user_social_account_repository.find_by_user_and_provider(
            user_id=user.id,
            provider=normalized,
        )
        if not social_account:
            raise NotFoundError(
                f"Chưa có liên kết với tài khoản {provider.capitalize()}.",
            )

        # Bảo vệ: Nếu tài khoản không có mật khẩu hợp lệ và chỉ có 1 liên kết mạng xã hội
        if not user.has_usable_password():
            count = self.user_social_account_repository.list_by_user(user.id).count()
            if count <= 1:
                raise BusinessRuleError(
                    "Không thể hủy liên kết phương thức đăng nhập duy nhất khi chưa thiết lập mật khẩu.",
                    code=AccountErrorCode.ACCOUNT_SOCIAL_CANNOT_UNLINK_LAST,
                )

        self.user_social_account_repository.delete(social_account)

    def list_accounts(self, user: User) -> list[dict[str, Any]]:
        """Lấy danh sách các nền tảng được hỗ trợ kèm trạng thái liên kết của người dùng.

        Args:
            user: Người dùng hiện tại.

        Returns:
            Danh sách từ điển trạng thái các nền tảng.
        """
        connected = {acc.provider: acc for acc in self.user_social_account_repository.list_by_user(user.id)}

        results: list[dict[str, Any]] = []
        for prov_choice in UserSocialAccount.Provider.choices:
            prov_name = prov_choice[0]
            prov_svc = self._providers.get(prov_name)
            acc = connected.get(prov_name)
            results.append(
                {
                    "provider": prov_name,
                    "is_configured": prov_svc.is_configured() if prov_svc else False,
                    "is_enabled": self.setting_service.is_social_login_enabled(prov_name),
                    "is_connected": acc is not None,
                    "email": acc.email if acc else "",
                    "display_name": acc.display_name if acc else "",
                    "avatar_url": acc.avatar_url if acc else "",
                    "connected_at": acc.created_at.isoformat() if acc else None,
                }
            )
        return results
