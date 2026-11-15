"""Response danh mục tài nguyên có ghi lịch sử (bộ lọc module.model)."""

from typing import Any

from rest_framework import serializers


class JournalResourceResponseSerializer(serializers.Serializer[Any]):
    """Một model kế thừa JournalTracker."""

    resource = serializers.CharField(help_text="`<module>.<model>`, giá trị gửi vào `?resource=`.")
    module = serializers.CharField(help_text="Mã module.")
    model = serializers.CharField(help_text="Tên model (chữ thường).")
    name = serializers.CharField(help_text="Tên hiển thị của model.")
