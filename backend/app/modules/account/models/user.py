"""Model người dùng.

Không dùng `PermissionsMixin` (groups/user_permissions của Django) để tránh hai hệ
thống quyền song song. `has_perm` hỏi các authentication backend (IAM cung cấp
`IamPermissionBackend`), nên Account không phụ thuộc IAM.
"""

from typing import Any, ClassVar

from django.contrib import auth
from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models
from django.utils import timezone

from app.core.models.core_model import CoreModel
from app.modules.account.models.user_manager import UserManager


class User(AbstractBaseUser, CoreModel):
    """Tài khoản người dùng. Không có đăng ký công khai."""

    email = models.EmailField(
        unique=True,
        verbose_name="Email",
        help_text="Email đăng nhập, luôn lưu dạng chữ thường.",
        db_comment="Email đăng nhập (chữ thường)",
    )
    username = models.CharField(
        max_length=150,
        unique=True,
        null=True,
        blank=True,
        verbose_name="Tên người dùng",
        db_comment="Tên người dùng (tùy chọn)",
        help_text="Tên người dùng tùy chọn, duy nhất nếu có.",
    )
    first_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Tên",
        db_comment="Tên",
        help_text="Tên.",
    )
    last_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name="Họ",
        db_comment="Họ",
        help_text="Họ (và tên đệm).",
    )
    avatar = models.ForeignKey(
        "attachment.Attachment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Ảnh đại diện",
        help_text="File ảnh lưu ở module attachment.",
        db_comment="Ảnh đại diện (attachment)",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Đang hoạt động",
        help_text="Bỏ chọn để khóa tài khoản thay vì xóa.",
        db_comment="Cho phép đăng nhập",
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name="Truy cập quản trị",
        help_text="Được vào khu vực quản trị; từng chức năng vẫn kiểm tra quyền.",
        db_comment="Được truy cập khu vực quản trị",
    )
    is_superuser = models.BooleanField(
        default=False,
        verbose_name="Siêu quản trị",
        help_text="Bỏ qua kiểm tra quyền ở tầng ứng dụng; vẫn phải đăng nhập.",
        db_comment="Toàn quyền ở tầng ứng dụng",
    )
    is_novel = models.BooleanField(
        default=False,
        verbose_name="Thuộc nhóm Novel",
        help_text="Chỉ đánh dấu nhóm nghiệp vụ Novel; không tự cấp quyền nào.",
        db_comment="Đánh dấu nhóm nghiệp vụ Novel",
    )
    date_joined = models.DateTimeField(
        default=timezone.now,
        verbose_name="Ngày tham gia",
        db_comment="Ngày tạo tài khoản",
        help_text="Thời điểm tạo tài khoản.",
    )

    objects: ClassVar[UserManager] = UserManager()  # type: ignore[assignment]  # thu hẹp manager của CoreModel

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    class Meta:
        db_table = "account_user"
        verbose_name = "Người dùng"
        verbose_name_plural = "Người dùng"

    def __str__(self) -> str:
        """Biểu diễn bằng email."""
        return self.email

    def save(self, *args: Any, **kwargs: Any) -> None:
        """Chuẩn hóa email về chữ thường trước khi lưu (unique không phân biệt hoa thường)."""
        self.email = self.email.strip().lower()
        if self.username == "":
            self.username = None
        super().save(*args, **kwargs)

    @property
    def full_name(self) -> str:
        """Họ tên đầy đủ."""
        return f"{self.last_name} {self.first_name}".strip()

    def has_perm(self, perm: str, obj: Any = None) -> bool:
        """Tương thích Django: hỏi lần lượt các authentication backend có `has_perm`.

        Args:
            perm: Mã quyền.
            obj: Đối tượng (chưa dùng object-level permission).

        Returns:
            True nếu một backend cho phép.
        """
        if not self.is_active:
            return False
        return any(
            backend.has_perm(self, perm, obj)
            for backend in auth.get_backends()
            if hasattr(backend, "has_perm")
        )

    def has_perms(self, perm_list: Any, obj: Any = None) -> bool:
        """Có tất cả quyền trong danh sách.

        Args:
            perm_list: Danh sách mã quyền.
            obj: Đối tượng (chưa dùng).

        Returns:
            True nếu có đủ.
        """
        return all(self.has_perm(perm, obj) for perm in perm_list)

    def has_module_perms(self, app_label: str) -> bool:
        """Có ít nhất một quyền thuộc module (hỏi các backend).

        Args:
            app_label: Mã module.

        Returns:
            True nếu có.
        """
        if not self.is_active:
            return False
        return any(
            backend.has_module_perms(self, app_label)
            for backend in auth.get_backends()
            if hasattr(backend, "has_module_perms")
        )
