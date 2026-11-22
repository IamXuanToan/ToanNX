"""Lệnh `python manage.py createsuperuser`: override lệnh mặc định của Django.

Bắt buộc nhập username (tên người dùng) bên cạnh email và mật khẩu.
"""

import re
from typing import Any

from django.contrib.auth.management.commands.createsuperuser import Command as BaseCreateSuperUserCommand
from django.core.management.base import CommandError, CommandParser

from app.system.services.user_service import UserService


class Command(BaseCreateSuperUserCommand):
    """Override createsuperuser: bắt buộc nhập username hợp lệ và duy nhất."""

    help = "Tạo tài khoản siêu quản trị (superuser), bắt buộc nhập email và tên người dùng (username)."

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Khởi tạo phụ thuộc: service người dùng (kiểm tra trùng username)."""
        super().__init__(*args, **kwargs)
        self.user_service = UserService()

    def add_arguments(self, parser: CommandParser) -> None:
        """Bổ sung argument cho lệnh tạo superuser."""
        super().add_arguments(parser)
        # Đảm bảo argument --username có help text tiếng Việt rõ ràng
        if "--username" in parser._option_string_actions:
            parser._option_string_actions["--username"].help = "Tên người dùng duy nhất (bắt buộc)."
        parser.add_argument(
            "--full-name",
            dest="full_name",
            default="",
            help="Họ và tên đầy đủ (tùy chọn).",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        """Xử lý tạo superuser với kiểm tra username."""
        username = options.get("username")
        if username:
            username = username.strip()
            self._validate_username(username)
            options["username"] = username

        super().handle(*args, **options)

    def _validate_username(self, username: str) -> None:
        """Kiểm tra tính hợp lệ của username."""
        if not username:
            raise CommandError("Tên người dùng (username) không được để trống.")
        if len(username) > 150:
            raise CommandError("Tên người dùng không được vượt quá 150 ký tự.")
        if not re.match(r"^[\w.@+-]+$", username):
            raise CommandError("Tên người dùng chỉ được chứa chữ cái, số và các ký tự: @/./+/-/_.")
        if self.user_service.username_exists(username):
            raise CommandError(f"Tên người dùng '{username}' đã tồn tại trong hệ thống.")
