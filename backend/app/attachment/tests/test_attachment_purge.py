"""Dọn file vật lý: tệp đã xóa mềm quá hạn giữ và file mồ côi; file còn dùng thì giữ."""

import io
import os
from datetime import timedelta
from typing import Any

import pytest
import segno
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils import timezone

from app.attachment.models.attachment import Attachment
from app.attachment.services.attachment_service import AttachmentService
from app.attachment.tasks.purge_deleted_files import purge_deleted_files

pytestmark = pytest.mark.django_db


def _png() -> bytes:
    buffer = io.BytesIO()
    segno.make("purge").save(buffer, kind="png")
    return buffer.getvalue()


def _age(name: str, days: int) -> None:
    moment = (timezone.now() - timedelta(days=days)).timestamp()
    os.utime(default_storage.path(name), (moment, moment))


def test_purges_old_soft_deleted_files_and_keeps_rows(superuser: Any, settings: Any) -> None:
    settings.ATTACHMENT_PURGE_DAYS = 30
    service = AttachmentService()
    old = service.create_generated(superuser, _png(), "old.png")
    recent = service.create_generated(superuser, _png(), "recent.png")
    alive = service.create_generated(superuser, _png(), "alive.png")
    Attachment.objects.filter(pk=old.pk).update(deleted_at=timezone.now() - timedelta(days=31))
    Attachment.objects.filter(pk=recent.pk).update(deleted_at=timezone.now() - timedelta(days=5))

    assert purge_deleted_files() == 1
    old.refresh_from_db()
    assert old.purged_at is not None and not default_storage.exists(old.file.name)
    assert default_storage.exists(recent.file.name) and default_storage.exists(alive.file.name)
    assert purge_deleted_files() == 0  # đã dọn thì không dọn lại


def test_purges_old_orphan_files_only(superuser: Any, settings: Any) -> None:
    settings.ATTACHMENT_PURGE_DAYS = 30
    kept = AttachmentService().create_generated(superuser, _png(), "kept.png")
    old_orphan = default_storage.save("attachments/2020/01/orphan-old.png", ContentFile(b"x"))
    new_orphan = default_storage.save("attachments/2020/01/orphan-new.png", ContentFile(b"x"))
    _age(old_orphan, 40)
    _age(kept.file.name, 40)

    assert purge_deleted_files() == 1
    assert not default_storage.exists(old_orphan)
    assert default_storage.exists(new_orphan)
    assert default_storage.exists(kept.file.name)


def test_replaced_qr_image_becomes_orphan(superuser: Any, settings: Any) -> None:
    """Thay nội dung file (ảnh QR) giữ id; file cũ bị xóa khỏi storage ngay lập tức."""
    settings.ATTACHMENT_PURGE_DAYS = 30
    service = AttachmentService()
    attachment = service.create_generated(superuser, _png(), "qr.png")
    previous = attachment.file.name
    service.replace_content(superuser, attachment.pk, _png(), "qr-new.png")
    assert not default_storage.exists(previous)
