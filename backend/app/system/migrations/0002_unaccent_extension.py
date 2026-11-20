"""Bật extension `unaccent` của PostgreSQL: `?search=` tìm không dấu ("nguyen" khớp "Nguyễn").

Đặt ở module System vì đây là module nền luôn được cài; `unaccent` là extension "trusted" (PostgreSQL 13+)
nên chủ database tạo được, không cần superuser.
"""

from django.contrib.postgres.operations import UnaccentExtension
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("system", "0001_initial"),
    ]

    operations = [UnaccentExtension()]
