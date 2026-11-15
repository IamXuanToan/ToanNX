"""Response một mục lịch sử thay đổi (action `history` của CoreModelViewSet, API journal)."""

from typing import Any

from rest_framework import serializers


class CoreJournalEntryResponseSerializer(serializers.Serializer[Any]):
    """Một thay đổi của bản ghi; nguồn dữ liệu là recorder cấu hình ở `CORE_CHANGE_RECORDER`."""

    id = serializers.UUIDField(help_text="Id mục lịch sử.")
    created_at = serializers.DateTimeField(help_text="Thời điểm thay đổi.")
    action = serializers.CharField(help_text="CREATE, UPDATE, DELETE hoặc EVENT.")
    event = serializers.CharField(help_text="Mã sự kiện khi action = EVENT.")
    resource = serializers.CharField(help_text="`<module>.<model>`, ví dụ `short_links.shortlink`.")
    object_id = serializers.CharField(help_text="Id bản ghi.")
    object_label = serializers.CharField(help_text="Tên bản ghi lúc thay đổi.")
    actor_id = serializers.UUIDField(allow_null=True, help_text="Người thực hiện (null = hệ thống).")
    actor_label = serializers.CharField(help_text="Email người thực hiện lúc thay đổi.")
    changes = serializers.JSONField(help_text="`{field: [cũ, mới]}`; field ẩn là `***`.")
