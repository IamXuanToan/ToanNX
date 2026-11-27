"""Response một mục lịch sử thay đổi (action `history` của CoreModelViewSet, API journal)."""

from typing import Any

from rest_framework import serializers


class CoreJournalEntryResponseSerializer(serializers.Serializer[Any]):
    """Một thay đổi của bản ghi; nguồn dữ liệu là recorder cấu hình ở `CORE_CHANGE_RECORDER`."""

    id = serializers.UUIDField(help_text="Id mục lịch sử.")
    created_at = serializers.DateTimeField(help_text="Thời điểm thay đổi.")
    action = serializers.CharField(help_text="CREATE, UPDATE, DELETE hoặc EVENT.")
    event = serializers.CharField(help_text="Mã sự kiện khi action = EVENT.")
    resource = serializers.CharField(help_text="`<module>.<model>`, ví dụ `utilities.shortlink`.")
    object_id = serializers.CharField(help_text="Id bản ghi.")
    object_label = serializers.CharField(help_text="Tên bản ghi lúc thay đổi.")
    actor_id = serializers.UUIDField(allow_null=True, help_text="Người thực hiện (null = hệ thống).")
    actor_label = serializers.CharField(help_text="Email người thực hiện lúc thay đổi.")
    actor_display_name = serializers.SerializerMethodField(
        help_text="Tên hiển thị người thực hiện theo chuẩn `fullname (username)` hoặc `username`."
    )
    changes = serializers.JSONField(help_text="`{field: [cũ, mới]}`; field ẩn là `***`.")
    request_id = serializers.CharField(help_text="Request id của thao tác (đối chiếu log).")

    def get_actor_display_name(self, obj: Any) -> str:
        """Lấy `actor.display_name` nếu tài khoản còn tồn tại, ngược lại fallback về `actor_label`."""
        actor = getattr(obj, "actor", None)
        if actor is not None:
            display = getattr(actor, "display_name", "")
            if isinstance(display, str) and display.strip():
                return display.strip()
        return str(getattr(obj, "actor_label", "") or "")
