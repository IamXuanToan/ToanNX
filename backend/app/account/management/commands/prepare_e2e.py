"""Lệnh `python manage.py prepare_e2e`: chuẩn bị database riêng cho E2E (Playwright gọi trước khi chạy).

Tạo database nếu chưa có, migrate (kèm đồng bộ quyền), bảo đảm superuser E2E. Chỉ chạy khi `DEBUG=True` và tên
database kết thúc bằng `_e2e`, để không bao giờ chạy nhầm lên database dev hay production.
"""

import os
from typing import Any

import psycopg
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError, CommandParser
from psycopg import sql

from app.account.services.account_seed_service import AccountSeedService

E2E_SUFFIX = "_e2e"


class Command(BaseCommand):
    """Chuẩn bị database E2E."""

    help = "Tạo database E2E (tên kết thúc bằng _e2e), migrate và tạo superuser E2E."

    def add_arguments(self, parser: CommandParser) -> None:
        """Tài khoản E2E.

        Args:
            parser: Parser của lệnh.
        """
        parser.add_argument(
            "--email", default=os.environ.get("E2E_EMAIL"), help="Email (mặc định E2E_EMAIL)."
        )
        parser.add_argument(
            "--password", default=os.environ.get("E2E_PASSWORD"), help="Mật khẩu (mặc định E2E_PASSWORD)."
        )
        parser.add_argument("--username", default="e2e_admin", help="Tên người dùng superuser E2E.")

    def handle(self, *args: Any, **options: Any) -> None:
        """Tạo database nếu cần, migrate, tạo superuser.

        Args:
            *args: Không dùng.
            **options: `email`, `password`, `username`.

        Raises:
            CommandError: Không phải local hoặc tên database không kết thúc bằng `_e2e`.
        """
        if not options["email"] or not options["password"]:
            raise CommandError(
                "Thiếu tài khoản E2E: truyền --email/--password hoặc đặt E2E_EMAIL/E2E_PASSWORD."
            )
        database = settings.DATABASES["default"]
        name = str(database["NAME"])
        if not settings.DEBUG or not name.endswith(E2E_SUFFIX):
            raise CommandError(
                f"prepare_e2e chỉ chạy local với DB_NAME kết thúc bằng {E2E_SUFFIX} (đang là {name})."
            )
        self._create_database(database, name)
        call_command("migrate", interactive=False, verbosity=0, stdout=self.stdout)
        user, _ = AccountSeedService().ensure_superuser(
            email=options["email"], username=options["username"], password=options["password"]
        )
        self.stdout.write(self.style.SUCCESS(f"Database {name} sẵn sàng, superuser {user.email}."))

    @staticmethod
    def _create_database(database: dict[str, Any], name: str) -> None:
        """Tạo database qua database bảo trì `postgres` nếu chưa có."""
        options = database.get("OPTIONS", {})
        port = int(database["PORT"]) if database.get("PORT") else 5432
        with psycopg.connect(
            dbname="postgres",
            user=database.get("USER"),
            password=database.get("PASSWORD"),
            host=database.get("HOST"),
            port=port,
            sslmode=options.get("sslmode", "prefer"),
            autocommit=True,
        ) as connection:
            exists = connection.execute("SELECT 1 FROM pg_database WHERE datname = %s", (name,)).fetchone()
            if not exists:
                connection.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(name)))
