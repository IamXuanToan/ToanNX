"""Truy cập dữ liệu thư mục logic và số file còn tồn tại."""

import hashlib
from typing import Any

from django.db import connection
from django.db.models import Count, Q, QuerySet

from app.core.repositories.core_repository import CoreRepository
from app.modules.attachment.models.attachment_folder import AttachmentFolder


class AttachmentFolderRepository(CoreRepository[AttachmentFolder]):
    """Repository thư mục, không truy cập filesystem."""

    model = AttachmentFolder

    def get_queryset(self) -> QuerySet[AttachmentFolder]:
        """Nạp số file chưa xóa và người tạo trước khi serialize."""
        return (
            super()
            .get_queryset()
            .select_related("created_by")
            .annotate(file_count=Count("files", filter=Q(files__deleted_at__isnull=True)))
        )

    def lock_tree(self, owner_id: Any) -> None:
        """Tuần tự hóa thay đổi cây và gán file, kể cả cây đang rỗng."""
        key = int.from_bytes(
            hashlib.blake2b(str(owner_id).encode(), digest_size=8).digest(), "big", signed=True
        )
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(%s)", [key])

    def descendants(self, folder_id: Any) -> list[AttachmentFolder]:
        """Nạp toàn bộ hậu duệ còn sống theo thứ tự khóa ổn định."""
        return list(self.get_queryset().filter(ancestor_ids__contains=[folder_id]).order_by("pk"))

    def name_exists(self, owner_id: Any, name: str, parent_id: Any, exclude_id: Any = None) -> bool:
        """Tên đang dùng trong thư viện của một người, không phân biệt hoa thường."""
        queryset = AttachmentFolder.objects.alive().filter(
            created_by_id=owner_id, name__iexact=name, parent_id=parent_id
        )
        if exclude_id is not None:
            queryset = queryset.exclude(pk=exclude_id)
        return queryset.exists()
