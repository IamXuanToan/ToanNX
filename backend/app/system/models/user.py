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
from app.core.tracking.journal_tracker import JournalTracker
from app.system.models.user_manager import UserManager


class User(JournalTracker, AbstractBaseUser, CoreModel):
    """Tài khoản người dùng. Không có đăng ký công khai."""

    journal_excluded_fields = ("last_login", "last_seen_at", "date_joined")
    journal_masked_fields = ("password",)

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
    full_name = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Họ và tên",
        db_comment="Họ và tên đầy đủ",
        help_text="Họ và tên đầy đủ.",
    )
    avatar = models.ForeignKey(
        "system.Attachment",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        verbose_name="Ảnh đại diện",
        help_text="File ảnh lưu ở thư viện (module system).",
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
    is_verified = models.BooleanField(
        default=False,
        verbose_name="Đã xác minh email",
        help_text="Đánh dấu email của người dùng đã được xác minh.",
        db_comment="Đã xác minh email hay chưa",
    )
    email_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Thời điểm xác minh email",
        help_text="Thời điểm người dùng xác minh email thành công.",
        db_comment="Thời điểm xác minh email",
    )
    last_seen_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Hoạt động gần nhất",
        help_text="Lần gần nhất dùng hệ thống (đăng nhập hoặc gọi API), cập nhật tối đa mỗi phút.",
        db_comment="Thời điểm hoạt động gần nhất",
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
    REQUIRED_FIELDS: ClassVar[list[str]] = ["username"]

    class Meta:
        db_table = "system_user"
        verbose_name = "Người dùng"
        verbose_name_plural = "Người dùng"

    def __str__(self) -> str:
        """Biểu diễn bằng display_name."""
        return self.display_name

    def save(self, *args: Any, **kwargs: Any) -> None:
        """Chuẩn hóa email về chữ thường trước khi lưu (unique không phân biệt hoa thường)."""
        self.email = self.email.strip().lower()
        if self.username == "":
            self.username = None
        super().save(*args, **kwargs)

    @property
    def display_name(self) -> str:
        """Tên hiển thị: fullname (username) nếu có cả hai, hoặc fullname / username / email."""
        name = self.full_name.strip()
        uname = (self.username or "").strip()
        if name and uname:
            return f"{name} ({uname})"
        return name or uname or self.email

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
