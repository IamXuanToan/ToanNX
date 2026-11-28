"""Response xem trước EmailTemplate sau khi trộn biến."""

from rest_framework import serializers


class EmailTemplatePreviewResponseSerializer(serializers.Serializer):
    """Tiêu đề, HTML và text thuần sau khi trộn biến an toàn."""

    subject = serializers.CharField()
    html_body = serializers.CharField()
    text_body = serializers.CharField()
