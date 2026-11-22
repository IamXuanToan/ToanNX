"""Repository refresh token (đọc + ghi)."""

from typing import Any

from django.utils import timezone

from app.core.repositories.core_repository import CoreRepository
from app.system.models.auth_session import AuthSession
from app.system.models.refresh_token import RefreshToken


class RefreshTokenRepository(CoreRepository[RefreshToken]):
    """Truy cập dữ liệu RefreshToken."""

    model = RefreshToken

    def find_by_hash(self, token_hash: str) -> RefreshToken | None:
        """Tìm token theo hash (chỉ lấy id và session_id).

        Args:
            token_hash: Hash của token thô.

        Returns:
            Token hoặc None.
        """
        return self.get_queryset().filter(token_hash=token_hash).only("id", "session_id").first()

    def issue(self, session: AuthSession, token_hash: str) -> RefreshToken:
        """Tạo token mới cho phiên (hết hạn cùng phiên).

        Args:
            session: Phiên.
            token_hash: Hash của token thô.

        Returns:
            Token đã lưu.
        """
        return self.create(session=session, token_hash=token_hash, expires_at=session.expires_at)

    def lock(self, token_id: Any) -> RefreshToken:
        """Khóa dòng token.

        Args:
            token_id: Id token.

        Returns:
            Token đã khóa.
        """
        return self.get_for_update(token_id)

    def mark_rotated(self, token: RefreshToken, replaced_by: RefreshToken) -> None:
        """Đánh dấu token đã xoay vòng sang token mới.

        Args:
            token: Token cũ.
            replaced_by: Token mới.
        """
        self.update(token, rotated_at=timezone.now(), replaced_by=replaced_by)

    def is_current(self, token_id: Any) -> bool:
        """Token chưa bị xoay vòng (là token hiện hành của phiên).

        Args:
            token_id: Id token.

        Returns:
            True nếu là token hiện hành.
        """
        return self.exists(pk=token_id, rotated_at__isnull=True)
