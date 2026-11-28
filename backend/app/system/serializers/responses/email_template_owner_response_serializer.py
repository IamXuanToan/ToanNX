"""Thông tin gọn của chủ sở hữu EmailTemplate."""

from rest_framework import serializers

from app.system.models.user import User


class EmailTemplateOwnerResponseSerializer(serializers.ModelSerializer[User]):
    """Thông tin định danh ngắn của chủ sở hữu mẫu email."""

    class Meta:
        """Khai báo model và trường trả về."""

        model = User
        fields = ("id", "username", "full_name", "email")
