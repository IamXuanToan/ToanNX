"""Seed tiền tệ: VND (gốc, 0 số lẻ) và USD (2 số lẻ). Bỏ qua mã đã có."""

from typing import Any

from django.db import migrations

CURRENCIES = (
    {"code": "VND", "name": "Đồng Việt Nam", "symbol": "₫", "decimal_places": 0, "is_base": True, "position": 0},
    {"code": "USD", "name": "Đô la Mỹ", "symbol": "$", "decimal_places": 2, "is_base": False, "position": 1},
)


def seed(apps: Any, schema_editor: Any) -> None:
    """Tạo tiền tệ còn thiếu."""
    currency_model = apps.get_model("system", "Currency")
    for item in CURRENCIES:
        if not currency_model.objects.filter(code=item["code"]).exists():
            currency_model.objects.create(**item)


def unseed(apps: Any, schema_editor: Any) -> None:
    """Rollback: xóa tiền tệ seed."""
    apps.get_model("system", "Currency").objects.filter(code__in=[item["code"] for item in CURRENCIES]).delete()


class Migration(migrations.Migration):
    """Seed tiền tệ."""

    dependencies = [("system", "0009_currency_exchangerate_notification_and_more")]

    operations = [migrations.RunPython(seed, unseed)]
