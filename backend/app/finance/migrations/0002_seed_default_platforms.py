"""Seed nền tảng + quy tắc mẫu (Facebook, YouTube, TikTok, Shopee) cho superuser đầu tiên.

Không tạo mốc khấu trừ (% thật do người dùng tự nhập). Chưa có superuser thì bỏ qua; người dùng khác bấm
"Tạo nền tảng mẫu" ở trang Nền tảng.
"""

from typing import Any

from django.db import migrations

PLATFORMS = (
    ("facebook", "Facebook", r"FACEBOOK|META\s*PLATFORMS"),
    ("youtube", "YouTube", r"YOUTUBE|GOOGLE\s*ASIA"),
    ("tiktok", "TikTok", r"TIKTOK|BYTEDANCE"),
    ("shopee", "Shopee", r"SHOPEE"),
)


def seed(apps: Any, schema_editor: Any) -> None:
    """Tạo nền tảng và quy tắc còn thiếu (theo mã)."""
    user_model = apps.get_model("system", "User")
    owner = user_model.objects.filter(is_superuser=True, deleted_at__isnull=True).order_by("created_at").first()
    currency = apps.get_model("system", "Currency").objects.filter(is_base=True).first()
    if owner is None or currency is None:
        return
    platform_model = apps.get_model("finance", "Platform")
    rule_model = apps.get_model("finance", "ClassificationRule")
    for code, name, pattern in PLATFORMS:
        if platform_model.objects.filter(owner=owner, code=code).exists():
            continue
        platform = platform_model.objects.create(owner=owner, code=code, name=name, default_currency=currency, created_by=owner)
        rule_model.objects.create(owner=owner, name=f"Nhận diện {name}", platform=platform, pattern=pattern, created_by=owner)


def unseed(apps: Any, schema_editor: Any) -> None:
    """Rollback: xóa nền tảng mẫu chưa có giao dịch."""
    apps.get_model("finance", "Platform").objects.filter(code__in=[code for code, _n, _p in PLATFORMS], incomes__isnull=True).delete()


class Migration(migrations.Migration):
    """Seed nền tảng mẫu."""

    dependencies = [("finance", "0001_initial"), ("system", "0010_seed_currencies")]

    operations = [migrations.RunPython(seed, unseed)]
