"""Seed vai trò hệ thống. Cấu hình (auto_grant) nằm trong DB, code không hardcode mã vai trò."""

from typing import Any

from django.db import migrations

SYSTEM_ROLES = (
    ("ADMIN", "Quản trị viên", "Toàn bộ quyền quản trị của các module đã cài.", "all"),
    ("VIEWER", "Người xem", "Chỉ có quyền đọc (*.read).", "read_only"),
)


def seed_system_roles(apps: Any, schema_editor: Any) -> None:
    """Tạo/cập nhật vai trò hệ thống; quyền được cấp bởi sync_iam theo auto_grant."""
    role_model = apps.get_model("iam", "Role")
    for code, name, description, auto_grant in SYSTEM_ROLES:
        role_model.objects.update_or_create(
            code=code,
            defaults={"name": name, "description": description, "is_system": True, "auto_grant": auto_grant},
        )


class Migration(migrations.Migration):
    dependencies = [
        ("iam", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_system_roles, migrations.RunPython.noop),
    ]
