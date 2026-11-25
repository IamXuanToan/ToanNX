"""Lệnh `python manage.py seed_test_accounts`: tạo bộ tài khoản mẫu theo từng vai trò để kiểm thử phân quyền.

Chỉ chạy khi `DEBUG=True`. Tạo lại được nhiều lần (idempotent).
"""

from typing import Any

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError, CommandParser

from app.system.services.account_seed_service import AccountSeedService

DEFAULT_PASSWORD = "Toannx@123"  # noqa: S105 - mật khẩu seed local, chặn khi DEBUG=False.

TEST_ACCOUNTS: list[dict[str, Any]] = [
    {
        "email": "admin@toannx.local",
        "username": "admin_test",
        "full_name": "Quản trị viên (ADMIN)",
        "is_staff": True,
        "roles": ["ADMIN"],
    },
    {
        "email": "finance.manager@toannx.local",
        "username": "fin_manager",
        "full_name": "Quản lý Tài chính (FINANCE_MANAGER)",
        "is_staff": True,
        "roles": ["FINANCE_MANAGER"],
    },
    {
        "email": "finance.viewer@toannx.local",
        "username": "fin_viewer",
        "full_name": "Chỉ xem Tài chính (FINANCE_VIEWER)",
        "is_staff": True,
        "roles": ["FINANCE_VIEWER"],
    },
    {
        "email": "finance.member@toannx.local",
        "username": "fin_member",
        "full_name": "Thành viên Tài chính (FINANCE_MEMBER)",
        "is_staff": False,
        "roles": ["FINANCE_MEMBER"],
    },
    {
        "email": "portal.member@toannx.local",
        "username": "portal_member",
        "full_name": "Thành viên Portal (FINANCE + UTILITIES + SYSTEM)",
        "is_staff": False,
        "roles": ["FINANCE_MEMBER", "UTILITIES_MEMBER", "SYSTEM_MEMBER"],
    },
]


class Command(BaseCommand):
    """Tạo bộ tài khoản mẫu theo vai trò để kiểm thử phân quyền Admin và Client Portal."""

    help = "Chuẩn hóa vai trò và tạo bộ tài khoản mẫu theo vai trò (chỉ chạy khi DEBUG=True)."

    def add_arguments(self, parser: CommandParser) -> None:
        """Tham số mật khẩu chung cho các tài khoản mẫu."""
        parser.add_argument("--password", default=DEFAULT_PASSWORD, help="Mật khẩu chung cho tài khoản mẫu.")

    def handle(self, *args: Any, **options: Any) -> None:
        """Đồng bộ vai trò, tạo các tài khoản mẫu và seed dữ liệu tài chính cho tài khoản thành viên."""
        if not settings.DEBUG:
            raise CommandError("seed_test_accounts chỉ được phép chạy khi DEBUG=True.")

        password = options["password"]
        call_command("sync_iam", stdout=self.stdout)
        call_command("seed_roles", stdout=self.stdout)

        seed_service = AccountSeedService()
        for spec in TEST_ACCOUNTS:
            user, created = seed_service.ensure_user_with_roles(
                email=spec["email"],
                username=spec["username"],
                password=password,
                full_name=spec["full_name"],
                is_staff=spec["is_staff"],
                role_codes=spec["roles"],
            )
            action = "Tạo mới" if created else "Cập nhật"
            roles_label = ", ".join(spec["roles"])
            self.stdout.write(f"✓ {action}: {user.email} | is_staff={user.is_staff} | {roles_label}")

        call_command("seed_finance", email="finance.member@toannx.local", stdout=self.stdout)
        self.stdout.write(self.style.SUCCESS(f"Hoàn tất seed tài khoản mẫu (mật khẩu: {password})."))
