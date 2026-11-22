"""Response nhập giao dịch đã chọn."""

from rest_framework import serializers


class SepayImportResponseSerializer(serializers.Serializer[dict[str, int]]):
    """Số tạo mới / cập nhật / bỏ qua."""

    created = serializers.IntegerField(help_text="Tạo mới.")
    updated = serializers.IntegerField(help_text="Cập nhật (dòng CHANGED đã chọn).")
    skipped = serializers.IntegerField(help_text="Bỏ qua.")
