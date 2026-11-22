"""Repository tài khoản mạng xã hội (đọc + ghi)."""

from typing import Any
from uuid import UUID

from django.db.models import QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.system.models.user_social_account import UserSocialAccount


class UserSocialAccountRepository(CoreRepository[UserSocialAccount]):
    """Truy cập dữ liệu UserSocialAccount."""

    model = UserSocialAccount
    default_ordering = ("-created_at", "pk")

    def find_by_provider_uid(self, provider: str, uid: str) -> UserSocialAccount | None:
        """Tìm tài khoản mạng xã hội theo nền tảng và ID người dùng bên nền tảng.

        Args:
            provider: Tên nền tảng (google, github...).
            uid: ID người dùng từ OAuth provider.

        Returns:
            UserSocialAccount kèm user hoặc None nếu chưa liên kết.
        """
        return self.get_queryset().select_related("user").filter(provider=provider, uid=str(uid)).first()

    def find_by_user_and_provider(self, user_id: UUID | str, provider: str) -> UserSocialAccount | None:
        """Tìm liên kết của một người dùng với một nền tảng cụ thể.

        Args:
            user_id: ID người dùng hệ thống.
            provider: Tên nền tảng.

        Returns:
            UserSocialAccount hoặc None nếu chưa liên kết.
        """
        return self.get_queryset().filter(user_id=user_id, provider=provider).first()

    def list_by_user(self, user_id: UUID | str) -> QuerySet[UserSocialAccount]:
        """Danh sách tài khoản mạng xã hội đã liên kết của người dùng.

        Args:
            user_id: ID người dùng hệ thống.

        Returns:
            QuerySet các UserSocialAccount chưa bị xóa mềm.
        """
        return self.get_queryset().filter(user_id=user_id)

    def exists_by_provider_uid(self, provider: str, uid: str, exclude_user_id: Any | None = None) -> bool:
        """Kiểm tra tài khoản mạng xã hội này đã được liên kết với người dùng nào khác chưa.

        Args:
            provider: Tên nền tảng.
            uid: ID người dùng từ provider.
            exclude_user_id: ID người dùng cần loại trừ khi kiểm tra.

        Returns:
            True nếu đã có người khác liên kết, False nếu chưa.
        """
        qs = self.get_queryset().filter(provider=provider, uid=str(uid))
        if exclude_user_id:
            qs = qs.exclude(user_id=exclude_user_id)
        return qs.exists()
