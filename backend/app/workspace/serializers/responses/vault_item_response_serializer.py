"""Response Mục Két sắt Bí mật (tuyệt đối không trả `secret_encrypted` hay bản rõ)."""

from rest_framework import serializers

from app.workspace.models.vault_item import VaultItem


class VaultItemResponseSerializer(serializers.ModelSerializer[VaultItem]):
    """Thông tin mục két sắt che toàn bộ bí mật gốc; giải mã chỉ qua `/reveal`."""

    owner_email = serializers.CharField(source="owner.email", read_only=True, help_text="Email chủ sở hữu.")
    last_revealed_by_email = serializers.CharField(
        source="last_revealed_by.email",
        read_only=True,
        default=None,
        help_text="Email người mở xem lần cuối.",
    )

    class Meta:
        model = VaultItem
        fields = (
            "id",
            "owner_id",
            "owner_email",
            "title",
            "category",
            "username",
            "secret_last4",
            "url",
            "notes",
            "tags",
            "last_revealed_at",
            "last_revealed_by_id",
            "last_revealed_by_email",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields
