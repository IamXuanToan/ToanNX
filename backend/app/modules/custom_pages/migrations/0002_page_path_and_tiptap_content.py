"""Đường dẫn giữa (seed `p`, `qr`), nội dung Tiptap JSON thay cho block, unique slug theo đường dẫn giữa."""

import uuid
from typing import Any

import django.db.models.deletion
import django.db.models.functions.text
from django.conf import settings
from django.db import migrations, models

SEED_PATHS = (("p", "Trang", "Trang cá nhân, giới thiệu, link-in-bio.", 0), ("qr", "Mã QR", "Trang chứa mã QR.", 1))


def _text(text: str) -> list[dict[str, Any]]:
    return [{"type": "text", "text": text}] if text else []


def _block_to_nodes(block_type: str, content: dict[str, Any]) -> list[dict[str, Any]]:
    """Đổi một block cũ sang node Tiptap tương ứng (dữ liệu dev, không có dữ liệu thật)."""
    if block_type == "HEADING":
        return [{"type": "heading", "attrs": {"level": content.get("level", 2)}, "content": _text(content.get("text", ""))}]
    if block_type == "TEXT":
        return [{"type": "paragraph", "content": _text(content.get("text", ""))}]
    if block_type == "IMAGE":
        return [{"type": "image", "attrs": {"src": "", "alt": content.get("alt", ""), "attachmentId": content.get("attachment_id")}}]
    if block_type == "BUTTON":
        return [{"type": "button", "attrs": {"label": content.get("label", ""), "href": content.get("url", "")}}]
    if block_type in ("LINK_LIST", "SOCIAL_LINKS"):
        key = "label" if block_type == "LINK_LIST" else "platform"
        items = [{"platform": item.get(key, ""), "url": item.get("url", "")} for item in content.get("items", [])]
        return [{"type": "socialLinks", "attrs": {"items": items}}]
    if block_type == "DIVIDER":
        return [{"type": "horizontalRule"}]
    return []  # QR_CODE: mã QR giờ là module riêng, chèn dưới dạng ảnh


def forwards(apps: Any, schema_editor: Any) -> None:
    page_path = apps.get_model("custom_pages", "PagePath")
    page = apps.get_model("custom_pages", "Page")
    page_block = apps.get_model("custom_pages", "PageBlock")
    paths = {
        segment: page_path.objects.create(segment=segment, name=name, description=description, position=position)
        for segment, name, description, position in SEED_PATHS
    }
    for item in page.objects.all():
        blocks = page_block.objects.filter(page_id=item.pk, deleted_at__isnull=True, is_visible=True).order_by("position")
        nodes = [node for block in blocks for node in _block_to_nodes(block.block_type, block.content or {})]
        item.path_id = paths["p"].pk
        item.content = {"type": "doc", "content": nodes or [{"type": "paragraph"}]}
        if item.status == "PUBLISHED":
            item.published_at = item.updated_at
        item.save(update_fields=["path", "content", "published_at"])


class Migration(migrations.Migration):
    dependencies = [
        ("custom_pages", "0001_initial"),
        ("attachment", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PagePath",
            fields=[
                ("id", models.UUIDField(db_comment="Khóa chính UUID", default=uuid.uuid4, editable=False, help_text="Định danh UUID do hệ thống sinh, không đổi.", primary_key=True, serialize=False, verbose_name="Mã định danh")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_comment="Thời điểm tạo bản ghi", help_text="Thời điểm bản ghi được tạo (tự động).", verbose_name="Thời điểm tạo")),
                ("updated_at", models.DateTimeField(auto_now=True, db_comment="Thời điểm cập nhật gần nhất", help_text="Thời điểm bản ghi được sửa gần nhất (tự động).", verbose_name="Thời điểm cập nhật")),
                ("deleted_at", models.DateTimeField(blank=True, db_comment="Thời điểm xóa mềm", help_text="Khác NULL nghĩa là bản ghi đã bị xóa mềm.", null=True, verbose_name="Thời điểm xóa mềm")),
                ("segment", models.CharField(db_comment="Đoạn URL giữa", help_text="1–32 ký tự a-z, 0-9, '-'; không trùng đoạn dành riêng.", max_length=32, verbose_name="Đoạn đường dẫn")),
                ("name", models.CharField(db_comment="Tên đường dẫn giữa", help_text="Tên hiển thị.", max_length=100, verbose_name="Tên")),
                ("description", models.CharField(blank=True, db_comment="Mô tả", help_text="Mô tả ngắn.", max_length=300, verbose_name="Mô tả")),
                ("is_active", models.BooleanField(db_comment="Cho phép tạo trang mới", default=True, help_text="Tắt thì không tạo được trang mới vào đường dẫn này; trang đang có vẫn chạy.", verbose_name="Bật")),
                ("position", models.PositiveSmallIntegerField(db_comment="Thứ tự hiển thị", default=0, help_text="Thứ tự trong ô chọn.", verbose_name="Thứ tự")),
                ("created_by", models.ForeignKey(blank=True, db_comment="Người tạo bản ghi", help_text="NULL nếu do hệ thống tạo (migration, lệnh quản trị).", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL, verbose_name="Người tạo")),
                ("deleted_by", models.ForeignKey(blank=True, db_comment="Người thực hiện xóa mềm", help_text="Người dùng thực hiện xóa mềm.", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL, verbose_name="Người xóa")),
                ("updated_by", models.ForeignKey(blank=True, db_comment="Người cập nhật gần nhất", help_text="Người dùng sửa bản ghi gần nhất; NULL nếu do hệ thống.", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL, verbose_name="Người cập nhật")),
            ],
            options={
                "verbose_name": "Đường dẫn giữa",
                "verbose_name_plural": "Đường dẫn giữa",
                "db_table": "custom_page_path",
                "ordering": ("position", "segment"),
                "constraints": [models.UniqueConstraint(django.db.models.functions.text.Lower("segment"), name="custom_page_path_segment_ci_unique")],
            },
        ),
        migrations.AddField(
            model_name="page",
            name="path",
            field=models.ForeignKey(db_comment="Đường dẫn giữa của trang", help_text="Đoạn URL giữa (`qr`, `p`...).", null=True, on_delete=django.db.models.deletion.PROTECT, related_name="pages", to="custom_pages.pagepath", verbose_name="Đường dẫn giữa"),
        ),
        migrations.AddField(
            model_name="page",
            name="content",
            field=models.JSONField(blank=True, db_comment="Nội dung Tiptap JSON", default=dict, help_text="Tài liệu Tiptap đã validate (chỉ node/mark trong danh sách cho phép).", verbose_name="Nội dung"),
        ),
        migrations.AddField(
            model_name="page",
            name="content_version",
            field=models.PositiveIntegerField(db_comment="Phiên bản nội dung", default=1, help_text="Tăng mỗi lần lưu nội dung; PATCH phải gửi đúng để không ghi đè lẫn nhau.", verbose_name="Phiên bản nội dung"),
        ),
        migrations.AddField(
            model_name="page",
            name="published_at",
            field=models.DateTimeField(blank=True, db_comment="Thời điểm công khai", help_text="Lần gần nhất chuyển sang PUBLISHED.", null=True, verbose_name="Công khai lúc"),
        ),
        migrations.RunPython(forwards, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="page",
            name="path",
            field=models.ForeignKey(db_comment="Đường dẫn giữa của trang", help_text="Đoạn URL giữa (`qr`, `p`...).", on_delete=django.db.models.deletion.PROTECT, related_name="pages", to="custom_pages.pagepath", verbose_name="Đường dẫn giữa"),
        ),
        migrations.AlterField(
            model_name="page",
            name="slug",
            field=models.CharField(db_comment="Slug URL trang", help_text="Đoạn cuối của URL công khai, unique trong cùng đường dẫn giữa.", max_length=64, verbose_name="Slug"),
        ),
        migrations.RemoveConstraint(model_name="page", name="custom_page_slug_ci_unique"),
        migrations.AddConstraint(
            model_name="page",
            constraint=models.UniqueConstraint(models.F("path"), django.db.models.functions.text.Lower("slug"), name="custom_page_path_slug_ci_unique"),
        ),
        migrations.AddConstraint(
            model_name="page",
            constraint=models.CheckConstraint(condition=models.Q(status__in=["DRAFT", "PUBLISHED", "UNPUBLISHED"]), name="custom_page_status_valid"),
        ),
        migrations.RemoveIndex(model_name="page", name="cp_owner_created_idx"),
        migrations.AddIndex(
            model_name="page",
            index=models.Index(condition=models.Q(deleted_at__isnull=True), fields=["owner", "-created_at"], name="cp_owner_created_alive_idx"),
        ),
        migrations.DeleteModel(name="PageBlock"),
    ]
