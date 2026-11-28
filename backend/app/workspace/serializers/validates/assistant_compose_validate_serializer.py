"""Validate request POST /api/v1/workspace/assistant/compose."""

from rest_framework import serializers

from app.core.serializers.core_validate_serializer import CoreValidateSerializer


class AssistantComposeValidateSerializer(CoreValidateSerializer):
    """Kiểm tra đầu vào sinh/biên tập nội dung Tiptap bằng AI."""

    MODE_CHOICES = (
        ("generate", "Tạo nội dung mới"),
        ("rewrite", "Viết lại văn phong"),
        ("expand", "Mở rộng chi tiết"),
        ("summarize", "Tóm tắt ngắn gọn"),
        ("fix_grammar", "Sửa chính tả & ngữ pháp"),
    )

    prompt = serializers.CharField(max_length=2000, help_text="Yêu cầu viết hoặc chỉnh sửa nội dung.")
    mode = serializers.ChoiceField(
        choices=MODE_CHOICES,
        required=False,
        default="generate",
        help_text="Chế độ xử lý: generate, rewrite, expand, summarize, fix_grammar.",
    )
    selected_text = serializers.CharField(
        max_length=4000,
        required=False,
        allow_blank=True,
        default="",
        help_text="Đoạn văn bản đang được bôi đen trong Tiptap (tùy chọn).",
    )
    document_context = serializers.CharField(
        max_length=4000,
        required=False,
        allow_blank=True,
        default="",
        help_text="Ngữ cảnh xung quanh của tài liệu đang soạn (tùy chọn).",
    )
    use_personal_rag = serializers.BooleanField(
        required=False,
        default=True,
        help_text="Bật truy xuất dữ liệu cá nhân (RAG) theo quyền tài khoản.",
    )
