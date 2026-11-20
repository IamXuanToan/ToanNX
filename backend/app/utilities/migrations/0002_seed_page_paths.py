"""Seed đường dẫn giữa mặc định `p` (trang) và `qr` (trang chứa mã QR)."""

from typing import Any

from django.db import migrations

SEED_PATHS = (
    ("p", "Trang", "Trang cá nhân, giới thiệu, link-in-bio.", 0),
    ("qr", "Mã QR", "Trang chứa mã QR.", 1),
)


def seed_page_paths(apps: Any, schema_editor: Any) -> None:
    """Tạo các đường dẫn giữa mặc định nếu chưa có (chạy lại an toàn).

    Args:
        apps: Registry model lịch sử của migration.
        schema_editor: Schema editor của Django (không dùng).
    """
    page_path = apps.get_model("utilities", "PagePath")
    for segment, name, description, position in SEED_PATHS:
        page_path.objects.get_or_create(
            segment=segment,
            defaults={"name": name, "description": description, "position": position},
        )


class Migration(migrations.Migration):
    dependencies = [("utilities", "0001_initial")]

    operations = [migrations.RunPython(seed_page_paths, migrations.RunPython.noop)]
