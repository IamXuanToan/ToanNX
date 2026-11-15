"""Nghiệp vụ quản trị phiên của mọi người dùng."""

from collections.abc import Mapping
from typing import Any

from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone

from app.core.exceptions.authorization_error import AuthorizationError
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.services.core_crud_service import CoreCrudService
from app.modules.authentication.models.auth_session import AuthSession
from app.modules.authentication.repositories.auth_session_repository import AuthSessionRepository


class AdminAuthSessionService(CoreCrudService[AuthSession, AuthSessionRepository]):
    """Liệt kê, thu hồi và xóa mềm phiên; giữ bản ghi lịch sử trong DB."""

    repository_class = AuthSessionRepository

    def get_user_choices(self) -> QuerySet[AuthSession, Mapping[str, Any]]:
        """Cung cấp tên/email chủ phiên trong cùng phạm vi quyền xem phiên quản trị."""
        return self.repository.user_choices()

    @transaction.atomic
    def bulk_delete(self, actor: Any, ids: list[Any]) -> int:
        """Xóa mềm cả lô trong transaction, đồng thời vô hiệu phiên còn hoạt động."""
        sessions = [self.repository.lock_for_admin(pk) for pk in ids]
        if not actor.is_superuser and any(session.user.is_superuser for session in sessions):
            raise AuthorizationError("Chỉ superuser được xóa phiên của superuser.")
        for session in sessions:
            if session.revoked_at is None:
                self.repository.revoke(session, "admin_deleted")
            self.repository.delete(session, actor=actor)
        return len(sessions)

    def get_queryset(self) -> QuerySet[AuthSession]:
        """Trả queryset đầy đủ cho lọc, tìm kiếm và phân trang ở view."""
        return self.repository.for_admin()

    def create(self, actor: Any, data: dict[str, Any]) -> AuthSession:
        """Phiên chỉ được tạo qua đăng nhập."""
        raise BusinessRuleError("Phiên chỉ được tạo qua đăng nhập.")

    def update(self, actor: Any, pk: Any, data: dict[str, Any]) -> AuthSession:
        """Không cho chỉnh sửa thông tin hoặc thời hạn phiên."""
        raise BusinessRuleError("Không thể sửa phiên đăng nhập.")

    @transaction.atomic
    def delete(self, actor: Any, pk: Any) -> None:
        """Thu hồi có khóa dòng; giữ lịch sử và không cho staff tác động phiên superuser."""
        session = self.repository.lock_for_admin(pk)
        if session.user.is_superuser and not actor.is_superuser:
            raise AuthorizationError("Chỉ superuser được thu hồi phiên của superuser.")
        if session.revoked_at is not None or session.expires_at <= timezone.now():
            return
        self.repository.revoke(session, "admin_revoked")

    @transaction.atomic
    def bulk_revoke(self, actor: Any, ids: list[Any]) -> int:
        """Thu hồi nhiều phiên (tất cả hoặc không gì cả); phiên đã thu hồi/hết hạn được bỏ qua.

        Args:
            actor: Người thực hiện.
            ids: Id các phiên.

        Returns:
            Số phiên đã thu hồi.

        Raises:
            NotFoundError: Có id không tồn tại.
            AuthorizationError: Staff thu hồi phiên của superuser.
        """
        sessions = [self.repository.lock_for_admin(pk) for pk in ids]
        if not actor.is_superuser and any(session.user.is_superuser for session in sessions):
            raise AuthorizationError("Chỉ superuser được thu hồi phiên của superuser.")
        now = timezone.now()
        count = 0
        for session in sessions:
            if session.revoked_at is None and session.expires_at > now:
                self.repository.revoke(session, "admin_revoked")
                count += 1
        return count
