"""Lớp cơ sở trừu tượng cho nhà cung cấp OAuth (Google, GitHub...)."""

from abc import ABC, abstractmethod

from app.system.types.oauth_user_info import OAuthUserInfo


class OAuthProviderService(ABC):
    """Hợp đồng giao tiếp chuẩn với các nhà cung cấp OAuth bên ngoài."""

    provider_name: str

    @abstractmethod
    def is_configured(self) -> bool:
        """Kiểm tra nhà cung cấp đã có đủ Client ID & Client Secret chưa.

        Returns:
            True nếu đã cấu hình, False nếu chưa.
        """

    @abstractmethod
    def get_authorization_url(self, state: str, redirect_uri: str) -> str:
        """Tạo URL chuyển hướng người dùng đến trang xác thực OAuth của nhà cung cấp.

        Args:
            state: Chuỗi ngẫu nhiên chống tấn công CSRF.
            redirect_uri: URL callback của client.

        Returns:
            URL xác thực đầy đủ.
        """

    @abstractmethod
    def get_user_info(self, code: str, redirect_uri: str) -> OAuthUserInfo:
        """Đổi mã ủy quyền (code) lấy token và truy xuất thông tin người dùng.

        Args:
            code: Mã xác thực do nhà cung cấp trả về qua redirect callback.
            redirect_uri: Redirect URI đã dùng khi khởi tạo yêu cầu.

        Returns:
            OAuthUserInfo đã được chuẩn hóa.

        Raises:
            BusinessRuleError: Nếu mã lỗi, hết hạn hoặc không kết nối được nhà cung cấp.
        """
