"""Nghiệp vụ người dùng.

Quy tắc bảo vệ:
- Chỉ superuser được sửa tài khoản superuser và bật/tắt `is_superuser`.
- Người không phải superuser không được tự đổi cờ đặc quyền của chính mình.
- Không thể vô hiệu hoặc hạ quyền superuser đang hoạt động cuối cùng.
- Đổi mật khẩu / khóa tài khoản phát signal để module authentication thu hồi phiên.
"""

from typing import Any

from django.db import transaction
from django.utils import timezone

from app.core.constants.error_codes import ErrorCode
from app.core.exceptions.authorization_error import AuthorizationError
from app.core.exceptions.business_rule_error import BusinessRuleError
from app.core.exceptions.conflict_error import ConflictError
from app.core.exceptions.not_found_error import NotFoundError
from app.core.services.core_crud_service import CoreCrudService
from app.modules.account.models.user import User
from app.modules.account.repositories.user_repository import UserRepository
from app.modules.account.signals import user_credentials_changed
from app.modules.account.validators.password_validator import PasswordValidator
from app.modules.attachment.services.attachment_service import AttachmentService

_PRIVILEGED_FLAGS = ("is_active", "is_staff", "is_superuser")


class UserService(CoreCrudService[User, UserRepository]):
    """Nghiệp vụ người dùng (không hỗ trợ xóa: khóa tài khoản thay vì xóa)."""

    repository_class = UserRepository

    def __init__(
        self,
        repository: UserRepository | None = None,
        attachment_service: AttachmentService | None = None,
    ) -> None:
        """Khởi tạo service.

        Args:
            repository: Repository người dùng.
            attachment_service: Service attachment (kiểm tra ảnh đại diện).
        """
        super().__init__(repository)
        self.attachment_service = attachment_service or AttachmentService()

    # ==================================================================
    # Đọc
    # ==================================================================
    def find_by_id(self, user_id: Any) -> User | None:
        """Người dùng theo id, không có thì None.

        Args:
            user_id: Id người dùng.

        Returns:
            Người dùng hoặc None.
        """
        return self.repository.find_by_id(user_id)

    def find_by_identifier(self, identifier: str) -> User | None:
        """Tìm người dùng theo email (ưu tiên, không phân biệt hoa thường) hoặc tên người dùng.

        Args:
            identifier: Email hoặc tên người dùng.

        Returns:
            Người dùng hoặc None.
        """
        value = identifier.strip()
        if not value:
            return None
        return self.repository.find_by_email(value.lower()) or self.repository.find_by_username(value)

    def authenticate_credentials(self, identifier: str, password: str) -> User | None:
        """Kiểm tra tài khoản (email hoặc tên người dùng) + mật khẩu (dùng bởi authentication backend).

        Chạy hasher cả khi không có tài khoản để thời gian phản hồi tương đương (chống dò tài khoản).

        Args:
            identifier: Email hoặc tên người dùng.
            password: Mật khẩu thô.

        Returns:
            Người dùng (kể cả bị khóa; nơi gọi tự kiểm tra is_active) hoặc None.
        """
        user = self.find_by_identifier(identifier)
        if user is None:
            User().set_password(password)
            return None
        return user if user.check_password(password) else None

    # ==================================================================
    # Ghi
    # ==================================================================
    def record_login(self, user: User) -> None:
        """Ghi thời điểm đăng nhập.

        Args:
            user: Người dùng.
        """
        self.repository.touch_last_login(user, timezone.now())

    def record_activity(self, user: User) -> None:
        """Ghi thời điểm hoạt động gần nhất (người gọi tự giới hạn tần suất).

        Args:
            user: Người dùng.
        """
        self.repository.touch_last_seen(user, timezone.now())

    @transaction.atomic
    def create(self, actor: User, data: dict[str, Any]) -> User:
        """Tạo người dùng (không có đăng ký công khai).

        Args:
            actor: Người thực hiện.
            data: Dữ liệu đã qua UserCreateValidateSerializer.

        Returns:
            Người dùng mới.

        Raises:
            AuthorizationError: Người không phải superuser tạo superuser.
            ConflictError: Email đã tồn tại.
        """
        payload = dict(data)
        password = payload.pop("password")
        payload["email"] = payload["email"].strip().lower()

        if payload.get("is_superuser") and not actor.is_superuser:
            raise AuthorizationError(code=ErrorCode.ACCOUNT_PRIVILEGE_ESCALATION)
        if payload.get("is_superuser"):
            payload["is_staff"] = True
        if self.repository.exists(email=payload["email"]):
            raise ConflictError("Email đã được sử dụng.", code=ErrorCode.ACCOUNT_EMAIL_EXISTS)
        if payload.get("avatar_id"):
            self.attachment_service.get_image(payload["avatar_id"], actor=actor)

        PasswordValidator.validate_strength(password, User(**payload))
        return self.repository.create_user(password=password, actor=actor, **payload)

    @transaction.atomic
    def update(self, actor: User, pk: Any, data: dict[str, Any]) -> User:
        """Cập nhật người dùng.

        Args:
            actor: Người thực hiện.
            pk: Id người cần sửa.
            data: Dữ liệu đã qua UserUpdateValidateSerializer (partial).

        Returns:
            Người dùng sau cập nhật.
        """
        # ============================================================
        # BƯỚC 1: Khóa bản ghi và kiểm tra quyền trên đối tượng
        # ============================================================
        target = self.get_manageable_user(actor, pk)
        payload = dict(data)
        password = payload.pop("password", None)
        changes = {key: value for key, value in payload.items() if getattr(target, key) != value}

        # ============================================================
        # BƯỚC 2: Chống tự nâng quyền / leo thang đặc quyền
        # ============================================================
        flag_changes = [flag for flag in _PRIVILEGED_FLAGS if flag in changes]
        if flag_changes and actor.pk == target.pk and not actor.is_superuser:
            raise AuthorizationError(code=ErrorCode.ACCOUNT_SELF_MODIFICATION)
        if "is_superuser" in changes and not actor.is_superuser:
            raise AuthorizationError(code=ErrorCode.ACCOUNT_PRIVILEGE_ESCALATION)
        if changes.get("is_superuser") is True:
            changes["is_staff"] = True

        # ============================================================
        # BƯỚC 3: Bảo vệ superuser cuối cùng
        # ============================================================
        loses_superuser = (
            target.is_superuser
            and target.is_active
            and (changes.get("is_superuser") is False or changes.get("is_active") is False)
        )
        if loses_superuser:
            others = [user for user in self.repository.lock_active_superusers() if user.pk != target.pk]
            if not others:
                raise BusinessRuleError(
                    "Không thể vô hiệu hóa superuser cuối cùng.", code=ErrorCode.ACCOUNT_LAST_SUPERUSER
                )

        # ============================================================
        # BƯỚC 4: Kiểm tra dữ liệu liên quan
        # ============================================================
        if "email" in changes:
            changes["email"] = changes["email"].strip().lower()
            if self.repository.exists(email=changes["email"]):
                raise ConflictError("Email đã được sử dụng.", code=ErrorCode.ACCOUNT_EMAIL_EXISTS)
        if changes.get("avatar_id"):
            self.attachment_service.get_image(changes["avatar_id"], actor=actor)

        # ============================================================
        # BƯỚC 5: Ghi dữ liệu và thông báo thay đổi thông tin xác thực
        # ============================================================
        self.repository.update(target, actor=actor, **changes)
        if password:
            PasswordValidator.validate_strength(password, target)
            self.repository.set_password(target, password, actor=actor)
            self._notify_credentials_changed(target, "password_changed")
        if changes.get("is_active") is False:
            self._notify_credentials_changed(target, "deactivated")
        return target

    @transaction.atomic
    def delete(self, actor: User, pk: Any) -> None:
        """Xóa mềm người dùng: khóa tài khoản, đánh dấu xóa và thu hồi mọi phiên.

        Args:
            actor: Người thực hiện.
            pk: Id người cần xóa.

        Raises:
            AuthorizationError: Tự xóa chính mình, hoặc người không phải superuser xóa superuser.
            BusinessRuleError: Xóa superuser hoạt động cuối cùng.
        """
        # ============================================================
        # BƯỚC 1: Khóa bản ghi, chặn tự xóa và xóa superuser khi không đủ quyền
        # ============================================================
        target = self.get_manageable_user(actor, pk)
        if target.pk == actor.pk:
            raise AuthorizationError(code=ErrorCode.ACCOUNT_SELF_MODIFICATION)

        # ============================================================
        # BƯỚC 2: Bảo vệ superuser hoạt động cuối cùng
        # ============================================================
        if target.is_superuser and target.is_active:
            others = [user for user in self.repository.lock_active_superusers() if user.pk != target.pk]
            if not others:
                raise BusinessRuleError(
                    "Không thể xóa superuser cuối cùng.", code=ErrorCode.ACCOUNT_LAST_SUPERUSER
                )

        # ============================================================
        # BƯỚC 3: Khóa + xóa mềm, thu hồi phiên sau khi commit
        # ============================================================
        self.repository.update(target, actor=actor, is_active=False)
        self.repository.soft_delete(target, actor=actor)
        self._notify_credentials_changed(target, "deleted")

    @transaction.atomic
    def bulk_update(self, actor: User, ids: list[Any], data: dict[str, Any]) -> int:
        """Cập nhật nhiều người dùng; một bản ghi lỗi thì không bản ghi nào đổi.

        Args:
            actor: Người thực hiện.
            ids: Id người dùng.
            data: Trường cần cập nhật (cùng luật với `update`).

        Returns:
            Số người dùng đã cập nhật.
        """
        for pk in ids:
            self.update(actor, pk, data)
        return len(ids)

    @transaction.atomic
    def bulk_delete(self, actor: User, ids: list[Any]) -> int:
        """Xóa mềm nhiều người dùng; một bản ghi lỗi thì không bản ghi nào bị xóa.

        Args:
            actor: Người thực hiện.
            ids: Id người dùng.

        Returns:
            Số người dùng đã xóa.
        """
        for pk in ids:
            self.delete(actor, pk)
        return len(ids)

    def get_manageable_user(self, actor: User, user_id: Any) -> User:
        """Khóa người dùng đích và kiểm tra actor được phép thao tác.

        Args:
            actor: Người thực hiện.
            user_id: Id người dùng đích.

        Returns:
            Người dùng đích (đã khóa dòng).

        Raises:
            NotFoundError: Không tồn tại hoặc đã xóa mềm.
            AuthorizationError: Người không phải superuser thao tác trên superuser.
        """
        target = self.repository.get_for_update(user_id)
        if target.deleted_at is not None:
            raise NotFoundError()
        if target.is_superuser and not actor.is_superuser:
            raise AuthorizationError(code=ErrorCode.ACCOUNT_SUPERUSER_PROTECTED)
        return target

    @staticmethod
    def _notify_credentials_changed(user: User, reason: str) -> None:
        """Phát signal sau khi transaction commit để module khác thu hồi phiên."""
        transaction.on_commit(lambda: user_credentials_changed.send(sender=User, user=user, reason=reason))
