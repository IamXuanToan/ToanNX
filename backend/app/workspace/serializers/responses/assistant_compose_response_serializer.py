"""Response POST /api/v1/workspace/assistant/compose."""

from rest_framework import serializers


class AssistantComposeResponseSerializer(serializers.Serializer[dict[str, object]]):
    """Kết quả HTML chuẩn Tiptap do AI sinh ra."""

    html = serializers.CharField(help_text="Nội dung HTML sạch tương thích trực tiếp với Tiptap.")
    model_used = serializers.CharField(help_text="Model AI đã xử lý.")
    tokens_used = serializers.IntegerField(help_text="Số token đã tiêu thụ.")
    rag_sources = serializers.ListField(
        child=serializers.CharField(),
        help_text="Danh sách nguồn dữ liệu cá nhân đã tham khảo (nếu bật RAG).",
    )
